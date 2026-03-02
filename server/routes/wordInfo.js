import express from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = express.Router();
const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env automatically

router.post("/", async (req, res) => {
  const { word } = req.body;

  if (!word) {
    return res.status(400).json({ success: false, message: "word is required" });
  }

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{
        role: "user",
        content: `Дај детални информации за македонскиот збор "${word}". 

Пребарај на mk.wiktionary.org, mk.wikipedia.org и македонски речници.

Одговори САМО со JSON:
{
  "word": "${word}",
  "definition": "дефиниција на македонски",
  "partOfSpeech": "именка/глагол/придавка/итн",
  "etymology": "потекло на зборот ако е достапно",
  "examples": ["пример реченица 1", "пример реченица 2"],
  "synonyms": ["синоним1", "синоним2"],
  "relatedWords": ["сроден збор1", "сроден збор2"],
  "funFact": "интересен факт за зборот ако има"
}`,
      }],
    });

    const text = response.content
      ?.map(item => item.type === "text" ? item.text : "")
      .filter(Boolean)
      .join("\n") || "";

    const jsonMatch = text.replace(/```json|```/g, "").match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return res.json({ success: true, ...JSON.parse(jsonMatch[0]) });
    }

    return res.json({
      success: true,
      word,
      definition: "Не се пронајдени информации.",
      partOfSpeech: "", etymology: "", examples: [],
      synonyms: [], relatedWords: [], funFact: "",
    });

  } catch (err) {
    console.error("word-info error:", err);
    return res.status(500).json({
      success: false,
      word,
      definition: "Грешка при пребарување.",
      partOfSpeech: "", etymology: "", examples: [],
      synonyms: [], relatedWords: [], funFact: "",
    });
  }
});

export default router;