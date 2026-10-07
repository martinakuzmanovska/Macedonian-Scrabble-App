import { useEffect, useRef, useState } from "react";
import { useAuth } from "./hooks/useAuth.js";
import { useGame } from "./hooks/useGame.js";
import LoginScreen  from "./components/LoginScreen.jsx"
import Lobby        from "./components/Lobby.jsx";
import InviteScreen from "./components/InviteScreen.jsx";
import MacedonianScrabble from "./scrabble.jsx";
import { loadLeaderboard } from "./services/leaderboardService.js"



function AppSidebar({ user, onLogout, onOpenLeaderboard }) {
  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: 250,
        background: "#101827",
        borderRight: "1px solid rgba(99, 102, 241, 0.18)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
        padding: "22px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        zIndex: 20,
      }}
    >
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 24,
          letterSpacing: 4,
          fontWeight: 700,
          background: "linear-gradient(135deg, #f8fafc, #a5b4fc)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        СКРАБЛ
      </div>

      <div
        style={{
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 16,
          padding: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <img
            src={user.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.displayName || "Player") + "&background=6366f1&color=fff"}
            alt="Profile"
            style={{ width: 46, height: 46, borderRadius: "50%", border: "2px solid rgba(165,180,252,0.5)" }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.displayName || "Player"}
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{user.email || "Player"}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={onOpenLeaderboard}
            style={{
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              padding: "10px 12px",
            }}
          >
            🏆 Leaderboard
          </button>
          <button
            onClick={onLogout}
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "#e2e8f0",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              padding: "10px 12px",
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: "auto",
          background: "rgba(15,23,42,0.7)",
          border: "1px solid rgba(148,163,184,0.12)",
          borderRadius: 14,
          padding: 12,
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: 2, color: "#94a3b8", textTransform: "uppercase", marginBottom: 8 }}>
          Profile
        </div>
        <div style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.6 }}>
          <div>• Status: Active</div>
          <div>• Rank: Amateur</div>
          <div>• Games: {user.gamesPlayed || 0}</div>
        </div>
      </div>
    </aside>
  );
}

function LeaderboardModal({ onClose, leaderboard }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,23,0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 30,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          background: "rgba(15,23,42,0.96)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 18,
          boxShadow: "0 30px 90px rgba(0,0,0,0.6)",
          padding: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#a5b4fc", marginBottom: 6 }}>RANKING</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Leaderboard</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid rgba(99,102,241,0.35)",
              color: "#cbd5e1",
              borderRadius: 10,
              padding: "8px 12px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Close
          </button>
        </div>

        {!leaderboard.length ? (
          <div style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>No results yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 60px 60px 50px 50px", gap: 8, fontSize: 10, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase", padding: "8px 12px" }}>
              <span>#</span>
              <span>Player</span>
              <span style={{ textAlign: "right" }}>Best</span>
              <span style={{ textAlign: "right" }}>Avg</span>
              <span style={{ textAlign: "right" }}>Games</span>
              <span style={{ textAlign: "right" }}>Wins</span>
            </div>
            {leaderboard.map((entry, index) => (
              <div key={entry.name + index} style={{ display: "grid", gridTemplateColumns: "32px 1fr 60px 60px 50px 50px", gap: 8, padding: "10px 12px", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.08)", borderRadius: 10, alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#a5b4fc" }}>{index + 1}</span>
                <span style={{ fontWeight: 600 }}>{entry.name}</span>
                <span style={{ textAlign: "right" }}>{entry.bestScore ?? 0}</span>
                <span style={{ textAlign: "right" }}>{entry.avgScore ?? 0}</span>
                <span style={{ textAlign: "right" }}>{entry.totalGames ?? 0}</span>
                <span style={{ textAlign: "right" }}>{entry.wins ?? 0}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const {
    gameId, gameState, loading: gameLoading, error,
    createGame, joinGame, loadGame, sendAction, clearGame,
  } = useGame();
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const joinHandled = useRef(false);

  useEffect(() => {
    if (!user || authLoading || joinHandled.current) return;
    const params   = new URLSearchParams(window.location.search);
    const joinCode = params.get("join");
    if (!joinCode) return;

    joinHandled.current = true;
    window.history.replaceState({}, "", window.location.pathname);
    joinGame(joinCode);
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    loadLeaderboard().then(setLeaderboard);
  }, [user]);

  if (authLoading) return <LoadingScreen />;
  if (!user) return <LoginScreen />;

  if (gameLoading && !gameState) return <LoadingScreen />;

  const content = (() => {
    if (gameState) {
      const status = gameState.status;

      if (status === "waiting") {
        return (
          <InviteScreen
            gameId={gameId}
            gameState={gameState}
            onReady={() => loadGame(gameId)}
            onCancel={clearGame}
          />
        );
      }

      return (
        <MacedonianScrabble
          user={user}
          initialGameState={{ ...gameState, gameId }}
          onSendAction={sendAction}
          onLeave={clearGame}
          onLogout={logout}
        />
      );
    }

    return (
      <Lobby
        user={user}
        onCreate={createGame}
        onJoin={joinGame}
        onLogout={logout}
        loading={gameLoading}
        error={error}
      />
    );
  })();

  return (
    <>
      <AppSidebar
        user={user}
        onLogout={logout}
        onOpenLeaderboard={() => {
          loadLeaderboard().then(setLeaderboard);
          setShowLeaderboard(true);
        }}
      />
      <div style={{ marginLeft: 250, minHeight: "100vh", width: "calc(100% - 250px)" }}>
        {content}
      </div>
      {showLeaderboard && (
        <LeaderboardModal
          leaderboard={leaderboard}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(140deg, #0b0f1a 0%, #162032 40%, #1a1210 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        color: "#d4af37", fontSize: 13, letterSpacing: 3,
        fontFamily: "'Palatino Linotype', serif",
        animation: "pulse 1.5s ease-in-out infinite",
      }}>
        СКРАБЛ
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }`}</style>
    </div>
  );
}