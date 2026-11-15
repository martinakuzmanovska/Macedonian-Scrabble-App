import PersonalDictionary from "../models/PersonalDictionary.js";
import Game from "../models/Game.js";
import { isRelatedWordPlaceholder } from "./scraper.js";

export const normalizeWord = word => word.normalize("NFC").trim().toLocaleLowerCase("mk");
export const usableDefinition = value => typeof value === "string" && value.trim().length > 0 && !isRelatedWordPlaceholder(value);

// Game receipts are the durable outbox. Delivery is safe to repeat after a crash.
export async function deliverDictionaryEvent(event) {
  if (!event) return;
  const key = { ownerId: event.ownerId, normalizedWord: normalizeWord(event.word) };
  try {
    await PersonalDictionary.updateOne(key, { $setOnInsert: { ...key, word: event.word, definition: event.definition } }, { upsert: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
  const { eventId, challengedAt, gameId, author } = event;
  await PersonalDictionary.updateOne({ ...key, "history.eventId": { $ne: eventId } }, {
    $set: { word: event.word, definition: event.definition },
    $push: { history: { $each: [{ eventId, challengedAt, gameId, author }], $sort: { challengedAt: -1, eventId: -1 } } },
  });
}

export async function readDictionary(ownerId) {
  // Recover even if the resolving request died after the atomic game commit.
  const games = await Game.find({ "challengeReceipts.dictionaryEvent.ownerId": ownerId.toString() }).select("challengeReceipts").lean();
  for (const game of games) {
    for (const receipt of game.challengeReceipts) {
      if (receipt.dictionaryEvent?.ownerId === ownerId.toString()) await deliverDictionaryEvent(receipt.dictionaryEvent);
    }
  }
  return PersonalDictionary.find({ ownerId, "history.0": { $exists: true } })
    .select("-_id word normalizedWord definition history.eventId history.challengedAt history.gameId history.author")
    .sort({ "history.0.challengedAt": -1 }).lean();
}
