import { BONUS_MAP } from "../game/constants.js";

const BOARD_BONUS_COLORS = {
  TW: { bg: "var(--premium-tw)", ink: "var(--premium-tw-ink)", label: "ТЗ" },
  TL: { bg: "var(--premium-tl)", ink: "var(--premium-tl-ink)", label: "ТБ" },
  DW: { bg: "var(--premium-dw)", ink: "var(--premium-dw-ink)", label: "ДЗ" },
  DL: { bg: "var(--premium-dl)", ink: "var(--premium-dl-ink)", label: "ДБ" },
  ST: { bg: "var(--premium-dw)", ink: "var(--premium-dw-ink)", label: "★" },
};

export default function ScrabbleBoard({
  board,
  placedTiles,
  selectedTile,
  draggedTile,
  isHuman,
  isMyTurn,
  onPlaceTile,
  onRemoveTile,
  onDragOver,
  onDrop,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginBottom: 4,
      }}
    >
      <div
        style={{
          display: "inline-grid",
          gridTemplateColumns: "repeat(15, 36px)",
          gridTemplateRows: "repeat(15, 36px)",
          gap: 1,
          background: "var(--board-frame)",
          padding: 6,
          borderRadius: 12,
          border: "1px solid var(--board-frame)",
          boxShadow: "var(--surface-shadow)",
        }}
      >
        {board.map((boardRow, row) =>
          boardRow.map((cell, col) => {
            const bonus = BONUS_MAP[row][col];
            const isPlaced = placedTiles.some(
              (placedTile) => placedTile.row === row && placedTile.col === col,
            );
            const bonusColor = BOARD_BONUS_COLORS[bonus];

            if (cell) {
              return (
                <div
                  key={`${row}-${col}`}
                  className="board-cell"
                  onClick={() =>
                    isPlaced && isHuman && isMyTurn
                      ? onRemoveTile(row, col)
                      : null
                  }
                  style={{
                    width: 35,
                    height: 35,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    background: "var(--tile)",
                    border: "1px solid var(--tile-edge)",
                    borderRadius: 3,
                    fontWeight: 700,
                    fontSize: 14,
                    color: "var(--tile-ink)",
                    cursor:
                      isPlaced && isHuman && isMyTurn ? "pointer" : "default",
                    fontFamily: "inherit",
                    boxShadow: "var(--tile-shadow)",
                  }}
                >
                  {cell.displayLetter || cell.letter}
                  <span
                    style={{
                      position: "absolute",
                      bottom: 1,
                      right: 2,
                      fontSize: 6,
                      color: "var(--tile-ink)",
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    {cell.letter === "★" ? "" : cell.points}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={`${row}-${col}`}
                className="board-cell"
                onClick={() =>
                  selectedTile && isHuman ? onPlaceTile(row, col) : null
                }
                onDragOver={onDragOver}
                onDrop={(event) => onDrop(event, row, col)}
                style={{
                  width: 35,
                  height: 35,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: bonusColor
                    ? bonusColor.bg
                    : "var(--board-cell)",
                  border: bonusColor
                    ? `1px solid color-mix(in oklch, ${bonusColor.ink} 55%, transparent)`
                    : "1px solid rgba(45, 60, 45, 0.58)",
                  borderRadius: 3,
                  cursor: selectedTile || draggedTile ? "pointer" : "default",
                  boxShadow: bonusColor
                    ? `inset 0 0 8px color-mix(in oklch, ${bonusColor.ink} 12%, transparent)`
                    : "none",
                }}
              >
                <span
                  style={{
                    fontSize: bonus === "ST" ? 13 : 7,
                    color: bonusColor ? bonusColor.ink : "transparent",
                    fontWeight: 800,
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: 0,
                  }}
                >
                  {bonusColor?.label || ""}
                </span>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
