// Main entry — state management & event wiring
import { fetchPages, fetchPublishedReels } from './facebook-api.js';
import { renderGrid } from './dashboard-grid.js';
import * as store from './sheet-store.js';
import {
  showModal, hideModal, setLoading, initTabs, setHasMore, initInfiniteScroll,
  renderHotReels, showHotReelsEmpty, renderRecentComments
} from './reel-detail-modal.js';

let pageTokens = {};
let pages = [];
let currentPage = null;
let currentCursor = null;
let hotReelCount = 0;
const reelsCache = {};

const $ = (id) => document.getElementById(id);

// -- Screen switching --
function showTokenScreen() {
  $('tokenScreen').classList.remove('hidden');
  $('dashHeader').classList.add('hidden');
  $('dashMain').classList.add('hidden');
}

function showDashboard() {
  $('tokenScreen').classList.add('hidden');
  $('dashHeader').classList.remove('hidden');
  $('dashMain').classList.remove('hidden');
}

// -- Init --
document.addEventListener('DOMContentLoaded', async () => {
  // Restore sheet URL
  const savedUrl = store.getSheetUrl();
  if (savedUrl) $('sheetUrlInput').value = savedUrl;

  // Init store from Google Sheet
  try {
    if (savedUrl) await store.init();
  } catch (_) {}

  const savedToken = store.get('token');
  if (savedToken) $('tokenInput').value = savedToken;

  if (savedToken && savedUrl) {
    pages = store.get('pages') || [];
    if (pages.length) {
      fetchAndShow(savedToken);
    } else {
      showTokenScreen();
    }
  } else {
    showTokenScreen();
  }

  $('fetchPagesBtn').addEventListener('click', handleFetchPages);
  $('logoutBtn').addEventListener('click', () => {
    store.set('token', null);
    pageTokens = {};
    showTokenScreen();
  });
  $('closeModal').addEventListener('click', hideModal);
  document.querySelector('.modal-overlay')?.addEventListener('click', hideModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideModal();
  });
  initTabs();
  initInfiniteScroll(handleLoadMore);
});

// -- Fetch fanpages & show dashboard --
async function fetchAndShow(token) {
  const bar = $('loadingBar');
  try {
    bar.classList.remove('hidden');
    const rawPages = await fetchPages(token);

    pageTokens = {};
    rawPages.forEach(p => { pageTokens[p.id] = p.access_token; });

    pages = rawPages.map(({ access_token, ...rest }) => rest);
    store.set('pages', pages);
    store.set('token', token);

    renderGrid(pages, handleCardClick);
    showDashboard();
    prefetchAllReels();
  } catch (err) {
    alert('Lỗi: ' + err.message);
    showTokenScreen();
  } finally {
    bar.classList.add('hidden');
  }
}

async function handleFetchPages() {
  const token = $('tokenInput').value.trim();
  const sheetUrl = $('sheetUrlInput').value.trim();
  if (!sheetUrl) return alert('Vui lòng nhập Google Sheet URL');
  if (!token) return alert('Vui lòng nhập User Access Token');

  store.setSheetUrl(sheetUrl);
  try { await store.init(); } catch (_) {}

  $('fetchPagesBtn').disabled = true;
  await fetchAndShow(token);
  $('fetchPagesBtn').disabled = false;
}

// -- Pre-fetch reels (background, 5 concurrent) --
async function prefetchAllReels() {
  const tasks = pages
    .filter(p => pageTokens[p.id])
    .map(page => async () => {
      try {
        const { posts, afterCursor } = await fetchPublishedReels(page.id, pageTokens[page.id]);
        reelsCache[page.id] = { posts, afterCursor };
      } catch (_) {}
    });
  await runConcurrent(tasks, 5);
}

async function runConcurrent(tasks, limit) {
  const executing = new Set();
  for (const task of tasks) {
    const p = task().then(() => executing.delete(p));
    executing.add(p);
    if (executing.size >= limit) await Promise.race(executing);
  }
  await Promise.all(executing);
}

// -- Card click → render from cache or fetch --
async function handleCardClick(page) {
  currentPage = page;
  currentCursor = null;
  hotReelCount = 0;
  showModal(page.name);

  const cached = reelsCache[page.id];
  if (cached) {
    setLoading(false);
    hotReelCount += renderHotReels(cached.posts, page.id);
    showHotReelsEmpty(hotReelCount);
    renderRecentComments(cached.posts, page.id);
    currentCursor = cached.afterCursor;
    setHasMore(!!currentCursor);
    return;
  }

  const token = pageTokens[page.id];
  if (!token) { setLoading(false); return; }
  try {
    const { posts, afterCursor } = await fetchPublishedReels(page.id, token);
    reelsCache[page.id] = { posts, afterCursor };
    setLoading(false);
    hotReelCount += renderHotReels(posts, page.id);
    showHotReelsEmpty(hotReelCount);
    renderRecentComments(posts, page.id);
    currentCursor = afterCursor;
    setHasMore(!!currentCursor);
  } catch (err) {
    setLoading(false);
    alert('Lỗi tải reels: ' + err.message);
  }
}

// -- Load more (infinite scroll) --
async function handleLoadMore() {
  if (!currentPage || !currentCursor) return;
  const token = pageTokens[currentPage.id];
  if (!token) return;

  const { posts, afterCursor } = await fetchPublishedReels(
    currentPage.id, token, currentCursor
  );
  hotReelCount += renderHotReels(posts, currentPage.id);
  showHotReelsEmpty(hotReelCount);
  renderRecentComments(posts, currentPage.id);
  currentCursor = afterCursor;
  setHasMore(!!currentCursor);
}
