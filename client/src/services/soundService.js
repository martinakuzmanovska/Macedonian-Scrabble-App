import * as Tone from "tone";
import { BONUS_MAP } from "../game/constants.js";

let audioStarted = false;

async function ensureAudio() {
  if (!audioStarted) {
    await Tone.start();
    audioStarted = true;
  }
}

export const SFX = {
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

export function playBonusSound(row, col) {
  const bonus = BONUS_MAP[row]?.[col];
  if (bonus === "TW") SFX.bonusTW();
  else if (bonus === "TL") SFX.bonusTL();
  else if (bonus === "DW" || bonus === "ST") SFX.bonusDW();
  else if (bonus === "DL") SFX.bonusDL();
  else SFX.tileDrop();
}
