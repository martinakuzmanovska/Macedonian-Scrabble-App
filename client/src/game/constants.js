// ═══════════════════════════════════════════
// MACEDONIAN SCRABBLE — CONSTANTS
// Pure data. No logic, no side effects.
// Safe to import on server or client.
// ═══════════════════════════════════════════

export const TILE_CONFIG = {
  '★': { count: 2,  points: 0  },
  'А': { count: 9,  points: 1  }, 'Е': { count: 6, points: 1 },
  'И': { count: 7,  points: 2  }, 'О': { count: 7, points: 2 },
  'Н': { count: 6,  points: 2  }, 'Р': { count: 6, points: 2 },
  'С': { count: 5,  points: 3  }, 'Т': { count: 5, points: 3 }, 'У': { count: 4, points: 3 },
  'В': { count: 4,  points: 4  }, 'К': { count: 4, points: 4 }, 'Л': { count: 4, points: 4 },
  'П': { count: 3,  points: 5  },
  'Г': { count: 2,  points: 6  }, 'Д': { count: 3, points: 6 }, 'М': { count: 3, points: 6 },
  'Б': { count: 2,  points: 7  }, 'З': { count: 2, points: 7 }, 'Ј': { count: 2, points: 7 },
  'Ц': { count: 2,  points: 8  }, 'Ч': { count: 2, points: 8 },
  'Ж': { count: 1,  points: 9  }, 'Ф': { count: 1, points: 9 }, 'Ш': { count: 1, points: 9 },
  'Ѓ': { count: 1,  points: 10 }, 'Ѕ': { count: 1, points: 10 }, 'Љ': { count: 1, points: 10 },
  'Њ': { count: 1,  points: 10 }, 'Ќ': { count: 1, points: 10 }, 'Џ': { count: 1, points: 10 },
  'Х': { count: 1,  points: 10 },
};

export const MK_LETTERS = 'АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШ';

export const BONUS_MAP = [
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

export const BONUS_COLORS = {
  'TW': { bg: '#c0392b', label: 'ТЗ' },
  'TL': { bg: '#2980b9', label: 'ТБ' },
  'DW': { bg: '#e67e22', label: 'ДЗ' },
  'DL': { bg: '#27ae60', label: 'ДБ' },
  'ST': { bg: '#e67e22', label: '★' },
};

// ─── Pure helpers ───────────────────────────

/** Points for a given letter. Joker (★) always 0. */
export const getPoints = (letter) =>
  (!letter || letter === '★') ? 0 : (TILE_CONFIG[letter]?.points ?? 0);

/** Render the board as a debug string. Used by AI prompt builder. */
export function boardToText(boardState) {
  let t = '   ';
  for (let c = 0; c < 15; c++) t += String(c).padStart(3);
  t += '\n';
  for (let r = 0; r < 15; r++) {
    t += String(r).padStart(2) + ' ';
    for (let c = 0; c < 15; c++) {
      const cell = boardState[r][c];
      t += (cell ? (cell.displayLetter || cell.letter) : '.').padStart(3);
    }
    t += '\n';
  }
  return t;
}

/** System prompt fragment for AI difficulty based on opponent age. */
export function getAIDifficultyPrompt(age) {
  if (age <= 8)  return `Играш со дете од ${age} год. Користи МНОГУ кратки ЛИТЕРАТУРНИ зборови (2-3 букви): ОД, НА, ДА, НЕ, ОКО, ДЕН, СОН, НОС, ДОМ, СОЛ, МИР, ЛЕТ, ВОЗ, РОД, ТОН, ЛОВ, ВОЛ, СОК. Понекогаш направи грешка.`;
  if (age <= 12) return `Играш со дете од ${age} год. Користи едноставни ЛИТЕРАТУРНИ зборови (3-5 букви): МОСТ, РЕКА, СЕЛО, ЛЕТО, ПОЛЕ, ВОДА, ДРВО, НОГА, РАКА, КНИГА, МАСА, КУЌА, СОНЦЕ.`;
  if (age <= 17) return `Играш со тинејџер од ${age} год. Користи средно-тешки ЛИТЕРАТУРНИ зборови (4-7 букви): ПОБЕДА, ПРОЛЕТ, ШКОЛО, КАМЕН, ПЕСНА, ЈУНАК, ДРЖАВА, ПРИРОДА.`;
  return `Играш со возрасен. Користи сложени ЛИТЕРАТУРНИ зборови. Искористи бонус полиња. Максимални поени.`;
}