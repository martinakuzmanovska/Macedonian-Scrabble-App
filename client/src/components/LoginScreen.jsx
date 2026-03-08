/**
 * LoginScreen
 * Shown when useAuth returns user === null.
 * Clicking the button redirects to the server's Google OAuth route.
 */
export default function LoginScreen() {
  const S = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(140deg, #0b0f1a 0%, #162032 40%, #1a1210 100%)",
      fontFamily: "'Palatino Linotype','Book Antiqua','Palatino',serif",
      color: "#f0e6d3",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    card: {
      background: "linear-gradient(145deg, #2a1a10, #3a2518)",
      borderRadius: 14,
      border: "1.5px solid rgba(212,175,55,0.25)",
      boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
      padding: "48px 40px",
      maxWidth: 420,
      width: "100%",
      textAlign: "center",
    },
    title: {
      fontSize: 48,
      letterSpacing: 8,
      color: "#d4af37",
      fontWeight: 700,
      textShadow: "0 2px 15px rgba(212,175,55,0.3)",
      marginBottom: 4,
    },
    subtitle: {
      color: "#a89070",
      fontSize: 13,
      letterSpacing: 4,
      marginBottom: 48,
    },
    googleBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      width: "100%",
      padding: "14px 24px",
      background: "#fff",
      color: "#1a1a1a",
      border: "none",
      borderRadius: 8,
      fontSize: 15,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      transition: "transform 0.1s, box-shadow 0.1s",
    },
    note: {
      marginTop: 24,
      fontSize: 11,
      color: "#665040",
      lineHeight: 1.7,
    },
  };

  const handleLogin = () => {
    // Full page redirect — the server handles the OAuth dance
    // and redirects back to http://localhost:5173 on success
    window.location.href = "/api/auth/google";
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.title}>СКРАБЛ</div>
        <div style={S.subtitle}>МАКЕДОНСКО ИЗДАНИЕ</div>

        <button
          style={S.googleBtn}
          onClick={handleLogin}
          onMouseOver={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)"; }}
          onMouseOut={e =>  { e.currentTarget.style.transform = "none";             e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)"; }}
        >
          <GoogleIcon />
          Најави се со Google
        </button>

        <div style={S.note}>
          Твојот профил се користи за табелата на резултати<br/>
          и за зачувување на историјата на игри.
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.9 33.6 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.3 26.8 36 24 36c-5.4 0-9.9-3.4-11.4-8.1l-6.6 5.1C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.8l6.2 5.2C41 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
    </svg>
  );
}