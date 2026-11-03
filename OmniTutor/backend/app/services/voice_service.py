"""
Voice I/O helpers.

speech_to_text: uses SpeechRecognition (Google Web Speech API backend, free
                 but rate-limited — fine for a college project/demo).
text_to_speech: uses gTTS (Google Text-to-Speech) to produce an mp3 file.

For production-quality accuracy across Hindi/Punjabi, consider swapping to
a paid STT/TTS service (Azure Speech, Google Cloud Speech, etc.) — the
function signatures below are designed so you can do that without touching
any router code.
"""
import uuid
from pathlib import Path

import speech_recognition as sr
from gtts import gTTS

AUDIO_DIR = Path(__file__).resolve().parent.parent / "static" / "audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

_SR_LANG_MAP = {"en": "en-IN", "hi": "hi-IN", "pa": "pa-IN"}
_TTS_LANG_MAP = {"en": "en", "hi": "hi", "pa": "pa"}


def speech_to_text(audio_file_path: str, language: str = "en") -> str:
    recognizer = sr.Recognizer()
    with sr.AudioFile(audio_file_path) as source:
        audio_data = recognizer.record(source)
    return recognizer.recognize_google(audio_data, language=_SR_LANG_MAP.get(language, "en-IN"))


def text_to_speech(text: str, language: str = "en") -> str:
    """Returns the path to a generated mp3 file."""
    tts = gTTS(text=text, lang=_TTS_LANG_MAP.get(language, "en"))
    filename = f"{uuid.uuid4()}.mp3"
    filepath = AUDIO_DIR / filename
    tts.save(str(filepath))
    return str(filepath)
