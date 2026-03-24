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
        if (!map[k]) map[k] = { name:ing.name, qtys:[] };
        if (ing.qty) map[k].qtys.push(`${ing.qty}${ing.unit?' '+ing.unit:''}`);
      });
    });
  });

  const items = Object.values(map);
  if (!items.length) {
    document.getElementById('scontent').innerHTML = `<div class="empty"><span class="empty-ico">🛒</span><h3>Rien pour cette période</h3><p>Planifiez des repas pour générer la liste.</p></div>`;
    return;
  }

  const secs = {};
  items.forEach(item => {
    let cat = 'Autre';
    for (const [c,kws] of Object.entries(FOODS)) {
      if (kws.some(k => item.name.toLowerCase().includes(k))) { cat=c; break; }
    }
    if (!secs[cat]) secs[cat] = [];
    secs[cat].push(item);
  });

  const ORDER = ['Légumes','Fruits','Viandes & Poissons','Produits laitiers','Féculents','Épicerie','Autre'];
  let h = `<div class="ssections">`;
  ORDER.forEach(cat => {
    if (!secs[cat]) return;
    h += `<div class="ssec"><div class="ssec-title">${SICO[cat]||'📦'} ${cat}</div>
      ${secs[cat].map(item => {
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
