import { useEffect, useRef, useState } from "react";
import "./InviteScreen.css";

export default function InviteScreen({
  gameId,
  gameState: initialState,
  onReady,
  onCancel,
}) {
  const [gameState, setGameState] = useState(initialState);
  const [copied, setCopied] = useState(false);
  const initialStateRef = useRef(initialState);
  const onReadyRef = useRef(onReady);

  function isReady(state) {
    if (!state?.players?.length) return false;
    return state.players.every(
      (player) => player.type === "ai" || player.userId,
    );
  }

  useEffect(() => {
    initialStateRef.current = initialState;
    onReadyRef.current = onReady;
  }, [initialState, onReady]);

  useEffect(() => {
    if (isReady(initialStateRef.current)) {
      onReadyRef.current(initialStateRef.current);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/games/${gameId}`, {
          credentials: "include",
        });
        const data = await response.json();
        if (!data.success) return;

        setGameState(data.state);
        if (isReady(data.state)) {
          clearInterval(interval);
          onReadyRef.current(data.state);
        }
      } catch {
        // Keep waiting; the next poll will retry.
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [gameId]);

  const waitingFor =
    gameState?.players?.filter(
      (player) => player.type === "human" && !player.userId,
    ) ?? [];
  const allFilled = isReady(gameState);
  const inviteUrl = `${window.location.origin}?join=${gameId}`;

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="invite-screen">
      <section className="invite-card" aria-labelledby="invite-title">
        <p className="invite-kicker">ИГРАТА Е СОЗДАДЕНА</p>
        <h1 className="invite-title" id="invite-title">
          Покани играчи
        </h1>
        <p className="invite-description">
          Сподели го кодот или линкот за покана за да може другиот играч да се
          приклучи.
        </p>

        <button
          className="invite-code"
          type="button"
          onClick={() => copy(gameId)}
          title="Кликни за копирање"
          aria-label={`Копирај го кодот ${gameId}`}
        >
          {gameId}
        </button>
        <p className="invite-copy-hint" aria-live="polite">
          {copied ? "✅ Копирано!" : "Кликни на кодот за да го копираш"}
        </p>

        <button
          className="invite-share-button"
          type="button"
          onClick={() => copy(inviteUrl)}
        >
          📋 Копирај линк за покана
        </button>

        <section className="invite-players" aria-label="Статус на играчите">
          <h2 className="invite-players-heading">Играчи</h2>
          {gameState?.players?.map((player, index) => {
            const joined = Boolean(player.userId || player.type === "ai");
            const playerName =
              player.displayName ||
              (player.type === "human" ? "Чека играч..." : "AI");

            return (
              <div
                className={`invite-player-row${joined ? " invite-player-row--joined" : ""}`}
                key={player.userId || `${player.type}-${index}`}
              >
                <span className="invite-player-avatar" aria-hidden="true">
                  {player.type === "ai" ? "🤖" : joined ? "✅" : "⏳"}
                </span>
                <span className="invite-player-name">{playerName}</span>
                {index === 0 && <span className="invite-player-label">ТИ</span>}
                {joined && index !== 0 && (
                  <span
                    className="invite-player-status"
                    aria-label="Приклучен"
                  />
                )}
              </div>
            );
          })}
        </section>

        {allFilled ? (
          <button
            className="invite-start-button"
            type="button"
            onClick={() => onReady(gameState)}
          >
            Започни игра 🎲
          </button>
        ) : (
          <>
            <div className="invite-waiting" role="status" aria-live="polite">
              <span className="invite-spinner" aria-hidden="true" />
              <span>
                Чека {waitingFor.length} играч
                {waitingFor.length === 1 ? "" : "и"} да се приклучи
                {waitingFor.length === 1 ? "" : "ат"}...
              </span>
            </div>
            <button
              className="invite-cancel-button"
              type="button"
              onClick={onCancel}
            >
              Откажи
            </button>
          </>
        )}
      </section>
    </main>
  );
}
