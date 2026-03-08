// ═══════════════════════════════════════════
// MACEDONIAN SCRABBLE — GAME STATE
//
// Defines the canonical shape of a game and
// the factory that creates a fresh one.
// No React. No side effects. Runs in Node.
// ═══════════════════════════════════════════

import { TILE_CONFIG } from './constants.js';

// ─── Tile bag ───────────────────────────────

/**
 * Build and shuffle a full tile bag.
 * Returns a plain array of tile objects.
 * Each tile: { id, letter, points }
 */
export function createTileBag() {
  const bag = [];
  for (const [letter, config] of Object.entries(TILE_CONFIG)) {
    for (let i = 0; i < config.count; i++) {
      bag.push({
        id: `${letter}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        letter,
        points: config.points,
      });
    }
  }
  // Fisher-Yates shuffle
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

/**
 * Draw `count` tiles from the front of the bag.
 * NON-MUTATING — returns { drawn, remainingBag }.
 */
export function drawTiles(bag, count) {
  const take = Math.min(count, bag.length);
  return {
    drawn: bag.slice(0, take),
    remainingBag: bag.slice(take),
  };
}

/**
 * Return tiles to the bag and reshuffle.
 * NON-MUTATING.
 */
export function returnTilesToBag(bag, tiles) {
  const newBag = [...bag, ...tiles];
  for (let i = newBag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
  }
  return newBag;
}

// ─── Board ──────────────────────────────────

/** 15×15 grid of nulls. */
export function createEmptyBoard() {
  return Array(15).fill(null).map(() => Array(15).fill(null));
}

// ─── State shape ────────────────────────────

/**
 * Complete game state object.
 * This is the single source of truth for a game.
 * Every field is documented below.
 *
 * @typedef {Object} GameState
 *
 * // ── Lifecycle ──
 * @property {'idle'|'playing'|'challenge'|'gameOver'} status
 * @property {boolean} isFirstMove         True until the first word is confirmed.
 * @property {number}  consecutivePasses   Resets to 0 on any scoring turn.
 * @property {string[]} gameLog            Human-readable turn history.
 *
 * // ── Board ──
 * @property {Array<Array<TileCell|null>>} board
 *   Live board including unconfirmed tiles placed this turn.
 * @property {Array<Array<TileCell|null>>} confirmedBoard
 *   Board as of the last confirmed turn. Used for bonus calculation
 *   (bonuses only apply to newly placed tiles, not old ones).
 *
 * // ── Tiles ──
 * @property {Tile[]} tileBag              Remaining undealt tiles.
 * @property {Object} jokerAssignments     { [tileId]: 'А' } — which letter a joker is playing as.
 *
 * // ── Players ──
 * @property {Player[]} players
 * @property {number}   currentPlayerIndex
 *
 * // ── Current turn (in-progress, not yet confirmed) ──
 * @property {PlacedTile[]} placedTiles    Tiles placed this turn, not yet confirmed.
 * @property {number}       turnScore      Live score preview for the current placement.
 * @property {WordResult[]} formedWords    Words formed by the current placement.
 *
 * // ── End-game tracking ──
 * @property {Object} wordRecords          { [playerIndex]: { longestWord, longestLen, bestWord, bestScore } }
 * @property {Object|null} endBonuses      Populated at game over. null during play.
 *
 * @typedef {Object} Tile
 * @property {string} id
 * @property {string} letter    Macedonian capital letter, or '★' for joker.
 * @property {number} points
 *
 * @typedef {Object} TileCell   A tile as it sits on the board.
 * @property {string} id
 * @property {string} letter
 * @property {number} points
 * @property {string} displayLetter  The letter shown (differs from letter for jokers).
 *
 * @typedef {Object} Player
 * @property {number}  index
 * @property {string}  name
 * @property {number}  age
 * @property {'human'|'ai'} type
 * @property {Tile[]}  rack
 * @property {number}  score
 * @property {boolean} skipPenalty  True if this player must skip their next turn.
 *
 * @typedef {Object} PlacedTile
 * @property {number} row
 * @property {number} col
 * @property {Tile}   tile       The original tile from the rack.
 *
 * @typedef {Object} WordResult
 * @property {string} word
 * @property {Array<{row:number, col:number}>} cells
 */

// ─── Factory ────────────────────────────────

/**
 * Create a fresh GameState from a player setup array.
 *
 * @param {Array<{name:string, age:number, type:'human'|'ai'}>} setupPlayers
 * @returns {GameState}
 */
export function createInitialState(setupPlayers) {
  let bag = createTileBag();
  const players = setupPlayers.map((sp, index) => {
    const { drawn, remainingBag } = drawTiles(bag, 7);
    bag = remainingBag;
    return {
      index,
      name: sp.name,
      age: sp.age,
      type: sp.type,
      rack: drawn,
      score: 0,
      skipPenalty: false,
    };
  });

  return {
    // Lifecycle
    status: 'playing',
    isFirstMove: true,
    consecutivePasses: 0,
    gameLog: [],

    // Board
    board: createEmptyBoard(),
    confirmedBoard: createEmptyBoard(),

    // Tiles
    tileBag: bag,
    jokerAssignments: {},

    // Players
    players,
    currentPlayerIndex: 0,

    // Current turn
    placedTiles: [],
    turnScore: 0,
    formedWords: [],

    // End-game tracking
    wordRecords: {},
    endBonuses: null,
  };
}