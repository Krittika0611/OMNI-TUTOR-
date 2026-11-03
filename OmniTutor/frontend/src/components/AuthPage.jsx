import { useState } from "react";
import { login, register } from "../api.js";

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data =
        mode === "login"
          ? await login({ email, password })
          : await register({ name, email, password, preferred_language: "en" });
      onAuthSuccess(data.access_token);
    } catch (err) {
      setError(err?.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-screen">
      <div className="auth-card">
        <h2 className="landing-title" style={{ fontSize: "1.8rem" }}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="landing-tagline" style={{ marginBottom: 24 }}>
          {mode === "login" ? "Log in to continue learning" : "Start learning with OmniTutor"}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && <p className="status-text" style={{ color: "var(--rust)" }}>{error}</p>}

          <button className="send-btn" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Please wait…" : mode === "login" ? "Log In" : "Sign Up"}
          </button>
        </form>

        <p className="status-text" style={{ marginTop: 18 }}>
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button
            className="auth-toggle-link"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
            }}
          >
            {mode === "login" ? "Create an account" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
