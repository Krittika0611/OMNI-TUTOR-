from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, chat, study_tools, rag, progress, voice

app = FastAPI(
    title="OmniTutor API",
    description="AI-powered multilingual learning assistant backend.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(study_tools.router)
app.include_router(rag.router)
app.include_router(progress.router)
app.include_router(voice.router)


@app.get("/")
async def root():
    return {"status": "ok", "message": "OmniTutor API is running"}


@app.get("/languages")
async def supported_languages():
    return settings.SUPPORTED_LANGUAGES
