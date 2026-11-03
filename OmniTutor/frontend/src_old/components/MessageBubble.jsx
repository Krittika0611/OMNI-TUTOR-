export default function MessageBubble({ role, content }) {
  return (
    <div className={`msg-row ${role}`}>
      <div className="msg-bubble">{content}</div>
    </div>
  );
}
