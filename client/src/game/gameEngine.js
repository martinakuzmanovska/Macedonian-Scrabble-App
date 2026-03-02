// ═══════════════════════════════════════════
// MACEDONIAN SCRABBLE — GAME ENGINE
//
// Pure functions only. Every function:
//   - Takes a state object (or slice of one)
//   - Returns a NEW state object (never mutates)
//   - Has zero side effects
//   - Runs identically in Node.js and the browser
//
// The React component and the server both import
// from here. This is the single source of truth
// for all game rules.
// ═══════════════════════════════════════════

import { BONUS_MAP, getPoints } from './constants.js';
import { drawTiles, returnTilesToBag, createEmptyBoard } from './gameState.js';

// ─── Board helpers ──────────────────────────

/**
 * Get the display letter at a board position.
 * Returns null if the cell is empty or out of bounds.
 */
function getLetter(board, row, col) {
  if (row < 0 || row > 14 || col < 0 || col > 14) return null;
  const cell = board[row][col];
  if (!cell) return null;
  return cell.displayLetter || cell.letter;
}

/**
 * Deep-clone the board (array of arrays, shallow-clone each row).
 * Tiles themselves are not cloned — they are treated as immutable value objects.
 */
function cloneBoard(board) {
  return board.map(row => [...row]);
}

// ─── Word detection ─────────────────────────

/**
 * Find all words formed by a set of newly placed tiles on a board.
 *
 * @param {Array<Array<TileCell|null>>} board        Full board including new tiles.
 * @param {PlacedTile[]}               placedTiles   The tiles placed this turn.
 * @returns {WordResult[]}
 */
export function findFormedWords(board, placedTiles) {
  if (!placedTiles.length) return [];
  const seen = new Set();
  const results = [];

  const extractWord = (startRow, startCol, dr, dc) => {
    // Walk to the beginning of the word
    let sr = startRow, sc = startCol;
    while (getLetter(board, sr - dr, sc - dc)) { sr -= dr; sc -= dc; }

    // Walk forward collecting letters
    let word = '';
    const cells = [];
    let cr = sr, cc = sc;
    while (getLetter(board, cr, cc)) {
      word += getLetter(board, cr, cc);
      cells.push({ row: cr, col: cc });
      cr += dr;
      cc += dc;
    }

    if (word.length < 2) return null;

    // Deduplicate by direction + start position
    const key = `${dr}-${dc}-${cells[0].row}-${cells[0].col}`;
    if (seen.has(key)) return null;
    seen.add(key);

    return { word, cells };
  };

  for (const p of placedTiles) {
    const h = extractWord(p.row, p.col, 0, 1); // horizontal
    if (h) results.push(h);
    const v = extractWord(p.row, p.col, 1, 0); // vertical
    if (v) results.push(v);
  }

  return results;
}

// ─── Scoring ────────────────────────────────

/**
 * Calculate the score for the current turn.
 *
 * Bonus squares only apply to newly placed tiles (those in placedTiles
 * that don't yet appear in confirmedBoard).
 *
 * @param {Array<Array<TileCell|null>>} board
 * @param {PlacedTile[]}               placedTiles
 * @param {Array<Array<TileCell|null>>} confirmedBoard
 * @returns {{ total: number, words: WordResult[] }}
 */
export function calcScore(board, placedTiles, confirmedBoard) {
  const words = findFormedWords(board, placedTiles);

  // Set of "row-col" keys that are newly placed this turn
  const newlyPlaced = new Set(placedTiles.map(p => `${p.row}-${p.col}`));

  let total = 0;
  for (const w of words) {
    let wordScore = 0;
    let wordMultiplier = 1;

    for (const cell of w.cells) {
      const tile = board[cell.row]?.[cell.col];
      if (!tile) continue;

      let letterPoints = tile.letter === '★' ? 0 : getPoints(tile.letter);

      // Only apply bonus if this tile was placed THIS turn
      // (confirmed tiles have already had their bonuses applied)
      const isNew = newlyPlaced.has(`${cell.row}-${cell.col}`)
        && !confirmedBoard[cell.row][cell.col];

      if (isNew) {
        const bonus = BONUS_MAP[cell.row][cell.col];
        if      (bonus === 'TL')              letterPoints *= 3;
        else if (bonus === 'DL')              letterPoints *= 2;
        else if (bonus === 'TW')              wordMultiplier *= 3;
        else if (bonus === 'DW' || bonus === 'ST') wordMultiplier *= 2;
      }

      wordScore += letterPoints;
    }

    total += wordScore * wordMultiplier;
  }

  // Bingo bonus: using all 7 tiles in one turn
  if (placedTiles.length === 7) total += 50;

  return { total, words };
}

// ─── Placement validation ───────────────────

/**
 * Validate the current placement against all Scrabble rules.
 *
 * @param {GameState} state
 * @returns {string|null}  Error message, or null if the placement is valid.
 */
export function validatePlacement(state) {
  const { placedTiles, board, isFirstMove, confirmedBoard, formedWords } = state;

  if (!placedTiles.length) return 'Постави барем една плочка.';

  const rows = [...new Set(placedTiles.map(p => p.row))];
  const cols = [...new Set(placedTiles.map(p => p.col))];

  // Must be in a single row OR single column
  if (rows.length > 1 && cols.length > 1) {
    return 'Плочките мора да се во ист ред или колона.';
  }

  // No gaps allowed within the placed sequence
  if (rows.length === 1) {
    const sortedCols = placedTiles.map(p => p.col).sort((a, b) => a - b);
    for (let c = sortedCols[0]; c <= sortedCols[sortedCols.length - 1]; c++) {
      if (!board[rows[0]][c]) return 'Не смее да има празнини.';
    }
  }
  if (cols.length === 1) {
    const sortedRows = placedTiles.map(p => p.row).sort((a, b) => a - b);
    for (let r = sortedRows[0]; r <= sortedRows[sortedRows.length - 1]; r++) {
      if (!board[r][cols[0]]) return 'Не смее да има празнини.';
    }
  }

  if (isFirstMove) {
    // First word must cover the centre star (7,7)
    if (!placedTiles.some(p => p.row === 7 && p.col === 7)) {
      return 'Првиот збор мора да го покрие центарот (★).';
    }
    if (placedTiles.length < 2) {
      return 'Првиот збор мора да има барем 2 букви.';
    }
  } else {
    // All subsequent words must connect to existing tiles
    let connected = false;
    outer: for (const p of placedTiles) {
      for (const [nr, nc] of [
        [p.row - 1, p.col], [p.row + 1, p.col],
        [p.row, p.col - 1], [p.row, p.col + 1],
      ]) {
        if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && confirmedBoard[nr][nc]) {
          connected = true;
          break outer;
        }
      }
    }
    if (!connected) return 'Зборот мора да се поврзе со постоечки плочки.';
  }

  if (!formedWords.length) return 'Не е формиран збор.';

  return null; // valid
}

// ─── Tile placement ─────────────────────────

/**
 * Place a tile from the current player's rack onto the board.
 *
 * @param {GameState} state
 * @param {number}    row
 * @param {number}    col
 * @param {Tile}      tile          The tile object (still has rackIndex attached by the UI).
 * @param {string}    displayLetter The letter to display (may differ from tile.letter for jokers).
 * @returns {GameState}
 */
export function placeTile(state, row, col, tile, displayLetter) {
  // Don't allow placing on an occupied cell
  if (state.board[row][col]) return state;

  const newBoard = cloneBoard(state.board);
  newBoard[row][col] = { ...tile, displayLetter };

  const newPlacedTiles = [...state.placedTiles, { row, col, tile }];

  // Remove tile from the current player's rack by rackIndex
  const players = state.players.map((p, i) => {
    if (i !== state.currentPlayerIndex) return p;
    return {
      ...p,
      rack: p.rack.filter((_, idx) => idx !== tile.rackIndex),
    };
  });

  // Recalculate score preview
  const { total, words } = calcScore(newBoard, newPlacedTiles, state.confirmedBoard);

  return {
    ...state,
    board: newBoard,
    placedTiles: newPlacedTiles,
    players,
    turnScore: total,
    formedWords: words,
  };
}

/**
 * Remove a tile that was placed this turn, returning it to the rack.
 *
 * @param {GameState} state
 * @param {number}    row
 * @param {number}    col
 * @returns {GameState}
 */
export function removePlacedTile(state, row, col) {
  const placed = state.placedTiles.find(p => p.row === row && p.col === col);
  if (!placed) return state;

  const newBoard = cloneBoard(state.board);
  newBoard[row][col] = null;

  const newPlacedTiles = state.placedTiles.filter(
    p => !(p.row === row && p.col === col)
  );

  const players = state.players.map((p, i) => {
    if (i !== state.currentPlayerIndex) return p;
    return { ...p, rack: [...p.rack, placed.tile] };
  });

  const { total, words } = calcScore(newBoard, newPlacedTiles, state.confirmedBoard);

  return {
    ...state,
    board: newBoard,
    placedTiles: newPlacedTiles,
    players,
    turnScore: total,
    formedWords: words,
  };
}

/**
 * Return ALL tiles placed this turn back to the current player's rack.
 * Used when a challenge is lost or the player wants to undo everything.
 *
 * @param {GameState} state
 * @returns {GameState}
 */
export function returnAllPlacedTiles(state) {
  const newBoard = cloneBoard(state.board);
  const returned = [];

  for (const p of state.placedTiles) {
    newBoard[p.row][p.col] = null;
    returned.push(p.tile);
  }

  const players = state.players.map((p, i) => {
    if (i !== state.currentPlayerIndex) return p;
    return { ...p, rack: [...p.rack, ...returned] };
  });

  return {
    ...state,
    board: newBoard,
    placedTiles: [],
    players,
    turnScore: 0,
    formedWords: [],
  };
}

/**
 * Assign a letter to a joker tile.
 * The jokerAssignments map is stored in state so the server knows
 * which letter each joker is playing as (needed for word validation).
 *
 * @param {GameState} state
 * @param {string}    tileId
 * @param {string}    letter
 * @returns {GameState}
 */
export function assignJoker(state, tileId, letter) {
  return {
    ...state,
    jokerAssignments: { ...state.jokerAssignments, [tileId]: letter },
  };
}

// ─── Turn flow ──────────────────────────────

/**
 * Confirm the current turn placement (after optional challenge phase).
 * Awards points, draws new tiles, updates confirmedBoard, updates word records.
 *
 * Does NOT advance to the next player — call advanceTurn() after this.
 *
 * @param {GameState} state
 * @returns {GameState}
 */
export function finalizeTurn(state) {
  const { currentPlayerIndex, turnScore, formedWords, placedTiles, players, tileBag } = state;

  // Award score
  let updatedPlayers = players.map((p, i) => {
    if (i !== currentPlayerIndex) return p;
    return { ...p, score: p.score + turnScore };
  });

  // Draw replacement tiles
  const needed = 7 - updatedPlayers[currentPlayerIndex].rack.length;
  const { drawn, remainingBag } = drawTiles(tileBag, needed);
  updatedPlayers = updatedPlayers.map((p, i) => {
    if (i !== currentPlayerIndex) return p;
    return { ...p, rack: [...p.rack, ...drawn] };
  });

  // Freeze the board
  const newConfirmedBoard = state.board.map(row => row.map(cell => cell ? { ...cell } : null));

  // Update word records (for end-game bonuses)
  const wordRecords = { ...state.wordRecords };
  if (!wordRecords[currentPlayerIndex]) {
    wordRecords[currentPlayerIndex] = {
      longestWord: '', longestLen: 0,
      bestWord: '',    bestScore: 0,
    };
  }
  for (const w of formedWords) {
    if (w.word.length > wordRecords[currentPlayerIndex].longestLen) {
      wordRecords[currentPlayerIndex].longestWord = w.word;
      wordRecords[currentPlayerIndex].longestLen  = w.word.length;
    }
  }
  if (turnScore > wordRecords[currentPlayerIndex].bestScore) {
    wordRecords[currentPlayerIndex].bestWord  = formedWords.map(w => w.word).join('+');
    wordRecords[currentPlayerIndex].bestScore = turnScore;
  }

  // Build a log entry
  const logEntry = `${players[currentPlayerIndex].name}: ${formedWords.map(w => w.word).join(', ')} (+${turnScore})`;

  return {
    ...state,
    players: updatedPlayers,
    tileBag: remainingBag,
    confirmedBoard: newConfirmedBoard,
    wordRecords,
    gameLog: [...state.gameLog, logEntry],
    // Clear turn state
    placedTiles: [],
    turnScore: 0,
    formedWords: [],
    isFirstMove: false,
    consecutivePasses: 0,
  };
}

/**
 * Advance to the next player, skipping anyone with a skipPenalty.
 * Checks for game-over conditions.
 *
 * @param {GameState} state
 * @param {boolean}   wasSkip   True if the current turn was a pass (no tiles played).
 * @returns {GameState}
 */
export function advanceTurn(state, wasSkip = false) {
  let { players, currentPlayerIndex, consecutivePasses, tileBag } = state;

  // Check: current player emptied rack and bag is empty → game over
  if (tileBag.length === 0 && players[currentPlayerIndex].rack.length === 0) {
    return triggerGameOver(state);
  }

  // Count consecutive passes
  const newConsecutivePasses = wasSkip ? consecutivePasses + 1 : consecutivePasses;
  if (newConsecutivePasses >= players.length * 2) {
    return triggerGameOver({ ...state, consecutivePasses: newConsecutivePasses });
  }

  // Find next player, skipping those with a penalty
  let next = (currentPlayerIndex + 1) % players.length;
  let attempts = 0;
  const updatedPlayers = [...players];
  while (updatedPlayers[next].skipPenalty && attempts < players.length) {
    const logEntry = `${updatedPlayers[next].name}: прескокнат (казна)`;
    updatedPlayers[next] = { ...updatedPlayers[next], skipPenalty: false };
    next = (next + 1) % players.length;
    attempts++;
    // We'll add the log entry below via spread
    state = { ...state, gameLog: [...state.gameLog, logEntry] };
  }

  return {
    ...state,
    players: updatedPlayers,
    currentPlayerIndex: next,
    consecutivePasses: newConsecutivePasses,
    // Clear any leftover turn state
    placedTiles: [],
    turnScore: 0,
    formedWords: [],
    status: 'playing',
  };
}

/**
 * Pass the current turn without playing any tiles.
 *
 * @param {GameState} state
 * @returns {GameState}
 */
export function passTurn(state) {
  const logEntry = `${state.players[state.currentPlayerIndex].name}: пас`;
  const withLog = { ...state, gameLog: [...state.gameLog, logEntry] };
  const returned = returnAllPlacedTiles(withLog); // safety: clear anything placed
  return advanceTurn(returned, true);
}

/**
 * Exchange the current player's tiles.
 * Costs 5 points. Does NOT end the turn — player continues with the new rack.
 *
 * Returns an error string if the exchange is not allowed, or a new state if it is.
 *
 * @param {GameState} state
 * @returns {GameState | string}
 */
export function exchangeTiles(state) {
  const { players, currentPlayerIndex, tileBag, placedTiles } = state;
  const player = players[currentPlayerIndex];

  if (placedTiles.length > 0) {
    return 'Замена е дозволена само ПРЕД да поставиш букви! Врати ги прво.';
  }
  if (player.score < 5) {
    return `Немаш доволно поени за замена (потребни 5, имаш ${player.score}).`;
  }
  if (tileBag.length < 7) {
    return 'Нема доволно плочки во кесата.';
  }

  const oldRack = [...player.rack];
  const { drawn, remainingBag } = drawTiles(tileBag, oldRack.length);
  const newBag = returnTilesToBag(remainingBag, oldRack);

  const updatedPlayers = players.map((p, i) => {
    if (i !== currentPlayerIndex) return p;
    return { ...p, score: p.score - 5, rack: drawn };
  });

  const logEntry = `${player.name}: замена (-5 п.)`;

  return {
    ...state,
    players: updatedPlayers,
    tileBag: newBag,
    gameLog: [...state.gameLog, logEntry],
  };
}

/**
 * Apply the result of a word challenge.
 *
 * If the word is VALID:   the challenger (next human player) gets a skipPenalty.
 * If the word is INVALID: all placed tiles are returned to the current player's rack.
 *
 * After calling this, the caller should either call finalizeTurn() (valid)
 * or advanceTurn() (invalid, turn lost) as appropriate.
 *
 * @param {GameState} state
 * @param {boolean}   isValid
 * @returns {GameState}
 */
export function applyChallengeResult(state, isValid) {
  if (isValid) {
    // Find the next human player — they lose their next turn
    let challengerIdx = -1;
    for (let off = 1; off < state.players.length; off++) {
      const idx = (state.currentPlayerIndex + off) % state.players.length;
      if (state.players[idx].type === 'human') { challengerIdx = idx; break; }
    }

    if (challengerIdx === -1) return state; // no human challenger found

    const updatedPlayers = state.players.map((p, i) => {
      if (i !== challengerIdx) return p;
      return { ...p, skipPenalty: true };
    });

    const logEntry = `🔍 "${state.formedWords.map(w => w.word).join(', ')}" потврден — ${updatedPlayers[challengerIdx].name} казнет`;
    return {
      ...state,
      players: updatedPlayers,
      gameLog: [...state.gameLog, logEntry],
    };
  } else {
    // Word invalid — return tiles, current player loses turn
    const logEntry = `🔍 "${state.formedWords.map(w => w.word).join(', ')}" одбиен`;
    const withLog = { ...state, gameLog: [...state.gameLog, logEntry] };
    return returnAllPlacedTiles(withLog);
  }
}

// ─── AI move application ────────────────────

/**
 * Apply an AI-generated move to the board.
 * The AI returns a list of placements: [{ row, col, letter }].
 * This function matches those to rack tiles and places them.
 *
 * @param {GameState} state
 * @param {Array<{row:number, col:number, letter:string}>} placements
 * @returns {GameState}
 */
export function applyAIMove(state, placements) {
  let newState = state;
  let rackCopy = [...state.players[state.currentPlayerIndex].rack];
  const newJokerAssignments = { ...state.jokerAssignments };

  // Build intermediate state step by step
  let newBoard = cloneBoard(state.confirmedBoard); // start from confirmed
  const newPlacedTiles = [];

  for (const pl of placements) {
    if (pl.row < 0 || pl.row > 14 || pl.col < 0 || pl.col > 14) continue;
    if (newBoard[pl.row][pl.col]) continue; // already occupied

    // Try to find a matching tile in the rack
    let tileIndex = rackCopy.findIndex(t => t.letter === pl.letter);

    // If not found, try to use a joker
    if (tileIndex === -1) {
      tileIndex = rackCopy.findIndex(t => t.letter === '★');
      if (tileIndex !== -1) {
        newJokerAssignments[rackCopy[tileIndex].id] = pl.letter;
      }
    }

    if (tileIndex === -1) continue; // can't place this tile

    const tile = rackCopy[tileIndex];
    rackCopy = rackCopy.filter((_, i) => i !== tileIndex);

    newBoard[pl.row][pl.col] = { ...tile, displayLetter: pl.letter };
    newPlacedTiles.push({ row: pl.row, col: pl.col, tile });
  }

  if (!newPlacedTiles.length) return state; // nothing was placed

  const updatedPlayers = state.players.map((p, i) => {
    if (i !== state.currentPlayerIndex) return p;
    return { ...p, rack: rackCopy };
  });

  const { total, words } = calcScore(newBoard, newPlacedTiles, state.confirmedBoard);

  return {
    ...state,
    board: newBoard,
    placedTiles: newPlacedTiles,
    players: updatedPlayers,
    jokerAssignments: newJokerAssignments,
    turnScore: total,
    formedWords: words,
  };
}

// ─── Game over ──────────────────────────────

const LONGEST_BONUS   = 15;
const BESTSCORE_BONUS = 10;

/**
 * End the game: deduct remaining tile values, award end-game bonuses.
 *
 * @param {GameState} state
 * @returns {GameState}
 */
export function triggerGameOver(state) {
  let players = state.players.map(p => ({
    ...p,
    score: Math.max(0, p.score - p.rack.reduce((sum, t) => sum + t.points, 0)),
  }));

  // Find who had the longest word and the best single-turn score
  let globalLongestLen = 0,  longestPlayers   = [];
  let globalBestScore  = 0,  bestScorePlayers = [];

  for (let i = 0; i < players.length; i++) {
    const rec = state.wordRecords[i];
    if (!rec) continue;

    if (rec.longestLen > globalLongestLen) {
      globalLongestLen = rec.longestLen;
      longestPlayers = [i];
    } else if (rec.longestLen === globalLongestLen && globalLongestLen > 0) {
      longestPlayers.push(i);
    }

    if (rec.bestScore > globalBestScore) {
      globalBestScore = rec.bestScore;
      bestScorePlayers = [i];
    } else if (rec.bestScore === globalBestScore && globalBestScore > 0) {
      bestScorePlayers.push(i);
    }
  }

  // Award bonuses
  const bonuses = {};
  for (const pi of longestPlayers) {
    if (!bonuses[pi]) bonuses[pi] = { longest: 0, bestScore: 0 };
    bonuses[pi].longest = LONGEST_BONUS;
    players = players.map((p, i) =>
      i === pi ? { ...p, score: p.score + LONGEST_BONUS } : p
    );
  }
  for (const pi of bestScorePlayers) {
    if (!bonuses[pi]) bonuses[pi] = { longest: 0, bestScore: 0 };
    bonuses[pi].bestScore = BESTSCORE_BONUS;
    players = players.map((p, i) =>
      i === pi ? { ...p, score: p.score + BESTSCORE_BONUS } : p
    );
  }

  const endBonuses = {
    longestPlayers:   longestPlayers.map(i => ({
      name:  players[i].name,
      word:  state.wordRecords[i]?.longestWord,
      len:   globalLongestLen,
      bonus: LONGEST_BONUS,
    })),
    bestScorePlayers: bestScorePlayers.map(i => ({
      name:  players[i].name,
      word:  state.wordRecords[i]?.bestWord,
      score: globalBestScore,
      bonus: BESTSCORE_BONUS,
    })),
    playerBonuses: bonuses,
  };

  return {
    ...state,
    players,
    endBonuses,
    status: 'gameOver',
    // Clear any in-progress turn state
    placedTiles: [],
    turnScore: 0,
    formedWords: [],
  };
}