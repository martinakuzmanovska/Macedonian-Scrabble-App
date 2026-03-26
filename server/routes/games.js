import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import Game from "../models/Game.js";
import {
  createGame,
  placeTileAction,
  removeTileAction,
  assignJokerAction,
  confirmPlacementAction,
  finalizeTurnAction,
  passTurnAction,
  exchangeTilesAction,
  challengeResultAction,
} from "../services/gameService.js";

const router = express.Router();
router.use(requireAuth);

// ── Create ────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { players } = req.body;
    if (!players?.length) {
      return res.status(400).json({ success: false, error: "players array is required" });
    }
    const setupPlayers = players.map((p, i) => ({
      ...p,
      userId: i === 0 ? req.user._id : (p.userId ?? null),
      name:   i === 0 ? req.user.displayName : p.name,
      avatar: i === 0 ? req.user.avatar : (p.avatar ?? null),
    }));
    const doc = await createGame(req.user, setupPlayers);
    res.json({ success: true, gameId: doc.gameId, state: doc.toEngineState() });
  } catch (err) {
    console.error("createGame error:", err);
    res.status(500).json({ success: false, error: "Failed to create game" });
  }
});

// ── Join ──────────────────────────────────────
router.post("/:gameId/join", async (req, res) => {
  try {
    const game = await Game.findOne({ gameId: req.params.gameId });
    if (!game) return res.status(404).json({ success: false, error: "Игрта не е пронајдена." });

    // Already in the game — just return current state (idempotent)
    const alreadyIn = game.players.some(
      p => p.userId && p.userId.toString() === req.user._id.toString()
    );
    if (alreadyIn) {
      return res.json({ success: true, gameId: game.gameId, state: game.toEngineState() });
    }

    if (game.status !== "waiting") {
      return res.status(400).json({ success: false, error: "Играта веќе започна." });
    }

    // Find first unfilled human slot (slot 0 is always the creator)
    const slotIndex = game.players.findIndex(
      (p, i) => i > 0 && p.type === "human" && !p.userId
    );
    if (slotIndex === -1) {
      return res.status(400).json({ success: false, error: "Играта е полна." });
    }

    game.players[slotIndex].userId      = req.user._id;
    game.players[slotIndex].displayName = req.user.displayName;
    game.players[slotIndex].avatar      = req.user.avatar ?? null;

    // Start game if all human slots filled
    const allFilled = game.players.every(p => p.type === "ai" || p.userId);
    if (allFilled) game.status = "playing";

    game.updatedAt = new Date();
    await game.save();

    res.json({ success: true, gameId: game.gameId, state: game.toEngineState() });
  } catch (err) {
    console.error("joinGame error:", err);
    res.status(500).json({ success: false, error: "Failed to join game" });
  }
});

// ── Load ──────────────────────────────────────
router.get("/:gameId", async (req, res) => {
  try {
    const game = await Game.findOne({ gameId: req.params.gameId });
    if (!game) return res.status(404).json({ success: false, error: "Game not found" });

    const inGame    = game.players.some(p => p.userId?.toString() === req.user._id.toString());
    const isCreator = game.createdBy.toString() === req.user._id.toString();
    if (!inGame && !isCreator) {
      return res.status(403).json({ success: false, error: "Not in this game" });
    }

    const state = game.toEngineState();
    res.json({ success: true, gameId: game.gameId, state });
  } catch (err) {
    console.error("loadGame error:", err);
    res.status(500).json({ success: false, error: "Failed to load game" });
  }
});

// ── List active games for current user ────────
router.get("/", async (req, res) => {
  try {
    const games = await Game.find({
      "players.userId": req.user._id,
      status: { $in: ["waiting", "playing"] },
    })
    .select("gameId status players createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .limit(20);
    res.json({ success: true, games });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to list games" });
  }
});

// ── Turn actions ──────────────────────────────
async function handleAction(res, actionPromise) {
  try {
    const result = await actionPromise;
    if (typeof result === "string") return res.status(400).json({ success: false, error: result });
    res.json({ success: true, state: result.state });
  } catch (err) {
    console.error("action error:", err);
    res.status(500).json({ success: false, error: "Action failed" });
  }
}

router.post("/:gameId/place",     (req, res) => { const { row, col, tile, displayLetter } = req.body; handleAction(res, placeTileAction(req.params.gameId, req.user._id, row, col, tile, displayLetter)); });
router.post("/:gameId/remove",    (req, res) => { const { row, col } = req.body; handleAction(res, removeTileAction(req.params.gameId, req.user._id, row, col)); });
router.post("/:gameId/joker",     (req, res) => { const { tileId, letter } = req.body; handleAction(res, assignJokerAction(req.params.gameId, req.user._id, tileId, letter)); });
router.post("/:gameId/confirm", async (req, res) => {
  try {
    const game = await Game.findOne({ gameId: req.params.gameId });
    if (!game) return res.status(404).json({ success: false, error: "Game not found" });

    const state = game.toEngineState();
    const cp = state.players[state.currentPlayerIndex];
    if (!cp?.userId || cp.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Not your turn" });
    }

    const { placedTiles, board, turnScore, formedWords } = req.body;

    // Save the pending move and enter challenge phase
    const newState = {
      ...state,
      board: board ?? state.board,
      placedTiles: placedTiles ?? [],
      turnScore: Number(turnScore) || 0,
      formedWords: (formedWords ?? []).map(w => typeof w === 'string' ? { word: w, cells: [] } : w),
      status: 'challenge',
    };

    Object.assign(game, Game.fromEngineState(newState));
    await game.save();
    console.log(`Confirm: game=${game.gameId} words=${formedWords} score=${turnScore}`);
    res.json({ success: true, gameId: game.gameId, state: game.toEngineState() });
  } catch (err) {
    console.error("confirm error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
router.post("/:gameId/finalize", async (req, res) => {
  try {
    const game = await Game.findOne({ gameId: req.params.gameId });
    if (!game) return res.status(404).json({ success: false, error: "Game not found" });

    const state = game.toEngineState();

    // Only the opponent (non-current-player human) can finalize
    const isCurrentPlayer = state.players[state.currentPlayerIndex]?.userId?.toString() === req.user._id.toString();
    const isOpponent = !isCurrentPlayer && state.players.some(p => p.userId?.toString() === req.user._id.toString());
    // Also allow the current player to finalize if no human opponents
    const hasHumanOpponent = state.players.some((p, i) => i !== state.currentPlayerIndex && p.type === 'human');
    if (!isCurrentPlayer && !isOpponent) {
      return res.status(403).json({ success: false, error: "Not in this game" });
    }
    if (hasHumanOpponent && isCurrentPlayer && state.status === 'challenge') {
      return res.status(403).json({ success: false, error: "Wait for opponent to accept" });
    }

    const score = state.turnScore || 0;
    const placedTiles = state.placedTiles || [];

    // Remove placed tiles from current player's rack
    const placedTileIds = new Set(placedTiles.map(pt => pt.tile?.id).filter(Boolean));
    const players = state.players.map((p, i) => {
      if (i !== state.currentPlayerIndex) return p;
      const newRack = p.rack.filter(t => !placedTileIds.has(t.id));
      return { ...p, score: (p.score || 0) + score, rack: newRack };
    });

    // Draw new tiles
    const bagCopy = [...state.tileBag];
    const needed = 7 - players[state.currentPlayerIndex].rack.length;
    const drawn = bagCopy.splice(0, Math.min(needed, bagCopy.length));
    players[state.currentPlayerIndex].rack = [
      ...players[state.currentPlayerIndex].rack,
      ...drawn,
    ];

    // Confirm the board
    const newConfirmed = state.board.map(r => r.map(c => c ? { ...c } : null));

    // Log
    const wordStr = (state.formedWords ?? []).map(w => w.word || w).join(', ');
    const cpName = state.players[state.currentPlayerIndex].displayName;
    const newLog = [...(state.gameLog ?? []), `${cpName}: ${wordStr} (+${score})`];

    // Advance to next player
    let next = (state.currentPlayerIndex + 1) % players.length;
    for (let i = 0; i < players.length; i++) {
      if (!players[next].skipPenalty) break;
      players[next] = { ...players[next], skipPenalty: false };
      next = (next + 1) % players.length;
    }

    const gameOver = bagCopy.length === 0 && players[state.currentPlayerIndex].rack.length === 0;

    const newState = {
      ...state,
      players,
      tileBag: bagCopy,
      confirmedBoard: newConfirmed,
      currentPlayerIndex: next,
      isFirstMove: false,
      consecutivePasses: 0,
      placedTiles: [],
      turnScore: 0,
      formedWords: [],
      gameLog: newLog,
      status: gameOver ? 'gameOver' : 'playing',
    };

    Object.assign(game, Game.fromEngineState(newState));
    await game.save();
    console.log(`Finalized: game=${game.gameId} next=${next} bag=${bagCopy.length}`);
    res.json({ success: true, gameId: game.gameId, state: game.toEngineState() });
  } catch (err) {
    console.error("finalize error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
router.post("/:gameId/pass",      (req, res) => handleAction(res, passTurnAction(req.params.gameId, req.user._id)));
router.post("/:gameId/exchange",  (req, res) => handleAction(res, exchangeTilesAction(req.params.gameId, req.user._id)));
router.post("/:gameId/challenge", (req, res) => { const { isValid } = req.body; handleAction(res, challengeResultAction(req.params.gameId, req.user._id, isValid)); });

export default router;