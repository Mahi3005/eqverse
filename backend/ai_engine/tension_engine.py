"""
EQverse - Tension Engine
Core game mechanic: calculates, clamps, and evaluates tension progression.
"""


# ── Tension Constants ────────────────────────────────────────────────
TENSION_MIN = 0
TENSION_MAX = 100
TENSION_START = 50
TENSION_WIN_THRESHOLD = 15       # Below this = battle resolved (win)
TENSION_LOSE_THRESHOLD = 85      # Above this = battle escalated (loss)
MAX_TURNS = 10                   # Maximum turns before auto-evaluation


def calculate_new_tension(current_tension: int, tension_delta: int) -> int:
    """
    Apply tension_delta to current tension and clamp within bounds.
    
    Args:
        current_tension: Current tension level (0-100)
        tension_delta: Change from LLM response (-20 to +20)
        
    Returns:
        New clamped tension value
    """
    new_tension = current_tension + tension_delta
    return max(TENSION_MIN, min(TENSION_MAX, new_tension))


def check_battle_outcome(tension: int, turns_count: int) -> str:
    """
    Determine if the battle has reached a terminal state.
    
    Args:
        tension: Current tension level after latest turn
        turns_count: Total turns elapsed (user messages only)
        
    Returns:
        'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED' | 'PARTIAL'
    """
    if tension <= TENSION_WIN_THRESHOLD:
        return 'RESOLVED'
    
    if tension >= TENSION_LOSE_THRESHOLD:
        return 'ESCALATED'
    
    if turns_count >= MAX_TURNS:
        # Battle ended by turn limit — evaluate based on final tension
        if tension <= 35:
            return 'RESOLVED'
        elif tension <= 60:
            return 'PARTIAL'
        else:
            return 'ESCALATED'
    
    return 'IN_PROGRESS'


def get_tension_label(tension: int) -> str:
    """
    Get a human-readable label for the current tension level.
    Used for UI display and accessibility.
    """
    if tension <= 15:
        return 'Calm & Resolved'
    elif tension <= 30:
        return 'Relaxed'
    elif tension <= 45:
        return 'Slightly Tense'
    elif tension <= 60:
        return 'Tense'
    elif tension <= 75:
        return 'Very Tense'
    elif tension <= 85:
        return 'Critical'
    else:
        return 'Escalated!'


def get_tension_color(tension: int) -> str:
    """
    Get a hex color representing the current tension level.
    Green (calm) → Amber (tense) → Red (escalated).
    """
    if tension <= 25:
        return '#10b981'   # Emerald green
    elif tension <= 45:
        return '#22d3ee'   # Cyan
    elif tension <= 60:
        return '#f59e0b'   # Amber
    elif tension <= 75:
        return '#f97316'   # Orange
    else:
        return '#ef4444'   # Red
