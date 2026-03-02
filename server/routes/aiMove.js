import express from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = express.Router();
const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env automatically

// ── Helpers (duplicated from constants.js — will be imported from
//    server/game/constants.js when we copy the engine in Phase 4) ──

function boardToText(boardState) {
  let t = "   ";
  for (let c = 0; c < 15; c++) t += String(c).padStart(3);
  t += "\n";
  for (let r = 0; r < 15; r++) {
    t += String(r).padStart(2) + " ";
    for (let c = 0; c < 15; c++) {
      const cell = boardState[r][c];
      t += (cell ? (cell.displayLetter || cell.letter) : ".").padStart(3);
    }
    t += "\n";
  }
  return t;
}

function getAIDifficultyPrompt(age) {
  if (age <= 8)  return `Играш со дете од ${age} год. Користи МНОГУ кратки ЛИТЕРАТУРНИ зборови (2-3 букви): ОД, НА, ДА, НЕ, ОКО, ДЕН, СОН, НОС, ДОМ, СОЛ, МИР, ЛЕТ, ВОЗ, РОД, ТОН, ЛОВ, ВОЛ, СОК. Понекогаш направи грешка.`;
  if (age <= 12) return `Играш со дете од ${age} год. Користи едноставни ЛИТЕРАТУРНИ зборови (3-5 букви): МОСТ, РЕКА, СЕЛО, ЛЕТО, ПОЛЕ, ВОДА, ДРВО, НОГА, РАКА, КНИГА, МАСА, КУЌА, СОНЦЕ.`;
  if (age <= 17) return `Играш со тинејџер од ${age} год. Користи средно-тешки ЛИТЕРАТУРНИ зборови (4-7 букви): ПОБЕДА, ПРОЛЕТ, ШКОЛО, КАМЕН, ПЕСНА, ЈУНАК, ДРЖАВА, ПРИРОДА.`;
  return `Играш со возрасен. Користи сложени ЛИТЕРАТУРНИ зборови. Искористи бонус полиња. Максимални поени.`;
}

// ── Route ────────────────────────────────────

router.post("/", async (req, res) => {
  const { boardState, rack, isFirstMove, age } = req.body;

  if (!boardState || !rack) {
    return res.status(400).json({ success: false, message: "boardState and rack are required" });
  }

  const rackLetters = rack
    .map(t => t.letter === "★" ? "ЏОКЕР" : t.letter)
    .join(", ");

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{
        role: "user",
        content: `Ти си AI играч во Македонски Скрабл. ${getAIDifficultyPrompt(age)}

ВАЖНО: Користи САМО зборови кои постојат во македонски литературен јазик (речник). Пребарај ако не си сигурен.

Табла (. = празно):
${boardToText(boardState)}

Твои плочки: ${rackLetters}
${isFirstMove ? "ПРВО поставување - МОРА да покрие (7,7)." : "МОРА да се поврзе со постоечки букви."}

Одговори САМО со JSON:
{"word":"ЗБОР","placements":[{"row":7,"col":5,"letter":"З"}],"joker_as":null,"explanation":"објаснување"}

placements = САМО нови плочки. Ако не можеш: {"word":null,"pass":true}`,
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

    return res.json({ success: true, word: null, pass: true });

  } catch (err) {
    console.error("ai-move error:", err);
    return res.status(500).json({ success: false, word: null, pass: true });
  }
});

export default router;