"""
Standalone translation utility.

Note: for chat answers, we get multilingual output directly from the LLM
(see llm_service.py) because it produces more natural, context-aware text
than translating an English answer afterwards. This service is for cases
where you need pure text translation — e.g. translating a user's question
INTO English before a keyword search, or translating UI strings/PDF text.
"""
from deep_translator import GoogleTranslator
from app.config import settings

_LANG_MAP = {code: code for code in settings.SUPPORTED_LANGUAGES}  # ISO codes match deep-translator


def translate_text(text: str, target_language: str, source_language: str = "auto") -> str:
    if target_language not in settings.SUPPORTED_LANGUAGES:
        raise ValueError(f"Unsupported language code: {target_language}")
    if not text.strip():
        return text
    return GoogleTranslator(source=source_language, target=_LANG_MAP[target_language]).translate(text)


def detect_and_translate_to_english(text: str) -> str:
    return GoogleTranslator(source="auto", target="en").translate(text)
