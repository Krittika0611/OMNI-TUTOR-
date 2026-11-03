"""
Async MongoDB connection using Motor.
Import `db` anywhere you need to read/write a collection, e.g.:
    from app.database import db
    await db.users.find_one({"email": email})
"""
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client = AsyncIOMotorClient(settings.MONGO_URI)
db = client[settings.MONGO_DB_NAME]

# Collections used across the app (created lazily by Mongo on first insert):
#   db.users             -> user accounts
#   db.conversations      -> chat turns (question, answer, language, timestamp)
#   db.quiz_results       -> quiz attempts and scores
#   db.learning_progress  -> per-subject/topic performance summary
