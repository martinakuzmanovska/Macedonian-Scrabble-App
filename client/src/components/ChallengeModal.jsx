export default function ChallengeModal({
  theme,
  players,
  currentPlayer,
  formedWords,
  turnScore,
  challengeResult,
  isValidating,
  isLoadingInfo,
  opponentNames,
  requestWordInfo,
  challengeWord,
  finalizeTurn,
  onClose,
  onRetry,
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          ...theme.card,
          width: "min(440px, calc(100vw - 32px))",
          padding: 28,
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 30,
            height: 30,
            borderRadius: 8,
            border: "none",
            background: "rgba(255,255,255,0.06)",
            color: theme.muted,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        {!challengeResult && !isValidating && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 10,
                color: "#f59e0b",
                fontWeight: 700,
                marginBottom: 8,
                letterSpacing: 2,
              }}
            >
              ⚖️ ОДЛУКА — {opponentNames}
            </div>
            <div
              style={{
                fontSize: 11,
                color: theme.muted,
                marginBottom: 16,
              }}
            >
              {players[currentPlayer].name} постави зборови. Прифати или
              предизвикај:
            </div>
            <div
              style={{
                display: "flex",
                gap: 4,
                justifyContent: "center",
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              {formedWords.map((w, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    borderRadius: 8,
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  }}
                >
                  <span
                    style={{
                      padding: "6px 12px",
                      background: "rgba(16,185,129,0.15)",
                      fontSize: 13,
                      color: "#34d399",
                      fontWeight: 700,
                      fontFamily: "'Space Mono', monospace",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {w.word}
                  </span>
                  <button
                    onClick={() => requestWordInfo(w.word)}
                    style={{
                      ...theme.btnSm("rgba(99,102,241,0.2)"),
                      borderRadius: 0,
                      color: "#a5b4fc",
                      padding: "6px 8px",
                    }}
                    title="Инфо"
                  >
                    📖
                  </button>
                  <button
                    onClick={() => challengeWord(w.word)}
                    style={{
                      ...theme.btnSm("rgba(239,68,68,0.6)"),
                      borderRadius: 0,
                      padding: "6px 10px",
                      color: "#fff",
                    }}
                  >
                    🔍
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => finalizeTurn()}
              style={{
                ...theme.btn("linear-gradient(135deg, #10b981, #059669)"),
                transition: "all 0.2s",
              }}
            >
              ✅ Прифати ({turnScore} п.)
            </button>
            {isLoadingInfo && (
              <div
                style={{
                  color: "#a5b4fc",
                  fontSize: 11,
                  marginTop: 12,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    animation: "aispin 1s linear infinite",
                    marginRight: 4,
                  }}
                >
                  📖
                </span>
                Се вчитува...
              </div>
            )}
          </div>
        )}

        {isValidating && (
          <div
            style={{
              textAlign: "center",
              color: "#a5b4fc",
              fontSize: 12,
              padding: "8px 0",
            }}
          >
            <span
              style={{
                display: "inline-block",
                animation: "aispin 1s linear infinite",
                marginRight: 6,
              }}
            >
              🤖
            </span>
            Агент пребарува во МК речници...
          </div>
        )}

        {challengeResult && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                marginBottom: 12,
                background: "rgba(0,0,0,0.25)",
                border: `1px solid ${
                  challengeResult.valid
                    ? "rgba(16,185,129,0.3)"
                    : challengeResult.valid === false
                      ? "rgba(239,68,68,0.3)"
                      : "rgba(245,158,11,0.3)"
                }`,
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>
                {challengeResult.valid
                  ? "✅"
                  : challengeResult.valid === false
                    ? "❌"
                    : "⚠️"}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'Space Mono', monospace",
                  color: challengeResult.valid
                    ? "#34d399"
                    : challengeResult.valid === false
                      ? "#f87171"
                      : "#fbbf24",
                  marginBottom: 4,
                }}
              >
                {challengeResult.word}
              </div>
              <div style={{ fontSize: 11, color: theme.muted }}>
                {challengeResult.explanation}
              </div>
              {challengeResult.definition && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                    fontStyle: "italic",
                    marginTop: 4,
                  }}
                >
                  📖 {challengeResult.definition}
                </div>
              )}
              {challengeResult.valid === true && (
                <div
                  style={{
                    fontSize: 10,
                    color: "#f59e0b",
                    marginTop: 6,
                    fontWeight: 600,
                  }}
                >
                  ⚠️ {opponentNames} го губи следниот ред!
                </div>
              )}
              {challengeResult.valid === false && (
                <div
                  style={{
                    fontSize: 10,
                    color: "#f87171",
                    marginTop: 6,
                    fontWeight: 600,
                  }}
                >
                  ✅ Успешен предизвик! Плочките се вратени.
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {challengeResult.valid === true && (
                <>
                  <button
                    onClick={onClose}
                    style={theme.btn(
                      "linear-gradient(135deg, #10b981, #059669)",
                    )}
                  >
                    Продолжи
                  </button>
                  <button
                    onClick={() => requestWordInfo(challengeResult.word)}
                    style={theme.btnO}
                  >
                    📖 Инфо
                  </button>
                </>
              )}
              {challengeResult.valid === false && (
                <button
                  onClick={onClose}
                  style={theme.btn("linear-gradient(135deg, #f59e0b, #d97706)")}
                >
                  🔄 Врати плочки
                </button>
              )}
              {challengeResult.valid === null && (
                <>
                  <button
                    onClick={onClose}
                    style={theme.btn(
                      "linear-gradient(135deg, #10b981, #059669)",
                    )}
                  >
                    Прифати
                  </button>
                  <button
                    onClick={onRetry}
                    style={theme.btn("linear-gradient(135deg, #f59e0b, #d97706)")}
                  >
                    🔄 Врати
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
