import "./GameOverScreen.css";

export default function GameOverScreen({
  players,
  endBonuses,
  message,
  gameLog,
  onNewGame,
  onOpenLeaderboard,
}) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const longestPlayers = endBonuses?.longestPlayers ?? [];
  const bestScorePlayers = endBonuses?.bestScorePlayers ?? [];

  return (
    <main className="scrabble-page scrabble-page--centered game-over-page">
      <section className="scrabble-card game-over-card">
        <div className="game-over-trophy" aria-hidden="true">
          🏆
        </div>
        <div className="game-over-eyebrow">Крај на играта</div>
        <h1 className="game-over-title">{message}</h1>
        <p className="game-over-subtitle">Конечен резултат</p>

        <div className="game-over-scores">
          {sorted.map((player, index) => (
            <article
              className={`game-over-player${index === 0 ? " game-over-player--winner" : ""}`}
              key={`${player.name}-${index}`}
            >
              <div className="game-over-medal" aria-hidden="true">
                {index === 0
                  ? "🥇"
                  : index === 1
                    ? "🥈"
                    : index === 2
                      ? "🥉"
                      : `${index + 1}.`}
              </div>
              <div className="game-over-player-name">
                {player.type === "ai" ? "🤖 " : ""}
                {player.name}
              </div>
              <div className="game-over-player-score">{player.score}</div>
              <div className="game-over-points-label">поени</div>
            </article>
          ))}
        </div>

        {(longestPlayers.length > 0 || bestScorePlayers.length > 0) && (
          <section className="game-over-bonuses">
            <h2>🎖️ Бонус награди</h2>
            {longestPlayers.length > 0 && (
              <div className="game-over-bonus-group">
                <h3>📏 Најдолг збор · +{longestPlayers[0].bonus} поени</h3>
                {longestPlayers.map((player, index) => (
                  <div
                    className="game-over-bonus-entry"
                    key={`${player.name}-${index}`}
                  >
                    <span>{player.name}</span>
                    <strong>{player.word}</strong>
                    <span>{player.len} букви</span>
                  </div>
                ))}
              </div>
            )}
            {bestScorePlayers.length > 0 && (
              <div className="game-over-bonus-group">
                <h3>
                  🔥 Најмногу поени во потег · +{bestScorePlayers[0].bonus}{" "}
                  поени
                </h3>
                {bestScorePlayers.map((player, index) => (
                  <div
                    className="game-over-bonus-entry"
                    key={`${player.name}-${index}`}
                  >
                    <span>{player.name}</span>
                    <strong>{player.word}</strong>
                    <span>{player.score} п.</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {gameLog?.length > 0 && (
          <details className="game-over-log">
            <summary>Преглед на потезите ({gameLog.length})</summary>
            <div className="game-over-log-list">
              {gameLog.map((entry, index) => (
                <div key={`${entry}-${index}`}>{entry}</div>
              ))}
            </div>
          </details>
        )}

        <div className="game-over-actions">
          <button
            className="scrabble-button scrabble-button--primary"
            onClick={onNewGame}
          >
            🔄 Нова игра
          </button>
          <button
            className="scrabble-button scrabble-button--outline"
            onClick={onOpenLeaderboard}
          >
            🏆 Табла на најдобри
          </button>
        </div>
      </section>
    </main>
  );
}
