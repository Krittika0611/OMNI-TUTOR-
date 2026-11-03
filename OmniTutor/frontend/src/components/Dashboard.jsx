import PdfPanel from "./PdfPanel.jsx";
import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import StudyToolsPanel from "./StudyToolsPanel.jsx";
import ProgressPanel from "./ProgressPanel.jsx";

export default function Dashboard({ userId, onLogout }) {
  const [language, setLanguage] = useState("en");
  const [activeView, setActiveView] = useState("chat");

  return (
    <div className="app-shell">
      <Sidebar
        language={language}
        setLanguage={setLanguage}
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={onLogout}
      />
      <main className="main-panel">
        {activeView === "pdf" && <PdfPanel language={language} userId={userId} />}
        {activeView === "chat" && <ChatWindow language={language} userId={userId} />}
        {["mcqs", "flashcards", "summary", "practice"].includes(activeView) && (
          <StudyToolsPanel view={activeView} language={language} userId={userId} />
        )}
        {activeView === "progress" && <ProgressPanel userId={userId} />}
      </main>
    </div>
  );
}
