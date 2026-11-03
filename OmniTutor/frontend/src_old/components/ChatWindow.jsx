import { useState, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";
import { askQuestion } from "../api.js";

const USER_ID = "demo-user-1"; // replace with the logged-in user's id once auth is wired into the UI

export default function ChatWindow({ language }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const conversationId = useRef(null);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    try {
      const data = await askQuestion({
        user_id: USER_ID,
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

  return (
    <>
      <div className="chat-scroll">
        {messages.length === 0 && (
          <div className="empty-state">
            <h2>What are we studying today?</h2>
            <p>Ask a question in any subject — OmniTutor answers in the language you've chosen.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
        {loading && <MessageBubble role="assistant" content="Thinking…" />}
      </div>

      <div className="chat-input-row">
        <textarea
          placeholder="Explain photosynthesis to me…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="send-btn" onClick={handleSend} disabled={loading}>
          Ask
        </button>
      </div>
    </>
  );
}
