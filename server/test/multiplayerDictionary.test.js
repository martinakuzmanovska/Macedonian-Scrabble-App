import test from "node:test";
import assert from "node:assert/strict";
import Game from "../models/Game.js";
import Word from "../models/Word.js";
import PersonalDictionary from "../models/PersonalDictionary.js";
import { multiplayerFixture } from "./helpers/multiplayerFixture.js";
import { findFormedWords } from "../game/gameEngine.js";

test("two Passport sessions: normal create/join/confirm/challenge/poll and private dictionary", async t => {
  const fixture = await multiplayerFixture();
  const { cookies: [a, b], users, request, seedRack } = fixture;
  const get = (cookie, path) => request(cookie, path);
  const dictionary = async (cookie, query = "") => (await get(cookie, `/api/auth/me/dictionary${query}`)).data.words;
  const create = async (ai = false) => {
    const response = await request(a, "/api/games", { players: [{ type: "human", name: "ignored" }, { type: ai ? "ai" : "human", name: "Opponent" }] });
    assert.equal(response.status, 200);
    const id = response.data.gameId;
    if (!ai) assert.equal((await request(b, `/api/games/${id}/join`, {})).status, 200);
    await seedRack(id);
    return id;
  };
  const state = async (cookie, id) => (await get(cookie, `/api/games/${id}`)).data.state;
  const confirm = async (id, row = 7, letters = "МА") => {
    const before = await state(a, id);
    const rack = [...before.players[0].rack];
    const placedTiles = Array.from(letters).map((letter, i) => {
      const index = rack.findIndex(tile => tile.letter === letter);
      assert.ok(index >= 0);
      const [tile] = rack.splice(index, 1);
      return { row, col: 7 + i, tile };
    });
    const board = structuredClone(before.board);
    for (const { row, col, tile } of placedTiles) board[row][col] = { ...tile, displayLetter: tile.letter };
    const response = await request(a, `/api/games/${id}/confirm`, { board, placedTiles, turnScore: 4, formedWords: ["CLIENT CANNOT CHOOSE THE WORD"] });
    assert.equal(response.status, 200, JSON.stringify(response.data));
    return { before, pending: response.data.state, placedTiles };
  };
  const challenge = (id, pending, wordIndex = 0) => request(b, `/api/games/${id}/challenge-result`, { pendingMoveId: pending.pendingMoveId, wordIndex, valid: false, definition: "Forged" });
  const sameForBoth = async id => {
    const [sa, sb] = await Promise.all([state(a, id), state(b, id)]);
    assert.deepEqual(sa, sb);
    return sa;
  };
  try {
    let id, first, firstRequest, firstEvent;
    await t.test("valid challenge belongs only to B; both players receive exact board/rack/turn/score", async () => {
      id = await create();
      first = await confirm(id);
      assert.deepEqual(first.pending.formedWords.map(w => w.word), ["МА"]);
      assert.equal((await challenge(id, first.pending)).status, 200);
      firstRequest = first.pending;
      const resolved = await sameForBoth(id);
      assert.equal(resolved.currentPlayerIndex, 0);
      assert.equal(resolved.players[0].score, 4);
      assert.equal(resolved.players[1].score, 0);
      assert.equal(resolved.players[1].skipPenalty, false);
      assert.deepEqual(resolved.players[1].rack, first.before.players[1].rack);
      assert.deepEqual(resolved.players[0].rack, [...first.before.players[0].rack.filter(tile => !first.placedTiles.some(p => p.tile.id === tile.id)), ...first.before.tileBag.slice(0, 2)]);
      assert.equal(resolved.tileBag.length, first.before.tileBag.length - 2);
      assert.deepEqual(resolved.board, resolved.confirmedBoard);
      assert.equal(resolved.board[7][7].letter, "М");
      const words = await dictionary(b);
      assert.equal(words.length, 1); assert.equal(words[0].word, "МА");
      firstEvent = words[0].history[0];
      assert.equal(firstEvent.gameId, id);
      assert.deepEqual(firstEvent.author, { playerId: users[0].id, displayName: users[0].displayName });
      assert.ok(Math.abs(Date.now() - Date.parse(firstEvent.challengedAt)) < 10000);
      assert.deepEqual(await dictionary(a), []);
      assert.deepEqual(await dictionary(a, `?ownerId=${users[1].id}&userId=${users[1].id}`), []);
      assert.equal((await get(null, "/api/auth/me/dictionary")).status, 401);
      assert.equal((await request(null, `/api/games/${id}/challenge-result`, {})).status, 401);
    });
    await t.test("same game, same word, new move produces second event; old retries change nothing", async () => {
      const second = await confirm(id, 8);
      assert.ok(second.pending.formedWords.length > 1);
      assert.equal((await challenge(id, second.pending)).status, 200);
      const resolved = await sameForBoth(id);
      assert.equal(resolved.players[0].score, 8);
      assert.equal(resolved.currentPlayerIndex, 0);
      const words = await dictionary(b);
      assert.equal(words.length, 1); assert.equal(words[0].history.length, 2);
      assert.equal(words[0].history[0].gameId, id);
      assert.notEqual(words[0].history[0].eventId, firstEvent.eventId);
      assert.ok(Date.parse(words[0].history[0].challengedAt) >= Date.parse(words[0].history[1].challengedAt));
      assert.equal((await challenge(id, firstRequest)).status, 200);
      assert.equal((await challenge(id, second.pending)).status, 200);
      assert.deepEqual(await sameForBoth(id), resolved);
      assert.equal((await dictionary(b))[0].history.length, 2);
    });
    await t.test("invalid challenge restores board/rack and gives B the turn, with no dictionary event", async () => {
      const move = await confirm(id, 9, "ЖЖ");
      assert.equal((await challenge(id, move.pending)).data.result.valid, false);
      const resolved = await sameForBoth(id);
      assert.equal(resolved.currentPlayerIndex, 1);
      assert.equal(resolved.players[0].score, 8);
      assert.deepEqual(resolved.board, move.before.confirmedBoard);
      assert.deepEqual(resolved.players.map(p => p.rack), move.before.players.map(p => p.rack));
      assert.deepEqual(resolved.tileBag, move.before.tileBag);
      assert.equal(resolved.placedTiles.length, 0);
      assert.equal((await dictionary(b))[0].history.length, 2);
    });
    await t.test("definition missing: outcome completes without creating data", async () => {
      const missing = await create();
      await Word.updateOne({ word: "ма" }, { $set: { definition: "   " } });
      const move = await confirm(missing);
      assert.equal((await challenge(missing, move.pending)).status, 200);
      assert.equal((await sameForBoth(missing)).players[0].score, 4);
      assert.equal((await dictionary(b))[0].history.length, 2);
      assert.equal((await Game.findOne({ gameId: missing })).challengeReceipts[0].dictionaryEvent, null);
    });
    await t.test("inconclusive lookup leaves pending move unchanged", async () => {
      const inconclusive = await create();
      // Legacy/malformed cache result, deliberately bypass schema validation.
      await Word.collection.updateOne({ word: "ма" }, { $set: { valid: null, definition: null } });
      const move = await confirm(inconclusive);
      assert.equal((await challenge(inconclusive, move.pending)).status, 503);
      assert.deepEqual(await sameForBoth(inconclusive), move.pending);
      assert.equal((await dictionary(b))[0].history.length, 2);
      await Word.updateOne({ word: "ма" }, { $set: { valid: true, definition: "Verified" } });
    });
    await t.test("accepting a move creates no entry and cannot be challenged afterwards", async () => {
      const accepted = await create();
      const move = await confirm(accepted);
      assert.equal((await request(b, `/api/games/${accepted}/finalize`, {})).status, 200);
      assert.equal((await sameForBoth(accepted)).currentPlayerIndex, 1);
      assert.ok([403, 409].includes((await challenge(accepted, move.pending)).status));
      assert.equal((await dictionary(b))[0].history.length, 2);
    });
    await t.test("AI game confirmation still finalizes, creates no dictionary entry", async () => {
      const ai = await create(true);
      const move = await confirm(ai);
      assert.equal(move.pending.status, "playing");
      assert.equal(move.pending.currentPlayerIndex, 1);
      assert.equal(move.pending.players[0].score, 4);
      assert.equal((await challenge(ai, move.pending)).status, 403);
      assert.equal((await dictionary(b))[0].history.length, 2);
      assert.deepEqual(await dictionary(a), []);
    });
    await t.test("crossing move: only the selected word enters the dictionary", async () => {
      const multi = await create();
      const firstMove = await confirm(multi);
      await challenge(multi, firstMove.pending);
      const next = await confirm(multi, 8);
      const selected = next.pending.formedWords.findIndex(w => w.word === "ММ");
      assert.ok(selected >= 0);
      assert.equal((await challenge(multi, next.pending, selected)).status, 200);
      const words = await dictionary(b);
      const cross = words.find(w => w.normalizedWord === "мм");
      assert.equal(cross.history.length, 1);
      assert.equal(cross.history[0].gameId, multi);
      assert.equal(words.find(w => w.normalizedWord === "ма").history.filter(e => e.gameId === multi).length, 1);
      assert.equal(words.find(w => w.normalizedWord === "аа"), undefined);
      const readAgain = await dictionary(b);
      assert.deepEqual(readAgain, words);
      assert.deepEqual(findFormedWords(next.pending.board, next.pending.placedTiles), next.pending.formedWords);
    });
    await t.test("mover cannot challenge own word, nonparticipant cannot read the game", async () => {
      const own = await create();
      const move = await confirm(own);
      assert.equal((await request(a, `/api/games/${own}/challenge-result`, { pendingMoveId: move.pending.pendingMoveId, wordIndex: 0 })).status, 403);
      const other = await create(true);
      // A is a nonparticipant in a game made by B.
      const created = await request(b, "/api/games", { players: [{ type: "human" }, { type: "ai", name: "AI" }] });
      assert.equal((await get(a, `/api/games/${created.data.gameId}`)).status, 403);
      assert.equal((await request(a, `/api/games/${other}/challenge-result`, { pendingMoveId: "fake", wordIndex: 0 })).status, 403);
    });
    await t.test("logout invalidates the signed cookie and dictionary access", async () => {
      assert.equal((await request(b, "/api/auth/logout", {})).status, 200);
      assert.equal((await get(b, "/api/auth/me/dictionary")).status, 401);
      assert.ok(await PersonalDictionary.countDocuments({ ownerId: users[1]._id }) > 0);
    });
  } finally { await fixture.close(); }
});
