import { esc } from './utils.js';

/**
 * Renders fanpage cards into the grid.
 * Each card has dot indicators updated by updateCardIndicators().
 */
export function renderGrid(pages, onCardClick) {
  const grid = document.getElementById('pageGrid');
  grid.innerHTML = '';

  pages.forEach(page => {
    const card = document.createElement('div');
    card.className = 'page-card';
    card.dataset.pageId = page.id;

    const img = document.createElement('img');
    img.className = 'page-card__avatar';
    img.alt = page.name || '';
    img.src = page.picture?.data?.url || '';
    img.onerror = () => { img.style.display = 'none'; };

    card.appendChild(img);
    card.insertAdjacentHTML('beforeend', `
      <div class="page-card__name">${esc(page.name)}</div>
      <div class="page-card__category">${esc(page.category || '')}</div>
      <div class="page-card__dots">
        <span class="dot dot--hot hidden" title="Có reel >1K views"></span>
        <span class="dot dot--cmt hidden" title="Có comment mới"></span>
      </div>
    `);
    card.addEventListener('click', () => onCardClick(page));
    grid.appendChild(card);
  });
}

/**
 * Show/hide indicator dots on a fanpage card.
 * @param {string} pageId
 * @param {{ hotReels: number, newComments: number }} stats
 */
export function updateCardIndicators(pageId, stats) {
  const card = document.querySelector(`.page-card[data-page-id="${pageId}"]`);
  if (!card) return;
  const hot = card.querySelector('.dot--hot');
  const cmt = card.querySelector('.dot--cmt');
  if (hot) hot.classList.toggle('hidden', stats.hotReels === 0);
  if (cmt) cmt.classList.toggle('hidden', stats.newComments === 0);
}
