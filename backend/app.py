"""
EQverse - AI Roleplay Arena Backend
Main Flask Application Entry Point
"""

import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from extensions import db, jwt


def create_app():
    """Application factory pattern for Flask."""
    app = Flask(__name__)

    # ── Core Configuration ──────────────────────────────────
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret')

    # ── Database Configuration ──────────────────────────────
    db_url = os.getenv('DATABASE_URL')
    if db_url:
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    else:
        db_type = os.getenv('DB_TYPE', 'sqlite').lower()
        if db_type == 'sqlite':
            db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'eqverse.db')
            app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
        else:
            db_user = os.getenv('DB_USER', 'root')
            db_password = os.getenv('DB_PASSWORD', '')
            db_host = os.getenv('DB_HOST', 'localhost')
            db_port = os.getenv('DB_PORT', '3306')
            db_name = os.getenv('DB_NAME', 'eqverse')
            app.config['SQLALCHEMY_DATABASE_URI'] = (
                f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
            )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # ── Initialize Extensions ───────────────────────────────
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000", "*"], supports_credentials=True)

    # ── Register Blueprints ─────────────────────────────────
    from routes.auth_routes import auth_bp
    from routes.boss_routes import boss_bp
    from routes.battle_routes import battle_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(boss_bp, url_prefix='/api/bosses')
    app.register_blueprint(battle_bp, url_prefix='/api/battle')

    # ── Create Tables & Seed Defaults ───────────────────────
    with app.app_context():
        import models  # noqa: F401 — registers all models with SQLAlchemy
        db.create_all()
        try:
            from models import Boss, User
            if Boss.query.count() == 0:
                from seed_bosses import populate_bosses
                populate_bosses()
            # Ensure demo user exists for seamless one-click presentation
            demo_email = 'dhruv123@gmail.com'
            if not User.query.filter_by(email=demo_email).first():
                import bcrypt
                demo_user = User(
                    username='Dhruv@test',
                    email=demo_email,
                    password_hash=bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                )
                db.session.add(demo_user)
                db.session.commit()
                print(f"[+] Seeded default demo user: {demo_email}")
        except Exception as e:
            print(f"[DB Warning] Could not auto-seed database: {e}")

    # ── Health Check Route ──────────────────────────────────
    @app.route('/api/health')
    def health_check():
        return {'status': 'ok', 'app': 'EQverse API', 'version': '1.0.0'}

    return app


if __name__ == '__main__':
    app = create_app()
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    app.run(host=host, port=port, debug=True)
