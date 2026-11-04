
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
];

const NAV_GROUPS = [
  {
    title: "Workspace",
    items: [
      { id: "home", icon: "⌂", label: "Home" },
      { id: "chat", icon: "✦", label: "Ask OmniTutor" },
    ],
  },
  {
    title: "Study tools",
    items: [
      { id: "pdf", icon: "▤", label: "PDF Notes & Q&A" },
      { id: "summary", icon: "≡", label: "Summary" },
      { id: "mcqs", icon: "✓", label: "MCQ Quiz" },
      { id: "flashcards", icon: "▣", label: "Flashcards" },
      { id: "practice", icon: "✎", label: "Practice Questions" },
    ],
  },
  {
    title: "Your learning",
    items: [
      { id: "progress", icon: "↗", label: "My Progress" },
    ],
  },
];

export default function Sidebar({
  language,
  setLanguage,
  activeView,
  setActiveView,
  onLogout,
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-symbol">✦</span>
        OmniTutor
        <small>Multilingual learning assistant</small>
      </div>

      <div className="sidebar-section">
        <h4>Choose language</h4>
        <div className="lang-grid">
          {LANGUAGES.map((item) => (
            <button
              key={item.code}
              className={`lang-pill ${
                language === item.code ? "active" : ""
              }`}
              onClick={() => setLanguage(item.code)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {NAV_GROUPS.map((group) => (
        <div className="sidebar-section" key={group.title}>
          <h4>{group.title}</h4>

          <div className="nav-list">
            {group.items.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${
                  activeView === item.id ? "active" : ""
                }`}
                onClick={() => setActiveView(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="sidebar-footer">
        <button className="nav-item logout-button" onClick={onLogout}>
          <span className="nav-icon">↪</span>
          Log out
        </button>
        <div className="sidebar-version">
          MCA Project · OmniTutor v0.2
        </div>
      </div>
    </aside>
  );
}
