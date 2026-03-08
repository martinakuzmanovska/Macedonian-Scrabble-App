import { useState } from "react";

/**
 * Lobby
 *
 * Shown after login, before a game starts.
 * Lets the user:
 *   - Create a new game (1-3 extra players, human or AI)
 *   - Join an existing game via invite code
 *
 * Props:
 *   user        — the logged-in user from useAuth
 *   onCreate    — async (players) => void
 *   onJoin      — async (gameId) => void
 *   onLogout    — () => void
 *   loading     — bool
 *   error       — string | null
 */
export default function Lobby({ user, onCreate, onJoin, onLogout, loading, error }) {
  const [tab,          setTab]          = useState("create"); // "create" | "join"
  const [inviteCode,   setInviteCode]   = useState("");
  const [extraPlayers, setExtraPlayers] = useState([
    { name: "Играч 2", age: 25, type: "human" },
  ]);

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
      padding: "36px 32px",
      maxWidth: 500,
      width: "100%",
    },
    gold: "#d4af37",
    btn: (bg) => ({
      padding: "10px 22px", background: bg, color: "#fff",
      border: "none", borderRadius: 7, fontSize: 14,
      cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
    }),
    btnO: {
      padding: "10px 22px", background: "transparent", color: "#d4af37",
      border: "1.5px solid rgba(212,175,55,0.4)", borderRadius: 7,
      fontSize: 14, cursor: "pointer", fontFamily: "inherit",
    },
  };

  const getDiff = (age) =>
    age <= 8  ? { l: "Лесно",  c: "#2ecc71", e: "🌱" } :
    age <= 12 ? { l: "Средно", c: "#f39c12", e: "⚡" } :
    age <= 17 ? { l: "Тешко",  c: "#e67e22", e: "🔥" } :
                { l: "Експерт",c: "#e74c3c", e: "💀" };

  const handleCreate = () => {
    // Player 0 is always the logged-in user
    const players = [
      { name: user.displayName, age: 25, type: "human", userId: user.id, avatar: user.avatar },
      ...extraPlayers,
    ];
    onCreate(players);
  };

  const handleJoin = () => {
    if (inviteCode.trim()) onJoin(inviteCode.trim().toUpperCase());
  };

  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 26, letterSpacing: 4, color: S.gold, fontWeight: 700 }}>СКРАБЛ</div>
            <div style={{ fontSize: 10, color: "#665040", letterSpacing: 2 }}>МАКЕДОНСКО ИЗДАНИЕ</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {user.avatar && (
              <img src={user.avatar} alt="" style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid rgba(212,175,55,0.3)" }} />
            )}
            <div>
              <div style={{ fontSize: 11, color: "#a89070" }}>{user.displayName}</div>
              <button onClick={onLogout} style={{ background: "none", border: "none", color: "#665040", fontSize: 9, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
                Одјави се
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {["create", "join"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "8px", borderRadius: 6, fontSize: 12, cursor: "pointer",
              fontFamily: "inherit", border: "none", fontWeight: 600,
              background: tab === t ? S.gold : "rgba(255,255,255,0.06)",
              color: tab === t ? "#1a0e08" : "#a89070",
            }}>
              {t === "create" ? "🎮 Нова игра" : "🔗 Приклучи се"}
            </button>
          ))}
        </div>

        {/* ── Create tab ── */}
        {tab === "create" && (
          <div>
            {/* Creator (read-only) */}
            <div style={{ padding: "10px 14px", marginBottom: 8, background: "rgba(212,175,55,0.08)", borderRadius: 8, border: "1px solid rgba(212,175,55,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
              {user.avatar && <img src={user.avatar} alt="" style={{ width: 28, height: 28, borderRadius: "50%" }} />}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: S.gold }}>{user.displayName}</div>
                <div style={{ fontSize: 9, color: "#665040" }}>Ти (Играч 1)</div>
              </div>
            </div>

            {/* Extra players */}
            {extraPlayers.map((sp, i) => {
              const d = getDiff(sp.age);
              return (
                <div key={i} style={{ padding: 12, marginBottom: 8, background: sp.type === "ai" ? "rgba(41,128,185,0.1)" : "rgba(0,0,0,0.2)", borderRadius: 10, border: sp.type === "ai" ? "1px solid rgba(41,128,185,0.3)" : "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                    <input
                      value={sp.name}
                      onChange={e => { const s = [...extraPlayers]; s[i] = { ...s[i], name: e.target.value }; setExtraPlayers(s); }}
                      style={{ flex: 1, padding: "7px 10px", background: "#0d0a08", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 6, color: "#f0e6d3", fontSize: 13, fontFamily: "inherit" }}
                    />
                    {extraPlayers.length > 1 && (
                      <button onClick={() => setExtraPlayers(extraPlayers.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 16 }}>✕</button>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 3 }}>
                      {["human", "ai"].map(t => (
                        <button key={t} onClick={() => { const s = [...extraPlayers]; s[i] = { ...s[i], type: t, name: t === "ai" && !s[i].name.includes("🤖") ? `🤖 AI ${i + 2}` : s[i].name }; setExtraPlayers(s); }}
                          style={{ padding: "4px 10px", borderRadius: 5, fontSize: 11, cursor: "pointer", fontFamily: "inherit", border: "none", fontWeight: 600, background: sp.type === t ? (t === "ai" ? "#2980b9" : S.gold) : "rgba(255,255,255,0.08)", color: sp.type === t ? (t === "ai" ? "#fff" : "#1a0e08") : "#a89070" }}>
                          {t === "human" ? "👤 Човек" : "🤖 AI"}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, minWidth: 150 }}>
                      <span style={{ fontSize: 9, color: "#887060" }}>Возраст:</span>
                      <input type="range" min="5" max="60" value={sp.age}
                        onChange={e => { const s = [...extraPlayers]; s[i] = { ...s[i], age: parseInt(e.target.value) }; setExtraPlayers(s); }}
                        style={{ flex: 1, accentColor: d.c }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: d.c, minWidth: 20 }}>{sp.age}</span>
                    </div>
                    {sp.type === "ai" && (
                      <span style={{ fontSize: 10, color: d.c, fontWeight: 600, background: `${d.c}15`, padding: "2px 6px", borderRadius: 4 }}>{d.e} {d.l}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add player button */}
            {extraPlayers.length < 3 && (
              <button
                onClick={() => setExtraPlayers([...extraPlayers, { name: `Играч ${extraPlayers.length + 2}`, age: 25, type: "human" }])}
                style={{ width: "100%", padding: 8, background: "transparent", border: "1.5px dashed rgba(212,175,55,0.3)", borderRadius: 8, color: S.gold, fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>
                + Додади играч
              </button>
            )}

            {error && <div style={{ color: "#e74c3c", fontSize: 11, marginBottom: 10, textAlign: "center" }}>{error}</div>}

            <button onClick={handleCreate} disabled={loading}
              style={{ ...S.btn("linear-gradient(135deg, #8b2500, #cd3700)"), width: "100%", padding: 14, fontSize: 15, letterSpacing: 2, opacity: loading ? 0.6 : 1 }}>
              {loading ? "Се создава..." : "ЗАПОЧНИ 🎲"}
            </button>
          </div>
        )}

        {/* ── Join tab ── */}
        {tab === "join" && (
          <div>
            <div style={{ fontSize: 12, color: "#a89070", marginBottom: 16, lineHeight: 1.6 }}>
              Внеси го кодот за покана кој го добил од другиот играч.
            </div>
            <input
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())}
              placeholder="пр. XK9MQ2"
              maxLength={8}
              style={{ width: "100%", padding: "12px 14px", background: "#0d0a08", border: "1.5px solid rgba(212,175,55,0.3)", borderRadius: 8, color: "#f0e6d3", fontSize: 18, fontFamily: "monospace", letterSpacing: 4, textAlign: "center", marginBottom: 12, boxSizing: "border-box" }}
            />
            {error && <div style={{ color: "#e74c3c", fontSize: 11, marginBottom: 10, textAlign: "center" }}>{error}</div>}
            <button onClick={handleJoin} disabled={loading || !inviteCode.trim()}
              style={{ ...S.btn("linear-gradient(135deg, #1a5276, #2980b9)"), width: "100%", padding: 14, fontSize: 15, letterSpacing: 2, opacity: (loading || !inviteCode.trim()) ? 0.5 : 1 }}>
              {loading ? "Се приклучува..." : "ПРИКЛУЧИ СЕ 🔗"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}