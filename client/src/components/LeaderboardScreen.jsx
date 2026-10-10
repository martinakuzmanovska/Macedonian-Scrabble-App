export default function LeaderboardScreen({ leaderboard, onBack }) {
  return (
    <div className="scrabble-page scrabble-page--centered">
      <div
        className="scrabble-card"
        style={{
          padding: "36px 32px",
          maxWidth: 580,
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: "var(--scrabble-accent)",
                letterSpacing: 4,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              РАНГИРАЊЕ
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
              Табла на Најдобри
            </h2>
          </div>
          <button
            className="scrabble-button scrabble-button--outline"
            onClick={onBack}
            style={{ padding: "6px 16px", fontSize: 12 }}
          >
            ← Назад
          </button>
        </div>

        {!leaderboard.length ? (
          <div
            style={{
              textAlign: "center",
              padding: 48,
              color: "var(--scrabble-muted)",
              fontSize: 13,
            }}
          >
            Сè уште нема резултати!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "36px 1fr 60px 60px 50px 50px",
                gap: 8,
                padding: "6px 12px",
                color: "var(--scrabble-muted)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              <span>#</span>
              <span>Играч</span>
              <span style={{ textAlign: "right" }}>Најд.</span>
              <span style={{ textAlign: "right" }}>Прос.</span>
              <span style={{ textAlign: "right" }}>Игри</span>
              <span style={{ textAlign: "right" }}>Поб.</span>
            </div>

            {leaderboard.map((entry, index) => (
              <div
                key={entry.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "36px 1fr 60px 60px 50px 50px",
                  gap: 8,
                  padding: "12px",
                  background:
                    index === 0
                      ? "rgba(99,102,241,0.1)"
                      : "rgba(255,255,255,0.02)",
                  borderRadius: 10,
                  border:
                    index === 0
                      ? "1px solid rgba(99,102,241,0.25)"
                      : "1px solid rgba(255,255,255,0.04)",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 16 }}>
                  {index === 0 ? (
                    "🥇"
                  ) : index === 1 ? (
                    "🥈"
                  ) : index === 2 ? (
                    "🥉"
                  ) : (
                    <span
                      style={{ color: "var(--scrabble-muted)", fontSize: 12 }}
                    >
                      {index + 1}
                    </span>
                  )}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {entry.name}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--scrabble-muted)",
                      marginTop: 1,
                    }}
                  >
                    возраст: {entry.age}
                  </div>
                </div>
                <span
                  style={{
                    textAlign: "right",
                    color: "#a5b4fc",
                    fontWeight: 700,
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  {entry.bestScore}
                </span>
                <span
                  style={{
                    textAlign: "right",
                    color: "var(--scrabble-muted)",
                    fontSize: 12,
                  }}
                >
                  {entry.avgScore}
                </span>
                <span
                  style={{
                    textAlign: "right",
                    color: "var(--scrabble-muted)",
                    fontSize: 12,
                  }}
                >
                  {entry.totalGames}
                </span>
                <span
                  style={{
                    textAlign: "right",
                    color: "var(--scrabble-muted)",
                    fontSize: 12,
                  }}
                >
                  {entry.wins}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
