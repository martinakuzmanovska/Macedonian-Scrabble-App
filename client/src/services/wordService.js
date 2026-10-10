export async function validateWordWithAI(word) {
  try {
    const response = await fetch("/api/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word }),
    });

    const data = await response.json();
    return {
      valid: data.valid ?? null,
      explanation: data.valid
        ? `Зборот "${word}" е валиден македонски збор.`
        : `Зборот "${word}" не е пронајден во речникот.`,
      definition: data.definition || "",
      source: "Македонски.гов.мк",
    };
  } catch (error) {
    console.error("validateWordWithAI error:", error);
    throw error;
  }
}

const createWordInfoFallback = (word, definition) => ({
  word,
  definition,
  partOfSpeech: "",
  etymology: "",
  examples: [],
  synonyms: [],
  relatedWords: [],
  funFact: "",
});

export async function getWordInfo(word) {
  try {
    const response = await fetch("/api/word-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word }),
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      return createWordInfoFallback(word, "Грешка при пребарување.");
    }

    return {
      ...createWordInfoFallback(word, "Не се пронајдени информации."),
      ...data,
      word: data.word || word,
    };
  } catch {
    return createWordInfoFallback(word, "Грешка при пребарување.");
  }
}
