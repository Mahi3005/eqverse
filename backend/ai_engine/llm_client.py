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
            "feedback": "Why this was effective or ineffective",
            "type": "positive" or "improvement"
        }},
        {{
            "quote": "Another quote from the user",
            "feedback": "Analysis of this moment",
            "type": "positive" or "improvement"
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

Provide at least 2 and at most 4 highlight moments. Include both positive moments and areas for improvement.
"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "system", "content": evaluation_prompt}],
            temperature=0.4,
            max_tokens=800,
            response_format={"type": "json_object"},
        )

        raw_content = response.choices[0].message.content
        parsed = _extract_json_from_response(raw_content)

        # Validate and clamp all scores to 1-10
        for score_key in ['empathy_score', 'self_regulation_score', 'active_listening_score',
                          'clarity_score', 'boundary_score']:
            val = parsed.get(score_key, 5)
            if not isinstance(val, (int, float)):
                val = 5
            parsed[score_key] = max(1, min(10, int(val)))

        # Validate XP
        xp = parsed.get('xp_awarded', 25)
        if not isinstance(xp, (int, float)):
            xp = 25
        parsed['xp_awarded'] = max(10, min(100, int(xp)))

        # Ensure highlight_moments is a list
        if not isinstance(parsed.get('highlight_moments'), list):
            parsed['highlight_moments'] = []

        return parsed

    except Exception as e:
        print(f"[LLM ERROR - Evaluation] {str(e)}")
        return {
            'empathy_score': 5,
            'self_regulation_score': 5,
            'active_listening_score': 5,
            'clarity_score': 5,
            'boundary_score': 5,
            'highlight_moments': [],
            'coach_tip': 'Unable to generate detailed feedback at this time. Keep practicing!',
            'overall_summary': 'Evaluation could not be completed due to a technical issue.',
            'xp_awarded': 25,
        }
