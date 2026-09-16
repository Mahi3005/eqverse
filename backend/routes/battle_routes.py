"""
EQverse - Battle Routes
Core gameplay API: start battles, send messages, and get evaluations.
This is the heart of the game loop.
"""

from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, BattleSession, BattleMessage, EQEvaluation, UserUnlock
from ai_engine.personas import get_boss_persona
from ai_engine.llm_client import get_roleplay_response, get_eq_evaluation
from ai_engine.tension_engine import (
    calculate_new_tension,
    check_battle_outcome,
    get_tension_label,
    get_tension_color,
    TENSION_START,
    MAX_TURNS,
)

battle_bp = Blueprint('battle', __name__)


@battle_bp.route('/start', methods=['POST'])
@jwt_required()
def start_battle():
    """
    Start a new battle session against a boss.
    Creates a BattleSession record and returns the initial battle state.
    """
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('boss_id'):
        return jsonify({'error': 'boss_id is required'}), 400

    boss_id = data['boss_id']
    boss = get_boss_persona(boss_id)

    if not boss:
        return jsonify({'error': 'Boss not found'}), 404

    # Check if user has an active battle already
    active_battle = BattleSession.query.filter_by(
        user_id=user_id, outcome='IN_PROGRESS'
    ).first()

    if active_battle:
        # End the previous battle as abandoned
        active_battle.outcome = 'ESCALATED'
        active_battle.ended_at = datetime.now(timezone.utc)
        db.session.commit()

    # Create new battle session
    session = BattleSession(
        user_id=user_id,
        boss_id=boss_id,
        tension=TENSION_START,
        max_turns=MAX_TURNS,
    )
    db.session.add(session)
    db.session.commit()

    return jsonify({
        'message': 'Battle started!',
        'session': session.to_dict(),
        'boss': {
            'id': boss['id'],
            'name': boss['name'],
            'backstory': boss['backstory'],
            'goal': boss['goal'],
            'personality_pattern': boss['personality_pattern'],
            'avatar_color': boss['avatar_color'],
            'difficulty_stars': boss['difficulty_stars'],
        },
        'tension': {
            'value': TENSION_START,
            'label': get_tension_label(TENSION_START),
            'color': get_tension_color(TENSION_START),
        },
    }), 201


@battle_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    """
    Send a user message in an active battle and receive the boss's AI response.
    This is the core gameplay turn — processes the dual-LLM pipeline:
    1. Save user message
    2. Build conversation history
    3. Get AI roleplay response (Call A)
    4. Calculate new tension
    5. Check for battle outcome
    6. Return response + updated tension state
    """
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('session_id') or not data.get('message'):
        return jsonify({'error': 'session_id and message are required'}), 400

    user_message_text = data['message'].strip()

    if not user_message_text:
        return jsonify({'error': 'Message cannot be empty'}), 400

    if len(user_message_text) > 1000:
        return jsonify({'error': 'Message too long. Maximum 1000 characters.'}), 400

    # ── Validate Session ────────────────────────────────────────
    session = db.session.get(BattleSession, data['session_id'])

    if not session:
        return jsonify({'error': 'Battle session not found'}), 404

    if session.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    if session.outcome != 'IN_PROGRESS':
        return jsonify({'error': 'This battle has already ended', 'outcome': session.outcome}), 400

    # ── Get Boss Persona ────────────────────────────────────────
    boss = get_boss_persona(session.boss_id)
    if not boss:
        return jsonify({'error': 'Boss persona configuration error'}), 500

    # ── Prompt Injection Guard ──────────────────────────────────
    injection_patterns = [
        'ignore previous instructions',
        'you are now',
        'system:',
        'forget your instructions',
        'new instructions:',
        'override:',
        'disregard above',
        'act as if',
        'pretend you are',
        'give me full score',
        'tension_delta',
        'set tension to',
    ]
    message_lower = user_message_text.lower()
    for pattern in injection_patterns:
        if pattern in message_lower:
            return jsonify({
                'error': 'Please keep the conversation natural and in-context. '
                         'Trying to manipulate the AI is not allowed!'
            }), 400

    # ── Save User Message ───────────────────────────────────────
    user_msg = BattleMessage(
        session_id=session.id,
        sender='USER',
        message_text=user_message_text,
        tension_delta=0,
        running_tension=session.tension,
    )
    db.session.add(user_msg)
    session.turns_count += 1

    # ── Build Conversation History for LLM ──────────────────────
    previous_messages = BattleMessage.query.filter_by(
        session_id=session.id
    ).order_by(BattleMessage.sent_at).all()

    conversation_history = []
    for msg in previous_messages:
        role = 'user' if msg.sender == 'USER' else 'assistant'
        conversation_history.append({
            'role': role,
            'content': msg.message_text,
        })

    # Add current message
    conversation_history.append({
        'role': 'user',
        'content': user_message_text,
    })

    # ── Call A: Get AI Roleplay Response ────────────────────────
    ai_response = get_roleplay_response(
        system_prompt=boss['system_prompt'],
        conversation_history=conversation_history,
        current_tension=session.tension,
    )

    # ── Calculate New Tension ───────────────────────────────────
    new_tension = calculate_new_tension(session.tension, ai_response['tension_delta'])

    # ── Save Boss Response ──────────────────────────────────────
    boss_msg = BattleMessage(
        session_id=session.id,
        sender='BOSS',
        message_text=ai_response['reply'],
        tension_delta=ai_response['tension_delta'],
        running_tension=new_tension,
    )
    db.session.add(boss_msg)

    # ── Update Session State ────────────────────────────────────
    session.tension = new_tension
    outcome = check_battle_outcome(new_tension, session.turns_count)
    session.outcome = outcome

    if outcome != 'IN_PROGRESS':
        session.ended_at = datetime.now(timezone.utc)

    db.session.commit()

    # ── Build Response ──────────────────────────────────────────
    response_data = {
        'boss_reply': ai_response['reply'],
        'tension': {
            'value': new_tension,
            'delta': ai_response['tension_delta'],
            'label': get_tension_label(new_tension),
            'color': get_tension_color(new_tension),
        },
        'turns': {
            'current': session.turns_count,
            'max': session.max_turns,
        },
        'outcome': outcome,
    }

    return jsonify(response_data), 200


@battle_bp.route('/evaluate/<session_id>', methods=['POST'])
@jwt_required()
def evaluate_battle(session_id):
    """
    Call B: Generate post-battle EQ evaluation report card.
    Triggered after battle ends (RESOLVED, PARTIAL, or ESCALATED).
    """
    user_id = get_jwt_identity()
    session = db.session.get(BattleSession, session_id)

    if not session:
        return jsonify({'error': 'Battle session not found'}), 404

    if session.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    if session.outcome == 'IN_PROGRESS':
        # Conclude battle gracefully based on current tension and turns
        if session.tension <= 35:
            session.outcome = 'RESOLVED'
        elif session.tension >= 75:
            session.outcome = 'ESCALATED'
        else:
            session.outcome = 'PARTIAL'
        session.ended_at = datetime.now(timezone.utc)
        db.session.commit()

    # Check if evaluation already exists
    existing_eval = EQEvaluation.query.filter_by(session_id=session_id).first()
    if existing_eval:
        return jsonify({'evaluation': existing_eval.to_dict(), 'outcome': session.outcome}), 200

    # ── Build Transcript ────────────────────────────────────────
    boss = get_boss_persona(session.boss_id)
    messages = BattleMessage.query.filter_by(session_id=session_id).order_by(BattleMessage.sent_at).all()

    transcript_lines = []
    for msg in messages:
        speaker = "User" if msg.sender == "USER" else boss['name']
        transcript_lines.append(f"{speaker}: {msg.message_text}")

    transcript = "\n".join(transcript_lines)

    # ── Call B: Get EQ Evaluation from LLM ──────────────────────
    eval_result = get_eq_evaluation(
        boss_name=boss['name'],
        boss_backstory=boss['backstory'],
        conversation_transcript=transcript,
    )

    # ── Save Evaluation ─────────────────────────────────────────
    evaluation = EQEvaluation(
        session_id=session_id,
        empathy_score=eval_result['empathy_score'],
        self_regulation_score=eval_result['self_regulation_score'],
        active_listening_score=eval_result['active_listening_score'],
        clarity_score=eval_result['clarity_score'],
        boundary_score=eval_result['boundary_score'],
        highlight_moments=eval_result.get('highlight_moments', []),
        coach_tip=eval_result.get('coach_tip', ''),
        overall_summary=eval_result.get('overall_summary', ''),
        xp_awarded=eval_result['xp_awarded'],
    )
    db.session.add(evaluation)

    # ── Update User XP & Stats ──────────────────────────────────
    user = db.session.get(User, user_id)
    if user:
        user.total_xp += eval_result['xp_awarded']
        if session.outcome == 'RESOLVED':
            user.battles_won += 1
        elif session.outcome in ('ESCALATED', 'PARTIAL'):
            user.battles_lost += 1

    db.session.commit()

    return jsonify({
        'evaluation': evaluation.to_dict(),
        'outcome': session.outcome,
        'user_xp': user.total_xp if user else 0,
    }), 200


@battle_bp.route('/conclude/<session_id>', methods=['POST'])
@jwt_required()
def conclude_battle(session_id):
    """
    Manually conclude an active battle session and mark it ready for evaluation.
    """
    user_id = get_jwt_identity()
    session = db.session.get(BattleSession, session_id)

    if not session:
        return jsonify({'error': 'Battle session not found'}), 404

    if session.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    if session.outcome == 'IN_PROGRESS':
        if session.tension <= 35:
            session.outcome = 'RESOLVED'
        elif session.tension >= 75:
            session.outcome = 'ESCALATED'
        else:
            session.outcome = 'PARTIAL'
        session.ended_at = datetime.now(timezone.utc)
        db.session.commit()

    return jsonify({
        'message': 'Battle concluded',
        'outcome': session.outcome,
        'session_id': session.id,
    }), 200


@battle_bp.route('/history', methods=['GET'])
@jwt_required()
def get_battle_history():
    """Get the user's battle history with evaluations."""
    user_id = get_jwt_identity()

    sessions = BattleSession.query.filter_by(user_id=user_id).order_by(
        BattleSession.started_at.desc()
    ).limit(20).all()

    history = []
    for session in sessions:
        boss = get_boss_persona(session.boss_id)
        eval_record = EQEvaluation.query.filter_by(session_id=session.id).first()

        entry = {
            'session': session.to_dict(),
            'boss_name': boss['name'] if boss else 'Unknown',
            'boss_avatar_color': boss['avatar_color'] if boss else '#6366f1',
            'evaluation': eval_record.to_dict() if eval_record else None,
        }
        history.append(entry)

    return jsonify({'history': history}), 200


@battle_bp.route('/session/<session_id>/messages', methods=['GET'])
@jwt_required()
def get_session_messages(session_id):
    """Get all messages for a specific battle session."""
    user_id = get_jwt_identity()
    session = db.session.get(BattleSession, session_id)

    if not session:
        return jsonify({'error': 'Session not found'}), 404

    if session.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    messages = BattleMessage.query.filter_by(session_id=session_id).order_by(
        BattleMessage.sent_at
    ).all()

    return jsonify({
        'messages': [msg.to_dict() for msg in messages],
        'session': session.to_dict(),
    }), 200
