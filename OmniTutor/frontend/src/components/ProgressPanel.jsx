import { useEffect, useState } from "react";
import { getProgress, getRecommendations } from "../api.js";

export default function ProgressPanel({ userId }) {
  const [topics, setTopics] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    getProgress(userId).then((data) => setTopics(data.topics || []));
    getRecommendations(userId).then((data) => setRecommendations(data.recommendations || []));
  }, [userId]);

  return (
    <div className="tools-panel">
      <div className="tool-card">
        <h3>Your Performance</h3>
        {topics.length === 0 && <p className="status-text">Take a quiz to see your progress here.</p>}
        {topics.map((t) => (
          <div key={t.topic} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              <span>{t.topic}</span>
              <span>{t.performance}%</span>
            </div>
            <div style={{ background: "var(--line)", borderRadius: 6, height: 8, marginTop: 4 }}>
              <div
                style={{
                  width: `${t.performance}%`,
                  background: t.performance < 60 ? "var(--rust)" : "var(--pine)",
                  height: 8,
                  borderRadius: 6,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {recommendations.length > 0 && (
        <div className="tool-card">
          <h3>Recommended Next Steps</h3>
          <ul>
            {recommendations.map((r, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
