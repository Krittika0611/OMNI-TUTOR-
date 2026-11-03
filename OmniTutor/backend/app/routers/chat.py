import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.database import db
from app.models.schemas import ChatRequest, ChatResponse
from app.services import llm_service, rag_service

router = APIRouter(prefix="/chat", tags=["chat"])


async def _get_history(conversation_id: str, limit: int = 6) -> list[dict]:
    """Returns the last `limit` turns for this conversation, oldest first,
    formatted for the LLM's messages list."""
    cursor = db.conversations.find({"conversation_id": conversation_id}).sort("timestamp", -1).limit(limit)
    turns = await cursor.to_list(length=limit)
    turns.reverse()
    history = []
    for t in turns:
        history.append({"role": "user", "content": t["question"]})
        history.append({"role": "assistant", "content": t["answer"]})
    return history


@router.post("/ask", response_model=ChatResponse)
async def ask(payload: ChatRequest):
    conversation_id = payload.conversation_id or str(uuid.uuid4())

    context = None
    if payload.use_rag:
        if not payload.document_id:
            raise HTTPException(status_code=400, detail="document_id is required when use_rag=True")
        try:
            context = rag_service.retrieve_context(payload.document_id, payload.question)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

    history = await _get_history(conversation_id)

    try:
        answer = llm_service.generate_answer(
            question=payload.question,
            language=payload.language,
            history=history,
            context=context,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    await db.conversations.insert_one({
        "conversation_id": conversation_id,
        "user_id": payload.user_id,
        "question": payload.question,
        "answer": answer,
        "language": payload.language,
        "used_rag": payload.use_rag,
        "timestamp": datetime.utcnow(),
    })

    return ChatResponse(conversation_id=conversation_id, answer=answer, language=payload.language)


@router.get("/history/{conversation_id}")
async def get_history(conversation_id: str):
    cursor = db.conversations.find({"conversation_id": conversation_id}).sort("timestamp", 1)
    turns = await cursor.to_list(length=200)
    for t in turns:
        t["_id"] = str(t["_id"])
    return turns
