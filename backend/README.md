# EQverse Backend

## Prerequisites
- Python 3.10+
- MySQL Server running on localhost:3306
- OpenAI API key

## Setup

1. **Create a virtual environment:**
```bash
python -m venv venv
venv\Scripts\activate       # Windows
source venv/bin/activate    # macOS/Linux
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Create the MySQL database:**
```sql
CREATE DATABASE eqverse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. **Configure environment variables:**
Edit `.env` with your credentials:
- Set `OPENAI_API_KEY` to your OpenAI key
- Set `DB_PASSWORD` to your MySQL password

5. **Run the server (auto-creates tables):**
```bash
python app.py
```

6. **Seed the bosses:**
```bash
python seed_bosses.py
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get profile |
| GET | `/api/bosses/` | List all bosses |
| GET | `/api/bosses/:id` | Boss details |
| POST | `/api/battle/start` | Start a battle |
| POST | `/api/battle/message` | Send message in battle |
| POST | `/api/battle/evaluate/:id` | Get EQ evaluation |
| GET | `/api/battle/history` | Battle history |
