/* ══ FILTRES ══ */
let activeFilter = 'all';
let activeRegime = 'all';
let showFavOnly  = false;

function toggleFilters(btn) {
  document.getElementById('filters-panel').classList.toggle('on');
  btn.classList.toggle('on');
}

function setFilter(cat, btn) {
  activeFilter = cat;
  document.querySelectorAll('#cat-filters .cat-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  renderRecipes();
}

function setRegime(regime, btn) {
  activeRegime = regime;
  document.querySelectorAll('#regime-filters .cat-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  renderRecipes();
}

function toggleFavFilter(btn) {
  showFavOnly = !showFavOnly;
  btn.classList.toggle('on', showFavOnly);
  renderRecipes();
}

function toggleFav(idx) {
  R[idx].fav = !R[idx].fav;
  sv(); renderRecipes();
}

/* ══ GRILLE ══ */
function renderRecipes() {
  const q = (document.getElementById('searchInput')?.value||'').toLowerCase().trim();
  const filtered = R.filter(r =>
    (!q || r.name.toLowerCase().includes(q)) &&
    (activeFilter === 'all' || r.category === activeFilter) &&
    (activeRegime === 'all' || r.regime === activeRegime) &&
    (!showFavOnly || r.fav)
  );
  const n = R.length;
  document.getElementById('rcount').textContent = q || activeFilter !== 'all' || activeRegime !== 'all' || showFavOnly
    ? `${filtered.length} résultat${filtered.length>1?'s':''}`
    : `${n} recette${n>1?'s':''}`;

  let h = (!q && activeFilter === 'all' && !showFavOnly && R.length === 0) ? `<div class="add-card" onclick="openAdd()">
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
    <span>Ajouter une recette</span>
  </div>` : '';

  filtered.forEach(r => {
    const idx = R.indexOf(r);
    h += `<div class="rcard" onclick="openFiche(${idx})">
      ${r.photo ? `<img class="rcard-photo" src="${r.photo}" alt="${r.name}">` : `<div class="rcard-emoji"></div>`}
      <div class="rcard-grad"></div>
      <button class="rcard-heart${r.fav?' fav':''}" onclick="event.stopPropagation();toggleFav(${idx})">
        <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
      <div class="rcard-body">
        <div class="rcard-name">${r.name}</div>
        <div class="rcard-meta">${[r.time&&`⏱ ${r.time} min`, r.servings&&`${r.servings} pers.`, r.price&&`~${r.price}€`].filter(Boolean).join(' · ')}</div>
        <div class="rcard-row">
          <button class="rbtn rbtn-r" onclick="event.stopPropagation();goplan()">+ Planning</button>
          <button class="rbtn rbtn-g" onclick="event.stopPropagation();delR(${idx})">🗑</button>
        </div>
      </div>
    </div>`;
  });

  if (!filtered.length) h += `<div class="empty" style="grid-column:1/-1"><span class="empty-ico">🔍</span><h3>Aucun résultat</h3><p>Essayez un autre filtre</p></div>`;
  document.getElementById('rgrid').innerHTML = h;
}

/* ══ SUPPRESSION / NAVIGATION ══ */
function delR(i) {
  if (!confirm('Supprimer cette recette ?')) return;
  R.splice(i,1); sv(); renderRecipes(); toast('Recette supprimée');
}

function goplan() {
  showPg('planning', document.getElementById('ni-planning'));
  toast('Choisissez un jour dans le calendrier');
}

/* ══ FICHE COMPLÈTE ══ */
let ficheServings = 0;
let ficheRecipeIdx = 0;

function openFiche(i) {
  ficheRecipeIdx = i;
  ficheServings = parseInt(R[i].servings) || 4;
  renderFiche();
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.getElementById('pg-fiche').classList.add('on');
  window.scrollTo(0, 0);
}

function renderFiche() {
  const r = R[ficheRecipeIdx];
  const base = parseInt(r.servings) || 4;
  const ratio = ficheServings / base;
  const steps = r.instructions ? r.instructions.split('\n').filter(s => s.trim()) : [];

  function scaleQty(qty) {
    if (!qty) return '';
    const n = parseFloat(qty);
    if (isNaN(n)) return qty;
    return (Math.round(n * ratio * 10) / 10).toString();
  }

  document.getElementById('fiche-content').innerHTML = `
    <div class="fiche-hero">
      ${r.photo ? `<img src="${r.photo}" class="fiche-photo">` : `<div class="fiche-nophoto"></div>`}
      <div class="fiche-hero-overlay">
        <button class="fiche-back" onclick="showPg('recipes', document.getElementById('ni-recipes'))">
          <svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button class="fiche-edit" onclick="openEdit(${ficheRecipeIdx})">
          <svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>
    </div>
    <div class="fiche-body">
      <div class="fiche-title">${r.name}</div>
      <div class="fiche-badges">
        <span class="fiche-badge">${CATS[r.category]||'Plat'}</span>
        ${r.regime==='vege'?`<span class="fiche-badge fiche-badge-g">Végétarien</span>`:''}
        ${r.time?`<span class="fiche-badge fiche-badge-n">⏱ ${r.time} min</span>`:''}
        ${r.price?`<span class="fiche-badge fiche-badge-n">~${r.price} €</span>`:''}
      </div>
      <div class="portions-row">
        <span class="portions-label">Portions</span>
        <div class="portions-ctrl">
          <button class="portions-btn" onclick="changePortion(-1)">−</button>
          <span class="portions-val">${ficheServings}</span>
          <button class="portions-btn" onclick="changePortion(1)">+</button>
        </div>
      </div>
      <div class="fiche-tabs">
        <button class="fiche-tab on" onclick="ficheTab('ings',this)">
          <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/></svg>
          Ingrédients
        </button>
        <button class="fiche-tab" onclick="ficheTab('steps',this)">
          <svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          Instructions
        </button>
      </div>
      <div class="fiche-panel on" id="fp-ings">
        ${r.ingredients?.length
          ? r.ingredients.map(g=>`<div class="fiche-ing"><div class="fiche-ing-dot"></div><span class="fiche-ing-name">${g.name}</span><span class="fiche-ing-qty">${[scaleQty(g.qty),g.unit].filter(Boolean).join(' ')}</span></div>`).join('')
          : `<p style="color:var(--tl);font-weight:700;padding:20px 0">Aucun ingrédient renseigné.</p>`}
      </div>
      <div class="fiche-panel" id="fp-steps">
        ${steps.length
          ? `<div class="fiche-steps">${steps.map((s,si)=>`<div class="fiche-step"><div class="fiche-step-num">${si+1}</div><div class="fiche-step-text">${s}</div></div>`).join('')}</div>`
          : `<p style="color:var(--tl);font-weight:700;padding:20px 0">Aucune instruction renseignée.</p>`}
      </div>
      <div class="fiche-actions">
        <button class="btn btn-cook" onclick="openCooking(${ficheRecipeIdx})">
          <svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg>
          Mode cuisson
        </button>
        <button class="btn btn-r btn-full" onclick="showPg('planning',document.getElementById('ni-planning'))">+ Ajouter au planning</button>
        ${r.url?`<a href="${r.url}" target="_blank" class="btn btn-w btn-full">Voir la recette originale</a>`:''}
      </div>
    </div>`;
}

function changePortion(dir) { ficheServings = Math.max(1, ficheServings + dir); renderFiche(); }
function ficheTab(panel, btn) {
  document.querySelectorAll('.fiche-tab').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.fiche-panel').forEach(p => p.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('fp-'+panel).classList.add('on');
}
