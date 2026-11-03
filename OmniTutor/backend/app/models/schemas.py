from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime


# ---------- Auth ----------
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    preferred_language: str = "en"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Chat ----------
class ChatRequest(BaseModel):
    user_id: str
    question: str
    language: str = "en"          # ISO code: en / hi / pa ...
    conversation_id: Optional[str] = None
    use_rag: bool = False
    document_id: Optional[str] = None  # required if use_rag=True


class ChatResponse(BaseModel):
    conversation_id: str
    answer: str
    language: str


# ---------- Study tools ----------
class StudyToolRequest(BaseModel):
    topic: str
    language: str = "en"
    difficulty: str = "medium"     # easy | medium | hard
    num_items: int = 5


class MCQ(BaseModel):
    question: str
    options: List[str]
    correct_option: str
    explanation: Optional[str] = None


class Flashcard(BaseModel):
    question: str
    answer: str


class QuizSubmission(BaseModel):
    user_id: str
    topic: str
    answers: List[dict] = Field(
        default_factory=list,
        description="[{question, selected_option, correct_option}, ...]",
    )


# ---------- RAG ----------
class RAGQueryRequest(BaseModel):
    document_id: str
    question: str
    language: str = "en"


# ---------- Progress ----------
class ProgressEntry(BaseModel):
    user_id: str
    subject: str
    topic: str
    score_percent: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)
