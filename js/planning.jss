/* ══ PLANNING SEMAINE ══ */
let weekOffset = 0;

function getWeekStart(offset) {
  const d = new Date();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
  monday.setHours(0,0,0,0);
  return monday;
}

function renderCal() {
  const start = getWeekStart(weekOffset);
  const today = new Date(); today.setHours(0,0,0,0);
  const fmt = d => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  document.getElementById('week-lbl').textContent = `Semaine du ${fmt(start)}`;

  let h = `<div class="week-grid">`;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    const meals = P[key] || [];
    const isToday = d.getTime() === today.getTime();
    const label = `${JOURS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

    h += `<div class="wday${isToday?' today':''}">
      <div class="wday-header">
        <div class="wday-title">
          <span class="wday-name">${JOURS[d.getDay()]}</span>
          <span class="wday-date${isToday?' tod':''}">${d.getDate()} ${MONTHS[d.getMonth()]}</span>
        </div>
        <button class="wday-add" onclick="openPlanOv('${key}','${label}')">
          <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Planifier
        </button>
      </div>
      ${meals.length ? `<div class="wday-meals">
        ${meals.map((m,mi) => {
          const rec = R[m.recipeIdx];
          return `<div class="wmeal" onclick="showDet(${m.recipeIdx})">
            ${rec?.photo ? `<img class="wmeal-photo" src="${rec.photo}">` : `<div class="wmeal-nophoto"></div>`}
            <div class="wmeal-info">
              <div class="wmeal-name">${m.name}</div>
              <div class="wmeal-cat">${CATS[rec?.category]||'Plat'}</div>
            </div>
            <button class="wmeal-del" onclick="event.stopPropagation();rmMeal('${key}',${mi})">×</button>
          </div>`;
        }).join('')}
      </div>` : ''}
    </div>`;
  }
  h += `</div>`;
  document.getElementById('week-grid').innerHTML = h;
}

function changeWeek(dir) { weekOffset += dir; renderCal(); }

function openPlanOv(key, label) {
  pkey = key;
  document.getElementById('plantitle').textContent = label;
  renderPicklist('');
  openOv('ov-plan');
}

function renderPicklist(q) {
  const filtered = R.filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase()));
  let h = '';
  if (!R.length) {
    h = `<div class="empty"><span class="empty-ico">🍳</span><h3>Aucune recette</h3><p>Ajoutez d'abord des recettes.</p></div>`;
  } else if (!filtered.length) {
    h = `<div class="empty"><span class="empty-ico">🔍</span><h3>Aucun résultat</h3></div>`;
  } else {
    h = filtered.map(r => {
      const i = R.indexOf(r);
      return `<div class="pickitem" onclick="addMeal(${i})">
        ${r.photo ? `<img src="${r.photo}" style="width:48px;height:48px;border-radius:10px;object-fit:cover;flex-shrink:0">` : `<div style="width:48px;height:48px;border-radius:10px;background:var(--c2);flex-shrink:0"></div>`}
        <div><div class="nm">${r.name}</div><div class="inf">${CATS[r.category]||'Plat'}${r.time?' · '+r.time+' min':''}</div></div>
      </div>`;
    }).join('');
  }
  document.getElementById('picklist').innerHTML = h;
}

function addMeal(ri) {
  if (!pkey) return;
  if (!P[pkey]) P[pkey] = [];
  P[pkey].push({ name:R[ri].name, emoji:R[ri].emoji, recipeIdx:ri });
  sv(); closeOv('ov-plan'); renderCal();
  toast('Repas planifié !');
}

function rmMeal(key, idx) {
  P[key].splice(idx,1);
  if (!P[key].length) delete P[key];
  sv(); renderCal();
}
