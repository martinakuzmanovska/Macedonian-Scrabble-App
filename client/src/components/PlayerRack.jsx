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
  theme,
  onDragStart,
  onDragOver,
  onDropOnRack,
  onSelectTile,
  onConfirmPlacement,
  onPassTurn,
  onExchangeTiles,
  getDisplayLetter,
  tileStyle,
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
          className="tile-rack"
          draggable
          onDragStart={(e) => onDragStart(e, tile, i)}
          onDragEnd={() => {}}
          onClick={() => onSelectTile(tile, i)}
          style={{
            ...tileStyle(
              tile,
              selectedTile?.id === tile.id,
              draggedTile?.id === tile.id,
            ),
            transition: "all 0.15s ease",
          }}
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
            className="action-btn"
            onClick={onConfirmPlacement}
            style={{
              ...theme.btn("linear-gradient(135deg, #10b981, #059669)"),
              transition: "all 0.15s",
            }}
          >
            ✓ Потврди{" "}
            <span style={{ fontFamily: "'Space Mono', monospace" }}>
              +{turnScore}
            </span>
          </button>
        )}
        <button
          className="action-btn"
          onClick={onPassTurn}
          style={{ ...theme.btnO, transition: "all 0.15s" }}
        >
          Пас
        </button>
        {placedTiles.length === 0 && (
          <button
            className="action-btn"
            onClick={onExchangeTiles}
            disabled={currentPlayer?.score < 5}
            style={{
              ...theme.btnO,
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
