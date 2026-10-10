export default function WordInfoModal({ wordInfo, onClose }) {
  if (!wordInfo) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "rgba(41, 43, 41, 0.16)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 18,
          boxShadow: "var(--surface-shadow)",
          padding: 28,
          maxWidth: 440,
          width: "100%",
          maxHeight: "80vh",
          overflow: "auto",
          color: "var(--foreground)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9,
                color: "var(--primary)",
                letterSpacing: 3,
                fontWeight: 800,
                marginBottom: 4,
                textTransform: "uppercase",
              }}
            >
              Речник
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: 22,
                fontFamily: "'Space Mono', monospace",
                color: "var(--foreground)",
              }}
            >
              {wordInfo.word}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--muted)",
              border: "1px solid var(--border)",
              color: "var(--muted-foreground)",
              fontSize: 18,
              cursor: "pointer",
              borderRadius: 8,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {wordInfo.partOfSpeech && (
          <div
            style={{
              display: "inline-block",
              padding: "4px 10px",
              background: "var(--secondary)",
              borderRadius: 6,
              fontSize: 10,
              color: "var(--primary)",
              fontWeight: 700,
              marginBottom: 14,
              letterSpacing: 1,
            }}
          >
            {wordInfo.partOfSpeech.toUpperCase()}
          </div>
        )}

        {wordInfo.definition && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 9,
                color: "var(--muted-foreground)",
                marginBottom: 4,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Дефиниција
            </div>
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "var(--foreground)",
              }}
            >
              {wordInfo.definition}
            </div>
          </div>
        )}

        {wordInfo.etymology && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 9,
                color: "var(--muted-foreground)",
                marginBottom: 4,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Етимологија
            </div>
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.5,
                color: "var(--muted-foreground)",
              }}
            >
              {wordInfo.etymology}
            </div>
          </div>
        )}

        {wordInfo.examples?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 9,
                color: "var(--muted-foreground)",
                marginBottom: 4,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Примери
            </div>
            {wordInfo.examples.map((ex, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  color: "var(--muted-foreground)",
                  fontStyle: "italic",
                  marginBottom: 4,
                  paddingLeft: 8,
                  borderLeft: "2px solid var(--border)",
                }}
              >
                „{ex}"
              </div>
            ))}
          </div>
        )}

        {wordInfo.synonyms?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 9,
                color: "var(--muted-foreground)",
                marginBottom: 4,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Синоними
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {wordInfo.synonyms.map((s, i) => (
                <span
                  key={i}
                  style={{
                    padding: "3px 8px",
                    background: "var(--secondary)",
                    borderRadius: 6,
                    fontSize: 11,
                    color: "var(--primary)",
                    fontWeight: 600,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {wordInfo.relatedWords?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 9,
                color: "var(--muted-foreground)",
                marginBottom: 4,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Сродни
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {wordInfo.relatedWords.map((s, i) => (
                <span
                  key={i}
                  style={{
                    padding: "3px 8px",
                    background: "var(--muted)",
                    borderRadius: 6,
                    fontSize: 11,
                    color: "var(--foreground)",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {wordInfo.funFact && (
          <div
            style={{
              padding: 12,
              background: "oklch(0.96 0.02 90)",
              borderRadius: 10,
              border: "1px solid oklch(0.82 0.07 84 / 0.45)",
              marginTop: 8,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: "oklch(0.62 0.1 45)",
                marginBottom: 3,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              💡 Интересно
            </div>
            <div style={{ fontSize: 12, color: "oklch(0.5 0.1 45)" }}>
              {wordInfo.funFact}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
