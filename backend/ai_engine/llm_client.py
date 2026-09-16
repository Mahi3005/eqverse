"""
EQverse - LLM Client
Handles all OpenAI API interactions for both roleplay and evaluation calls.
"""

import os
import json
import re
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize the OpenAI client safely
api_key = os.getenv('OPENAI_API_KEY') or 'mock-key-for-init'
client = OpenAI(api_key=api_key)
MODEL = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')


def _extract_json_from_response(text: str) -> dict:
    """
    Robustly extract JSON from LLM response text.
    Handles cases where the model wraps JSON in markdown code blocks or adds extra text.
    """
    # Try direct JSON parse first
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Try extracting from markdown code blocks
    code_block_pattern = r'```(?:json)?\s*\n?(.*?)\n?\s*```'
    matches = re.findall(code_block_pattern, text, re.DOTALL)
    if matches:
        try:
            return json.loads(matches[0].strip())
        except json.JSONDecodeError:
            pass

    # Try finding JSON object pattern in text
    json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
    matches = re.findall(json_pattern, text, re.DOTALL)
    for match in matches:
        try:
            return json.loads(match)
        except json.JSONDecodeError:
            continue

    # Fallback: return the raw text as a reply with neutral tension
    return {
        "reply": text.strip()[:500],
        "tension_delta": 0,
        "internal_thought": "Failed to parse structured response, using raw text"
    }


def get_roleplay_response(system_prompt: str, conversation_history: list[dict], current_tension: int) -> dict:
    """
    Call A: In-Character Roleplay Response
    
    Sends the boss persona system prompt and conversation history to generate
    an in-character response with a tension_delta value.
    
    Args:
        system_prompt: The boss persona's system prompt
        conversation_history: List of {"role": "user"/"assistant", "content": "..."} dicts
        current_tension: Current tension level (0-100) for context
        
    Returns:
        dict with keys: reply, tension_delta, internal_thought
    """
    # Enhance system prompt with current tension context
    enhanced_prompt = (
        f"{system_prompt}\n\n"
        f"CURRENT TENSION LEVEL: {current_tension}/100\n"
        f"- If tension is below 20: You should be noticeably calmer and more cooperative\n"
        f"- If tension is above 80: You should be at peak emotional intensity\n"
        f"- Adjust your emotional intensity proportionally to the tension level\n\n"
        f"Remember: Output ONLY valid JSON. No extra text before or after the JSON."
    )

    messages = [{"role": "system", "content": enhanced_prompt}]
    messages.extend(conversation_history)

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.85,
            max_tokens=300,
            response_format={"type": "json_object"},
        )

        raw_content = response.choices[0].message.content
        parsed = _extract_json_from_response(raw_content)

        # Validate and clamp tension_delta
        tension_delta = parsed.get('tension_delta', 0)
        if not isinstance(tension_delta, (int, float)):
            tension_delta = 0
        tension_delta = max(-20, min(20, int(tension_delta)))

        return {
            'reply': parsed.get('reply', 'I need a moment...'),
            'tension_delta': tension_delta,
            'internal_thought': parsed.get('internal_thought', ''),
        }

    except Exception as e:
        print(f"[LLM ERROR - Roleplay] {str(e)}")
        return {
            'reply': "I... I need to think about that for a moment.",
            'tension_delta': 0,
            'internal_thought': f'API Error: {str(e)}',
        }


def get_eq_evaluation(boss_name: str, boss_backstory: str, conversation_transcript: str) -> dict:
    """
    Call B: EQ Coach Evaluation (Post-Battle Analysis)
    
    Analyzes the full battle transcript and generates a structured EQ report card
    with scores, highlighted moments, and coaching tips.
    
    Args:
        boss_name: Name of the boss persona fought
        boss_backstory: Context/scenario description
        conversation_transcript: Full formatted transcript of the battle
        
    Returns:
        dict with scores, highlights, coach_tip, overall_summary, xp_awarded
    """
    evaluation_prompt = f"""You are an expert Emotional Intelligence (EQ) coach and communication analyst. 
You have just observed a real-time conflict resolution conversation between a user and a character named {boss_name}.

SCENARIO CONTEXT:
{boss_backstory}

FULL CONVERSATION TRANSCRIPT:
{conversation_transcript}

Analyze this conversation and provide a detailed EQ evaluation. Score each dimension from 1 to 10.
Consider what the user did well and where they could improve.

You MUST respond with ONLY valid JSON in exactly this format:
{{
    "empathy_score": <1-10>,
    "self_regulation_score": <1-10>,
    "active_listening_score": <1-10>,
    "clarity_score": <1-10>,
    "boundary_score": <1-10>,
    "highlight_moments": [
        {{
            "quote": "Exact quote from the user",
            "dimension": "Empathy" | "Self-Regulation" | "Active Listening" | "Clarity" | "Boundaries",
            "feedback": "Why this was effective or ineffective in resolving the conflict",
            "type": "positive" or "improvement",
            "better_alternative": "Suggested high-EQ phrasing if type is improvement, or null if positive"
        }}
    ],
    "coach_tip": "One specific, actionable tip for the user to improve in future conversations (2-3 sentences)",
    "overall_summary": "A 2-3 sentence summary of the user's overall EQ performance in this battle",
    "xp_awarded": <10-100 based on overall performance>
}}

SCORING GUIDE:
- Empathy: Did the user acknowledge and validate the other person's feelings?
- Self-Regulation: Did the user stay calm and avoid reactive/defensive responses?
- Active Listening: Did the user reflect back what was said and ask clarifying questions?
- Clarity: Did the user communicate their own needs and boundaries clearly?
- Boundary Setting: Did the user maintain healthy boundaries without being aggressive?

XP GUIDE:
- Excellent performance (mostly 8-10 scores): 70-100 XP
- Good performance (mostly 6-8 scores): 40-70 XP
- Needs improvement (mostly 3-6 scores): 15-40 XP
- Poor performance (mostly 1-3 scores): 10-15 XP

Provide 2 to 4 highlight moments. Include both positive moments and areas for improvement.
"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "system", "content": evaluation_prompt}],
            temperature=0.4,
            max_tokens=850,
            response_format={"type": "json_object"},
        )

        raw_content = response.choices[0].message.content
        parsed = _extract_json_from_response(raw_content)

        # Validate and clamp all scores to 1-10
        for score_key in ['empathy_score', 'self_regulation_score', 'active_listening_score',
                          'clarity_score', 'boundary_score']:
            val = parsed.get(score_key, 6)
            if not isinstance(val, (int, float)):
                val = 6
            parsed[score_key] = max(1, min(10, int(val)))

        # Validate XP
        xp = parsed.get('xp_awarded', 45)
        if not isinstance(xp, (int, float)):
            xp = 45
        parsed['xp_awarded'] = max(10, min(100, int(xp)))

        # Ensure highlight_moments is a valid list with fallbacks
        if not isinstance(parsed.get('highlight_moments'), list) or len(parsed.get('highlight_moments', [])) == 0:
            parsed['highlight_moments'] = _build_fallback_moments(conversation_transcript)

        return parsed

    except Exception as e:
        print(f"[LLM ERROR - Evaluation] {str(e)}")
        # If OpenAI key is missing or quota exceeded, perform dynamic heuristic NLP evaluation
        return _evaluate_via_heuristic_analysis(boss_name, conversation_transcript)


def _evaluate_via_heuristic_analysis(boss_name: str, transcript: str) -> dict:
    """
    Intelligent NLP conflict analyzer:
    Evaluates real user messages from the transcript dynamically, scoring
    actual communicative markers, extracting verbatim user quotes, and
    generating customized coaching critique.
    """
    user_quotes = []
    if transcript:
        for line in transcript.split('\n'):
            if line.strip().startswith('User:'):
                quote_text = line.replace('User:', '').strip()
                if len(quote_text) > 3:
                    user_quotes.append(quote_text)

    # If user sent no messages, return baseline
    if not user_quotes:
        return {
            'empathy_score': 5,
            'self_regulation_score': 5,
            'active_listening_score': 5,
            'clarity_score': 5,
            'boundary_score': 5,
            'highlight_moments': [
                {
                    'quote': 'Conflict concluded without active dialogue turns.',
                    'dimension': 'Active Listening',
                    'feedback': 'Engage in multi-turn dialogue to demonstrate empathy and explore mutual resolution.',
                    'type': 'improvement',
                    'better_alternative': 'I hear your frustration, and I want to understand what happened.',
                }
            ],
            'coach_tip': 'Begin conflicts by validating emotional intensity before attempting problem-solving.',
            'overall_summary': 'No dialogue turns recorded. Engage directly with counterpart to calibrate EQ metrics.',
            'xp_awarded': 20,
        }

    full_user_text = " ".join(user_quotes).lower()

    # Dynamic Scoring Heuristics
    # 1. Empathy
    empathy_score = 5
    empathy_hits = sum(1 for w in ['feel', 'sorry', 'understand', 'frustrat', 'hurt', 'valid', 'perspective', 'care', 'hear you', 'appreciate'] if w in full_user_text)
    empathy_score = min(10, max(3, empathy_score + empathy_hits))

    # 2. Active Listening
    listening_score = 5
    question_count = sum(q.count('?') for q in user_quotes)
    listening_hits = sum(1 for w in ['what', 'how', 'tell me', 'could you', 'help me understand', 'reflect', 'mean'] if w in full_user_text)
    listening_score = min(10, max(3, listening_score + question_count + (1 if listening_hits >= 2 else 0)))

    # 3. Self-Regulation
    regulation_score = 7
    trigger_words = ['calm down', 'crazy', 'shut up', 'stupid', 'your fault', 'overreacting', 'whatever', 'ridiculous', 'hate']
    trigger_hits = sum(1 for w in trigger_words if w in full_user_text)
    if trigger_hits > 0:
        regulation_score = max(3, regulation_score - trigger_hits * 2)
    elif len(user_quotes) >= 3:
        regulation_score = min(9, regulation_score + 1)

    # 4. Clarity
    clarity_score = 5
    clarity_hits = sum(1 for w in ['plan', 'agree', 'step', 'timeline', 'expect', 'together', 'specifically', 'need', 'tomorrow', 'focus'] if w in full_user_text)
    clarity_score = min(10, max(3, clarity_score + clarity_hits))

    # 5. Boundaries
    boundary_score = 5
    boundary_hits = sum(1 for w in ['boundary', 'cannot', 'will not', 'respect', 'standard', 'limit', 'honest', 'work together', 'let us'] if w in full_user_text)
    boundary_score = min(10, max(3, boundary_score + boundary_hits))

    # Identify best positive quote and growth quote
    moments = []
    best_quote = user_quotes[0]
    growth_quote = user_quotes[-1] if len(user_quotes) > 1 else user_quotes[0]

    for q in user_quotes:
        q_lower = q.lower()
        if any(w in q_lower for w in ['understand', 'sorry', 'collaborate', 'feel', 'help me', 'care', 'listen']):
            best_quote = q
            break

    moments.append({
        'quote': best_quote,
        'dimension': 'Active Listening' if '?' in best_quote or 'understand' in best_quote.lower() else 'Empathy',
        'feedback': f'Effectively acknowledged {boss_name}\'s psychological state without triggering an immediate defensive counter-strike.',
        'type': 'positive',
        'better_alternative': None,
    })

    if len(user_quotes) > 1:
        moments.append({
            'quote': growth_quote,
            'dimension': 'Boundary Setting' if 'boundary' in growth_quote.lower() else 'Clarity',
            'feedback': f'Good communicative effort, but framing could be more assertively anchored to disarm {boss_name}\'s resistance.',
            'type': 'improvement',
            'better_alternative': f"I understand where you are coming from. Let's agree on concrete next steps so both of us are aligned.",
        })

    avg_score = round((empathy_score + regulation_score + listening_score + clarity_score + boundary_score) / 5.0, 1)
    xp_awarded = int(min(100, max(25, avg_score * 8.5)))

    # Customized coaching tip & summary based on scores
    if empathy_score >= 8:
        tip = f"Your emotional validation with {boss_name} was exceptional. Keep practicing crisp boundary setting to avoid over-compromising."
        summary = f"Strong de-escalation performance against {boss_name}. You led with empathy and lowered tension effectively."
    elif listening_score <= 5:
        tip = f"Ask more open-ended questions like 'Help me understand...' to get {boss_name} to reveal underlying concerns."
        summary = f"Good composure, but incorporating more active inquiries will make {boss_name} feel truly heard."
    else:
        tip = f"Focus on mirroring {boss_name}'s emotion first, then pivot immediately to a collaborative, actionable proposal."
        summary = f"Solid conflict management throughout this session with {boss_name}. Continue refining clarity and assertive boundaries."

    return {
        'empathy_score': empathy_score,
        'self_regulation_score': regulation_score,
        'active_listening_score': listening_score,
        'clarity_score': clarity_score,
        'boundary_score': boundary_score,
        'highlight_moments': moments,
        'coach_tip': tip,
        'overall_summary': summary,
        'xp_awarded': xp_awarded,
    }


