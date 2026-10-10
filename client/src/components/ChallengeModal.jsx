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
  const palette = {
    shell: "rgba(41, 43, 41, 0.18)",
    cardBg: "var(--card)",
    cardBorder: "var(--border)",
    cardShadow: "var(--surface-shadow)",
    title: "var(--primary)",
    text: "var(--foreground)",
    subText: "var(--muted-foreground)",
    accentSoft: "var(--secondary)",
    success: "var(--primary)",
    warning: "oklch(0.79 0.08 36)",
    danger: "oklch(0.66 0.12 24)",
  };

  const actionButton = (bg, fg = "#fff") => ({
    ...theme.btn(bg),
    color: fg,
    border: "1px solid transparent",
    boxShadow: "0 4px 12px oklch(0.32 0.04 150 / 0.12)",
    transition: "transform 0.15s ease, boxShadow 0.15s ease",
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: palette.shell,
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: palette.cardBg,
          border: `1px solid ${palette.cardBorder}`,
          borderRadius: 18,
          boxShadow: palette.cardShadow,
          width: "min(440px, calc(100vw - 32px))",
          padding: 28,
          position: "relative",
          color: palette.text,
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
            border: "1px solid var(--border)",
            background: "var(--muted)",
            color: "var(--muted-foreground)",
            fontSize: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>

        {!challengeResult && !isValidating && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 10,
                color: palette.title,
                fontWeight: 800,
                marginBottom: 8,
                letterSpacing: 2.2,
                textTransform: "uppercase",
              }}
            >
              ⚖️ Одлука — {opponentNames}
            </div>
            <div
              style={{
                fontSize: 11,
                color: palette.subText,
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              {players[currentPlayer].name} постави зборови. Прифати или
              предизвикај:
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                justifyContent: "center",
                flexWrap: "wrap",
                marginBottom: 18,
              }}
            >
              {formedWords.map((w, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    borderRadius: 10,
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    boxShadow: "0 2px 8px oklch(0.3 0.03 150 / 0.08)",
                  }}
                >
                  <span
                    style={{
                      padding: "7px 12px",
                      background: "var(--secondary)",
                      fontSize: 13,
                      color: "var(--primary)",
                      fontWeight: 800,
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
                      borderRadius: 0,
                      border: "none",
                      padding: "7px 9px",
                      background: "var(--muted)",
                      color: "var(--primary)",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                    title="Инфо"
                  >
                    📖
                  </button>
                  <button
                    onClick={() => challengeWord(w.word)}
                    style={{
                      borderRadius: 0,
                      border: "none",
                      padding: "7px 10px",
                      background: "oklch(0.82 0.085 18)",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    🔍
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => finalizeTurn()}
              style={actionButton(
                "linear-gradient(135deg, var(--primary), oklch(0.59 0.065 151))",
              )}
            >
              ✅ Прифати ({turnScore} п.)
            </button>
            {isLoadingInfo && (
              <div
                style={{
                  color: "var(--primary)",
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
              color: "var(--primary)",
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
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
                background: "var(--muted)",
                border: `1px solid ${
                  challengeResult.valid
                    ? "oklch(0.7 0.12 145 / 0.35)"
                    : challengeResult.valid === false
                      ? "oklch(0.66 0.12 24 / 0.35)"
                      : "oklch(0.79 0.08 36 / 0.35)"
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
                  fontWeight: 800,
                  fontFamily: "'Space Mono', monospace",
                  color: challengeResult.valid
                    ? "var(--primary)"
                    : challengeResult.valid === false
                      ? palette.danger
                      : palette.warning,
                  marginBottom: 6,
                }}
              >
                {challengeResult.word}
              </div>
              <div style={{ fontSize: 11, color: palette.subText }}>
                {challengeResult.explanation}
              </div>
              {challengeResult.definition && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted-foreground)",
                    fontStyle: "italic",
                    marginTop: 6,
                  }}
                >
                  📖 {challengeResult.definition}
                </div>
              )}
              {challengeResult.valid === true && (
                <div
                  style={{
                    fontSize: 10,
                    color: palette.warning,
                    marginTop: 8,
                    fontWeight: 700,
                  }}
                >
                  ⚠️ {opponentNames} го губи следниот ред!
                </div>
              )}
              {challengeResult.valid === false && (
                <div
                  style={{
                    fontSize: 10,
                    color: palette.danger,
                    marginTop: 8,
                    fontWeight: 700,
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
                    style={actionButton(
                      "linear-gradient(135deg, var(--primary), oklch(0.59 0.065 151))",
                    )}
                  >
                    Продолжи
                  </button>
                  <button
                    onClick={() => requestWordInfo(challengeResult.word)}
                    style={{
                      ...theme.btnO,
                      borderColor: "var(--border)",
                      color: "var(--primary)",
                    }}
                  >
                    📖 Инфо
                  </button>
                </>
              )}
              {challengeResult.valid === false && (
                <button
                  onClick={onClose}
                  style={actionButton(
                    "linear-gradient(135deg, oklch(0.76 0.08 36), oklch(0.68 0.1 24))",
                  )}
                >
                  🔄 Врати плочки
                </button>
              )}
              {challengeResult.valid === null && (
                <>
                  <button
                    onClick={onClose}
                    style={actionButton(
                      "linear-gradient(135deg, var(--primary), oklch(0.59 0.065 151))",
                    )}
                  >
                    Прифати
                  </button>
                  <button
                    onClick={onRetry}
                    style={actionButton(
                      "linear-gradient(135deg, oklch(0.76 0.08 36), oklch(0.68 0.1 24))",
                    )}
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
