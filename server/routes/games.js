import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  createGame,
  joinGame,
  loadGame,
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

// All game routes require authentication
router.use(requireAuth);

// ── Create a new game ─────────────────────────
// POST /api/games
// Body: { players: [{ name, age, type, userId?, avatar? }] }
router.post("/", async (req, res) => {
  try {
    const { players } = req.body;
    if (!players?.length) {
      return res.status(400).json({ error: "players array is required" });
    }

    // Ensure the creator is player 0
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
    res.status(500).json({ error: "Failed to create game" });
  }
});

// ── Join an existing game ─────────────────────
// POST /api/games/:gameId/join
router.post("/:gameId/join", async (req, res) => {
  try {
    const result = await joinGame(req.params.gameId, req.user);
    if (typeof result === "string") {
      return res.status(400).json({ error: result });
    }
    res.json({ success: true, gameId: result.gameId, state: result.toEngineState() });
  } catch (err) {
    console.error("joinGame error:", err);
    res.status(500).json({ error: "Failed to join game" });
  }
});

// ── Load a game ───────────────────────────────
// GET /api/games/:gameId
router.get("/:gameId", async (req, res) => {
  try {
    const loaded = await loadGame(req.params.gameId);
    if (!loaded) return res.status(404).json({ error: "Game not found" });

    const { doc, state } = loaded;

    // Only players in the game can load it
    const inGame = doc.players.some(
      p => p.userId && p.userId.toString() === req.user._id.toString()
    );
    if (!inGame) return res.status(403).json({ error: "Not in this game" });

    res.json({ success: true, gameId: doc.gameId, state });
  } catch (err) {
    console.error("loadGame error:", err);
    res.status(500).json({ error: "Failed to load game" });
  }
});

// ── List games for the current user ──────────
// GET /api/games
router.get("/", async (req, res) => {
  try {
    const { Game } = await import("../models/Game.js");
    const games = await Game.find({
      "players.userId": req.user._id,
      status: { $in: ["waiting", "playing"] },
    })
    .select("gameId status players createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .limit(20);

    res.json({ success: true, games });
  } catch (err) {
    console.error("listGames error:", err);
    res.status(500).json({ error: "Failed to list games" });
  }
});

// ── Turn actions ──────────────────────────────
// All follow the same pattern:
//   POST /api/games/:gameId/<action>
//   Body: action-specific payload
//   Response: { success, state } or { error }

async function handleAction(res, actionResult) {
  if (typeof actionResult === "string") {
    return res.status(400).json({ error: actionResult });
  }
  res.json({ success: true, state: actionResult.state });
}

router.post("/:gameId/place", async (req, res) => {
  const { row, col, tile, displayLetter } = req.body;
  const result = await placeTileAction(req.params.gameId, req.user._id, row, col, tile, displayLetter);
  handleAction(res, result);
});

router.post("/:gameId/remove", async (req, res) => {
  const { row, col } = req.body;
  const result = await removeTileAction(req.params.gameId, req.user._id, row, col);
  handleAction(res, result);
});

router.post("/:gameId/joker", async (req, res) => {
  const { tileId, letter } = req.body;
  const result = await assignJokerAction(req.params.gameId, req.user._id, tileId, letter);
  handleAction(res, result);
});

router.post("/:gameId/confirm", async (req, res) => {
  const result = await confirmPlacementAction(req.params.gameId, req.user._id);
  handleAction(res, result);
});

router.post("/:gameId/finalize", async (req, res) => {
  const result = await finalizeTurnAction(req.params.gameId, req.user._id);
  handleAction(res, result);
});

router.post("/:gameId/pass", async (req, res) => {
  const result = await passTurnAction(req.params.gameId, req.user._id);
  handleAction(res, result);
});

router.post("/:gameId/exchange", async (req, res) => {
  const result = await exchangeTilesAction(req.params.gameId, req.user._id);
  handleAction(res, result);
});

router.post("/:gameId/challenge", async (req, res) => {
  const { isValid } = req.body;
  const result = await challengeResultAction(req.params.gameId, req.user._id, isValid);
  handleAction(res, result);
});

export default router;