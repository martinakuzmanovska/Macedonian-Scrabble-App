import { useCallback } from "react";
import { calcScore } from "../game/gameEngine.js";
import { drawTiles } from "../game/gameState.js";
import { generateAIMove } from "../services/aiService.js";

export function useAIMove({
  jokerAssignments,
  consecutivePasses,
  addLog,
  endGameRef,
  playWordSuccess,
  setAIThinking,
  setMessage,
  setConsecutivePasses,
  setCurrentPlayer,
  setJokerAssignments,
  setBoard,
  setPlayers,
  setPlacedTiles,
  setFormedWords,
  setTurnScore,
  setAIMoveDisplay,
  setTileBag,
  setConfirmedBoard,
  setWordRecords,
  setIsFirstMove,
  setScreen,
  gameId,
}) {
  const triggerAIMove = useCallback(
    async function runAIMove(
      curPlayers,
      playerIndex,
      confirmedBoard,
      tileBag,
      isFirstMove,
    ) {
      const player = curPlayers[playerIndex];
      if (!player) return;

      setAIThinking(true);
      setMessage(`🤖 ${player.name} размислува...`);
      const result = await generateAIMove(
        confirmedBoard,
        player.rack,
        isFirstMove,
        player.age,
      );
      setAIThinking(false);

      if (result?.error) {
        setMessage(`AI грешка: ${result.error}`);
        return;
      }

      if (gameId) {
        try {
          const response = await fetch(`/api/games/${gameId}/ai-turn`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pass: Boolean(result?.pass || !result?.placements?.length),
              placements: result?.placements ?? [],
            }),
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
          setBoard(nextState.board);
          setConfirmedBoard(nextState.confirmedBoard);
          setTileBag(nextState.tileBag ?? []);
          setCurrentPlayer(nextState.currentPlayerIndex ?? 0);
          setJokerAssignments(nextState.jokerAssignments ?? {});
          setConsecutivePasses(nextState.consecutivePasses ?? 0);
          setIsFirstMove(nextState.isFirstMove ?? false);
          setPlacedTiles([]);
          setFormedWords([]);
          setTurnScore(0);
          setAIMoveDisplay(
            data.passed
              ? null
              : {
                  word: result.word,
                  explanation: result.explanation,
                  score: data.score ?? 0,
                  words: (data.words ?? []).map((word) => word.word).join(", "),
                },
          );
          setScreen(nextState.status === "gameOver" ? "gameOver" : "playing");
          const nextPlayer = nextPlayers[nextState.currentPlayerIndex ?? 0];
          setMessage(nextPlayer ? `${nextPlayer.name} — твој ред!` : "");
        } catch (error) {
          setMessage(`AI грешка: ${error.message}`);
        }
        return;
      }

      const scheduleNextAI = (players, nextIndex, board, bag, firstMove) => {
        if (players[nextIndex]?.type !== "ai") return;
        setTimeout(
          () => runAIMove(players, nextIndex, board, bag, firstMove),
          800,
        );
      };

      if (
        !result ||
        result.pass ||
        !result.word ||
        !result.placements?.length
      ) {
        addLog(`${player.name}: пас (AI)`);
        setMessage(`${player.name} пасира.`);
        const passes = consecutivePasses + 1;
        setConsecutivePasses(passes);

        if (passes >= curPlayers.length * 2) {
          endGameRef.current?.(curPlayers);
          return;
        }

        const nextIndex = (playerIndex + 1) % curPlayers.length;
        setCurrentPlayer(nextIndex);
        setMessage(`${curPlayers[nextIndex].name} — твој ред!`);
        scheduleNextAI(
          curPlayers,
          nextIndex,
          confirmedBoard,
          tileBag,
          isFirstMove,
        );
        return;
      }

      const board = confirmedBoard.map((row) => [...row]);
      const placedTiles = [];
      const players = [...curPlayers];
      let rack = [...player.rack];
      const assignments = { ...jokerAssignments };

      // Pre-check: can the rack actually supply every placed letter?
      // (accounting for jokers as wildcards, and that each physical tile can only be used once)
      const rackPool = [...rack];
      const canSatisfyAll = result.placements.every((pl) => {
        let idx = rackPool.findIndex((t) => t.letter === pl.letter);
        if (idx === -1) idx = rackPool.findIndex((t) => t.letter === "★");
        if (idx === -1) return false;
        rackPool.splice(idx, 1); // consume it so it can't be reused for another letter
        return true;
      });

      if (!canSatisfyAll) {
        console.warn(
          `[ai-move] rack cannot satisfy claimed placements — discarding move`,
          {
            claimedWord: result.word,
            rackLetters: rack.map((t) => t.letter),
            neededLetters: result.placements.map((p) => p.letter),
          },
        );
        addLog(`${player.name}: пас (AI побара букви што ги нема)`);
        const nextIndex = (playerIndex + 1) % curPlayers.length;
        setCurrentPlayer(nextIndex);
        setMessage(`${curPlayers[nextIndex].name} — твој ред!`);
        scheduleNextAI(
          curPlayers,
          nextIndex,
          confirmedBoard,
          tileBag,
          isFirstMove,
        );
        return;
      }

      for (const placement of result.placements) {
        if (
          placement.row < 0 ||
          placement.row > 14 ||
          placement.col < 0 ||
          placement.col > 14 ||
          board[placement.row][placement.col]
        )
          continue;

        let tileIndex = rack.findIndex(
          (tile) => tile.letter === placement.letter,
        );
        if (tileIndex === -1) {
          tileIndex = rack.findIndex((tile) => tile.letter === "★");
          if (tileIndex !== -1)
            assignments[rack[tileIndex].id] = placement.letter;
        }
        if (tileIndex === -1) continue;

        const tile = rack[tileIndex];
        rack = rack.filter((_, index) => index !== tileIndex);
        board[placement.row][placement.col] = {
          ...tile,
          displayLetter: placement.letter,
        };
        placedTiles.push({ row: placement.row, col: placement.col, tile });
      }

      if (!placedTiles.length) {
        addLog(`${player.name}: пас (невалиден AI потег)`);
        const nextIndex = (playerIndex + 1) % curPlayers.length;
        setCurrentPlayer(nextIndex);
        setMessage(`${curPlayers[nextIndex].name} — твој ред!`);
        scheduleNextAI(
          curPlayers,
          nextIndex,
          confirmedBoard,
          tileBag,
          isFirstMove,
        );
        return;
      }

      players[playerIndex] = { ...players[playerIndex], rack };
      const { total, words } = calcScore(board, placedTiles, confirmedBoard);
      const wordList = words.map((word) => word.word).join(", ");

      setJokerAssignments(assignments);
      setBoard(board);
      setPlayers(players);
      setPlacedTiles(placedTiles);
      setFormedWords(words);
      setTurnScore(total);
      setAIMoveDisplay({
        word: result.word,
        explanation: result.explanation,
        score: total,
        words: wordList,
      });

      const hasHumanOpponent = players.some(
        (candidate, index) =>
          index !== playerIndex && candidate.type === "human",
      );
      if (hasHumanOpponent && words.length > 0) {
        setMessage(`🤖 ${player.name}: ${wordList} (${total} п.)`);
        setScreen("challenge");
        return;
      }

      setTimeout(() => {
        playWordSuccess();
        const { drawn, remainingBag } = drawTiles(tileBag, 7 - rack.length);
        players[playerIndex] = {
          ...players[playerIndex],
          score: players[playerIndex].score + total,
          rack: [...rack, ...drawn],
        };
        const nextConfirmedBoard = board.map((row) =>
          row.map((cell) => (cell ? { ...cell } : null)),
        );

        setTileBag(remainingBag);
        setPlayers(players);
        setConfirmedBoard(nextConfirmedBoard);
        addLog(`${player.name}: ${wordList} (+${total})`);
        setWordRecords((current) => {
          const records = { ...current };
          const record = records[playerIndex] ?? {
            longestWord: "",
            longestLen: 0,
            bestWord: "",
            bestScore: 0,
          };
          for (const word of words) {
            if (word.word.length > record.longestLen) {
              record.longestWord = word.word;
              record.longestLen = word.word.length;
            }
          }
          if (total > record.bestScore) {
            record.bestWord = wordList;
            record.bestScore = total;
          }
          records[playerIndex] = record;
          return records;
        });
        setIsFirstMove(false);
        setConsecutivePasses(0);
        setPlacedTiles([]);
        setFormedWords([]);
        setTurnScore(0);
        setAIMoveDisplay(null);

        const nextIndex = (playerIndex + 1) % players.length;
        setCurrentPlayer(nextIndex);
        setMessage(`${players[nextIndex].name} — твој ред!`);
        scheduleNextAI(
          players,
          nextIndex,
          nextConfirmedBoard,
          remainingBag,
          false,
        );
      }, 2000);
    },
    [
      addLog,
      consecutivePasses,
      endGameRef,
      jokerAssignments,
      playWordSuccess,
      setAIThinking,
      setAIMoveDisplay,
      setBoard,
      setConfirmedBoard,
      setConsecutivePasses,
      setCurrentPlayer,
      setFormedWords,
      setIsFirstMove,
      setJokerAssignments,
      setMessage,
      setPlacedTiles,
      setPlayers,
      setScreen,
      setTileBag,
      setTurnScore,
      setWordRecords,
      gameId,
    ],
  );

  return { triggerAIMove };
}
