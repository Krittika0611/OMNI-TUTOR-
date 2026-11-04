
export default function LandingPage({ onContinue }) {
  return (
    <div className="landing-screen">
      <div className="landing-content premium-landing">

        <div className="landing-badge">
          ✦ YOUR PERSONAL AI LEARNING COMPANION
        </div>

        <h1 className="landing-title">
          Learn smarter.
          <br />
          <span>Grow faster.</span>
        </h1>

        <p className="landing-tagline">
          Meet OmniTutor — your multilingual AI study companion.
          Ask questions, create notes, practise quizzes and learn
          at your own pace, all in one place.
        </p>

        <button
          className="send-btn landing-btn"
          onClick={onContinue}
        >
          Get Started →
        </button>

        <div className="landing-features">
          <div className="landing-feature lavender-feature">
            <span>✦</span>
            <h3>AI Study Assistant</h3>
            <p>Get instant answers to your questions.</p>
          </div>

          <div className="landing-feature blue-feature">
            <span>▤</span>
            <h3>Smart PDF Notes</h3>
            <p>Upload documents and create study notes.</p>
          </div>

          <div className="landing-feature pink-feature">
            <span>✓</span>
            <h3>Practice & Quiz</h3>
            <p>Test your knowledge with AI-generated quizzes.</p>
          </div>

          <div className="landing-feature mint-feature">
            <span>◎</span>
            <h3>Multilingual Learning</h3>
            <p>Learn in English, Hindi and Punjabi.</p>
          </div>
        </div>

        <p className="landing-footer">
          One platform. Many ways to learn.
        </p>

      </div>
    </div>
  );
}
