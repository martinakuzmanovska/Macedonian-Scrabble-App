import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "../middleware/requireAuth.js";
import { findFormedWords } from "../game/gameEngine.js";
import { challengeWord } from "../services/challengeService.js";

const router = express.Router();

router.use(requireAuth);

// ── Helpers ──────────────────────────────────

function boardToOccupiedList(boardState) {
  const occupied = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const cell = boardState[r][c];
      if (cell) {
        occupied.push(
          `(ред=${r}, колона=${c}) = ${cell.displayLetter || cell.letter}`,
        );
      }
    }
  }
  return occupied.length ? occupied.join("\n") : "Таблата е празна.";
}

function getAIDifficultyPrompt(age) {
  if (age <= 8)
    return `Играш со дете од ${age} год. Користи МНОГУ кратки ЛИТЕРАТУРНИ зборови (2-3 букви): ОД, НА, ДА, НЕ, ОКО, ДЕН, СОН, НОС, ДОМ, СОЛ, МИР, ЛЕТ, ВОЗ, РОД, ТОН, ЛОВ, ВОЛ, СОК. Понекогаш направи грешка.`;
  if (age <= 12)
    return `Играш со дете од ${age} год. Користи едноставни ЛИТЕРАТУРНИ зборови (3-5 букви): МОСТ, РЕКА, СЕЛО, ЛЕТО, ПОЛЕ, ВОДА, ДРВО, НОГА, РАКА, КНИГА, МАСА, КУЌА, СОНЦЕ.`;
  if (age <= 17)
    return `Играш со тинејџер од ${age} год. Користи средно-тешки ЛИТЕРАТУРНИ зборови (4-7 букви): ПОБЕДА, ПРОЛЕТ, ШКОЛО, КАМЕН, ПЕСНА, ЈУНАК, ДРЖАВА, ПРИРОДА.`;
  return `Играш со возрасен. Користи сложени ЛИТЕРАТУРНИ зборови. Искористи бонус полиња. Максимални поени.`;
}

function extractFirstJSONObject(str) {
  const start = str.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < str.length; i++) {
    if (str[i] === "{") depth++;
    else if (str[i] === "}") {
      depth--;
      if (depth === 0) return str.slice(start, i + 1);
    }
  }
  return null; // unbalanced — Claude's response got cut off
}

// ── Route ────────────────────────────────────

router.post("/", async (req, res) => {
  const requestId = req.requestId;
  const client = new Anthropic();
  const { boardState, rack, isFirstMove, age } = req.body;

  console.log("[ai-move] route entered", {
    requestId,
    authenticated: req.isAuthenticated(),
    userId: req.user?._id?.toString() || null,
    boardRows: Array.isArray(boardState) ? boardState.length : null,
    boardColumns: Array.isArray(boardState?.[0]) ? boardState[0].length : null,
    rackSize: Array.isArray(rack) ? rack.length : null,
    isFirstMove,
    age,
    claudeKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
  });

  if (!boardState || !rack) {
    console.warn("[ai-move] invalid request body", { requestId });
    return res
      .status(400)
      .json({ success: false, message: "boardState and rack are required" });
  }

  const rackLetters = rack
    .map((t) => (t.letter === "★" ? "ЏОКЕР" : t.letter))
    .join(", ");

  const prompt = `Ти си AI играч во Македонски Скрабл. ${getAIDifficultyPrompt(age)}

ВАЖНО: Користи САМО зборови кои постојат во македонски литературен јазик (речник).

Таблата е 15×15, индексирана од 0 до 14 (ред 0-14, колона 0-14). Централното поле е (ред=7, колона=7).

Плочки кои веќе се на таблата:
${boardToOccupiedList(boardState)}

Твои плочки: ${rackLetters}
${
  isFirstMove
    ? "Ова е првото поставување - таблата е целосно празна. Мораш експлицитно да ги вклучиш СИТЕ букви од зборот во placements, вклучувајќи ја и буквата на централното поле (7,7)."
    : "Мора да се поврзе со постоечки букви (најмалку едно ново поле веднаш до постоечко поле)."
}

Напомена: секое ново поле поставено веднаш до постоечко поле (без празнина, во ист ред/колона) се спојува со него во еден краен збор - провери го конечниот збор откако старите и новите букви ќе се споат, пред да одговориш.

Одговори САМО со JSON, без ништо друго, во следниов формат:
{"word":"ЗБОР","placements":[{"row":7,"col":5,"letter":"З"}],"pass":false,"explanation":"кратко објаснување"}
placements = САМО нови плочки. letter = точно една голема македонска кирилична буква. row и col = броеви од 0 до 14. Ако не можеш да поставиш збор: {"word":null,"pass":true,"placements":[],"explanation":"пас"}`;
  try {
    console.log("[ai-move] calling Claude", {
      requestId,
      model: "claude-sonnet-5",
      promptLength: prompt.length,
      rackSize: rack.length,
    });

    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 700,
      thinking: { type: "disabled" },
      messages: [{ role: "user", content: prompt }],
    });
    console.log("[ai-move] raw response shape", {
      requestId,
      stopReason: response.stop_reason,
      contentBlockTypes: response.content?.map((item) => item.type),
      usage: response.usage,
    });
    const text =
      response.content
        ?.map((item) => (item.type === "text" ? item.text : ""))
        .filter(Boolean)
        .join("\n") || "";

    const clean = text.replace(/```json|```/g, "").trim();
    const jsonStr = extractFirstJSONObject(clean);

    let moveData;
    if (!jsonStr) {
      console.warn("[ai-move] no JSON object found in Claude response", {
        requestId,
        rawText: text,
      });
      moveData = { word: null, pass: true, placements: [] };
    } else {
      try {
        moveData = JSON.parse(jsonStr);
      } catch (parseErr) {
        console.warn("[ai-move] failed to parse Claude response as JSON", {
          requestId,
          parseErr: parseErr.message,
          rawText: text,
        });
        moveData = { word: null, pass: true, placements: [] };
      }
    }

    console.log("[ai-move] Claude success", {
      requestId,
      word: moveData.word,
      placementCount: Array.isArray(moveData.placements)
        ? moveData.placements.length
        : null,
      pass: moveData.pass,
      explanation: moveData.explanation,
    });

    if (
      moveData.word &&
      Array.isArray(moveData.placements) &&
      moveData.placements.length
    ) {
      const rackPool = [...rack];
      const rackCanSupply = moveData.placements.every((pl) => {
        let idx = rackPool.findIndex((t) => t.letter === pl.letter);
        if (idx === -1) idx = rackPool.findIndex((t) => t.letter === "★");
        if (idx === -1) return false;
        rackPool.splice(idx, 1);
        return true;
      });

      if (!rackCanSupply) {
        console.warn(
          "[ai-move] rack cannot supply claimed letters — discarding move",
          {
            requestId,
            claimedWord: moveData.word,
            rackLetters: rack.map((t) => t.letter),
            neededLetters: moveData.placements.map((p) => p.letter),
          },
        );
        moveData = { word: null, pass: true, placements: [] };
      }
    }

    if (
      moveData.word &&
      Array.isArray(moveData.placements) &&
      moveData.placements.length
    ) {
      // Simulate the placements on a copy of the board to see what word(s) actually form
      const simBoard = boardState.map((row) => [...row]);
      const placedTiles = [];
      for (const pl of moveData.placements) {
        if (pl.row < 0 || pl.row > 14 || pl.col < 0 || pl.col > 14) continue;
        if (simBoard[pl.row][pl.col]) continue; // already occupied, skip
        simBoard[pl.row][pl.col] = {
          letter: pl.letter,
          displayLetter: pl.letter,
        };
        placedTiles.push({ row: pl.row, col: pl.col });
      }
      const actualWords = findFormedWords(simBoard, placedTiles).map(
        (w) => w.word,
      );

           if (!actualWords.includes(moveData.word)) {
        console.warn("[ai-move] word mismatch — discarding move", {
          requestId,
          claimedWord: moveData.word,
          actualWords,
        });
        moveData = { word: null, pass: true, placements: [] };
      }
    }

    // Verify the word is real, using the same dictionary check a human challenge would use
    if (moveData.word) {
      try {
        const dictResult = await challengeWord(moveData.word);
        if (dictResult.valid === false) {
          console.warn("[ai-move] word failed dictionary check — discarding move", {
            requestId,
            claimedWord: moveData.word,
            cached: dictResult.cached,
          });
          moveData = { word: null, pass: true, placements: [] };
        }
      } catch (dictErr) {
        // Dictionary lookup itself failed (e.g. scraper issue) — don't block
        // gameplay over an infrastructure hiccup, just let the move through.
        console.warn("[ai-move] dictionary check errored, allowing move through", {
          requestId,
          claimedWord: moveData.word,
          dictErr: dictErr.message,
        });
      }
    }
    return res.json({ success: true, ...moveData });
  } catch (err) {
    console.error("ai-move error:", {
      requestId,
      status: err.status,
      message: err.message,
    });
    return res.status(err.status || 500).json({
      success: false,
      error: "AI move generation failed",
      status: err.status || 500,
    });
  }
});

export default router;
