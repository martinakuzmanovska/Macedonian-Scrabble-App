import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "../middleware/requireAuth.js";
import { findFormedWords, validatePlacement, calcScore } from "../game/gameEngine.js";
import { challengeWord } from "../services/challengeService.js";

const router = express.Router();

router.use(requireAuth);

// ── Helpers ──────────────────────────────────

function boardToOccupiedList(board) {
  const occupied = [];
  board.forEach((row, r) => row.forEach((cell, c) => {
    if (cell) occupied.push(`(${r},${c})=${cell.displayLetter || cell.letter}`);
  }));
  return occupied.join(" ") || "empty";
}

function getAIDifficultyPrompt(age) {
  if (age <= 8) return "Easy: common 2-3 letter words.";
  if (age <= 12) return "Easy: common 3-5 letter words.";
  if (age <= 17) return "Medium: 4-7 letter words.";
  return "Hard: maximize score using bonus squares.";
}

const submitMove = {
  name: "submit_move",
  description: "Submit a Macedonian Scrabble word or pass.",
  input_schema: {
    type: "object",
    properties: {
      word: { type: "string" },
      row: { type: "integer", minimum: 0, maximum: 14 },
      col: { type: "integer", minimum: 0, maximum: 14 },
      direction: { type: "string", enum: ["H", "V"] },
      pass: { type: "boolean" },
      alternatives: { type: "array", items: { type: "string" }, maxItems: 4 },
    },
    required: ["word", "row", "col", "direction", "pass"],
    additionalProperties: false,
  },
};
const passMove = () => ({ word: null, placements: [], pass: true });
const normalize = letter => letter.normalize("NFC").toUpperCase();

function buildCandidate(boardState, rack, isFirstMove, word, row, col, direction) {
  if (!Number.isInteger(row) || !Number.isInteger(col) || !["H", "V"].includes(direction)) {
    throw new Error("row/col must be integers and direction H or V");
  }
  const board = boardState.map(cells => [...cells]);
  const pool = [...rack];
  const placements = [];
  for (const [offset, letter] of Array.from(word).entries()) {
    const r = row + (direction === "V" ? offset : 0);
    const c = col + (direction === "H" ? offset : 0);
    if (r < 0 || r >= 15 || c < 0 || c >= 15) throw new Error("word extends outside the 15x15 board");
    const existing = boardState[r][c];
    if (existing) {
      const existingLetter = normalize(existing.displayLetter || existing.letter);
      if (existingLetter !== letter) throw new Error(`cell (${r},${c}) contains ${existingLetter}, but your word puts ${letter} there; keep ${existingLetter} or choose another start/direction`);
      continue;
    }
    let index = pool.findIndex(tile => normalize(tile.letter) === letter);
    if (index === -1) index = pool.findIndex(tile => tile.letter === "★");
    if (index === -1) throw new Error(`letter ${letter} is not in your rack (or has already been used)`);
    const [tile] = pool.splice(index, 1);
    board[r][c] = { ...tile, displayLetter: letter };
    placements.push({ row: r, col: c, letter });
  }
  const formedWords = findFormedWords(board, placements);
  const error = validatePlacement({ board, confirmedBoard: boardState, placedTiles: placements, isFirstMove, formedWords });
  if (error) throw new Error(error);
  if (!formedWords.some(formed => formed.word === word && formed.cells.every((cell, i) =>
      cell.row === row + (direction === "V" ? i : 0) && cell.col === col + (direction === "H" ? i : 0)))) {
    throw new Error("word and start must include the full formed word, including adjacent existing letters");
  }
  return { word, row, col, direction, placements, formedWords, score: calcScore(board, placements, boardState).total };
}

export async function generateValidatedAIMove({ boardState, rack, age, requestId }) {
  if (!Array.isArray(boardState) || boardState.length !== 15 ||
      boardState.some(row => !Array.isArray(row) || row.length !== 15) || !Array.isArray(rack)) {
    throw Object.assign(new Error("A 15x15 board and rack are required"), { status: 400 });
  }
  const isFirstMove = !boardState.some(row => row.some(Boolean));
  const prompt = `Play Macedonian Scrabble using standard Macedonian Cyrillic words.
${getAIDifficultyPrompt(age)}
15x15 board, zero-based (row,col). Occupied cells below; all unlisted cells are empty:
${boardToOccupiedList(boardState)}
Rack: ${rack.map(tile => tile.letter).join(", ")}. ★ can stand for any letter.
Return the full word, its START row/col and H/V direction. Reuse matching board letters; fill empty cells using only rack tiles. All crosswords must be valid.
H: letter i goes at (row,col+i). V: letter i goes at (row+i,col). Existing letters cannot be replaced. Check each occupied cell on your path.
${isFirstMove ? "First move must cross cell (7,7)." : "The move must touch an existing tile."}
Include up to 4 different common words in alternatives, preferably short words. The server searches all starts/directions for every proposed word. Avoid passing just because coordinates are difficult.
If no legal move, pass=true (word="", row=0, col=0, direction="H").`;
  const client = new Anthropic();
  const dictionary = new Map();
  let feedback = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    console.log("[ai-move] calling Claude", { requestId, model: "claude-haiku-5-5", attempt });
    const response = await client.messages.create({
      model: "claude-haiku-5-5", max_tokens: 300,
      thinking: { type: "disabled" },
      tools: [submitMove], tool_choice: { type: "tool", name: "submit_move" },
      messages: [{ role: "user", content: prompt + feedback }],
    });
    console.log("[ai-move] raw response shape", {
      requestId, stopReason: response.stop_reason,
      contentBlockTypes: response.content?.map(item => item.type), usage: response.usage,
    });
    const move = response.content?.find(block => block.type === "tool_use" && block.name === "submit_move")?.input;
    try {
      if (!move || typeof move.pass !== "boolean") throw new Error("submit_move input is missing or invalid");
      const proposedWords = [move.word, ...(Array.isArray(move.alternatives) ? move.alternatives.slice(0, 4) : [])];
      const words = [...new Set(proposedWords.filter(word => typeof word === "string")
        .map(normalize).filter(word => /^[АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШ]{2,15}$/u.test(word)))];
      if (!words.length) throw new Error("Propose common Macedonian words of 2-15 letters; the server will find coordinates");
      const candidates = [];
      let placementError = "No start/direction fits these words using your rack and the existing board";
      for (const word of words) {
        for (const direction of ["H", "V"]) {
          for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
              try {
                candidates.push(buildCandidate(boardState, rack, isFirstMove, word, row, col, direction));
              } catch (error) {
                if (typeof move.word === "string" && word === normalize(move.word) && row === move.row && col === move.col && direction === move.direction) {
                  placementError = error.message;
                }
              }
            }
          }
        }
      }
      // Score only with the existing engine; geometry/rack checks cost no API calls.
      candidates.sort((a, b) => b.score - a.score);
      let dictionaryError;
      for (const candidate of candidates) {
        const results = await Promise.all([...new Set(candidate.formedWords.map(formed => formed.word))].map(async word => {
          if (!dictionary.has(word)) dictionary.set(word, challengeWord(word));
          return { word, valid: (await dictionary.get(word)).valid };
        }));
        const invalid = results.find(result => result.valid !== true);
        if (invalid) {
          dictionaryError = `formed word ${invalid.word} is not in the dictionary`;
          continue;
        }
        const { formedWords, score, ...selected } = candidate;
        console.log("[ai-move] Claude success", {
          requestId, word: selected.word, placementCount: selected.placements.length,
          legalCandidates: candidates.length, row: selected.row, col: selected.col, direction: selected.direction,
        });
        return { ...selected, pass: false };
      }
      throw new Error(dictionaryError || `${placementError}. All starts and directions were checked; suggest DIFFERENT words`);
    } catch (error) {
      console.warn("[ai-move] invalid move", { requestId, attempt, message: error.message });
      feedback = `\nRejected move: ${JSON.stringify(move) ?? "missing tool input"}. Invalid: ${error.message}. Do not repeat it. Submit a corrected move or pass.`;
    }
  }
  return passMove();
}

router.post("/", async (req, res) => {
  const requestId = req.requestId;
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

  try {
    const moveData = await generateValidatedAIMove({ boardState, rack, age, requestId });
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
