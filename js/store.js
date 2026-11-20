import { SKILLS, DECKS } from './content.js';

const KEY = 'qudra.v1';
const DAY = 86400000;
export const today = () => new Date().toISOString().slice(0, 10);
const dayNum = (s) => Math.floor(new Date(s + 'T00:00:00Z').getTime() / DAY);

const fresh = () => ({
  v: 1, onboarded: false, lang: (navigator.language || 'ar').slice(0, 2), name: '', goal: '', level: 'beginner', minutes: 20,
  path: [], done: {}, xp: 0, events: [], milestones: [], mind: [], career: {}, cv: {}, memories: [], memOn: true, custom: [], shared: 0, voice: false, streak: 0, lastDay: '', badges: [], projects: [], journal: [], words: {}, thinkDone: {}, fx3d: true, certs: [],
});

export let state = fresh();
export const allSkills = () => [...SKILLS, ...(state.custom || [])];
export function logEvent(type, text) { state.events.unshift({ d: today(), type, text: String(text).slice(0, 140) }); state.events = state.events.slice(0, 200); }
if (!['ar', 'fr', 'en'].includes(state.lang)) state.lang = 'ar';

const listeners = new Set();
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = Object.assign(fresh(), JSON.parse(raw));
  } catch (e) { /* storage unavailable */ }
  return state;
}
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  listeners.forEach((f) => f(state));
}
export function exportJSON() { return JSON.stringify(state, null, 2); }
export function importJSON(text) {
  const obj = JSON.parse(text);
  if (!obj || typeof obj !== 'object' || obj.v !== 1) throw new Error('bad');
  state = Object.assign(fresh(), obj);
  save();
}
export function reset() {
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  state = fresh();
  if (!['ar', 'fr', 'en'].includes(state.lang)) state.lang = 'ar';
  save();
}

// ---- XP / level / streak / badges
export const levelOf = (xp) => Math.floor(Math.sqrt(xp / 50)) + 1;
export const levelProgress = (xp) => { const l = levelOf(xp); const a = 50 * (l - 1) ** 2, b = 50 * l ** 2; return (xp - a) / (b - a); };

export const BADGES = [
  { id: 'first', icon: '🌱', k: 'b_first', test: (s) => doneCount(s) >= 1 },
  { id: 'five', icon: '🔥', k: 'b_five', test: (s) => doneCount(s) >= 5 },
  { id: 'skill', icon: '🏆', k: 'b_skill', test: (s) => [...SKILLS, ...(s.custom || [])].some((k) => skillDone(k, s) === k.lessons.length) },
  { id: 'think', icon: '🧠', k: 'b_think', test: (s) => Object.keys(s.thinkDone).length >= 1 },
  { id: 'maker', icon: '🛠️', k: 'b_maker', test: (s) => s.projects.length >= 1 },
  { id: 'words', icon: '🔤', k: 'b_words', test: (s) => wordsLearned(s) >= 10 },
  { id: 'streak3', icon: '⚡', k: 'b_streak3', test: (s) => s.streak >= 3 },
  { id: 'journal', icon: '📓', k: 'b_journal', test: (s) => s.journal.length >= 1 },
  { id: 'mind', icon: '🎯', k: 'b_mind', test: (s) => s.mind.length >= 3 },
  { id: 'career', icon: '💼', k: 'b_career', test: (s) => !!(s.career && s.career.top) },
  { id: 'share', icon: '🌐', k: 'b_share', test: (s) => s.shared >= 1 },
  { id: 'course', icon: '✨', k: 'b_course', test: (s) => (s.custom || []).length >= 1 },
];

export const doneCount = (s = state) => Object.keys(s.done).length;
export const skillDone = (k, s = state) => k.lessons.filter((l) => s.done[l.id]).length;
export const wordsLearned = (s = state) => Object.values(s.words).filter((w) => w.box >= 3).length;

export function touchStreak() {
  const t = today();
  if (state.lastDay === t) return;
  if (state.lastDay && dayNum(t) - dayNum(state.lastDay) === 1) state.streak += 1;
  else state.streak = 1;
  state.lastDay = t;
}

/** Add XP; returns events for toasts. */
export function award(n) {
  const events = [];
  const before = levelOf(state.xp);
  touchStreak();
  state.xp += n;
  events.push({ type: 'xp', n });
  if (levelOf(state.xp) > before) events.push({ type: 'level', n: levelOf(state.xp) });
  for (const b of BADGES) {
    if (!state.badges.includes(b.id) && b.test(state)) { state.badges.push(b.id); events.push({ type: 'badge', b }); }
  }
  save();
  return events;
}

// ---- path
export function pathLessons() {
  const out = [];
  for (const id of state.path) { const sk = allSkills().find((k) => k.id === id); if (sk) sk.lessons.forEach((l) => out.push({ sk, l })); }
  return out;
}
export const nextLesson = () => pathLessons().find((x) => !state.done[x.l.id]) || null;
export function perDay() { return state.minutes >= 30 ? 3 : state.minutes >= 20 ? 2 : 1; }
export function finishDate() {
  const left = pathLessons().filter((x) => !state.done[x.l.id]).length;
  if (!left) return null;
  return new Date(Date.now() + Math.ceil(left / perDay()) * DAY);
}

// ---- Leitner spaced repetition
const INTERVALS = [0, 0, 1, 2, 4, 8];
export function wordKey(deckId, i) { return deckId + ':' + i; }
export function dueWords(deckId) {
  const deck = DECKS.find((d) => d.id === deckId); const t = today();
  return deck.words.map((w, i) => ({ w, i, st: state.words[wordKey(deckId, i)] })).filter((x) => !x.st || x.st.due <= t);
}
export function gradeWord(deckId, i, ok) {
  const k = wordKey(deckId, i); const st = state.words[k] || { box: 1, due: today() };
  st.box = ok ? Math.min(5, st.box + 1) : 1;
  st.due = new Date(Date.now() + INTERVALS[st.box] * DAY).toISOString().slice(0, 10);
  state.words[k] = st;
  return award(ok ? 2 : 1);
}
