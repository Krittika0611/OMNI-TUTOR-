import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";
import {
  askQuestion,
  uploadDocument,
  listDocuments,
  getNotesPlan,
  generateNotesSection,
} from "../api.js";

const MAX_PAGES_PER_RUN = 10;

// Turns **bold** text into <strong>
function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}

// Shows notes written as "## heading" and "- bullet" lines
function NotesView({ text }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const blocks = [];
  let bullets = [];
  const flush = () => {
    if (bullets.length) {
      blocks.push({ type: "ul", items: bullets });
      bullets = [];
    }
  };
  lines.forEach((line) => {
    if (line.startsWith("#")) {
      flush();
      blocks.push({ type: "h", text: line.replace(/^#+\s*/, "") });
    } else if (/^[-*•]\s+/.test(line)) {
      bullets.push(line.replace(/^[-*•]\s+/, ""));
    } else {
      flush();
      blocks.push({ type: "p", text: line });
    }
  });
  flush();

  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === "h") {
          return (
            <h4 key={i} style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", margin: "14px 0 6px" }}>
              {renderInline(b.text)}
            </h4>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={i} style={{ margin: "0 0 8px", paddingLeft: 22 }}>
              {b.items.map((item, j) => (
                <li key={j} style={{ marginBottom: 4, lineHeight: 1.5 }}>
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} style={{ margin: "0 0 8px", lineHeight: 1.5 }}>
            {renderInline(b.text)}
          </p>
        );
      })}
    </>
  );
}

const tabStyle = (active) => ({
  padding: "8px 18px",
  borderRadius: 999,
  cursor: "pointer",
  fontSize: "0.9rem",
  border: "1px solid var(--line)",
  background: active ? "var(--ink)" : "transparent",
  color: active ? "var(--paper-bright)" : "var(--ink)",
});

const pageInputStyle = {
  width: 70,
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--line)",
};

export default function PdfPanel({ language, userId }) {
  const [documents, setDocuments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [tab, setTab] = useState("ask");

  // "Ask" tab
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const conversationId = useRef(null);

  // "Notes" tab
  const [startPage, setStartPage] = useState("1");
  const [endPage, setEndPage] = useState("5");
  const [notesSections, setNotesSections] = useState([]);
  const [notesRange, setNotesRange] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [notesError, setNotesError] = useState(null);
  const [copied, setCopied] = useState(false);
  const cancelRef = useRef(false);

  const fileInputRef = useRef(null);
  const selectedDoc = documents.find((d) => d.document_id === selectedId) || null;

  useEffect(() => {
    listDocuments(userId)
      .then((data) => setDocuments(data.documents || []))
      .catch(() => {});
  }, [userId]);

  // Stop any running notes job when leaving this screen
  useEffect(() => () => { cancelRef.current = true; }, []);

  const selectDocument = (doc) => {
    cancelRef.current = true;
    setSelectedId(doc.document_id);
    setMessages([]);
    conversationId.current = null;
    setNotesSections([]);
    setNotesRange(null);
    setNotesError(null);
    setProgress(null);
    setStartPage("1");
    setEndPage(String(Math.min(5, doc.num_pages || 1)));
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Please choose a PDF file.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const doc = await uploadDocument(file, userId);
      setDocuments((prev) => [doc, ...prev]);
      selectDocument(doc);
      setTab("ask");
    } catch (err) {
      setUploadError(err?.response?.data?.detail || "Upload failed. Is the backend running?");
    } finally {
      setUploading(false);
    }
  };

  // ---------- Ask questions from the PDF ----------
  const handleAsk = async () => {
    const text = question.trim();
    if (!text || asking || !selectedId) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setQuestion("");
    setAsking(true);
    try {
      const data = await askQuestion({
        user_id: userId,
        question: text,
        language,
        conversation_id: conversationId.current,
        use_rag: true,
        document_id: selectedId,
      });
      conversationId.current = data.conversation_id;
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      const detail = err?.response?.data?.detail || "Something went wrong. Is the backend running?";
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠ ${detail}` }]);
    } finally {
      setAsking(false);
    }
  };

  const handleAskKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  // ---------- Make notes ----------
  const generateNotes = async () => {
    if (!selectedDoc || generating) return;
    const from = parseInt(startPage, 10);
    const to = parseInt(endPage, 10);

    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from || to > selectedDoc.num_pages) {
      setNotesError(`Enter a valid page range between 1 and ${selectedDoc.num_pages}.`);
      return;
    }
    if (to - from + 1 > MAX_PAGES_PER_RUN) {
      setNotesError(`Please choose at most ${MAX_PAGES_PER_RUN} pages at a time.`);
      return;
    }

    const documentId = selectedId;
    cancelRef.current = false;
    setNotesError(null);
    setNotesSections([]);
    setNotesRange({ from, to });
    setProgress(null);
    setGenerating(true);

    try {
      const plan = await getNotesPlan({ document_id: documentId, start_page: from, end_page: to });
      const total = plan.sections.length;
      if (total === 0) {
        setNotesError("No readable text found on those pages.");
        return;
      }
      setProgress({ done: 0, total });

      for (let i = 0; i < total; i++) {
        if (cancelRef.current) break;
        try {
          const result = await generateNotesSection({
            document_id: documentId,
            start_page: from,
            end_page: to,
            section_index: i,
            language,
          });
          if (cancelRef.current) break;
          setNotesSections((prev) => [...prev, { label: result.label, notes: result.notes }]);
          setProgress({ done: i + 1, total });
        } catch (err) {
          const detail = err?.response?.data?.detail || "Could not generate this part.";
          setNotesError(`${detail} (stopped at part ${i + 1} of ${total})`);
          break;
        }
      }
    } catch (err) {
      setNotesError(err?.response?.data?.detail || "Could not start the notes. Is the backend running?");
    } finally {
      setGenerating(false);
    }
  };

  const buildNotesText = () => {
    const body = notesSections.map((s) => `[${s.label}]\n${s.notes}`).join("\n\n");
    const range = notesRange ? ` (pages ${notesRange.from}-${notesRange.to})` : "";
    return `Study notes: ${selectedDoc?.filename || ""}${range}\n\n${body}\n`;
  };

  const downloadNotes = () => {
    const blob = new Blob([buildNotesText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(selectedDoc?.filename || "notes").replace(/\.pdf$/i, "")}-notes.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyNotes = async () => {
    try {
      await navigator.clipboard.writeText(buildNotesText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setNotesError("Could not copy. Use Download instead.");
    }
  };

  return (
    <div className="tools-panel">
      {/* Upload */}
      <div className="tool-card">
        <h3>PDF Notes & Q&A</h3>
        <p className="status-text" style={{ marginTop: 0 }}>
          Upload a PDF (up to 25 MB). Then ask questions from it or turn its pages into study notes.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleUpload}
          style={{ display: "none" }}
        />
        <button
          className="send-btn"
          style={{ padding: "10px 22px" }}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Reading your PDF…" : "Upload PDF"}
        </button>
        {uploading && (
          <p className="status-text">
            Reading and indexing the PDF. The first upload can take a minute while the search model loads.
          </p>
        )}
        {uploadError && <p className="status-text" style={{ color: "var(--rust)" }}>{uploadError}</p>}
      </div>

      {/* Your PDFs */}
      {documents.length > 0 && (
        <div className="tool-card">
          <h3>Your PDFs</h3>
          {documents.map((doc) => (
            <button
              key={doc.document_id}
              onClick={() => selectDocument(doc)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 14px",
                margin: "6px 0",
                borderRadius: 8,
                border: "1px solid var(--line)",
                background: doc.document_id === selectedId ? "var(--marigold-soft)" : "var(--paper-bright)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <div style={{ fontWeight: 600 }}>{doc.filename}</div>
              <div className="status-text">{doc.num_pages} pages</div>
            </button>
          ))}
        </div>
      )}

      {/* Selected PDF */}
      {selectedDoc && (
        <div className="tool-card">
          <h3 style={{ marginBottom: 4 }}>{selectedDoc.filename}</h3>
          <div style={{ display: "flex", gap: 8, margin: "12px 0 16px" }}>
            <button style={tabStyle(tab === "ask")} onClick={() => setTab("ask")}>Ask questions</button>
            <button style={tabStyle(tab === "notes")} onClick={() => setTab("notes")}>Make notes</button>
          </div>

          {tab === "ask" && (
            <>
              {messages.length === 0 && (
                <p className="status-text">
                  Ask anything about this PDF, for example "Explain the main idea of chapter 1".
                </p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 14 }}>
                {messages.map((m, i) => (
                  <MessageBubble key={i} role={m.role} content={m.content} />
                ))}
                {asking && <MessageBubble role="assistant" content="Searching your PDF…" />}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <textarea
                  placeholder="Ask a question from this PDF…"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleAskKeyDown}
                  style={{
                    flex: 1,
                    resize: "none",
                    minHeight: 48,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--line)",
                    fontFamily: "inherit",
                    background: "var(--paper-bright)",
                  }}
                />
                <button className="send-btn" onClick={handleAsk} disabled={asking}>
                  Ask
                </button>
              </div>
            </>
          )}

          {tab === "notes" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span>From page</span>
                <input
                  style={pageInputStyle}
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value)}
                  inputMode="numeric"
                />
                <span>to</span>
                <input
                  style={pageInputStyle}
                  value={endPage}
                  onChange={(e) => setEndPage(e.target.value)}
                  inputMode="numeric"
                />
                <span className="status-text">of {selectedDoc.num_pages}</span>
                <button
                  className="send-btn"
                  style={{ padding: "10px 22px" }}
                  onClick={generateNotes}
                  disabled={generating}
                >
                  {generating ? "Writing notes…" : "Generate notes"}
                </button>
                {generating && (
                  <button
                    onClick={() => { cancelRef.current = true; }}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: "1px solid var(--line)",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    Stop
                  </button>
                )}
              </div>
              <p className="status-text">
                Notes are written in the language selected in the sidebar. Choose up to {MAX_PAGES_PER_RUN} pages at a
                time. Longer ranges can take a few minutes on the free AI plan.
              </p>

              {generating && progress && (
                <p className="status-text">
                  Part {Math.min(progress.done + 1, progress.total)} of {progress.total}…
                </p>
              )}
              {notesError && <p className="status-text" style={{ color: "var(--rust)" }}>{notesError}</p>}

              {notesSections.length > 0 && (
                <>
                  <div style={{ display: "flex", gap: 10, margin: "8px 0 16px" }}>
                    <button
                      onClick={downloadNotes}
                      style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--paper-bright)", cursor: "pointer" }}
                    >
                      Download (.txt)
                    </button>
                    <button
                      onClick={copyNotes}
                      style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--paper-bright)", cursor: "pointer" }}
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  {notesSections.map((s, i) => (
                    <div key={i} style={{ marginBottom: 18 }}>
                      <div className="status-text" style={{ marginBottom: 2 }}>{s.label}</div>
                      <NotesView text={s.notes} />
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}