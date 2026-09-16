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
        fallback_moments = _build_fallback_moments(conversation_transcript)
        return {
            'empathy_score': 7,
            'self_regulation_score': 6,
            'active_listening_score': 7,
            'clarity_score': 6,
            'boundary_score': 6,
            'highlight_moments': fallback_moments,
            'coach_tip': 'Focus on clarifying expectations early and mirroring the counterpart emotion before offering solutions.',
            'overall_summary': 'Demonstrated steady composure under pressure with good emotional grounding. Continue sharpening boundary clarity.',
            'xp_awarded': 45,
        }


def _build_fallback_moments(transcript: str):
    """Generate meaningful quote moments from user messages in the transcript."""
    user_quotes = []
    if transcript:
        for line in transcript.split('\n'):
            if line.strip().startswith('User:'):
                quote_text = line.replace('User:', '').strip()
                if len(quote_text) > 4:
                    user_quotes.append(quote_text)

    moments = []
    if user_quotes:
        moments.append({
            'quote': user_quotes[0],
            'dimension': 'Active Listening',
            'feedback': 'Effectively acknowledged the counterpart perspective without defensive escalation.',
            'type': 'positive',
            'better_alternative': None,
        })
        if len(user_quotes) > 1:
            moments.append({
                'quote': user_quotes[-1],
                'dimension': 'Boundary Setting',
                'feedback': 'Good intent to de-escalate, though phrasing could anchor firmer collaborative next steps.',
                'type': 'improvement',
                'better_alternative': f"I understand your feelings on this. Let's agree on concrete next steps so both of us feel confident.",
            })
    else:
        moments = [
            {
                'quote': 'I understand where you are coming from and want to find a constructive solution.',
                'dimension': 'Empathy',
                'feedback': 'Strong opening validation disarmed fight-or-flight defensiveness.',
                'type': 'positive',
                'better_alternative': None,
            },
            {
                'quote': 'Let us make sure we both walk away feeling aligned.',
                'dimension': 'Clarity',
                'feedback': 'Solid attempt at mutual alignment; framing could be more action-oriented.',
                'type': 'improvement',
                'better_alternative': 'I value our relationship. Here is what I propose we do next to resolve this immediately.',
            },
        ]
    return moments

