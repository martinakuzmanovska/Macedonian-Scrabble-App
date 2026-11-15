import Word from "../models/Word.js";
import { scrapeWord, isRelatedWordPlaceholder } from "./scraper.js";

export async function challengeWord(wordRaw) {
  const word = wordRaw.toLowerCase().trim();

  if (!word) {
    throw new Error("INVALID_WORD");
  }

  // 1️⃣ Check cache
  const cached = await Word.findOne({ word });

  if (cached) {
    // Older scraper versions cached definition-less related-word results as valid.
    const placeholder = isRelatedWordPlaceholder(cached.definition);
    return {
      valid: cached.valid && !placeholder,
      definition: placeholder ? null : cached.definition,
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

  try {
    await newEntry.save();
  } catch (error) {
    if (error.code !== 11000) throw error;
    return challengeWord(word);
  }

  // 4️⃣ Return result
  return {
    valid: result.valid,
    definition: result.definition,
    cached: false
  };
}
