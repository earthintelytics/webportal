/**
 * Plain-language schedules for the pipeline (onboarding + Scheduler page).
 * The admin picks "every N days / weekly / monthly at a time"; the cron rule
 * is generated here and only shown under technical details.
 */
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// startDay: first day of the month for 'every N days' (organisations start on different days so runs are spread out)
export const DEFAULT_SCHEDULE = { mode: 'days', every: 5, startDay: 1, weekday: 1, monthday: 1, hour: 3, minute: 0 };

/** Picker state → cron. offsetMin staggers several jobs (e.g. estates 15 min apart). */
export function cronFor(s, offsetMin = 0) {
  if (s.mode === 'custom') return String(s.custom || '').trim();
  const total = (s.minute || 0) + offsetMin;
  const m = total % 60, h = (s.hour + Math.floor(total / 60)) % 24;
  if (s.mode === 'weekly') return `${m} ${h} * * ${s.weekday}`;
  if (s.mode === 'monthly') return `${m} ${h} ${s.monthday} * *`;
  if (s.mode === 'days' && Number(s.every) === 1) return `${m} ${h} * * *`;
  const start = Number(s.startDay) || 1;
  return start > 1 ? `${m} ${h} ${start}-31/${s.every} * *` : `${m} ${h} */${s.every} * *`;
}

/** Cron → picker state, for the rules this app writes; null for anything else (custom). */
export function parseCron(expr) {
  if (cronError(expr)) return null;
  const p = String(expr || '').trim().split(/\s+/);
  if (p.length !== 5 || !/^\d+$/.test(p[0]) || !/^\d+$/.test(p[1]) || p[3] !== '*') return null;
  const base = { minute: +p[0], hour: +p[1] };
  if (p[2] === '*' && p[4] === '*') return { ...DEFAULT_SCHEDULE, ...base, mode: 'days', every: 1 };
  if (/^\*\/\d+$/.test(p[2]) && p[4] === '*') return { ...DEFAULT_SCHEDULE, ...base, mode: 'days', every: +p[2].slice(2), startDay: 1 };
  const range = p[2].match(/^(\d+)-31\/(\d+)$/); // e.g. 2-31/5: every 5 days from day 2
  if (range && p[4] === '*') return { ...DEFAULT_SCHEDULE, ...base, mode: 'days', every: +range[2], startDay: +range[1] };
  if (p[2] === '*' && /^[0-6]$/.test(p[4])) return { ...DEFAULT_SCHEDULE, ...base, mode: 'weekly', weekday: +p[4] };
  if (/^\d+$/.test(p[2]) && p[4] === '*') return { ...DEFAULT_SCHEDULE, ...base, mode: 'monthly', monthday: +p[2] };
  return null;
}

const hhmm = (s) => `${String(s.hour).padStart(2, '0')}:${String(s.minute || 0).padStart(2, '0')}`;

/** Picker state → words ("every 5 days at 03:00"). */
export function scheduleText(s) {
  if (!s) return 'Custom rule';
  if (s.mode === 'custom') { const simple = parseCron(s.custom); return simple ? scheduleText(simple) : `Custom rule (${String(s.custom || '').trim()})`; }
  if (s.mode === 'weekly') return `Every ${WEEKDAYS[s.weekday]} at ${hhmm(s)}`;
  if (s.mode === 'monthly') return `On day ${s.monthday} of every month at ${hhmm(s)}`;
  if (Number(s.every) === 1) return `Every day at ${hhmm(s)}`;
  return `Every ${s.every} days${(Number(s.startDay) || 1) > 1 ? `, from day ${s.startDay} of the month` : ''} at ${hhmm(s)}`;
}

/** Next run (server-local time) for the rules parseCron understands; null otherwise. */
export function nextRun(expr, from = new Date()) {
  const s = parseCron(expr);
  if (!s) return nextRuns(expr, 1, from)[0] || null; // any other valid rule
  const d = new Date(from);
  d.setSeconds(0, 0);
  for (let i = 0; i < 62 * 24 * 60; i += 60) { // check each hour slot for 62 days
    const t = new Date(d.getTime() + i * 60000);
    t.setMinutes(s.minute || 0);
    if (t <= from || t.getHours() !== s.hour) continue;
    const dom = t.getDate(), dow = t.getDay();
    if (s.mode === 'weekly' && dow !== s.weekday) continue;
    if (s.mode === 'monthly' && dom !== s.monthday) continue;
    const start = Number(s.startDay) || 1;
    if (s.mode === 'days' && s.every > 1 && (dom < start || (dom - start) % s.every !== 0)) continue;
    return t;
  }
  return null;
}

// ── Any cron rule (custom): validation and next runs ────────────────────────
// Standard 5 fields: minute hour day-of-month month day-of-week, each "*",
// numbers, lists (1,15), ranges (1-5) and steps (*/5, 2-31/5).
const FIELDS = [['minute', 0, 59], ['hour', 0, 23], ['day of month', 1, 31], ['month', 1, 12], ['day of week', 0, 6]];

function parseField(text, min, max) {
  const values = new Set();
  for (const part of text.split(',')) {
    const m = part.match(/^(\*|\d+)(?:-(\d+))?(?:\/(\d+))?$/);
    if (!m) return null;
    let lo = m[1] === '*' ? min : +m[1];
    let hi = m[2] !== undefined ? +m[2] : (m[1] === '*' || m[3] ? max : lo);
    const step = m[3] ? +m[3] : 1;
    if (lo < min || hi > max || lo > hi || step < 1) return null;
    for (let v = lo; v <= hi; v += step) values.add(v === 7 && max === 6 ? 0 : v);
  }
  return values;
}

/** Returns null when valid, or a plain message saying what is wrong. */
export function cronError(expr) {
  const p = String(expr || '').trim().split(/\s+/);
  if (p.length !== 5) return 'A rule has 5 parts: minute, hour, day of month, month, day of week (e.g. "0 3 */5 * *").';
  for (let i = 0; i < 5; i++) {
    const [name, min, max] = FIELDS[i];
    if (!parseField(p[i], min, max)) return `The ${name} part "${p[i]}" is not valid (allowed ${min}–${max}, *, lists, ranges, steps).`;
  }
  return null;
}

/** Next n run times for any valid rule (server-local time). */
export function nextRuns(expr, n = 3, from = new Date()) {
  if (cronError(expr)) return [];
  const p = String(expr).trim().split(/\s+/);
  const [mi, ho, dom, mon, dow] = p.map((x, i) => parseField(x, FIELDS[i][1], FIELDS[i][2]));
  const domAny = p[2] === '*', dowAny = p[4] === '*';
  const out = [];
  const t = new Date(from); t.setSeconds(0, 0); t.setMinutes(t.getMinutes() + 1);
  for (let i = 0; i < 366 * 24 * 60 && out.length < n; i++, t.setMinutes(t.getMinutes() + 1)) {
    if (!mon.has(t.getMonth() + 1) || !ho.has(t.getHours()) || !mi.has(t.getMinutes())) continue;
    // cron rule: when both day fields are restricted, either may match
    const dayOk = domAny && dowAny ? true : domAny ? dow.has(t.getDay()) : dowAny ? dom.has(t.getDate()) : (dom.has(t.getDate()) || dow.has(t.getDay()));
    if (dayOk) out.push(new Date(t));
  }
  return out;
}
