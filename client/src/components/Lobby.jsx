import { useState } from "react";

export default function Lobby({ user, onCreate, onJoin, onLogout, loading, error }) {
  const [tab,          setTab]          = useState("create");
  const [inviteCode,   setInviteCode]   = useState("");
  const [extraPlayers, setExtraPlayers] = useState([
    { name: "Играч 2", age: 25, type: "human" },
  ]);

  const getDiff = (age) =>
    age <= 8  ? { l: "Лесно",  c: "#10b981", e: "🌱" } :
    age <= 12 ? { l: "Средно", c: "#f59e0b", e: "⚡" } :
    age <= 17 ? { l: "Тешко",  c: "#f97316", e: "🔥" } :
                { l: "Експерт",c: "#ef4444", e: "💀" };

  const handleCreate = () => {
    const players = [
      { name: user.displayName, age: 25, type: "human", userId: user.id, avatar: user.avatar },
      ...extraPlayers,
    ];
    onCreate(players);
  };

  const handleJoin = () => {
    if (inviteCode.trim()) onJoin(inviteCode.trim());
  };

  const card = { background: "rgba(14,19,31,0.95)", backdropFilter: "blur(12px)", borderRadius: 20, border: "1px solid rgba(99,102,241,0.18)", boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)" };
  const btn  = (bg) => ({ padding: "10px 22px", background: bg, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, transition: "all 0.15s" });
  const btnO = { padding: "10px 22px", background: "transparent", color: "#6366f1", border: "1.5px solid rgba(99,102,241,0.35)", borderRadius: 10, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 };

  return (
    <div style={{ minHeight: "100vh", background: "#080b14", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap');
        @keyframes pulse-glow { 0%,100%{opacity:0.3} 50%{opacity:0.6} }
        input:focus { outline: none; border-color: rgba(99,102,241,0.5) !important; }
        input[type=range] { height: 4px; }
      `}</style>

      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "10%", right: "15%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", animation: "pulse-glow 6s ease-in-out infinite", pointerEvents: "none" }} />

      <div style={{ ...card, padding: "36px 32px", maxWidth: 520, width: "100%", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, letterSpacing: 3, background: "linear-gradient(135deg, #f8fafc, #a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>СКРАБЛ</div>
            <div style={{ fontSize: 9, color: "#334155", letterSpacing: 3, marginTop: 2, textTransform: "uppercase" }}>Македонско Издание</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {user.avatar && <img src={user.avatar} alt="" style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid rgba(99,102,241,0.3)" }} />}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>{user.displayName}</div>
              <button onClick={onLogout} style={{ background: "none", border: "none", color: "#334155", fontSize: 10, cursor: "pointer", padding: 0, fontFamily: "inherit", textDecoration: "underline" }}>Одјави се</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 3, marginBottom: 24, background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 3 }}>
          {["create", "join"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "9px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit", border: "none", fontWeight: 600, transition: "all 0.15s", background: tab === t ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "transparent", color: tab === t ? "#fff" : "#475569", boxShadow: tab === t ? "0 2px 8px rgba(99,102,241,0.3)" : "none" }}>
              {t === "create" ? "🎮 Нова Игра" : "🔗 Приклучи се"}
            </button>
          ))}
        </div>

        {/* Create tab */}
        {tab === "create" && (
          <div>
            {/* Creator slot */}
            <div style={{ padding: "10px 14px", marginBottom: 10, background: "rgba(99,102,241,0.08)", borderRadius: 10, border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
              {user.avatar && <img src={user.avatar} alt="" style={{ width: 30, height: 30, borderRadius: "50%" }} />}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#a5b4fc" }}>{user.displayName}</div>
                <div style={{ fontSize: 9, color: "#334155", marginTop: 1 }}>Играч 1 · Ти</div>
              </div>
              <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
            </div>

            {/* Extra players */}
            {extraPlayers.map((sp, i) => {
              const d = getDiff(sp.age);
              return (
                <div key={i} style={{ padding: 14, marginBottom: 8, background: sp.type === "ai" ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.02)", borderRadius: 12, border: sp.type === "ai" ? "1px solid rgba(99,102,241,0.2)" : "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#334155", fontWeight: 600, minWidth: 56 }}>Играч {i+2}</span>
                    <input value={sp.name} onChange={e => { const s=[...extraPlayers]; s[i]={...s[i],name:e.target.value}; setExtraPlayers(s); }}
                      style={{ flex: 1, padding: "7px 11px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f1f5f9", fontSize: 13, fontFamily: "inherit" }} />
                    {extraPlayers.length > 1 && <button onClick={() => setExtraPlayers(extraPlayers.filter((_,idx)=>idx!==i))} style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", cursor: "pointer", borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✕</button>}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 2, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 3 }}>
                      {["human","ai"].map(t => (
                        <button key={t} onClick={() => { const s=[...extraPlayers]; s[i]={...s[i],type:t,name:t==="ai"&&!s[i].name.includes("🤖")?`🤖 AI ${i+2}`:s[i].name}; setExtraPlayers(s); }}
                          style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "inherit", border: "none", fontWeight: 600, transition: "all 0.12s", background: sp.type===t?(t==="ai"?"#6366f1":"#10b981"):"transparent", color: sp.type===t?"#fff":"#475569" }}>
                          {t==="human"?"👤 Човек":"🤖 AI"}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 160 }}>
                      <span style={{ fontSize: 10, color: "#334155" }}>Возраст:</span>
                      <input type="range" min="5" max="60" value={sp.age} onChange={e=>{const s=[...extraPlayers];s[i]={...s[i],age:parseInt(e.target.value)};setExtraPlayers(s);}} style={{ flex: 1, accentColor: d.c }} />
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 13, fontWeight: 700, color: d.c, minWidth: 22 }}>{sp.age}</span>
                    </div>
                    {sp.type==="ai" && <span style={{ fontSize: 10, color: d.c, fontWeight: 600, background: `${d.c}18`, padding: "2px 8px", borderRadius: 6 }}>{d.e} {d.l}</span>}
                  </div>
                </div>
              );
            })}

            {extraPlayers.length < 3 && (
              <button onClick={() => setExtraPlayers([...extraPlayers,{name:`Играч ${extraPlayers.length+2}`,age:25,type:"human"}])}
                style={{ width: "100%", padding: 10, background: "transparent", border: "1.5px dashed rgba(99,102,241,0.2)", borderRadius: 10, color: "#6366f1", fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginBottom: 12, transition: "all 0.15s" }}>
                + Додади Играч
              </button>
            )}

            {error && <div style={{ color: "#f87171", fontSize: 11, marginBottom: 10, textAlign: "center", padding: "6px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8 }}>{error}</div>}

            <button onClick={handleCreate} disabled={loading}
              style={{ ...btn("linear-gradient(135deg, #6366f1, #4f46e5)"), width: "100%", padding: "14px 24px", fontSize: 15, letterSpacing: 1, opacity: loading ? 0.6 : 1 }}>
              {loading ? "Се создава..." : "Започни Игра 🎲"}
            </button>
          </div>
        )}

        {/* Join tab */}
        {tab === "join" && (
          <div>
            <div style={{ fontSize: 12, color: "#475569", marginBottom: 20, lineHeight: 1.7, padding: "12px 14px", background: "rgba(99,102,241,0.05)", borderRadius: 10, border: "1px solid rgba(99,102,241,0.1)" }}>
              🔗 Внеси го кодот за покана кој го добил од другиот играч.
            </div>
            <input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="пр. XK9MQ2" maxLength={8}
              style={{ width: "100%", padding: "14px", background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(99,102,241,0.2)", borderRadius: 10, color: "#f1f5f9", fontSize: 24, fontFamily: "'Space Mono',monospace", letterSpacing: 8, textAlign: "center", marginBottom: 12, boxSizing: "border-box", transition: "border-color 0.2s" }} />

            {error && <div style={{ color: "#f87171", fontSize: 11, marginBottom: 10, textAlign: "center", padding: "6px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8 }}>{error}</div>}

            <button onClick={handleJoin} disabled={loading || !inviteCode.trim()}
              style={{ ...btn("linear-gradient(135deg, #22d3ee, #0891b2)"), width: "100%", padding: "14px 24px", fontSize: 15, letterSpacing: 1, opacity: (loading || !inviteCode.trim()) ? 0.4 : 1 }}>
              {loading ? "Се приклучува..." : "Приклучи се 🔗"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}