
import { useState } from "react";
import LandingPage from "./components/LandingPage.jsx";
import AuthPage from "./components/AuthPage.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { decodeJwt } from "./utils/jwt.js";

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);

  const handleAuthSuccess = (accessToken) => {
    const payload = decodeJwt(accessToken);

    localStorage.setItem("omnitutor_token", accessToken);

    setToken(accessToken);
    setUserId(payload?.sub || null);
    setScreen("app");
  };

  const handleLogout = () => {
    localStorage.removeItem("omnitutor_token");
    setToken(null);
    setUserId(null);
    setScreen("landing");
  };

  if (screen === "landing") {
    return (
      <LandingPage
        onContinue={() => setScreen("auth")}
      />
    );
  }

  if (screen === "auth") {
    return (
      <AuthPage
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <Dashboard
      userId={userId}
      onLogout={handleLogout}
    />
  );
}
