/** Escape HTML to prevent XSS */
export function esc(str) {
  const d = document.createElement('div');
  d.textContent = String(str ?? '');
  return d.innerHTML;
}

/** Two days ago as Unix timestamp (seconds) */
export function twoDaysAgoUnix() {
  return Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000);
}

/** Two days ago as Date.now() millis */
export function twoDaysAgoMs() {
  return Date.now() - 2 * 24 * 60 * 60 * 1000;
}

/** Format number with vi-VN locale */
export function num(v) {
  if (typeof v !== 'number') return v;
  return v.toLocaleString('vi-VN');
}

/** Format Date to dd/mm/yyyy */
export function formatDate(d) {
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
