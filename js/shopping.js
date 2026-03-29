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

  manualItems.forEach((item, i) => {
    map['manual-'+i] = { name:item.name, qtys:[], manual:true, manualIdx:i, done:item.done };
  });

  const items = Object.values(map);
  if (!items.length) {
    document.getElementById('scontent').innerHTML = `<div class="empty"><span class="empty-ico"><svg viewBox="0 0 24 24" style="width:48px;height:48px;stroke:var(--bd);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></span><h3>Rien pour cette période</h3><p>Planifiez des repas pour générer la liste.</p></div>`;
    return;
  }

  const secs = {};
  items.forEach(item => {
    let cat = item.manual ? 'Ajoutés manuellement' : (CAT_OVERRIDE[item.name.toLowerCase()] || 'Autre');
    if (!item.manual && !CAT_OVERRIDE[item.name.toLowerCase()]) {
      for (const [c,kws] of Object.entries(FOODS)) {
        if (kws.some(k => item.name.toLowerCase().includes(k))) { cat=c; break; }
      }
    }
    if (!secs[cat]) secs[cat] = [];
    secs[cat].push(item);
  });

  const ORDER = ['Légumes','Fruits','Viandes & Poissons','Produits laitiers','Féculents','Épicerie','Autre','Ajoutés manuellement'];
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
          <div style="display:flex;align-items:center;gap:6px">
            ${item.qtys.length?`<div class="sqty">${item.qtys.join(' + ')}</div>`:''}
            <button class="scat-btn" onclick="event.stopPropagation();openCatPicker('${item.name.replace(/'/g,"\\'")}')">
              <svg viewBox="0 0 24 24" style="width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  });
  h += `</div>`;
  document.getElementById('scontent').innerHTML = h;
}

/* ══ CHANGEMENT DE CATÉGORIE ══ */
const CATS_SHOP = ['Légumes','Fruits','Viandes & Poissons','Produits laitiers','Féculents','Épicerie','Autre'];

function openCatPicker(itemName) {
  const current = CAT_OVERRIDE[itemName.toLowerCase()] || 'Autre';
  const opts = CATS_SHOP.map(c =>
    `<button class="pickitem${c===current?' active':''}" onclick="setCatOverride('${itemName.replace(/'/g,"\\'")}','${c}')" style="padding:12px 16px;text-align:left">
      ${SICO[c]||'📦'} ${c}${c===current?' ✓':''}
    </button>`
  ).join('');
  document.getElementById('catpicker-title').textContent = itemName;
  document.getElementById('catpicker-list').innerHTML = opts;
  openOv('ov-catpicker');
}

function setCatOverride(itemName, cat) {
  CAT_OVERRIDE[itemName.toLowerCase()] = cat;
  sv(); closeOv('ov-catpicker'); renderShop();
  toast('Catégorie mise à jour !');
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
function initFrigo()  { /* géré par frigo.js */ }
