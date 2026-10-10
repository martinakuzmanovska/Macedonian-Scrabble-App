import "./LoginScreen.css";

export default function LoginScreen({ onBack }) {
  const handleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <button className="login-back" type="button" onClick={onBack}>
          ← Назад кон почетната
        </button>
        <p className="login-kicker">МАКЕДОНСКО ИЗДАНИЕ</p>
        <h1 className="login-title">СКРАБЛ</h1>
        <p className="login-copy">
          Најави се за да започнеш игра или да се приклучиш со код.
        </p>
        <button className="login-google-button" onClick={handleLogin}>
          <GoogleIcon />
          Најави се со Google
        </button>
        <div className="login-tiles" aria-hidden="true">
          {["С", "К", "Р", "А", "Б", "Л"].map((letter, index) => (
            <span className="login-tile" key={`${letter}-${index}`}>
              {letter}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.6 20H24v8h11.3C33.9 33.6 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.3 26.8 36 24 36c-5.4 0-9.9-3.4-11.4-8.1l-6.6 5.1C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.8l6.2 5.2C41 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"
      />
    </svg>
  );
}
