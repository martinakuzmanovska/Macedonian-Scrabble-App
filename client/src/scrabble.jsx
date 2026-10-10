import { useState, useCallback, useEffect, useRef } from "react";
import { useAIMove } from "./hooks/useAIMove.js";
import SetupScreen from "./components/SetupScreen.jsx";
import GameOverScreen from "./components/GameOverScreen.jsx";
import ScrabbleBoard from "./components/ScrabbleBoard.jsx";
import ChallengeModal from "./components/ChallengeModal.jsx";
import WaitingChallengeModal from "./components/WaitingChallengeModal.jsx";
import JokerModal from "./components/JokerModal.jsx";
import PlayerRack from "./components/PlayerRack.jsx";
import WordInfoModal from "./components/WordInfoModal.jsx";
import LeaderboardScreen from "./components/LeaderboardScreen.jsx";
import GameSidebar from "./components/GameSidebar.jsx";

import { MK_LETTERS, BONUS_MAP, getPoints } from "./game/constants";

import {
  createTileBag,
  drawTiles,
  createEmptyBoard,
} from "./game/gameState.js";

import {
  loadLeaderboard,
  updateLeaderboard,
} from "./services/leaderboardService.js";
import { SFX, playBonusSound } from "./services/soundService.js";
import { getWordInfo, validateWordWithAI } from "./services/wordService.js";

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════
export default function MacedonianScrabble({
  initialGameState,
  user,
  onLeave,
} = {}) {
  const hasServerGame = !!initialGameState;

  const [screen, setScreen] = useState(() => {
    if (!initialGameState) return "home";
    if (initialGameState.status === "gameOver") return "gameOver";
    return "playing";
  });
  const [board, setBoard] = useState(
    () => initialGameState?.board ?? createEmptyBoard(),
  );
  const [confirmedBoard, setConfirmedBoard] = useState(
    () => initialGameState?.confirmedBoard ?? createEmptyBoard(),
  );
  const [tileBag, setTileBag] = useState(() => initialGameState?.tileBag ?? []);
  const [players, setPlayers] = useState(() =>
    (initialGameState?.players ?? []).map((p) => ({
      ...p,
      name: p.displayName || p.name || "Играч",
    })),
  );
  const [currentPlayer, setCurrentPlayer] = useState(
    () => initialGameState?.currentPlayerIndex ?? 0,
  );
  const [selectedTile, setSelectedTile] = useState(null);
  const [placedTiles, setPlacedTiles] = useState([]);
  const [turnScore, setTurnScore] = useState(0);
  const [formedWords, setFormedWords] = useState([]);
  const [message, setMessage] = useState(() => {
    if (!initialGameState?.players?.length) return "";
    const cp =
      initialGameState.players[initialGameState.currentPlayerIndex ?? 0];
    return cp ? `${cp.displayName || cp.name} — твој ред!` : "";
  });
  const [challengeResult, setChallengeResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [jokerModal, setJokerModal] = useState(null);
  const [jokerAssignments, setJokerAssignments] = useState(
    () => initialGameState?.jokerAssignments ?? {},
  );
  const [consecutivePasses, setConsecutivePasses] = useState(
    () => initialGameState?.consecutivePasses ?? 0,
  );
  const [gameLog, setGameLog] = useState(() => initialGameState?.gameLog ?? []);
  const [isFirstMove, setIsFirstMove] = useState(
    () => initialGameState?.isFirstMove ?? true,
  );
  const [leaderboard, setLeaderboard] = useState([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiMoveDisplay, setAiMoveDisplay] = useState(null);
  const [wordInfoModal, setWordInfoModal] = useState(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [draggedTile, setDraggedTile] = useState(null);
  const [wordRecords, setWordRecords] = useState({}); // { playerIdx: { longestWord, longestLen, bestWord, bestScore } }
  const [endBonuses, setEndBonuses] = useState(null); // shown at game over
  const [setupPlayers, setSetupPlayers] = useState([
    { name: "Играч 1", age: 25, type: "human" },
    { name: "Играч 2", age: 25, type: "human" },
  ]);

  // Which slot is the logged-in user? Compare as strings to handle ObjectId vs string.
  const myPlayerIndex = hasServerGame
    ? (initialGameState?.players ?? []).findIndex((p) => {
        if (!p.userId) return false;
        const uid = user?._id ?? user?.id ?? "";
        return p.userId.toString() === uid.toString();
      })
    : currentPlayer;

  // Only allow interaction when it's this user's turn
  const isMyTurn =
    !hasServerGame || (myPlayerIndex !== -1 && myPlayerIndex === currentPlayer);
  // DEBUG — remove after confirming correct
  if (hasServerGame)
    console.log(
      "myPlayerIndex:",
      myPlayerIndex,
      "currentPlayer:",
      currentPlayer,
      "isMyTurn:",
      isMyTurn,
      "userId:",
      user?._id ?? user?.id,
      "players userIds:",
      (initialGameState?.players ?? []).map((p) => p.userId),
    );

  // Stable refs so polling closure always reads current values
  const gameIdRef = useRef(initialGameState?.gameId ?? null);
  const isMyTurnRef = useRef(false);
  const isPlacingRef = useRef(false);
  const placedTilesRef = useRef([]);
  const screenRef = useRef(screen);
  const showingChallengeResultRef = useRef(false);
  const endGameRef = useRef(null);
  const addLog = useCallback(
    (entry) => setGameLog((previous) => [...previous, entry]),
    [],
  );

  const { triggerAIMove } = useAIMove({
    jokerAssignments,
    consecutivePasses,
    addLog,
    endGameRef,
    playWordSuccess: SFX.wordSuccess,
    setAIThinking: setIsAIThinking,
    setMessage,
    setConsecutivePasses,
    setCurrentPlayer,
    setJokerAssignments,
    setBoard,
    setPlayers,
    setPlacedTiles,
    setFormedWords,
    setTurnScore,
    setAIMoveDisplay: setAiMoveDisplay,
    setTileBag,
    setConfirmedBoard,
    setWordRecords,
    setIsFirstMove,
    setScreen,
    gameId: initialGameState?.gameId,
  });

  useEffect(() => {
    loadLeaderboard().then(setLeaderboard);
  }, []);

  // Trigger AI move on mount if it's AI's turn from the start
  useEffect(() => {
    if (!hasServerGame) return;
    const cp =
      initialGameState?.players?.[initialGameState?.currentPlayerIndex ?? 0];
    if (cp?.type === "ai") {
      const conf = initialGameState.confirmedBoard ?? createEmptyBoard();
      setTimeout(
        () =>
          triggerAIMove(
            (initialGameState.players ?? []).map((p) => ({
              ...p,
              name: p.displayName || p.name || "Играч",
            })),
            initialGameState.currentPlayerIndex ?? 0,
            conf,
            initialGameState.tileBag ?? [],
            initialGameState.isFirstMove ?? true,
          ),
        800,
      );
    }
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    isMyTurnRef.current = isMyTurn;
  }, [isMyTurn]);
  useEffect(() => {
    placedTilesRef.current = placedTiles;
  }, [placedTiles]);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  // Poll for updates — always runs in multiplayer, applies state when it changes
  useEffect(() => {
    if (!hasServerGame || !gameIdRef.current) return;

    const applyServerState = (s) => {
      // Keep a challenge result on screen, but never let this flag block
      // normal game-state updates after that result has been dismissed.
      if (
        showingChallengeResultRef.current &&
        screenRef.current === "challenge"
      ) {
        return;
      }
      showingChallengeResultRef.current = false;
      const normalizedPlayers = (s.players ?? []).map((p) => ({
        ...p,
        name: p.displayName || p.name || "Играч",
      }));
      setPlayers(normalizedPlayers);
      setCurrentPlayer(s.currentPlayerIndex ?? 0);
      setBoard(s.board ?? createEmptyBoard());
      setConfirmedBoard(s.confirmedBoard ?? createEmptyBoard());
      setTileBag(s.tileBag ?? []);
      setGameLog(s.gameLog ?? []);
      setIsFirstMove(s.isFirstMove ?? false);
      setConsecutivePasses(s.consecutivePasses ?? 0);
      setJokerAssignments(s.jokerAssignments ?? {});
      setTurnScore(s.turnScore ?? 0);
      if (s.status === "gameOver") {
        setScreen("gameOver");
        return;
      }

      // Determine my index from the live players list
      const myUid = user?._id ?? user?.id ?? "";
      const myIdx = normalizedPlayers.findIndex(
        (p) => p.userId?.toString() === myUid.toString(),
      );
      const iAmCurrentPlayer = myIdx === (s.currentPlayerIndex ?? 0);

      if (s.status === "challenge" && !iAmCurrentPlayer) {
        setFormedWords(s.formedWords ?? []);
        setPlacedTiles(s.placedTiles ?? []);
        const mover = normalizedPlayers[s.currentPlayerIndex ?? 0];
        const wl = (s.formedWords ?? []).map((w) => w.word || w).join(", ");
        setMessage(`${mover?.name}: ${wl} = ${s.turnScore ?? 0} п.`);
        setScreen("challenge");
        return;
      }

      if (
        (screenRef.current === "challenge" ||
          screenRef.current === "waitingChallenge") &&
        s.status === "challenge"
      ) {
        return;
      }

      // Normal playing state
      setPlacedTiles([]);
      setFormedWords([]);
      const cp = normalizedPlayers[s.currentPlayerIndex ?? 0];
      if (cp && screenRef.current === "playing") {
        setMessage(`${cp.name} — твој ред!`);
      }
      setScreen("playing");
    };

    const interval = setInterval(async () => {
      // Skip polling only when actively placing tiles on board
      if (screenRef.current === "gameOver") return;
      if (
        isMyTurnRef.current &&
        isPlacingRef.current &&
        screenRef.current === "playing"
      )
        return;
      try {
        const res = await fetch(`/api/games/${gameIdRef.current}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) applyServerState(data.state);
        else console.warn("Poll got error:", data.error);
      } catch (err) {
        console.warn("Poll fetch failed:", err.message);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [hasServerGame]); // run once on mount — interval reads latest state via closure refs

  const getDisplayLetter = (tile) => {
    if (!tile) return "";
    if (tile.letter === "★" && jokerAssignments[tile.id])
      return jokerAssignments[tile.id];
    return tile.letter;
  };

  // ─── DRAG & DROP ───
  const handleDragStart = (e, tile, rackIndex) => {
    if (
      screen !== "playing" ||
      players[currentPlayer]?.type === "ai" ||
      !isMyTurn
    )
      return;
    setDraggedTile({ ...tile, rackIndex });
    setSelectedTile({ ...tile, rackIndex });
    SFX.tilePickup();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", tile.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnBoard = (e, row, col) => {
    e.preventDefault();
    const tile = draggedTile || selectedTile;
    if (!tile || screen !== "playing" || board[row][col]) {
      setDraggedTile(null);
      return;
    }
    if (tile.letter === "★" && !jokerAssignments[tile.id]) {
      setJokerModal({ row, col, tile });
      setDraggedTile(null);
      return;
    }
    doPlace(row, col, tile, getDisplayLetter(tile));
    setDraggedTile(null);
  };

  const handleDropOnRack = (e) => {
    e.preventDefault();
    setDraggedTile(null);
    setSelectedTile(null);
  };

  // ─── GAME START ───
  const startGame = () => {
    if (hasServerGame) return; // server owns this game
    const bag = createTileBag();
    const gp = setupPlayers.map((sp) => ({
      ...sp,
      rack: drawTiles(bag, 7),
      score: 0,
      skipPenalty: false,
    }));
    setTileBag([...bag]);
    setPlayers(gp);
    setBoard(createEmptyBoard());
    setConfirmedBoard(createEmptyBoard());
    setCurrentPlayer(0);
    setPlacedTiles([]);
    setIsFirstMove(true);
    setConsecutivePasses(0);
    setGameLog([]);
    setJokerAssignments({});
    setAiMoveDisplay(null);
    setWordInfoModal(null);
    setWordRecords({});
    setEndBonuses(null);
    setMessage(`${gp[0].name} — твој ред!`);
    setScreen("playing");
    if (gp[0].type === "ai")
      setTimeout(
        () => triggerAIMove(gp, 0, createEmptyBoard(), bag, true),
        600,
      );
  };

  const selectTile = (tile, index) => {
    if (
      screen !== "playing" ||
      players[currentPlayer]?.type === "ai" ||
      !isMyTurn
    )
      return;
    SFX.tilePickup();
    setSelectedTile(
      selectedTile?.id === tile.id ? null : { ...tile, rackIndex: index },
    );
  };

  const placeTileOnBoard = (row, col) => {
    if (!selectedTile || screen !== "playing" || board[row][col]) return;
    if (selectedTile.letter === "★" && !jokerAssignments[selectedTile.id]) {
      setJokerModal({ row, col, tile: selectedTile });
      return;
    }
    doPlace(row, col, selectedTile, getDisplayLetter(selectedTile));
  };

  const doPlace = (row, col, tile, displayLetter) => {
    isPlacingRef.current = true;
    playBonusSound(row, col);
    const nb = board.map((r) => [...r]);
    nb[row][col] = { ...tile, displayLetter };
    setBoard(nb);
    const np = [...placedTiles, { row, col, tile }];
    setPlacedTiles(np);
    const npl = [...players];
    npl[currentPlayer] = {
      ...npl[currentPlayer],
      rack: npl[currentPlayer].rack.filter((_, i) => i !== tile.rackIndex),
    };
    setPlayers(npl);
    setSelectedTile(null);
    recalculate(nb, np);
  };

  const assignJoker = (letter) => {
    if (!jokerModal) return;
    const { row, col, tile } = jokerModal;
    setJokerAssignments((prev) => ({ ...prev, [tile.id]: letter }));
    setJokerModal(null);
    doPlace(row, col, tile, letter);
  };

  const removePlacedTile = (row, col) => {
    const placed = placedTiles.find((p) => p.row === row && p.col === col);
    if (!placed) return;
    SFX.tileReturn();
    const nb = board.map((r) => [...r]);
    nb[row][col] = null;
    setBoard(nb);
    const newPlaced = placedTiles.filter(
      (p) => !(p.row === row && p.col === col),
    );
    isPlacingRef.current = newPlaced.length > 0;
    setPlacedTiles(newPlaced);
    const npl = [...players];
    npl[currentPlayer] = {
      ...npl[currentPlayer],
      rack: [...npl[currentPlayer].rack, placed.tile],
    };
    setPlayers(npl);
    recalculate(nb, newPlaced);
  };

  // ─── WORD DETECTION ───
  const findFormedWords = useCallback((bs, placed) => {
    if (!placed.length) return [];
    const seen = new Set();
    const results = [];
    const getL = (r, c) =>
      r < 0 || r > 14 || c < 0 || c > 14 || !bs[r][c]
        ? null
        : bs[r][c].displayLetter || bs[r][c].letter;
    const extractWord = (r, c, dr, dc) => {
      let sr = r,
        sc = c;
      while (getL(sr - dr, sc - dc)) {
        sr -= dr;
        sc -= dc;
      }
      let w = "",
        cells = [],
        cr = sr,
        cc = sc;
      while (getL(cr, cc)) {
        w += getL(cr, cc);
        cells.push({ row: cr, col: cc });
        cr += dr;
        cc += dc;
      }
      if (w.length < 2) return null;
      const key = `${dr}-${dc}-${cells[0].row}-${cells[0].col}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return { word: w, cells };
    };
    for (const p of placed) {
      const hw = extractWord(p.row, p.col, 0, 1);
      if (hw) results.push(hw);
      const vw = extractWord(p.row, p.col, 1, 0);
      if (vw) results.push(vw);
    }
    return results;
  }, []);

  const calcScore = useCallback(
    (bs, placed, confirmed) => {
      const words = findFormedWords(bs, placed);
      const ps = new Set(placed.map((p) => `${p.row}-${p.col}`));
      let total = 0;
      for (const w of words) {
        let ws = 0,
          wm = 1;
        for (const cell of w.cells) {
          const tile = bs[cell.row]?.[cell.col];
          if (!tile) continue;
          let lp = tile.letter === "★" ? 0 : getPoints(tile.letter);
          if (
            ps.has(`${cell.row}-${cell.col}`) &&
            !confirmed[cell.row][cell.col]
          ) {
            const b = BONUS_MAP[cell.row][cell.col];
            if (b === "TL") lp *= 3;
            else if (b === "DL") lp *= 2;
            else if (b === "TW") wm *= 3;
            else if (b === "DW" || b === "ST") wm *= 2;
          }
          ws += lp;
        }
        total += ws * wm;
      }
      if (placed.length === 7) total += 50;
      return { total, words };
    },
    [findFormedWords],
  );

  const recalculate = useCallback(
    (bs, placed) => {
      const { total, words } = calcScore(bs, placed, confirmedBoard);
      setFormedWords(words);
      setTurnScore(total);
    },
    [calcScore, confirmedBoard],
  );

  const validatePlacement = () => {
    if (!placedTiles.length) return "Постави барем една плочка.";
    const rows = [...new Set(placedTiles.map((p) => p.row))],
      cols = [...new Set(placedTiles.map((p) => p.col))];
    if (rows.length > 1 && cols.length > 1)
      return "Плочките мора да се во ист ред или колона.";
    if (rows.length === 1) {
      const sc = placedTiles.map((p) => p.col).sort((a, b) => a - b);
      for (let c = sc[0]; c <= sc[sc.length - 1]; c++)
        if (!board[rows[0]][c]) return "Не смее да има празнини.";
    }
    if (cols.length === 1) {
      const sr = placedTiles.map((p) => p.row).sort((a, b) => a - b);
      for (let r = sr[0]; r <= sr[sr.length - 1]; r++)
        if (!board[r][cols[0]]) return "Не смее да има празнини.";
    }
    if (isFirstMove) {
      if (!placedTiles.some((p) => p.row === 7 && p.col === 7))
        return "Првиот збор мора да го покрие центарот (★).";
      if (placedTiles.length < 2)
        return "Првиот збор мора да има барем 2 букви.";
    } else {
      let conn = false;
      for (const p of placedTiles) {
        for (const [nr, nc] of [
          [p.row - 1, p.col],
          [p.row + 1, p.col],
          [p.row, p.col - 1],
          [p.row, p.col + 1],
        ])
          if (
            nr >= 0 &&
            nr < 15 &&
            nc >= 0 &&
            nc < 15 &&
            confirmedBoard[nr][nc]
          ) {
            conn = true;
            break;
          }
        if (conn) break;
      }
      if (!conn) return "Зборот мора да се поврзе со постоечки плочки.";
    }
    if (!formedWords.length) return "Не е формиран збор.";
    return null;
  };

  const confirmPlacement = async () => {
    console.log(
      "confirmPlacement called, hasServerGame:",
      hasServerGame,
      "placedTiles:",
      placedTiles.length,
    );
    const err = validatePlacement();
    if (err) {
      setMessage(err);
      return;
    }

    if (hasServerGame) {
      // POST pending move to server — opponent will see challenge screen via polling
      try {
        setMessage("⏳ Чекај одлука од противникот...");
        const res = await fetch(
          `/api/games/${initialGameState.gameId}/confirm`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              placedTiles,
              board,
              turnScore,
              formedWords: formedWords.map((w) => w.word),
            }),
          },
        );
        const data = await res.json();
        if (data.success) {
          isPlacingRef.current = false;
          if (data.state?.status === "playing") {
            const serverState = data.state;
            const normalizedPlayers = (serverState.players ?? []).map((p) => ({
              ...p,
              name: p.displayName || p.name || "Играч",
            }));
            setPlayers(normalizedPlayers);
            setCurrentPlayer(serverState.currentPlayerIndex ?? 0);
            setBoard(serverState.board ?? createEmptyBoard());
            setConfirmedBoard(serverState.confirmedBoard ?? createEmptyBoard());
            setTileBag(serverState.tileBag ?? []);
            setGameLog(serverState.gameLog ?? []);
            setIsFirstMove(serverState.isFirstMove ?? false);
            setConsecutivePasses(serverState.consecutivePasses ?? 0);
            setJokerAssignments(serverState.jokerAssignments ?? {});
            setPlacedTiles([]);
            setFormedWords([]);
            setTurnScore(0);
            setAiMoveDisplay(null);
            setScreen(
              serverState.status === "gameOver" ? "gameOver" : "playing",
            );

            const nextIndex = serverState.currentPlayerIndex ?? 0;
            if (
              serverState.status !== "gameOver" &&
              normalizedPlayers[nextIndex]?.type === "ai"
            ) {
              setTimeout(
                () =>
                  triggerAIMove(
                    normalizedPlayers,
                    nextIndex,
                    serverState.confirmedBoard ?? createEmptyBoard(),
                    serverState.tileBag ?? [],
                    serverState.isFirstMove ?? false,
                  ),
                800,
              );
            } else {
              const nextPlayer = normalizedPlayers[nextIndex];
              setMessage(nextPlayer ? `${nextPlayer.name} — твој ред!` : "");
            }
            return;
          }

          // Show waiting message — polling will update when opponent decides
          const wl = formedWords.map((w) => w.word).join(", ");
          setMessage(
            `⏳ ${players[currentPlayer].name}: ${wl} (${turnScore} п.) — чека потврда...`,
          );
          setScreen("waitingChallenge");
        } else {
          setMessage(`⚠️ Грешка: ${data.error}`);
        }
      } catch (err) {
        setMessage("⚠️ Грешка при поднесување.");
        console.error(err);
      }
      return;
    }

    const otherHumans = players.filter(
      (p, i) => i !== currentPlayer && p.type === "human",
    );
    if (!otherHumans.length) {
      finalizeTurn();
      return;
    }
    const wl = formedWords.map((w) => w.word).join(", ");
    const note =
      formedWords.length > 1 ? ` (${formedWords.length} зборови)` : "";
    setMessage(
      `${players[currentPlayer].name}: ${wl}${note} = ${turnScore} п.`,
    );
    setScreen("challenge");
  };

  // ─── CHALLENGE & WORD INFO ───
  // const challengeWord = async (word) => {
  //   setIsValidating(true); setChallengeResult(null);
  //   setMessage(`🤖 Агент пребарува "${word}" во речници...`);
  //   try {
  //     const result = await validateWordWithAI(word);
  //     if (result.valid === null) { setChallengeResult({ word, ...result }); setMessage('⚠️ Проверката не успеа.'); return; }
  //     let challengerIdx = -1;
  //     for (let off = 1; off < players.length; off++) { const idx = (currentPlayer + off) % players.length; if (players[idx].type === 'human') { challengerIdx = idx; break; } }
  //     if (result.valid) {
  //       SFX.challengeValid();
  //       setChallengeResult({ word, ...result });
  //       if (challengerIdx >= 0) {
  //         const np = [...players]; np[challengerIdx] = { ...np[challengerIdx], skipPenalty: true }; setPlayers(np);
  //         setMessage(`✅ "${word}" е валиден! ${np[challengerIdx].name} го губи следниот ред.`);
  //         addLog(`🔍 "${word}" потврден — ${np[challengerIdx].name} казнет`);
  //       }
  //     } else {
  //       SFX.challengeInvalid();
  //       setChallengeResult({ word, ...result });
  //       setMessage(`❌ "${word}" НЕ е валиден! ${players[currentPlayer].name} враќа плочки.`);
  //       addLog(`🔍 "${word}" одбиен`);
  //     }
  //   } catch {
  //     setChallengeResult({ word, valid: null, explanation: "Грешка при проверка.", definition: "", source: "" });
  //     setMessage('⚠️ Проверката не успеа.');
  //   } finally {
  //     setIsValidating(false);
  //   }
  // };

  const challengeWord = async (word) => {
    setIsValidating(true);
    setChallengeResult(null);
    setMessage(`🤖 Агент пребарува "${word}" во речници...`);
    try {
      const result = await validateWordWithAI(word);

      if (result.valid === true) {
        SFX.challengeValid();
        setChallengeResult({ word, ...result });
        showingChallengeResultRef.current = true;

        if (hasServerGame && initialGameState?.gameId) {
          // Tell server: challenge failed (word IS valid) — challenger loses next turn
          const res = await fetch(
            `/api/games/${initialGameState.gameId}/challenge-result`,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ word, valid: true }),
            },
          );
          const data = await res.json();
          if (data.success) {
            const challenger = data.state.players.find(
              (p, i) =>
                i !== data.state.currentPlayerIndex - 1 && p.type === "human",
            );
            setMessage(
              `✅ "${word}" е валиден! Предизвикувачот го губи следниот ред.`,
            );
          }
        } else {
          let challengerIdx = -1;
          for (let off = 1; off < players.length; off++) {
            const idx = (currentPlayer + off) % players.length;
            if (players[idx].type === "human") {
              challengerIdx = idx;
              break;
            }
          }
          if (challengerIdx >= 0) {
            const np = [...players];
            np[challengerIdx] = { ...np[challengerIdx], skipPenalty: true };
            setPlayers(np);
            setMessage(
              `✅ "${word}" е валиден! ${np[challengerIdx].name} го губи следниот ред.`,
            );
          }
        }
      } else if (result.valid === false) {
        SFX.challengeInvalid();
        setChallengeResult({ word, ...result });
        showingChallengeResultRef.current = true;

        if (hasServerGame && initialGameState?.gameId) {
          // Tell server: challenge succeeded (word is INVALID) — return tiles to Player 1
          const res = await fetch(
            `/api/games/${initialGameState.gameId}/challenge-result`,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ word, valid: false }),
            },
          );
          const data = await res.json();
          if (data.success) {
            const s = data.state;
            const normalizedPlayers = (s.players ?? []).map((p) => ({
              ...p,
              name: p.displayName || p.name || "Играч",
            }));
            setPlayers(normalizedPlayers);
            setCurrentPlayer(s.currentPlayerIndex ?? 0);
            setBoard(s.board ?? createEmptyBoard());
            setConfirmedBoard(s.confirmedBoard ?? createEmptyBoard());
            setTileBag(s.tileBag ?? []);
            setPlacedTiles([]);
            setFormedWords([]);
            setTurnScore(0);
            setChallengeResult(null);
            // The invalid-word path immediately returns to the board. Leaving
            // this true makes this client ignore every future polling update.
            showingChallengeResultRef.current = false;
            setMessage(`❌ "${word}" не е валиден! Плочките се вратени.`);
            setScreen("playing");
          } else {
            showingChallengeResultRef.current = false;
            setMessage(
              `⚠️ Грешка: ${data.error ?? "Неуспешно обработување на предизвикот."}`,
            );
          }
        } else {
          setMessage(
            `❌ "${word}" НЕ е валиден! ${players[currentPlayer].name} враќа плочки.`,
          );
        }
      } else {
        setChallengeResult({ word, ...result });
        setMessage("⚠️ Проверката не успеа.");
      }
    } catch (err) {
      console.error("Challenge error:", err);
      setChallengeResult({
        word,
        valid: null,
        explanation: "Грешка при проверка.",
        definition: "",
        source: "",
      });
      setMessage("⚠️ Проверката не успеа.");
    } finally {
      setIsValidating(false);
    }
  };

  const requestWordInfo = async (word) => {
    setIsLoadingInfo(true);
    const info = await getWordInfo(word);
    setWordInfoModal(info);
    setIsLoadingInfo(false);
  };

  const returnTilesToRack = () => {
    const nb = board.map((r) => [...r]);
    const np = [...players];
    const ret = [];
    for (const p of placedTiles) {
      nb[p.row][p.col] = null;
      ret.push(p.tile);
    }
    np[currentPlayer] = {
      ...np[currentPlayer],
      rack: [...np[currentPlayer].rack, ...ret],
    };
    setBoard(nb);
    setPlayers(np);
    setPlacedTiles([]);
    setFormedWords([]);
    setTurnScore(0);
    isPlacingRef.current = false;
  };

  const finalizeTurn = async () => {
    console.log(
      "finalizeTurn called, hasServerGame:",
      hasServerGame,
      "gameId:",
      initialGameState?.gameId,
    );
    SFX.wordSuccess();

    // In multiplayer games, the opponent calls finalize to accept the move
    if (hasServerGame && initialGameState?.gameId) {
      try {
        setMessage("💾 Зачувување...");
        const res = await fetch(
          `/api/games/${initialGameState.gameId}/finalize`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          },
        );
        const data = await res.json();
        if (data.success) {
          const s = data.state;
          const normalizedPlayers = (s.players ?? []).map((p) => ({
            ...p,
            name: p.displayName || p.name || "Играч",
          }));
          setPlayers(normalizedPlayers);
          setCurrentPlayer(s.currentPlayerIndex ?? 0);
          setBoard(s.board ?? createEmptyBoard());
          setConfirmedBoard(s.confirmedBoard ?? createEmptyBoard());
          setTileBag(s.tileBag ?? []);
          setGameLog(s.gameLog ?? []);
          setIsFirstMove(s.isFirstMove ?? false);
          setConsecutivePasses(s.consecutivePasses ?? 0);
          setJokerAssignments(s.jokerAssignments ?? {});
          setPlacedTiles([]);
          setFormedWords([]);
          setTurnScore(0);
          setSelectedTile(null);
          setChallengeResult(null);
          setAiMoveDisplay(null);
          if (s.status === "gameOver") {
            setScreen("gameOver");
            return;
          }
          const nextCp = normalizedPlayers[s.currentPlayerIndex ?? 0];
          setMessage(nextCp ? `${nextCp.name} — твој ред!` : "");
        } else {
          setMessage(`⚠️ Грешка: ${data.error}`);
        }
      } catch (err) {
        console.error("finalizeTurn server error:", err);
        setMessage("⚠️ Грешка при зачувување.");
      }
      return;
    }

    // Local (single-player / AI) mode — original logic
    const np = [...players];
    np[currentPlayer] = {
      ...np[currentPlayer],
      score: np[currentPlayer].score + turnScore,
    };
    const needed = 7 - np[currentPlayer].rack.length;
    const { drawn, remainingBag } = drawTiles(tileBag, needed);
    np[currentPlayer] = {
      ...np[currentPlayer],
      rack: [...np[currentPlayer].rack, ...drawn],
    };
    setTileBag(remainingBag);
    setPlayers(np);
    const newConf = board.map((r) => r.map((c) => (c ? { ...c } : null)));
    setConfirmedBoard(newConf);
    setWordRecords((prev) => {
      const rec = { ...prev };
      if (!rec[currentPlayer])
        rec[currentPlayer] = {
          longestWord: "",
          longestLen: 0,
          bestWord: "",
          bestScore: 0,
        };
      for (const w of formedWords) {
        if (w.word.length > rec[currentPlayer].longestLen) {
          rec[currentPlayer].longestWord = w.word;
          rec[currentPlayer].longestLen = w.word.length;
        }
      }
      if (turnScore > rec[currentPlayer].bestScore) {
        rec[currentPlayer].bestWord = formedWords
          .map((fw) => fw.word)
          .join("+");
        rec[currentPlayer].bestScore = turnScore;
      }
      return rec;
    });
    addLog(
      `${players[currentPlayer].name}: ${formedWords.map((w) => w.word).join(", ")} (+${turnScore})`,
    );
    setIsFirstMove(false);
    setConsecutivePasses(0);
    setChallengeResult(null);
    setAiMoveDisplay(null);
    endTurn(false, np, newConf);
  };

  const endTurn = (wasSkip, updatedPlayers, newConf) => {
    const pls = updatedPlayers || players;
    const conf = newConf || confirmedBoard;
    setPlacedTiles([]);
    setFormedWords([]);
    setTurnScore(0);
    setSelectedTile(null);
    if (tileBag.length === 0 && pls[currentPlayer].rack.length === 0) {
      endGame(pls);
      return;
    }
    if (wasSkip) {
      const np = consecutivePasses + 1;
      setConsecutivePasses(np);
      if (np >= pls.length * 2) {
        endGame(pls);
        return;
      }
    }
    let next = (currentPlayer + 1) % pls.length,
      attempts = 0;
    const npArr = [...pls];
    while (npArr[next].skipPenalty && attempts < pls.length) {
      npArr[next] = { ...npArr[next], skipPenalty: false };
      addLog(`${npArr[next].name}: прескокнат (казна)`);
      next = (next + 1) % pls.length;
      attempts++;
    }
    setPlayers(npArr);
    setCurrentPlayer(next);
    setMessage(`${npArr[next].name} — твој ред!`);
    setScreen("playing");
    if (npArr[next].type === "ai") {
      const fm = isFirstMove;
      setTimeout(() => triggerAIMove(npArr, next, conf, tileBag, fm), 800);
    }
  };

  const passTurn = () => {
    addLog(`${players[currentPlayer].name}: пас`);
    returnTilesToRack();
    endTurn(true);
  };
  const exchangeTiles = () => {
    if (placedTiles.length > 0) {
      setMessage(
        "Замена е дозволена само ПРЕД да поставиш букви! Врати ги прво.",
      );
      return;
    }
    if (players[currentPlayer].score < 5) {
      setMessage(
        `Немаш доволно поени за замена (потребни 5, имаш ${players[currentPlayer].score}).`,
      );
      return;
    }
    if (tileBag.length < 7) {
      setMessage("Нема доволно плочки во кесата.");
      return;
    }
    const np = [...players];
    const old = [...np[currentPlayer].rack];
    np[currentPlayer] = {
      ...np[currentPlayer],
      score: np[currentPlayer].score - 5,
    };
    const newT = drawTiles(tileBag, old.length);
    tileBag.push(...old);
    for (let i = tileBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tileBag[i], tileBag[j]] = [tileBag[j], tileBag[i]];
    }
    np[currentPlayer] = { ...np[currentPlayer], rack: newT };
    setPlayers(np);
    setTileBag([...tileBag]);
    addLog(`${players[currentPlayer].name}: замена (-5 п.)`);
    setMessage(
      `${players[currentPlayer].name} замени букви (-5 поени). Сега постави збор.`,
    );
    // Does NOT end turn — player continues with new tiles
  };

  const endGame = async (pls) => {
    SFX.gameOver();
    const np = [...pls];
    // Subtract remaining tile values
    for (let i = 0; i < np.length; i++) {
      const rem = np[i].rack.reduce((s, t) => s + t.points, 0);
      np[i] = { ...np[i], score: Math.max(0, np[i].score - rem) };
    }

    // Calculate end-game bonuses from wordRecords
    const LONGEST_BONUS = 15;
    const BESTSCORE_BONUS = 10;
    const bonuses = {};
    let globalLongestLen = 0,
      globalBestScore = 0;
    let longestPlayers = [],
      bestScorePlayers = [];

    // Find global bests
    for (let i = 0; i < np.length; i++) {
      const rec = wordRecords[i];
      if (!rec) continue;
      if (rec.longestLen > globalLongestLen) {
        globalLongestLen = rec.longestLen;
        longestPlayers = [i];
      } else if (rec.longestLen === globalLongestLen && globalLongestLen > 0)
        longestPlayers.push(i);
      if (rec.bestScore > globalBestScore) {
        globalBestScore = rec.bestScore;
        bestScorePlayers = [i];
      } else if (rec.bestScore === globalBestScore && globalBestScore > 0)
        bestScorePlayers.push(i);
    }

    // Award bonuses
    for (const pi of longestPlayers) {
      if (!bonuses[pi]) bonuses[pi] = { longest: 0, bestScore: 0 };
      bonuses[pi].longest = LONGEST_BONUS;
      np[pi] = { ...np[pi], score: np[pi].score + LONGEST_BONUS };
    }
    for (const pi of bestScorePlayers) {
      if (!bonuses[pi]) bonuses[pi] = { longest: 0, bestScore: 0 };
      bonuses[pi].bestScore = BESTSCORE_BONUS;
      np[pi] = { ...np[pi], score: np[pi].score + BESTSCORE_BONUS };
    }

    const bonusInfo = {
      longestPlayers: longestPlayers.map((i) => ({
        name: np[i].name,
        word: wordRecords[i]?.longestWord,
        len: globalLongestLen,
        bonus: LONGEST_BONUS,
      })),
      bestScorePlayers: bestScorePlayers.map((i) => ({
        name: np[i].name,
        word: wordRecords[i]?.bestWord,
        score: globalBestScore,
        bonus: BESTSCORE_BONUS,
      })),
      playerBonuses: bonuses,
    };
    setEndBonuses(bonusInfo);
    setTimeout(() => SFX.bonusAwarded(), 1200);

    setPlayers(np);
    setScreen("gameOver");
    const maxS = Math.max(...np.map((p) => p.score));
    setMessage(
      `🏆 ${np
        .filter((p) => p.score === maxS)
        .map((w) => w.name)
        .join(" и ")} победи!`,
    );
    for (const p of np) {
      if (p.type !== "ai")
        await updateLeaderboard(p.name, p.score, p.score === maxS, p.age);
    }
    setLeaderboard(await loadLeaderboard());
  };
  endGameRef.current = endGame;

  // ═══════════════════════════════════════════
  // STYLES
  // ═══════════════════════════════════════════

  // ═══════════════════════════════════════════
  // DESIGN SYSTEM — Modern Dark
  // ═══════════════════════════════════════════
  const S = {
    page: {
      width: "100%",
      minHeight: "100vh",
      background: "var(--app-background, #f5f7f3)",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#f1f5f9",
    },
    card: {
      background: "rgba(20, 25, 39, 0.95)",
      backdropFilter: "blur(12px)",
      borderRadius: 16,
      border: "1px solid rgba(99, 102, 241, 0.18)",
      boxShadow:
        "0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
    },
    accent: "#6366f1",
    accentCyan: "#22d3ee",
    green: "#10b981",
    red: "#ef4444",
    orange: "#f59e0b",
    muted: "#475569",
    subtle: "#1e293b",
    btn: (bg) => ({
      padding: "10px 24px",
      background: bg,
      color: "#fff",
      border: "none",
      borderRadius: 10,
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 600,
      transition: "all 0.15s",
      letterSpacing: "0.02em",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    }),
    btnO: {
      padding: "10px 24px",
      background: "transparent",
      color: "#6366f1",
      border: "1.5px solid rgba(99,102,241,0.4)",
      borderRadius: 10,
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 600,
      letterSpacing: "0.02em",
    },
    btnSm: (bg) => ({
      padding: "5px 12px",
      background: bg,
      color: "#fff",
      border: "none",
      borderRadius: 7,
      fontSize: 11,
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 600,
    }),
  };

  const tileStyle = (tile, isSelected, isDragging) => ({
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderRadius: 4,
    background: "var(--tile)",
    border: isSelected
      ? "2px solid var(--tile-edge)"
      : "1px solid var(--tile-edge)",
    cursor: "grab",
    fontWeight: 700,
    fontSize: 16,
    color: "var(--tile-ink)",
    fontFamily: "inherit",
    boxShadow: "var(--tile-shadow)",
    userSelect: "none",
    opacity: isDragging ? 0.35 : 1,
    transition: "all 0.12s ease",
  });

  // ═══════════════════════════════════════════
  // HOME
  // ═══════════════════════════════════════════
  if (screen === "home")
    return (
      <div
        style={{
          ...S.page,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-glow { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        .home-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.35) !important; }
        .home-btn-o:hover { background: rgba(99,102,241,0.1) !important; }
      `}</style>
        {/* Background grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          }}
        />
        {/* Glow orbs */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "15%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
            animation: "pulse-glow 4s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            right: "10%",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)",
            animation: "pulse-glow 5s ease-in-out infinite 1s",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            ...S.card,
            padding: "52px 44px",
            maxWidth: 440,
            width: "100%",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 6,
              color: S.accent,
              fontWeight: 600,
              marginBottom: 12,
              textTransform: "uppercase",
              opacity: 0.8,
            }}
          >
            Македонско Издание
          </div>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: 6,
              background:
                "linear-gradient(135deg, #f8fafc 0%, #a5b4fc 50%, #22d3ee 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 8,
              animation: "float 6s ease-in-out infinite",
            }}
          >
            СКРАБЛ
          </div>
          <div
            style={{
              width: 48,
              height: 3,
              background: "linear-gradient(90deg, #6366f1, #22d3ee)",
              borderRadius: 2,
              margin: "0 auto 40px",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              className="home-btn"
              onClick={() => setScreen("setup")}
              style={{
                ...S.btn("linear-gradient(135deg, #6366f1, #4f46e5)"),
                padding: "14px 24px",
                fontSize: 15,
                letterSpacing: 1,
                transition: "all 0.2s",
              }}
            >
              🎮 Нова Игра
            </button>
            <button
              className="home-btn-o"
              onClick={() => {
                loadLeaderboard().then(setLeaderboard);
                setScreen("leaderboard");
              }}
              style={{
                ...S.btnO,
                padding: "14px 24px",
                fontSize: 15,
                transition: "all 0.2s",
              }}
            >
              🏆 Табла на Најдобри
            </button>
          </div>

          <div
            style={{
              marginTop: 36,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {[
              { icon: "🖱️", text: "Drag & Drop плочки" },
              { icon: "🤖", text: "AI проверка на зборови" },
              { icon: "📖", text: "Инфо за секој збор" },
              { icon: "👥", text: "2-4 играчи + AI" },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 12px",
                  background: "rgba(99,102,241,0.06)",
                  borderRadius: 10,
                  border: "1px solid rgba(99,102,241,0.1)",
                  fontSize: 11,
                  color: S.muted,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  // ═══════════════════════════════════════════
  // LEADERBOARD
  // ═══════════════════════════════════════════
  if (screen === "leaderboard")
    return (
      <LeaderboardScreen
        leaderboard={leaderboard}
        styles={S}
        onBack={() => setScreen("home")}
      />
    );

  // ═══════════════════════════════════════════
  // SETUP
  // ═══════════════════════════════════════════
  if (screen === "setup") {
    return (
      <SetupScreen
        styles={S}
        players={setupPlayers}
        setPlayers={setSetupPlayers}
        onBack={() => setScreen("home")}
        onStart={startGame}
      />
    );
  }

  // GAME OVER
  // ═══════════════════════════════════════════
  if (screen === "gameOver") {
    return (
      <GameOverScreen
        players={players}
        endBonuses={endBonuses}
        styles={S}
        message={message}
        gameLog={gameLog}
        onNewGame={() => setScreen("setup")}
        onOpenLeaderboard={() => {
          loadLeaderboard().then(setLeaderboard);
          setScreen("leaderboard");
        }}
      />
    );
  }

  // ═══════════════════════════════════════════
  // WAITING FOR CHALLENGE DECISION (multiplayer)
  // ═══════════════════════════════════════════
  if (screen === "waitingChallenge")
    return <WaitingChallengeModal theme={S} message={message} />;

  // ═══════════════════════════════════════════
  // MAIN GAME
  // ═══════════════════════════════════════════
  const cp = players[currentPlayer];
  const displayMessage = message.endsWith(" — твој ред!") ? "" : message;

  return (
    <div
      className="game-screen"
      style={{ ...S.page, padding: "6px 6px 0", minHeight: 0 }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap');
        @keyframes aispin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        .board-cell:hover { outline: 1px solid rgba(45,60,45,0.8); outline-offset: -1px; z-index:1; }
        .tile-rack:hover { transform: translateY(-4px) scale(1.05); box-shadow: 0 8px 20px rgba(99,102,241,0.4) !important; }
        .action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 2px; }
      `}</style>

      {/* WORD INFO MODAL */}
      {wordInfoModal && (
        <WordInfoModal
          theme={S}
          wordInfo={wordInfoModal}
          onClose={() => setWordInfoModal(null)}
        />
      )}

      {/* JOKER MODAL */}
      {jokerModal && (
        <JokerModal
          theme={S}
          letters={MK_LETTERS.split("")}
          onSelect={assignJoker}
        />
      )}

      {screen === "challenge" &&
        (() => {
          const opponents = players.filter(
            (p, i) => i !== currentPlayer && p.type === "human",
          );
          const opponentNames = opponents.map((o) => o.name).join(", ");

          const closeChallengeModal = () => {
            showingChallengeResultRef.current = false;
            setChallengeResult(null);
            setScreen("playing");
          };

          const retryChallenge = () => {
            setChallengeResult(null);
            setScreen("playing");
            setMessage(`${players[currentPlayer].name} — пробај повторно!`);
          };

          return (
            <ChallengeModal
              theme={S}
              players={players}
              currentPlayer={currentPlayer}
              formedWords={formedWords}
              turnScore={turnScore}
              challengeResult={challengeResult}
              isValidating={isValidating}
              isLoadingInfo={isLoadingInfo}
              opponentNames={opponentNames}
              requestWordInfo={requestWordInfo}
              challengeWord={challengeWord}
              finalizeTurn={finalizeTurn}
              onClose={closeChallengeModal}
              onRetry={retryChallenge}
            />
          );
        })()}

      {/* START HERE ONE SIDE */}
      <div className="game-layout">
        <div className="left-column">
          {/* The board's rendering and bonus-square styling live in ScrabbleBoard. */}
          <ScrabbleBoard
            board={board}
            placedTiles={placedTiles}
            selectedTile={selectedTile}
            draggedTile={draggedTile}
            isHuman={cp?.type === "human"}
            isMyTurn={isMyTurn}
            onPlaceTile={placeTileOnBoard}
            onRemoveTile={removePlacedTile}
            onDragOver={handleDragOver}
            onDrop={handleDropOnBoard}
          />
          {/* PLAYER RACK */}
          {screen === "playing" && cp?.type === "human" && !isMyTurn && (
            <div style={{ margin: "0 auto 8px", width: "100%", maxWidth: 575 }}>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  color: "#fbbf24",
                  fontSize: 12,
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                ⏳ Го чекаме другиот играч!
              </div>
            </div>
          )}
          {screen === "playing" &&
            cp?.type === "human" &&
            !isAIThinking &&
            isMyTurn && (
              <PlayerRack
                rack={
                  (players[myPlayerIndex] ?? players[currentPlayer])?.rack ?? []
                }
                selectedTile={selectedTile}
                draggedTile={draggedTile}
                isMyTurn={isMyTurn}
                isAIThinking={isAIThinking}
                currentPlayer={cp}
                myPlayerIndex={myPlayerIndex}
                players={players}
                placedTiles={placedTiles}
                turnScore={turnScore}
                theme={S}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDropOnRack={handleDropOnRack}
                onSelectTile={selectTile}
                onConfirmPlacement={confirmPlacement}
                onPassTurn={passTurn}
                onExchangeTiles={exchangeTiles}
                getDisplayLetter={getDisplayLetter}
                tileStyle={tileStyle}
              />
            )}

          {/* FORMED WORDS PREVIEW */}
          {formedWords.length > 0 && screen === "playing" && (
            <div
              style={{
                textAlign: "center",
                margin: "0 auto 4px",
                padding: "6px 14px",
                background: "rgba(16,185,129,0.08)",
                borderRadius: 8,
                border: "1px solid rgba(16,185,129,0.2)",
                animation: "fadeIn 0.2s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {formedWords.map((w, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "2px 10px",
                      background: "rgba(16,185,129,0.15)",
                      borderRadius: 6,
                      fontSize: 12,
                      color: "#34d399",
                      fontWeight: 700,
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    {w.word}
                  </span>
                ))}
                <span
                  style={{
                    color: "#10b981",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  +{turnScore}
                </span>
                {formedWords.length > 1 && (
                  <span style={{ color: S.muted, fontSize: 10 }}>
                    ({formedWords.length} зборови)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* AI MOVE DISPLAY */}
          {aiMoveDisplay && (
            <div
              style={{
                textAlign: "center",
                margin: "0 auto 4px",
                padding: "6px 14px",
                background: "rgba(99,102,241,0.08)",
                borderRadius: 8,
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              <div style={{ color: "#a5b4fc", fontSize: 12 }}>
                🤖{" "}
                <strong style={{ fontFamily: "'Space Mono', monospace" }}>
                  {aiMoveDisplay.words}
                </strong>{" "}
                <span style={{ color: "#6366f1" }}>+{aiMoveDisplay.score}</span>
              </div>
              {aiMoveDisplay.explanation && (
                <div style={{ color: S.muted, fontSize: 10, marginTop: 2 }}>
                  {aiMoveDisplay.explanation}
                </div>
              )}
            </div>
          )}
        </div>
        {/* SIDE ONE ENDS HERE */}
        <GameSidebar
          players={players}
          currentPlayer={currentPlayer}
          screen={screen}
          tileBagCount={tileBag.length}
          displayMessage={displayMessage}
          isAIThinking={isAIThinking}
          gameLog={gameLog}
        />
      </div>
    </div>
  );
}
