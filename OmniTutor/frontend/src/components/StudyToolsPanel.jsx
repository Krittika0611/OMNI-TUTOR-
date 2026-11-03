import { useState } from "react";
import {
  generateMcqs,
  generateFlashcards,
  generateSummary,
  generatePracticeQuestions,
  submitQuiz,
} from "../api.js";

export default function StudyToolsPanel({ view, language, userId }) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [mcqs, setMcqs] = useState([]);
  const [answers, setAnswers] = useState({});
  const [flashcards, setFlashcards] = useState([]);
  const [flippedIndex, setFlippedIndex] = useState(null);
  const [bullets, setBullets] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [scoreResult, setScoreResult] = useState(null);

  const runGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setScoreResult(null);
    try {
      if (view === "mcqs") {
        const data = await generateMcqs({ topic, language, num_items: 5 });
        setMcqs(data.mcqs || []);
        setAnswers({});
      } else if (view === "flashcards") {
        const data = await generateFlashcards({ topic, language, num_items: 6 });
        setFlashcards(data.flashcards || []);
        setFlippedIndex(null);
      } else if (view === "summary") {
        const data = await generateSummary({ topic, language });
        setBullets(data.bullets || []);
      } else if (view === "practice") {
        const data = await generatePracticeQuestions({ topic, language, num_items: 5 });
        setQuestions(data.questions || []);
      }
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to generate content. Check the backend logs.");
    } finally {
      setLoading(false);
    }
  };

  const selectOption = (qIndex, option) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: option }));
  };

  const handleSubmitQuiz = async () => {
    const payload = {
      user_id: userId,
      topic,
      answers: mcqs.map((q, i) => ({
        question: q.question,
        selected_option: answers[i],
        correct_option: q.correct_option,
      })),
    };
    const result = await submitQuiz(payload);
    setScoreResult(result);
  };

  const titles = {
    mcqs: "MCQ Quiz",
    flashcards: "Flashcards",
    summary: "Summary",
    practice: "Practice Questions",
  };

  return (
    <div className="tools-panel">
      <div className="tool-card">
        <h3>{titles[view]}</h3>
        <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
          <input
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--line)",
            }}
            placeholder="Enter a topic, e.g. Neural Networks"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <button className="send-btn" onClick={runGenerate} disabled={loading}>
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
        {error && <p className="status-text" style={{ color: "var(--rust)" }}>{error}</p>}
      </div>

      {view === "mcqs" &&
        mcqs.map((q, i) => (
          <div className="tool-card" key={i}>
            <p style={{ fontWeight: 600 }}>{i + 1}. {q.question}</p>
            {q.options.map((opt) => {
              const chosen = answers[i];
              let cls = "mcq-option";
              if (chosen) {
                if (opt === q.correct_option) cls += " correct";
                else if (opt === chosen) cls += " incorrect";
              }
              return (
                <button key={opt} className={cls} onClick={() => selectOption(i, opt)}>
                  {opt}
                </button>
              );
            })}
            {answers[i] && q.explanation && (
              <p className="status-text" style={{ marginTop: 8 }}>{q.explanation}</p>
            )}
          </div>
        ))}
      {view === "mcqs" && mcqs.length > 0 && (
        <button className="send-btn" onClick={handleSubmitQuiz}>Submit Quiz</button>
      )}
      {scoreResult && (
        <p className="status-text" style={{ marginTop: 12 }}>
          Score: {scoreResult.correct}/{scoreResult.total} ({scoreResult.score_percent}%)
        </p>
      )}

      {view === "flashcards" &&
        flashcards.map((card, i) => (
          <div className="flashcard" key={i} onClick={() => setFlippedIndex(flippedIndex === i ? null : i)}>
            {flippedIndex === i ? card.answer : card.question}
          </div>
        ))}

      {view === "summary" && bullets.length > 0 && (
        <div className="tool-card">
          <ul>
            {bullets.map((b, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {view === "practice" &&
        questions.map((q, i) => (
          <div className="tool-card" key={i}>
            <p>{i + 1}. {q}</p>
          </div>
        ))}
    </div>
  );
}
