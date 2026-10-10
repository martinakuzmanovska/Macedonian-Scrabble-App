export default function PlayerRack({
  rack,
  selectedTile,
  draggedTile,
  isMyTurn,
  isAIThinking,
  currentPlayer,
  myPlayerIndex,
  players,
  placedTiles,
  turnScore,
  onDragStart,
  onDragOver,
  onDropOnRack,
  onSelectTile,
  onConfirmPlacement,
  onPassTurn,
  onExchangeTiles,
  getDisplayLetter,
}) {
  if (!isMyTurn || isAIThinking || !rack?.length) return null;

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDropOnRack}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 8,
        padding: "4px 0",
        background: "transparent",
        border: "none",
        margin: "0 auto 6px",
        width: "100%",
        maxWidth: 900,
        boxSizing: "border-box",
      }}
    >
      {rack.map((tile, i) => (
        <div
          key={tile.id}
          className={`tile-rack scrabble-tile${
            selectedTile?.id === tile.id ? " scrabble-tile--selected" : ""
          }${draggedTile?.id === tile.id ? " scrabble-tile--dragging" : ""}`}
          draggable
          onDragStart={(e) => onDragStart(e, tile, i)}
          onDragEnd={() => {}}
          onClick={() => onSelectTile(tile, i)}
          style={{ transition: "all 0.15s ease" }}
        >
          {getDisplayLetter(tile)}
          <span
            style={{
              position: "absolute",
              bottom: 1,
              right: 2,
              fontSize: 7,
              color: "var(--tile-ink)",
              fontFamily: "'Space Mono', monospace",
            }}
          >
            {tile.letter === "★" ? "" : tile.points}
          </span>
        </div>
      ))}
      <div
        style={{
          display: "flex",
          gap: 6,
          justifyContent: "center",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {placedTiles.length > 0 && (
          <button
            className="scrabble-button scrabble-button--success action-btn"
            onClick={onConfirmPlacement}
          >
            ✓ Потврди{" "}
            <span style={{ fontFamily: "'Space Mono', monospace" }}>
              +{turnScore}
            </span>
          </button>
        )}
        <button
          className="scrabble-button scrabble-button--outline action-btn"
          onClick={onPassTurn}
        >
          Пас
        </button>
        {placedTiles.length === 0 && (
          <button
            className="scrabble-button scrabble-button--outline action-btn"
            onClick={onExchangeTiles}
            disabled={currentPlayer?.score < 5}
            style={{
              opacity: currentPlayer?.score < 5 ? 0.3 : 1,
              cursor: currentPlayer?.score < 5 ? "not-allowed" : "pointer",
              transition: "all 0.15s",
              borderColor:
                currentPlayer?.score < 5 ? "rgba(255,255,255,0.08)" : undefined,
            }}
            title={
              currentPlayer?.score < 5
                ? "Потребни се 5 поени"
                : "Замени (-5 п.)"
            }
          >
            🔄 Замени <span style={{ fontSize: 10, opacity: 0.7 }}>−5п</span>
          </button>
        )}
      </div>
    </div>
  );
}
