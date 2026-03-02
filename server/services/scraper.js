import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeWord(word) {
  const url = `https://makedonski.gov.mk/corpus/s?q=${word}`; // raw Cyrillic, no encoding

  console.log('Fetching URL:', url); // Check what URL is being built

  const { data } = await axios.get(url, {
    headers: {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "mk,en;q=0.5",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    responseEncoding: "utf8",
  });

  console.log('Raw HTML snippet:', data.substring(0, 500));

  
  const $ = cheerio.load(data);

  // "No results" check
  if ($('body').text().includes('Обидете се повторно')) {
    return { valid: false, definition: null };
  }

  // Find the first result block
  const firstBlock = $('.content.m-0.p-0.mb-10.pb-20').first();
  if (!firstBlock.length) {
    return { valid: false, definition: null };
  }

  // Get the word from the <strong> tag
  const firstWord = firstBlock.find('strong').text().trim();

  // Exact match check
  if (firstWord.toLowerCase() !== word.toLowerCase()) {
    return { valid: false, definition: null };
  }

  // Get word type (e.g. "прид.", "прил.")
  const h2Text = firstBlock.find('h2').text().trim();
  const wordType = h2Text.replace(firstWord, '').replace('|', '').trim();

  // Get definition from the <p> tag
  const definition = firstBlock.find('p.m-0.p-0.pt-5').text().trim();

  return {
    valid: true,
    word: firstWord,
    type: wordType,
    definition: definition || null,
  };
}