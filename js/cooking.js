/* ══ MODE CUISSON ══ */
let cookSteps    = [];
let cookIdx      = 0;
let cookWakeLock = null;
let cookStartX   = 0;

// Minuteur
let cookTimer    = 0;
let cookTimerInt = null;
// Chrono
let cookChrono   = 0;
let cookChronoInt= null;
let timerMode    = 'timer';

function openCooking(recipeIdx) {
  const r = R[recipeIdx];
  cookSteps = r.instructions ? r.instructions.split('\n').filter(s => s.trim()) : [];
  if (!cookSteps.length) { toast('Aucune instruction renseignée.'); return; }
  cookIdx = 0;
  stopTimer(); resetChrono();
  document.getElementById('cook-timer-panel').style.display = 'none';
  renderCooking();
  requestWakeLock();
  document.querySelector('.topbar').style.display = 'none';
  document.querySelector('.bnav').style.display   = 'none';
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.getElementById('pg-cooking').classList.add('on');
  window.scrollTo(0, 0);
}

function closeCooking() {
  stopTimer(); resetChrono();
  releaseWakeLock();
  document.querySelector('.topbar').style.display = '';
  document.querySelector('.bnav').style.display   = '';
  showPg('recipes', document.getElementById('ni-recipes'));
}

/* ── RENDU ── */
function renderCooking() {
  const total = cookSteps.length;
  document.getElementById('cook-num').textContent  = `Étape ${cookIdx + 1} / ${total}`;
  document.getElementById('cook-text').textContent = cookSteps[cookIdx];
  document.getElementById('cook-prev').disabled    = cookIdx === 0;
  document.getElementById('cook-next').textContent = cookIdx === total - 1 ? '✓ Terminé' : 'Suivant ›';
  document.getElementById('cook-progress').style.width = `${((cookIdx + 1) / total) * 100}%`;
  document.getElementById('cook-dots').innerHTML = cookSteps.map((_, i) =>
    `<div class="cook-dot${i===cookIdx?' on':i<cookIdx?' done':''}"></div>`).join('');
}

/* ── NAVIGATION ── */
function cookNext() {
  if (cookIdx < cookSteps.length - 1) { cookIdx++; renderCooking(); }
  else { closeCooking(); toast('Bonne dégustation !'); }
}
function cookPrev() { if (cookIdx > 0) { cookIdx--; renderCooking(); } }

/* ── SWIPE ── */
function cookTouchStart(e) { cookStartX = e.touches[0].clientX; }
function cookTouchEnd(e) {
  const diff = cookStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) { if (diff > 0) cookNext(); else cookPrev(); }
}

/* ── PANEL MINUTEUR ── */
function toggleTimerPanel() {
  const panel = document.getElementById('cook-timer-panel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function setTimerMode(mode, btn) {
  timerMode = mode;
  document.querySelectorAll('.cook-ttab').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('ct-timer').style.display  = mode === 'timer'  ? 'block' : 'none';
  document.getElementById('ct-chrono').style.display = mode === 'chrono' ? 'block' : 'none';
}

/* ── MINUTEUR ── */
function toggleTimer() {
  if (cookTimerInt) { clearInterval(cookTimerInt); cookTimerInt = null; document.getElementById('cook-timer-btn').textContent = '▶ Reprendre'; }
  else {
    if (cookTimer === 0) cookTimer = 60;
    cookTimerInt = setInterval(() => {
      cookTimer--;
      renderTimerDisplay();
      updateBadge();
      if (cookTimer <= 0) { stopTimer(); vibrateAlert(); }
    }, 1000);
    document.getElementById('cook-timer-btn').textContent = '⏸ Pause';
  }
}

function stopTimer() {
  clearInterval(cookTimerInt); cookTimerInt = null; cookTimer = 0;
  renderTimerDisplay(); syncPickerFromTimer(); updateBadge();
  const btn = document.getElementById('cook-timer-btn');
  if (btn) btn.textContent = '▶ Démarrer';
}

function addTimePart(part, val) {
  const minEl = document.getElementById('pick-min');
  const secEl = document.getElementById('pick-sec');
  if (part === 'min') minEl.value = Math.max(0, Math.min(99, parseInt(minEl.value||0) + val));
  if (part === 'sec') secEl.value = Math.max(0, Math.min(59, parseInt(secEl.value||0) + val));
  syncTimerFromPicker();
}

function syncTimerFromPicker() {
  const m = parseInt(document.getElementById('pick-min')?.value||0);
  const s = parseInt(document.getElementById('pick-sec')?.value||0);
  cookTimer = m * 60 + s;
  renderTimerDisplay();
}

function syncPickerFromTimer() {
  const minEl = document.getElementById('pick-min');
  const secEl = document.getElementById('pick-sec');
  if (minEl) minEl.value = Math.floor(cookTimer / 60);
  if (secEl) secEl.value = cookTimer % 60;
}



function renderTimerDisplay() {
  const el = document.getElementById('cook-timer-display');
  if (!el) return;
  const m = Math.floor(cookTimer / 60), s = cookTimer % 60;
  el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  el.classList.toggle('urgent', cookTimer > 0 && cookTimer <= 10);
}

/* ── CHRONOMÈTRE ── */
function toggleChrono() {
  if (cookChronoInt) { clearInterval(cookChronoInt); cookChronoInt = null; document.getElementById('cook-chrono-btn').textContent = '▶ Reprendre'; }
  else {
    cookChronoInt = setInterval(() => { cookChrono++; renderChronoDisplay(); updateBadge(); }, 1000);
    document.getElementById('cook-chrono-btn').textContent = '⏸ Pause';
  }
}

function resetChrono() {
  clearInterval(cookChronoInt); cookChronoInt = null; cookChrono = 0;
  renderChronoDisplay(); updateBadge();
  const btn = document.getElementById('cook-chrono-btn');
  if (btn) btn.textContent = '▶ Démarrer';
}

function renderChronoDisplay() {
  const el = document.getElementById('cook-chrono-display');
  if (!el) return;
  const m = Math.floor(cookChrono / 60), s = cookChrono % 60;
  el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

/* ── BADGE ── */
function updateBadge() {
  const badge = document.getElementById('cook-timer-badge');
  const wrap  = document.getElementById('cook-timer-wrap');
  if (!badge || !wrap) return;
  const active = cookTimerInt || cookChronoInt;
  const val = timerMode === 'timer' ? cookTimer : cookChrono;
  if (active && val > 0) {
    const m = Math.floor(val/60), s = val%60;
    badge.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    wrap.classList.add('active');
  } else {
    badge.textContent = '';
    wrap.classList.remove('active');
  }
}

/* ── VIBRATION ── */
function vibrateAlert() { if (navigator.vibrate) navigator.vibrate([500,200,500,200,500]); toast('⏰ Minuteur terminé !'); }

/* ── WAKE LOCK ── */
async function requestWakeLock() {
  try { if ('wakeLock' in navigator) cookWakeLock = await navigator.wakeLock.request('screen'); } catch(e) {}
}
function releaseWakeLock() { if (cookWakeLock) { cookWakeLock.release(); cookWakeLock = null; } }
