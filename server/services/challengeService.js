import Word from "../models/Word.js";
import { scrapeWord } from "./scraper.js";

export async function challengeWord(wordRaw) {
  const word = wordRaw.toLowerCase().trim();

  if (!word) {
    throw new Error("INVALID_WORD");
  }

  // 1️⃣ Check cache
  const cached = await Word.findOne({ word });

  if (cached) {
    return {
      valid: cached.valid,
      definition: cached.definition,
      cached: true
    };
  }

  // 2️⃣ Scrape if not cached
  const result = await scrapeWord(word);

  // 3️⃣ Store in MongoDB
  const newEntry = new Word({
    word,
    valid: result.valid,
    definition: result.definition
  });

  await newEntry.save();

  // 4️⃣ Return result
  return {
    valid: result.valid,
    definition: result.definition,
    cached: false
  };
}
