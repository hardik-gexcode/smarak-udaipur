import type { Lang } from '../data/sites';
import { api, apiBase } from './api';
import { localeOf } from './langs';

let token = 0;
let audio: HTMLAudioElement | null = null;
const cloudRetryAfter = new Map<string, number>();

export const splitSentences = (t: string) =>
  (t.match(/[^.।!?]+[.।!?]*/g) ?? [t]).map((s) => s.trim()).filter(Boolean);

export function stopSpeech() {
  token++;
  audio?.pause();
  audio = null;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

/* ---------- Device voice selection, preferring Indian English and Hindi ---------- */
const norm = (l: string) => l.toLowerCase().replace('_', '-');
const PREFERRED = /(neerja|heera|ravi|prabhat|swara|madhur|kalpana|hemant|lekha|rishi|veena|google|natural|online)/i;

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!('speechSynthesis' in window)) return Promise.resolve([]);
  voicesPromise ??= new Promise((resolve) => {
    const ready = speechSynthesis.getVoices();
    if (ready.length) return resolve(ready);
    const done = () => { const v = speechSynthesis.getVoices(); if (!v.length) voicesPromise = null; resolve(v); };
    speechSynthesis.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 1500);
  });
  return voicesPromise;
}

export const voicesFor = (lang: Lang, all: SpeechSynthesisVoice[]) =>
  all
    .filter((v) => (lang === 'en' ? norm(v.lang) === 'en-in' : norm(v.lang).startsWith(lang)))
    .sort((a, b) => Number(PREFERRED.test(b.name)) - Number(PREFERRED.test(a.name)));

const prefKey = (lang: Lang) => `smarak.voice.${lang}`;
export const savedVoice = (lang: Lang) => localStorage.getItem(prefKey(lang)) ?? '';
export const saveVoice = (lang: Lang, name: string) => localStorage.setItem(prefKey(lang), name);
export const gender = () => (localStorage.getItem('smarak.voice.gender') === 'm' ? 'm' : 'f');
export const setGender = (g: 'f' | 'm') => localStorage.setItem('smarak.voice.gender', g);
export const cloudAvailable = apiBase !== null;

function pickVoice(lang: Lang, all: SpeechSynthesisVoice[]) {
  const list = voicesFor(lang, all);
  return list.find((v) => v.name === savedVoice(lang)) ?? list[0] ?? (lang === 'en' ? all.find((v) => norm(v.lang).startsWith('en')) : undefined);
}

/* ---------- Cloud speech for Indian English, Hindi, and supported selected languages ---------- */
const cache = new Map<string, string>();
async function cloud(text: string, lang: Lang): Promise<string | null> {
  const key = `${lang}|${gender()}|${text}`;
  if (cache.has(key)) return cache.get(key)!;
  const r = await api<{ audio?: string }>('/api/tts', { text, lang, locale: localeOf(lang), gender: gender() }, 7000);
  if (!r.ok || !r.data?.audio) return null;
  const src = `data:audio/mp3;base64,${r.data.audio}`;
  cache.set(key, src);
  return src;
}

const play = (src: string) =>
  new Promise<boolean>((resolve) => {
    audio = new Audio(src);
    audio.onended = () => resolve(true);
    audio.onerror = () => resolve(false);
    audio.play().catch(() => resolve(false));
  });

function device(text: string, lang: Lang, voice?: SpeechSynthesisVoice) {
  return new Promise<void>((resolve) => {
    const readTime = Math.max(1800, text.length * 55);
    if (!('speechSynthesis' in window)) return void setTimeout(resolve, readTime);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang ?? localeOf(lang);
    if (voice) u.voice = voice;
    u.rate = 0.95;
    let started = false, done = false;
    let hardStop: ReturnType<typeof setTimeout> | undefined;
    const fin = () => { if (!done) { done = true; clearTimeout(watchdog); clearTimeout(hardStop); resolve(); } };
    // If the engine never starts (no voice installed), keep captions moving at reading speed.
    const watchdog = setTimeout(() => { if (!started) { speechSynthesis.cancel(); setTimeout(fin, readTime); } }, 2500);
    hardStop = setTimeout(() => { speechSynthesis.cancel(); fin(); }, readTime * 2 + 5000);
    u.onstart = () => { started = true; };
    u.onend = fin;
    u.onerror = fin;
    speechSynthesis.resume();
    speechSynthesis.speak(u);
  });
}

/** Speaks sentence by sentence with live captions, using cloud speech when available and device voices as fallback. */
export async function speakSeq(sentences: string[], lang: Lang, onSentence: (i: number) => void, onDone: () => void) {
  stopSpeech();
  const mine = token;
  // Mobile browsers often return an empty voice list briefly. Waiting for voiceschanged
  // here also loses the tap's audio activation, so use the current list and speak now.
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const voice = pickVoice(lang, 'speechSynthesis' in window ? speechSynthesis.getVoices() : []);
  if (mine !== token) return;
  for (let i = 0; i < sentences.length; i++) {
    if (mine !== token) return;
    onSentence(i);
    // Keep phone playback inside the click/tap that started narration. A cloud request
    // before speech can outlive the browser's user-activation window and remain silent.
    if (mobile) {
      await device(sentences[i], lang, voice);
      continue;
    }
    let played = false;
    if (apiBase !== null && (cloudRetryAfter.get(lang) ?? 0) <= Date.now() && navigator.onLine) {
      const src = await cloud(sentences[i], lang);
      if (mine !== token) return;
      if (src) {
        if (sentences[i + 1]) void cloud(sentences[i + 1], lang);
        played = await play(src);
        if (mine !== token) return;
      } else cloudRetryAfter.set(lang, Date.now() + 30000);
    }
    if (!played) await device(sentences[i], lang, voice);
  }
  if (mine === token) onDone();
}

type SR = new () => { lang: string; interimResults: boolean; onresult: (e: any) => void; onend: () => void; onerror: () => void; start(): void };
const SpeechRec: SR | undefined = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
export const canListen = !!SpeechRec;

export function listen(lang: Lang, onText: (t: string) => void, onEnd: () => void) {
  if (!SpeechRec) return onEnd();
  const r = new SpeechRec();
  r.lang = localeOf(lang);
  r.interimResults = false;
  r.onresult = (e) => onText(e.results[0][0].transcript);
  r.onend = onEnd;
  r.onerror = onEnd;
  r.start();
}
