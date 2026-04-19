export default function LoginScreen() {
  const handleLogin = () => { window.location.href = "/api/auth/google"; };

  return (
    <div style={{ minHeight: "100vh", background: "#080b14", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse-glow { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
        .google-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important; }
      `}</style>

      {/* Background grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
      {/* Glow orbs */}
      <div style={{ position: "absolute", top: "15%", left: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)", animation: "pulse-glow 5s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "15%", right: "8%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)", animation: "pulse-glow 7s ease-in-out infinite 2s", pointerEvents: "none" }} />

      <div style={{ background: "rgba(14,19,31,0.95)", backdropFilter: "blur(12px)", borderRadius: 20, border: "1px solid rgba(99,102,241,0.18)", boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)", padding: "56px 48px", maxWidth: 420, width: "100%", textAlign: "center", position: "relative", zIndex: 1 }}>

        {/* Logo */}
        <div style={{ fontSize: 11, letterSpacing: 6, color: "#6366f1", fontWeight: 600, marginBottom: 14, textTransform: "uppercase", opacity: 0.9 }}>Македонско Издание</div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 56, fontWeight: 700, letterSpacing: 6, background: "linear-gradient(135deg, #f8fafc 0%, #a5b4fc 50%, #22d3ee 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 6, animation: "float 6s ease-in-out infinite" }}>СКРАБЛ</div>
        <div style={{ width: 56, height: 3, background: "linear-gradient(90deg, #6366f1, #22d3ee)", borderRadius: 2, margin: "0 auto 52px" }} />

        {/* Google button */}
        <button className="google-btn" onClick={handleLogin} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, width: "100%", padding: "15px 24px", background: "#fff", color: "#0f172a", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", transition: "all 0.2s" }}>
          <GoogleIcon />
          Најави се со Google
        </button>

        <div style={{ marginTop: 28, fontSize: 11, color: "#334155", lineHeight: 1.8 }}>
          Твојот профил се користи за табелата на резултати<br/>и за зачувување на историјата на игри.
        </div>

        {/* Decorative tiles */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 36 }}>
          {["С", "К", "Р", "А", "Б", "Л"].map((l, i) => (
            <div key={i} style={{ width: 34, height: 34, background: "linear-gradient(160deg, #f8fafc, #e2e8f0)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#0f172a", boxShadow: "0 3px 8px rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", opacity: 0.6 + i * 0.07 }}>{l}</div>
          ))}
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