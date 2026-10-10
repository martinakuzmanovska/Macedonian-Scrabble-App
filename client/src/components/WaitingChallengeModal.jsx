export default function WaitingChallengeModal({ message }) {
  return (
    <>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(41, 43, 41, 0.16)",
          backdropFilter: "blur(5px)",
          padding: 16,
        }}
      >
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 18,
            boxShadow: "var(--surface-shadow)",
            width: "min(420px, calc(100vw - 32px))",
            padding: "36px 28px 24px",
            textAlign: "center",
            color: "var(--foreground)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              border: "3px solid rgba(73, 99, 78, 0.16)",
              borderTopColor: "var(--primary)",
              borderRadius: "50%",
              margin: "0 auto 20px",
              animation: "spin 1s linear infinite",
            }}
          />
          <div
            style={{
              fontSize: 10,
              color: "var(--primary)",
              letterSpacing: 4,
              fontWeight: 800,
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            Чека одлука
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 8,
              color: "var(--foreground)",
            }}
          >
            Противникот одлучува
          </div>
          <div
            style={{
              color: "var(--muted-foreground)",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {message}
          </div>
        </div>
      </div>
    </>
  );
}
