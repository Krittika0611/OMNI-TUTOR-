const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
];

const NAV_ITEMS = [
  { id: "chat", label: "Ask OmniTutor" },
  { id: "pdf", label: "PDF Notes & Q&A" },
  { id: "summary", label: "Summary" },
  { id: "mcqs", label: "MCQ Quiz" },
  { id: "flashcards", label: "Flashcards" },
  { id: "practice", label: "Practice Questions" },
  { id: "progress", label: "My Progress" },
];

export default function Sidebar({ language, setLanguage, activeView, setActiveView, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        OmniTutor
        <small>Multilingual learning assistant</small>
      </div>

      <div className="sidebar-section">
        <h4>Language</h4>
        <div className="lang-grid">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              className={`lang-pill ${language === l.code ? "active" : ""}`}
              onClick={() => setLanguage(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <h4>Study</h4>
        <div className="nav-list">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? "active" : ""}`}
              onClick={() => setActiveView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={onLogout} style={{ marginBottom: 8 }}>
          Log out
        </button>
        MCA Project · OmniTutor v0.1
      </div>
    </aside>
  );
}
