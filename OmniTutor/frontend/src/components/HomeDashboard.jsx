
import { useEffect, useState } from "react";
import {
  getProgress,
  getRecommendations,
  listDocuments,
} from "../api.js";

export default function HomeDashboard({ userId, setActiveView }) {
  const [topics, setTopics] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        getProgress(userId),
        getRecommendations(userId),
        listDocuments(userId),
      ]);

      if (!active) return;

      if (results[0].status === "fulfilled") {
        setTopics(results[0].value.topics || []);
      }

      if (results[1].status === "fulfilled") {
        setRecommendations(
          results[1].value.recommendations || []
        );
      }

      if (results[2].status === "fulfilled") {
        setDocuments(results[2].value.documents || []);
      }

      if (results.every((result) => result.status === "rejected")) {
        setError("Could not load dashboard data. Check that your backend is running.");
      }

      setLoading(false);
    }

    if (userId) loadDashboard();

    return () => {
      active = false;
    };
  }, [userId]);

  const averagePerformance =
    topics.length > 0
      ? Math.round(
          topics.reduce(
            (sum, topic) => sum + Number(topic.performance || 0),
            0
          ) / topics.length
        )
      : null;

  const actions = [
    {
      id: "chat",
      icon: "✦",
      title: "Ask OmniTutor",
      description: "Get help with any study topic.",
      color: "home-lavender",
      button: "Start learning",
    },
    {
      id: "pdf",
      icon: "▤",
      title: "PDF Notes & Q&A",
      description: "Upload notes and ask questions.",
      color: "home-blue",
      button: "Open documents",
    },
    {
      id: "mcqs",
      icon: "✓",
      title: "Practice Quiz",
      description: "Test your knowledge with MCQs.",
      color: "home-pink",
      button: "Take a quiz",
    },
    {
      id: "flashcards",
      icon: "▣",
      title: "Flashcards",
      description: "Revise important concepts.",
      color: "home-mint",
      button: "Start revision",
    },
  ];

  return (
    <div className="home-dashboard">
      <header className="home-header">
        <div>
          <div className="home-eyebrow">YOUR PERSONAL LEARNING SPACE</div>
          <h1>Welcome back to <span>OmniTutor!</span></h1>
          <p>Ready to make today a productive learning day?</p>
        </div>

        <div className="home-date">
          <span>📅</span>
          {today}
        </div>
      </header>

      <section className="home-hero">
        <div>
          <span className="home-hero-label">✦ LEARN AT YOUR OWN PACE</span>
          <h2>Your next learning breakthrough starts here.</h2>
          <p>
            Ask questions, explore your documents and strengthen
            your understanding with your AI learning companion.
          </p>
          <button
            className="home-primary-button"
            onClick={() => setActiveView("chat")}
          >
            Continue learning <span>→</span>
          </button>
        </div>
        <div className="home-hero-art" aria-hidden="true">
          <div className="home-orbit orbit-one" />
          <div className="home-orbit orbit-two" />
          <div className="home-book">📚</div>
          <span className="home-star star-one">✦</span>
          <span className="home-star star-two">✧</span>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-heading">
          <div>
            <h2>Your learning overview</h2>
            <p>A snapshot of your activity on OmniTutor.</p>
          </div>
          <button
            className="home-text-button"
            onClick={() => setActiveView("progress")}
          >
            View progress →
          </button>
        </div>

        <div className="home-stats-grid">
          <article className="home-stat-card stat-lavender">
            <div className="home-stat-icon">📖</div>
            <div className="home-stat-label">Topics tracked</div>
            <div className="home-stat-value">
              {loading ? "—" : topics.length}
            </div>
            <div className="home-stat-note">From your progress records</div>
          </article>

          <article className="home-stat-card stat-blue">
            <div className="home-stat-icon">🎯</div>
            <div className="home-stat-label">Average performance</div>
            <div className="home-stat-value">
              {loading
                ? "—"
                : averagePerformance === null
                  ? "—"
                  : `${averagePerformance}%`}
            </div>
            <div className="home-stat-note">
              {averagePerformance === null && !loading
                ? "Complete quizzes to build your record"
                : "Across tracked topics"}
            </div>
          </article>

          <article className="home-stat-card stat-pink">
            <div className="home-stat-icon">📄</div>
            <div className="home-stat-label">Uploaded PDFs</div>
            <div className="home-stat-value">
              {loading ? "—" : documents.length}
            </div>
            <div className="home-stat-note">Your learning library</div>
          </article>

          <article className="home-stat-card stat-mint">
            <div className="home-stat-icon">💡</div>
            <div className="home-stat-label">Recommendations</div>
            <div className="home-stat-value">
              {loading ? "—" : recommendations.length}
            </div>
            <div className="home-stat-note">Suggested next steps</div>
          </article>
        </div>

        {error && <p className="home-error">{error}</p>}
      </section>

      <section className="home-section">
        <div className="home-section-heading">
          <div>
            <h2>Explore your study tools</h2>
            <p>Choose how you want to learn today.</p>
          </div>
        </div>

        <div className="home-actions-grid">
          {actions.map((action) => (
            <article
              className={`home-action-card ${action.color}`}
              key={action.id}
            >
              <div className="home-action-icon">{action.icon}</div>
              <h3>{action.title}</h3>
              <p>{action.description}</p>
              <button onClick={() => setActiveView(action.id)}>
                {action.button} →
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="home-bottom-grid">
        <article className="home-info-card">
          <div className="home-section-heading">
            <div>
              <h2>Recommended for you</h2>
              <p>Suggestions based on your learning progress.</p>
            </div>
          </div>

          {loading ? (
            <p className="home-muted">Loading recommendations...</p>
          ) : recommendations.length > 0 ? (
            <ul className="home-recommendation-list">
              {recommendations.slice(0, 5).map((item, index) => (
                <li key={index}>
                  <span className="recommendation-dot">✦</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="home-empty">
              <span>🌱</span>
              <p>
                Your recommendations will appear here as you
                complete quizzes and build learning progress.
              </p>
            </div>
          )}

          <button
            className="home-text-button"
            onClick={() => setActiveView("progress")}
          >
            Explore progress →
          </button>
        </article>

        <article className="home-info-card">
          <div className="home-section-heading">
            <div>
              <h2>Your document library</h2>
              <p>Recently available learning documents.</p>
            </div>
          </div>

          {loading ? (
            <p className="home-muted">Loading documents...</p>
          ) : documents.length > 0 ? (
            <div className="home-document-list">
              {documents.slice(0, 4).map((doc) => (
                <div className="home-document" key={doc.document_id}>
                  <span className="home-document-icon">PDF</span>
                  <div>
                    <strong>{doc.filename}</strong>
                    <small>{doc.num_pages} pages</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="home-empty">
              <span>📚</span>
              <p>
                Your uploaded PDFs will appear here.
                Start by adding your first study document.
              </p>
            </div>
          )}

          <button
            className="home-text-button"
            onClick={() => setActiveView("pdf")}
          >
            Open PDF library →
          </button>
        </article>
      </section>

      <footer className="home-footer">
        Made for curious minds · Powered by OmniTutor AI
      </footer>
    </div>
  );
}
