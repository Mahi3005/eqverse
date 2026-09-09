"""
EQverse - Database CLI Viewer
Quick utility to view database tables, users, battle sessions, and evaluations.

Usage:
  python view_db.py            # Overview of all tables & counts
  python view_db.py users      # View registered users & XP stats
  python view_db.py bosses     # View boss personas
  python view_db.py battles    # View recent battle sessions
  python view_db.py evals      # View post-battle EQ evaluations
"""

import sys
import os

# Load environment
from dotenv import load_dotenv
load_dotenv()

from app import create_app
from extensions import db
from models import User, Boss, BattleSession, BattleMessage, EQEvaluation, UserUnlock


def show_overview():
    print("=" * 60)
    print("           EQVERSE DATABASE OVERVIEW")
    print("=" * 60)
    print(f"  Users:           {User.query.count()}")
    print(f"  Boss Personas:   {Boss.query.count()}")
    print(f"  Battle Sessions: {BattleSession.query.count()}")
    print(f"  Battle Messages: {BattleMessage.query.count()}")
    print(f"  EQ Evaluations:  {EQEvaluation.query.count()}")
    print(f"  User Unlocks:    {UserUnlock.query.count()}")
    print("=" * 60)
    print("Run `python view_db.py <users|bosses|battles|evals>` for details.\n")


def show_users():
    users = User.query.all()
    print(f"\n--- Registered Users ({len(users)}) ---")
    if not users:
        print("  No users registered yet.")
        return
    for u in users:
        print(f"  ID:       {u.id}")
        print(f"  Username: {u.username}")
        print(f"  Email:    {u.email}")
        print(f"  XP:       {u.total_xp} | Won: {u.battles_won} | Lost: {u.battles_lost}")
        print(f"  Created:  {u.created_at}")
        print("-" * 40)


def show_bosses():
    bosses = Boss.query.all()
    print(f"\n--- Boss Personas ({len(bosses)}) ---")
    for b in bosses:
        stars = "*" * b.difficulty_stars
        print(f"  [{b.id}] {b.name} ({b.category.upper()}, {stars})")
        print(f"    Pattern:     {b.personality_pattern}")
        print(f"    Core Skill:  {b.core_skill}")
        print(f"    Unlock XP:   {b.unlock_xp_required}")
        print("-" * 40)


def show_battles():
    sessions = BattleSession.query.order_by(BattleSession.started_at.desc()).limit(15).all()
    print(f"\n--- Recent Battles ({len(sessions)}) ---")
    if not sessions:
        print("  No battle sessions recorded yet.")
        return
    for s in sessions:
        user = db.session.get(User, s.user_id)
        boss = db.session.get(Boss, s.boss_id)
        uname = user.username if user else s.user_id
        bname = boss.name if boss else s.boss_id
        print(f"  Session ID: {s.id}")
        print(f"  Player:     {uname} vs. {bname}")
        print(f"  Outcome:    {s.outcome} | Tension: {s.tension}/100 | Turns: {s.turns_count}/{s.max_turns}")
        print(f"  Started:    {s.started_at}")
        print("-" * 40)


def show_evaluations():
    evals = EQEvaluation.query.order_by(EQEvaluation.created_at.desc()).limit(10).all()
    print(f"\n--- Recent EQ Evaluations ({len(evals)}) ---")
    if not evals:
        print("  No evaluations recorded yet.")
        return
    for ev in evals:
        print(f"  Session ID:   {ev.session_id}")
        print(f"  Empathy:      {ev.empathy_score}/10 | Self-Regulation: {ev.self_regulation_score}/10")
        print(f"  Listening:    {ev.active_listening_score}/10 | Clarity: {ev.clarity_score}/10 | Boundaries: {ev.boundary_score}/10")
        print(f"  XP Awarded:   +{ev.xp_awarded} XP")
        print(f"  Coach Tip:    {ev.coach_tip}")
        print("-" * 40)


def main():
    app = create_app()
    with app.app_context():
        cmd = sys.argv[1].lower() if len(sys.argv) > 1 else 'overview'
        if cmd == 'users':
            show_users()
        elif cmd == 'bosses':
            show_bosses()
        elif cmd == 'battles':
            show_battles()
        elif cmd == 'evals':
            show_evaluations()
        else:
            show_overview()


if __name__ == '__main__':
    main()
