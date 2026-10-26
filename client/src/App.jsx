import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./hooks/useAuth.js";
import { useGame } from "./hooks/useGame.js";
import LoginScreen from "./components/LoginScreen.jsx";
import HomePage from "./components/HomePage.jsx";
import InviteScreen from "./components/InviteScreen.jsx";
import MacedonianScrabble from "./scrabble.jsx";
import { loadLeaderboard } from "./services/leaderboardService.js";
import "./components/LeaderboardModal.css";

const PENDING_ACTION_KEY = "mk-scrabble-pending-action";

function AppNavbar({ user, onLogin, onLogout, onOpenLeaderboard }) {
  return (
    <nav className="app-navbar" aria-label="Main navigation">
      <div className="app-navbar-brand">СКРАБЛ</div>

      {user && (
        <>
          <div className="app-navbar-user">
            <img
              src={
                user.avatar ||
                "https://ui-avatars.com/api/?name=" +
                  encodeURIComponent(user.displayName || "Player") +
                  "&background=49634e&color=fff"
              }
              alt="Profile"
              className="app-navbar-avatar"
            />
            <div className="app-navbar-user-copy">
              <div className="app-navbar-name">
                {user.displayName || "Player"}
              </div>
              <div className="app-navbar-email">{user.email || "Player"}</div>
            </div>
          </div>

          <div className="app-navbar-stats">
            <span>Active</span>
            <span>Rank: Amateur</span>
            <span>Games: {user.gamesPlayed || 0}</span>
          </div>
        </>
      )}

      <div className="app-navbar-actions">
        {user ? (
          <>
            <button
              className="app-navbar-button app-navbar-leaderboard"
              onClick={onOpenLeaderboard}
            >
              🏆 Leaderboard
            </button>
            <button
              className="app-navbar-button app-navbar-logout"
              onClick={onLogout}
            >
              🚪 Logout
            </button>
          </>
        ) : (
          <button
            className="app-navbar-button app-navbar-leaderboard"
            onClick={onLogin}
          >
            Log in
          </button>
        )}
      </div>
    </nav>
  );
}

function LeaderboardModal({ onClose, leaderboard }) {
  return (
    <div className="leaderboard-overlay" onClick={onClose}>
      <div
        className="leaderboard-modal scrabble-card"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="leaderboard-header">
          <div className="leaderboard-heading">
            <div className="leaderboard-eyebrow">Рангирање</div>
            <h2>Табла на најдобри</h2>
          </div>
          <button
            className="scrabble-button scrabble-button--outline leaderboard-close"
            onClick={onClose}
          >
            Затвори
          </button>
        </header>

        {!leaderboard.length ? (
          <div className="leaderboard-empty">Сè уште нема резултати!</div>
        ) : (
          <div className="leaderboard-table-wrap">
            <div className="leaderboard-table-head">
              <span>#</span>
              <span>Играч</span>
              <span>Најдобар</span>
              <span>Просек</span>
              <span>Игри</span>
              <span>Победи</span>
            </div>
            <ol className="leaderboard-entries">
              {leaderboard.map((entry, index) => (
                <li
                  className={`leaderboard-entry${index === 0 ? " leaderboard-entry--top" : ""}`}
                  key={entry.userId || `${entry.name}-${index}`}
                >
                  <span
                    className="leaderboard-rank"
                    aria-label={`Ранг ${index + 1}`}
                  >
                    {index === 0
                      ? "🥇"
                      : index === 1
                        ? "🥈"
                        : index === 2
                          ? "🥉"
                          : index + 1}
                  </span>
                  <span className="leaderboard-player-name">{entry.name}</span>
                  <span className="leaderboard-stat leaderboard-best-score">
                    {entry.bestScore ?? 0}
                  </span>
                  <span className="leaderboard-stat">
                    {entry.avgScore ?? 0}
                  </span>
                  <span className="leaderboard-stat">
                    {entry.totalGames ?? 0}
                  </span>
                  <span className="leaderboard-stat leaderboard-wins">
                    {entry.wins ?? 0}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const {
    gameId,
    gameState,
    loading: gameLoading,
    error,
    createGame,
    joinGame,
    loadGame,
    sendAction,
    clearGame,
  } = useGame();
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingAction, setPendingAction] = useState(() => {
    try {
      const stored = sessionStorage.getItem(PENDING_ACTION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const joinHandled = useRef(false);
  const pendingActionHandled = useRef(false);

  const executeAction = useCallback(
    (action) => {
      if (action.type === "join") {
        void joinGame(action.code);
        return;
      }

      const players = [
        {
          name: user?.displayName || "Играч 1",
          age: 25,
          type: "human",
          userId: user?.id,
          avatar: user?.avatar,
        },
        action.type === "ai"
          ? { name: "🤖 AI", age: 25, type: "ai" }
          : { name: "Играч 2", age: 25, type: "human" },
      ];
      void createGame(players, action.gameMode ?? "classic");
    },
    [createGame, joinGame, user],
  );

  const requestAction = useCallback(
    (action) => {
      if (!user) {
        sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(action));
        setPendingAction(action);
        setShowLogin(true);
        return;
      }

      executeAction(action);
    },
    [executeAction, user],
  );

  useEffect(() => {
    if (authLoading || joinHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get("join");
    if (!joinCode) return;

    joinHandled.current = true;
    window.history.replaceState({}, "", window.location.pathname);
    const timeoutId = window.setTimeout(() => {
      requestAction({ type: "join", code: joinCode });
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [authLoading, requestAction]);

  useEffect(() => {
    if (!user || !pendingAction || pendingActionHandled.current) return;
    pendingActionHandled.current = true;
    const timeoutId = window.setTimeout(() => {
      sessionStorage.removeItem(PENDING_ACTION_KEY);
      setPendingAction(null);
      setShowLogin(false);
      executeAction(pendingAction);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [executeAction, pendingAction, user]);

  useEffect(() => {
    if (!user) return;
    loadLeaderboard().then(setLeaderboard);
  }, [user]);

  if (authLoading) return <LoadingScreen />;
  if (gameLoading && !gameState) return <LoadingScreen />;

  const content = (() => {
    if (user && gameState) {
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
          onOpenLeaderboard={() => {
            loadLeaderboard().then(setLeaderboard);
            setShowLeaderboard(true);
          }}
          onLogout={logout}
        />
      );
    }

    if (!user && showLogin) {
      return (
        <LoginScreen
          onBack={() => {
            sessionStorage.removeItem(PENDING_ACTION_KEY);
            setPendingAction(null);
            setShowLogin(false);
          }}
        />
      );
    }

    return (
      <HomePage onAction={requestAction} loading={gameLoading} error={error} />
    );
  })();

  return (
    <>
      <AppNavbar
        user={user}
        onLogin={() => setShowLogin(true)}
        onLogout={logout}
        onOpenLeaderboard={() => {
          loadLeaderboard().then(setLeaderboard);
          setShowLeaderboard(true);
        }}
      />
      <div style={{ width: "100%" }}>{content}</div>
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
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(140deg, #0b0f1a 0%, #162032 40%, #1a1210 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          color: "#d4af37",
          fontSize: 13,
          letterSpacing: 3,
          fontFamily: "'Palatino Linotype', serif",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      >
        СКРАБЛ
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }`}</style>
    </div>
  );
}
