/* =====================================================================
   Work Library — filter by category + sort A–Z + search.
   To add projects, just extend the PROJECTS array below
   ({ name, category, url, g } — g is the cover gradient).
   ===================================================================== */
(function () {
  'use strict';

  const PROJECTS = [
    { name: 'Microless',         category: 'E-commerce',    url: 'https://microless.com', g: 'linear-gradient(140deg,#19315e,#A9D6FF)' },
    { name: 'Espace',            category: 'Real Estate',   url: '#',                     g: 'linear-gradient(140deg,#2a2440,#FFC857)' },
    { name: 'Al Majed Perfumes', category: 'Luxury Retail', url: '#',                     g: 'linear-gradient(140deg,#EB5B27,#FFC857)' },
    { name: 'Mira Digital',      category: 'Agency',        url: '#',                     g: 'linear-gradient(140deg,#A9D6FF,#EB5B27)' },
    { name: 'Symax',             category: 'Investment',    url: '#',                     g: 'linear-gradient(140deg,#192749,#A9D6FF)' },
  ];

  const grid = document.getElementById('libGrid');
  const chipsEl = document.getElementById('libChips');
  const searchEl = document.getElementById('libSearch');
  const sortEl = document.getElementById('libSort');
  const countEl = document.getElementById('libCount');
  if (!grid) return;

  let category = 'All', query = '', asc = true;

  const categories = ['All', ...[...new Set(PROJECTS.map((p) => p.category))].sort((a, b) => a.localeCompare(b))];
  chipsEl.innerHTML = categories
    .map((c) => `<button class="lib-chip${c === 'All' ? ' is-active' : ''}" type="button" data-cat="${c}">${c}</button>`)
    .join('');

  const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

  function render() {
    let list = PROJECTS.filter(
      (p) => (category === 'All' || p.category === category) && (!query || p.name.toLowerCase().includes(query))
    );
    list.sort((a, b) => (asc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));

    countEl.textContent = `${list.length} ${list.length === 1 ? 'project' : 'projects'}${category !== 'All' ? ' · ' + category : ''}`;

    if (!list.length) { grid.innerHTML = '<p class="lib-empty">No projects match your filters.</p>'; return; }

    grid.innerHTML = list
      .map((p, i) => {
        const linked = p.url && p.url !== '#';
        const tag = linked ? 'a' : 'span';
        const attrs = linked ? `href="${esc(p.url)}" target="_blank" rel="noopener"` : '';
        return `<article class="lib-card" style="animation-delay:${Math.min(i * 0.03, 0.3)}s">
            <${tag} class="lib-card__cover" ${attrs} style="--g:${p.g}">
              <span class="lib-card__bar"><i></i><i></i><i></i></span>
              <span class="lib-card__visit">${linked ? 'Visit ↗' : ''}</span>
            </${tag}>
            <div class="lib-card__info"><span class="lib-card__cat">${esc(p.category)}</span><h3 class="lib-card__name">${esc(p.name)}</h3></div>
          </article>`;
      })
      .join('');
  }

  chipsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.lib-chip');
    if (!b) return;
    category = b.dataset.cat;
    [...chipsEl.children].forEach((x) => x.classList.toggle('is-active', x === b));
    render();
  });
  searchEl.addEventListener('input', () => { query = searchEl.value.trim().toLowerCase(); render(); });
  sortEl.addEventListener('click', () => { asc = !asc; sortEl.textContent = 'Sort: ' + (asc ? 'A → Z' : 'Z → A'); render(); });

  render();
})();
