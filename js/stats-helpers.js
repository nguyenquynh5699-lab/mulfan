// Shared helpers for stat counting and read-state persistence
import * as store from './sheet-store.js';

// -- Read state persistence (backed by Google Sheets via sheet-store) --
const READ_COMMENTS_KEY = 'read_comments';
const READ_REELS_KEY = 'read_reels';

export function getReadIds(key) {
  const arr = store.get(key);
  return new Set(Array.isArray(arr) ? arr : []);
}

export function markRead(key, id) {
  const ids = getReadIds(key);
  ids.add(id);
  store.set(key, [...ids]);
}

export const getReadReelIds = () => getReadIds(READ_REELS_KEY);
export const markReelRead = (id) => markRead(READ_REELS_KEY, id);
export const getReadCommentIds = () => getReadIds(READ_COMMENTS_KEY);
export const markCommentRead = (id) => markRead(READ_COMMENTS_KEY, id);

// -- Insight extraction --

export function getInsight(post, name) {
  const entry = post.video_insights?.data?.find(i => i.name === name);
  return entry?.values?.[0]?.value ?? 0;
}

export function getInsightObj(post, name) {
  const entry = post.video_insights?.data?.find(i => i.name === name);
  const val = entry?.values?.[0]?.value;
  return (val && typeof val === 'object') ? val : null;
}
