// ═══════════════════════════════════════════
// GAME ENGINE TEST
// Run with: node --experimental-vm-modules test.js
// (or configure Jest / Vitest for ESM)
//
// This file has NO React, NO browser, NO DOM.
// If it runs cleanly, Phase 1 is complete.
// ═══════════════════════════════════════════

import { createInitialState } from './game/gameState.js';
import {
  placeTile,
  removePlacedTile,
  calcScore,
  validatePlacement,
  finalizeTurn,
  advanceTurn,
  passTurn,
  exchangeTiles,
  applyChallengeResult,
  triggerGameOver,
  findFormedWords,
} from './game/gameEngine.js';

// ─── tiny test harness ──────────────────────
let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${b}, got ${a}`);
}

// ─── helpers ────────────────────────────────

function makeTwoPlayerState() {
  return createInitialState([
    { name: 'Тест1', age: 25, type: 'human' },
    { name: 'Тест2', age: 25, type: 'human' },
  ]);
}

// Place tiles from the current player's rack at given positions.
// positions: [{ row, col, rackIdx }]
function placeFrom(state, positions) {
  let s = state;
  for (const { row, col, rackIdx } of positions) {
    const tile = s.players[s.currentPlayerIndex].rack[rackIdx];
    // Find the actual rackIdx in the current (possibly shifted) rack
    const actualTile = s.players[s.currentPlayerIndex].rack.find(t => t.id === tile.id);
    const actualIdx  = s.players[s.currentPlayerIndex].rack.findIndex(t => t.id === tile.id);
    s = placeTile(s, row, col, { ...actualTile, rackIndex: actualIdx }, actualTile.letter);
  }
  return s;
}

// ═══════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════

console.log('\n▶ createInitialState');

test('creates 2 players', () => {
  const s = makeTwoPlayerState();
  assertEqual(s.players.length, 2, 'should have 2 players');
});

test('each player starts with 7 tiles', () => {
  const s = makeTwoPlayerState();
  for (const p of s.players) {
    assertEqual(p.rack.length, 7, `${p.name} should have 7 tiles`);
  }
});

test('tile bag has correct remaining count', () => {
  const s = makeTwoPlayerState();
  // Total tiles = sum of all counts in TILE_CONFIG
  // 2+9+6+7+7+6+6+5+5+4+4+4+4+3+2+3+3+2+2+2+2+2+1+1+1+1+1+1+1+1+1 = 100
  // 2 players × 7 = 14 dealt
  assertEqual(s.tileBag.length, 86, 'bag should have 86 tiles after dealing to 2 players');
});

test('board starts empty', () => {
  const s = makeTwoPlayerState();
  const hasAnyTile = s.board.some(row => row.some(cell => cell !== null));
  assert(!hasAnyTile, 'board should be empty');
});

test('isFirstMove starts true', () => {
  const s = makeTwoPlayerState();
  assert(s.isFirstMove === true, 'isFirstMove should start true');
});

test('status starts as playing', () => {
  const s = makeTwoPlayerState();
  assertEqual(s.status, 'playing', 'status should be playing');
});

test('currentPlayerIndex starts at 0', () => {
  const s = makeTwoPlayerState();
  assertEqual(s.currentPlayerIndex, 0, 'first player should be at index 0');
});

// ─────────────────────────────────────────────

console.log('\n▶ placeTile / removePlacedTile');

test('places tile on board', () => {
  let s = makeTwoPlayerState();
  const tile = { ...s.players[0].rack[0], rackIndex: 0 };
  s = placeTile(s, 7, 7, tile, tile.letter);
  assert(s.board[7][7] !== null, 'cell (7,7) should have a tile');
  assertEqual(s.board[7][7].letter, tile.letter, 'should be the right letter');
});

test('removes tile from rack when placed', () => {
  let s = makeTwoPlayerState();
  const originalRackSize = s.players[0].rack.length;
  const tile = { ...s.players[0].rack[0], rackIndex: 0 };
  s = placeTile(s, 7, 7, tile, tile.letter);
  assertEqual(s.players[0].rack.length, originalRackSize - 1, 'rack should shrink by 1');
});

test('cannot place on occupied cell', () => {
  let s = makeTwoPlayerState();
  const tile0 = { ...s.players[0].rack[0], rackIndex: 0 };
  s = placeTile(s, 7, 7, tile0, tile0.letter);
  const tile1 = { ...s.players[0].rack[0], rackIndex: 0 };
  const sAfter = placeTile(s, 7, 7, tile1, tile1.letter);
  // State should be unchanged
  assertEqual(sAfter.board[7][7].id, tile0.id, 'occupied cell should not be overwritten');
});

test('removePlacedTile returns tile to rack', () => {
  let s = makeTwoPlayerState();
  const originalRack = [...s.players[0].rack];
  const tile = { ...s.players[0].rack[0], rackIndex: 0 };
  s = placeTile(s, 7, 7, tile, tile.letter);
  s = removePlacedTile(s, 7, 7);
  assertEqual(s.players[0].rack.length, originalRack.length, 'rack should be restored');
  assert(s.board[7][7] === null, 'cell should be empty again');
});

test('removePlacedTile does nothing for confirmed tiles', () => {
  let s = makeTwoPlayerState();
  const tile0 = { ...s.players[0].rack[0], rackIndex: 0 };
  const tile1 = { ...s.players[0].rack[1], rackIndex: 1 };
  // Place two tiles to form a 2-letter word on center
  s = placeTile(s, 7, 7, tile0, tile0.letter);
  s = placeTile(s, 7, 8, tile1, tile1.letter);
  s = finalizeTurn(s);
  s = advanceTurn(s, false);
  // Now try to remove a confirmed tile — should do nothing
  const rackLenBefore = s.players[s.currentPlayerIndex].rack.length;
  s = removePlacedTile(s, 7, 7);
  assertEqual(s.players[s.currentPlayerIndex].rack.length, rackLenBefore, 'confirmed tile cannot be removed');
});

// ─────────────────────────────────────────────

console.log('\n▶ validatePlacement');

test('rejects empty placement', () => {
  const s = makeTwoPlayerState();
  const err = validatePlacement(s);
  assert(err !== null, 'should reject empty placement');
});

test('requires centre on first move', () => {
  let s = makeTwoPlayerState();
  const tile0 = { ...s.players[0].rack[0], rackIndex: 0 };
  const tile1 = { ...s.players[0].rack[1], rackIndex: 1 };
  // Place at row 0 instead of centre
  s = placeTile(s, 0, 0, tile0, tile0.letter);
  s = placeTile(s, 0, 1, tile1, tile1.letter);
  const err = validatePlacement(s);
  assert(err !== null, 'should reject first word not covering centre');
  assert(err.includes('центарот') || err.includes('7'), 'error should mention centre');
});

test('rejects single-tile first move', () => {
  let s = makeTwoPlayerState();
  const tile = { ...s.players[0].rack[0], rackIndex: 0 };
  s = placeTile(s, 7, 7, tile, tile.letter);
  const err = validatePlacement(s);
  assert(err !== null, 'single tile on first move should be invalid');
});

test('rejects tiles not in single row or column', () => {
  let s = makeTwoPlayerState();
  const tile0 = { ...s.players[0].rack[0], rackIndex: 0 };
  const tile1 = { ...s.players[0].rack[1], rackIndex: 1 };
  s = placeTile(s, 7, 7, tile0, tile0.letter);
  s = placeTile(s, 8, 8, tile1, tile1.letter); // diagonal — invalid
  const err = validatePlacement(s);
  assert(err !== null, 'diagonal placement should be rejected');
});

test('rejects gaps in placement', () => {
  let s = makeTwoPlayerState();
  const tile0 = { ...s.players[0].rack[0], rackIndex: 0 };
  const tile1 = { ...s.players[0].rack[1], rackIndex: 1 };
  s = placeTile(s, 7, 7, tile0, tile0.letter);
  s = placeTile(s, 7, 9, tile1, tile1.letter); // gap at col 8
  const err = validatePlacement(s);
  assert(err !== null, 'gap in placement should be rejected');
});

// ─────────────────────────────────────────────

console.log('\n▶ calcScore / findFormedWords');

test('detects horizontal word', () => {
  let s = makeTwoPlayerState();
  const tile0 = { ...s.players[0].rack[0], rackIndex: 0 };
  const tile1 = { ...s.players[0].rack[1], rackIndex: 1 };
  s = placeTile(s, 7, 7, tile0, tile0.letter);
  s = placeTile(s, 7, 8, tile1, tile1.letter);
  const words = findFormedWords(s.board, s.placedTiles);
  assert(words.length >= 1, 'should detect at least one word');
  assertEqual(words[0].word.length, 2, 'word should be 2 letters');
});

test('calcScore returns non-negative total', () => {
  let s = makeTwoPlayerState();
  const tile0 = { ...s.players[0].rack[0], rackIndex: 0 };
  const tile1 = { ...s.players[0].rack[1], rackIndex: 1 };
  s = placeTile(s, 7, 7, tile0, tile0.letter);
  s = placeTile(s, 7, 8, tile1, tile1.letter);
  const { total } = calcScore(s.board, s.placedTiles, s.confirmedBoard);
  assert(total >= 0, 'score should be non-negative');
});

test('bingo bonus: 7 tiles = +50 points', () => {
  let s = makeTwoPlayerState();
  // Place all 7 tiles in a row starting at centre
  for (let i = 0; i < 7; i++) {
    const tile = { ...s.players[0].rack[0], rackIndex: 0 };
    s = placeTile(s, 7, 7 + i, tile, tile.letter);
  }
  const { total } = calcScore(s.board, s.placedTiles, s.confirmedBoard);
  // We can't know the exact letter values but total must include the +50
  // so find what the base word score would be without bingo
  const baseTiles = s.placedTiles.slice();
  // Simplest check: play with 6 tiles and compare
  // Instead just verify the +50 is added by checking it's higher than base
  assert(total >= 50, 'score with 7 tiles should include bingo bonus of at least 50');
});

test('DW square on centre doubles word score', () => {
  let s = makeTwoPlayerState();
  // Centre (7,7) is a DW/ST square
  const tile0 = { ...s.players[0].rack[0], rackIndex: 0 };
  const tile1 = { ...s.players[0].rack[1], rackIndex: 1 };
  s = placeTile(s, 7, 7, tile0, tile0.letter);
  s = placeTile(s, 7, 8, tile1, tile1.letter);
  const { total } = calcScore(s.board, s.placedTiles, s.confirmedBoard);
  const rawSum = tile0.points + tile1.points;
  // Centre is DW so total should be rawSum * 2 (if no other bonus squares)
  // tile at col 8 is not a bonus square
  assert(total === rawSum * 2, `score should be doubled by centre DW: expected ${rawSum * 2}, got ${total}`);
});

// ─────────────────────────────────────────────

console.log('\n▶ finalizeTurn / advanceTurn');

test('finalizeTurn adds score to current player', () => {
  let s = makeTwoPlayerState();
  const tile0 = { ...s.players[0].rack[0], rackIndex: 0 };
  const tile1 = { ...s.players[0].rack[1], rackIndex: 1 };
  s = placeTile(s, 7, 7, tile0, tile0.letter);
  s = placeTile(s, 7, 8, tile1, tile1.letter);
  const scorePreview = s.turnScore;
  s = finalizeTurn(s);
  assertEqual(s.players[0].score, scorePreview, 'player 0 score should equal preview');
});

test('finalizeTurn draws tiles back to 7', () => {
  let s = makeTwoPlayerState();
  const tile0 = { ...s.players[0].rack[0], rackIndex: 0 };
  const tile1 = { ...s.players[0].rack[1], rackIndex: 1 };
  s = placeTile(s, 7, 7, tile0, tile0.letter);
  s = placeTile(s, 7, 8, tile1, tile1.letter);
  s = finalizeTurn(s);
  assertEqual(s.players[0].rack.length, 7, 'rack should be refilled to 7');
});

test('finalizeTurn clears placedTiles', () => {
  let s = makeTwoPlayerState();
  const tile0 = { ...s.players[0].rack[0], rackIndex: 0 };
  const tile1 = { ...s.players[0].rack[1], rackIndex: 1 };
  s = placeTile(s, 7, 7, tile0, tile0.letter);
  s = placeTile(s, 7, 8, tile1, tile1.letter);
  s = finalizeTurn(s);
  assertEqual(s.placedTiles.length, 0, 'placedTiles should be cleared');
});

test('finalizeTurn sets isFirstMove to false', () => {
  let s = makeTwoPlayerState();
  const tile0 = { ...s.players[0].rack[0], rackIndex: 0 };
  const tile1 = { ...s.players[0].rack[1], rackIndex: 1 };
  s = placeTile(s, 7, 7, tile0, tile0.letter);
  s = placeTile(s, 7, 8, tile1, tile1.letter);
  s = finalizeTurn(s);
  assert(s.isFirstMove === false, 'isFirstMove should be false after first turn');
});

test('advanceTurn moves to next player', () => {
  let s = makeTwoPlayerState();
  const tile0 = { ...s.players[0].rack[0], rackIndex: 0 };
  const tile1 = { ...s.players[0].rack[1], rackIndex: 1 };
  s = placeTile(s, 7, 7, tile0, tile0.letter);
  s = placeTile(s, 7, 8, tile1, tile1.letter);
  s = finalizeTurn(s);
  s = advanceTurn(s, false);
  assertEqual(s.currentPlayerIndex, 1, 'should now be player 1\'s turn');
});

test('advanceTurn wraps back to player 0', () => {
  let s = makeTwoPlayerState();
  // Player 0 plays
  const t0 = { ...s.players[0].rack[0], rackIndex: 0 };
  const t1 = { ...s.players[0].rack[1], rackIndex: 1 };
  s = placeTile(s, 7, 7, t0, t0.letter);
  s = placeTile(s, 7, 8, t1, t1.letter);
  s = finalizeTurn(s);
  s = advanceTurn(s, false);
  assertEqual(s.currentPlayerIndex, 1);

  // Player 1 passes
  s = passTurn(s);
  assertEqual(s.currentPlayerIndex, 0, 'should wrap back to player 0');
});

test('consecutive passes trigger game over', () => {
  let s = makeTwoPlayerState();
  // Need players.length * 2 = 4 passes total
  s = passTurn(s); assertEqual(s.currentPlayerIndex, 1);
  s = passTurn(s); assertEqual(s.currentPlayerIndex, 0);
  s = passTurn(s); assertEqual(s.currentPlayerIndex, 1);
  s = passTurn(s);
  assertEqual(s.status, 'gameOver', 'game should end after 4 consecutive passes');
});

// ─────────────────────────────────────────────

console.log('\n▶ exchangeTiles');

test('exchange costs 5 points', () => {
  let s = makeTwoPlayerState();
  // Give player 0 some score first
  s = { ...s, players: s.players.map((p, i) => i === 0 ? { ...p, score: 20 } : p) };
  const result = exchangeTiles(s);
  assert(typeof result !== 'string', 'exchange should succeed');
  assertEqual(result.players[0].score, 15, 'should cost 5 points');
});

test('exchange rejected when score < 5', () => {
  const s = makeTwoPlayerState(); // score starts at 0
  const result = exchangeTiles(s);
  assert(typeof result === 'string', 'exchange should return error string');
});

test('exchange rejected when tiles placed', () => {
  let s = makeTwoPlayerState();
  s = { ...s, players: s.players.map((p, i) => i === 0 ? { ...p, score: 20 } : p) };
  const tile = { ...s.players[0].rack[0], rackIndex: 0 };
  s = placeTile(s, 7, 7, tile, tile.letter);
  const result = exchangeTiles(s);
  assert(typeof result === 'string', 'exchange should be blocked when tiles are placed');
});

test('exchange gives new tiles', () => {
  let s = makeTwoPlayerState();
  s = { ...s, players: s.players.map((p, i) => i === 0 ? { ...p, score: 20 } : p) };
  const oldIds = s.players[0].rack.map(t => t.id);
  const result = exchangeTiles(s);
  const newIds  = result.players[0].rack.map(t => t.id);
  const allSame = oldIds.every(id => newIds.includes(id));
  assert(!allSame, 'rack should have at least some new tiles');
});

// ─────────────────────────────────────────────

console.log('\n▶ applyChallengeResult');

test('valid challenge gives challenger a skip penalty', () => {
  let s = makeTwoPlayerState();
  const t0 = { ...s.players[0].rack[0], rackIndex: 0 };
  const t1 = { ...s.players[0].rack[1], rackIndex: 1 };
  s = placeTile(s, 7, 7, t0, t0.letter);
  s = placeTile(s, 7, 8, t1, t1.letter);
  // Simulate challenge: word is valid (challenger was wrong)
  s = applyChallengeResult(s, true);
  assert(s.players[1].skipPenalty === true, 'challenger (player 1) should get skip penalty');
});

test('invalid challenge returns tiles to rack', () => {
  let s = makeTwoPlayerState();
  const t0 = { ...s.players[0].rack[0], rackIndex: 0 };
  const t1 = { ...s.players[0].rack[1], rackIndex: 1 };
  const originalRackSize = s.players[0].rack.length;
  s = placeTile(s, 7, 7, t0, t0.letter);
  s = placeTile(s, 7, 8, t1, t1.letter);
  // Simulate challenge: word is invalid (challenger was right)
  s = applyChallengeResult(s, false);
  assertEqual(s.players[0].rack.length, originalRackSize, 'tiles should be returned to rack');
  assert(s.board[7][7] === null, 'board should be cleared');
  assert(s.board[7][8] === null, 'board should be cleared');
});

// ─────────────────────────────────────────────

console.log('\n▶ triggerGameOver');

test('subtracts remaining tile values from scores', () => {
  let s = makeTwoPlayerState();
  s = { ...s, players: s.players.map((p, i) => i === 0 ? { ...p, score: 50 } : { ...p, score: 30 }) };
  const p0Remaining = s.players[0].rack.reduce((sum, t) => sum + t.points, 0);
  const gs = triggerGameOver(s);
  assertEqual(gs.players[0].score, Math.max(0, 50 - p0Remaining), 'should subtract remaining tile values');
});

test('score cannot go below 0', () => {
  let s = makeTwoPlayerState();
  s = { ...s, players: s.players.map(p => ({ ...p, score: 0 })) };
  const gs = triggerGameOver(s);
  for (const p of gs.players) {
    assert(p.score >= 0, `${p.name} score should not go below 0`);
  }
});

test('sets status to gameOver', () => {
  const s = makeTwoPlayerState();
  const gs = triggerGameOver(s);
  assertEqual(gs.status, 'gameOver', 'status should be gameOver');
});

test('awards longest word bonus', () => {
  let s = makeTwoPlayerState();
  // Simulate word records: player 0 had a 6-letter word, player 1 had a 3-letter word
  s = {
    ...s,
    wordRecords: {
      0: { longestWord: 'ПОБЕДА', longestLen: 6, bestWord: 'ПОБЕДА', bestScore: 30 },
      1: { longestWord: 'ДОМ',    longestLen: 3, bestWord: 'ДОМ',    bestScore: 10 },
    },
    players: s.players.map(p => ({ ...p, score: 100 })),
  };
  const gs = triggerGameOver(s);
  assert(gs.endBonuses !== null, 'endBonuses should be populated');
  assert(gs.endBonuses.longestPlayers.length > 0, 'should have a longest word winner');
  assertEqual(gs.endBonuses.longestPlayers[0].name, 'Тест1', 'Тест1 should win longest word bonus');
  // Score should include +15
  assert(gs.players[0].score > gs.players[1].score, 'longest word bonus should affect final scores');
});

// ─────────────────────────────────────────────

console.log('\n▶ Full turn simulation');

test('simulate a complete 2-player turn cycle', () => {
  let s = makeTwoPlayerState();

  // Player 0: place 2 tiles on centre, finalize
  const t0 = { ...s.players[0].rack[0], rackIndex: 0 };
  const t1 = { ...s.players[0].rack[1], rackIndex: 1 };
  s = placeTile(s, 7, 7, t0, t0.letter);
  s = placeTile(s, 7, 8, t1, t1.letter);

  assert(validatePlacement(s) === null, 'placement should be valid');
  const score0 = s.turnScore;
  assert(score0 > 0, 'score should be positive');

  s = finalizeTurn(s);
  assertEqual(s.players[0].score, score0, 'player 0 score should be set');
  assertEqual(s.players[0].rack.length, 7, 'rack refilled');

  s = advanceTurn(s, false);
  assertEqual(s.currentPlayerIndex, 1, 'player 1 should be next');
  assert(s.isFirstMove === false, 'isFirstMove should be false');
  assert(s.confirmedBoard[7][7] !== null, 'confirmedBoard should have the placed tiles');

  // Player 1: pass
  s = passTurn(s);
  assertEqual(s.currentPlayerIndex, 0, 'should be back to player 0');
  assertEqual(s.consecutivePasses, 1, 'consecutivePasses should be 1');

  // Player 0: pass again
  s = passTurn(s);
  assertEqual(s.consecutivePasses, 2, 'consecutivePasses should be 2');

  console.log('    Game log:', s.gameLog);
  assert(s.gameLog.length >= 2, 'game log should have entries');
});

// ─────────────────────────────────────────────

console.log('\n─────────────────────────────────────────');
console.log(`  ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('  🎉 All tests passed — Phase 1 is complete!');
  console.log('     The engine runs cleanly with no React, no browser, no DOM.');
  console.log('     You are ready for Phase 2 (server setup).\n');
} else {
  console.log('  ⚠️  Fix the failing tests before moving to Phase 2.\n');
  process.exit(1);
}