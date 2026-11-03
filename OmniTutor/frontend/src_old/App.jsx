import { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import StudyToolsPanel from "./components/StudyToolsPanel.jsx";
import ProgressPanel from "./components/ProgressPanel.jsx";

export default function App() {
  const [language, setLanguage] = useState("en");
  const [activeView, setActiveView] = useState("chat");

  return (
    <div className="app-shell">
      <Sidebar
        language={language}
        setLanguage={setLanguage}
        activeView={activeView}
        setActiveView={setActiveView}
      />
      <main className="main-panel">
        {activeView === "chat" && <ChatWindow language={language} />}
        {["mcqs", "flashcards", "summary", "practice"].includes(activeView) && (
          <StudyToolsPanel view={activeView} language={language} />
        )}
        {activeView === "progress" && <ProgressPanel />}
      </main>
    </div>
  );
}
