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
  if (s.mode === 'weekly') return `Every ${WEEKDAYS[s.weekday]} at ${hhmm(s)}`;
  if (s.mode === 'monthly') return `On day ${s.monthday} of every month at ${hhmm(s)}`;
  if (Number(s.every) === 1) return `Every day at ${hhmm(s)}`;
  return `Every ${s.every} days${(Number(s.startDay) || 1) > 1 ? `, from day ${s.startDay} of the month` : ''} at ${hhmm(s)}`;
}

/** Next run (server-local time) for the rules parseCron understands; null otherwise. */
export function nextRun(expr, from = new Date()) {
  const s = parseCron(expr);
  if (!s) return null;
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
