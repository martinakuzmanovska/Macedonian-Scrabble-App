export default function LeaderboardModal({ leaderboard, onClose, onBack }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(41, 43, 41, 0.16)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 18,
          boxShadow: "var(--surface-shadow)",
          padding: "36px 32px",
          maxWidth: 580,
          width: "100%",
          color: "var(--foreground)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: "var(--primary)",
                letterSpacing: 4,
                fontWeight: 800,
                marginBottom: 4,
                textTransform: "uppercase",
              }}
            >
              Рангување
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                color: "var(--foreground)",
              }}
            >
              Табла на Најдобри
            </h2>
          </div>

          <button
            onClick={onBack || onClose}
            style={{
              background: "var(--secondary)",
              border: "1px solid var(--border)",
              color: "var(--primary)",
              borderRadius: 10,
              padding: "8px 16px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            ← Назад
          </button>
        </div>

        {!leaderboard.length ? (
          <div
            style={{
              textAlign: "center",
              padding: 48,
              color: "var(--muted-foreground)",
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
                color: "var(--muted-foreground)",
                fontSize: 10,
                fontWeight: 700,
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
                    index === 0 ? "var(--secondary)" : "rgba(255,255,255,0.02)",
                  borderRadius: 12,
                  border:
                    index === 0
                      ? "1px solid rgba(122, 130, 233, 0.28)"
                      : "1px solid var(--border)",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700 }}>
                  {index === 0
                    ? "🥇"
                    : index === 1
                      ? "🥈"
                      : index === 2
                        ? "🥉"
                        : index + 1}
                </span>

                <span
                  style={{
                    fontWeight: 700,
                    color: "var(--foreground)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {entry.name}
                </span>

                <span style={{ textAlign: "right", fontWeight: 700 }}>
                  {entry.bestScore ?? 0}
                </span>
                <span
                  style={{
                    textAlign: "right",
                    color: "var(--muted-foreground)",
                  }}
                >
                  {entry.avgScore ?? 0}
                </span>
                <span
                  style={{
                    textAlign: "right",
                    color: "var(--muted-foreground)",
                  }}
                >
                  {entry.totalGames ?? 0}
                </span>
                <span
                  style={{
                    textAlign: "right",
                    fontWeight: 700,
                    color: "var(--primary)",
                  }}
                >
                  {entry.wins ?? 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
