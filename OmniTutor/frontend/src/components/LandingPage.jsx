export default function LandingPage({ onContinue }) {
  return (
    <div className="landing-screen">
      <div className="landing-content">
        <h1 className="landing-title">OmniTutor</h1>
        <p className="landing-tagline">Multilingual learning assistant</p>
        <button className="send-btn landing-btn" onClick={onContinue}>
          Get Started
        </button>
      </div>
    </div>
  );
}
