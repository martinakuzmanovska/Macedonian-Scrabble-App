import assert from "node:assert/strict";
import test from "node:test";
import Game from "../models/Game.js";
import { createInitialState } from "./gameState.js";
import { applyAIMove, finalizeTurn, passTurn } from "./gameEngine.js";
import { formatGameLog } from "./formatGameLog.js";

function loadedState() {
  const state = createInitialState([
    { name: "Robot", age: 25, type: "ai" },
    { name: "Human", age: 25, type: "human" },
  ]);
  state.players = state.players.map((player) => ({ ...player, displayName: player.name }));
  return new Game(Game.fromEngineState(state)).toEngineState();
}

test("AI engine moves match multiplayer formatting after database conversion", () => {
  const state = loadedState();
  state.players[0].rack = [
    { id: "a", letter: "А", points: 1 },
    { id: "b", letter: "Б", points: 3 },
  ];
  const applied = applyAIMove(state, [
    { row: 7, col: 7, letter: "А" },
    { row: 7, col: 8, letter: "Б" },
  ]);
  const finalized = finalizeTurn(applied);
  const multiplayerEntry = formatGameLog({
    type: "move",
    player: { displayName: "Robot" },
    words: applied.formedWords.map((word) => word.word),
    score: applied.turnScore,
  });
  assert.equal(finalized.gameLog.at(-1), multiplayerEntry);
  assert.ok(multiplayerEntry.startsWith("Robot: АБ (+"));
});

test("AI and human passes use the same wording and preserve history", () => {
  const state = loadedState();
  const afterAI = passTurn(state);
  const afterHuman = passTurn(afterAI);
  assert.deepEqual(afterHuman.gameLog, ["Robot: пас", "Human: пас"]);
  assert.deepEqual(state.gameLog, []);
});

test("challenge and bonus outcomes retain their distinct meaning", () => {
  const player = { name: "Human" };
  assert.equal(formatGameLog({ type: "challenge-invalid", player }), "Human: невалиден збор — плочки вратени");
  for (const [outcome, text] of [
    ["declined", "откажано"],
    ["correct", "точен одговор (+5)"],
    ["incorrect", "погрешен одговор"],
  ]) {
    assert.equal(formatGameLog({ type: "bonus", player, word: "ЗБОР", outcome }), `Human: бонус прашање за „ЗБОР“ — ${text}`);
  }
});
