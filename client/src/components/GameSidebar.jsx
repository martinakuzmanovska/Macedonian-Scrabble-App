export default function GameSidebar({
  players,
  currentPlayer,
  screen,
  tileBagCount,
  displayMessage,
  isAIThinking,
  gameLog,
}) {
  const isChallenge = screen === "challenge";
  const decidingPlayers = isChallenge
    ? players
        .map(
          (player, index) => index !== currentPlayer && player.type === "human",
        )
        .map((isDeciding, index) => (isDeciding ? index : -1))
        .filter((index) => index >= 0)
    : [currentPlayer];

  return (
    <div className="right-column">
      <div className="side-panel">
        <div className="panel-heading">
          <h2>Како се игра</h2>
          <span>Упатство</span>
        </div>
        <div className="instructions-body">
          <div className="instruction-step">
            <span className="instruction-number">1</span>
            <p>
              Постави ги буквите со влечење или кликни на посакуваното поле.
            </p>
          </div>
          <div className="instruction-step">
            <span className="instruction-number">2</span>
            <p>Потврди го потегот кога ќе го составиш зборот.</p>
          </div>
          <div className="instruction-step">
            <span className="instruction-number">3</span>
            <p>
              Противникот може да го предизвика зборот и да побара проверка во
              речникот.
            </p>
          </div>
        </div>
      </div>

      {(displayMessage || isAIThinking) && (
        <div className="status-message">
          {isAIThinking && (
            <span
              style={{
                display: "inline-block",
                animation: "aispin 1s linear infinite",
                marginRight: 6,
              }}
            >
              🤖
            </span>
          )}
          {displayMessage}
        </div>
      )}

      <div className="side-panel">
        <div className="panel-heading">
          <h2>Играчи</h2>
          <span>Кеса: {tileBagCount}</span>
        </div>
        <div className="players">
          {players.map((player, index) => {
            const isActive = decidingPlayers.includes(index);
            const isCurrentTurn = index === currentPlayer && !isChallenge;
            const highlighted = isActive || isCurrentTurn;

            return (
              <div
                key={index}
                className={`player${highlighted ? " current" : ""}`}
              >
                <div
                  className={`avatar${index !== currentPlayer ? " other" : ""}`}
                >
                  {player.type === "ai" ? "🤖" : "👤"}
                </div>
                <div className="player-info">
                  <div className="player-name">{player.name}</div>
                  <div className="player-caption">
                    В.{player.age}
                    {isCurrentTurn && (
                      <span
                        className="status-dot"
                        style={{
                          background: "var(--primary)",
                          borderRadius: "50%",
                        }}
                      />
                    )}
                    {player.skipPenalty && <span>пропушта</span>}
                    {isChallenge && isActive && <span>⚖️</span>}
                  </div>
                </div>
                <div>
                  <div className="player-score">{player.score}</div>
                  <span className="score-unit">поени</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {gameLog.length > 0 && (
        <div className="side-panel">
          <div className="panel-heading">
            <h2>Историја</h2>
            <span>{gameLog.length} потези</span>
          </div>
          <div className="history-list">
            {gameLog.slice(-6).map((entry, index) => (
              <div className="history-entry" key={`${index}-${entry}`}>
                <span className="turn-number">
                  {gameLog.length - Math.min(gameLog.length, 6) + index + 1}
                </span>
                <div className="history-word">{entry}</div>
              </div>
            ))}
          </div>
          <div className="history-footer">
            <span>Последни потези</span>
            <span>{Math.min(gameLog.length, 6)} прикажани</span>
          </div>
        </div>
      )}
    </div>
  );
}
