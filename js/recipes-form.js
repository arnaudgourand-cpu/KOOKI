/* ══ GÉNÉRATION IMAGE ══ */
async function openGeminiImage() {
  const name = document.getElementById('rn').value.trim();
  if (!name) { toast('Donne un nom à la recette d\'abord !'); return; }

  const btn = document.querySelector('button[onclick="openGeminiImage()"]');
  if (btn) { btn.textContent = '⏳ Génération en cours…'; btn.disabled = true; }

  try {
    const prompt = `Professional food photography of "${name}". Top view, beautiful plating, natural lighting, appetizing, high quality culinary photo on a nice plate or bowl.`;
    const res = await fetch('https://kooki-api.arnaud-gourand.workers.dev/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'image', prompt })
    });
    const data = await res.json();
    if (data.image) {
      photoData = data.image;
      document.getElementById('photo-img').src = photoData;
      document.getElementById('photo-preview').style.display = 'block';
      document.getElementById('photo-label').style.display = 'none';
      toast('✅ Image générée !');
    } else {
      toast('❌ Erreur génération image');
      console.error(data);
    }
  } catch(e) {
    toast('❌ Erreur : ' + e.message);
    console.error(e);
  }

  if (btn) { btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 8v8M8 12h8"/></svg> Générer une image avec IA`; btn.disabled = false; }
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

/* ══ SOUS-CATÉGORIES (multi-select) ══ */
function toggleSubcat(val) {
  const btn = document.querySelector(`#subcat-checkboxes button[data-val="${val}"]`);
  if (!btn) return;
  btn.classList.toggle('on');
}

function getSelectedSubcats() {
  return [...document.querySelectorAll('#subcat-checkboxes button.on')].map(b => b.dataset.val);
}

function renderSubcatButtons(selected = []) {
  const entries = Object.entries(SUBCATS);
  document.getElementById('subcat-checkboxes').innerHTML = entries.map(([val, label]) =>
    `<button type="button" class="cat-btn${selected.includes(val) ? ' on' : ''}" data-val="${val}" onclick="toggleSubcat('${val}')">${label}</button>`
  ).join('');
}

/* ══ AJOUT ══ */
function openAdd() {
  if (!currentUser) { openOv('ov-auth'); toast('Connecte-toi pour ajouter une recette'); return; }
  editIdx = null;
  ['rn','rt','rs','rp','ri','rurl'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('inglist').innerHTML = '';
  document.getElementById('spin').classList.remove('on');
  document.getElementById('uprev').style.display = 'none';
  document.getElementById('rg').value = 'normal';
  document.getElementById('rc').value = 'plat';
  renderSubcatButtons([]);
  document.querySelector('#ov-add .shd h3').textContent = 'Nouvelle recette';
  document.querySelector('#ov-add #t-manual .btn-r').textContent = 'Enregistrer la recette';
  clearPhoto(); urldat = null; addIng(); swTab('manual'); openOv('ov-add');
}

/* ══ ÉDITION ══ */
function openEdit(i) {
  editIdx = i;
  const r = R[i];
  document.getElementById('rn').value = r.name || '';
  document.getElementById('rt').value = r.time || '';
  document.getElementById('rs').value = r.servings || '';
  document.getElementById('rp').value = r.price || '';
  document.getElementById('rc').value = r.category || 'plat';
  document.getElementById('rg').value = r.regime || 'normal';
  document.getElementById('ri').value = r.instructions || '';
  renderSubcatButtons(r.subcats || []);
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

async function saveRecipe() {
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
    price: document.getElementById('rp').value,
    category: document.getElementById('rc').value,
    subcats: getSelectedSubcats(),
    regime: document.getElementById('rg').value || 'normal',
    ingredients: ings,
    instructions: document.getElementById('ri').value,
    url: editIdx !== null ? R[editIdx].url : undefined,
    fav: editIdx !== null ? R[editIdx].fav : false,
  };

  const isEdit = editIdx !== null;
  if (isEdit) {
    const supabaseId = R[editIdx]._id;
    R[editIdx] = { ...recette, _id: supabaseId };
    await updateRecipeInSupabase(supabaseId, recette);
    editIdx = null;
  } else {
    const saved = await saveRecipeToSupabase(recette);
    if (saved) R.unshift({ ...recette, _id: saved.id });
    else R.unshift(recette);
  }

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
    urldat.url = url;
    document.getElementById('pname').textContent = urldat.name;
    document.getElementById('pinfo').textContent = [urldat.time&&`${urldat.time} min`, urldat.servings&&`${urldat.servings} pers.`].filter(Boolean).join(' · ');
    document.getElementById('pings').textContent = urldat.ingredients?.map(g=>`${g.qty||''} ${g.unit||''} ${g.name}`.trim()).join(', ')||'';
    document.getElementById('uprev').style.display = 'block';
    if (urldat.photo) toast('✅ Photo extraite !');
  } catch(e) { alert('Extraction impossible. Essayez en manuel.'); console.error(e); }
  document.getElementById('spin').classList.remove('on');
}

async function confirmUrl() {
  if (!urldat) return;
  const saved = await saveRecipeToSupabase(urldat);
  if (saved) R.unshift({ ...urldat, _id: saved.id });
  else R.unshift(urldat);
  sv(); closeOv('ov-add'); renderRecipes();
  toast('Recette importée !');
}
