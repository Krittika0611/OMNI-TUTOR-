import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse

from app.services import voice_service

router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/speech-to-text")
async def stt(file: UploadFile = File(...), language: str = Form("en")):
    """Accepts a WAV file (16kHz mono recommended) and returns the transcribed text."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        text = voice_service.speech_to_text(tmp_path, language)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not transcribe audio: {e}")
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    return {"text": text}


@router.post("/text-to-speech")
async def tts(text: str = Form(...), language: str = Form("en")):
    """Returns an mp3 file of the given text spoken aloud."""
    filepath = voice_service.text_to_speech(text, language)
    return FileResponse(filepath, media_type="audio/mpeg", filename="omnitutor_speech.mp3")
