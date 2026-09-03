export default function GameOverScreen({
  players,
  endBonuses,
  styles,
  message,
  gameLog,
  onNewGame,
  onOpenLeaderboard,
}) {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    
      return (
      <div
        style={{
          ...styles.page,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap');`}</style>
        <div
          style={{
            ...styles.card,
            padding: "44px 36px",
            maxWidth: 580,
            width: "100%",
            textAlign: "center",
            maxHeight: "95vh",
            overflow: "auto",
          }}
        >
          <div style={{ fontSize: 52, marginBottom: 10 }}>🏆</div>
          <div
            style={{
              fontSize: 10,
              color: styles.accent,
              letterSpacing: 4,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            КРАЈ НА ИГРАТА
          </div>
          <h2 style={{ fontSize: 24, margin: "0 0 6px", fontWeight: 700 }}>
            {message}
          </h2>

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
              margin: "24px 0",
            }}
          >
            {sorted.map((p, i) => (
              <div
                key={i}
                style={{
                  padding: "16px 24px",
                  borderRadius: 14,
                  minWidth: 100,
                  background:
                    i === 0
                      ? "rgba(99,102,241,0.12)"
                      : "rgba(255,255,255,0.03)",
                  border:
                    i === 0
                      ? "1px solid rgba(99,102,241,0.35)"
                      : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                </div>
                <div style={{ fontSize: 11, color: styles.muted, marginBottom: 4 }}>
                  {p.type === "ai" ? "🤖 " : ""}
                  {p.name}
                </div>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 28,
                    fontWeight: 700,
                    color: i === 0 ? "#a5b4fc" : "#f1f5f9",
                  }}
                >
                  {p.score}
                </div>
              </div>
            ))}
          </div>

          {endBonuses && (
            <div
              style={{
                marginBottom: 20,
                padding: 16,
                background: "rgba(99,102,241,0.05)",
                borderRadius: 12,
                border: "1px solid rgba(99,102,241,0.15)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: styles.accent,
                  fontWeight: 700,
                  marginBottom: 12,
                  letterSpacing: 2,
                }}
              >
                🎖️ БОНУС НАГРАДИ
              </div>
              {endBonuses.longestPlayers.length > 0 && (
                <div
                  style={{
                    marginBottom: 10,
                    padding: 10,
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "#22d3ee",
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    📏 НАЈДОЛГ ЗБОР → +{endBonuses.longestPlayers[0].bonus}{" "}
                    поени
                  </div>
                  {endBonuses.longestPlayers.map((lp, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 12 }}>{lp.name}</span>
                      <span
                        style={{
                          padding: "2px 10px",
                          background: "rgba(34,211,238,0.15)",
                          borderRadius: 6,
                          fontSize: 13,
                          color: "#22d3ee",
                          fontWeight: 700,
                          fontFamily: "'Space Mono', monospace",
                          letterSpacing: 2,
                        }}
                      >
                        {lp.word}
                      </span>
                      <span style={{ color: styles.muted, fontSize: 10 }}>
                        ({lp.len} букви)
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {endBonuses.bestScorePlayers.length > 0 && (
                <div
                  style={{
                    padding: 10,
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "#f59e0b",
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    🔥 НАЈМНОГУ ПОЕНИ ВО ПОТЕГ → +
                    {endBonuses.bestScorePlayers[0].bonus} поени
                  </div>
                  {endBonuses.bestScorePlayers.map((bp, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 12 }}>{bp.name}</span>
                      <span
                        style={{
                          padding: "2px 10px",
                          background: "rgba(245,158,11,0.15)",
                          borderRadius: 6,
                          fontSize: 13,
                          color: "#f59e0b",
                          fontWeight: 700,
                        }}
                      >
                        {bp.word}
                      </span>
                      <span style={{ color: styles.muted, fontSize: 10 }}>
                        ({bp.score} п.)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div
            style={{
              maxHeight: 100,
              overflow: "auto",
              textAlign: "left",
              background: "rgba(0,0,0,0.2)",
              borderRadius: 10,
              padding: "10px 12px",
              marginBottom: 20,
            }}
          >
            {gameLog.map((e, i) => (
              <div
                key={i}
                style={{
                  color: styles.muted,
                  fontSize: 10,
                  marginBottom: 2,
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                {e}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={onNewGame}
              style={styles.btn("linear-gradient(135deg, #6366f1, #4f46e5)")}
            >
              🔄 Нова Игра
            </button>
            <button
              onClick={onOpenLeaderboard}
              style={styles.btnO}
            >
              🏆 Табла
            </button>
          </div>
        </div>
      </div>
    );
}
