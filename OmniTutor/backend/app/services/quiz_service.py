"""
Generates structured study material (MCQs, flashcards, summaries) by asking
the LLM for strict JSON, then validating/parsing it.
"""
import json
from app.services.llm_service import generate_json


def generate_mcqs(topic: str, num_items: int = 5, difficulty: str = "medium", language: str = "en") -> list[dict]:
    prompt = (
        f"Create {num_items} multiple-choice questions on the topic '{topic}' "
        f"at {difficulty} difficulty for a student.\n"
        'Reply as JSON: {"mcqs": [{"question": str, "options": [str, str, str, str], '
        '"correct_option": str, "explanation": str}, ...]}'
    )
    raw = generate_json(prompt, language=language)
    data = json.loads(raw)
    return data.get("mcqs", [])


def generate_flashcards(topic: str, num_items: int = 5, language: str = "en") -> list[dict]:
    prompt = (
        f"Create {num_items} flashcards (question + short answer) on the topic '{topic}'.\n"
        'Reply as JSON: {"flashcards": [{"question": str, "answer": str}, ...]}'
    )
    raw = generate_json(prompt, language=language)
    data = json.loads(raw)
    return data.get("flashcards", [])


def generate_summary(topic: str, language: str = "en") -> str:
    prompt = (
        f"Summarize the topic '{topic}' for a student in 5-8 concise bullet points.\n"
        'Reply as JSON: {"bullets": [str, ...]}'
    )
    raw = generate_json(prompt, language=language)
    data = json.loads(raw)
    return data.get("bullets", [])


def generate_practice_questions(topic: str, num_items: int = 5, difficulty: str = "medium",
                                 language: str = "en") -> list[str]:
    prompt = (
        f"Create {num_items} open-ended practice questions (no answers) on '{topic}' "
        f"at {difficulty} difficulty.\n"
        'Reply as JSON: {"questions": [str, ...]}'
    )
    raw = generate_json(prompt, language=language)
    data = json.loads(raw)
    return data.get("questions", [])
