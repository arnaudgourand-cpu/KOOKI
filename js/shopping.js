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
      rec.ingredients.forEach(ing => {
        const k = ing.name.toLowerCase().trim();
        if (!map[k]) map[k] = { name:ing.name, qtys:[], manual:false };
        if (ing.qty) map[k].qtys.push(`${ing.qty}${ing.unit?' '+ing.unit:''}`);
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
function initFrigo() { renderFrigo(); }
