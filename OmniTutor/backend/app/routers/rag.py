import shutil
import tempfile
import time
from pathlib import Path

import openai
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from app.models.schemas import RAGQueryRequest
from app.services import rag_service, llm_service

router = APIRouter(prefix="/rag", tags=["rag"])

MAX_PDF_MB = 25

NOTES_PROMPT = (
    "Write concise, well-organised study notes from the study material provided. "
    "Rules: (1) Use ONLY information that appears in the material. "
    "(2) Start with a heading line in the form '## <short topic heading>'. "
    "If the material covers several topics, use several '##' headings. "
    "(3) Under each heading write short bullet points, each starting with '- '. "
    "(4) Put key terms in **bold**. "
    "(5) Include important definitions, formulas, steps, examples and comparisons from the material. "
    "(6) No introduction, no conclusion and no extra commentary."
)


class NotesRange(BaseModel):
    document_id: str
    start_page: int = 1
    end_page: int = 5


class NotesSectionRequest(NotesRange):
    section_index: int
    language: str = "en"


# Plain "def" (not async) so the slow work runs in a worker thread and the server stays responsive.
@router.post("/upload")
def upload_document(file: UploadFile = File(...), user_id: str = Form(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported right now.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        if Path(tmp_path).stat().st_size > MAX_PDF_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"PDF is too large. Maximum size is {MAX_PDF_MB} MB.")
        return rag_service.ingest_pdf(tmp_path, file.filename, user_id)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read this PDF: {e}")
    finally:
        Path(tmp_path).unlink(missing_ok=True)


@router.get("/documents")
def documents(user_id: str):
    return {"documents": rag_service.list_documents(user_id)}


@router.post("/ask")
def ask_document(payload: RAGQueryRequest):
    try:
        context = rag_service.retrieve_context(payload.document_id, payload.question)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    answer = llm_service.generate_answer(
        question=payload.question,
        language=payload.language,
        context=context,
    )
    return {"answer": answer}


@router.post("/notes/plan")
def notes_plan(payload: NotesRange):
    try:
        sections = rag_service.build_note_sections(payload.document_id, payload.start_page, payload.end_page)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"sections": [{"index": i, "label": s["label"], "chars": len(s["text"])}
                         for i, s in enumerate(sections)]}


@router.post("/notes/section")
def notes_section(payload: NotesSectionRequest):
    try:
        sections = rag_service.build_note_sections(payload.document_id, payload.start_page, payload.end_page)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not 0 <= payload.section_index < len(sections):
        raise HTTPException(status_code=400, detail="Section not found.")
    section = sections[payload.section_index]

    # Groq's free plan has a tokens-per-minute limit, so wait and retry if we hit it.
    for _ in range(3):
        try:
            notes = llm_service.generate_answer(
                question=NOTES_PROMPT,
                language=payload.language,
                context=section["text"],
            )
            return {"label": section["label"], "notes": notes}
        except openai.RateLimitError:
            time.sleep(20)
        except RuntimeError as e:
            raise HTTPException(status_code=500, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI error: {e}")

    raise HTTPException(
        status_code=429,
        detail="The free AI limit was reached. Wait a minute and press Generate again.",
    )