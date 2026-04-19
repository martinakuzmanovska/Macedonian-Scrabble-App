import { useState, useCallback, useEffect, useRef } from "react";
import * as Tone from "tone";

// ═══════════════════════════════════════════
// SOUND SYSTEM
// ═══════════════════════════════════════════
let audioStarted = false;
async function ensureAudio() {
  if (!audioStarted) {
    await Tone.start();
    audioStarted = true;
  }
}

const SFX = {
  tilePickup: () => {
    ensureAudio();
    const synth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.05 },
      volume: -12,
    }).toDestination();
    synth.triggerAttackRelease("C5", "0.04");
    setTimeout(() => synth.dispose(), 200);
  },
  tileDrop: () => {
    ensureAudio();
    const synth = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 2,
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
      volume: -8,
    }).toDestination();
    synth.triggerAttackRelease("G2", "0.1");
    setTimeout(() => synth.dispose(), 300);
  },
  tileReturn: () => {
    ensureAudio();
    const synth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.12, sustain: 0, release: 0.05 },
      volume: -14,
    }).toDestination();
    synth.triggerAttackRelease("E4", "0.06");
    setTimeout(() => synth.dispose(), 200);
  },
  bonusDL: () => {
    ensureAudio();
    const synth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.05, release: 0.1 },
      volume: -8,
    }).toDestination();
    synth.triggerAttackRelease("E5", "0.12");
    setTimeout(() => synth.dispose(), 300);
  },
  bonusTL: () => {
    ensureAudio();
    const synth = new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.05, release: 0.1 },
      volume: -10,
    }).toDestination();
    synth.triggerAttackRelease("A5", "0.15");
    setTimeout(() => synth.dispose(), 400);
  },
  bonusDW: () => {
    ensureAudio();
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.25, sustain: 0.05, release: 0.15 },
      volume: -8,
    }).toDestination();
    synth.triggerAttackRelease(["C5", "E5"], "0.15");
    setTimeout(() => synth.dispose(), 500);
  },
  bonusTW: () => {
    ensureAudio();
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.08, release: 0.2 },
      volume: -8,
    }).toDestination();
    synth.triggerAttackRelease(["C5", "E5", "G5"], "0.2");
    setTimeout(() => synth.dispose(), 600);
  },
  wordSuccess: () => {
    ensureAudio();
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.3 },
      volume: -6,
    }).toDestination();
    const now = Tone.now();
    synth.triggerAttackRelease("C5", "0.15", now);
    synth.triggerAttackRelease("E5", "0.15", now + 0.1);
    synth.triggerAttackRelease("G5", "0.15", now + 0.2);
    synth.triggerAttackRelease("C6", "0.3", now + 0.3);
    setTimeout(() => synth.dispose(), 1200);
  },
  challengeValid: () => {
    ensureAudio();
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "square" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.05, release: 0.15 },
      volume: -10,
    }).toDestination();
    const now = Tone.now();
    synth.triggerAttackRelease("G4", "0.1", now);
    synth.triggerAttackRelease("C5", "0.2", now + 0.12);
    setTimeout(() => synth.dispose(), 600);
  },
  challengeInvalid: () => {
    ensureAudio();
    const synth = new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.2 },
      volume: -8,
    }).toDestination();
    const now = Tone.now();
    synth.triggerAttackRelease("E4", "0.15", now);
    synth.triggerAttackRelease("Bb3", "0.3", now + 0.15);
    setTimeout(() => synth.dispose(), 800);
  },
  gameOver: () => {
    ensureAudio();
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.03, decay: 0.4, sustain: 0.15, release: 0.5 },
      volume: -4,
    }).toDestination();
    const now = Tone.now();
    synth.triggerAttackRelease(["C4", "E4", "G4"], "0.3", now);
    synth.triggerAttackRelease(["C4", "F4", "A4"], "0.3", now + 0.35);
    synth.triggerAttackRelease(["C4", "E4", "G4"], "0.3", now + 0.7);
    synth.triggerAttackRelease(["C5", "E5", "G5"], "0.6", now + 1.05);
    setTimeout(() => synth.dispose(), 2500);
  },
  bonusAwarded: () => {
    ensureAudio();
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.1, release: 0.2 },
      volume: -6,
    }).toDestination();
    const now = Tone.now();
    synth.triggerAttackRelease("E5", "0.1", now);
    synth.triggerAttackRelease("G5", "0.1", now + 0.08);
    synth.triggerAttackRelease("B5", "0.1", now + 0.16);
    synth.triggerAttackRelease("E6", "0.25", now + 0.24);
    setTimeout(() => synth.dispose(), 800);
  },
};

function playBonusSound(row, col) {
  const b = BONUS_MAP[row]?.[col];
  if (b === "TW") SFX.bonusTW();
  else if (b === "TL") SFX.bonusTL();
  else if (b === "DW" || b === "ST") SFX.bonusDW();
  else if (b === "DL") SFX.bonusDL();
  else SFX.tileDrop();
}

// ═══════════════════════════════════════════
// MACEDONIAN SCRABBLE - ПОЛНО ИЗДАНИЕ
// Drag & Drop, Речник валидација, Инфо за зборови
// ═══════════════════════════════════════════

const TILE_CONFIG = {
  "★": { count: 2, points: 0 },
  А: { count: 9, points: 1 },
  Е: { count: 6, points: 1 },
  И: { count: 7, points: 2 },
  О: { count: 7, points: 2 },
  Н: { count: 6, points: 2 },
  Р: { count: 6, points: 2 },
  С: { count: 5, points: 3 },
  Т: { count: 5, points: 3 },
  У: { count: 4, points: 3 },
  В: { count: 4, points: 4 },
  К: { count: 4, points: 4 },
  Л: { count: 4, points: 4 },
  П: { count: 3, points: 5 },
  Г: { count: 2, points: 6 },
  Д: { count: 3, points: 6 },
  М: { count: 3, points: 6 },
  Б: { count: 2, points: 7 },
  З: { count: 2, points: 7 },
  Ј: { count: 2, points: 7 },
  Ц: { count: 2, points: 8 },
  Ч: { count: 2, points: 8 },
  Ж: { count: 1, points: 9 },
  Ф: { count: 1, points: 9 },
  Ш: { count: 1, points: 9 },
  Ѓ: { count: 1, points: 10 },
  Ѕ: { count: 1, points: 10 },
  Љ: { count: 1, points: 10 },
  Њ: { count: 1, points: 10 },
  Ќ: { count: 1, points: 10 },
  Џ: { count: 1, points: 10 },
  Х: { count: 1, points: 10 },
};
const MK_LETTERS = "АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШ";
const getPoints = (l) => (!l || l === "★" ? 0 : (TILE_CONFIG[l]?.points ?? 0));

const BONUS_MAP = [
  ["", "", "", "TW", "", "", "TL", "", "TL", "", "", "TW", "", "", ""],
  ["", "", "DL", "", "", "DW", "", "", "", "DW", "", "", "DL", "", ""],
  ["", "DL", "", "", "DL", "", "", "", "", "", "DL", "", "", "DL", ""],
  ["TW", "", "", "TL", "", "", "", "DW", "", "", "", "TL", "", "", "TW"],
  ["", "", "DL", "", "", "", "DL", "", "DL", "", "", "", "DL", "", ""],
  ["", "DW", "", "", "", "TL", "", "", "", "TL", "", "", "", "DW", ""],
  ["TL", "", "", "", "DL", "", "", "", "", "", "DL", "", "", "", "TL"],
  ["", "", "", "DW", "", "", "", "ST", "", "", "", "DW", "", "", ""],
  ["TL", "", "", "", "DL", "", "", "", "", "", "DL", "", "", "", "TL"],
  ["", "DW", "", "", "", "TL", "", "", "", "TL", "", "", "", "DW", ""],
  ["", "", "DL", "", "", "", "DL", "", "DL", "", "", "", "DL", "", ""],
  ["TW", "", "", "TL", "", "", "", "DW", "", "", "", "TL", "", "", "TW"],
  ["", "DL", "", "", "DL", "", "", "", "", "", "DL", "", "", "DL", ""],
  ["", "", "DL", "", "", "DW", "", "", "", "DW", "", "", "DL", "", ""],
  ["", "", "", "TW", "", "", "TL", "", "TL", "", "", "TW", "", "", ""],
];
const BONUS_COLORS = {
  TW: { bg: "#c0392b", label: "ТЗ" },
  TL: { bg: "#2980b9", label: "ТБ" },
  DW: { bg: "#e67e22", label: "ДЗ" },
  DL: { bg: "#27ae60", label: "ДБ" },
  ST: { bg: "#e67e22", label: "★" },
};

function createTileBag() {
  const bag = [];
  for (const [letter, config] of Object.entries(TILE_CONFIG)) {
    for (let i = 0; i < config.count; i++)
      bag.push({
        letter,
        points: config.points,
        id: `${letter}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      });
  }
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}
function drawTiles(bag, count) {
  return bag.splice(0, Math.min(count, bag.length));
}
function createEmptyBoard() {
  return Array(15)
    .fill(null)
    .map(() => Array(15).fill(null));
}

// ═══════════════════════════════════════════
// AI WORD VALIDATION — Дигитален Речник
// ═══════════════════════════════════════════
async function validateWordWithAI(word) {
  try {
    const res = await fetch("/api/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word }),
    });

    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Response data:", data);

    return {
      valid: data.valid ?? null,
      explanation: data.valid
        ? `Зборот "${word}" е валиден македонски збор.`
        : `Зборот "${word}" не е пронајден во речникот.`,
      definition: data.definition || "",
      source: "Македонски.гов.мк",
    };
  } catch (err) {
    console.error("validateWordWithAI error:", err);
    throw err;
  }
  //   try {
  //     const response = await fetch("https://api.anthropic.com/v1/messages", {
  //       method: "POST", headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         model: "claude-sonnet-4-20250514", max_tokens: 1500,
  //         tools: [{ type: "web_search_20250305", name: "web_search" }],
  //         messages: [{ role: "user", content: `Ти си судија во македонски Скрабл. Треба да провериш дали зборот "${word}" е ВАЛИДЕН ЛИТЕРАТУРЕН МАКЕДОНСКИ ЗБОР.

  // ЗАДОЛЖИТЕЛНО пребарај на следниве извори (направи повеќе пребарувања):
  // 1. Пребарај: "${word} site:mk.wiktionary.org" - македонски Викиречник
  // 2. Пребарај: "${word} site:mk.wikipedia.org" - македонска Википедија
  // 3. Пребарај: "${word} македонски речник значење"
  // 4. Пребарај: "${word} дигитален речник македонски"

  // СТРОГИ ПРАВИЛА:
  // - Зборот МОРА да постои во македонски речник или енциклопедија
  // - Прифатливи се: именки, глаголи (сите форми), придавки, прилози, заменки, предлози, сврзници
  // - НЕ прифаќај: жаргон, сленг, туѓи зборови кои не се адаптирани, случајни комбинации на букви
  // - Граматичките форми на валидни зборови СЕ прифатливи (множина, падежи, глаголски времиња)

  // Одговори САМО со JSON:
  // {"valid": true/false, "explanation": "објаснување на македонски зошто е/не е валиден", "definition": "кратка дефиниција ако зборот е валиден", "source": "изворот каде е пронајден"}` }],
  //       })
  //     });
  //     const data = await response.json();
  //     const text = data.content?.map(item => item.type === "text" ? item.text : "").filter(Boolean).join("\n") || "";
  //     const clean = text.replace(/```json|```/g, "").trim();
  //     try {
  //       const jsonMatch = clean.match(/\{[\s\S]*\}/);
  //       if (jsonMatch) return JSON.parse(jsonMatch[0]);
  //     } catch {}
  //     if (text.includes('"valid": true') || text.includes('"valid":true')) return { valid: true, explanation: "Потврден.", definition: "", source: "" };
  //     return { valid: false, explanation: "Не е пронајден во македонски речник.", definition: "", source: "" };
  //   } catch { return { valid: null, explanation: "Грешка при проверка.", definition: "", source: "" }; }
}

// ═══════════════════════════════════════════
// WORD INFO — Детални информации за збор
// ═══════════════════════════════════════════
async function getWordInfo(word) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [
          {
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
          },
        ],
      }),
    });
    const data = await response.json();
    const text =
      data.content
        ?.map((item) => (item.type === "text" ? item.text : ""))
        .filter(Boolean)
        .join("\n") || "";
    const jsonMatch = text.replace(/```json|```/g, "").match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return {
      word,
      definition: "Не се пронајдени информации.",
      partOfSpeech: "",
      etymology: "",
      examples: [],
      synonyms: [],
      relatedWords: [],
      funFact: "",
    };
  } catch {
    return {
      word,
      definition: "Грешка при пребарување.",
      partOfSpeech: "",
      etymology: "",
      examples: [],
      synonyms: [],
      relatedWords: [],
      funFact: "",
    };
  }
}

// ═══════════════════════════════════════════
// AI PLAYER MOVE GENERATION
// ═══════════════════════════════════════════
function boardToText(bs) {
  let t = "   ";
  for (let c = 0; c < 15; c++) t += String(c).padStart(3);
  t += "\n";
  for (let r = 0; r < 15; r++) {
    t += String(r).padStart(2) + " ";
    for (let c = 0; c < 15; c++) {
      const cell = bs[r][c];
      t += (cell ? cell.displayLetter || cell.letter : ".").padStart(3);
    }
    t += "\n";
  }
  return t;
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
async function generateAIMove(boardState, rack, isFirstMove, age) {
  const rackLetters = rack
    .map((t) => (t.letter === "★" ? "ЏОКЕР" : t.letter))
    .join(", ");
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [
          {
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
          },
        ],
      }),
    });
    const data = await response.json();
    const text =
      data.content
        ?.map((item) => (item.type === "text" ? item.text : ""))
        .filter(Boolean)
        .join("\n") || "";
    const jsonMatch = text.replace(/```json|```/g, "").match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { word: null, pass: true };
  } catch {
    return { word: null, pass: true };
  }
}

// ═══════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════
async function loadLeaderboard() {
  try {
    const r = await window.storage.get("mk-scrabble-lb");
    return r ? JSON.parse(r.value) : [];
  } catch {
    return [];
  }
}
async function saveLeaderboard(data) {
  try {
    await window.storage.set("mk-scrabble-lb", JSON.stringify(data));
  } catch {}
}
async function updateLeaderboard(name, score, won, age) {
  const lb = await loadLeaderboard();
  let e = lb.find((x) => x.name === name);
  if (!e) {
    e = { name, age, bestScore: 0, totalGames: 0, wins: 0, totalScore: 0 };
    lb.push(e);
  }
  e.totalGames++;
  e.totalScore += score;
  e.age = age;
  if (won) e.wins++;
  if (score > e.bestScore) e.bestScore = score;
  e.avgScore = Math.round(e.totalScore / e.totalGames);
  e.lastPlayed = new Date().toISOString();
  lb.sort((a, b) => b.bestScore - a.bestScore);
  await saveLeaderboard(lb);
  return lb;
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════
export default function MacedonianScrabble({
  initialGameState,
  user,
  onLeave,
} = {}) {
  const hasServerGame = !!initialGameState;

  const [screen, setScreen] = useState(() => {
    if (!initialGameState) return "home";
    if (initialGameState.status === "gameOver") return "gameOver";
    return "playing";
  });
  const [board, setBoard] = useState(
    () => initialGameState?.board ?? createEmptyBoard(),
  );
  const [confirmedBoard, setConfirmedBoard] = useState(
    () => initialGameState?.confirmedBoard ?? createEmptyBoard(),
  );
  const [tileBag, setTileBag] = useState(() => initialGameState?.tileBag ?? []);
  const [players, setPlayers] = useState(() =>
    (initialGameState?.players ?? []).map((p) => ({
      ...p,
      name: p.displayName || p.name || "Играч",
    })),
  );
  const [currentPlayer, setCurrentPlayer] = useState(
    () => initialGameState?.currentPlayerIndex ?? 0,
  );
  const [selectedTile, setSelectedTile] = useState(null);
  const [placedTiles, setPlacedTiles] = useState([]);
  const [turnScore, setTurnScore] = useState(0);
  const [formedWords, setFormedWords] = useState([]);
  const [message, setMessage] = useState(() => {
    if (!initialGameState?.players?.length) return "";
    const cp =
      initialGameState.players[initialGameState.currentPlayerIndex ?? 0];
    return cp ? `${cp.displayName || cp.name} — твој ред!` : "";
  });
  const [challengeResult, setChallengeResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [jokerModal, setJokerModal] = useState(null);
  const [jokerAssignments, setJokerAssignments] = useState(
    () => initialGameState?.jokerAssignments ?? {},
  );
  const [consecutivePasses, setConsecutivePasses] = useState(
    () => initialGameState?.consecutivePasses ?? 0,
  );
  const [gameLog, setGameLog] = useState(() => initialGameState?.gameLog ?? []);
  const [isFirstMove, setIsFirstMove] = useState(
    () => initialGameState?.isFirstMove ?? true,
  );
  const [leaderboard, setLeaderboard] = useState([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiMoveDisplay, setAiMoveDisplay] = useState(null);
  const [wordInfoModal, setWordInfoModal] = useState(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [draggedTile, setDraggedTile] = useState(null);
  const [wordRecords, setWordRecords] = useState({}); // { playerIdx: { longestWord, longestLen, bestWord, bestScore } }
  const [endBonuses, setEndBonuses] = useState(null); // shown at game over
  const [setupPlayers, setSetupPlayers] = useState([
    { name: "Играч 1", age: 25, type: "human" },
    { name: "Играч 2", age: 25, type: "human" },
  ]);

  // Which slot is the logged-in user? Compare as strings to handle ObjectId vs string.
  const myPlayerIndex = hasServerGame
    ? (initialGameState?.players ?? []).findIndex((p) => {
        if (!p.userId) return false;
        const uid = user?._id ?? user?.id ?? "";
        return p.userId.toString() === uid.toString();
      })
    : currentPlayer;

  // Only allow interaction when it's this user's turn
  const isMyTurn =
    !hasServerGame || (myPlayerIndex !== -1 && myPlayerIndex === currentPlayer);
  // DEBUG — remove after confirming correct
  if (hasServerGame)
    console.log(
      "myPlayerIndex:",
      myPlayerIndex,
      "currentPlayer:",
      currentPlayer,
      "isMyTurn:",
      isMyTurn,
      "userId:",
      user?._id ?? user?.id,
      "players userIds:",
      (initialGameState?.players ?? []).map((p) => p.userId),
    );

  // Stable refs so polling closure always reads current values
  const gameIdRef = useRef(initialGameState?.gameId ?? null);
  const isMyTurnRef = useRef(false);
  const placedTilesRef = useRef([]);
  const screenRef = useRef(screen);
  const showingChallengeResultRef = useRef(false);

  useEffect(() => {
    loadLeaderboard().then(setLeaderboard);
  }, []);

  // Trigger AI move on mount if it's AI's turn from the start
  useEffect(() => {
    if (!hasServerGame) return;
    const cp =
      initialGameState?.players?.[initialGameState?.currentPlayerIndex ?? 0];
    if (cp?.type === "ai") {
      const conf = initialGameState.confirmedBoard ?? createEmptyBoard();
      setTimeout(
        () =>
          triggerAIMove(
            (initialGameState.players ?? []).map((p) => ({
              ...p,
              name: p.displayName || p.name || "Играч",
            })),
            initialGameState.currentPlayerIndex ?? 0,
            conf,
            initialGameState.tileBag ?? [],
            initialGameState.isFirstMove ?? true,
            conf,
          ),
        800,
      );
    }
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    isMyTurnRef.current = isMyTurn;
  }, [isMyTurn]);
  useEffect(() => {
    placedTilesRef.current = placedTiles;
  }, [placedTiles]);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  // Poll for updates — always runs in multiplayer, applies state when it changes
  useEffect(() => {
    if (!hasServerGame || !gameIdRef.current) return;

    const applyServerState = (s) => {
      if (showingChallengeResultRef.current) return;
      const normalizedPlayers = (s.players ?? []).map((p) => ({
        ...p,
        name: p.displayName || p.name || "Играч",
      }));
      setPlayers(normalizedPlayers);
      setCurrentPlayer(s.currentPlayerIndex ?? 0);
      setBoard(s.board ?? createEmptyBoard());
      setConfirmedBoard(s.confirmedBoard ?? createEmptyBoard());
      setTileBag(s.tileBag ?? []);
      setGameLog(s.gameLog ?? []);
      setIsFirstMove(s.isFirstMove ?? false);
      setConsecutivePasses(s.consecutivePasses ?? 0);
      setJokerAssignments(s.jokerAssignments ?? {});
      setTurnScore(s.turnScore ?? 0);
      if (s.status === "gameOver") {
        setScreen("gameOver");
        return;
      }

      // Determine my index from the live players list
      const myUid = user?._id ?? user?.id ?? "";
      const myIdx = normalizedPlayers.findIndex(
        (p) => p.userId?.toString() === myUid.toString(),
      );
      const iAmCurrentPlayer = myIdx === (s.currentPlayerIndex ?? 0);

      if (s.status === "challenge" && !iAmCurrentPlayer) {
        setFormedWords(s.formedWords ?? []);
        setPlacedTiles(s.placedTiles ?? []);
        const mover = normalizedPlayers[s.currentPlayerIndex ?? 0];
        const wl = (s.formedWords ?? []).map((w) => w.word || w).join(", ");
        setMessage(`${mover?.name}: ${wl} = ${s.turnScore ?? 0} п.`);
        setScreen("challenge");
        return;
      }

      if (
        (screenRef.current === "challenge" ||
          screenRef.current === "waitingChallenge") &&
        s.status === "challenge"
      ) {
        return;
      }

      if (
        (screenRef.current === "challenge" ||
          screenRef.current === "waitingChallenge") &&
        s.status === "challenge"
      ) {
        return;
      }

      // Normal playing state
      setPlacedTiles([]);
      setFormedWords([]);
      const cp = normalizedPlayers[s.currentPlayerIndex ?? 0];
      if (cp && screenRef.current === "playing") {
        setMessage(`${cp.name} — твој ред!`);
      }
      if (showingChallengeResultRef.current) return;
      setScreen("playing");
    };

    const interval = setInterval(async () => {
      // Skip polling only when actively placing tiles on board
      if (screenRef.current === "gameOver") return;
      if (
        isMyTurnRef.current &&
        placedTilesRef.current.length > 0 &&
        screenRef.current === "playing"
      )
        return;
      try {
        const res = await fetch(`/api/games/${gameIdRef.current}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) applyServerState(data.state);
        else console.warn("Poll got error:", data.error);
      } catch (err) {
        console.warn("Poll fetch failed:", err.message);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [hasServerGame]); // run once on mount — interval reads latest state via closure refs

  const getDisplayLetter = (tile) => {
    if (!tile) return "";
    if (tile.letter === "★" && jokerAssignments[tile.id])
      return jokerAssignments[tile.id];
    return tile.letter;
  };
  const addLog = (entry) => setGameLog((prev) => [...prev, entry]);

  // ─── DRAG & DROP ───
  const handleDragStart = (e, tile, rackIndex) => {
    if (
      screen !== "playing" ||
      players[currentPlayer]?.type === "ai" ||
      !isMyTurn
    )
      return;
    setDraggedTile({ ...tile, rackIndex });
    setSelectedTile({ ...tile, rackIndex });
    SFX.tilePickup();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", tile.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnBoard = (e, row, col) => {
    e.preventDefault();
    const tile = draggedTile || selectedTile;
    if (!tile || screen !== "playing" || board[row][col]) {
      setDraggedTile(null);
      return;
    }
    if (tile.letter === "★" && !jokerAssignments[tile.id]) {
      setJokerModal({ row, col, tile });
      setDraggedTile(null);
      return;
    }
    doPlace(row, col, tile, getDisplayLetter(tile));
    setDraggedTile(null);
  };

  const handleDropOnRack = (e) => {
    e.preventDefault();
    setDraggedTile(null);
    setSelectedTile(null);
  };

  // ─── GAME START ───
  const startGame = () => {
    if (hasServerGame) return; // server owns this game
    const bag = createTileBag();
    const gp = setupPlayers.map((sp) => ({
      ...sp,
      rack: drawTiles(bag, 7),
      score: 0,
      skipPenalty: false,
    }));
    setTileBag([...bag]);
    setPlayers(gp);
    setBoard(createEmptyBoard());
    setConfirmedBoard(createEmptyBoard());
    setCurrentPlayer(0);
    setPlacedTiles([]);
    setIsFirstMove(true);
    setConsecutivePasses(0);
    setGameLog([]);
    setJokerAssignments({});
    setAiMoveDisplay(null);
    setWordInfoModal(null);
    setWordRecords({});
    setEndBonuses(null);
    setMessage(`${gp[0].name} — твој ред!`);
    setScreen("playing");
    if (gp[0].type === "ai")
      setTimeout(
        () =>
          triggerAIMove(
            gp,
            0,
            createEmptyBoard(),
            bag,
            true,
            createEmptyBoard(),
          ),
        600,
      );
  };

  const selectTile = (tile, index) => {
    if (
      screen !== "playing" ||
      players[currentPlayer]?.type === "ai" ||
      !isMyTurn
    )
      return;
    SFX.tilePickup();
    setSelectedTile(
      selectedTile?.id === tile.id ? null : { ...tile, rackIndex: index },
    );
  };

  const placeTileOnBoard = (row, col) => {
    if (!selectedTile || screen !== "playing" || board[row][col]) return;
    if (selectedTile.letter === "★" && !jokerAssignments[selectedTile.id]) {
      setJokerModal({ row, col, tile: selectedTile });
      return;
    }
    doPlace(row, col, selectedTile, getDisplayLetter(selectedTile));
  };

  const doPlace = (row, col, tile, displayLetter) => {
    playBonusSound(row, col);
    const nb = board.map((r) => [...r]);
    nb[row][col] = { ...tile, displayLetter };
    setBoard(nb);
    const np = [...placedTiles, { row, col, tile }];
    setPlacedTiles(np);
    const npl = [...players];
    npl[currentPlayer] = {
      ...npl[currentPlayer],
      rack: npl[currentPlayer].rack.filter((_, i) => i !== tile.rackIndex),
    };
    setPlayers(npl);
    setSelectedTile(null);
    recalculate(nb, np);
  };

  const assignJoker = (letter) => {
    if (!jokerModal) return;
    const { row, col, tile } = jokerModal;
    setJokerAssignments((prev) => ({ ...prev, [tile.id]: letter }));
    setJokerModal(null);
    doPlace(row, col, tile, letter);
  };

  const removePlacedTile = (row, col) => {
    const placed = placedTiles.find((p) => p.row === row && p.col === col);
    if (!placed) return;
    SFX.tileReturn();
    const nb = board.map((r) => [...r]);
    nb[row][col] = null;
    setBoard(nb);
    const newPlaced = placedTiles.filter(
      (p) => !(p.row === row && p.col === col),
    );
    setPlacedTiles(newPlaced);
    const npl = [...players];
    npl[currentPlayer] = {
      ...npl[currentPlayer],
      rack: [...npl[currentPlayer].rack, placed.tile],
    };
    setPlayers(npl);
    recalculate(nb, newPlaced);
  };

  // ─── WORD DETECTION ───
  const findFormedWords = useCallback((bs, placed) => {
    if (!placed.length) return [];
    const seen = new Set();
    const results = [];
    const getL = (r, c) =>
      r < 0 || r > 14 || c < 0 || c > 14 || !bs[r][c]
        ? null
        : bs[r][c].displayLetter || bs[r][c].letter;
    const extractWord = (r, c, dr, dc) => {
      let sr = r,
        sc = c;
      while (getL(sr - dr, sc - dc)) {
        sr -= dr;
        sc -= dc;
      }
      let w = "",
        cells = [],
        cr = sr,
        cc = sc;
      while (getL(cr, cc)) {
        w += getL(cr, cc);
        cells.push({ row: cr, col: cc });
        cr += dr;
        cc += dc;
      }
      if (w.length < 2) return null;
      const key = `${dr}-${dc}-${cells[0].row}-${cells[0].col}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return { word: w, cells };
    };
    for (const p of placed) {
      const hw = extractWord(p.row, p.col, 0, 1);
      if (hw) results.push(hw);
      const vw = extractWord(p.row, p.col, 1, 0);
      if (vw) results.push(vw);
    }
    return results;
  }, []);

  const calcScore = useCallback(
    (bs, placed, confirmed) => {
      const words = findFormedWords(bs, placed);
      const ps = new Set(placed.map((p) => `${p.row}-${p.col}`));
      let total = 0;
      for (const w of words) {
        let ws = 0,
          wm = 1;
        for (const cell of w.cells) {
          const tile = bs[cell.row]?.[cell.col];
          if (!tile) continue;
          let lp = tile.letter === "★" ? 0 : getPoints(tile.letter);
          if (
            ps.has(`${cell.row}-${cell.col}`) &&
            !confirmed[cell.row][cell.col]
          ) {
            const b = BONUS_MAP[cell.row][cell.col];
            if (b === "TL") lp *= 3;
            else if (b === "DL") lp *= 2;
            else if (b === "TW") wm *= 3;
            else if (b === "DW" || b === "ST") wm *= 2;
          }
          ws += lp;
        }
        total += ws * wm;
      }
      if (placed.length === 7) total += 50;
      return { total, words };
    },
    [findFormedWords],
  );

  const recalculate = useCallback(
    (bs, placed) => {
      const { total, words } = calcScore(bs, placed, confirmedBoard);
      setFormedWords(words);
      setTurnScore(total);
    },
    [calcScore, confirmedBoard],
  );

  const validatePlacement = () => {
    if (!placedTiles.length) return "Постави барем една плочка.";
    const rows = [...new Set(placedTiles.map((p) => p.row))],
      cols = [...new Set(placedTiles.map((p) => p.col))];
    if (rows.length > 1 && cols.length > 1)
      return "Плочките мора да се во ист ред или колона.";
    if (rows.length === 1) {
      const sc = placedTiles.map((p) => p.col).sort((a, b) => a - b);
      for (let c = sc[0]; c <= sc[sc.length - 1]; c++)
        if (!board[rows[0]][c]) return "Не смее да има празнини.";
    }
    if (cols.length === 1) {
      const sr = placedTiles.map((p) => p.row).sort((a, b) => a - b);
      for (let r = sr[0]; r <= sr[sr.length - 1]; r++)
        if (!board[r][cols[0]]) return "Не смее да има празнини.";
    }
    if (isFirstMove) {
      if (!placedTiles.some((p) => p.row === 7 && p.col === 7))
        return "Првиот збор мора да го покрие центарот (★).";
      if (placedTiles.length < 2)
        return "Првиот збор мора да има барем 2 букви.";
    } else {
      let conn = false;
      for (const p of placedTiles) {
        for (const [nr, nc] of [
          [p.row - 1, p.col],
          [p.row + 1, p.col],
          [p.row, p.col - 1],
          [p.row, p.col + 1],
        ])
          if (
            nr >= 0 &&
            nr < 15 &&
            nc >= 0 &&
            nc < 15 &&
            confirmedBoard[nr][nc]
          ) {
            conn = true;
            break;
          }
        if (conn) break;
      }
      if (!conn) return "Зборот мора да се поврзе со постоечки плочки.";
    }
    if (!formedWords.length) return "Не е формиран збор.";
    return null;
  };

  const confirmPlacement = async () => {
    console.log(
      "confirmPlacement called, hasServerGame:",
      hasServerGame,
      "placedTiles:",
      placedTiles.length,
    );
    const err = validatePlacement();
    if (err) {
      setMessage(err);
      return;
    }

    if (hasServerGame) {
      // POST pending move to server — opponent will see challenge screen via polling
      try {
        setMessage("⏳ Чекај одлука од противникот...");
        const res = await fetch(
          `/api/games/${initialGameState.gameId}/confirm`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              placedTiles,
              board,
              turnScore,
              formedWords: formedWords.map((w) => w.word),
            }),
          },
        );
        const data = await res.json();
        if (data.success) {
          // Show waiting message — polling will update when opponent decides
          const wl = formedWords.map((w) => w.word).join(", ");
          setMessage(
            `⏳ ${players[currentPlayer].name}: ${wl} (${turnScore} п.) — чека потврда...`,
          );
          setScreen("waitingChallenge");
        } else {
          setMessage(`⚠️ Грешка: ${data.error}`);
        }
      } catch (err) {
        setMessage("⚠️ Грешка при поднесување.");
        console.error(err);
      }
      return;
    }

    const otherHumans = players.filter(
      (p, i) => i !== currentPlayer && p.type === "human",
    );
    if (!otherHumans.length) {
      finalizeTurn();
      return;
    }
    const wl = formedWords.map((w) => w.word).join(", ");
    const note =
      formedWords.length > 1 ? ` (${formedWords.length} зборови)` : "";
    setMessage(
      `${players[currentPlayer].name}: ${wl}${note} = ${turnScore} п.`,
    );
    setScreen("challenge");
  };

  // ─── CHALLENGE & WORD INFO ───
  // const challengeWord = async (word) => {
  //   setIsValidating(true); setChallengeResult(null);
  //   setMessage(`🤖 Агент пребарува "${word}" во речници...`);
  //   try {
  //     const result = await validateWordWithAI(word);
  //     if (result.valid === null) { setChallengeResult({ word, ...result }); setMessage('⚠️ Проверката не успеа.'); return; }
  //     let challengerIdx = -1;
  //     for (let off = 1; off < players.length; off++) { const idx = (currentPlayer + off) % players.length; if (players[idx].type === 'human') { challengerIdx = idx; break; } }
  //     if (result.valid) {
  //       SFX.challengeValid();
  //       setChallengeResult({ word, ...result });
  //       if (challengerIdx >= 0) {
  //         const np = [...players]; np[challengerIdx] = { ...np[challengerIdx], skipPenalty: true }; setPlayers(np);
  //         setMessage(`✅ "${word}" е валиден! ${np[challengerIdx].name} го губи следниот ред.`);
  //         addLog(`🔍 "${word}" потврден — ${np[challengerIdx].name} казнет`);
  //       }
  //     } else {
  //       SFX.challengeInvalid();
  //       setChallengeResult({ word, ...result });
  //       setMessage(`❌ "${word}" НЕ е валиден! ${players[currentPlayer].name} враќа плочки.`);
  //       addLog(`🔍 "${word}" одбиен`);
  //     }
  //   } catch {
  //     setChallengeResult({ word, valid: null, explanation: "Грешка при проверка.", definition: "", source: "" });
  //     setMessage('⚠️ Проверката не успеа.');
  //   } finally {
  //     setIsValidating(false);
  //   }
  // };

  const challengeWord = async (word) => {
    setIsValidating(true);
    setChallengeResult(null);
    setMessage(`🤖 Агент пребарува "${word}" во речници...`);
    try {
      const result = await validateWordWithAI(word);

      if (result.valid === true) {
        SFX.challengeValid();
        setChallengeResult({ word, ...result });
        showingChallengeResultRef.current = true;

        if (hasServerGame && initialGameState?.gameId) {
          // Tell server: challenge failed (word IS valid) — challenger loses next turn
          const res = await fetch(
            `/api/games/${initialGameState.gameId}/challenge-result`,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ word, valid: true }),
            },
          );
          const data = await res.json();
          if (data.success) {
            const challenger = data.state.players.find(
              (p, i) =>
                i !== data.state.currentPlayerIndex - 1 && p.type === "human",
            );
            setMessage(
              `✅ "${word}" е валиден! Предизвикувачот го губи следниот ред.`,
            );
          }
        } else {
          let challengerIdx = -1;
          for (let off = 1; off < players.length; off++) {
            const idx = (currentPlayer + off) % players.length;
            if (players[idx].type === "human") {
              challengerIdx = idx;
              break;
            }
          }
          if (challengerIdx >= 0) {
            const np = [...players];
            np[challengerIdx] = { ...np[challengerIdx], skipPenalty: true };
            setPlayers(np);
            setMessage(
              `✅ "${word}" е валиден! ${np[challengerIdx].name} го губи следниот ред.`,
            );
          }
        }
      } else if (result.valid === false) {
        SFX.challengeInvalid();
        setChallengeResult({ word, ...result });
        showingChallengeResultRef.current = true;

        if (hasServerGame && initialGameState?.gameId) {
          // Tell server: challenge succeeded (word is INVALID) — return tiles to Player 1
          const res = await fetch(
            `/api/games/${initialGameState.gameId}/challenge-result`,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ word, valid: false }),
            },
          );
          const data = await res.json();
          if (data.success) {
            const s = data.state;
            const normalizedPlayers = (s.players ?? []).map((p) => ({
              ...p,
              name: p.displayName || p.name || "Играч",
            }));
            setPlayers(normalizedPlayers);
            setCurrentPlayer(s.currentPlayerIndex ?? 0);
            setBoard(s.board ?? createEmptyBoard());
            setConfirmedBoard(s.confirmedBoard ?? createEmptyBoard());
            setTileBag(s.tileBag ?? []);
            setPlacedTiles([]);
            setFormedWords([]);
            setTurnScore(0);
            setChallengeResult({ word, ...result });
            showingChallengeResultRef.current = true;
            setMessage(`❌ "${word}" не е валиден! Плочките се вратени.`);
            setScreen("playing");
          }
        } else {
          setMessage(
            `❌ "${word}" НЕ е валиден! ${players[currentPlayer].name} враќа плочки.`,
          );
        }
      } else {
        setChallengeResult({ word, ...result });
        setMessage("⚠️ Проверката не успеа.");
      }
    } catch (err) {
      console.error("Challenge error:", err);
      setChallengeResult({
        word,
        valid: null,
        explanation: "Грешка при проверка.",
        definition: "",
        source: "",
      });
      setMessage("⚠️ Проверката не успеа.");
    } finally {
      setIsValidating(false);
    }
  };

  const requestWordInfo = async (word) => {
    setIsLoadingInfo(true);
    const info = await getWordInfo(word);
    setWordInfoModal(info);
    setIsLoadingInfo(false);
  };

  const returnTilesToRack = () => {
    const nb = board.map((r) => [...r]);
    const np = [...players];
    const ret = [];
    for (const p of placedTiles) {
      nb[p.row][p.col] = null;
      ret.push(p.tile);
    }
    np[currentPlayer] = {
      ...np[currentPlayer],
      rack: [...np[currentPlayer].rack, ...ret],
    };
    setBoard(nb);
    setPlayers(np);
    setPlacedTiles([]);
    setFormedWords([]);
    setTurnScore(0);
  };

  const finalizeTurn = async () => {
    console.log(
      "finalizeTurn called, hasServerGame:",
      hasServerGame,
      "gameId:",
      initialGameState?.gameId,
    );
    SFX.wordSuccess();

    // In multiplayer games, the opponent calls finalize to accept the move
    if (hasServerGame && initialGameState?.gameId) {
      try {
        setMessage("💾 Зачувување...");
        const res = await fetch(
          `/api/games/${initialGameState.gameId}/finalize`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          },
        );
        const data = await res.json();
        if (data.success) {
          const s = data.state;
          const normalizedPlayers = (s.players ?? []).map((p) => ({
            ...p,
            name: p.displayName || p.name || "Играч",
          }));
          setPlayers(normalizedPlayers);
          setCurrentPlayer(s.currentPlayerIndex ?? 0);
          setBoard(s.board ?? createEmptyBoard());
          setConfirmedBoard(s.confirmedBoard ?? createEmptyBoard());
          setTileBag(s.tileBag ?? []);
          setGameLog(s.gameLog ?? []);
          setIsFirstMove(s.isFirstMove ?? false);
          setConsecutivePasses(s.consecutivePasses ?? 0);
          setJokerAssignments(s.jokerAssignments ?? {});
          setPlacedTiles([]);
          setFormedWords([]);
          setTurnScore(0);
          setSelectedTile(null);
          setChallengeResult(null);
          setAiMoveDisplay(null);
          if (s.status === "gameOver") {
            setScreen("gameOver");
            return;
          }
          const nextCp = normalizedPlayers[s.currentPlayerIndex ?? 0];
          setMessage(nextCp ? `${nextCp.name} — твој ред!` : "");
        } else {
          setMessage(`⚠️ Грешка: ${data.error}`);
        }
      } catch (err) {
        console.error("finalizeTurn server error:", err);
        setMessage("⚠️ Грешка при зачувување.");
      }
      return;
    }

    // Local (single-player / AI) mode — original logic
    const np = [...players];
    np[currentPlayer] = {
      ...np[currentPlayer],
      score: np[currentPlayer].score + turnScore,
    };
    const needed = 7 - np[currentPlayer].rack.length;
    const drawn = drawTiles(tileBag, needed);
    np[currentPlayer] = {
      ...np[currentPlayer],
      rack: [...np[currentPlayer].rack, ...drawn],
    };
    setTileBag([...tileBag]);
    setPlayers(np);
    const newConf = board.map((r) => r.map((c) => (c ? { ...c } : null)));
    setConfirmedBoard(newConf);
    setWordRecords((prev) => {
      const rec = { ...prev };
      if (!rec[currentPlayer])
        rec[currentPlayer] = {
          longestWord: "",
          longestLen: 0,
          bestWord: "",
          bestScore: 0,
        };
      for (const w of formedWords) {
        if (w.word.length > rec[currentPlayer].longestLen) {
          rec[currentPlayer].longestWord = w.word;
          rec[currentPlayer].longestLen = w.word.length;
        }
      }
      if (turnScore > rec[currentPlayer].bestScore) {
        rec[currentPlayer].bestWord = formedWords
          .map((fw) => fw.word)
          .join("+");
        rec[currentPlayer].bestScore = turnScore;
      }
      return rec;
    });
    addLog(
      `${players[currentPlayer].name}: ${formedWords.map((w) => w.word).join(", ")} (+${turnScore})`,
    );
    setIsFirstMove(false);
    setConsecutivePasses(0);
    setChallengeResult(null);
    setAiMoveDisplay(null);
    endTurn(false, np, newConf);
  };

  const endTurn = (wasSkip, updatedPlayers, newConf) => {
    const pls = updatedPlayers || players;
    const conf = newConf || confirmedBoard;
    setPlacedTiles([]);
    setFormedWords([]);
    setTurnScore(0);
    setSelectedTile(null);
    if (tileBag.length === 0 && pls[currentPlayer].rack.length === 0) {
      endGame(pls);
      return;
    }
    if (wasSkip) {
      const np = consecutivePasses + 1;
      setConsecutivePasses(np);
      if (np >= pls.length * 2) {
        endGame(pls);
        return;
      }
    }
    let next = (currentPlayer + 1) % pls.length,
      attempts = 0;
    const npArr = [...pls];
    while (npArr[next].skipPenalty && attempts < pls.length) {
      npArr[next] = { ...npArr[next], skipPenalty: false };
      addLog(`${npArr[next].name}: прескокнат (казна)`);
      next = (next + 1) % pls.length;
      attempts++;
    }
    setPlayers(npArr);
    setCurrentPlayer(next);
    setMessage(`${npArr[next].name} — твој ред!`);
    setScreen("playing");
    if (npArr[next].type === "ai") {
      const fm = isFirstMove;
      setTimeout(
        () => triggerAIMove(npArr, next, conf, tileBag, fm, conf),
        800,
      );
    }
  };

  const triggerAIMove = async (
    curPlayers,
    pidx,
    curBoard,
    curBag,
    firstMove,
    confirmed,
  ) => {
    setIsAIThinking(true);
    const player = curPlayers[pidx];
    setMessage(`🤖 ${player.name} размислува...`);
    const result = await generateAIMove(
      confirmed,
      player.rack,
      firstMove,
      player.age,
    );
    setIsAIThinking(false);
    if (!result || result.pass || !result.word || !result.placements?.length) {
      addLog(`${player.name}: пас (AI)`);
      setMessage(`${player.name} пасира.`);
      const np2 = consecutivePasses + 1;
      setConsecutivePasses(np2);
      if (np2 >= curPlayers.length * 2) {
        endGame(curPlayers);
        return;
      }
      const next = (pidx + 1) % curPlayers.length;
      setCurrentPlayer(next);
      setMessage(`${curPlayers[next].name} — твој ред!`);
      if (curPlayers[next].type === "ai")
        setTimeout(
          () =>
            triggerAIMove(
              curPlayers,
              next,
              confirmed,
              curBag,
              firstMove,
              confirmed,
            ),
          800,
        );
      return;
    }
    const newBoard = confirmed.map((r) => [...r]);
    const newPlaced = [];
    const np = [...curPlayers];
    let rackCopy = [...player.rack];
    let newJA = { ...jokerAssignments };
    for (const pl of result.placements) {
      if (
        pl.row < 0 ||
        pl.row > 14 ||
        pl.col < 0 ||
        pl.col > 14 ||
        newBoard[pl.row][pl.col]
      )
        continue;
      let ti = rackCopy.findIndex((t) => t.letter === pl.letter);
      if (ti === -1) {
        ti = rackCopy.findIndex((t) => t.letter === "★");
        if (ti !== -1) newJA[rackCopy[ti].id] = pl.letter;
      }
      if (ti === -1) continue;
      const tile = rackCopy[ti];
      rackCopy = rackCopy.filter((_, i) => i !== ti);
      newBoard[pl.row][pl.col] = { ...tile, displayLetter: pl.letter };
      newPlaced.push({ row: pl.row, col: pl.col, tile });
    }
    if (!newPlaced.length) {
      addLog(`${player.name}: пас (невалиден)`);
      const next = (pidx + 1) % curPlayers.length;
      setCurrentPlayer(next);
      setMessage(`${curPlayers[next].name} — твој ред!`);
      if (curPlayers[next].type === "ai")
        setTimeout(
          () =>
            triggerAIMove(
              curPlayers,
              next,
              confirmed,
              curBag,
              firstMove,
              confirmed,
            ),
          800,
        );
      return;
    }
    setJokerAssignments(newJA);
    setBoard(newBoard);
    np[pidx] = { ...np[pidx], rack: rackCopy };
    setPlayers(np);
    setPlacedTiles(newPlaced);
    const { total, words } = calcScore(newBoard, newPlaced, confirmed);
    setFormedWords(words);
    setTurnScore(total);
    const wl = words.map((w) => w.word).join(", ");
    setAiMoveDisplay({
      word: result.word,
      explanation: result.explanation,
      score: total,
      words: wl,
    });
    const hasHuman = np.some((p, i) => i !== pidx && p.type === "human");
    if (hasHuman && words.length > 0) {
      setMessage(`🤖 ${player.name}: ${wl} (${total} п.)`);
      setScreen("challenge");
    } else {
      setTimeout(() => {
        SFX.wordSuccess();
        np[pidx] = { ...np[pidx], score: np[pidx].score + total };
        const drawn = drawTiles(curBag, 7 - rackCopy.length);
        np[pidx] = { ...np[pidx], rack: [...rackCopy, ...drawn] };
        setTileBag([...curBag]);
        setPlayers(np);
        const nc = newBoard.map((r) => r.map((c) => (c ? { ...c } : null)));
        setConfirmedBoard(nc);
        addLog(`${player.name}: ${wl} (+${total})`);
        // Track AI word records too
        setWordRecords((prev) => {
          const rec = { ...prev };
          if (!rec[pidx])
            rec[pidx] = {
              longestWord: "",
              longestLen: 0,
              bestWord: "",
              bestScore: 0,
            };
          for (const w of words) {
            if (w.word.length > rec[pidx].longestLen) {
              rec[pidx].longestWord = w.word;
              rec[pidx].longestLen = w.word.length;
            }
          }
          if (total > rec[pidx].bestScore) {
            rec[pidx].bestWord = wl;
            rec[pidx].bestScore = total;
          }
          return rec;
        });
        setIsFirstMove(false);
        setConsecutivePasses(0);
        setPlacedTiles([]);
        setFormedWords([]);
        setTurnScore(0);
        setAiMoveDisplay(null);
        const next = (pidx + 1) % np.length;
        setCurrentPlayer(next);
        setMessage(`${np[next].name} — твој ред!`);
        if (np[next].type === "ai")
          setTimeout(() => triggerAIMove(np, next, nc, curBag, false, nc), 800);
      }, 2000);
    }
  };

  const passTurn = () => {
    addLog(`${players[currentPlayer].name}: пас`);
    returnTilesToRack();
    endTurn(true);
  };
  const exchangeTiles = () => {
    if (placedTiles.length > 0) {
      setMessage(
        "Замена е дозволена само ПРЕД да поставиш букви! Врати ги прво.",
      );
      return;
    }
    if (players[currentPlayer].score < 5) {
      setMessage(
        `Немаш доволно поени за замена (потребни 5, имаш ${players[currentPlayer].score}).`,
      );
      return;
    }
    if (tileBag.length < 7) {
      setMessage("Нема доволно плочки во кесата.");
      return;
    }
    const np = [...players];
    const old = [...np[currentPlayer].rack];
    np[currentPlayer] = {
      ...np[currentPlayer],
      score: np[currentPlayer].score - 5,
    };
    const newT = drawTiles(tileBag, old.length);
    tileBag.push(...old);
    for (let i = tileBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tileBag[i], tileBag[j]] = [tileBag[j], tileBag[i]];
    }
    np[currentPlayer] = { ...np[currentPlayer], rack: newT };
    setPlayers(np);
    setTileBag([...tileBag]);
    addLog(`${players[currentPlayer].name}: замена (-5 п.)`);
    setMessage(
      `${players[currentPlayer].name} замени букви (-5 поени). Сега постави збор.`,
    );
    // Does NOT end turn — player continues with new tiles
  };

  const endGame = async (pls) => {
    SFX.gameOver();
    const np = [...pls];
    // Subtract remaining tile values
    for (let i = 0; i < np.length; i++) {
      const rem = np[i].rack.reduce((s, t) => s + t.points, 0);
      np[i] = { ...np[i], score: Math.max(0, np[i].score - rem) };
    }

    // Calculate end-game bonuses from wordRecords
    const LONGEST_BONUS = 15;
    const BESTSCORE_BONUS = 10;
    const bonuses = {};
    let globalLongestLen = 0,
      globalBestScore = 0;
    let longestPlayers = [],
      bestScorePlayers = [];

    // Find global bests
    for (let i = 0; i < np.length; i++) {
      const rec = wordRecords[i];
      if (!rec) continue;
      if (rec.longestLen > globalLongestLen) {
        globalLongestLen = rec.longestLen;
        longestPlayers = [i];
      } else if (rec.longestLen === globalLongestLen && globalLongestLen > 0)
        longestPlayers.push(i);
      if (rec.bestScore > globalBestScore) {
        globalBestScore = rec.bestScore;
        bestScorePlayers = [i];
      } else if (rec.bestScore === globalBestScore && globalBestScore > 0)
        bestScorePlayers.push(i);
    }

    // Award bonuses
    for (const pi of longestPlayers) {
      if (!bonuses[pi]) bonuses[pi] = { longest: 0, bestScore: 0 };
      bonuses[pi].longest = LONGEST_BONUS;
      np[pi] = { ...np[pi], score: np[pi].score + LONGEST_BONUS };
    }
    for (const pi of bestScorePlayers) {
      if (!bonuses[pi]) bonuses[pi] = { longest: 0, bestScore: 0 };
      bonuses[pi].bestScore = BESTSCORE_BONUS;
      np[pi] = { ...np[pi], score: np[pi].score + BESTSCORE_BONUS };
    }

    const bonusInfo = {
      longestPlayers: longestPlayers.map((i) => ({
        name: np[i].name,
        word: wordRecords[i]?.longestWord,
        len: globalLongestLen,
        bonus: LONGEST_BONUS,
      })),
      bestScorePlayers: bestScorePlayers.map((i) => ({
        name: np[i].name,
        word: wordRecords[i]?.bestWord,
        score: globalBestScore,
        bonus: BESTSCORE_BONUS,
      })),
      playerBonuses: bonuses,
    };
    setEndBonuses(bonusInfo);
    setTimeout(() => SFX.bonusAwarded(), 1200);

    setPlayers(np);
    setScreen("gameOver");
    const maxS = Math.max(...np.map((p) => p.score));
    setMessage(
      `🏆 ${np
        .filter((p) => p.score === maxS)
        .map((w) => w.name)
        .join(" и ")} победи!`,
    );
    for (const p of np) {
      if (p.type !== "ai")
        await updateLeaderboard(p.name, p.score, p.score === maxS, p.age);
    }
    setLeaderboard(await loadLeaderboard());
  };

  // ═══════════════════════════════════════════
  // STYLES
  // ═══════════════════════════════════════════

  // ═══════════════════════════════════════════
  // DESIGN SYSTEM — Modern Dark
  // ═══════════════════════════════════════════
  const S = {
    page: {
      width: "100%",
      minHeight: "100vh",
      background: "#080b14",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#f1f5f9",
    },
    card: {
      background: "rgba(20, 25, 39, 0.95)",
      backdropFilter: "blur(12px)",
      borderRadius: 16,
      border: "1px solid rgba(99, 102, 241, 0.18)",
      boxShadow:
        "0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
    },
    accent: "#6366f1",
    accentCyan: "#22d3ee",
    green: "#10b981",
    red: "#ef4444",
    orange: "#f59e0b",
    muted: "#475569",
    subtle: "#1e293b",
    btn: (bg) => ({
      padding: "10px 24px",
      background: bg,
      color: "#fff",
      border: "none",
      borderRadius: 10,
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 600,
      transition: "all 0.15s",
      letterSpacing: "0.02em",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    }),
    btnO: {
      padding: "10px 24px",
      background: "transparent",
      color: "#6366f1",
      border: "1.5px solid rgba(99,102,241,0.4)",
      borderRadius: 10,
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 600,
      letterSpacing: "0.02em",
    },
    btnSm: (bg) => ({
      padding: "5px 12px",
      background: bg,
      color: "#fff",
      border: "none",
      borderRadius: 7,
      fontSize: 11,
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 600,
    }),
  };

  const BONUS_COLORS_NEW = {
    TW: { bg: "#4c1d95", glow: "#7c3aed", label: "ТЗ" },
    TL: { bg: "#1e3a8a", glow: "#3b82f6", label: "ТБ" },
    DW: { bg: "#78350f", glow: "#f59e0b", label: "ДЗ" },
    DL: { bg: "#064e3b", glow: "#10b981", label: "ДБ" },
    ST: { bg: "#4c1d95", glow: "#a78bfa", label: "★" },
  };

  const tileStyle = (tile, isSelected, isDragging) => ({
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderRadius: 8,
    background: isSelected
      ? "linear-gradient(135deg, #6366f1, #818cf8)"
      : tile?.letter === "★"
        ? "linear-gradient(135deg, #ec4899, #f59e0b, #22d3ee)"
        : "linear-gradient(160deg, #f8fafc 0%, #e2e8f0 100%)",
    border: isSelected
      ? "2px solid #a5b4fc"
      : "1px solid rgba(255,255,255,0.15)",
    cursor: "grab",
    fontWeight: 700,
    fontSize: 16,
    color: isSelected ? "#fff" : tile?.letter === "★" ? "#fff" : "#0f172a",
    fontFamily: "inherit",
    boxShadow: isSelected
      ? "0 0 16px rgba(99,102,241,0.5), 0 4px 12px rgba(0,0,0,0.3)"
      : "0 3px 8px rgba(0,0,0,0.35)",
    userSelect: "none",
    opacity: isDragging ? 0.35 : 1,
    transition: "all 0.12s ease",
  });

  // ═══════════════════════════════════════════
  // HOME
  // ═══════════════════════════════════════════
  if (screen === "home")
    return (
      <div
        style={{
          ...S.page,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-glow { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        .home-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.35) !important; }
        .home-btn-o:hover { background: rgba(99,102,241,0.1) !important; }
      `}</style>
        {/* Background grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          }}
        />
        {/* Glow orbs */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "15%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
            animation: "pulse-glow 4s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            right: "10%",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)",
            animation: "pulse-glow 5s ease-in-out infinite 1s",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            ...S.card,
            padding: "52px 44px",
            maxWidth: 440,
            width: "100%",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 6,
              color: S.accent,
              fontWeight: 600,
              marginBottom: 12,
              textTransform: "uppercase",
              opacity: 0.8,
            }}
          >
            Македонско Издание
          </div>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: 6,
              background:
                "linear-gradient(135deg, #f8fafc 0%, #a5b4fc 50%, #22d3ee 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 8,
              animation: "float 6s ease-in-out infinite",
            }}
          >
            СКРАБЛ
          </div>
          <div
            style={{
              width: 48,
              height: 3,
              background: "linear-gradient(90deg, #6366f1, #22d3ee)",
              borderRadius: 2,
              margin: "0 auto 40px",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              className="home-btn"
              onClick={() => setScreen("setup")}
              style={{
                ...S.btn("linear-gradient(135deg, #6366f1, #4f46e5)"),
                padding: "14px 24px",
                fontSize: 15,
                letterSpacing: 1,
                transition: "all 0.2s",
              }}
            >
              🎮 Нова Игра
            </button>
            <button
              className="home-btn-o"
              onClick={() => {
                loadLeaderboard().then(setLeaderboard);
                setScreen("leaderboard");
              }}
              style={{
                ...S.btnO,
                padding: "14px 24px",
                fontSize: 15,
                transition: "all 0.2s",
              }}
            >
              🏆 Табла на Најдобри
            </button>
          </div>

          <div
            style={{
              marginTop: 36,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {[
              { icon: "🖱️", text: "Drag & Drop плочки" },
              { icon: "🤖", text: "AI проверка на зборови" },
              { icon: "📖", text: "Инфо за секој збор" },
              { icon: "👥", text: "2-4 играчи + AI" },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 12px",
                  background: "rgba(99,102,241,0.06)",
                  borderRadius: 10,
                  border: "1px solid rgba(99,102,241,0.1)",
                  fontSize: 11,
                  color: S.muted,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  // ═══════════════════════════════════════════
  // LEADERBOARD
  // ═══════════════════════════════════════════
  if (screen === "leaderboard")
    return (
      <div
        style={{
          ...S.page,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap');`}</style>
        <div
          style={{
            ...S.card,
            padding: "36px 32px",
            maxWidth: 580,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: S.accent,
                  letterSpacing: 4,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                РАНГИРАЊЕ
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
                Табла на Најдобри
              </h2>
            </div>
            <button
              onClick={() => setScreen("home")}
              style={{ ...S.btnO, padding: "6px 16px", fontSize: 12 }}
            >
              ← Назад
            </button>
          </div>
          {!leaderboard.length ? (
            <div
              style={{
                textAlign: "center",
                padding: 48,
                color: S.muted,
                fontSize: 13,
              }}
            >
              Сè уште нема резултати!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "36px 1fr 60px 60px 50px 50px",
                  gap: 8,
                  padding: "6px 12px",
                  color: S.muted,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                <span>#</span>
                <span>Играч</span>
                <span style={{ textAlign: "right" }}>Најд.</span>
                <span style={{ textAlign: "right" }}>Прос.</span>
                <span style={{ textAlign: "right" }}>Игри</span>
                <span style={{ textAlign: "right" }}>Поб.</span>
              </div>
              {leaderboard.map((e, i) => (
                <div
                  key={e.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "36px 1fr 60px 60px 50px 50px",
                    gap: 8,
                    padding: "12px",
                    background:
                      i === 0
                        ? "rgba(99,102,241,0.1)"
                        : "rgba(255,255,255,0.02)",
                    borderRadius: 10,
                    border:
                      i === 0
                        ? "1px solid rgba(99,102,241,0.25)"
                        : "1px solid rgba(255,255,255,0.04)",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 16 }}>
                    {i === 0 ? (
                      "🥇"
                    ) : i === 1 ? (
                      "🥈"
                    ) : i === 2 ? (
                      "🥉"
                    ) : (
                      <span style={{ color: S.muted, fontSize: 12 }}>
                        {i + 1}
                      </span>
                    )}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {e.name}
                    </div>
                    <div style={{ fontSize: 10, color: S.muted, marginTop: 1 }}>
                      возраст: {e.age}
                    </div>
                  </div>
                  <span
                    style={{
                      textAlign: "right",
                      color: "#a5b4fc",
                      fontWeight: 700,
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    {e.bestScore}
                  </span>
                  <span
                    style={{ textAlign: "right", color: S.muted, fontSize: 12 }}
                  >
                    {e.avgScore}
                  </span>
                  <span
                    style={{ textAlign: "right", color: S.muted, fontSize: 12 }}
                  >
                    {e.totalGames}
                  </span>
                  <span
                    style={{ textAlign: "right", color: S.muted, fontSize: 12 }}
                  >
                    {e.wins}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );

  // ═══════════════════════════════════════════
  // SETUP
  // ═══════════════════════════════════════════
  if (screen === "setup") {
    const getDiff = (age) =>
      age <= 8
        ? { l: "Лесно", c: "#10b981", e: "🌱" }
        : age <= 12
          ? { l: "Средно", c: "#f59e0b", e: "⚡" }
          : age <= 17
            ? { l: "Тешко", c: "#f97316", e: "🔥" }
            : { l: "Експерт", c: "#ef4444", e: "💀" };
    return (
      <div
        style={{
          ...S.page,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap');`}</style>
        <div
          style={{
            ...S.card,
            padding: "36px 32px",
            maxWidth: 520,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: S.accent,
                  letterSpacing: 4,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                КОНФИГУРАЦИЈА
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
                Подготовка на Игра
              </h2>
            </div>
            <button
              onClick={() => setScreen("home")}
              style={{ ...S.btnO, padding: "6px 16px", fontSize: 12 }}
            >
              ← Назад
            </button>
          </div>

          {setupPlayers.map((sp, i) => {
            const d = getDiff(sp.age);
            return (
              <div
                key={i}
                style={{
                  padding: 16,
                  marginBottom: 10,
                  background:
                    sp.type === "ai"
                      ? "rgba(99,102,241,0.06)"
                      : "rgba(255,255,255,0.02)",
                  borderRadius: 12,
                  border:
                    sp.type === "ai"
                      ? "1px solid rgba(99,102,241,0.2)"
                      : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 10,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: S.muted,
                      fontWeight: 600,
                      minWidth: 60,
                    }}
                  >
                    Играч {i + 1}
                  </div>
                  <input
                    value={sp.name}
                    onChange={(e) => {
                      const s = [...setupPlayers];
                      s[i] = { ...s[i], name: e.target.value };
                      setSetupPlayers(s);
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "#f1f5f9",
                      fontSize: 13,
                      fontFamily: "inherit",
                      outline: "none",
                    }}
                  />
                  {setupPlayers.length > 2 && (
                    <button
                      onClick={() =>
                        setSetupPlayers(
                          setupPlayers.filter((_, idx) => idx !== i),
                        )
                      }
                      style={{
                        background: "rgba(239,68,68,0.15)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "#ef4444",
                        cursor: "pointer",
                        borderRadius: 6,
                        width: 28,
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 2,
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: 8,
                      padding: 3,
                    }}
                  >
                    {["human", "ai"].map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          const s = [...setupPlayers];
                          s[i] = {
                            ...s[i],
                            type: t,
                            name:
                              t === "ai" && !s[i].name.includes("🤖")
                                ? `🤖 AI ${i + 1}`
                                : s[i].name,
                          };
                          setSetupPlayers(s);
                        }}
                        style={{
                          padding: "5px 14px",
                          borderRadius: 6,
                          fontSize: 11,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          border: "none",
                          background:
                            sp.type === t
                              ? t === "ai"
                                ? "#6366f1"
                                : "#10b981"
                              : "transparent",
                          color: sp.type === t ? "#fff" : S.muted,
                          fontWeight: 600,
                          transition: "all 0.15s",
                        }}
                      >
                        {t === "human" ? "👤 Човек" : "🤖 AI"}
                      </button>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flex: 1,
                      minWidth: 180,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color: S.muted,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Возраст:
                    </span>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      value={sp.age}
                      onChange={(e) => {
                        const s = [...setupPlayers];
                        s[i] = { ...s[i], age: parseInt(e.target.value) };
                        setSetupPlayers(s);
                      }}
                      style={{ flex: 1, accentColor: d.c, height: 4 }}
                    />
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: d.c,
                        minWidth: 22,
                        fontFamily: "'Space Mono', monospace",
                      }}
                    >
                      {sp.age}
                    </span>
                  </div>
                  {sp.type === "ai" && (
                    <span
                      style={{
                        fontSize: 10,
                        color: d.c,
                        fontWeight: 600,
                        background: `${d.c}18`,
                        padding: "3px 8px",
                        borderRadius: 6,
                      }}
                    >
                      {d.e} {d.l}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {setupPlayers.length < 4 && (
            <button
              onClick={() =>
                setSetupPlayers([
                  ...setupPlayers,
                  {
                    name: `Играч ${setupPlayers.length + 1}`,
                    age: 25,
                    type: "human",
                  },
                ])
              }
              style={{
                width: "100%",
                padding: 10,
                background: "transparent",
                border: "1.5px dashed rgba(99,102,241,0.25)",
                borderRadius: 10,
                color: S.accent,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
                marginBottom: 12,
                transition: "all 0.15s",
              }}
            >
              + Додади Играч
            </button>
          )}
          <button
            onClick={startGame}
            style={{
              ...S.btn("linear-gradient(135deg, #6366f1, #4f46e5)"),
              width: "100%",
              padding: "14px 24px",
              fontSize: 15,
              letterSpacing: 1,
              marginTop: 4,
            }}
          >
            Започни Игра 🎲
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // GAME OVER
  // ═══════════════════════════════════════════
  if (screen === "gameOver") {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    return (
      <div
        style={{
          ...S.page,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap');`}</style>
        <div
          style={{
            ...S.card,
            padding: "44px 36px",
            maxWidth: 580,
            width: "100%",
            textAlign: "center",
            maxHeight: "95vh",
            overflow: "auto",
          }}
        >
          <div style={{ fontSize: 52, marginBottom: 10 }}>🏆</div>
          <div
            style={{
              fontSize: 10,
              color: S.accent,
              letterSpacing: 4,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            КРАЈ НА ИГРАТА
          </div>
          <h2 style={{ fontSize: 24, margin: "0 0 6px", fontWeight: 700 }}>
            {message}
          </h2>

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
              margin: "24px 0",
            }}
          >
            {sorted.map((p, i) => (
              <div
                key={i}
                style={{
                  padding: "16px 24px",
                  borderRadius: 14,
                  minWidth: 100,
                  background:
                    i === 0
                      ? "rgba(99,102,241,0.12)"
                      : "rgba(255,255,255,0.03)",
                  border:
                    i === 0
                      ? "1px solid rgba(99,102,241,0.35)"
                      : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                </div>
                <div style={{ fontSize: 11, color: S.muted, marginBottom: 4 }}>
                  {p.type === "ai" ? "🤖 " : ""}
                  {p.name}
                </div>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 28,
                    fontWeight: 700,
                    color: i === 0 ? "#a5b4fc" : "#f1f5f9",
                  }}
                >
                  {p.score}
                </div>
              </div>
            ))}
          </div>

          {endBonuses && (
            <div
              style={{
                marginBottom: 20,
                padding: 16,
                background: "rgba(99,102,241,0.05)",
                borderRadius: 12,
                border: "1px solid rgba(99,102,241,0.15)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: S.accent,
                  fontWeight: 700,
                  marginBottom: 12,
                  letterSpacing: 2,
                }}
              >
                🎖️ БОНУС НАГРАДИ
              </div>
              {endBonuses.longestPlayers.length > 0 && (
                <div
                  style={{
                    marginBottom: 10,
                    padding: 10,
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "#22d3ee",
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    📏 НАЈДОЛГ ЗБОР → +{endBonuses.longestPlayers[0].bonus}{" "}
                    поени
                  </div>
                  {endBonuses.longestPlayers.map((lp, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 12 }}>{lp.name}</span>
                      <span
                        style={{
                          padding: "2px 10px",
                          background: "rgba(34,211,238,0.15)",
                          borderRadius: 6,
                          fontSize: 13,
                          color: "#22d3ee",
                          fontWeight: 700,
                          fontFamily: "'Space Mono', monospace",
                          letterSpacing: 2,
                        }}
                      >
                        {lp.word}
                      </span>
                      <span style={{ color: S.muted, fontSize: 10 }}>
                        ({lp.len} букви)
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {endBonuses.bestScorePlayers.length > 0 && (
                <div
                  style={{
                    padding: 10,
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "#f59e0b",
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    🔥 НАЈМНОГУ ПОЕНИ ВО ПОТЕГ → +
                    {endBonuses.bestScorePlayers[0].bonus} поени
                  </div>
                  {endBonuses.bestScorePlayers.map((bp, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 12 }}>{bp.name}</span>
                      <span
                        style={{
                          padding: "2px 10px",
                          background: "rgba(245,158,11,0.15)",
                          borderRadius: 6,
                          fontSize: 13,
                          color: "#f59e0b",
                          fontWeight: 700,
                        }}
                      >
                        {bp.word}
                      </span>
                      <span style={{ color: S.muted, fontSize: 10 }}>
                        ({bp.score} п.)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div
            style={{
              maxHeight: 100,
              overflow: "auto",
              textAlign: "left",
              background: "rgba(0,0,0,0.2)",
              borderRadius: 10,
              padding: "10px 12px",
              marginBottom: 20,
            }}
          >
            {gameLog.map((e, i) => (
              <div
                key={i}
                style={{
                  color: S.muted,
                  fontSize: 10,
                  marginBottom: 2,
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                {e}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={() => setScreen("setup")}
              style={S.btn("linear-gradient(135deg, #6366f1, #4f46e5)")}
            >
              🔄 Нова Игра
            </button>
            <button
              onClick={() => {
                loadLeaderboard().then(setLeaderboard);
                setScreen("leaderboard");
              }}
              style={S.btnO}
            >
              🏆 Табла
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // WAITING FOR CHALLENGE DECISION (multiplayer)
  // ═══════════════════════════════════════════
  if (screen === "waitingChallenge")
    return (
      <div
        style={{
          ...S.page,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap'); @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        <div
          style={{
            ...S.card,
            padding: "44px 36px",
            maxWidth: 400,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              border: "3px solid rgba(99,102,241,0.2)",
              borderTopColor: "#6366f1",
              borderRadius: "50%",
              margin: "0 auto 20px",
              animation: "spin 1s linear infinite",
            }}
          />
          <div
            style={{
              fontSize: 10,
              color: S.accent,
              letterSpacing: 4,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            ЧЕКА ОДЛУКА
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Противникот одлучува
          </div>
          <div style={{ color: S.muted, fontSize: 13 }}>{message}</div>
        </div>
      </div>
    );

  // ═══════════════════════════════════════════
  // MAIN GAME
  // ═══════════════════════════════════════════
  const cp = players[currentPlayer];

  return (
    <div style={{ ...S.page, padding: "6px 6px 0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap');
        @keyframes aispin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        .board-cell:hover { outline: 2px solid rgba(99,102,241,0.5); outline-offset: -2px; z-index:1; }
        .tile-rack:hover { transform: translateY(-4px) scale(1.05); box-shadow: 0 8px 20px rgba(99,102,241,0.4) !important; }
        .action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 2px; }
      `}</style>

      {/* WORD INFO MODAL */}
      {wordInfoModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1100,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            animation: "fadeIn 0.2s ease",
          }}
          onClick={() => setWordInfoModal(null)}
        >
          <div
            style={{
              ...S.card,
              padding: 28,
              maxWidth: 440,
              width: "100%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 9,
                    color: S.accent,
                    letterSpacing: 3,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  РЕЧНИК
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontFamily: "'Space Mono', monospace",
                    color: "#f1f5f9",
                  }}
                >
                  {wordInfoModal.word}
                </h3>
              </div>
              <button
                onClick={() => setWordInfoModal(null)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  color: S.muted,
                  fontSize: 18,
                  cursor: "pointer",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
            {wordInfoModal.partOfSpeech && (
              <div
                style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  background: "rgba(99,102,241,0.15)",
                  borderRadius: 6,
                  fontSize: 10,
                  color: "#a5b4fc",
                  fontWeight: 600,
                  marginBottom: 14,
                  letterSpacing: 1,
                }}
              >
                {wordInfoModal.partOfSpeech.toUpperCase()}
              </div>
            )}
            {wordInfoModal.definition && (
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 9,
                    color: S.muted,
                    marginBottom: 4,
                    fontWeight: 600,
                    letterSpacing: 2,
                  }}
                >
                  ДЕФИНИЦИЈА
                </div>
                <div
                  style={{ fontSize: 14, lineHeight: 1.6, color: "#e2e8f0" }}
                >
                  {wordInfoModal.definition}
                </div>
              </div>
            )}
            {wordInfoModal.etymology && (
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 9,
                    color: S.muted,
                    marginBottom: 4,
                    fontWeight: 600,
                    letterSpacing: 2,
                  }}
                >
                  ЕТИМОЛОГИЈА
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: S.muted }}>
                  {wordInfoModal.etymology}
                </div>
              </div>
            )}
            {wordInfoModal.examples?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 9,
                    color: S.muted,
                    marginBottom: 4,
                    fontWeight: 600,
                    letterSpacing: 2,
                  }}
                >
                  ПРИМЕРИ
                </div>
                {wordInfoModal.examples.map((ex, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      color: S.muted,
                      fontStyle: "italic",
                      marginBottom: 4,
                      paddingLeft: 8,
                      borderLeft: "2px solid rgba(99,102,241,0.3)",
                    }}
                  >
                    „{ex}"
                  </div>
                ))}
              </div>
            )}
            {wordInfoModal.synonyms?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 9,
                    color: S.muted,
                    marginBottom: 4,
                    fontWeight: 600,
                    letterSpacing: 2,
                  }}
                >
                  СИНОНИМИ
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {wordInfoModal.synonyms.map((s, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "2px 10px",
                        background: "rgba(16,185,129,0.12)",
                        borderRadius: 6,
                        fontSize: 11,
                        color: "#34d399",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {wordInfoModal.relatedWords?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 9,
                    color: S.muted,
                    marginBottom: 4,
                    fontWeight: 600,
                    letterSpacing: 2,
                  }}
                >
                  СРОДНИ
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {wordInfoModal.relatedWords.map((s, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "2px 10px",
                        background: "rgba(99,102,241,0.12)",
                        borderRadius: 6,
                        fontSize: 11,
                        color: "#a5b4fc",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {wordInfoModal.funFact && (
              <div
                style={{
                  padding: 12,
                  background: "rgba(245,158,11,0.08)",
                  borderRadius: 10,
                  border: "1px solid rgba(245,158,11,0.15)",
                  marginTop: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: "#f59e0b",
                    marginBottom: 3,
                    letterSpacing: 2,
                  }}
                >
                  💡 ИНТЕРЕСНО
                </div>
                <div style={{ fontSize: 12, color: "#fcd34d" }}>
                  {wordInfoModal.funFact}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* JOKER MODAL */}
      {jokerModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ ...S.card, padding: 28, maxWidth: 400 }}>
            <div
              style={{
                fontSize: 9,
                color: S.accent,
                letterSpacing: 3,
                fontWeight: 600,
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              ЏОКЕР
            </div>
            <h3
              style={{
                color: "#f1f5f9",
                margin: "0 0 18px",
                textAlign: "center",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              Избери буква
            </h3>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
                justifyContent: "center",
              }}
            >
              {MK_LETTERS.split("").map((l) => (
                <button
                  key={l}
                  onClick={() => assignJoker(l)}
                  style={{
                    width: 36,
                    height: 36,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    color: "#f1f5f9",
                    transition: "all 0.1s",
                  }}
                  onMouseOver={(e) =>
                    (e.target.style.background = "rgba(99,102,241,0.3)")
                  }
                  onMouseOut={(e) =>
                    (e.target.style.background = "rgba(255,255,255,0.06)")
                  }
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SCOREBOARD */}
      {(() => {
        const isChallenge = screen === "challenge";
        const decidingPlayers = isChallenge
          ? players
              .map((p, i) => i !== currentPlayer && p.type === "human")
              .map((v, i) => (v ? i : -1))
              .filter((i) => i >= 0)
          : [currentPlayer];
        return (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 6,
              marginBottom: 4,
              flexWrap: "wrap",
              padding: "0 4px",
            }}
          >
            {players.map((p, i) => {
              const isActive = decidingPlayers.includes(i);
              const isCurrentTurn = i === currentPlayer && !isChallenge;
              const highlighted = isActive || isCurrentTurn;
              return (
                <div
                  key={i}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: highlighted
                      ? "rgba(99,102,241,0.1)"
                      : "rgba(255,255,255,0.03)",
                    border: highlighted
                      ? "1px solid rgba(99,102,241,0.35)"
                      : "1px solid rgba(255,255,255,0.05)",
                    transition: "all 0.2s",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: highlighted ? "#a5b4fc" : S.muted,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {p.type === "ai" ? "🤖" : "👤"} {p.name}
                      {p.skipPenalty && (
                        <span
                          style={{
                            fontSize: 9,
                            background: "rgba(239,68,68,0.2)",
                            color: "#ef4444",
                            padding: "1px 5px",
                            borderRadius: 4,
                          }}
                        >
                          пропушта
                        </span>
                      )}
                      {isCurrentTurn && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#10b981",
                            display: "inline-block",
                          }}
                        />
                      )}
                      {isChallenge && isActive && (
                        <span style={{ fontSize: 9, color: "#f59e0b" }}>
                          ⚖️
                        </span>
                      )}
                    </div>
                    <div
                      style={{ fontSize: 9, color: "#334155", marginTop: 1 }}
                    >
                      в.{p.age}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 20,
                      fontWeight: 700,
                      color: highlighted ? "#a5b4fc" : "#64748b",
                    }}
                  >
                    {p.score}
                  </div>
                </div>
              );
            })}
            <div
              style={{
                padding: "6px 12px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 10,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 8, color: "#334155", marginBottom: 2 }}>
                КЕСА
              </div>
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#475569",
                }}
              >
                {tileBag.length}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MESSAGE BAR */}
      <div
        style={{
          textAlign: "center",
          padding: "4px 16px",
          fontSize: 12,
          margin: "0 auto 4px",
          background: "rgba(99,102,241,0.06)",
          borderRadius: 8,
          minHeight: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          border: "1px solid rgba(99,102,241,0.1)",
        }}
      >
        {isAIThinking && (
          <span
            style={{
              display: "inline-block",
              animation: "aispin 1s linear infinite",
              marginRight: 6,
            }}
          >
            🤖
          </span>
        )}
        {message}
      </div>

      {/* BOARD */}
      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}
      >
        <div
          style={{
            display: "inline-grid",
            gridTemplateColumns: "repeat(15, 37px)",
            gridTemplateRows: "repeat(15, 37px)",
            gap: 2,
            background: "#0a0e1a",
            padding: 6,
            borderRadius: 12,
            border: "1px solid rgba(99,102,241,0.12)",
          }}
        >
          {Array(15)
            .fill(null)
            .map((_, row) =>
              Array(15)
                .fill(null)
                .map((_, col) => {
                  const cell = board[row][col];
                  const bonus = BONUS_MAP[row][col];
                  const isPlaced = placedTiles.some(
                    (p) => p.row === row && p.col === col,
                  );
                  const bi = BONUS_COLORS_NEW[bonus];
                  if (cell)
                    return (
                      <div
                        key={`${row}-${col}`}
                        className="board-cell"
                        onClick={() =>
                          isPlaced && cp?.type === "human" && isMyTurn
                            ? removePlacedTile(row, col)
                            : null
                        }
                        style={{
                          width: 35,
                          height: 35,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          background: isPlaced
                            ? "linear-gradient(135deg, #fafafa, #f0f4ff)"
                            : "linear-gradient(160deg, #f8fafc, #e2e8f0)",
                          border: isPlaced
                            ? "2px solid #6366f1"
                            : "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 14,
                          color: "#0f172a",
                          cursor:
                            isPlaced && cp?.type === "human" && isMyTurn
                              ? "pointer"
                              : "default",
                          fontFamily: "inherit",
                          boxShadow: isPlaced
                            ? "0 0 10px rgba(99,102,241,0.3), 0 2px 8px rgba(0,0,0,0.3)"
                            : "0 2px 4px rgba(0,0,0,0.2)",
                        }}
                      >
                        {cell.displayLetter || cell.letter}
                        <span
                          style={{
                            position: "absolute",
                            bottom: 1,
                            right: 2,
                            fontSize: 6,
                            color: "#94a3b8",
                            fontFamily: "'Space Mono', monospace",
                          }}
                        >
                          {cell.letter === "★" ? "" : cell.points}
                        </span>
                      </div>
                    );
                  return (
                    <div
                      key={`${row}-${col}`}
                      className="board-cell"
                      onClick={() =>
                        selectedTile && cp?.type === "human"
                          ? placeTileOnBoard(row, col)
                          : null
                      }
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropOnBoard(e, row, col)}
                      style={{
                        width: 35,
                        height: 35,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: bi ? bi.bg : "#0f1520",
                        border: bi
                          ? `1px solid ${bi.glow}30`
                          : "1px solid rgba(255,255,255,0.03)",
                        borderRadius: 6,
                        cursor:
                          selectedTile || draggedTile ? "pointer" : "default",
                        boxShadow: bi ? `inset 0 0 8px ${bi.glow}20` : "none",
                      }}
                    >
                      <span
                        style={{
                          fontSize: bonus === "ST" ? 13 : 7,
                          color: bi ? `${bi.glow}` : "transparent",
                          fontWeight: 800,
                          fontFamily: "'DM Sans', sans-serif",
                          letterSpacing: 0,
                        }}
                      >
                        {bi?.label || ""}
                      </span>
                    </div>
                  );
                }),
            )}
        </div>
      </div>

      {/* FORMED WORDS PREVIEW */}
      {formedWords.length > 0 && screen === "playing" && (
        <div
          style={{
            textAlign: "center",
            margin: "0 auto 4px",
            padding: "6px 14px",
            background: "rgba(16,185,129,0.08)",
            borderRadius: 8,
            border: "1px solid rgba(16,185,129,0.2)",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 6,
              justifyContent: "center",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {formedWords.map((w, i) => (
              <span
                key={i}
                style={{
                  padding: "2px 10px",
                  background: "rgba(16,185,129,0.15)",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "#34d399",
                  fontWeight: 700,
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                {w.word}
              </span>
            ))}
            <span
              style={{
                color: "#10b981",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
              }}
            >
              +{turnScore}
            </span>
            {formedWords.length > 1 && (
              <span style={{ color: S.muted, fontSize: 10 }}>
                ({formedWords.length} зборови)
              </span>
            )}
          </div>
        </div>
      )}

      {/* AI MOVE DISPLAY */}
      {aiMoveDisplay && (
        <div
          style={{
            textAlign: "center",
            margin: "0 auto 4px",
            padding: "6px 14px",
            background: "rgba(99,102,241,0.08)",
            borderRadius: 8,
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          <div style={{ color: "#a5b4fc", fontSize: 12 }}>
            🤖{" "}
            <strong style={{ fontFamily: "'Space Mono', monospace" }}>
              {aiMoveDisplay.words}
            </strong>{" "}
            <span style={{ color: "#6366f1" }}>+{aiMoveDisplay.score}</span>
          </div>
          {aiMoveDisplay.explanation && (
            <div style={{ color: S.muted, fontSize: 10, marginTop: 2 }}>
              {aiMoveDisplay.explanation}
            </div>
          )}
        </div>
      )}

      {/* CHALLENGE PANEL */}
      {screen === "challenge" &&
        (() => {
          const opponents = players.filter(
            (p, i) => i !== currentPlayer && p.type === "human",
          );
          const opponentNames = opponents.map((o) => o.name).join(", ");
          return (
            <div
              style={{
                margin: "0 auto 4px",
                padding: 16,
                background: "rgba(245,158,11,0.06)",
                borderRadius: 12,
                border: "1px solid rgba(245,158,11,0.2)",
                animation: "fadeIn 0.2s ease",
              }}
            >
              {!challengeResult && !isValidating && (
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#f59e0b",
                      fontWeight: 700,
                      marginBottom: 4,
                      letterSpacing: 2,
                    }}
                  >
                    ⚖️ ОДЛУКА — {opponentNames}
                  </div>
                  <div
                    style={{ fontSize: 11, color: S.muted, marginBottom: 12 }}
                  >
                    {players[currentPlayer].name} постави зборови. Прифати или
                    предизвикај:
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      justifyContent: "center",
                      flexWrap: "wrap",
                      marginBottom: 12,
                    }}
                  >
                    {formedWords.map((w, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          borderRadius: 8,
                          overflow: "hidden",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        }}
                      >
                        <span
                          style={{
                            padding: "6px 12px",
                            background: "rgba(16,185,129,0.15)",
                            fontSize: 13,
                            color: "#34d399",
                            fontWeight: 700,
                            fontFamily: "'Space Mono', monospace",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {w.word}
                        </span>
                        <button
                          onClick={() => requestWordInfo(w.word)}
                          style={{
                            ...S.btnSm("rgba(99,102,241,0.2)"),
                            borderRadius: 0,
                            color: "#a5b4fc",
                            padding: "6px 8px",
                          }}
                          title="Инфо"
                        >
                          📖
                        </button>
                        <button
                          onClick={() => challengeWord(w.word)}
                          style={{
                            ...S.btnSm("rgba(239,68,68,0.6)"),
                            borderRadius: 0,
                            padding: "6px 10px",
                            color: "#fff",
                          }}
                        >
                          🔍
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => finalizeTurn()}
                    style={{
                      ...S.btn("linear-gradient(135deg, #10b981, #059669)"),
                      transition: "all 0.2s",
                    }}
                  >
                    ✅ Прифати ({turnScore} п.)
                  </button>
                  {isLoadingInfo && (
                    <div
                      style={{ color: "#a5b4fc", fontSize: 11, marginTop: 8 }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          animation: "aispin 1s linear infinite",
                          marginRight: 4,
                        }}
                      >
                        📖
                      </span>
                      Се вчитува...
                    </div>
                  )}
                </div>
              )}
              {isValidating && (
                <div
                  style={{
                    textAlign: "center",
                    color: "#a5b4fc",
                    fontSize: 12,
                    padding: "8px 0",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      animation: "aispin 1s linear infinite",
                      marginRight: 6,
                    }}
                  >
                    🤖
                  </span>
                  Агент пребарува во МК речници...
                </div>
              )}
              {challengeResult && (
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      marginBottom: 12,
                      background: "rgba(0,0,0,0.25)",
                      border: `1px solid ${challengeResult.valid ? "rgba(16,185,129,0.3)" : challengeResult.valid === false ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`,
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 4 }}>
                      {challengeResult.valid
                        ? "✅"
                        : challengeResult.valid === false
                          ? "❌"
                          : "⚠️"}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: "'Space Mono', monospace",
                        color: challengeResult.valid
                          ? "#34d399"
                          : challengeResult.valid === false
                            ? "#f87171"
                            : "#fbbf24",
                        marginBottom: 4,
                      }}
                    >
                      {challengeResult.word}
                    </div>
                    <div style={{ fontSize: 11, color: S.muted }}>
                      {challengeResult.explanation}
                    </div>
                    {challengeResult.definition && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          fontStyle: "italic",
                          marginTop: 4,
                        }}
                      >
                        📖 {challengeResult.definition}
                      </div>
                    )}
                    {challengeResult.valid === true && (
                      <div
                        style={{
                          fontSize: 10,
                          color: "#f59e0b",
                          marginTop: 6,
                          fontWeight: 600,
                        }}
                      >
                        ⚠️ {opponentNames} го губи следниот ред!
                      </div>
                    )}
                    {challengeResult.valid === false && (
                      <div
                        style={{
                          fontSize: 10,
                          color: "#f87171",
                          marginTop: 6,
                          fontWeight: 600,
                        }}
                      >
                        ✅ Успешен предизвик! Плочките се вратени.
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {challengeResult.valid === true && (
                      <>
                        <button
                          onClick={() => {
                            showingChallengeResultRef.current = false;
                            setChallengeResult(null);
                            setScreen("playing");
                          }}
                          style={S.btn(
                            "linear-gradient(135deg, #10b981, #059669)",
                          )}
                        >
                          Продолжи
                        </button>
                        <button
                          onClick={() => requestWordInfo(challengeResult.word)}
                          style={S.btnO}
                        >
                          📖 Инфо
                        </button>
                      </>
                    )}
                    {challengeResult.valid === false && (
                      <>
                        <button
                          onClick={() => {
                            showingChallengeResultRef.current = false;
                            setChallengeResult(null);
                            setScreen("playing");
                          }}
                          style={S.btn(
                            "linear-gradient(135deg, #f59e0b, #d97706)",
                          )}
                        >
                          🔄 Врати плочки
                        </button>
                      </>
                    )}
                    {challengeResult.valid === null && (
                      <>
                        <button
                          onClick={() => {
                            showingChallengeResultRef.current = false;
                            setChallengeResult(null);
                            setScreen("playing");
                          }}
                          style={S.btn(
                            "linear-gradient(135deg, #10b981, #059669)",
                          )}
                        >
                          Прифати
                        </button>
                        <button
                          onClick={() => {
                            setChallengeResult(null);
                            setScreen("playing");
                            setMessage(
                              `${players[currentPlayer].name} — пробај повторно!`,
                            );
                          }}
                          style={S.btn(
                            "linear-gradient(135deg, #f59e0b, #d97706)",
                          )}
                        >
                          🔄 Врати
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      {/* PLAYER RACK */}
      {screen === "playing" &&
        cp?.type === "human" &&
        !isAIThinking &&
        isMyTurn && (
          <div style={{ margin: "0 auto" }}>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDropOnRack}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                padding: "8px 14px",
                background: "rgba(20,25,39,0.95)",
                border: "1px solid rgba(99,102,241,0.15)",
                borderRadius: 12,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  color: "#334155",
                  fontSize: 9,
                  marginRight: 4,
                  minWidth: 50,
                  fontWeight: 600,
                  letterSpacing: 1,
                }}
              >
                {(
                  players[myPlayerIndex] ?? players[currentPlayer]
                )?.name?.toUpperCase()}
              </div>
              {(players[myPlayerIndex] ?? players[currentPlayer])?.rack?.map(
                (tile, i) => (
                  <div
                    key={tile.id}
                    className="tile-rack"
                    draggable
                    onDragStart={(e) => handleDragStart(e, tile, i)}
                    onDragEnd={() => setDraggedTile(null)}
                    onClick={() => selectTile(tile, i)}
                    style={{
                      ...tileStyle(
                        tile,
                        selectedTile?.id === tile.id,
                        draggedTile?.id === tile.id,
                      ),
                      transition: "all 0.15s ease",
                    }}
                  >
                    {getDisplayLetter(tile)}
                    <span
                      style={{
                        position: "absolute",
                        bottom: 1,
                        right: 2,
                        fontSize: 7,
                        color:
                          selectedTile?.id === tile.id
                            ? "rgba(255,255,255,0.7)"
                            : "#94a3b8",
                        fontFamily: "'Space Mono', monospace",
                      }}
                    >
                      {tile.letter === "★" ? "" : tile.points}
                    </span>
                  </div>
                ),
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                justifyContent: "center",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {placedTiles.length > 0 && (
                <button
                  className="action-btn"
                  onClick={confirmPlacement}
                  style={{
                    ...S.btn("linear-gradient(135deg, #10b981, #059669)"),
                    transition: "all 0.15s",
                  }}
                >
                  ✓ Потврди{" "}
                  <span style={{ fontFamily: "'Space Mono', monospace" }}>
                    +{turnScore}
                  </span>
                </button>
              )}
              <button
                className="action-btn"
                onClick={passTurn}
                style={{ ...S.btnO, transition: "all 0.15s" }}
              >
                Пас
              </button>
              {placedTiles.length === 0 && (
                <button
                  className="action-btn"
                  onClick={exchangeTiles}
                  disabled={cp.score < 5}
                  style={{
                    ...S.btnO,
                    opacity: cp.score < 5 ? 0.3 : 1,
                    cursor: cp.score < 5 ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                    borderColor:
                      cp.score < 5 ? "rgba(255,255,255,0.08)" : undefined,
                  }}
                  title={
                    cp.score < 5 ? "Потребни се 5 поени" : "Замени (-5 п.)"
                  }
                >
                  🔄 Замени{" "}
                  <span style={{ fontSize: 10, opacity: 0.7 }}>−5п</span>
                </button>
              )}
              {placedTiles.length > 0 && (
                <span
                  style={{ fontSize: 9, color: "#334155", fontStyle: "italic" }}
                >
                  Замена само пред поставување
                </span>
              )}
            </div>
          </div>
        )}

      {/* GAME LOG */}
      {gameLog.length > 0 && (
        <div
          style={{
            margin: "6px auto 0",
            padding: "6px 10px",
            background: "rgba(0,0,0,0.2)",
            borderRadius: 8,
            maxHeight: 60,
            overflow: "auto",
          }}
        >
          {gameLog.slice(-6).map((e, i) => (
            <div
              key={i}
              style={{
                color: "#334155",
                fontSize: 9,
                fontFamily: "'Space Mono', monospace",
                marginBottom: 1,
              }}
            >
              {e}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
