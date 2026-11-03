import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble.jsx";
import { askQuestion } from "../api.js";

const SPEECH_LANG = { en: "en-IN", hi: "hi-IN", pa: "pa-Guru-IN" };

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

const MIC_ERRORS = {
  "not-allowed": "Microphone is blocked. Click the lock icon in the address bar, allow the microphone, then try again.",
  "service-not-allowed": "Microphone is blocked. Click the lock icon in the address bar, allow the microphone, then try again.",
  "no-speech": "I didn't hear anything. Tap the mic and try again.",
  "audio-capture": "No microphone found. Check that a microphone is connected.",
  network: "Voice recognition needs an internet connection.",
  "language-not-supported": "This language isn't supported for voice input in your browser.",
};

export default function ChatWindow({ language, userId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState(null);

  const conversationId = useRef(null);
  const recognitionRef = useRef(null);

  // Stop the mic if the user leaves this screen
  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setVoiceNote(null);
    setLoading(true);

    try {
      const data = await askQuestion({
        user_id: userId,
        question,
        language,
        conversation_id: conversationId.current,
      });
      conversationId.current = data.conversation_id;
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      const detail = err?.response?.data?.detail || "Something went wrong. Is the backend running?";
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠ ${detail}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ---------- Microphone (speech to text) ----------
  const startListening = () => {
    if (!SpeechRecognitionAPI) {
      setVoiceNote("Voice input works in Google Chrome or Microsoft Edge. Please open localhost:5173 there.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = SPEECH_LANG[language] || "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;

    let finalText = "";

    recognition.onstart = () => {
      setListening(true);
      setVoiceNote("Listening… speak now");
    };

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += piece;
        else interim += piece;
      }
      setInput((finalText + interim).trim());
    };

    recognition.onerror = (event) => {
      setVoiceNote(MIC_ERRORS[event.error] || `Voice input error: ${event.error}`);
    };

    recognition.onend = () => {
      setListening(false);
      setVoiceNote((prev) => (prev === "Listening… speak now" ? "Check the text, then press Ask." : prev));
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setVoiceNote("Could not start the microphone. Try again.");
    }
  };

  const toggleMic = () => {
    if (listening) recognitionRef.current?.stop();
    else startListening();
  };

  return (
    <>
      <div className="chat-scroll">
        {messages.length === 0 && (
          <div className="empty-state">
            <h2>What are we studying today?</h2>
            <p>Type or speak your question. OmniTutor answers in the language you've chosen.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
        {loading && <MessageBubble role="assistant" content="Thinking…" />}
      </div>

      {voiceNote && (
        <p className="status-text" style={{ padding: "8px 32px 0", margin: 0 }}>
          {voiceNote}
        </p>
      )}

      <div className="chat-input-row">
        <textarea
          placeholder="Type your question or tap the mic…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={toggleMic}
          title={listening ? "Stop listening" : "Speak your question"}
          aria-label={listening ? "Stop listening" : "Speak your question"}
          style={{
            width: 52,
            minHeight: 52,
            borderRadius: 12,
            border: "1px solid var(--line)",
            background: listening ? "var(--rust)" : "var(--paper)",
            color: listening ? "#fff" : "var(--ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <line x1="12" y1="18" x2="12" y2="22" />
          </svg>
        </button>
        <button className="send-btn" onClick={handleSend} disabled={loading}>
          Ask
        </button>
      </div>
    </>
  );
}