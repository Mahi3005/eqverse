"""
EQverse - Boss Routes
Handles boss listing, details, and unlock status.
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from ai_engine.personas import get_all_bosses_metadata, get_boss_persona
from models import UserUnlock, User

boss_bp = Blueprint('bosses', __name__)


@boss_bp.route('/', methods=['GET'])
@jwt_required()
def list_bosses():
    """
    Get all bosses with unlock status for the current user.
    Returns boss metadata (without system prompts) and whether each boss is unlocked.
    """
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    bosses = get_all_bosses_metadata()

    # Get user's unlocked boss IDs
    unlocked_ids = {
        unlock.boss_id for unlock in UserUnlock.query.filter_by(user_id=user_id).all()
    }

    # Mark unlock status — bosses with 0 XP requirement are always unlocked
    for boss in bosses:
        if boss['unlock_xp_required'] == 0:
            boss['is_unlocked'] = True
        else:
            boss['is_unlocked'] = (
                boss['id'] in unlocked_ids or
                user.total_xp >= boss['unlock_xp_required']
            )

    return jsonify({'bosses': bosses}), 200


@boss_bp.route('/<boss_id>', methods=['GET'])
@jwt_required()
def get_boss_details(boss_id):
    """
    Get detailed info for a specific boss (without system prompt).
    """
    boss = get_boss_persona(boss_id)

    if not boss:
        return jsonify({'error': 'Boss not found'}), 404

    # Return metadata only — never expose system prompt to frontend
    return jsonify({
        'boss': {
            'id': boss['id'],
            'name': boss['name'],
            'category': boss['category'],
            'difficulty_stars': boss['difficulty_stars'],
            'personality_pattern': boss['personality_pattern'],
            'backstory': boss['backstory'],
            'goal': boss['goal'],
            'core_skill': boss['core_skill'],
            'avatar_color': boss['avatar_color'],
            'unlock_xp_required': boss['unlock_xp_required'],
        }
    }), 200
