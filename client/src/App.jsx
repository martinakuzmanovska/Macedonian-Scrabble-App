import { useEffect, useRef } from "react";
import { useAuth } from "./hooks/useAuth.js";
import { useGame } from "./hooks/useGame.js";
import LoginScreen  from "./components/LoginScreen.jsx";
import Lobby        from "./components/Lobby.jsx";
import InviteScreen from "./components/InviteScreen.jsx";
import MacedonianScrabble from "./scrabble.jsx";

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const {
    gameId, gameState, loading: gameLoading, error,
    createGame, joinGame, loadGame, sendAction, clearGame,
  } = useGame();

  // Track whether we've handled the ?join= param yet
  const joinHandled = useRef(false);

  // Auto-join from ?join=CODE — but only after auth is confirmed
  // and only once (not on every re-render)
  useEffect(() => {
    if (!user || authLoading || joinHandled.current) return;
    const params   = new URLSearchParams(window.location.search);
    const joinCode = params.get("join");
    if (!joinCode) return;

    joinHandled.current = true;
    // Clean the URL immediately so refresh doesn't re-trigger
    window.history.replaceState({}, "", window.location.pathname);
    joinGame(joinCode);
  }, [user, authLoading]);

  // ── Loading states ────────────────────────────
  if (authLoading) return <LoadingScreen />;
  if (!user)       return <LoginScreen />;

  // Still restoring game from sessionStorage
  if (gameLoading && !gameState) return <LoadingScreen />;

  // ── In a game ─────────────────────────────────
  if (gameState) {
    const status = gameState.status;

    // Waiting for other players
    if (status === "waiting") {
      return (
        <InviteScreen
          gameId={gameId}
          gameState={gameState}
          onReady={(freshState) => {
            // freshState comes from the poll in InviteScreen
            // Just reload cleanly from server so App re-renders with "playing" status
            loadGame(gameId);
          }}
          onCancel={clearGame}
        />
      );
    }

    // Game in progress or finished
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

  // ── Lobby ─────────────────────────────────────
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