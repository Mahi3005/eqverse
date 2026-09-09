"""
EQverse - Backend Test Suite
Tests authentication, boss endpoints, and battle loop using Flask test client.
"""

import os
import json
import unittest

os.environ['DB_TYPE'] = 'sqlite'
os.environ['OPENAI_API_KEY'] = 'mock-key-for-unit-test'

from app import create_app
from extensions import db
from models import User, Boss, BattleSession, BattleMessage, EQEvaluation, UserUnlock
from seed_bosses import seed_bosses


class EQverseApiTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()
            User.query.delete()
            BattleSession.query.delete()
            db.session.commit()
            seed_bosses()

    def test_health_check(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'ok')

    def test_auth_and_bosses(self):
        # 1. Register
        reg_res = self.client.post('/api/auth/register', json={
            'username': 'testplayer',
            'email': 'player@eqverse.com',
            'password': 'password123'
        })
        self.assertEqual(reg_res.status_code, 201)
        reg_data = reg_res.get_json()
        token = reg_data['access_token']
        self.assertIsNotNone(token)

        # 2. Login
        login_res = self.client.post('/api/auth/login', json={
            'email': 'player@eqverse.com',
            'password': 'password123'
        })
        self.assertEqual(login_res.status_code, 200)

        # 3. List bosses
        headers = {'Authorization': f'Bearer {token}'}
        boss_res = self.client.get('/api/bosses/', headers=headers)
        self.assertEqual(boss_res.status_code, 200)
        bosses = boss_res.get_json()['bosses']
        self.assertEqual(len(bosses), 6)

        # 4. Start battle with Riya
        start_res = self.client.post('/api/battle/start', json={'boss_id': 'riya'}, headers=headers)
        self.assertEqual(start_res.status_code, 201)
        start_data = start_res.get_json()
        self.assertEqual(start_data['boss']['id'], 'riya')
        self.assertEqual(start_data['tension']['value'], 50)
        print("\n[OK] All backend integration tests passed successfully!")


if __name__ == '__main__':
    unittest.main()
