import { useState, useEffect } from "react";

/**
 * InviteScreen
 *
 * Fixes:
 * 1. AI players don't need userId — isReady checks type === 'ai'
 * 2. Polls /api/games/:gameId every 3s so joining players appear live
 * 3. Auto-advances when all slots filled
 */
export default function InviteScreen({ gameId, gameState: initialState, onReady, onCancel }) {
  const [gameState, setGameState] = useState(initialState);
  const [copied,    setCopied]    = useState(false);

  function isReady(state) {
    if (!state?.players?.length) return false;
    return state.players.every(p => p.type === "ai" || p.userId);
  }

  // Poll for updates every 3 seconds
  useEffect(() => {
    // If already ready (e.g. all AI game), fire immediately
    if (isReady(initialState)) {
      onReady(initialState);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res  = await fetch(`/api/games/${gameId}`, { credentials: "include" });
        const data = await res.json();
        if (!data.success) return;
        setGameState(data.state);
        if (isReady(data.state)) {
          clearInterval(interval);
          onReady(data.state);
        }
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [gameId]);

  const waitingFor = gameState?.players?.filter(p => p.type === "human" && !p.userId) ?? [];
  const allFilled  = isReady(gameState);
  const inviteUrl  = `${window.location.origin}?join=${gameId}`;

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const S = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(140deg, #0b0f1a 0%, #162032 40%, #1a1210 100%)",
      fontFamily: "'Palatino Linotype','Book Antiqua','Palatino',serif",
      color: "#f0e6d3",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    },
    card: {
      background: "linear-gradient(145deg, #2a1a10, #3a2518)",
      borderRadius: 14,
      border: "1.5px solid rgba(212,175,55,0.25)",
      boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
      padding: "40px 36px",
      maxWidth: 440, width: "100%", textAlign: "center",
    },
    gold: "#d4af37",
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔗</div>
        <h2 style={{ color: S.gold, margin: "0 0 6px", fontSize: 20 }}>Игра создадена!</h2>
        <p style={{ color: "#a89070", fontSize: 12, margin: "0 0 4px" }}>
          Сподели го овој код со останатите играчи:
        </p>

        {/* Invite code */}
        <div onClick={() => copy(gameId)} title="Клик за копирање" style={{
          fontSize: 42, fontFamily: "monospace", letterSpacing: 10,
          color: S.gold, background: "rgba(212,175,55,0.08)",
          border: "1.5px solid rgba(212,175,55,0.25)", borderRadius: 10,
          padding: "16px 24px", margin: "16px 0", cursor: "pointer",
        }}>
          {gameId}
        </div>

        <p style={{ color: "#665040", fontSize: 10, marginBottom: 16 }}>
          {copied ? "✅ Копирано!" : "Клик на кодот за копирање"}
        </p>

        <button onClick={() => copy(inviteUrl)} style={{
          width: "100%", padding: "10px",
          background: "rgba(41,128,185,0.2)",
          border: "1px solid rgba(41,128,185,0.3)",
          borderRadius: 7, color: "#3498db", fontSize: 12,
          cursor: "pointer", fontFamily: "inherit", marginBottom: 20,
        }}>
          📋 Копирај линк за покана
        </button>

        {/* Player slots */}
        <div style={{ marginBottom: 20 }}>
          {gameState?.players?.map((p, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", marginBottom: 6, borderRadius: 8,
              background: (p.userId || p.type === "ai") ? "rgba(46,204,113,0.08)" : "rgba(0,0,0,0.2)",
              border: (p.userId || p.type === "ai")
                ? "1px solid rgba(46,204,113,0.2)"
                : "1px dashed rgba(255,255,255,0.1)",
            }}>
              <span style={{ fontSize: 14 }}>
                {p.type === "ai" ? "🤖" : p.userId ? "✅" : "⏳"}
              </span>
              <span style={{ fontSize: 12, color: (p.userId || p.type === "ai") ? "#f0e6d3" : "#665040" }}>
                {p.displayName || (p.type === "human" ? "Чека играч..." : "")}
              </span>
              {i === 0 && <span style={{ marginLeft: "auto", fontSize: 9, color: "#665040" }}>ти</span>}
            </div>
          ))}
        </div>

        {allFilled ? (
          <button onClick={() => onReady(gameState)} style={{
            width: "100%", padding: 14,
            background: "linear-gradient(135deg, #1e8449, #27ae60)",
            border: "none", borderRadius: 7, color: "#fff",
            fontSize: 15, cursor: "pointer", fontFamily: "inherit",
            fontWeight: 600, letterSpacing: 2,
          }}>
            ЗАПОЧНИ ИГРА 🎲
          </button>
        ) : (
          <div style={{ color: "#887060", fontSize: 11 }}>
            <span style={{ marginRight: 6 }}>⏳</span>
            Чека {waitingFor.length} играч{waitingFor.length > 1 ? "и" : ""} да се приклучат...
            <div style={{ marginTop: 16 }}>
              <button onClick={onCancel} style={{
                background: "none", border: "none", color: "#665040",
                fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                textDecoration: "underline",
              }}>
                Откажи
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}