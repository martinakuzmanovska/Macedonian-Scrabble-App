import Anthropic from "@anthropic-ai/sdk";

let client;
const QUESTION_TYPES = ["значењето", "множината", "употреба во реченица"];

function getAnthropicClient() {
  if (!client) client = new Anthropic();
  return client;
}

function shuffleAnswers(options, correctIndex) {
  const shuffled = options.map((text, originalIndex) => ({
    text,
    isCorrect: originalIndex === correctIndex,
  }));

  for (let index = shuffled.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return {
    options: shuffled.map((answer) => answer.text),
    correctIndex: shuffled.findIndex((answer) => answer.isCorrect),
  };
}

function extractJSONObject(text) {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index++) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;
    else if (char === "{") depth++;
    else if (char === "}") {
      depth--;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }

  return null;
}

/**
 * Generate one multiple-choice question about a Macedonian word.
 * Returns null when the API response cannot be parsed or is malformed.
 */
export async function generateBonusQuestion(word) {
  if (typeof word !== "string" || !word.trim()) return null;

  const type =
    QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)];
  const prompt = `Направи 1 прашање со избор на одговор на македонски јазик за зборот "${word}".
Тема: ${type}. Точно 3 понудени одговори, само еден е точен.
Одговори САМО со JSON, без друг текст:
{"question":"...","options":["...","...","..."],"correctIndex":0}`;

  try {
    const response = await getAnthropicClient().messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content
        ?.map((block) => (block.type === "text" ? block.text : ""))
        .filter(Boolean)
        .join("\n") ?? "";
    const cleanText = text.replace(/```(?:json)?/gi, "").trim();
    const jsonText = extractJSONObject(cleanText);
    if (!jsonText) {
      console.warn("[bonus-question] response did not contain complete JSON", {
        stopReason: response.stop_reason,
        responseText: text,
      });
      return null;
    }

    let result;
    try {
      result = JSON.parse(jsonText);
    } catch (error) {
      console.warn("[bonus-question] invalid JSON response", {
        stopReason: response.stop_reason,
        parseError: error.message,
        responseText: text,
      });
      return null;
    }

    if (
      typeof result.question !== "string" ||
      !Array.isArray(result.options) ||
      result.options.length !== 3 ||
      !result.options.every((option) => typeof option === "string") ||
      !Number.isInteger(result.correctIndex) ||
      result.correctIndex < 0 ||
      result.correctIndex >= result.options.length
    ) {
      return null;
    }

    const answers = shuffleAnswers(result.options, result.correctIndex);
    return {
      question: result.question,
      ...answers,
    };
  } catch (error) {
    console.warn(
      "[bonus-question] failed to generate question:",
      error.message,
    );
    return null;
  }
}
