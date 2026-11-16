import { useCallback } from "react";

export function useAIMove({
  setAIThinking,
  setEndBonuses,
  setMessage,
  setCurrentPlayer,
  setJokerAssignments,
  setBoard,
  setPlayers,
  setGameLog,
  setPlacedTiles,
  setFormedWords,
  setTurnScore,
  setAIMoveDisplay,
  setTileBag,
  setConfirmedBoard,
  setIsFirstMove,
  setScreen,
  gameId,
}) {
  const triggerAIMove = useCallback(
    async function runAIMove(curPlayers, playerIndex) {
      const player = curPlayers[playerIndex];
      if (!player) return;

      if (!gameId) {
        setMessage("AI games must be started from the home page.");
        return;
      }

      setAIThinking(true);
      setMessage(`🤖 ${player.name} размислува...`);
      try {
        const response = await fetch(`/api/games/${gameId}/ai-turn`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "AI turn failed");
        }

        const nextState = data.state;
        const nextPlayers = (nextState.players ?? []).map((candidate) => ({
          ...candidate,
          name: candidate.displayName || candidate.name || "Играч",
        }));
        setPlayers(nextPlayers);
        setGameLog(nextState.gameLog ?? []);
        setEndBonuses(nextState.endBonuses ?? null);
        setBoard(nextState.board);
        setConfirmedBoard(nextState.confirmedBoard);
        setTileBag(nextState.tileBag ?? []);
        setCurrentPlayer(nextState.currentPlayerIndex ?? 0);
        setJokerAssignments(nextState.jokerAssignments ?? {});
        setIsFirstMove(nextState.isFirstMove ?? false);
        setPlacedTiles([]);
        setFormedWords([]);
        setTurnScore(0);
        setAIMoveDisplay(
          data.passed
            ? null
            : {
                word: data.word,
                score: data.score ?? 0,
                words: (data.words ?? []).map((word) => word.word).join(", "),
              },
        );
        setScreen(nextState.status === "gameOver" ? "gameOver" : "playing");
        const nextPlayer = nextPlayers[nextState.currentPlayerIndex ?? 0];
        setMessage(nextPlayer ? `${nextPlayer.name} — твој ред!` : "");
      } catch (error) {
        setMessage(`AI грешка: ${error.message}`);
      } finally {
        setAIThinking(false);
      }
    },
    [
      setAIThinking,
      setEndBonuses,
      setAIMoveDisplay,
      setBoard,
      setConfirmedBoard,
      setCurrentPlayer,
      setFormedWords,
      setIsFirstMove,
      setJokerAssignments,
      setMessage,
      setPlacedTiles,
      setPlayers,
      setGameLog,
      setScreen,
      setTileBag,
      setTurnScore,
      gameId,
    ],
  );

  return { triggerAIMove };
}
