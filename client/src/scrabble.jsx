import { useState, useCallback, useEffect, useRef } from "react";
import * as Tone from "tone";

// ═══════════════════════════════════════════
// SOUND SYSTEM
// ═══════════════════════════════════════════
let audioStarted = false;
async function ensureAudio() {
  if (!audioStarted) { await Tone.start(); audioStarted = true; }
}

const SFX = {
  tilePickup: () => {
    ensureAudio();
    const synth = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.05 }, volume: -12 }).toDestination();
    synth.triggerAttackRelease('C5', '0.04'); setTimeout(() => synth.dispose(), 200);
  },
  tileDrop: () => {
    ensureAudio();
    const synth = new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 2, envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }, volume: -8 }).toDestination();
    synth.triggerAttackRelease('G2', '0.1'); setTimeout(() => synth.dispose(), 300);
  },
  tileReturn: () => {
    ensureAudio();
    const synth = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.12, sustain: 0, release: 0.05 }, volume: -14 }).toDestination();
    synth.triggerAttackRelease('E4', '0.06'); setTimeout(() => synth.dispose(), 200);
  },
  bonusDL: () => {
    ensureAudio();
    const synth = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.15, sustain: 0.05, release: 0.1 }, volume: -8 }).toDestination();
    synth.triggerAttackRelease('E5', '0.12'); setTimeout(() => synth.dispose(), 300);
  },
  bonusTL: () => {
    ensureAudio();
    const synth = new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.05, release: 0.1 }, volume: -10 }).toDestination();
    synth.triggerAttackRelease('A5', '0.15'); setTimeout(() => synth.dispose(), 400);
  },
  bonusDW: () => {
    ensureAudio();
    const synth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.25, sustain: 0.05, release: 0.15 }, volume: -8 }).toDestination();
    synth.triggerAttackRelease(['C5', 'E5'], '0.15'); setTimeout(() => synth.dispose(), 500);
  },
  bonusTW: () => {
    ensureAudio();
    const synth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.08, release: 0.2 }, volume: -8 }).toDestination();
    synth.triggerAttackRelease(['C5', 'E5', 'G5'], '0.2'); setTimeout(() => synth.dispose(), 600);
  },
  wordSuccess: () => {
    ensureAudio();
    const synth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.3 }, volume: -6 }).toDestination();
    const now = Tone.now();
    synth.triggerAttackRelease('C5', '0.15', now);
    synth.triggerAttackRelease('E5', '0.15', now + 0.1);
    synth.triggerAttackRelease('G5', '0.15', now + 0.2);
    synth.triggerAttackRelease('C6', '0.3', now + 0.3);
    setTimeout(() => synth.dispose(), 1200);
  },
  challengeValid: () => {
    ensureAudio();
    const synth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.05, release: 0.15 }, volume: -10 }).toDestination();
    const now = Tone.now();
    synth.triggerAttackRelease('G4', '0.1', now);
    synth.triggerAttackRelease('C5', '0.2', now + 0.12);
    setTimeout(() => synth.dispose(), 600);
  },
  challengeInvalid: () => {
    ensureAudio();
    const synth = new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.2 }, volume: -8 }).toDestination();
    const now = Tone.now();
    synth.triggerAttackRelease('E4', '0.15', now);
    synth.triggerAttackRelease('Bb3', '0.3', now + 0.15);
    setTimeout(() => synth.dispose(), 800);
  },
  gameOver: () => {
    ensureAudio();
    const synth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.03, decay: 0.4, sustain: 0.15, release: 0.5 }, volume: -4 }).toDestination();
    const now = Tone.now();
    synth.triggerAttackRelease(['C4', 'E4', 'G4'], '0.3', now);
    synth.triggerAttackRelease(['C4', 'F4', 'A4'], '0.3', now + 0.35);
    synth.triggerAttackRelease(['C4', 'E4', 'G4'], '0.3', now + 0.7);
    synth.triggerAttackRelease(['C5', 'E5', 'G5'], '0.6', now + 1.05);
    setTimeout(() => synth.dispose(), 2500);
  },
  bonusAwarded: () => {
    ensureAudio();
    const synth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.02, decay: 0.2, sustain: 0.1, release: 0.2 }, volume: -6 }).toDestination();
    const now = Tone.now();
    synth.triggerAttackRelease('E5', '0.1', now);
    synth.triggerAttackRelease('G5', '0.1', now + 0.08);
    synth.triggerAttackRelease('B5', '0.1', now + 0.16);
    synth.triggerAttackRelease('E6', '0.25', now + 0.24);
    setTimeout(() => synth.dispose(), 800);
  },
};

function playBonusSound(row, col) {
  const b = BONUS_MAP[row]?.[col];
  if (b === 'TW') SFX.bonusTW();
  else if (b === 'TL') SFX.bonusTL();
  else if (b === 'DW' || b === 'ST') SFX.bonusDW();
  else if (b === 'DL') SFX.bonusDL();
  else SFX.tileDrop();
}

// ═══════════════════════════════════════════
// MACEDONIAN SCRABBLE - ПОЛНО ИЗДАНИЕ
// Drag & Drop, Речник валидација, Инфо за зборови
// ═══════════════════════════════════════════

const TILE_CONFIG = {
  '★': { count: 2, points: 0 },
  'А': { count: 9, points: 1 }, 'Е': { count: 6, points: 1 },
  'И': { count: 7, points: 2 }, 'О': { count: 7, points: 2 }, 'Н': { count: 6, points: 2 }, 'Р': { count: 6, points: 2 },
  'С': { count: 5, points: 3 }, 'Т': { count: 5, points: 3 }, 'У': { count: 4, points: 3 },
  'В': { count: 4, points: 4 }, 'К': { count: 4, points: 4 }, 'Л': { count: 4, points: 4 },
  'П': { count: 3, points: 5 },
  'Г': { count: 2, points: 6 }, 'Д': { count: 3, points: 6 }, 'М': { count: 3, points: 6 },
  'Б': { count: 2, points: 7 }, 'З': { count: 2, points: 7 }, 'Ј': { count: 2, points: 7 },
  'Ц': { count: 2, points: 8 }, 'Ч': { count: 2, points: 8 },
  'Ж': { count: 1, points: 9 }, 'Ф': { count: 1, points: 9 }, 'Ш': { count: 1, points: 9 },
  'Ѓ': { count: 1, points: 10 }, 'Ѕ': { count: 1, points: 10 }, 'Љ': { count: 1, points: 10 },
  'Њ': { count: 1, points: 10 }, 'Ќ': { count: 1, points: 10 }, 'Џ': { count: 1, points: 10 }, 'Х': { count: 1, points: 10 },
};
const MK_LETTERS = 'АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШ';
const getPoints = (l) => (!l || l === '★') ? 0 : (TILE_CONFIG[l]?.points ?? 0);

const BONUS_MAP = [
  ['','','','TW','','','TL','','TL','','','TW','','',''],
  ['','','DL','','','DW','','','','DW','','','DL','',''],
  ['','DL','','','DL','','','','','','DL','','','DL',''],
  ['TW','','','TL','','','','DW','','','','TL','','','TW'],
  ['','','DL','','','','DL','','DL','','','','DL','',''],
  ['','DW','','','','TL','','','','TL','','','','DW',''],
  ['TL','','','','DL','','','','','','DL','','','','TL'],
  ['','','','DW','','','','ST','','','','DW','','',''],
  ['TL','','','','DL','','','','','','DL','','','','TL'],
  ['','DW','','','','TL','','','','TL','','','','DW',''],
  ['','','DL','','','','DL','','DL','','','','DL','',''],
  ['TW','','','TL','','','','DW','','','','TL','','','TW'],
  ['','DL','','','DL','','','','','','DL','','','DL',''],
  ['','','DL','','','DW','','','','DW','','','DL','',''],
  ['','','','TW','','','TL','','TL','','','TW','','',''],
];
const BONUS_COLORS = {
  'TW': { bg: '#c0392b', label: 'ТЗ' }, 'TL': { bg: '#2980b9', label: 'ТБ' },
  'DW': { bg: '#e67e22', label: 'ДЗ' }, 'DL': { bg: '#27ae60', label: 'ДБ' },
  'ST': { bg: '#e67e22', label: '★' },
};

function createTileBag() {
  const bag = [];
  for (const [letter, config] of Object.entries(TILE_CONFIG)) {
    for (let i = 0; i < config.count; i++) bag.push({ letter, points: config.points, id: `${letter}-${i}-${Math.random().toString(36).slice(2,6)}` });
  }
  for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
  return bag;
}
function drawTiles(bag, count) { return bag.splice(0, Math.min(count, bag.length)); }
function createEmptyBoard() { return Array(15).fill(null).map(() => Array(15).fill(null)); }

// ═══════════════════════════════════════════
// AI WORD VALIDATION — Дигитален Речник
// ═══════════════════════════════════════════
async function validateWordWithAI(word) {
  try {
    const res = await fetch("/api/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word })
    });

    console.log('Response status:', res.status);
    const data = await res.json();
    console.log('Response data:', data);

    return {
      valid: data.valid ?? null,
      explanation: data.valid
        ? `Зборот "${word}" е валиден македонски збор.`
        : `Зборот "${word}" не е пронајден во речникот.`,
      definition: data.definition || "",
      source: "Македонски.гов.мк"
    };
  } catch (err) {
    console.error('validateWordWithAI error:', err);
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
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 1500,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: `Дај детални информации за македонскиот збор "${word}". 

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
}` }],
      })
    });
    const data = await response.json();
    const text = data.content?.map(item => item.type === "text" ? item.text : "").filter(Boolean).join("\n") || "";
    const jsonMatch = text.replace(/```json|```/g, "").match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { word, definition: "Не се пронајдени информации.", partOfSpeech: "", etymology: "", examples: [], synonyms: [], relatedWords: [], funFact: "" };
  } catch { return { word, definition: "Грешка при пребарување.", partOfSpeech: "", etymology: "", examples: [], synonyms: [], relatedWords: [], funFact: "" }; }
}

// ═══════════════════════════════════════════
// AI PLAYER MOVE GENERATION
// ═══════════════════════════════════════════
function boardToText(bs) {
  let t = '   '; for (let c = 0; c < 15; c++) t += String(c).padStart(3); t += '\n';
  for (let r = 0; r < 15; r++) { t += String(r).padStart(2) + ' '; for (let c = 0; c < 15; c++) { const cell = bs[r][c]; t += (cell ? (cell.displayLetter || cell.letter) : '.').padStart(3); } t += '\n'; }
  return t;
}
function getAIDifficultyPrompt(age) {
  if (age <= 8) return `Играш со дете од ${age} год. Користи МНОГУ кратки ЛИТЕРАТУРНИ зборови (2-3 букви): ОД, НА, ДА, НЕ, ОКО, ДЕН, СОН, НОС, ДОМ, СОЛ, МИР, ЛЕТ, ВОЗ, РОД, ТОН, ЛОВ, ВОЛ, СОК. Понекогаш направи грешка.`;
  if (age <= 12) return `Играш со дете од ${age} год. Користи едноставни ЛИТЕРАТУРНИ зборови (3-5 букви): МОСТ, РЕКА, СЕЛО, ЛЕТО, ПОЛЕ, ВОДА, ДРВО, НОГА, РАКА, КНИГА, МАСА, КУЌА, СОНЦЕ.`;
  if (age <= 17) return `Играш со тинејџер од ${age} год. Користи средно-тешки ЛИТЕРАТУРНИ зборови (4-7 букви): ПОБЕДА, ПРОЛЕТ, ШКОЛО, КАМЕН, ПЕСНА, ЈУНАК, ДРЖАВА, ПРИРОДА.`;
  return `Играш со возрасен. Користи сложени ЛИТЕРАТУРНИ зборови. Искористи бонус полиња. Максимални поени.`;
}
async function generateAIMove(boardState, rack, isFirstMove, age) {
  const rackLetters = rack.map(t => t.letter === '★' ? 'ЏОКЕР' : t.letter).join(', ');
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: `Ти си AI играч во Македонски Скрабл. ${getAIDifficultyPrompt(age)}

ВАЖНО: Користи САМО зборови кои постојат во македонски литературен јазик (речник). Пребарај ако не си сигурен.

Табла (. = празно):
${boardToText(boardState)}

Твои плочки: ${rackLetters}
${isFirstMove ? 'ПРВО поставување - МОРА да покрие (7,7).' : 'МОРА да се поврзе со постоечки букви.'}

Одговори САМО со JSON:
{"word":"ЗБОР","placements":[{"row":7,"col":5,"letter":"З"}],"joker_as":null,"explanation":"објаснување"}

placements = САМО нови плочки. Ако не можеш: {"word":null,"pass":true}` }],
      })
    });
    const data = await response.json();
    const text = data.content?.map(item => item.type === "text" ? item.text : "").filter(Boolean).join("\n") || "";
    const jsonMatch = text.replace(/```json|```/g, "").match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { word: null, pass: true };
  } catch { return { word: null, pass: true }; }
}

// ═══════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════
async function loadLeaderboard() { try { const r = await window.storage.get('mk-scrabble-lb'); return r ? JSON.parse(r.value) : []; } catch { return []; } }
async function saveLeaderboard(data) { try { await window.storage.set('mk-scrabble-lb', JSON.stringify(data)); } catch {} }
async function updateLeaderboard(name, score, won, age) {
  const lb = await loadLeaderboard();
  let e = lb.find(x => x.name === name);
  if (!e) { e = { name, age, bestScore: 0, totalGames: 0, wins: 0, totalScore: 0 }; lb.push(e); }
  e.totalGames++; e.totalScore += score; e.age = age; if (won) e.wins++;
  if (score > e.bestScore) e.bestScore = score;
  e.avgScore = Math.round(e.totalScore / e.totalGames);
  e.lastPlayed = new Date().toISOString();
  lb.sort((a, b) => b.bestScore - a.bestScore);
  await saveLeaderboard(lb); return lb;
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════
export default function MacedonianScrabble({ initialGameState, user, onLeave } = {}) {
  const hasServerGame = !!initialGameState;

  const [screen, setScreen] = useState(() => {
    if (!initialGameState) return 'home';
    if (initialGameState.status === 'gameOver') return 'gameOver';
    return 'playing';
  });
  const [board, setBoard] = useState(() => initialGameState?.board ?? createEmptyBoard());
  const [confirmedBoard, setConfirmedBoard] = useState(() => initialGameState?.confirmedBoard ?? createEmptyBoard());
  const [tileBag, setTileBag] = useState(() => initialGameState?.tileBag ?? []);
  const [players, setPlayers] = useState(() =>
    (initialGameState?.players ?? []).map(p => ({ ...p, name: p.displayName || p.name || 'Играч' }))
  );
  const [currentPlayer, setCurrentPlayer] = useState(() => initialGameState?.currentPlayerIndex ?? 0);
  const [selectedTile, setSelectedTile] = useState(null);
  const [placedTiles, setPlacedTiles] = useState([]);
  const [turnScore, setTurnScore] = useState(0);
  const [formedWords, setFormedWords] = useState([]);
  const [message, setMessage] = useState(() => {
    if (!initialGameState?.players?.length) return '';
    const cp = initialGameState.players[initialGameState.currentPlayerIndex ?? 0];
    return cp ? `${cp.displayName || cp.name} — твој ред!` : '';
  });
  const [challengeResult, setChallengeResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [jokerModal, setJokerModal] = useState(null);
  const [jokerAssignments, setJokerAssignments] = useState(() => initialGameState?.jokerAssignments ?? {});
  const [consecutivePasses, setConsecutivePasses] = useState(() => initialGameState?.consecutivePasses ?? 0);
  const [gameLog, setGameLog] = useState(() => initialGameState?.gameLog ?? []);
  const [isFirstMove, setIsFirstMove] = useState(() => initialGameState?.isFirstMove ?? true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiMoveDisplay, setAiMoveDisplay] = useState(null);
  const [wordInfoModal, setWordInfoModal] = useState(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [draggedTile, setDraggedTile] = useState(null);
  const [wordRecords, setWordRecords] = useState({}); // { playerIdx: { longestWord, longestLen, bestWord, bestScore } }
  const [endBonuses, setEndBonuses] = useState(null); // shown at game over
  const [setupPlayers, setSetupPlayers] = useState([
    { name: 'Играч 1', age: 25, type: 'human' },
    { name: 'Играч 2', age: 25, type: 'human' },
  ]);

  // Which slot is the logged-in user? Compare as strings to handle ObjectId vs string.
  const myPlayerIndex = hasServerGame
    ? (initialGameState?.players ?? []).findIndex(p => {
        if (!p.userId) return false;
        const uid = user?._id ?? user?.id ?? '';
        return p.userId.toString() === uid.toString();
      })
    : currentPlayer;

  // Only allow interaction when it's this user's turn
  const isMyTurn = !hasServerGame || (myPlayerIndex !== -1 && myPlayerIndex === currentPlayer);
  // DEBUG — remove after confirming correct
  if (hasServerGame) console.log('myPlayerIndex:', myPlayerIndex, 'currentPlayer:', currentPlayer, 'isMyTurn:', isMyTurn, 'userId:', user?._id ?? user?.id, 'players userIds:', (initialGameState?.players??[]).map(p=>p.userId));

  // Stable refs so polling closure always reads current values
  const gameIdRef = useRef(initialGameState?.gameId ?? null);
  const isMyTurnRef = useRef(false);
  const placedTilesRef = useRef([]);
  const screenRef = useRef(screen);

  useEffect(() => { loadLeaderboard().then(setLeaderboard); }, []);

  // Trigger AI move on mount if it's AI's turn from the start
  useEffect(() => {
    if (!hasServerGame) return;
    const cp = initialGameState?.players?.[initialGameState?.currentPlayerIndex ?? 0];
    if (cp?.type === 'ai') {
      const conf = initialGameState.confirmedBoard ?? createEmptyBoard();
      setTimeout(() => triggerAIMove(
        (initialGameState.players ?? []).map(p => ({ ...p, name: p.displayName || p.name || 'Играч' })),
        initialGameState.currentPlayerIndex ?? 0,
        conf,
        initialGameState.tileBag ?? [],
        initialGameState.isFirstMove ?? true,
        conf
      ), 800);
    }
  }, []);

  // Keep refs in sync with state
  useEffect(() => { isMyTurnRef.current = isMyTurn; }, [isMyTurn]);
  useEffect(() => { placedTilesRef.current = placedTiles; }, [placedTiles]);
  useEffect(() => { screenRef.current = screen; }, [screen]);

  // Poll for updates — always runs in multiplayer, applies state when it changes
  useEffect(() => {
    if (!hasServerGame || !gameIdRef.current) return;

    const applyServerState = (s) => {
      const normalizedPlayers = (s.players ?? []).map(p => ({
        ...p, name: p.displayName || p.name || 'Играч'
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
      if (s.status === 'gameOver') { setScreen('gameOver'); return; }

      // Determine my index from the live players list
      const myUid = user?._id ?? user?.id ?? '';
      const myIdx = normalizedPlayers.findIndex(p => p.userId?.toString() === myUid.toString());
      const iAmCurrentPlayer = myIdx === (s.currentPlayerIndex ?? 0);

      if (s.status === 'challenge') {
        // Restore formedWords and placedTiles from server state for challenge display
        setFormedWords(s.formedWords ?? []);
        setPlacedTiles(s.placedTiles ?? []);
        if (!iAmCurrentPlayer) {
          // I am the opponent — show challenge screen
          const mover = normalizedPlayers[s.currentPlayerIndex ?? 0];
          const wl = (s.formedWords ?? []).map(w => w.word || w).join(', ');
          setMessage(`${mover?.name}: ${wl} = ${s.turnScore ?? 0} п.`);
          setScreen('challenge');
        }
        // If I am the current player, stay on waitingChallenge
        return;
      }

      // Normal playing state
      setPlacedTiles([]);
      setFormedWords([]);
      const cp = normalizedPlayers[s.currentPlayerIndex ?? 0];
      if (cp) setMessage(`${cp.name} — твој ред!`);
      setScreen('playing');
    };

    const interval = setInterval(async () => {
      // Skip polling only when actively placing tiles on board
      if (screenRef.current === 'gameOver') return;
      if (isMyTurnRef.current && placedTilesRef.current.length > 0 && screenRef.current === 'playing') return;
      try {
        const res = await fetch(`/api/games/${gameIdRef.current}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) applyServerState(data.state);
        else console.warn('Poll got error:', data.error);
      } catch (err) { console.warn('Poll fetch failed:', err.message); }
    }, 3000);

    return () => clearInterval(interval);
  }, [hasServerGame]);  // run once on mount — interval reads latest state via closure refs

  const getDisplayLetter = (tile) => {
    if (!tile) return '';
    if (tile.letter === '★' && jokerAssignments[tile.id]) return jokerAssignments[tile.id];
    return tile.letter;
  };
  const addLog = (entry) => setGameLog(prev => [...prev, entry]);

  // ─── DRAG & DROP ───
  const handleDragStart = (e, tile, rackIndex) => {
    if (screen !== 'playing' || players[currentPlayer]?.type === 'ai' || !isMyTurn) return;
    setDraggedTile({ ...tile, rackIndex });
    setSelectedTile({ ...tile, rackIndex });
    SFX.tilePickup();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tile.id);
  };

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const handleDropOnBoard = (e, row, col) => {
    e.preventDefault();
    const tile = draggedTile || selectedTile;
    if (!tile || screen !== 'playing' || board[row][col]) { setDraggedTile(null); return; }
    if (tile.letter === '★' && !jokerAssignments[tile.id]) { setJokerModal({ row, col, tile }); setDraggedTile(null); return; }
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
    const gp = setupPlayers.map(sp => ({ ...sp, rack: drawTiles(bag, 7), score: 0, skipPenalty: false }));
    setTileBag([...bag]); setPlayers(gp); setBoard(createEmptyBoard()); setConfirmedBoard(createEmptyBoard());
    setCurrentPlayer(0); setPlacedTiles([]); setIsFirstMove(true); setConsecutivePasses(0);
    setGameLog([]); setJokerAssignments({}); setAiMoveDisplay(null); setWordInfoModal(null);
    setWordRecords({}); setEndBonuses(null);
    setMessage(`${gp[0].name} — твој ред!`); setScreen('playing');
    if (gp[0].type === 'ai') setTimeout(() => triggerAIMove(gp, 0, createEmptyBoard(), bag, true, createEmptyBoard()), 600);
  };

  const selectTile = (tile, index) => {
    if (screen !== 'playing' || players[currentPlayer]?.type === 'ai' || !isMyTurn) return;
    SFX.tilePickup();
    setSelectedTile(selectedTile?.id === tile.id ? null : { ...tile, rackIndex: index });
  };

  const placeTileOnBoard = (row, col) => {
    if (!selectedTile || screen !== 'playing' || board[row][col]) return;
    if (selectedTile.letter === '★' && !jokerAssignments[selectedTile.id]) { setJokerModal({ row, col, tile: selectedTile }); return; }
    doPlace(row, col, selectedTile, getDisplayLetter(selectedTile));
  };

  const doPlace = (row, col, tile, displayLetter) => {
    playBonusSound(row, col);
    const nb = board.map(r => [...r]); nb[row][col] = { ...tile, displayLetter };
    setBoard(nb);
    const np = [...placedTiles, { row, col, tile }]; setPlacedTiles(np);
    const npl = [...players];
    npl[currentPlayer] = { ...npl[currentPlayer], rack: npl[currentPlayer].rack.filter((_, i) => i !== tile.rackIndex) };
    setPlayers(npl); setSelectedTile(null); recalculate(nb, np);
  };

  const assignJoker = (letter) => {
    if (!jokerModal) return;
    const { row, col, tile } = jokerModal;
    setJokerAssignments(prev => ({ ...prev, [tile.id]: letter }));
    setJokerModal(null); doPlace(row, col, tile, letter);
  };

  const removePlacedTile = (row, col) => {
    const placed = placedTiles.find(p => p.row === row && p.col === col);
    if (!placed) return;
    SFX.tileReturn();
    const nb = board.map(r => [...r]); nb[row][col] = null; setBoard(nb);
    const newPlaced = placedTiles.filter(p => !(p.row === row && p.col === col));
    setPlacedTiles(newPlaced);
    const npl = [...players];
    npl[currentPlayer] = { ...npl[currentPlayer], rack: [...npl[currentPlayer].rack, placed.tile] };
    setPlayers(npl); recalculate(nb, newPlaced);
  };

  // ─── WORD DETECTION ───
  const findFormedWords = useCallback((bs, placed) => {
    if (!placed.length) return [];
    const seen = new Set();
    const results = [];
    const getL = (r, c) => (r < 0 || r > 14 || c < 0 || c > 14 || !bs[r][c]) ? null : (bs[r][c].displayLetter || bs[r][c].letter);
    const extractWord = (r, c, dr, dc) => {
      let sr = r, sc = c;
      while (getL(sr - dr, sc - dc)) { sr -= dr; sc -= dc; }
      let w = '', cells = [], cr = sr, cc = sc;
      while (getL(cr, cc)) { w += getL(cr, cc); cells.push({ row: cr, col: cc }); cr += dr; cc += dc; }
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

  const calcScore = useCallback((bs, placed, confirmed) => {
    const words = findFormedWords(bs, placed);
    const ps = new Set(placed.map(p => `${p.row}-${p.col}`));
    let total = 0;
    for (const w of words) {
      let ws = 0, wm = 1;
      for (const cell of w.cells) {
        const tile = bs[cell.row]?.[cell.col]; if (!tile) continue;
        let lp = tile.letter === '★' ? 0 : getPoints(tile.letter);
        if (ps.has(`${cell.row}-${cell.col}`) && !confirmed[cell.row][cell.col]) {
          const b = BONUS_MAP[cell.row][cell.col];
          if (b === 'TL') lp *= 3; else if (b === 'DL') lp *= 2;
          else if (b === 'TW') wm *= 3; else if (b === 'DW' || b === 'ST') wm *= 2;
        }
        ws += lp;
      }
      total += ws * wm;
    }
    if (placed.length === 7) total += 50;
    return { total, words };
  }, [findFormedWords]);

  const recalculate = useCallback((bs, placed) => {
    const { total, words } = calcScore(bs, placed, confirmedBoard);
    setFormedWords(words); setTurnScore(total);
  }, [calcScore, confirmedBoard]);

  const validatePlacement = () => {
    if (!placedTiles.length) return 'Постави барем една плочка.';
    const rows = [...new Set(placedTiles.map(p => p.row))], cols = [...new Set(placedTiles.map(p => p.col))];
    if (rows.length > 1 && cols.length > 1) return 'Плочките мора да се во ист ред или колона.';
    if (rows.length === 1) { const sc = placedTiles.map(p => p.col).sort((a,b)=>a-b); for (let c = sc[0]; c <= sc[sc.length-1]; c++) if (!board[rows[0]][c]) return 'Не смее да има празнини.'; }
    if (cols.length === 1) { const sr = placedTiles.map(p => p.row).sort((a,b)=>a-b); for (let r = sr[0]; r <= sr[sr.length-1]; r++) if (!board[r][cols[0]]) return 'Не смее да има празнини.'; }
    if (isFirstMove) {
      if (!placedTiles.some(p => p.row === 7 && p.col === 7)) return 'Првиот збор мора да го покрие центарот (★).';
      if (placedTiles.length < 2) return 'Првиот збор мора да има барем 2 букви.';
    } else {
      let conn = false;
      for (const p of placedTiles) {
        for (const [nr, nc] of [[p.row-1,p.col],[p.row+1,p.col],[p.row,p.col-1],[p.row,p.col+1]])
          if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && confirmedBoard[nr][nc]) { conn = true; break; }
        if (conn) break;
      }
      if (!conn) return 'Зборот мора да се поврзе со постоечки плочки.';
    }
    if (!formedWords.length) return 'Не е формиран збор.';
    return null;
  };

  const confirmPlacement = async () => {
    console.log('confirmPlacement called, hasServerGame:', hasServerGame, 'placedTiles:', placedTiles.length);
    const err = validatePlacement(); if (err) { setMessage(err); return; }

    if (hasServerGame) {
      // POST pending move to server — opponent will see challenge screen via polling
      try {
        setMessage('⏳ Чекај одлука од противникот...');
        const res = await fetch(`/api/games/${initialGameState.gameId}/confirm`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            placedTiles,
            board,
            turnScore,
            formedWords: formedWords.map(w => w.word),
          }),
        });
        const data = await res.json();
        if (data.success) {
          // Show waiting message — polling will update when opponent decides
          const wl = formedWords.map(w => w.word).join(', ');
          setMessage(`⏳ ${players[currentPlayer].name}: ${wl} (${turnScore} п.) — чека потврда...`);
          setScreen('waitingChallenge');
        } else {
          setMessage(`⚠️ Грешка: ${data.error}`);
        }
      } catch (err) {
        setMessage('⚠️ Грешка при поднесување.');
        console.error(err);
      }
      return;
    }

    const otherHumans = players.filter((p, i) => i !== currentPlayer && p.type === 'human');
    if (!otherHumans.length) { finalizeTurn(); return; }
    const wl = formedWords.map(w => w.word).join(', ');
    const note = formedWords.length > 1 ? ` (${formedWords.length} зборови)` : '';
    setMessage(`${players[currentPlayer].name}: ${wl}${note} = ${turnScore} п.`);
    setScreen('challenge');
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
  setIsValidating(true); setChallengeResult(null);
  setMessage(`🤖 Агент пребарува "${word}" во речници...`);
  try {
    const result = await validateWordWithAI(word);

    let challengerIdx = -1;
    for (let off = 1; off < players.length; off++) {
      const idx = (currentPlayer + off) % players.length;
      if (players[idx].type === 'human') { challengerIdx = idx; break; }
    }

    if (result.valid === true) {
      SFX.challengeValid();
      setChallengeResult({ word, ...result });
      if (challengerIdx >= 0) {
        const np = [...players];
        np[challengerIdx] = { ...np[challengerIdx], skipPenalty: true };
        setPlayers(np);
        setMessage(`✅ "${word}" е валиден! ${np[challengerIdx].name} го губи следниот ред.`);
        addLog(`🔍 "${word}" потврден — ${np[challengerIdx].name} казнет`);
      }
    } else if (result.valid === false) {
      SFX.challengeInvalid();
      setChallengeResult({ word, ...result });
      setMessage(`❌ "${word}" НЕ е валиден! ${players[currentPlayer].name} враќа плочки.`);
      addLog(`🔍 "${word}" одбиен`);
    } else {
      // null = API error
      setChallengeResult({ word, ...result });
      setMessage('⚠️ Проверката не успеа.');
    }
  } catch (err) {
    console.error('Challenge error:', err);
    setChallengeResult({ word, valid: null, explanation: "Грешка при проверка.", definition: "", source: "" });
    setMessage('⚠️ Проверката не успеа.');
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
    const nb = board.map(r => [...r]); const np = [...players]; const ret = [];
    for (const p of placedTiles) { nb[p.row][p.col] = null; ret.push(p.tile); }
    np[currentPlayer] = { ...np[currentPlayer], rack: [...np[currentPlayer].rack, ...ret] };
    setBoard(nb); setPlayers(np); setPlacedTiles([]); setFormedWords([]); setTurnScore(0);
  };

  const finalizeTurn = async () => {
    console.log('finalizeTurn called, hasServerGame:', hasServerGame, 'gameId:', initialGameState?.gameId);
    SFX.wordSuccess();

    // In multiplayer games, the opponent calls finalize to accept the move
    if (hasServerGame && initialGameState?.gameId) {
      try {
        setMessage('💾 Зачувување...');
        const res = await fetch(`/api/games/${initialGameState.gameId}/finalize`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (data.success) {
          const s = data.state;
          const normalizedPlayers = (s.players ?? []).map(p => ({
            ...p, name: p.displayName || p.name || 'Играч'
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
          setPlacedTiles([]); setFormedWords([]); setTurnScore(0);
          setSelectedTile(null); setChallengeResult(null); setAiMoveDisplay(null);
          if (s.status === 'gameOver') { setScreen('gameOver'); return; }
          const nextCp = normalizedPlayers[s.currentPlayerIndex ?? 0];
          setMessage(nextCp ? `${nextCp.name} — твој ред!` : '');
          setScreen('playing');
        } else {
          setMessage(`⚠️ Грешка: ${data.error}`);
        }
      } catch (err) {
        console.error('finalizeTurn server error:', err);
        setMessage('⚠️ Грешка при зачувување.');
      }
      return;
    }

    // Local (single-player / AI) mode — original logic
    const np = [...players];
    np[currentPlayer] = { ...np[currentPlayer], score: np[currentPlayer].score + turnScore };
    const needed = 7 - np[currentPlayer].rack.length;
    const drawn = drawTiles(tileBag, needed);
    np[currentPlayer] = { ...np[currentPlayer], rack: [...np[currentPlayer].rack, ...drawn] };
    setTileBag([...tileBag]); setPlayers(np);
    const newConf = board.map(r => r.map(c => c ? { ...c } : null));
    setConfirmedBoard(newConf);
    setWordRecords(prev => {
      const rec = { ...prev };
      if (!rec[currentPlayer]) rec[currentPlayer] = { longestWord: '', longestLen: 0, bestWord: '', bestScore: 0 };
      for (const w of formedWords) {
        if (w.word.length > rec[currentPlayer].longestLen) {
          rec[currentPlayer].longestWord = w.word;
          rec[currentPlayer].longestLen = w.word.length;
        }
      }
      if (turnScore > rec[currentPlayer].bestScore) {
        rec[currentPlayer].bestWord = formedWords.map(fw => fw.word).join('+');
        rec[currentPlayer].bestScore = turnScore;
      }
      return rec;
    });
    addLog(`${players[currentPlayer].name}: ${formedWords.map(w => w.word).join(', ')} (+${turnScore})`);
    setIsFirstMove(false); setConsecutivePasses(0); setChallengeResult(null); setAiMoveDisplay(null);
    endTurn(false, np, newConf);
  };

  const endTurn = (wasSkip, updatedPlayers, newConf) => {
    const pls = updatedPlayers || players; const conf = newConf || confirmedBoard;
    setPlacedTiles([]); setFormedWords([]); setTurnScore(0); setSelectedTile(null);
    if (tileBag.length === 0 && pls[currentPlayer].rack.length === 0) { endGame(pls); return; }
    if (wasSkip) { const np = consecutivePasses + 1; setConsecutivePasses(np); if (np >= pls.length * 2) { endGame(pls); return; } }
    let next = (currentPlayer + 1) % pls.length, attempts = 0;
    const npArr = [...pls];
    while (npArr[next].skipPenalty && attempts < pls.length) {
      npArr[next] = { ...npArr[next], skipPenalty: false };
      addLog(`${npArr[next].name}: прескокнат (казна)`);
      next = (next + 1) % pls.length; attempts++;
    }
    setPlayers(npArr); setCurrentPlayer(next);
    setMessage(`${npArr[next].name} — твој ред!`); setScreen('playing');
    if (npArr[next].type === 'ai') { const fm = isFirstMove; setTimeout(() => triggerAIMove(npArr, next, conf, tileBag, fm, conf), 800); }
  };

  const triggerAIMove = async (curPlayers, pidx, curBoard, curBag, firstMove, confirmed) => {
    setIsAIThinking(true);
    const player = curPlayers[pidx]; setMessage(`🤖 ${player.name} размислува...`);
    const result = await generateAIMove(confirmed, player.rack, firstMove, player.age);
    setIsAIThinking(false);
    if (!result || result.pass || !result.word || !result.placements?.length) {
      addLog(`${player.name}: пас (AI)`); setMessage(`${player.name} пасира.`);
      const np2 = consecutivePasses + 1; setConsecutivePasses(np2);
      if (np2 >= curPlayers.length * 2) { endGame(curPlayers); return; }
      const next = (pidx + 1) % curPlayers.length; setCurrentPlayer(next);
      setMessage(`${curPlayers[next].name} — твој ред!`);
      if (curPlayers[next].type === 'ai') setTimeout(() => triggerAIMove(curPlayers, next, confirmed, curBag, firstMove, confirmed), 800);
      return;
    }
    const newBoard = confirmed.map(r => [...r]); const newPlaced = [];
    const np = [...curPlayers]; let rackCopy = [...player.rack]; let newJA = { ...jokerAssignments };
    for (const pl of result.placements) {
      if (pl.row < 0 || pl.row > 14 || pl.col < 0 || pl.col > 14 || newBoard[pl.row][pl.col]) continue;
      let ti = rackCopy.findIndex(t => t.letter === pl.letter);
      if (ti === -1) { ti = rackCopy.findIndex(t => t.letter === '★'); if (ti !== -1) newJA[rackCopy[ti].id] = pl.letter; }
      if (ti === -1) continue;
      const tile = rackCopy[ti]; rackCopy = rackCopy.filter((_, i) => i !== ti);
      newBoard[pl.row][pl.col] = { ...tile, displayLetter: pl.letter };
      newPlaced.push({ row: pl.row, col: pl.col, tile });
    }
    if (!newPlaced.length) {
      addLog(`${player.name}: пас (невалиден)`);
      const next = (pidx + 1) % curPlayers.length; setCurrentPlayer(next);
      setMessage(`${curPlayers[next].name} — твој ред!`);
      if (curPlayers[next].type === 'ai') setTimeout(() => triggerAIMove(curPlayers, next, confirmed, curBag, firstMove, confirmed), 800);
      return;
    }
    setJokerAssignments(newJA); setBoard(newBoard);
    np[pidx] = { ...np[pidx], rack: rackCopy }; setPlayers(np); setPlacedTiles(newPlaced);
    const { total, words } = calcScore(newBoard, newPlaced, confirmed);
    setFormedWords(words); setTurnScore(total);
    const wl = words.map(w => w.word).join(', ');
    setAiMoveDisplay({ word: result.word, explanation: result.explanation, score: total, words: wl });
    const hasHuman = np.some((p, i) => i !== pidx && p.type === 'human');
    if (hasHuman && words.length > 0) {
      setMessage(`🤖 ${player.name}: ${wl} (${total} п.)`); setScreen('challenge');
    } else {
      setTimeout(() => {
        SFX.wordSuccess();
        np[pidx] = { ...np[pidx], score: np[pidx].score + total };
        const drawn = drawTiles(curBag, 7 - rackCopy.length);
        np[pidx] = { ...np[pidx], rack: [...rackCopy, ...drawn] };
        setTileBag([...curBag]); setPlayers(np);
        const nc = newBoard.map(r => r.map(c => c ? { ...c } : null));
        setConfirmedBoard(nc); addLog(`${player.name}: ${wl} (+${total})`);
        // Track AI word records too
        setWordRecords(prev => {
          const rec = { ...prev };
          if (!rec[pidx]) rec[pidx] = { longestWord: '', longestLen: 0, bestWord: '', bestScore: 0 };
          for (const w of words) {
            if (w.word.length > rec[pidx].longestLen) { rec[pidx].longestWord = w.word; rec[pidx].longestLen = w.word.length; }
          }
          if (total > rec[pidx].bestScore) { rec[pidx].bestWord = wl; rec[pidx].bestScore = total; }
          return rec;
        });
        setIsFirstMove(false); setConsecutivePasses(0);
        setPlacedTiles([]); setFormedWords([]); setTurnScore(0); setAiMoveDisplay(null);
        const next = (pidx + 1) % np.length; setCurrentPlayer(next);
        setMessage(`${np[next].name} — твој ред!`);
        if (np[next].type === 'ai') setTimeout(() => triggerAIMove(np, next, nc, curBag, false, nc), 800);
      }, 2000);
    }
  };

  const passTurn = () => { addLog(`${players[currentPlayer].name}: пас`); returnTilesToRack(); endTurn(true); };
  const exchangeTiles = () => {
    if (placedTiles.length > 0) { setMessage('Замена е дозволена само ПРЕД да поставиш букви! Врати ги прво.'); return; }
    if (players[currentPlayer].score < 5) { setMessage(`Немаш доволно поени за замена (потребни 5, имаш ${players[currentPlayer].score}).`); return; }
    if (tileBag.length < 7) { setMessage('Нема доволно плочки во кесата.'); return; }
    const np = [...players]; const old = [...np[currentPlayer].rack];
    np[currentPlayer] = { ...np[currentPlayer], score: np[currentPlayer].score - 5 };
    const newT = drawTiles(tileBag, old.length); tileBag.push(...old);
    for (let i = tileBag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [tileBag[i], tileBag[j]] = [tileBag[j], tileBag[i]]; }
    np[currentPlayer] = { ...np[currentPlayer], rack: newT }; setPlayers(np); setTileBag([...tileBag]);
    addLog(`${players[currentPlayer].name}: замена (-5 п.)`);
    setMessage(`${players[currentPlayer].name} замени букви (-5 поени). Сега постави збор.`);
    // Does NOT end turn — player continues with new tiles
  };

  const endGame = async (pls) => {
    SFX.gameOver();
    const np = [...pls];
    // Subtract remaining tile values
    for (let i = 0; i < np.length; i++) { const rem = np[i].rack.reduce((s, t) => s + t.points, 0); np[i] = { ...np[i], score: Math.max(0, np[i].score - rem) }; }

    // Calculate end-game bonuses from wordRecords
    const LONGEST_BONUS = 15;
    const BESTSCORE_BONUS = 10;
    const bonuses = {};
    let globalLongestLen = 0, globalBestScore = 0;
    let longestPlayers = [], bestScorePlayers = [];

    // Find global bests
    for (let i = 0; i < np.length; i++) {
      const rec = wordRecords[i];
      if (!rec) continue;
      if (rec.longestLen > globalLongestLen) { globalLongestLen = rec.longestLen; longestPlayers = [i]; }
      else if (rec.longestLen === globalLongestLen && globalLongestLen > 0) longestPlayers.push(i);
      if (rec.bestScore > globalBestScore) { globalBestScore = rec.bestScore; bestScorePlayers = [i]; }
      else if (rec.bestScore === globalBestScore && globalBestScore > 0) bestScorePlayers.push(i);
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
      longestPlayers: longestPlayers.map(i => ({ name: np[i].name, word: wordRecords[i]?.longestWord, len: globalLongestLen, bonus: LONGEST_BONUS })),
      bestScorePlayers: bestScorePlayers.map(i => ({ name: np[i].name, word: wordRecords[i]?.bestWord, score: globalBestScore, bonus: BESTSCORE_BONUS })),
      playerBonuses: bonuses,
    };
    setEndBonuses(bonusInfo);
    setTimeout(() => SFX.bonusAwarded(), 1200);

    setPlayers(np); setScreen('gameOver');
    const maxS = Math.max(...np.map(p => p.score));
    setMessage(`🏆 ${np.filter(p => p.score === maxS).map(w => w.name).join(' и ')} победи!`);
    for (const p of np) { if (p.type !== 'ai') await updateLeaderboard(p.name, p.score, p.score === maxS, p.age); }
    setLeaderboard(await loadLeaderboard());
  };

  // ═══════════════════════════════════════════
  // STYLES
  // ═══════════════════════════════════════════
  const S = {
    page: { minHeight: '100vh', background: 'linear-gradient(140deg, #0b0f1a 0%, #162032 40%, #1a1210 100%)', fontFamily: "'Palatino Linotype','Book Antiqua','Palatino',serif", color: '#f0e6d3' },
    card: { background: 'linear-gradient(145deg, #2a1a10, #3a2518)', borderRadius: 14, border: '1.5px solid rgba(212,175,55,0.25)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' },
    gold: '#d4af37',
    btn: (bg) => ({ padding: '10px 22px', background: bg, color: '#fff', border: 'none', borderRadius: 7, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, transition: 'all 0.15s' }),
    btnO: { padding: '10px 22px', background: 'transparent', color: '#d4af37', border: '1.5px solid rgba(212,175,55,0.4)', borderRadius: 7, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
    btnSm: (bg) => ({ padding: '5px 12px', background: bg, color: '#fff', border: 'none', borderRadius: 5, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }),
  };

  const tileStyle = (tile, isSelected, isDragging) => ({
    width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    background: isSelected ? S.gold : tile?.letter === '★' ? 'linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3)' : 'linear-gradient(145deg, #f0dfc0, #d8c098)',
    border: isSelected ? '2px solid #e67e22' : '1px solid #b8a07a', borderRadius: 5,
    cursor: 'grab', fontWeight: 'bold', fontSize: 17, color: tile?.letter === '★' ? '#8b0000' : '#2a1808', fontFamily: 'inherit',
    boxShadow: isSelected ? '0 0 10px rgba(212,175,55,0.5)' : '2px 3px 5px rgba(0,0,0,0.25)',
    userSelect: 'none', opacity: isDragging ? 0.4 : 1, transition: 'box-shadow 0.15s, opacity 0.15s',
  });

  // ═══════════════════════════════════════════
  // HOME
  // ═══════════════════════════════════════════
  if (screen === 'home') return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ ...S.card, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 48, letterSpacing: 8, color: S.gold, fontWeight: 700, textShadow: '0 2px 15px rgba(212,175,55,0.3)' }}>СКРАБЛ</div>
        <div style={{ color: '#a89070', fontSize: 13, letterSpacing: 4, marginBottom: 40 }}>МАКЕДОНСКО ИЗДАНИЕ</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => setScreen('setup')} style={{ ...S.btn('linear-gradient(135deg, #8b2500, #cd3700)'), padding: 14, fontSize: 16, letterSpacing: 2 }}>🎮 НОВА ИГРА</button>
          <button onClick={() => { loadLeaderboard().then(setLeaderboard); setScreen('leaderboard'); }} style={S.btnO}>🏆 ТАБЛА НА НАЈДОБРИ</button>
        </div>
        <div style={{ marginTop: 32, padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: 12, color: '#887060', lineHeight: 1.8, textAlign: 'left' }}>
          ✦ Влечи и пушти (drag & drop) плочки на табла<br/>
          ✦ AI агент проверува зборови во МК речници и Википедија<br/>
          ✦ 📖 Побарај повеќе инфо за секој збор<br/>
          ✦ 2-4 играчи (луѓе и/или AI по возраст)<br/>
          ✦ Постојана табла на најдобри резултати
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  // LEADERBOARD
  // ═══════════════════════════════════════════
  if (screen === 'leaderboard') return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ ...S.card, padding: '36px 32px', maxWidth: 560, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: S.gold, fontSize: 22 }}>🏆 Табла на Најдобри</h2>
          <button onClick={() => setScreen('home')} style={{ ...S.btn('rgba(255,255,255,0.1)'), padding: '6px 16px', fontSize: 12 }}>← Назад</button>
        </div>
        {!leaderboard.length ? <div style={{ textAlign: 'center', padding: 40, color: '#887060' }}>Сè уште нема резултати!</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 55px 55px 50px 50px', gap: 6, padding: '8px 10px', color: '#887060', fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>
              <span>#</span><span>ИГРАЧ</span><span style={{textAlign:'right'}}>НАЈД.</span><span style={{textAlign:'right'}}>ПРОС.</span><span style={{textAlign:'right'}}>ИГРИ</span><span style={{textAlign:'right'}}>ПОБ.</span>
            </div>
            {leaderboard.map((e, i) => (
              <div key={e.name} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 55px 55px 50px 50px', gap: 6, padding: '10px', background: i === 0 ? 'rgba(212,175,55,0.1)' : 'rgba(0,0,0,0.15)', borderRadius: 6, border: i === 0 ? '1px solid rgba(212,175,55,0.3)' : 'none', alignItems: 'center' }}>
                <span style={{ color: i < 3 ? S.gold : '#887060', fontSize: 15, fontWeight: 700 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                <div><div style={{ fontWeight: 600, fontSize: 13 }}>{e.name}</div><div style={{ fontSize: 9, color: '#887060' }}>возраст: {e.age}</div></div>
                <span style={{ textAlign: 'right', color: S.gold, fontWeight: 700 }}>{e.bestScore}</span>
                <span style={{ textAlign: 'right', color: '#a89070', fontSize: 13 }}>{e.avgScore}</span>
                <span style={{ textAlign: 'right', color: '#a89070', fontSize: 13 }}>{e.totalGames}</span>
                <span style={{ textAlign: 'right', color: '#a89070', fontSize: 13 }}>{e.wins}</span>
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
  if (screen === 'setup') {
    const getDiff = (age) => age <= 8 ? { l: 'Лесно', c: '#2ecc71', e: '🌱' } : age <= 12 ? { l: 'Средно', c: '#f39c12', e: '⚡' } : age <= 17 ? { l: 'Тешко', c: '#e67e22', e: '🔥' } : { l: 'Експерт', c: '#e74c3c', e: '💀' };
    return (
      <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ ...S.card, padding: '36px 32px', maxWidth: 520, width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ margin: 0, color: S.gold, fontSize: 22 }}>Подготовка</h2>
            <button onClick={() => setScreen('home')} style={{ ...S.btn('rgba(255,255,255,0.1)'), padding: '6px 16px', fontSize: 12 }}>← Назад</button>
          </div>
          {setupPlayers.map((sp, i) => {
            const d = getDiff(sp.age);
            return (
              <div key={i} style={{ padding: 14, marginBottom: 10, background: sp.type === 'ai' ? 'rgba(41,128,185,0.1)' : 'rgba(0,0,0,0.2)', borderRadius: 10, border: sp.type === 'ai' ? '1px solid rgba(41,128,185,0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input value={sp.name} onChange={e => { const s = [...setupPlayers]; s[i] = { ...s[i], name: e.target.value }; setSetupPlayers(s); }}
                    style={{ flex: 1, padding: '8px 10px', background: '#0d0a08', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 6, color: '#f0e6d3', fontSize: 14, fontFamily: 'inherit' }} />
                  {setupPlayers.length > 2 && <button onClick={() => setSetupPlayers(setupPlayers.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: 16 }}>✕</button>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {['human', 'ai'].map(t => (
                      <button key={t} onClick={() => { const s = [...setupPlayers]; s[i] = { ...s[i], type: t, name: t === 'ai' && !s[i].name.includes('🤖') ? `🤖 AI ${i+1}` : s[i].name }; setSetupPlayers(s); }}
                        style={{ padding: '4px 12px', borderRadius: 5, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: sp.type === t ? (t === 'ai' ? '#2980b9' : S.gold) : 'rgba(255,255,255,0.08)', color: sp.type === t ? (t === 'ai' ? '#fff' : '#1a0e08') : '#a89070', fontWeight: 600 }}>
                        {t === 'human' ? '👤 Човек' : '🤖 AI'}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 160 }}>
                    <span style={{ fontSize: 10, color: '#887060' }}>Возраст:</span>
                    <input type="range" min="5" max="60" value={sp.age} onChange={e => { const s = [...setupPlayers]; s[i] = { ...s[i], age: parseInt(e.target.value) }; setSetupPlayers(s); }} style={{ flex: 1, accentColor: d.c }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: d.c, minWidth: 22 }}>{sp.age}</span>
                  </div>
                  {sp.type === 'ai' && <span style={{ fontSize: 10, color: d.c, fontWeight: 600, background: `${d.c}15`, padding: '2px 6px', borderRadius: 4 }}>{d.e} {d.l}</span>}
                </div>
              </div>
            );
          })}
          {setupPlayers.length < 4 && <button onClick={() => setSetupPlayers([...setupPlayers, { name: `Играч ${setupPlayers.length + 1}`, age: 25, type: 'human' }])}
            style={{ width: '100%', padding: 8, background: 'transparent', border: '1.5px dashed rgba(212,175,55,0.3)', borderRadius: 8, color: S.gold, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>+ Додади играч</button>}
          <button onClick={startGame} style={{ ...S.btn('linear-gradient(135deg, #8b2500, #cd3700)'), width: '100%', padding: 14, fontSize: 16, letterSpacing: 2, marginTop: 4 }}>ЗАПОЧНИ 🎲</button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // GAME OVER
  // ═══════════════════════════════════════════
  if (screen === 'gameOver') {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    return (
      <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ ...S.card, padding: '40px 32px', maxWidth: 560, width: '100%', textAlign: 'center', maxHeight: '95vh', overflow: 'auto' }}>
          <div style={{ fontSize: 50, marginBottom: 8 }}>🏆</div>
          <h2 style={{ color: S.gold, fontSize: 24, margin: '0 0 4px' }}>КРАЈ НА ИГРАТА</h2>
          <p style={{ color: '#a89070', margin: '0 0 16px', fontSize: 13 }}>{message}</p>

          {/* Player scores */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            {sorted.map((p, i) => (
              <div key={i} style={{ padding: '12px 20px', borderRadius: 10, minWidth: 90, background: i === 0 ? 'rgba(212,175,55,0.12)' : 'rgba(0,0,0,0.2)', border: i === 0 ? `2px solid ${S.gold}` : 'none' }}>
                <div style={{ fontSize: 18 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                <div style={{ fontSize: 12, color: '#a89070' }}>{p.type === 'ai' ? '🤖 ' : ''}{p.name}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: i === 0 ? S.gold : '#f0e6d3' }}>{p.score}</div>
              </div>
            ))}
          </div>

          {/* BONUS AWARDS */}
          {endBonuses && (
            <div style={{ marginBottom: 16, padding: 14, background: 'rgba(212,175,55,0.06)', borderRadius: 10, border: '1px solid rgba(212,175,55,0.2)' }}>
              <div style={{ fontSize: 13, color: S.gold, fontWeight: 700, marginBottom: 10, letterSpacing: 1 }}>🎖️ БОНУС НАГРАДИ</div>
              
              {endBonuses.longestPlayers.length > 0 && (
                <div style={{ marginBottom: 10, padding: 10, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#3498db', fontWeight: 600, marginBottom: 4 }}>📏 НАЈДОЛГ ЗБОР → +{endBonuses.longestPlayers[0].bonus} поени</div>
                  {endBonuses.longestPlayers.map((lp, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ color: '#f0e6d3', fontSize: 13 }}>{lp.name}</span>
                      <span style={{ padding: '3px 10px', background: 'rgba(52,152,219,0.2)', borderRadius: 5, fontSize: 14, color: '#3498db', fontWeight: 700, letterSpacing: 2 }}>{lp.word}</span>
                      <span style={{ color: '#887060', fontSize: 11 }}>({lp.len} букви)</span>
                    </div>
                  ))}
                </div>
              )}

              {endBonuses.bestScorePlayers.length > 0 && (
                <div style={{ padding: 10, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#e67e22', fontWeight: 600, marginBottom: 4 }}>🔥 НАЈМНОГУ ПОЕНИ ВО ПОТЕГ → +{endBonuses.bestScorePlayers[0].bonus} поени</div>
                  {endBonuses.bestScorePlayers.map((bp, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ color: '#f0e6d3', fontSize: 13 }}>{bp.name}</span>
                      <span style={{ padding: '3px 10px', background: 'rgba(230,126,34,0.2)', borderRadius: 5, fontSize: 14, color: '#e67e22', fontWeight: 700 }}>{bp.word}</span>
                      <span style={{ color: '#887060', fontSize: 11 }}>({bp.score} п.)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Game log */}
          <div style={{ maxHeight: 120, overflow: 'auto', textAlign: 'left', background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 10, marginBottom: 16 }}>
            {gameLog.map((e, i) => <div key={i} style={{ color: '#887060', fontSize: 10, marginBottom: 1 }}>{e}</div>)}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => setScreen('setup')} style={S.btn('linear-gradient(135deg, #8b2500, #cd3700)')}>🔄 Нова Игра</button>
            <button onClick={() => { loadLeaderboard().then(setLeaderboard); setScreen('leaderboard'); }} style={S.btnO}>🏆 Табла</button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // WAITING FOR CHALLENGE DECISION (multiplayer)
  // ═══════════════════════════════════════════
  if (screen === 'waitingChallenge') return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ ...S.card, padding: '40px 32px', maxWidth: 420, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
        <div style={{ color: S.gold, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Чека одлука...</div>
        <div style={{ color: '#a89070', fontSize: 13, marginBottom: 16 }}>{message}</div>
        <div style={{ color: '#665040', fontSize: 11 }}>Противникот одлучува дали да предизвика</div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  // MAIN GAME
  // ═══════════════════════════════════════════
  const cp = players[currentPlayer];

  return (
    <div style={{ ...S.page, padding: 8 }}>
      <style>{`
        @keyframes aispin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .board-cell:hover { outline: 2px solid rgba(212,175,55,0.4); outline-offset: -2px; }
        .tile-rack:hover { transform: translateY(-3px); box-shadow: 0 4px 12px rgba(212,175,55,0.3) !important; }
      `}</style>

      {/* WORD INFO MODAL */}
      {wordInfoModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setWordInfoModal(null)}>
          <div style={{ ...S.card, padding: 28, maxWidth: 440, width: '100%', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: S.gold, fontSize: 22 }}>📖 {wordInfoModal.word}</h3>
              <button onClick={() => setWordInfoModal(null)} style={{ background: 'none', border: 'none', color: '#a89070', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            {wordInfoModal.partOfSpeech && <div style={{ display: 'inline-block', padding: '2px 10px', background: 'rgba(41,128,185,0.2)', borderRadius: 4, fontSize: 11, color: '#3498db', fontWeight: 600, marginBottom: 12 }}>{wordInfoModal.partOfSpeech}</div>}
            {wordInfoModal.definition && <div style={{ marginBottom: 14 }}><div style={{ fontSize: 10, color: '#887060', marginBottom: 3, fontWeight: 600 }}>ДЕФИНИЦИЈА</div><div style={{ fontSize: 14, lineHeight: 1.5 }}>{wordInfoModal.definition}</div></div>}
            {wordInfoModal.etymology && <div style={{ marginBottom: 14 }}><div style={{ fontSize: 10, color: '#887060', marginBottom: 3, fontWeight: 600 }}>ЕТИМОЛОГИЈА</div><div style={{ fontSize: 13, lineHeight: 1.4, color: '#c8b898' }}>{wordInfoModal.etymology}</div></div>}
            {wordInfoModal.examples?.length > 0 && <div style={{ marginBottom: 14 }}><div style={{ fontSize: 10, color: '#887060', marginBottom: 3, fontWeight: 600 }}>ПРИМЕРИ</div>{wordInfoModal.examples.map((ex, i) => <div key={i} style={{ fontSize: 12, color: '#a89070', fontStyle: 'italic', marginBottom: 3 }}>„{ex}"</div>)}</div>}
            {wordInfoModal.synonyms?.length > 0 && <div style={{ marginBottom: 14 }}><div style={{ fontSize: 10, color: '#887060', marginBottom: 3, fontWeight: 600 }}>СИНОНИМИ</div><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{wordInfoModal.synonyms.map((s, i) => <span key={i} style={{ padding: '2px 8px', background: 'rgba(46,204,113,0.15)', borderRadius: 4, fontSize: 11, color: '#2ecc71' }}>{s}</span>)}</div></div>}
            {wordInfoModal.relatedWords?.length > 0 && <div style={{ marginBottom: 14 }}><div style={{ fontSize: 10, color: '#887060', marginBottom: 3, fontWeight: 600 }}>СРОДНИ ЗБОРОВИ</div><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{wordInfoModal.relatedWords.map((s, i) => <span key={i} style={{ padding: '2px 8px', background: 'rgba(212,175,55,0.15)', borderRadius: 4, fontSize: 11, color: S.gold }}>{s}</span>)}</div></div>}
            {wordInfoModal.funFact && <div style={{ padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 6, marginTop: 8 }}><div style={{ fontSize: 10, color: '#887060', marginBottom: 2 }}>💡 ИНТЕРЕСНО</div><div style={{ fontSize: 12, color: '#c8b898' }}>{wordInfoModal.funFact}</div></div>}
          </div>
        </div>
      )}

      {/* JOKER MODAL */}
      {jokerModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ ...S.card, padding: 24, maxWidth: 400 }}>
            <h3 style={{ color: S.gold, margin: '0 0 14px', textAlign: 'center', fontSize: 16 }}>Избери буква за Џокер</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
              {MK_LETTERS.split('').map(l => <button key={l} onClick={() => assignJoker(l)} style={{ width: 34, height: 34, background: '#f5e6c8', border: '1px solid #b8a07a', borderRadius: 4, fontSize: 15, fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit', color: '#2a1808' }}>{l}</button>)}
            </div>
          </div>
        </div>
      )}

      {/* SCOREBOARD */}
      {(() => {
        // During challenge, the opponents are deciding, not the current player
        const isChallenge = screen === 'challenge';
        const decidingPlayers = isChallenge ? players.map((p, i) => i !== currentPlayer && p.type === 'human').map((v, i) => v ? i : -1).filter(i => i >= 0) : [currentPlayer];
        return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
        {players.map((p, i) => {
          const isActive = decidingPlayers.includes(i);
          const isCurrentTurn = i === currentPlayer && !isChallenge;
          const highlighted = isActive || isCurrentTurn;
          const borderColor = isChallenge && isActive ? '#e67e22' : S.gold;
          return (
          <div key={i} style={{ padding: '5px 12px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 8,
            background: highlighted ? (isChallenge && isActive ? 'rgba(230,126,34,0.15)' : 'rgba(212,175,55,0.12)') : 'rgba(0,0,0,0.2)',
            border: highlighted ? `1.5px solid ${borderColor}` : '1px solid rgba(255,255,255,0.05)',
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: highlighted ? (isChallenge && isActive ? '#e67e22' : S.gold) : '#887060' }}>
                {p.type === 'ai' ? '🤖' : '👤'} {p.name} {p.skipPenalty ? '⏭️' : ''}
                {isChallenge && isActive && <span style={{ fontSize: 9, marginLeft: 4 }}>⚖️</span>}
                {isCurrentTurn && <span style={{ fontSize: 9, marginLeft: 4 }}>🎯</span>}
              </div>
              <div style={{ fontSize: 8, color: '#665040' }}>возраст: {p.age}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: S.gold }}>{p.score}</div>
          </div>
          );
        })}
        <div style={{ padding: '5px 10px', background: 'rgba(0,0,0,0.25)', borderRadius: 7, textAlign: 'center' }}>
          <div style={{ fontSize: 8, color: '#665040' }}>Кеса</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#a89070' }}>{tileBag.length}</div>
        </div>
      </div>
        );
      })()}

      {/* MESSAGE */}
      <div style={{ textAlign: 'center', padding: '4px 12px', fontSize: 11, maxWidth: 700, margin: '0 auto 4px', background: 'rgba(0,0,0,0.2)', borderRadius: 5, minHeight: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isAIThinking && <span style={{ display: 'inline-block', animation: 'aispin 1s linear infinite', marginRight: 5 }}>🤖</span>}
        {message}
      </div>

      {/* BOARD */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 5 }}>
        <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(15, 38px)', gridTemplateRows: 'repeat(15, 38px)', gap: 1, background: '#0a0806', padding: 5, borderRadius: 8, border: `1.5px solid rgba(212,175,55,0.15)` }}>
          {Array(15).fill(null).map((_, row) =>
            Array(15).fill(null).map((_, col) => {
              const cell = board[row][col]; const bonus = BONUS_MAP[row][col];
              const isPlaced = placedTiles.some(p => p.row === row && p.col === col);
              const bi = BONUS_COLORS[bonus];
              if (cell) return (
                <div key={`${row}-${col}`} className="board-cell"
                  onClick={() => isPlaced && cp?.type === 'human' ? removePlacedTile(row, col) : null}
                  style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isPlaced ? 'linear-gradient(145deg, #fff3c4, #f6e58d)' : 'linear-gradient(145deg, #f0dfc0, #d8c098)', border: isPlaced ? `2px solid ${S.gold}` : '1px solid #b8a07a', borderRadius: 3, position: 'relative', fontWeight: 'bold', fontSize: 15, color: cell.letter === '★' ? '#8b0000' : '#2a1808', cursor: isPlaced && cp?.type === 'human' ? 'pointer' : 'default', fontFamily: 'inherit' }}>
                  {cell.displayLetter || cell.letter}
                  <span style={{ position: 'absolute', bottom: 0, right: 2, fontSize: 6, color: '#888' }}>{cell.letter === '★' ? '' : cell.points}</span>
                </div>
              );
              return (
                <div key={`${row}-${col}`} className="board-cell"
                  onClick={() => selectedTile && cp?.type === 'human' ? placeTileOnBoard(row, col) : null}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnBoard(e, row, col)}
                  style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bi ? bi.bg : '#1a2a1a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, cursor: (selectedTile || draggedTile) ? 'pointer' : 'default', opacity: bi ? 1 : 0.6 }}>
                  <span style={{ fontSize: bonus === 'ST' ? 14 : 8, color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontFamily: 'sans-serif' }}>{bi?.label || ''}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* FORMED WORDS PREVIEW */}
      {formedWords.length > 0 && screen === 'playing' && (
        <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 4px', padding: '5px 12px', background: 'rgba(46,204,113,0.1)', borderRadius: 5, border: '1px solid rgba(46,204,113,0.2)' }}>
          <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            {formedWords.map((w, i) => (
              <span key={i} style={{ padding: '2px 8px', background: 'rgba(46,204,113,0.15)', borderRadius: 4, fontSize: 12, color: '#2ecc71', fontWeight: 600 }}>{w.word}</span>
            ))}
            <span style={{ color: '#2ecc71', fontSize: 13, fontWeight: 700 }}>= {turnScore} п.</span>
            {formedWords.length > 1 && <span style={{ color: '#887060', fontSize: 10 }}>({formedWords.length} зборови)</span>}
          </div>
        </div>
      )}

      {/* AI MOVE DISPLAY */}
      {aiMoveDisplay && (
        <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 4px', padding: '6px 12px', background: 'rgba(41,128,185,0.1)', borderRadius: 5, border: '1px solid rgba(41,128,185,0.2)' }}>
          <div style={{ color: '#3498db', fontSize: 12 }}>🤖 AI: <strong>{aiMoveDisplay.words}</strong> (+{aiMoveDisplay.score} п.)</div>
          {aiMoveDisplay.explanation && <div style={{ color: '#887060', fontSize: 10, marginTop: 2 }}>{aiMoveDisplay.explanation}</div>}
        </div>
      )}

      {/* CHALLENGE PANEL */}
      {screen === 'challenge' && (() => {
        // Determine which opponent(s) are deciding
        const opponents = players.filter((p, i) => i !== currentPlayer && p.type === 'human');
        const opponentNames = opponents.map(o => o.name).join(', ');
        return (
        <div style={{ maxWidth: 700, margin: '0 auto 5px', padding: 14, background: 'rgba(192,57,43,0.08)', borderRadius: 8, border: '1px solid rgba(192,57,43,0.2)' }}>
          {!challengeResult && !isValidating && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: S.gold, fontWeight: 700, marginBottom: 4 }}>⚖️ {opponentNames} — твој ред да одлучиш!</div>
              <div style={{ fontSize: 11, color: '#a89070', marginBottom: 8 }}>{players[currentPlayer].name} ги постави овие зборови. Прифати, предизвикај, или побарај инфо:</div>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                {formedWords.map((w, i) => (
                  <div key={i} style={{ display: 'flex', gap: 2 }}>
                    <span style={{ padding: '4px 10px', background: 'rgba(46,204,113,0.15)', borderRadius: '4px 0 0 4px', fontSize: 13, color: '#2ecc71', fontWeight: 700, display: 'flex', alignItems: 'center' }}>{w.word}</span>
                    <button onClick={() => requestWordInfo(w.word)} style={{ ...S.btnSm('rgba(41,128,185,0.3)'), borderRadius: 0, color: '#3498db', fontSize: 13, padding: '4px 6px' }} title="Повеќе инфо">📖</button>
                    <button onClick={() => challengeWord(w.word)} style={{ ...S.btnSm('#c0392b'), borderRadius: '0 4px 4px 0', padding: '4px 8px' }}>🔍 Предизвикај</button>
                  </div>
                ))}
              </div>
              <button onClick={() => finalizeTurn()} style={S.btn('#27ae60')}>✅ Прифати ги сите ({turnScore} п.)</button>
              {isLoadingInfo && <div style={{ color: S.gold, fontSize: 11, marginTop: 8 }}><span style={{ display: 'inline-block', animation: 'aispin 1s linear infinite', marginRight: 4 }}>📖</span>Се вчитува инфо...</div>}
            </div>
          )}
          {isValidating && <div style={{ textAlign: 'center', color: S.gold, fontSize: 12 }}><span style={{ display: 'inline-block', animation: 'aispin 1s linear infinite', marginRight: 5 }}>🤖</span>Агент пребарува во МК речници...</div>}
          {challengeResult && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, padding: 8, borderRadius: 6, marginBottom: 8, background: 'rgba(0,0,0,0.2)', color: challengeResult.valid ? '#2ecc71' : challengeResult.valid === false ? '#e74c3c' : '#f39c12' }}>
                <div style={{ fontSize: 16, marginBottom: 2 }}>{challengeResult.valid ? '✅' : challengeResult.valid === false ? '❌' : '⚠️'} {challengeResult.word}</div>
                <div style={{ fontSize: 11, color: '#a89070' }}>{challengeResult.explanation}</div>
                {challengeResult.definition && <div style={{ fontSize: 11, color: '#c8b898', fontStyle: 'italic', marginTop: 3 }}>📖 {challengeResult.definition}</div>}
                {challengeResult.source && <div style={{ fontSize: 9, color: '#665040', marginTop: 2 }}>Извор: {challengeResult.source}</div>}
                {challengeResult.valid === true && <div style={{ fontSize: 10, color: '#e67e22', marginTop: 5, fontWeight: 600 }}>⚠️ {opponentNames} го губи следниот ред (неуспешен предизвик)!</div>}
                {challengeResult.valid === false && <div style={{ fontSize: 10, color: '#e74c3c', marginTop: 5, fontWeight: 600 }}>✅ Успешен предизвик! {players[currentPlayer].name} ги враќа плочките.</div>}
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {challengeResult.valid === true && <>
                  <button onClick={() => { setChallengeResult(null); finalizeTurn(); }} style={S.btn('#27ae60')}>Продолжи</button>
                  <button onClick={() => requestWordInfo(challengeResult.word)} style={S.btn('rgba(41,128,185,0.6)')}>📖 Повеќе инфо</button>
                </>}
                {challengeResult.valid === false && <>
                  <button onClick={() => { setChallengeResult(null); returnTilesToRack(); setScreen('playing'); setMessage(`${players[currentPlayer].name} — пробај повторно!`); }} style={S.btn('#e67e22')}>🔄 {players[currentPlayer].name} враќа плочки</button>
                </>}
                {challengeResult.valid === null && <>
                  <button onClick={() => { setChallengeResult(null); finalizeTurn(); }} style={S.btn('#27ae60')}>Прифати</button>
                  <button onClick={() => { setChallengeResult(null); returnTilesToRack(); setScreen('playing'); setMessage(`${players[currentPlayer].name} — пробај повторно!`); }} style={S.btn('#e67e22')}>🔄 Врати</button>
                </>}
              </div>
            </div>
          )}
        </div>
        );
      })()}

      {/* PLAYER RACK with Drag & Drop */}
      {screen === 'playing' && cp?.type === 'human' && !isAIThinking && isMyTurn && (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div
            onDragOver={handleDragOver}
            onDrop={handleDropOnRack}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 14px', ...S.card, marginBottom: 6 }}
          >
            <div style={{ color: '#665040', fontSize: 9, marginRight: 4, minWidth: 50 }}>{(players[myPlayerIndex] ?? players[currentPlayer])?.name}:</div>
            {(players[myPlayerIndex] ?? players[currentPlayer])?.rack?.map((tile, i) => (
              <div key={tile.id} className="tile-rack"
                draggable
                onDragStart={(e) => handleDragStart(e, tile, i)}
                onDragEnd={() => setDraggedTile(null)}
                onClick={() => selectTile(tile, i)}
                style={tileStyle(tile, selectedTile?.id === tile.id, draggedTile?.id === tile.id)}
              >
                {getDisplayLetter(tile)}
                <span style={{ position: 'absolute', bottom: 1, right: 2, fontSize: 7, color: '#666' }}>{tile.letter === '★' ? '' : tile.points}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            {placedTiles.length > 0 && <button onClick={confirmPlacement} style={S.btn('linear-gradient(135deg, #1e8449, #27ae60)')}>✓ Потврди ({turnScore} п.)</button>}
            <button onClick={passTurn} style={S.btnO}>Пас</button>
            {placedTiles.length === 0 && (
              <button
                onClick={exchangeTiles}
                disabled={cp.score < 5}
                style={{
                  ...S.btnO,
                  opacity: cp.score < 5 ? 0.35 : 1,
                  cursor: cp.score < 5 ? 'not-allowed' : 'pointer',
                  borderColor: cp.score < 5 ? 'rgba(255,255,255,0.1)' : 'rgba(212,175,55,0.4)',
                }}
                title={cp.score < 5 ? 'Потребни се 5 поени за замена' : 'Замени ги сите букви (-5 поени)'}
              >
                🔄 Замени (-5 п.)
              </button>
            )}
            {placedTiles.length > 0 && (
              <span style={{ fontSize: 9, color: '#665040', fontStyle: 'italic' }}>Замена е можна само пред поставување</span>
            )}
          </div>
        </div>
      )}

      {/* GAME LOG */}
      {gameLog.length > 0 && (
        <div style={{ maxWidth: 700, margin: '6px auto 0', padding: '5px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 5, maxHeight: 70, overflow: 'auto' }}>
          {gameLog.slice(-6).map((e, i) => <div key={i} style={{ color: '#665040', fontSize: 9 }}>{e}</div>)}
        </div>
      )}
    </div>
  );
}