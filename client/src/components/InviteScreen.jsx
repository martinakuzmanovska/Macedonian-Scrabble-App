import { useState, useEffect } from "react";

export default function InviteScreen({ gameId, gameState: initialState, onReady, onCancel }) {
  const [gameState, setGameState] = useState(initialState);
  const [copied,    setCopied]    = useState(false);

  function isReady(state) {
    if (!state?.players?.length) return false;
    return state.players.every(p => p.type === "ai" || p.userId);
  }

  useEffect(() => {
    if (isReady(initialState)) { onReady(initialState); return; }
    const interval = setInterval(async () => {
      try {
        const res  = await fetch(`/api/games/${gameId}`, { credentials: "include" });
        const data = await res.json();
        if (!data.success) return;
        setGameState(data.state);
        if (isReady(data.state)) { clearInterval(interval); onReady(data.state); }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [gameId]);

  const waitingFor = gameState?.players?.filter(p => p.type === "human" && !p.userId) ?? [];
  const allFilled  = isReady(gameState);
  const inviteUrl  = `${window.location.origin}?join=${gameId}`;

  const copy = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div style={{ minHeight: "100vh", background: "#080b14", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap');
        @keyframes pulse-glow { 0%,100%{opacity:0.3} 50%{opacity:0.6} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .copy-btn:hover { background: rgba(99,102,241,0.15) !important; border-color: rgba(99,102,241,0.4) !important; }
        .code-block:hover { background: rgba(99,102,241,0.1) !important; }
      `}</style>

      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "20%", left: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)", animation: "pulse-glow 5s ease-in-out infinite", pointerEvents: "none" }} />

      <div style={{ background: "rgba(14,19,31,0.95)", backdropFilter: "blur(12px)", borderRadius: 20, border: "1px solid rgba(99,102,241,0.18)", boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)", padding: "44px 40px", maxWidth: 460, width: "100%", textAlign: "center", position: "relative", zIndex: 1, animation: "fadeIn 0.3s ease" }}>

        <div style={{ fontSize: 10, color: "#6366f1", letterSpacing: 5, fontWeight: 600, marginBottom: 8, textTransform: "uppercase" }}>Игра Создадена</div>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700 }}>Покани играчи</h2>
        <p style={{ color: "#475569", fontSize: 12, margin: "0 0 28px" }}>Сподели го овој код или линкот за покана</p>

        {/* Invite code */}
        <div className="code-block" onClick={() => copy(gameId)} title="Клик за копирање"
          style={{ fontFamily: "'Space Mono',monospace", fontSize: 44, letterSpacing: 12, color: "#a5b4fc", background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 14, padding: "18px 24px", margin: "0 0 8px", cursor: "pointer", transition: "background 0.15s", userSelect: "none" }}>
          {gameId}
        </div>
        <div style={{ fontSize: 10, color: copied ? "#10b981" : "#334155", marginBottom: 20, transition: "color 0.2s" }}>
          {copied ? "✅ Копирано!" : "Клик за копирање на кодот"}
        </div>

        <button className="copy-btn" onClick={() => copy(inviteUrl)}
          style={{ width: "100%", padding: "10px", background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.2)", borderRadius: 10, color: "#22d3ee", fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginBottom: 24, transition: "all 0.15s", fontWeight: 600 }}>
          📋 Копирај линк за покана
        </button>

        {/* Player slots */}
        <div style={{ marginBottom: 24, textAlign: "left" }}>
          <div style={{ fontSize: 10, color: "#334155", letterSpacing: 2, fontWeight: 600, marginBottom: 10, textTransform: "uppercase" }}>Играчи</div>
          {gameState?.players?.map((p, i) => {
            const joined = p.userId || p.type === "ai";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 6, borderRadius: 10, background: joined ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.02)", border: joined ? "1px solid rgba(16,185,129,0.2)" : "1px dashed rgba(255,255,255,0.08)", transition: "all 0.3s" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: joined ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                  {p.type === "ai" ? "🤖" : p.userId ? "✅" : "⏳"}
                </div>
                <span style={{ fontSize: 12, color: joined ? "#f1f5f9" : "#334155", flex: 1, fontWeight: joined ? 500 : 400 }}>
                  {p.displayName || (p.type === "human" ? "Чека играч..." : "")}
                </span>
                {i === 0 && <span style={{ fontSize: 9, color: "#334155", fontWeight: 600, letterSpacing: 1 }}>ТИ</span>}
                {joined && i !== 0 && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />}
              </div>
            );
          })}
        </div>

        {allFilled ? (
          <button onClick={() => onReady(gameState)}
            style={{ width: "100%", padding: "14px 24px", background: "linear-gradient(135deg, #10b981, #059669)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, letterSpacing: 1, boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}>
            Започни Игра 🎲
          </button>
        ) : (
          <div style={{ color: "#334155", fontSize: 12 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "rgba(245,158,11,0.06)", borderRadius: 10, border: "1px solid rgba(245,158,11,0.15)", marginBottom: 16 }}>
              <div style={{ width: 14, height: 14, border: "2px solid rgba(245,158,11,0.3)", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <span style={{ color: "#f59e0b", fontSize: 11, fontWeight: 500 }}>Чека {waitingFor.length} играч{waitingFor.length > 1 ? "и" : ""} да се приклучат...</span>
            </div>
            <div>
              <button onClick={onCancel} style={{ background: "none", border: "none", color: "#334155", fontSize: 11, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
                Откажи
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}