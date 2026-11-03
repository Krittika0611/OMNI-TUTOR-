
export default function MessageBubble({ role, content, onSpeak, speaking, audioLoading }) {
  return (
    <div className={`msg-row ${role}`}>
      <div>
        <div className="msg-bubble">{content}</div>
        {role === "assistant" && onSpeak && (
          <button
            type="button"
            onClick={onSpeak}
            disabled={audioLoading}
            style={{
              background: "none",
              border: "none",
              color: "var(--slate)",
              fontSize: "0.82rem",
              padding: "6px 4px",
              cursor: "pointer",
            }}
          >
            {audioLoading ? "Loading audio…" : speaking ? "■ Stop" : "▶ Listen"}
          </button>
        )}
      </div>
    </div>
  );
}