"""
RAG pipeline with on-disk storage, so uploaded PDFs survive server restarts.

Each PDF is stored in  backend/data/documents/<document_id>/
    meta.json        filename, owner, upload time, page count
    pages.json       the text of every page (used for notes)
    embeddings.npy   one vector per text chunk (used for question answering)
"""
import datetime
import json
import uuid
from pathlib import Path

import faiss
import numpy as np
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer

# rag_service.py -> services -> app -> backend
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "documents"
DATA_DIR.mkdir(parents=True, exist_ok=True)

_EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
_embedder = None
_CACHE: dict[str, dict] = {}


def _get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(_EMBED_MODEL_NAME)
    return _embedder


def _clean(text: str) -> str:
    return text.encode("utf-8", "ignore").decode("utf-8").strip()


def _chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return [c.strip() for c in chunks if c.strip()]


def _to_english(text: str) -> str:
    """The search model is English-only, so translate Hindi/Punjabi questions first."""
    if text.isascii():
        return text
    try:
        from app.services.translation_service import detect_and_translate_to_english
        return detect_and_translate_to_english(text) or text
    except Exception:
        return text


def _doc_dir(document_id: str) -> Path:
    try:
        uuid.UUID(document_id)
    except (ValueError, AttributeError, TypeError):
        raise ValueError("Unknown document. Please upload the PDF again.")
    folder = DATA_DIR / document_id
    if not folder.is_dir():
        raise ValueError("Unknown document. Please upload the PDF again.")
    return folder


def ingest_pdf(file_path: str, filename: str, user_id: str) -> dict:
    reader = PdfReader(file_path)
    if reader.is_encrypted:
        raise ValueError("This PDF is password-protected. Please upload an unlocked copy.")

    pages = [_clean(page.extract_text() or "") for page in reader.pages]
    chunks = _chunk_text("\n".join(pages))
    if not chunks:
        raise ValueError("No readable text found in this PDF (it may be a scanned image).")

    embeddings = _get_embedder().encode(
        chunks,
        convert_to_numpy=True,
        normalize_embeddings=True,
        batch_size=32,
        show_progress_bar=False,
    ).astype("float32")

    document_id = str(uuid.uuid4())
    folder = DATA_DIR / document_id
    folder.mkdir(parents=True)

    created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    meta = {
        "filename": filename,
        "user_id": user_id,
        "num_pages": len(pages),
        "created_at": created_at,
    }
    (folder / "pages.json").write_text(json.dumps(pages), encoding="utf-8")
    np.save(folder / "embeddings.npy", embeddings)
    # meta.json is written last, so half-finished uploads never show up in the list
    (folder / "meta.json").write_text(json.dumps(meta), encoding="utf-8")

    return {
        "document_id": document_id,
        "filename": filename,
        "num_pages": len(pages),
        "created_at": created_at,
    }


def _load(document_id: str) -> dict:
    if document_id in _CACHE:
        return _CACHE[document_id]

    folder = _doc_dir(document_id)
    pages = json.loads((folder / "pages.json").read_text(encoding="utf-8"))
    chunks = _chunk_text("\n".join(pages))
    embeddings = np.ascontiguousarray(np.load(folder / "embeddings.npy"), dtype="float32")
    if len(chunks) != embeddings.shape[0]:
        raise ValueError("This document's index is out of date. Please upload the PDF again.")

    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)

    _CACHE[document_id] = {"chunks": chunks, "index": index, "pages": pages}
    return _CACHE[document_id]


def retrieve_context(document_id: str, question: str, top_k: int = 4) -> str:
    store = _load(document_id)
    query = _to_english(question)
    q_emb = _get_embedder().encode([query], convert_to_numpy=True, normalize_embeddings=True)
    _, indices = store["index"].search(q_emb.astype("float32"), top_k)
    retrieved = [store["chunks"][i] for i in indices[0] if i != -1]
    return "\n\n---\n\n".join(retrieved)


def list_documents(user_id: str) -> list[dict]:
    docs = []
    for folder in DATA_DIR.iterdir():
        meta_file = folder / "meta.json"
        if not meta_file.is_file():
            continue
        try:
            meta = json.loads(meta_file.read_text(encoding="utf-8"))
        except Exception:
            continue
        if meta.get("user_id") == user_id:
            docs.append({
                "document_id": folder.name,
                "filename": meta.get("filename"),
                "num_pages": meta.get("num_pages", 0),
                "created_at": meta.get("created_at") or "",
            })
    docs.sort(key=lambda d: d["created_at"], reverse=True)
    return docs


def build_note_sections(document_id: str, start_page: int, end_page: int,
                        max_chars: int = 3500) -> list[dict]:
    """Groups the pages in [start_page, end_page] into small sections, one AI call each."""
    pages = _load(document_id)["pages"]
    start = max(1, start_page)
    end = min(len(pages), end_page)
    if start > end:
        raise ValueError(f"Invalid page range. This PDF has {len(pages)} pages.")

    sections = []
    buf = ""
    buf_pages: list[int] = []

    def flush():
        nonlocal buf, buf_pages
        if buf.strip():
            first, last = buf_pages[0], buf_pages[-1]
            label = f"Page {first}" if first == last else f"Pages {first}-{last}"
            sections.append({"label": label, "text": buf.strip()})
        buf, buf_pages = "", []

    for page_no in range(start, end + 1):
        text = pages[page_no - 1]
        if not text:
            continue
        for i in range(0, len(text), max_chars):
            piece = text[i:i + max_chars]
            if buf and len(buf) + len(piece) > max_chars:
                flush()
            buf += ("\n\n" if buf else "") + piece
            if not buf_pages or buf_pages[-1] != page_no:
                buf_pages.append(page_no)
    flush()
    return sections