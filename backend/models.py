"""
EQverse - Database Models
All SQLAlchemy ORM models for MySQL database.
"""

import uuid
from datetime import datetime, timezone
from extensions import db


def generate_uuid():
    """Generate a UUID string for primary keys."""
    return str(uuid.uuid4())


class User(db.Model):
    """User account model for authentication and progression tracking."""
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    total_xp = db.Column(db.Integer, default=0)
    battles_won = db.Column(db.Integer, default=0)
    battles_lost = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    battle_sessions = db.relationship('BattleSession', backref='user', lazy='dynamic')
    unlocks = db.relationship('UserUnlock', backref='user', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'total_xp': self.total_xp,
            'battles_won': self.battles_won,
            'battles_lost': self.battles_lost,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Boss(db.Model):
    """AI Boss persona model - the opponents users battle against."""
    __tablename__ = 'bosses'

    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # workplace, family, friendship, romantic
    difficulty_stars = db.Column(db.Integer, nullable=False)  # 1, 2, or 3
    personality_pattern = db.Column(db.String(255), nullable=False)
    backstory = db.Column(db.Text, nullable=False)
    goal = db.Column(db.Text, nullable=False)
    core_skill = db.Column(db.String(255), nullable=False)
    system_prompt = db.Column(db.Text, nullable=False)
    avatar_color = db.Column(db.String(7), default='#6366f1')  # Hex color for UI
    unlock_xp_required = db.Column(db.Integer, default=0)

    # Relationships
    battle_sessions = db.relationship('BattleSession', backref='boss', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'difficulty_stars': self.difficulty_stars,
            'personality_pattern': self.personality_pattern,
            'backstory': self.backstory,
            'goal': self.goal,
            'core_skill': self.core_skill,
            'avatar_color': self.avatar_color,
            'unlock_xp_required': self.unlock_xp_required,
        }


class BattleSession(db.Model):
    """A single battle session between a user and an AI boss."""
    __tablename__ = 'battle_sessions'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    boss_id = db.Column(db.String(50), db.ForeignKey('bosses.id'), nullable=False, index=True)
    outcome = db.Column(db.String(20), default='IN_PROGRESS')  # IN_PROGRESS, RESOLVED, PARTIAL, ESCALATED
    tension = db.Column(db.Integer, default=50)  # Current tension level (0-100)
    turns_count = db.Column(db.Integer, default=0)
    max_turns = db.Column(db.Integer, default=10)
    started_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    messages = db.relationship('BattleMessage', backref='session', lazy='dynamic', order_by='BattleMessage.sent_at')
    evaluation = db.relationship('EQEvaluation', backref='session', uselist=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'boss_id': self.boss_id,
            'outcome': self.outcome,
            'tension': self.tension,
            'turns_count': self.turns_count,
            'max_turns': self.max_turns,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'ended_at': self.ended_at.isoformat() if self.ended_at else None,
        }


class BattleMessage(db.Model):
    """Individual messages exchanged during a battle session."""
    __tablename__ = 'battle_messages'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    session_id = db.Column(db.String(36), db.ForeignKey('battle_sessions.id'), nullable=False, index=True)
    sender = db.Column(db.String(10), nullable=False)  # USER or BOSS
    message_text = db.Column(db.Text, nullable=False)
    tension_delta = db.Column(db.Integer, default=0)  # Change in tension (-20 to +20)
    running_tension = db.Column(db.Integer, default=50)  # Tension after this message
    sent_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'sender': self.sender,
            'message_text': self.message_text,
            'tension_delta': self.tension_delta,
            'running_tension': self.running_tension,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
        }


class EQEvaluation(db.Model):
    """Post-battle EQ evaluation report card generated by the AI Coach."""
    __tablename__ = 'eq_evaluations'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    session_id = db.Column(db.String(36), db.ForeignKey('battle_sessions.id'), nullable=False, unique=True)
    empathy_score = db.Column(db.Integer, default=0)  # 1-10
    self_regulation_score = db.Column(db.Integer, default=0)  # 1-10
    active_listening_score = db.Column(db.Integer, default=0)  # 1-10
    clarity_score = db.Column(db.Integer, default=0)  # 1-10
    boundary_score = db.Column(db.Integer, default=0)  # 1-10
    highlight_moments = db.Column(db.JSON, nullable=True)  # Array of {quote, feedback, type}
    coach_tip = db.Column(db.Text, nullable=True)
    overall_summary = db.Column(db.Text, nullable=True)
    xp_awarded = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'empathy_score': self.empathy_score,
            'self_regulation_score': self.self_regulation_score,
            'active_listening_score': self.active_listening_score,
            'clarity_score': self.clarity_score,
            'boundary_score': self.boundary_score,
            'highlight_moments': self.highlight_moments,
            'coach_tip': self.coach_tip,
            'overall_summary': self.overall_summary,
            'xp_awarded': self.xp_awarded,
        }


class UserUnlock(db.Model):
    """Tracks which bosses a user has unlocked through XP progression."""
    __tablename__ = 'user_unlocks'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    boss_id = db.Column(db.String(50), db.ForeignKey('bosses.id'), nullable=False)
    unlocked_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint('user_id', 'boss_id', name='uq_user_boss_unlock'),
    )
