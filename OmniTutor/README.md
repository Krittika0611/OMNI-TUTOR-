# OmniTutor — Next-Gen Multilingual Learning Assistant

A working MVP of OmniTutor: an AI tutor that answers questions in the
student's chosen language (English / Hindi / Punjabi), generates quizzes,
flashcards, summaries and practice questions on demand, answers from an
uploaded PDF (RAG), and tracks quiz performance on a simple dashboard.

## What's implemented vs. stubbed

| Module | Status |
|---|---|
| Chat Q&A with conversation memory | ✅ working |
| Multilingual responses (en / hi / pa) | ✅ working |
| MCQ / Flashcard / Summary / Practice-question generation | ✅ working |
| Quiz scoring + progress dashboard | ✅ working |
| RAG over uploaded PDFs | ✅ working (in-memory FAISS index — restarts clear it) |
| Auth (register/login) | ✅ working backend, not yet wired into the frontend UI |
| Voice (speech-to-text / text-to-speech) | ✅ backend endpoints ready, no frontend mic button yet |

This is intentionally a real, runnable skeleton — not the entire final
product. Extend it module by module (the original plan's phases still
apply): wire auth into the UI, add a mic button calling `/voice/*`, persist
FAISS indexes to disk, add more languages, etc.

## Project structure

```
OmniTutor/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + route registration
│   │   ├── config.py            # env-driven settings
│   │   ├── database.py          # MongoDB (Motor) connection
│   │   ├── models/schemas.py    # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── llm_service.py         # OpenAI chat completions
│   │   │   ├── translation_service.py # deep-translator helper
│   │   │   ├── rag_service.py         # PDF -> chunks -> FAISS -> retrieval
│   │   │   ├── quiz_service.py        # MCQ/flashcard/summary generation
│   │   │   └── voice_service.py       # STT (SpeechRecognition) / TTS (gTTS)
│   │   └── routers/
│   │       ├── auth.py, chat.py, study_tools.py, rag.py, progress.py, voice.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx, main.jsx, index.css, api.js
    │   └── components/ (Sidebar, ChatWindow, MessageBubble, StudyToolsPanel, ProgressPanel)
    ├── package.json
    └── vite.config.js
```

## 1. Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB running locally (or a free MongoDB Atlas cluster)
- An OpenAI API key (or swap `llm_service.py` for another provider)

## 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then fill in OPENAI_API_KEY, MONGO_URI, JWT_SECRET

uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for the interactive Swagger UI —
this is the fastest way to test every endpoint before touching the frontend.

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`. If your backend runs somewhere other than
`http://localhost:8000`, create `frontend/.env` with:

```
VITE_API_URL=http://your-backend-url
```

## 4. Trying it end-to-end

1. Open the app, pick a language in the sidebar (English / हिंदी / ਪੰਜਾਬੀ).
2. Ask a question in "Ask OmniTutor" — it replies in the selected language
   and remembers the conversation for follow-ups.
3. Go to "MCQ Quiz", type a topic (e.g. "Photosynthesis"), click Generate,
   answer the questions, and Submit — this writes a score into MongoDB.
4. Go to "My Progress" to see that score and a weak-topic recommendation.
5. For RAG: use the Swagger docs (`/docs`) to `POST /rag/upload` a PDF, copy
   the returned `document_id`, then `POST /rag/ask` with that id and a
   question — OmniTutor answers from the PDF content specifically.

## 5. Where to go next (matches the original phased plan)

- **Phase 8 (Personalization)**: expand `progress.py` — currently
  recommendations are a simple "score < 60% = weak topic" rule; you can
  make this smarter (e.g. weighting by recency, topic difficulty).
- **Phase 9 (Voice)**: add a microphone button in `ChatWindow.jsx` that
  records audio, posts it to `/voice/speech-to-text`, drops the transcript
  into the question box, and plays back `/voice/text-to-speech` for the answer.
- **Auth in the UI**: add a login screen calling `/auth/login` and
  `/auth/register`, store the JWT, and replace the hardcoded `demo-user-1`
  in the frontend with the real logged-in user id.
- **More languages**: add entries to `SUPPORTED_LANGUAGES` in
  `config.py` and `LANGUAGE_INSTRUCTION` in `llm_service.py`.
- **Persisting RAG indexes**: `rag_service.py` currently keeps FAISS
  indexes in memory (reset on server restart). Save `chunks` to MongoDB and
  the FAISS index to disk (`faiss.write_index`) if you need it to survive restarts.

## Notes on cost and API keys

- Never commit your real `.env` file — `.env.example` is the template only.
- The LLM calls in `llm_service.py` and `quiz_service.py` use OpenAI's API,
  which is metered. Use a cheaper model (`gpt-4o-mini` is set as default) while developing.
- `sentence-transformers` downloads a ~90MB model the first time RAG is used — this happens once and is then cached locally.
