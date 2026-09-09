"""
EQverse - Database Seeder
Populates the bosses table with all 6 persona definitions.
Run once after database creation: python seed_bosses.py
"""

from extensions import db
from models import Boss
from ai_engine.personas import BOSS_PERSONAS


def populate_bosses():
    """Populate boss personas into the database assuming active app context."""
    Boss.query.delete()

    for boss_id, boss_data in BOSS_PERSONAS.items():
        boss = Boss(
            id=boss_data['id'],
            name=boss_data['name'],
            category=boss_data['category'],
            difficulty_stars=boss_data['difficulty_stars'],
            personality_pattern=boss_data['personality_pattern'],
            backstory=boss_data['backstory'],
            goal=boss_data['goal'],
            core_skill=boss_data['core_skill'],
            system_prompt=boss_data['system_prompt'],
            avatar_color=boss_data['avatar_color'],
            unlock_xp_required=boss_data['unlock_xp_required'],
        )
        db.session.add(boss)
        stars = "*" * boss.difficulty_stars
        print(f"  [+] Added boss: {boss.name} ({boss.category}, {stars})")

    db.session.commit()
    print(f"\n[OK] Successfully seeded {len(BOSS_PERSONAS)} bosses into the database!")


def seed_bosses():
    """Entry point for standalone execution."""
    from app import create_app
    app = create_app()
    with app.app_context():
        populate_bosses()


if __name__ == '__main__':
    seed_bosses()
