/* ══ FILTRES ══ */
let activeFilter = 'all';
let activeRegime = 'all';

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

/* ══ LISTE RECETTES ══ */
function renderRecipes() {
  const q = (document.getElementById('searchInput')?.value||'').toLowerCase().trim();
  const filtered = R.filter(r =>
    (!q || r.name.toLowerCase().includes(q)) &&
    (activeFilter === 'all' || r.category === activeFilter) &&
    (activeRegime === 'all' || r.regime === activeRegime)
  );
  const n = R.length;
  document.getElementById('rcount').textContent = q || activeFilter !== 'all' || activeRegime !== 'all'
    ? `${filtered.length} résultat${filtered.length>1?'s':''}`
    : `${n} recette${n>1?'s':''}`;

  let h = (!q && activeFilter === 'all') ? `<div class="add-card" onclick="openAdd()">
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
    <span>Ajouter une recette</span>
  </div>` : '';

  filtered.forEach(r => {
    const idx = R.indexOf(r);
    h += `<div class="rcard" onclick="showDet(${idx})">
      ${r.photo ? `<img class="rcard-photo" src="${r.photo}" alt="${r.name}">` : `<div class="rcard-emoji"></div>`}
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

/* ══ DÉTAIL (sheet) ══ */
function showDet(i) {
  const r = R[i];
  document.getElementById('dettitle').textContent = r.name;
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
  h += `<div style="display:flex;gap:8px;margin-top:16px">
    <button class="btn btn-r btn-full" onclick="closeOv('ov-det');openFiche(${i})">Voir la fiche complète</button>
    <button class="btn btn-w" onclick="closeOv('ov-det');openEdit(${i})" style="flex-shrink:0">✏️</button>
  </div>`;
  document.getElementById('detbody').innerHTML = h;
  openOv('ov-det');
}

/* ══ FICHE COMPLÈTE ══ */
function openFiche(i) {
  const r = R[i];
  const steps = r.instructions ? r.instructions.split('\n').filter(s => s.trim()) : [];
  let h = `
    <div class="fiche-hero">
      ${r.photo ? `<img src="${r.photo}" class="fiche-photo">` : `<div class="fiche-nophoto"></div>`}
      <div class="fiche-hero-overlay">
        <button class="fiche-back" onclick="showPg('recipes', document.getElementById('ni-recipes'))">
          <svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button class="fiche-edit" onclick="openEdit(${i})">
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
        ${r.servings?`<span class="fiche-badge fiche-badge-n">${r.servings} pers.</span>`:''}
      </div>
      ${r.ingredients?.length ? `<div class="fiche-section">
        <div class="fiche-section-title">Ingrédients</div>
        <div class="fiche-ings">${r.ingredients.map(g=>`
          <div class="fiche-ing">
            <span class="fiche-ing-name">${g.name}</span>
            <span class="fiche-ing-qty">${[g.qty,g.unit].filter(Boolean).join(' ')}</span>
          </div>`).join('')}
        </div>
      </div>` : ''}
      ${steps.length ? `<div class="fiche-section">
        <div class="fiche-section-title">Préparation</div>
        <div class="fiche-steps">${steps.map((s,si)=>`
          <div class="fiche-step">
            <div class="fiche-step-num">${si+1}</div>
            <div class="fiche-step-text">${s}</div>
          </div>`).join('')}
        </div>
      </div>` : ''}
      <button class="btn btn-r btn-full" style="margin-top:8px" onclick="showPg('planning', document.getElementById('ni-planning'))">+ Ajouter au planning</button>
      ${r.url?`<div style="margin-top:12px"><a href="${r.url}" target="_blank" class="btn btn-w btn-full">Voir la recette originale</a></div>`:''}
    </div>`;
  document.getElementById('fiche-content').innerHTML = h;
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.getElementById('pg-fiche').classList.add('on');
  window.scrollTo(0, 0);
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

/* ══ PHOTO ══ */
function handlePhoto(input) {
  const file = input.files[0]; if (!file) return;
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
  const pi = document.getElementById('photo-input'); if (pi) pi.value = '';
  const pp = document.getElementById('photo-preview'); if (pp) pp.style.display = 'none';
  const pl = document.getElementById('photo-label'); if (pl) pl.style.display = 'flex';
}

/* ══ AJOUT / ÉDITION ══ */
function openAdd() {
  editIdx = null;
  ['rn','rt','rs','ri','rurl'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('inglist').innerHTML = '';
  document.getElementById('spin').classList.remove('on');
  document.getElementById('uprev').style.display = 'none';
  document.getElementById('rg').value = 'normal';
  document.querySelector('#ov-add .shd h3').textContent = 'Nouvelle recette';
  document.querySelector('#ov-add #t-manual .btn-r').textContent = 'Enregistrer la recette';
  clearPhoto(); urldat = null; addIng(); swTab('manual'); openOv('ov-add');
}

function openEdit(i) {
  editIdx = i;
  const r = R[i];
  document.getElementById('rn').value = r.name || '';
  document.getElementById('rt').value = r.time || '';
  document.getElementById('rs').value = r.servings || '';
  document.getElementById('rc').value = r.category || 'plat';
  document.getElementById('rg').value = r.regime || 'normal';
  document.getElementById('ri').value = r.instructions || '';
  photoData = r.photo || null;
  if (photoData) {
    document.getElementById('photo-img').src = photoData;
    document.getElementById('photo-preview').style.display = 'block';
    document.getElementById('photo-label').style.display = 'none';
  } else { clearPhoto(); }
  document.getElementById('inglist').innerHTML = '';
  if (r.ingredients?.length) r.ingredients.forEach(g => addIng(g.name, g.qty, g.unit));
  else addIng();
  document.querySelector('#ov-add .shd h3').textContent = 'Modifier la recette';
  document.querySelector('#ov-add #t-manual .btn-r').textContent = '💾 Enregistrer les modifications';
  swTab('manual'); openOv('ov-add');
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
    name, photo: photoData || null,
    time: document.getElementById('rt').value,
    servings: document.getElementById('rs').value,
    category: document.getElementById('rc').value,
    regime: document.getElementById('rg').value || 'normal',
    ingredients: ings,
    instructions: document.getElementById('ri').value,
    url: editIdx !== null ? R[editIdx].url : undefined,
  };
  const isEdit = editIdx !== null;
  if (isEdit) { R[editIdx] = recette; editIdx = null; } else R.push(recette);
  document.querySelector('#ov-add .shd h3').textContent = 'Nouvelle recette';
  document.querySelector('#ov-add #t-manual .btn-r').textContent = 'Enregistrer la recette';
  sv(); closeOv('ov-add'); renderRecipes();
  toast(isEdit ? 'Recette modifiée !' : 'Recette ajoutée !');
}

/* ══ IMPORT URL ══ */
async function importUrl() {
  const url = document.getElementById('rurl').value.trim();
  if (!url) { alert('Entrez une URL'); return; }
  document.getElementById('spin').classList.add('on');
  document.getElementById('uprev').style.display = 'none';
  try {
    const res = await fetch('https://kooki-api.arnaud-gourand.workers.dev/', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    const rawText = data.content?.[0]?.text || '';
    const clean = rawText.replace(/```json|```/g,'').trim();
    urldat = JSON.parse(clean);
    urldat.url = url; urldat.photo = null;
    document.getElementById('pname').textContent = `${urldat.name}`;
    document.getElementById('pinfo').textContent = [urldat.time&&`${urldat.time} min`, urldat.servings&&`${urldat.servings} pers.`].filter(Boolean).join(' · ');
    document.getElementById('pings').textContent = urldat.ingredients?.map(g=>`${g.qty||''} ${g.unit||''} ${g.name}`.trim()).join(', ')||'';
    document.getElementById('uprev').style.display = 'block';
  } catch(e) { alert('Extraction impossible. Essayez en manuel.'); console.error(e); }
  document.getElementById('spin').classList.remove('on');
}

function confirmUrl() {
  if (!urldat) return;
  R.push(urldat); sv(); closeOv('ov-add'); renderRecipes();
  toast('Recette importée !');
}
