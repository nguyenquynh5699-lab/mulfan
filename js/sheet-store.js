/**
 * Google Sheets key-value store with in-memory cache.
 * - init(): loads all data from sheet into memory
 * - get(key): sync read from cache
 * - set(key, value): updates cache + async write to sheet (fire-and-forget)
 *
 * Sheet URL stored in localStorage as the only local config.
 */

const SHEET_URL_KEY = 'mulfb_sheet_url';
let cache = {};
let sheetUrl = '';

/** Load sheet URL from localStorage */
export function getSheetUrl() {
  return localStorage.getItem(SHEET_URL_KEY) || '';
}

/** Save sheet URL to localStorage */
export function setSheetUrl(url) {
  sheetUrl = url.replace(/\/+$/, '');
  localStorage.setItem(SHEET_URL_KEY, sheetUrl);
}

/** Fetch all data from Google Sheet into cache. Call once on app start. */
export async function init() {
  sheetUrl = getSheetUrl();
  if (!sheetUrl) return;
  const res = await fetch(sheetUrl);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  cache = {};
  Object.entries(data).forEach(([k, v]) => {
    try { cache[k] = JSON.parse(v); }
    catch (_) { cache[k] = v; }
  });
}

/** Sync read from cache */
export function get(key) {
  return cache[key] ?? null;
}

/** Update cache + async write to sheet */
export function set(key, value) {
  cache[key] = value;
  if (!sheetUrl) return;
  // Fire-and-forget POST using text/plain to avoid CORS preflight
  fetch(sheetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ key, value: JSON.stringify(value) })
  }).catch(() => {});
}
