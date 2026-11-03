from fastapi import APIRouter

from app.database import db

router = APIRouter(prefix="/progress", tags=["progress"])

WEAK_TOPIC_THRESHOLD = 60.0


@router.get("/{user_id}")
async def get_progress(user_id: str):
    cursor = db.learning_progress.find({"user_id": user_id})
    records = await cursor.to_list(length=200)
    for r in records:
        r["_id"] = str(r["_id"])
    return {"topics": records}


@router.get("/{user_id}/recommendations")
async def get_recommendations(user_id: str):
    cursor = db.learning_progress.find({"user_id": user_id})
    records = await cursor.to_list(length=200)

    weak_topics = [r["topic"] for r in records if r.get("performance", 100) < WEAK_TOPIC_THRESHOLD]
    recommendations = [f"Revise {topic} and retake its quiz" for topic in weak_topics]

    return {"weak_topics": weak_topics, "recommendations": recommendations}
