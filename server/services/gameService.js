// ═══════════════════════════════════════════
// GAME SERVICE
//
// Server-side orchestration layer.
// Loads game state from MongoDB, runs it
// through the engine, and saves it back.
//
// The engine functions (pure JS) are imported
// from the game/ folder — same files the client
// uses. This is the payoff of Phase 1.
// ═══════════════════════════════════════════

import { nanoid } from "nanoid";
import Game from "../models/Game.js";
import { createInitialState } from "../game/gameState.js";
import {
  placeTile,
  removePlacedTile,
  returnAllPlacedTiles,
  assignJoker,
  validatePlacement,
  finalizeTurn,
  advanceTurn,
  passTurn,
  exchangeTiles,
  applyChallengeResult,
  applyAIMove,
  triggerGameOver,
} from "../game/gameEngine.js";

// ── Create ───────────────────────────────────

/**
 * Create a new game in the database.
 * The creator is always Player 0.
 *
 * @param {Object} creatorUser   — the logged-in User document
 * @param {Array}  setupPlayers  — [{ name, age, type, userId? }]
 *   For human slots: include userId.
 *   For AI slots: type = 'ai', no userId needed.
 * @returns {Game} the saved Mongoose document
 */
export async function createGame(creatorUser, setupPlayers) {
  const gameId = nanoid(6); // e.g. "xK9mQ2"

  // Build the initial engine state
  const engineState = createInitialState(setupPlayers);

  // Attach real user IDs to human player slots
  const playersWithIds = engineState.players.map((p, i) => ({
    ...p,
    userId:      setupPlayers[i]?.userId ?? null,
    displayName: setupPlayers[i]?.name   ?? p.name,
    avatar:      setupPlayers[i]?.avatar ?? null,
  }));

  // If every player is either AI or already has a userId, start immediately
  const allReady = playersWithIds.every(p => p.type === "ai" || p.userId);
  const status   = allReady ? "playing" : "waiting";

  const doc = new Game({
    gameId,
    createdBy: creatorUser._id,
    ...Game.fromEngineState(
      { ...engineState, players: playersWithIds, status }
    ),
  });

  await doc.save();
  return doc;
}

/**
 * Join an existing game as the next open human slot.
 * Returns an error string if the game cannot be joined.
 *
 * @param {string} gameId
 * @param {Object} user    — the logged-in User document
 * @returns {Game|string}
 */
export async function joinGame(gameId, user) {
  const doc = await Game.findOne({ gameId });
  if (!doc)                       return "Game not found.";
  if (doc.status !== "waiting")   return "Game has already started.";

  // Find the first human slot with no userId assigned yet
  // (slot 0 is always the creator, so start from 1)
  const slotIndex = doc.players.findIndex(
    (p, i) => i > 0 && p.type === "human" && !p.userId
  );
  if (slotIndex === -1) return "Game is full.";

  // Make sure this user isn't already in the game
  const alreadyIn = doc.players.some(
    p => p.userId && p.userId.toString() === user._id.toString()
  );
  if (alreadyIn) return "You are already in this game.";

  doc.players[slotIndex].userId      = user._id;
  doc.players[slotIndex].displayName = user.displayName;
  doc.players[slotIndex].avatar      = user.avatar;

  // If all human slots are filled, start the game
  const allFilled = doc.players.every(
    p => p.type === "ai" || p.userId
  );
  if (allFilled) doc.status = "playing";

  doc.updatedAt = new Date();
  await doc.save();
  return doc;
}

// ── Load ─────────────────────────────────────

/**
 * Load a game document and return it as a plain engine state object.
 * Also returns the raw doc so callers can check metadata (gameId, status…).
 *
 * @param {string} gameId
 * @returns {{ doc: Game, state: GameState } | null}
 */
export async function loadGame(gameId) {
  const doc = await Game.findOne({ gameId });
  if (!doc) return null;
  return { doc, state: doc.toEngineState() };
}

// ── Save ─────────────────────────────────────

/**
 * Persist an updated engine state back to MongoDB.
 *
 * @param {Game}      doc    — the original Mongoose document
 * @param {GameState} state  — the updated engine state
 */
export async function saveGame(doc, state) {
  Object.assign(doc, Game.fromEngineState(state));
  await doc.save();
}

// ── Actions ──────────────────────────────────
// Each action function:
//   1. Loads the game
//   2. Validates the actor is the current player
//   3. Runs the engine function
//   4. Saves the result
//   5. Returns { doc, state } or an error string

async function withGame(gameId, userId, fn) {
  const loaded = await loadGame(gameId);
  if (!loaded) return "Game not found.";

  const { doc, state } = loaded;

  // Verify it's this user's turn (skip check for AI turns triggered by server)
  if (userId !== "server") {
    const cp = state.players[state.currentPlayerIndex];
    if (!cp.userId || cp.userId.toString() !== userId.toString()) {
      return "It is not your turn.";
    }
  }

  const newState = fn(state);
  if (typeof newState === "string") return newState; // engine returned error

  await saveGame(doc, newState);
  return { doc, state: newState };
}

export const placeTileAction = (gameId, userId, row, col, tile, displayLetter) =>
  withGame(gameId, userId, s => placeTile(s, row, col, tile, displayLetter));

export const removeTileAction = (gameId, userId, row, col) =>
  withGame(gameId, userId, s => removePlacedTile(s, row, col));

export const assignJokerAction = (gameId, userId, tileId, letter) =>
  withGame(gameId, userId, s => assignJoker(s, tileId, letter));

export const confirmPlacementAction = (gameId, userId) =>
  withGame(gameId, userId, s => {
    const err = validatePlacement(s);
    if (err) return err;
    // Move to challenge phase — finalizeTurn is called after challenge resolves
    return { ...s, status: "challenge" };
  });

export const finalizeTurnAction = (gameId, userId) =>
  withGame(gameId, userId, s => advanceTurn(finalizeTurn(s), false));

export const passTurnAction = (gameId, userId) =>
  withGame(gameId, userId, s => passTurn(s));

export const exchangeTilesAction = (gameId, userId) =>
  withGame(gameId, userId, s => exchangeTiles(s)); // returns error string if invalid

export const challengeResultAction = (gameId, userId, isValid) =>
  withGame(gameId, userId, s => {
    const afterChallenge = applyChallengeResult(s, isValid);
    if (isValid) {
      return advanceTurn(finalizeTurn(afterChallenge), false);
    } else {
      return advanceTurn(afterChallenge, false);
    }
  });

export const applyAIMoveAction = (gameId, placements) =>
  withGame(gameId, "server", s => applyAIMove(s, placements));

export const finalizeAITurnAction = (gameId) =>
  withGame(gameId, "server", s => advanceTurn(finalizeTurn(s), false));

export const passAITurnAction = (gameId) =>
  withGame(gameId, "server", s => {
    const logEntry = `${s.players[s.currentPlayerIndex].displayName}: пас (AI)`;
    return advanceTurn({ ...s, gameLog: [...s.gameLog, logEntry] }, true);
  });