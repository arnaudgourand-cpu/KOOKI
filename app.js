/* ══════════ DONNÉES ══════════ */
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const WDAYS  = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const CATS   = { plat:'Plat', entree:'Entrée', dessert:'Dessert', pdej:'Petit-déj', snack:'Snack' };
const FOODS  = {
  'Légumes':            ['carotte','courgette','tomate','oignon','ail','salade','épinard','poivron','champignon','pomme de terre','brocoli','chou','poireau','aubergine'],
  'Fruits':             ['pomme','poire','banane','orange','citron','fraise','framboise','raisin','pêche','abricot'],
  'Viandes & Poissons': ['poulet','bœuf','porc','agneau','saumon','thon','crevette','cabillaud','dinde','jambon','lardons','bacon'],
  'Produits laitiers':  ['lait','crème','beurre','fromage','yaourt','œuf','mozzarella','parmesan','gruyère'],
  'Féculents':          ['pâtes','riz','pain','farine','semoule','quinoa','lentille','haricot','pois chiche'],
  'Épicerie':           ['huile','sel','poivre','sucre','miel','sauce soja','moutarde','vinaigre','bouillon'],
};
const SICO = {'Légumes':'🥦','Fruits':'🍎','Viandes & Poissons':'🥩','Produits laitiers':'🧀','Féculents':'🌾','Épicerie':'🫙','Autre':'📦'};
const CATE = { plat:'🍽️', entree:'🥗', dessert:'🍮', pdej:'🥐', snack:'🥪' };

let R   = JSON.parse(localStorage.getItem('kk-r')||'[]');
let P   = JSON.parse(localStorage.getItem('kk-p')||'{}');
let CK  = JSON.parse(localStorage.getItem('kk-c')||'{}');
let cM  = new Date().getMonth();
let cY  = new Date().getFullYear();
let pkey    = null;
let urldat  = null;
let editIdx = null;
let photoData = null;

const sv = () => {
  localStorage.setItem('kk-r', JSON.stringify(R));
  localStorage.setItem('kk-p', JSON.stringify(P));
  localStorage.setItem('kk-c', JSON.stringify(CK));
};

/* ══════════ NAVIGATION ══════════ */
function showPg(id, btn) {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.ni').forEach(b => b.classList.remove('on'));
  document.getElementById('pg-'+id).classList.add('on');
  btn.classList.add('on');
  if (id==='planning') renderCal();
  if (id==='shopping') renderShop();
}

/* ══════════ TOAST ══════════ */
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('on');
  setTimeout(() => el.classList.remove('on'), 2300);
}

/* ══════════ OVERLAYS ══════════ */
function openOv(id)  { document.getElementById(id).classList.add('on'); }
function closeOv(id) { document.getElementById(id).classList.remove('on'); }
document.querySelectorAll('.ov').forEach(o => o.addEventListener('click', e => { if(e.target===o) o.classList.remove('on'); }));

let activeFilter = 'all';

function setFilter(cat, btn) {
  activeFilter = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  renderRecipes();
}

/* ══════════ RECETTES ══════════ */
function renderRecipes() {
  const q = (document.getElementById('searchInput')?.value||'').toLowerCase().trim();
  const filtered = R.filter(r =>
    (!q || r.name.toLowerCase().includes(q)) &&
    (activeFilter === 'all' || r.category === activeFilter)
  );
  const n = R.length;
  document.getElementById('rcount').textContent = q || activeFilter !== 'all'
    ? `${filtered.length} résultat${filtered.length>1?'s':''}`
    : `${n} recette${n>1?'s':''}`;

  let h = (!q && activeFilter === 'all') ? `<div class="add-card" onclick="openAdd()">
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
    <span>Ajouter une recette</span>
  </div>` : '';

  filtered.forEach(r => {
    const idx = R.indexOf(r);
    const hasPhoto = !!r.photo;
    h += `<div class="rcard" onclick="showDet(${idx})">
      ${hasPhoto
        ? `<img class="rcard-photo" src="${r.photo}" alt="${r.name}">`
        : `<div class="rcard-emoji"></div>`}
      <div class="rcard-grad"></div>
      <span class="rcard-cat">${CATS[r.category]||'Plat'}</span>
      <div class="rcard-body">
        <div class="rcard-name">${r.name}</div>
        <div class="rcard-meta">${[r.time&&`⏱ ${r.time} min`, r.servings&&`${r.servings} pers.`].filter(Boolean).join(' · ')}</div>
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

function showDet(i) {
  const r = R[i];
  document.getElementById('dettitle').textContent = (r.emoji||'') + ' ' + r.name;
  let h = '';
  if (r.photo) h += `<div style="border-radius:14px;overflow:hidden;height:200px;margin-bottom:16px"><img src="${r.photo}" style="width:100%;height:100%;object-fit:cover"></div>`;
  h += `<div class="tags" style="margin-bottom:14px">
    <span class="tag tag-r">${CATS[r.category]||'Plat'}</span>
    ${r.time?`<span class="tag tag-n">⏱ ${r.time} min</span>`:''}
    ${r.servings?`<span class="tag tag-g">${r.servings} pers.</span>`:''}
  </div>`;
  if (r.ingredients?.length) {
    h += `<div style="font-size:14px;font-weight:900;margin-bottom:10px">Ingrédients</div>`;
    h += r.ingredients.map(g => `<div class="deting"><span>${g.name}</span><span class="deqty">${g.qty||''} ${g.unit||''}</span></div>`).join('');
  }
  if (r.instructions) {
    h += `<div style="font-size:14px;font-weight:900;margin:16px 0 8px">Préparation</div>
      <div style="font-size:13px;font-weight:700;color:var(--tm);line-height:1.7">${r.instructions.replace(/\n/g,'<br>')}</div>`;
  }
  if (r.url) h += `<div style="margin-top:12px"><a href="${r.url}" target="_blank" class="btn btn-w btn-sm">🔗 Source</a></div>`;
  h += `<button class="btn btn-r btn-full" style="margin-top:16px" onclick="closeOv('ov-det');openEdit(${i})">✏️ Modifier</button>`;
  document.getElementById('detbody').innerHTML = h;
  openOv('ov-det');
}

function delR(i) {
  if (!confirm('Supprimer cette recette ?')) return;
  R.splice(i,1); sv(); renderRecipes(); toast('Recette supprimée');
}

function goplan() {
  showPg('planning', document.getElementById('ni-planning'));
  toast('Choisissez un jour dans le calendrier');
}

/* ══════════ PHOTO ══════════ */
function handlePhoto(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    photoData = e.target.result;
    document.getElementById('photo-img').src = photoData;
    document.getElementById('photo-preview').style.display = 'block';
    document.getElementById('photo-label').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function clearPhoto() {
  photoData = null;
  const pi = document.getElementById('photo-input');
  if (pi) pi.value = '';
  const pp = document.getElementById('photo-preview');
  if (pp) pp.style.display = 'none';
  const pl = document.getElementById('photo-label');
  if (pl) pl.style.display = 'flex';
}

/* ══════════ AJOUT / ÉDITION ══════════ */
function openAdd() {
  editIdx = null;
  ['rn','rt','rs','ri','rurl'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('inglist').innerHTML = '';
  document.getElementById('spin').classList.remove('on');
  document.getElementById('uprev').style.display = 'none';
  document.querySelector('#ov-add .shd h3').textContent = 'Nouvelle recette';
  document.querySelector('#ov-add #t-manual .btn-r').textContent = 'Enregistrer la recette';
  clearPhoto();
  urldat = null; addIng(); swTab('manual'); openOv('ov-add');
}

function openEdit(i) {
  editIdx = i;
  const r = R[i];
  document.getElementById('rn').value = r.name || '';
  document.getElementById('rt').value = r.time || '';
  document.getElementById('rs').value = r.servings || '';
  document.getElementById('rc').value = r.category || 'plat';
  document.getElementById('ri').value = r.instructions || '';
  photoData = r.photo || null;
  if (photoData) {
    document.getElementById('photo-img').src = photoData;
    document.getElementById('photo-preview').style.display = 'block';
    document.getElementById('photo-label').style.display = 'none';
  } else {
    clearPhoto();
  }
  document.getElementById('inglist').innerHTML = '';
  if (r.ingredients?.length) r.ingredients.forEach(g => addIng(g.name, g.qty, g.unit));
  else addIng();
  document.querySelector('#ov-add .shd h3').textContent = 'Modifier la recette';
  document.querySelector('#ov-add #t-manual .btn-r').textContent = '💾 Enregistrer les modifications';
  swTab('manual');
  openOv('ov-add');
}

function swTab(t) {
  document.getElementById('t-manual').style.display = t==='manual' ? 'block' : 'none';
  document.getElementById('t-url').style.display    = t==='url'    ? 'block' : 'none';
  document.querySelectorAll('.tab').forEach((b,i) => b.classList.toggle('on', (i===0&&t==='manual')||(i===1&&t==='url')));
}

function addIng(n='',q='',u='') {
  const li = document.getElementById('inglist'), d = document.createElement('div');
  d.className = 'ingrow';
  d.innerHTML = `<input class="q" type="text" placeholder="Qté" value="${q}">
    <input class="u" type="text" placeholder="g, ml…" value="${u}">
    <input type="text" placeholder="Ingrédient" value="${n}">
    <button class="rmbtn" onclick="this.parentElement.remove()">×</button>`;
  li.appendChild(d);
}

function saveRecipe() {
  const name = document.getElementById('rn').value.trim();
  if (!name) { alert('Donnez un nom !'); return; }
  const ings = [];
  document.querySelectorAll('#inglist .ingrow').forEach(row => {
    const inp = row.querySelectorAll('input');
    if (inp[2].value.trim()) ings.push({ qty:inp[0].value, unit:inp[1].value, name:inp[2].value.trim() });
  });
  const recette = {
    name,
    photo:        photoData || null,
    emoji:        '',
    time:         document.getElementById('rt').value,
    servings:     document.getElementById('rs').value,
    category:     document.getElementById('rc').value,
    ingredients:  ings,
    instructions: document.getElementById('ri').value,
    url:          editIdx !== null ? R[editIdx].url : undefined,
  };
  const isEdit = editIdx !== null;
  if (isEdit) { R[editIdx] = recette; editIdx = null; }
  else R.push(recette);
  document.querySelector('#ov-add .shd h3').textContent = 'Nouvelle recette';
  document.querySelector('#ov-add #t-manual .btn-r').textContent = 'Enregistrer la recette';
  sv(); closeOv('ov-add'); renderRecipes();
  toast(isEdit ? '✅ Recette modifiée !' : '✅ Recette ajoutée !');
}

/* ══════════ IMPORT URL ══════════ */
async function importUrl() {
  const url = document.getElementById('rurl').value.trim();
  if (!url) { alert('Entrez une URL'); return; }
  document.getElementById('spin').classList.add('on');
  document.getElementById('uprev').style.display = 'none';
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{ role: 'user', content: `Extrais les informations de cette recette depuis l'URL : ${url}\n\nRéponds UNIQUEMENT en JSON valide (sans markdown, sans backticks) avec ce format exact :\n{"name":"...","emoji":"🍽️","time":30,"servings":4,"category":"plat","ingredients":[{"qty":"200","unit":"g","name":"farine"}],"instructions":"..."}\n\nSi tu ne peux pas accéder à l'URL, génère une recette cohérente avec le nom visible dans l'URL.\nCatégorie parmi : plat, entree, dessert, pdej, snack.` }]
      })
    });
    const data = await res.json();
    const raw = data.content.map(b => b.text||'').join('').replace(/```json|```/g,'').trim();
    urldat = JSON.parse(raw);
    urldat.url   = url;
    urldat.photo = null;
    document.getElementById('pname').textContent = `${urldat.emoji||'🍽️'} ${urldat.name}`;
    document.getElementById('pinfo').textContent = [urldat.time&&`${urldat.time} min`, urldat.servings&&`${urldat.servings} pers.`].filter(Boolean).join(' · ');
    document.getElementById('pings').textContent = urldat.ingredients?.map(g=>`${g.qty||''} ${g.unit||''} ${g.name}`.trim()).join(', ')||'';
    document.getElementById('uprev').style.display = 'block';
  } catch(e) {
    alert('Extraction impossible. Essayez en manuel.');
    console.error(e);
  }
  document.getElementById('spin').classList.remove('on');
}

function confirmUrl() {
  if (!urldat) return;
  R.push(urldat); sv(); closeOv('ov-add'); renderRecipes();
  toast('✅ Recette importée !');
}

/* ══════════ CALENDRIER ══════════ */
function renderCal() {
  document.getElementById('mlbl').textContent = `${MONTHS[cM]} ${cY}`;
  const first  = new Date(cY, cM, 1).getDay();
  const days   = new Date(cY, cM+1, 0).getDate();
  const offset = (first+6)%7;
  const today  = new Date();
  let h = WDAYS.map(d => `<div class="cdh">${d}</div>`).join('');
  for (let i=0; i<offset; i++) h += `<div class="cday off"></div>`;
  for (let d=1; d<=days; d++) {
    const key   = `${cY}-${cM+1}-${d}`;
    const meals = P[key]||[];
    const isT   = today.getDate()===d && today.getMonth()===cM && today.getFullYear()===cY;
    h += `<div class="cday${isT?' tod':''}" onclick="openPlanOv('${key}',${d})">
      <div class="cnum">${d}</div>
      ${meals.map((m,mi) => `<div class="cmeal"><span class="mn">${m.emoji||'🍽️'} ${m.name}</span><span class="rx" onclick="event.stopPropagation();rmMeal('${key}',${mi})">✕</span></div>`).join('')}
      <button class="cadd" onclick="event.stopPropagation();openPlanOv('${key}',${d})">+</button>
    </div>`;
  }
  document.getElementById('cgrid').innerHTML = h;
}

function changeMonth(d) {
  cM += d;
  if (cM<0)  { cM=11; cY--; }
  if (cM>11) { cM=0;  cY++; }
  renderCal();
}

function openPlanOv(key, day) {
  pkey = key;
  document.getElementById('plantitle').textContent = `${day} ${MONTHS[cM]}`;
  renderPicklist('');
  openOv('ov-plan');
}

function renderPicklist(q) {
  const filtered = R.filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase()));
  if (!R.length) {
    document.getElementById('picklist').innerHTML = `<div class="empty"><span class="empty-ico">🍳</span><h3>Aucune recette</h3><p>Ajoutez d'abord des recettes.</p></div>`;
    return;
  }
  let h = filtered.length === 0
    ? `<div class="empty"><span class="empty-ico">🔍</span><h3>Aucun résultat</h3></div>`
    : filtered.map(r => {
        const i = R.indexOf(r);
        return `<div class="pickitem" onclick="addMeal(${i})">
          ${r.photo
            ? `<img src="${r.photo}" style="width:48px;height:48px;border-radius:10px;object-fit:cover;flex-shrink:0">`
            : `<div style="width:48px;height:48px;border-radius:10px;background:var(--c2);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px">${r.emoji||'🍽️'}</div>`
          }
          <div><div class="nm">${r.name}</div><div class="inf">${CATS[r.category]||'Plat'}${r.time?' · '+r.time+' min':''}</div></div>
        </div>`;
      }).join('');
  document.getElementById('picklist').innerHTML = h;
}

function addMeal(ri) {
  if (!pkey) return;
  if (!P[pkey]) P[pkey] = [];
  P[pkey].push({ name:R[ri].name, emoji:R[ri].emoji, recipeIdx:ri });
  sv(); closeOv('ov-plan'); renderCal();
  toast('📅 Repas planifié !');
}

function rmMeal(key, idx) {
  P[key].splice(idx,1);
  if (!P[key].length) delete P[key];
  sv(); renderCal();
}

/* ══════════ COURSES ══════════ */
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
        const ck   = `${period}-${item.name}`;
        const done = CK[ck];
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

/* ══════════ INIT ══════════ */
renderRecipes();
renderCal();
