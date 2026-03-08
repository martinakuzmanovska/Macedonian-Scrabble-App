import mongoose from "mongoose";

// ── Tile ─────────────────────────────────────
const tileSchema = new mongoose.Schema({
  id:     { type: String, required: true },
  letter: { type: String, required: true },
  points: { type: Number, required: true },
}, { _id: false });

// ── Board cell (tile + displayLetter) ────────
const cellSchema = new mongoose.Schema({
  id:            { type: String, required: true },
  letter:        { type: String, required: true },
  points:        { type: Number, required: true },
  displayLetter: { type: String, required: true },
}, { _id: false });

// ── Placed tile (position + tile) ────────────
const placedTileSchema = new mongoose.Schema({
  row:  { type: Number, required: true },
  col:  { type: Number, required: true },
  tile: { type: tileSchema, required: true },
}, { _id: false });

// ── Player ───────────────────────────────────
const playerSchema = new mongoose.Schema({
  index:       { type: Number, required: true },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // null for AI
  displayName: { type: String, required: true },
  avatar:      { type: String, default: null },
  age:         { type: Number, default: 25 },
  type:        { type: String, enum: ["human", "ai"], required: true },
  rack:        { type: [tileSchema], default: [] },
  score:       { type: Number, default: 0 },
  skipPenalty: { type: Boolean, default: false },
}, { _id: false });

// ── Word record (for end-game bonuses) ───────
const wordRecordSchema = new mongoose.Schema({
  longestWord: { type: String, default: "" },
  longestLen:  { type: Number, default: 0 },
  bestWord:    { type: String, default: "" },
  bestScore:   { type: Number, default: 0 },
}, { _id: false });

// ── Main Game schema ─────────────────────────
const gameSchema = new mongoose.Schema({
  // Short ID shared in invite links e.g. "xK9mQ"
  gameId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Lifecycle
  status: {
    type: String,
    enum: ["waiting", "playing", "challenge", "finished"],
    default: "waiting",
  },

  // Players (2-4)
  players:            { type: [playerSchema], default: [] },
  currentPlayerIndex: { type: Number, default: 0 },

  // Board — stored as a flat array of arrays.
  // Each cell is either null or a cellSchema object.
  // Mongoose doesn't handle 2D arrays of mixed types well,
  // so we store as JSON strings and parse on read.
  boardJSON:          { type: String, default: null },
  confirmedBoardJSON: { type: String, default: null },

  // Tiles
  tileBag:            { type: [tileSchema], default: [] },
  jokerAssignments:   { type: mongoose.Schema.Types.Mixed, default: {} },

  // Turn state (in-progress, not yet confirmed)
  placedTiles:        { type: [placedTileSchema], default: [] },
  turnScore:          { type: Number, default: 0 },
  formedWordsJSON:    { type: String, default: "[]" },

  // Game flow
  isFirstMove:        { type: Boolean, default: true },
  consecutivePasses:  { type: Number, default: 0 },
  gameLog:            { type: [String], default: [] },

  // End-game tracking
  wordRecordsJSON:    { type: String, default: "{}" },
  endBonusesJSON:     { type: String, default: "null" },

  // Meta
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ── Helpers to convert between GameState and Mongoose doc ──

/**
 * Convert a plain GameState object (from the engine) into
 * the fields needed to create or update a Mongoose document.
 */
gameSchema.statics.fromEngineState = function(state, extra = {}) {
  return {
    status:             state.status === "gameOver" ? "finished" : state.status,
    players:            state.players,
    currentPlayerIndex: state.currentPlayerIndex,
    boardJSON:          JSON.stringify(state.board),
    confirmedBoardJSON: JSON.stringify(state.confirmedBoard),
    tileBag:            state.tileBag,
    jokerAssignments:   state.jokerAssignments,
    placedTiles:        state.placedTiles,
    turnScore:          state.turnScore,
    formedWordsJSON:    JSON.stringify(state.formedWords),
    isFirstMove:        state.isFirstMove,
    consecutivePasses:  state.consecutivePasses,
    gameLog:            state.gameLog,
    wordRecordsJSON:    JSON.stringify(state.wordRecords),
    endBonusesJSON:     JSON.stringify(state.endBonuses),
    updatedAt:          new Date(),
    ...extra,
  };
};

/**
 * Convert a Mongoose document back into a plain GameState object
 * that the engine functions can work with.
 */
gameSchema.methods.toEngineState = function() {
  return {
    status:             this.status === "finished" ? "gameOver" : this.status,
    players:            this.players.map(p => p.toObject()),
    currentPlayerIndex: this.currentPlayerIndex,
    board:              JSON.parse(this.boardJSON),
    confirmedBoard:     JSON.parse(this.confirmedBoardJSON),
    tileBag:            this.tileBag.map(t => t.toObject()),
    jokerAssignments:   this.jokerAssignments,
    placedTiles:        this.placedTiles.map(p => p.toObject()),
    turnScore:          this.turnScore,
    formedWords:        JSON.parse(this.formedWordsJSON),
    isFirstMove:        this.isFirstMove,
    consecutivePasses:  this.consecutivePasses,
    gameLog:            this.gameLog,
    wordRecords:        JSON.parse(this.wordRecordsJSON),
    endBonuses:         JSON.parse(this.endBonusesJSON),
  };
};

export default mongoose.model("Game", gameSchema);