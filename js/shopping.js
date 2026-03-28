/* ══ COURSES ══ */
function renderShop() {
  const period = document.getElementById('speriod').value;
  const today  = new Date();
  const map    = {};

  Object.entries(P).forEach(([key,meals]) => {
    const [y,m,d] = key.split('-').map(Number);
    const date = new Date(y,m-1,d);
    let ok = period==='all';
    if (!ok && period==='month') ok = date.getMonth()===today.getMonth() && date.getFullYear()===today.getFullYear();
    if (!ok && period==='week') {
      const s = new Date(today); s.setDate(today.getDate()-((today.getDay()+6)%7));
      const e = new Date(s);     e.setDate(s.getDate()+6);
      ok = date>=s && date<=e;
    }
    if (!ok) return;
    meals.forEach(meal => {
      const rec = R[meal.recipeIdx];
      if (!rec?.ingredients) return;
      const base = parseInt(rec.servings) || 4;
      const ratio = (meal.servings || base) / base;
      rec.ingredients.forEach(ing => {
        const k = ing.name.toLowerCase().trim();
        if (!map[k]) map[k] = { name:ing.name, qtys:[], manual:false };
        if (ing.qty) {
          const n = parseFloat(ing.qty);
          const scaled = isNaN(n) ? ing.qty : (Math.round(n * ratio * 10) / 10).toString();
          map[k].qtys.push(`${scaled}${ing.unit?' '+ing.unit:''}`);
        }
      });
    });
  });

  // Ajouter les articles manuels dans la map sous "Autre"
  manualItems.forEach((item, i) => {
    const k = 'manual-' + i;
    map[k] = { name: item.name, qtys: [], manual: true, manualIdx: i, done: item.done };
  });

  const items = Object.values(map);
  if (!items.length) {
    document.getElementById('scontent').innerHTML = `<div class="empty"><span class="empty-ico">🛒</span><h3>Rien pour cette période</h3><p>Planifiez des repas pour générer la liste.</p></div>`;
    return;
  }

  const secs = {};
  items.forEach(item => {
    let cat = item.manual ? 'Ajoutés manuellement' : 'Autre';
    if (!item.manual) {
      for (const [c,kws] of Object.entries(FOODS)) {
        if (kws.some(k => item.name.toLowerCase().includes(k))) { cat=c; break; }
      }
    }
    if (!secs[cat]) secs[cat] = [];
    secs[cat].push(item);
  });

  const ORDER = ['Légoutés manuellement','Légumes','Fruits','Viandes & Poissons','Produits laitiers','Féculents','Épicerie','Autre','Ajoutés manuellement'];
  let h = `<div class="ssections">`;
  ORDER.forEach(cat => {
    if (!secs[cat]) return;
    h += `<div class="ssec"><div class="ssec-title">${SICO[cat]||'📝'} ${cat}</div>
      ${secs[cat].map(item => {
        if (item.manual) {
          return `<div class="sitem${item.done?' done':''}" onclick="toggleManualItem(${item.manualIdx})">
            <div class="schk">${item.done?'✓':''}</div>
            <div class="sname">${item.name}</div>
            <button class="manual-item-del" onclick="event.stopPropagation();delManualItem(${item.manualIdx})">×</button>
          </div>`;
        }
        const ck = `${period}-${item.name}`, done = CK[ck];
        return `<div class="sitem${done?' done':''}" onclick="togChk('${ck}',this)">
          <div class="schk">${done?'✓':''}</div>
          <div class="sname">${item.name}</div>
          ${item.qtys.length?`<div class="sqty">${item.qtys.join(' + ')}</div>`:''}
        </div>`;
      }).join('')}
    </div>`;
  });
  h += `</div>`;
  document.getElementById('scontent').innerHTML = h;
}

function togChk(key, el) {
  if (CK[key]) { delete CK[key]; el.classList.remove('done'); el.querySelector('.schk').textContent=''; }
  else         { CK[key]=true;   el.classList.add('done');    el.querySelector('.schk').textContent='✓'; }
  sv();
}

function uncheckAll() {
  const p = document.getElementById('speriod').value;
  Object.keys(CK).forEach(k => { if (k.startsWith(p)) delete CK[k]; });
  sv(); renderShop();
}

/* ══ ARTICLES MANUELS ══ */
let manualItems = JSON.parse(localStorage.getItem('kk-manual') || '[]');

function saveManual() { localStorage.setItem('kk-manual', JSON.stringify(manualItems)); }

function addManualItem() {
  const input = document.getElementById('manual-input');
  const val = input.value.trim();
  if (!val) return;
  manualItems.push({ name: val, done: false });
  saveManual(); input.value = '';
  renderShop();
}

function toggleManualItem(i) {
  manualItems[i].done = !manualItems[i].done;
  saveManual(); renderShop();
}

function delManualItem(i) {
  manualItems.splice(i, 1);
  saveManual(); renderShop();
}

function clearAllManual() {
  if (!manualItems.length) return;
  manualItems = [];
  saveManual(); renderShop();
}

function initManual() { renderShop(); }


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
  // Tags
  const tagsEl = document.getElementById('frigo-tags');
  tagsEl.innerHTML = frigoIngs.map((ing, i) => `
    <div class="frigo-tag">
      ${ing}
      <button onclick="removeFrigoIng(${i})">×</button>
    </div>`).join('');

  const resEl = document.getElementById('frigo-results');
  if (!frigoIngs.length) { resEl.innerHTML = ''; return; }

  // Trouver les recettes qui matchent
  const scored = R.map((r, idx) => {
    if (!r.ingredients?.length) return null;
    const rIngs = r.ingredients.map(g => g.name.toLowerCase());
    const matched = frigoIngs.filter(f => rIngs.some(ri => ri.includes(f) || f.includes(ri)));
    const missing = rIngs.filter(ri => !frigoIngs.some(f => ri.includes(f) || f.includes(ri)));
    if (!matched.length) return null;
    return { idx, r, matched, missing, score: matched.length / rIngs.length };
  }).filter(Boolean).sort((a, b) => b.score - a.score);

  if (!scored.length) {
    resEl.innerHTML = `<div class="frigo-empty">Aucune recette ne correspond à ces ingrédients.</div>`;
    return;
  }

  let h = `<div class="frigo-results-title">${scored.length} recette${scored.length>1?'s':''} possible${scored.length>1?'s':''}</div>`;
  scored.forEach(({ idx, r, matched, missing }) => {
    h += `<div class="frigo-card" onclick="showDet(${idx})">
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

// Init frigo au chargement de la page courses
function initFrigo() { /* rien à faire, le frigo s'ouvre via le sheet */ }

/* ══ ONGLETS FRIGO ══ */
function frigoTab(tab, btn) {
  document.querySelectorAll('#ov-frigo .tab').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('ft-search').style.display  = tab === 'search' ? 'block' : 'none';
  document.getElementById('ft-expiry').style.display  = tab === 'expiry' ? 'block' : 'none';
  if (tab === 'expiry') renderExpiryList();
}

/* ══ PÉREMPTIONS ══ */
let expiryItems = JSON.parse(localStorage.getItem('kk-expiry') || '[]');

function saveExpiry() { localStorage.setItem('kk-expiry', JSON.stringify(expiryItems)); }

function addExpiryItem() {
  const name     = document.getElementById('exp-name').value.trim();
  const duration = parseInt(document.getElementById('exp-duration').value);
  const unit     = document.getElementById('exp-unit').value;
  if (!name || !duration || duration < 1) { alert('Renseignez le nom et la durée.'); return; }

  // Calculer la date d'expiration
  const date = new Date();
  if (unit === 'days')   date.setDate(date.getDate() + duration);
  if (unit === 'weeks')  date.setDate(date.getDate() + duration * 7);
  if (unit === 'months') date.setMonth(date.getMonth() + duration);
  if (unit === 'years')  date.setFullYear(date.getFullYear() + duration);

  expiryItems.push({ name, date: date.toISOString().split('T')[0] });
  saveExpiry();
  document.getElementById('exp-name').value     = '';
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
    let cls = 'exp-ok', timeLabel = '';
    const d = item.diff;
    if (d < 0)      { cls = 'exp-dead';   timeLabel = `Périmé depuis ${Math.abs(d)}j`; }
    else if (d === 0){ cls = 'exp-urgent'; timeLabel = "Expire aujourd'hui !"; }
    else if (d <= 7) { cls = 'exp-urgent'; timeLabel = `Encore ${d} jour${d>1?'s':''}`; }
    else if (d < 30) { timeLabel = `Encore ${d} jours`; }
    else if (d < 365){ const m = Math.round(d/30); timeLabel = `Encore ~${m} mois`; }
    else             { const y = Math.round(d/365); timeLabel = `Encore ~${y} an${y>1?'s':''}`; }

    const dateStr = new Date(item.date).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });

    return `<div class="exp-item ${cls}">
      <div class="exp-info">
        <div class="exp-name">${item.name}</div>
        <div class="exp-date">Périme le ${dateStr}</div>
      </div>
      <div class="exp-badge">${timeLabel}</div>
      <button class="manual-item-del" onclick="delExpiryItem(${item.i})">×</button>
    </div>`;
  }).join('');
}
