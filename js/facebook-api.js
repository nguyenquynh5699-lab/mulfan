// Facebook Graph API v21.0 client (browser-side, CORS supported)
import { twoDaysAgoUnix } from './utils.js';

const BASE = 'https://graph.facebook.com/v21.0';

/**
 * Fetch all fanpages the user manages. Handles pagination to get all pages.
 * @param {string} userToken - User Access Token from Graph API Explorer
 * @returns {Promise<Array>} List of page objects { id, name, access_token, category, picture }
 */
export async function fetchPages(userToken) {
  let url = `${BASE}/me/accounts?fields=name,id,access_token,category,picture&access_token=${enc(userToken)}`;
  const allPages = [];
  while (url) {
    const data = await graphGet(url);
    allPages.push(...data.data);
    url = data.paging?.next || null;
  }
  return allPages;
}

/**
 * Fetch published reels for a fanpage with insights.
 * Uses comments.since(twoDaysAgo) to count new comments in last 2 days.
 */
export async function fetchPublishedReels(pageId, pageToken, afterCursor = null) {
  const fields = [
    'id', 'description', 'created_time',
    'thumbnails{uri}', 'permalink_url',
    'video_insights{name,values}',
    `comments.since(${twoDaysAgoUnix()}).limit(50).summary(true){message,created_time,from{id}}`
  ].join(',');

  let url = `${BASE}/${pageId}/video_reels?fields=${enc(fields)}&access_token=${enc(pageToken)}`;
  if (afterCursor) url += `&after=${enc(afterCursor)}`;

  const data = await graphGet(url);
  const nextCursor = data.paging?.cursors?.after || null;
  return { posts: data.data, afterCursor: nextCursor };
}

// -- helpers --

async function graphGet(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

function enc(v) { return encodeURIComponent(v); }
