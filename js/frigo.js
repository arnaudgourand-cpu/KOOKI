/* ══ ONGLETS FRIGO ══ */
function frigoTab(tab, btn) {
  document.querySelectorAll('#pg-frigo .tab').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('ft-search').style.display = tab === 'search' ? 'block' : 'none';
  document.getElementById('ft-expiry').style.display = tab === 'expiry' ? 'block' : 'none';
  if (tab === 'expiry') renderExpiryList();
}

/* ══ RECHERCHE RECETTES PAR INGRÉDIENTS ══ */
let frigoIngs = JSON.parse(localStorage.getItem('kk-frigo') || '[]');

function saveFrigo() { localStorage.setItem('kk-frigo', JSON.stringify(frigoIngs)); }

function addFrigoIng() {
  const input = document.getElementById('frigo-input');
  const val = input.value.trim().toLowerCase();
  if (!val || frigoIngs.includes(val)) { input.value = ''; return; }
  frigoIngs.push(val);
  saveFrigo(); input.value = '';
  renderFrigo();
}

function removeFrigoIng(i) {
  frigoIngs.splice(i, 1);
  saveFrigo(); renderFrigo();
}

function renderFrigo() {
  document.getElementById('frigo-tags').innerHTML = frigoIngs.map((ing, i) => `
    <div class="frigo-tag">${ing}<button onclick="removeFrigoIng(${i})">×</button></div>`).join('');

  const resEl = document.getElementById('frigo-results');
  if (!frigoIngs.length) { resEl.innerHTML = ''; return; }

  const scored = R.map((r, idx) => {
    if (!r.ingredients?.length) return null;
    const rIngs = r.ingredients.map(g => g.name.toLowerCase());
    const matched = frigoIngs.filter(f => rIngs.some(ri => ri.includes(f) || f.includes(ri)));
    const missing = rIngs.filter(ri => !frigoIngs.some(f => ri.includes(f) || f.includes(ri)));
    if (!matched.length) return null;
    return { idx, r, matched, missing, score: matched.length / rIngs.length };
  }).filter(Boolean).sort((a, b) => b.score - a.score);

  if (!scored.length) { resEl.innerHTML = `<div class="frigo-empty">Aucune recette ne correspond.</div>`; return; }

  let h = `<div class="frigo-results-title">${scored.length} recette${scored.length>1?'s':''} possible${scored.length>1?'s':''}</div>`;
  scored.forEach(({ idx, r, matched, missing }) => {
    h += `<div class="frigo-card" onclick="openFiche(${idx})">
      ${r.photo ? `<img class="frigo-card-photo" src="${r.photo}">` : `<div class="frigo-card-nophoto"></div>`}
      <div class="frigo-card-info">
        <div class="frigo-card-name">${r.name}</div>
        <div class="frigo-card-match">✓ ${matched.join(', ')}</div>
        ${missing.length ? `<div class="frigo-card-missing">Manque : ${missing.slice(0,3).join(', ')}${missing.length>3?' …':''}</div>` : ''}
      </div>
    </div>`;
  });
  resEl.innerHTML = h;
}

/* ══ PÉREMPTIONS ══ */
let expiryItems = JSON.parse(localStorage.getItem('kk-expiry') || '[]');

function saveExpiry() { localStorage.setItem('kk-expiry', JSON.stringify(expiryItems)); }

function addExpiryItem() {
  const name     = document.getElementById('exp-name').value.trim();
  const duration = parseInt(document.getElementById('exp-duration').value);
  const unit     = document.getElementById('exp-unit').value;
  if (!name || !duration || duration < 1) { alert('Renseignez le nom et la durée.'); return; }
  const date = new Date();
  if (unit === 'days')   date.setDate(date.getDate() + duration);
  if (unit === 'weeks')  date.setDate(date.getDate() + duration * 7);
  if (unit === 'months') date.setMonth(date.getMonth() + duration);
  if (unit === 'years')  date.setFullYear(date.getFullYear() + duration);
  expiryItems.push({ name, date: date.toISOString().split('T')[0] });
  saveExpiry();
  document.getElementById('exp-name').value = '';
  document.getElementById('exp-duration').value = '';
  renderExpiryList();
}

function delExpiryItem(i) {
  expiryItems.splice(i, 1);
  saveExpiry(); renderExpiryList();
}

function renderExpiryList() {
  const today = new Date(); today.setHours(0,0,0,0);
  const sorted = expiryItems
    .map((item, i) => ({ ...item, i, diff: Math.ceil((new Date(item.date) - today) / 86400000) }))
    .sort((a, b) => a.diff - b.diff);

  if (!sorted.length) {
    document.getElementById('expiry-list').innerHTML = `<div class="frigo-empty">Aucun aliment suivi.</div>`;
    return;
  }

  document.getElementById('expiry-list').innerHTML = sorted.map(item => {
    const d = item.diff;
    let cls = 'exp-ok', label = '';
    if (d < 0)       { cls = 'exp-dead';   label = `Périmé depuis ${Math.abs(d)}j`; }
    else if (d === 0){ cls = 'exp-urgent'; label = "Expire aujourd'hui !"; }
    else if (d <= 7) { cls = 'exp-urgent'; label = `Encore ${d} jour${d>1?'s':''}`; }
    else if (d < 30) { label = `Encore ${d} jours`; }
    else if (d < 365){ label = `Encore ~${Math.round(d/30)} mois`; }
    else             { const y = Math.round(d/365); label = `Encore ~${y} an${y>1?'s':''}`; }
    const dateStr = new Date(item.date).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
    return `<div class="exp-item ${cls}">
      <div class="exp-info">
        <div class="exp-name">${item.name}</div>
        <div class="exp-date">Périme le ${dateStr}</div>
      </div>
      <div class="exp-badge">${label}</div>
      <button class="manual-item-del" onclick="delExpiryItem(${item.i})">×</button>
    </div>`;
  }).join('');
}
