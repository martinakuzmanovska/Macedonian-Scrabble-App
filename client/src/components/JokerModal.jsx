export default function JokerModal({ theme, letters, onSelect }) {
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
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 18,
          boxShadow: "var(--surface-shadow)",
          padding: 28,
          maxWidth: 420,
          width: "100%",
          color: "var(--foreground)",
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: "var(--primary)",
            letterSpacing: 3,
            fontWeight: 800,
            marginBottom: 8,
            textAlign: "center",
            textTransform: "uppercase",
          }}
        >
          Џокер
        </div>
        <h3
          style={{
            color: "var(--foreground)",
            margin: "0 0 18px",
            textAlign: "center",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          Избери буква
        </h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            justifyContent: "center",
          }}
        >
          {letters.map((letter) => (
            <button
              key={letter}
              onClick={() => onSelect(letter)}
              style={{
                width: 36,
                height: 36,
                background: "var(--muted)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                color: "var(--foreground)",
                transition: "all 0.12s ease",
                boxShadow: "0 2px 6px oklch(0.3 0.03 150 / 0.05)",
              }}
              onMouseOver={(e) => {
                e.target.style.background = "var(--secondary)";
                e.target.style.borderColor = "var(--primary)";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "var(--muted)";
                e.target.style.borderColor = "var(--border)";
              }}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
