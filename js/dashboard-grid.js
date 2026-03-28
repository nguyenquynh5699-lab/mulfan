import { esc } from './utils.js';

/**
 * Renders fanpage cards into the grid.
 */
export function renderGrid(pages, onCardClick) {
  const grid = document.getElementById('pageGrid');
  grid.innerHTML = '';

  pages.forEach(page => {
    const card = document.createElement('div');
    card.className = 'page-card';

    const img = document.createElement('img');
    img.className = 'page-card__avatar';
    img.alt = page.name || '';
    img.src = page.picture?.data?.url || '';
    img.onerror = () => { img.style.display = 'none'; };

    card.appendChild(img);
    card.insertAdjacentHTML('beforeend', `
      <div class="page-card__name">${esc(page.name)}</div>
      <div class="page-card__category">${esc(page.category || '')}</div>
    `);
    card.addEventListener('click', () => onCardClick(page));
    grid.appendChild(card);
  });
}
