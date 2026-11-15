import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import express from "express";
import gamesRouter from "../routes/games.js";
import authRouter from "../routes/auth.js";
import Game from "../models/Game.js";
import Word from "../models/Word.js";
import PersonalDictionary from "../models/PersonalDictionary.js";
import { createGame } from "../services/gameService.js";
import { readDictionary, usableDefinition, normalizeWord } from "../services/personalDictionary.js";

test("verified challenge, retry, owner isolation and durable recovery", async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/scrabble_dictionary_test");
  await PersonalDictionary.init();
  const owner = new mongoose.Types.ObjectId(), author = new mongoose.Types.ObjectId();
  const app = express(); app.use(express.json());
  app.use((req, _res, next) => { req.user = { _id: owner }; req.isAuthenticated = () => true; next(); });
  app.use("/games", gamesRouter); app.use("/auth", authRouter);
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = async (game, body) => {
    const response = await fetch(`${base}/games/${game.gameId}/challenge-result`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { status: response.status, data: await response.json() };
  };
  const ids = [];
  async function pending(definition, valid = true, ai = false) {
    const game = await createGame({ _id: author }, [{ name: "Author", type: "human", userId: author }, { name: "Owner", type: ai ? "ai" : "human", userId: owner }]);
    ids.push(game._id);
    const state = game.toEngineState();
    const tiles = [{ id: "test-a", letter: "М", points: 1 }, { id: "test-b", letter: "А", points: 1 }];
    state.board[7][7] = { ...tiles[0], displayLetter: "М" }; state.board[7][8] = { ...tiles[1], displayLetter: "А" };
    state.placedTiles = tiles.map((tile, i) => ({ row: 7, col: 7 + i, tile }));
    state.turnScore = 5; state.formedWords = [{ word: "МА", cells: [] }]; state.status = "challenge";
    Object.assign(game, Game.fromEngineState(state)); game.pendingMoveId = new mongoose.Types.ObjectId().toString(); await game.save();
    await Word.updateOne({ word: "ма" }, { $set: { valid, definition } }, { upsert: true });
    return game;
  }
  try {
    const game = await pending("Verified definition");
    const request = { pendingMoveId: game.pendingMoveId, wordIndex: 0, valid: false, word: "FORGED" };
    assert.equal((await post(game, request)).data.result.valid, true);
    const state = (await Game.findById(game._id)).toEngineState();
    assert.equal(state.players[0].score, 5);
    assert.equal((await post(game, request)).status, 200);
    assert.equal((await Game.findById(game._id)).players[0].score, 5);
    let words = await readDictionary(owner); assert.equal(words.length, 1); assert.equal(words[0].history.length, 1);
    assert.equal(words[0].history[0].author.displayName, "Author");
    assert.equal((await readDictionary(author)).length, 0);
    const second = await pending("Definition two");
    const original = PersonalDictionary.updateOne;
    PersonalDictionary.updateOne = () => { throw new Error("injected dictionary outage"); };
    try { assert.equal((await post(second, { pendingMoveId: second.pendingMoveId, wordIndex: 0 })).status, 500); }
    finally { PersonalDictionary.updateOne = original; }
    assert.equal((await Game.findById(second._id)).players[0].score, 5);
    words = await readDictionary(owner); assert.equal(words[0].history.length, 2);
    await post(second, { pendingMoveId: second.pendingMoveId, wordIndex: 0 });
    assert.equal((await readDictionary(owner))[0].history.length, 2);
    for (const [definition, valid, ai] of [["  ", true, false], [null, false, false], ["Definition", true, true]]) {
      const excluded = await pending(definition, valid, ai);
      const result = await post(excluded, { pendingMoveId: excluded.pendingMoveId, wordIndex: 0 });
      assert.equal(result.status, ai ? 403 : 200);
    }
    assert.equal((await readDictionary(owner))[0].history.length, 2);
    // A crossing move: only the selected crossing word is collected.
    const multi = await pending("Main definition");
    const multiState = multi.toEngineState();
    multiState.board[6][7] = { id: "cross", letter: "\u0418", displayLetter: "\u0418", points: 1 };
    Object.assign(multi, Game.fromEngineState(multiState)); await multi.save();
    await Word.updateOne({ word: "\u0438\u043c" }, { $set: { valid: true, definition: "Cross definition" } }, { upsert: true });
    const responses = await Promise.all([post(multi, { pendingMoveId: multi.pendingMoveId, wordIndex: 1 }), post(multi, { pendingMoveId: multi.pendingMoveId, wordIndex: 1 })]);
    assert.ok(responses.some(r => r.status === 200));
    assert.equal((await Game.findById(multi._id)).players[0].score, 5);
    const recovered = await readDictionary(owner);
    assert.equal(recovered.find(w => w.normalizedWord === "\u0438\u043c").history.length, 1);
    assert.equal(recovered.find(w => w.normalizedWord === "\u043c\u0430").history.length, 2);
    const response = await fetch(`${base}/auth/me/dictionary`); assert.equal(response.status, 200);
    assert.equal((await response.json()).words.length, 2);
    await assert.rejects(PersonalDictionary.create({ ownerId: owner, normalizedWord: "ма", word: "МА", definition: "duplicate" }), error => error.code === 11000);
    assert.equal(normalizeWord(" МА "), "ма"); assert.equal(usableDefinition("  "), false);
  } finally {
    await Game.deleteMany({ _id: { $in: ids } });
    await PersonalDictionary.deleteMany({ ownerId: owner });
    await Word.deleteOne({ word: "ма" });
    server.close(); await mongoose.disconnect();
  }
});
