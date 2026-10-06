/**
 * CSV parsing, header matching and row checks for the Farm data page.
 * The same checks run on the server (POST /datasets/{id}/validate); running
 * them here gives instant feedback while the client maps columns.
 */

/** Parse CSV text (quotes, escaped quotes, commas or semicolons, CRLF). */
export function parseCsv(text) {
  const clean = text.replace(new RegExp('^' + String.fromCharCode(0xfeff)), '');
  const firstLine = clean.split(/\r?\n/, 1)[0] || '';
  const delim = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(c => c.trim() !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some(c => c.trim() !== '')) rows.push(row);
  const headers = (rows.shift() || []).map(h => h.trim());
  return { headers, rows: rows.map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()]))) };
}

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Suggest a file header for each of our columns (exact name, alias, then contains). */
export function suggestMapping(columns, headers) {
  const used = new Set();
  const mapping = {};
  const pick = (col, test) => {
    const h = headers.find(x => !used.has(x) && test(norm(x)));
    if (h) { mapping[col.name] = h; used.add(h); }
  };
  for (const col of columns) pick(col, n => n === norm(col.name));
  for (const col of columns) if (!mapping[col.name]) pick(col, n => (col.aliases || []).some(a => norm(a) === n));
  for (const col of columns) if (!mapping[col.name]) pick(col, n => (col.aliases || []).some(a => norm(a).length > 3 && n.includes(norm(a))));
  return mapping;
}

/** Apply a mapping: file rows → rows keyed by our column names. */
export const applyMapping = (rows, mapping) =>
  rows.map(r => Object.fromEntries(Object.entries(mapping).filter(([, h]) => h).map(([col, h]) => [col, r[h] ?? ''])));

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
function toIsoDate(v) {
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) { m = v.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/); if (m) m = [m[0], m[3], m[2], m[1]]; } // DD/MM/YYYY
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}
function toIsoMonth(v) {
  let m = v.match(/^(\d{4})-(\d{1,2})$/);
  if (m && +m[2] >= 1 && +m[2] <= 12) return `${m[1]}-${m[2].padStart(2, '0')}`;
  m = v.match(/^([a-z]{3})[a-z]*[\s-]+(\d{4})$/i);
  if (m && MONTHS.includes(m[1].toLowerCase())) return `${m[2]}-${String(MONTHS.indexOf(m[1].toLowerCase()) + 1).padStart(2, '0')}`;
  const d = toIsoDate(v);
  return d ? d.slice(0, 7) : null;
}

/**
 * Check rows against the column definitions.
 * fieldIndex: { ids: Set of registered block IDs (lower-case), pairs: Set of "estate|block", estates: Set } or null when unknown.
 * Returns { rows (normalised), errors: [{ row, column, message }], unknownIds: [], validCount }.
 */
export function checkRows(rows, columns, fieldIndex) {
  const errors = [];
  const unknown = new Set();
  const out = [];
  // Row key for duplicates: estate + block + period ("A1" may exist in several estates)
  const keyCols = columns.filter(c => ['field_id', 'estate', 'month', 'date', 'season', 'survey_date', 'sample_id'].includes(c.type === 'field_id' ? 'field_id' : c.name));
  const seen = new Map();
  rows.forEach((raw, i) => {
    const rowNo = i + 2; // header is row 1 in the client's file
    const row = {};
    let ok = true;
    const fail = (column, message) => { errors.push({ row: rowNo, column, message }); ok = false; };
    for (const col of columns) {
      const v = String(raw[col.name] ?? '').trim();
      if (!v) { if (col.required) fail(col.name, 'Required value is empty'); continue; }
      switch (col.type) {
        case 'number': case 'year': {
          // "42,5" (comma decimal) → 42.5; "1,250" / "1,250.5" (thousands) → 1250 / 1250.5
          const n = Number(/^-?\d+,\d{1,2}$/.test(v) ? v.replace(',', '.') : v.replace(/,/g, ''));
          if (!Number.isFinite(n)) { fail(col.name, `"${v}" is not a number`); break; }
          if (col.type === 'year' && !Number.isInteger(n)) { fail(col.name, `"${v}" is not a year`); break; }
          if (col.range && (n < col.range[0] || n > col.range[1])) { fail(col.name, `${n} is outside ${col.range[0]}–${col.range[1]}${col.unit ? ' ' + col.unit : ''}`); break; }
          row[col.name] = n; break;
        }
        case 'date': { const d = toIsoDate(v); if (!d) fail(col.name, `"${v}" is not a date (use YYYY-MM-DD or DD/MM/YYYY)`); else row[col.name] = d; break; }
        case 'month': { const m = toIsoMonth(v); if (!m) fail(col.name, `"${v}" is not a month (use YYYY-MM)`); else row[col.name] = m; break; }
        case 'choice': {
          const c = (col.choices || []).find(x => x.toLowerCase() === v.toLowerCase() || x.toLowerCase().slice(0, 3) === v.toLowerCase().slice(0, 3) && v.length >= 3);
          if (!c) fail(col.name, `"${v}" is not one of: ${(col.choices || []).join(', ')}`); else row[col.name] = c; break;
        }
        case 'yesno': {
          const y = ['yes', 'y', 'true', '1'].includes(v.toLowerCase()), n = ['no', 'n', 'false', '0'].includes(v.toLowerCase());
          if (!y && !n) fail(col.name, `"${v}" should be yes or no`); else row[col.name] = y; break;
        }
        default: row[col.name] = v;
      }
    }
    // Registered field IDs (and estate + block pairs when an estate is given)
    const idCol = columns.find(c => c.type === 'field_id');
    if (idCol && row[idCol.name] && fieldIndex?.ids?.size) {
      const id = String(row[idCol.name]).toLowerCase();
      const est = row.estate ? String(row.estate).toLowerCase() : null;
      const known = est && fieldIndex.pairs.size ? fieldIndex.pairs.has(`${est}|${id}`) : fieldIndex.ids.has(id);
      if (!known) { unknown.add(est ? `${row.estate} / ${row[idCol.name]}` : row[idCol.name]); fail(idCol.name, `"${row[idCol.name]}"${est ? ` in ${row.estate}` : ''} is not a registered block`); }
    }
    // Duplicates on the row key (ID + period)
    if (keyCols.length) {
      const key = keyCols.map(c => row[c.name] ?? '').join('|');
      if (key.replace(/\|/g, '')) {
        if (seen.has(key)) fail(keyCols[0].name, `Duplicate of row ${seen.get(key)}`); else seen.set(key, rowNo);
      }
    }
    out.push(row);
    if (ok) row.__ok = true;
  });
  return { rows: out, errors, unknownIds: [...unknown], validCount: out.filter(r => r.__ok).length };
}

/** A one-row CSV template with our headers and an example row. */
export function templateCsv(columns) {
  const q = (s) => /[",;\n]/.test(s) ? `"${String(s).replace(/"/g, '""')}"` : s;
  return `${columns.map(c => c.name).join(',')}\n${columns.map(c => q(c.example ?? '')).join(',')}\n`;
}

/** Index of registered blocks from the plots API (plot_id / name, with estate when present). */
export function buildFieldIndex(plots) {
  if (!Array.isArray(plots) || !plots.length) return null;
  const ids = new Set(), pairs = new Set(), estates = new Set();
  for (const p of plots) {
    const idVals = [p.plot_id, p.name, p.bloc_id].filter(Boolean).map(v => String(v).toLowerCase());
    const est = p.estate || p.subfarm;
    idVals.forEach(v => ids.add(v));
    if (est) { estates.add(String(est).toLowerCase()); idVals.forEach(v => pairs.add(`${String(est).toLowerCase()}|${v}`)); }
  }
  return { ids, pairs, estates };
}
