// Reel detail modal — tabs: hot reels (>1k views) + recent comments (2 days)
import { esc, twoDaysAgoMs, num, formatDate } from './utils.js';
import {
  getInsight, getInsightObj, getReadReelIds, markReelRead,
  getReadCommentIds, markCommentRead
} from './stats-helpers.js';

const $ = (id) => document.getElementById(id);

export function showModal(pageName) {
  $('modalTitle').textContent = pageName;
  $('reelsBody').innerHTML = '';
  $('commentsList').innerHTML = '';
  $('hotReelsEmpty').classList.add('hidden');
  $('commentsEmpty').classList.add('hidden');
  $('detailModal').classList.remove('hidden');
  $('modalLoading').classList.remove('hidden');
  switchTab('hot-reels');
}

export function hideModal() {
  $('detailModal').classList.add('hidden');
}

export function setLoading(show) {
  $('modalLoading').classList.toggle('hidden', !show);
}

/** Set up infinite scroll on modal body. Call once on DOMContentLoaded. */
export function initInfiniteScroll(onLoadMore) {
  let loading = false;
  const body = document.querySelector('.modal-body');
  body.addEventListener('scroll', async () => {
    if (loading || !_hasMore) return;
    if (body.scrollHeight - body.scrollTop - body.clientHeight > 200) return;
    loading = true;
    $('scrollLoader').classList.remove('hidden');
    try { await onLoadMore(); }
    finally {
      loading = false;
      $('scrollLoader').classList.add('hidden');
    }
  });
}

let _hasMore = false;
export function setHasMore(hasMore) { _hasMore = hasMore; }

/** Init tab click handlers (call once on DOMContentLoaded) */
export function initTabs() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tabId)
  );
  document.querySelectorAll('.tab-panel').forEach(p =>
    p.classList.toggle('hidden', p.id !== `tab-${tabId}`)
  );
}

/** Render hot reels (views > 1000) into table. Returns count of rendered rows. */
export function renderHotReels(posts, pageId) {
  const body = $('reelsBody');
  const cutoff = twoDaysAgoMs();
  const readIds = getReadReelIds();
  let count = 0;

  posts.forEach(post => {
    const views = getInsight(post, 'blue_reels_play_count');
    if (views < 1000) return;
    if (readIds.has(post.id)) return;
    count++;

    const tr = document.createElement('tr');
    const thumb = post.thumbnails?.data?.[0]?.uri || '';
    const social = getInsightObj(post, 'post_video_social_actions');
    const totalComments = social?.COMMENT || 0;
    const totalShares = social?.SHARE || 0;
    const created = new Date(post.created_time);
    const isRecent = created.getTime() > cutoff;
    const url = insightsUrl(pageId, post.id);

    tr.innerHTML = `
      <td>${thumb ? `<img src="${esc(thumb)}" class="reel-thumb" loading="lazy">` : "—"}</td>
      <td class="reel-desc"><a href="${url}" target="_blank" rel="noopener" class="link-view">${esc(post.description || "(Không tiêu đề)")}</a>${isRecent ? ' <span class="badge-new">Mới</span>' : ""}</td>
      <td class="reel-stats">&middot; views: ${num(views)}\n&middot; cmt: ${num(totalComments)}\n&middot; share: ${num(totalShares)} </td>
      <td><button class="btn-mark-read" title="Đánh dấu đã đọc">&times;</button></td>
    `;
    tr.querySelector('.btn-mark-read').addEventListener('click', () => {
      markReelRead(post.id);
      tr.remove();
      if (!body.children.length) $('hotReelsEmpty').classList.remove('hidden');
    });
    body.appendChild(tr);
  });
  return count;
}

export function showHotReelsEmpty(totalCount) {
  $('hotReelsEmpty').classList.toggle('hidden', totalCount > 0);
}

/** Render recent comments (last 2 days). Returns count rendered. */
export function renderRecentComments(posts, pageId) {
  const readIds = getReadCommentIds();

  const allComments = [];
  posts.forEach(post => {
    const comments = post.comments?.data || [];
    comments.forEach(c => {
      if (c.from?.id === pageId) return;
      if (readIds.has(c.id)) return;
      allComments.push({ ...c, reelDesc: post.description, reelId: post.id });
    });
  });

  allComments.sort((a, b) => new Date(b.created_time) - new Date(a.created_time));

  const list = $('commentsList');
  allComments.forEach(c => {
    const card = document.createElement('div');
    card.className = 'comment-card';
    const time = new Date(c.created_time);
    const url = insightsUrl(pageId, c.reelId);

    card.innerHTML = `
      <div class="comment-card__header">
        <span class="comment-card__time">${formatDate(time)} ${time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
        <button class="btn-mark-read" title="Đánh dấu đã đọc">&times;</button>
      </div>
      <div class="comment-card__body">${esc(c.message || '')}</div>
      <div class="comment-card__reel">Reel: <a href="${url}" target="_blank" rel="noopener">${esc((c.reelDesc || '').slice(0, 60))}${(c.reelDesc || '').length > 60 ? '...' : ''}</a></div>
    `;
    card.querySelector('.btn-mark-read').addEventListener('click', () => {
      markCommentRead(c.id);
      card.remove();
      if (!$('commentsList').children.length) {
        $('commentsEmpty').classList.remove('hidden');
      }
    });
    list.appendChild(card);
  });

  $('commentsEmpty').classList.toggle('hidden', allComments.length > 0);
  return allComments.length;
}

// -- helpers --

function insightsUrl(pageId, reelId) {
  return `https://business.facebook.com/latest/insights/object_insights/?asset_id=${esc(pageId)}&ir_qe_exposed=1&content_id=${esc(reelId)}`;
}
