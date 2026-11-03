from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.database import db
from app.models.schemas import StudyToolRequest, QuizSubmission
from app.services import quiz_service

router = APIRouter(prefix="/study", tags=["study-tools"])


@router.post("/mcqs")
async def mcqs(payload: StudyToolRequest):
    try:
        return {"mcqs": quiz_service.generate_mcqs(
            payload.topic, payload.num_items, payload.difficulty, payload.language)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate MCQs: {e}")


@router.post("/flashcards")
async def flashcards(payload: StudyToolRequest):
    try:
        return {"flashcards": quiz_service.generate_flashcards(
            payload.topic, payload.num_items, payload.language)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate flashcards: {e}")


@router.post("/summary")
async def summary(payload: StudyToolRequest):
    try:
        return {"bullets": quiz_service.generate_summary(payload.topic, payload.language)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {e}")


@router.post("/practice-questions")
async def practice_questions(payload: StudyToolRequest):
    try:
        return {"questions": quiz_service.generate_practice_questions(
            payload.topic, payload.num_items, payload.difficulty, payload.language)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate practice questions: {e}")


@router.post("/quiz/submit")
async def submit_quiz(payload: QuizSubmission):
    total = len(payload.answers)
    correct = sum(1 for a in payload.answers if a.get("selected_option") == a.get("correct_option"))
    score_percent = round((correct / total) * 100, 2) if total else 0.0

    await db.quiz_results.insert_one({
        "user_id": payload.user_id,
        "topic": payload.topic,
        "score": correct,
        "total_questions": total,
        "score_percent": score_percent,
        "date": datetime.utcnow(),
    })

    # Roll the result into the learning_progress collection so the
    # dashboard/recommendations can use it later.
    await db.learning_progress.update_one(
        {"user_id": payload.user_id, "topic": payload.topic},
        {"$set": {"performance": score_percent, "updated_at": datetime.utcnow()}},
        upsert=True,
    )

    return {"correct": correct, "total": total, "score_percent": score_percent}
