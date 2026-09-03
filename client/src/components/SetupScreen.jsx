function getDifficulty(age) {
  if (age <= 8) return { label: "Лесно", color: "#10b981", emoji: "🌱" };
  if (age <= 12) return { label: "Средно", color: "#f59e0b", emoji: "⚡" };
  if (age <= 17) return { label: "Тешко", color: "#f97316", emoji: "🔥" };
  return { label: "Експерт", color: "#ef4444", emoji: "💀" };
}

export default function SetupScreen({
  styles,
  players,
  setPlayers,
  onBack,
  onStart,
}) {
  const updatePlayer = (index, patch) => {
    setPlayers((current) =>
      current.map((player, playerIndex) =>
        playerIndex === index ? { ...player, ...patch } : player,
      ),
    );
  };

  const setPlayerType = (index, type) => {
    setPlayers((current) =>
      current.map((player, playerIndex) => {
        if (playerIndex !== index) return player;
        return {
          ...player,
          type,
          name:
            type === "ai" && !player.name.includes("🤖")
              ? `🤖 AI ${index + 1}`
              : player.name,
        };
      }),
    );
  };

  const removePlayer = (index) => {
    setPlayers((current) => current.filter((_, playerIndex) => playerIndex !== index));
  };

  const addPlayer = () => {
    setPlayers((current) => [
      ...current,
      { name: `Играч ${current.length + 1}`, age: 25, type: "human" },
    ]);
  };

  return (
    <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap');`}</style>
      <div style={{ ...styles.card, padding: "36px 32px", maxWidth: 520, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 10, color: styles.accent, letterSpacing: 4, fontWeight: 600, marginBottom: 4 }}>КОНФИГУРАЦИЈА</div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Подготовка на Игра</h2>
          </div>
          <button onClick={onBack} style={{ ...styles.btnO, padding: "6px 16px", fontSize: 12 }}>← Назад</button>
        </div>

        {players.map((player, index) => {
          const difficulty = getDifficulty(player.age);
          return (
            <div key={index} style={{ padding: 16, marginBottom: 10, background: player.type === "ai" ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.02)", borderRadius: 12, border: player.type === "ai" ? "1px solid rgba(99,102,241,0.2)" : "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
                <div style={{ fontSize: 11, color: styles.muted, fontWeight: 600, minWidth: 60 }}>Играч {index + 1}</div>
                <input value={player.name} onChange={(event) => updatePlayer(index, { name: event.target.value })} style={{ flex: 1, padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f1f5f9", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                {players.length > 2 && (
                  <button onClick={() => removePlayer(index)} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", cursor: "pointer", borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✕</button>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 2, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 3 }}>
                  {["human", "ai"].map((type) => (
                    <button key={type} onClick={() => setPlayerType(index, type)} style={{ padding: "5px 14px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "inherit", border: "none", background: player.type === type ? type === "ai" ? "#6366f1" : "#10b981" : "transparent", color: player.type === type ? "#fff" : styles.muted, fontWeight: 600, transition: "all 0.15s" }}>
                      {type === "human" ? "👤 Човек" : "🤖 AI"}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 180 }}>
                  <span style={{ fontSize: 10, color: styles.muted, whiteSpace: "nowrap" }}>Возраст:</span>
                  <input type="range" min="5" max="60" value={player.age} onChange={(event) => updatePlayer(index, { age: Number.parseInt(event.target.value, 10) })} style={{ flex: 1, accentColor: difficulty.color, height: 4 }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: difficulty.color, minWidth: 22, fontFamily: "'Space Mono', monospace" }}>{player.age}</span>
                </div>
                {player.type === "ai" && <span style={{ fontSize: 10, color: difficulty.color, fontWeight: 600, background: `${difficulty.color}18`, padding: "3px 8px", borderRadius: 6 }}>{difficulty.emoji} {difficulty.label}</span>}
              </div>
            </div>
          );
        })}

        {players.length < 4 && <button onClick={addPlayer} style={{ width: "100%", padding: 10, background: "transparent", border: "1.5px dashed rgba(99,102,241,0.25)", borderRadius: 10, color: styles.accent, fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginBottom: 12, transition: "all 0.15s" }}>+ Додади Играч</button>}
        <button onClick={onStart} style={{ ...styles.btn("linear-gradient(135deg, #6366f1, #4f46e5)"), width: "100%", padding: "14px 24px", fontSize: 15, letterSpacing: 1, marginTop: 4 }}>Започни Игра 🎲</button>
      </div>
    </div>
  );
}
