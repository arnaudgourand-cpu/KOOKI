/* ══ MODE CUISSON ══ */
let cookSteps    = [];
let cookIdx      = 0;
let cookTimer    = 0;
let cookInterval = null;
let cookWakeLock = null;
let cookStartX   = 0;

function openCooking(recipeIdx) {
  const r = R[recipeIdx];
  cookSteps = r.instructions ? r.instructions.split('\n').filter(s => s.trim()) : [];
  if (!cookSteps.length) { toast('Aucune instruction renseignée.'); return; }
  cookIdx = 0;
  stopTimer();
  renderCooking();

  // Empêcher l'écran de s'éteindre
  requestWakeLock();

  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.getElementById('pg-cooking').classList.add('on');
  window.scrollTo(0, 0);
}

function closeCooking() {
  stopTimer();
  releaseWakeLock();
  showPg('recipes', document.getElementById('ni-recipes'));
}

/* ── RENDU ── */
function renderCooking() {
  const total = cookSteps.length;
  const step  = cookSteps[cookIdx];

  document.getElementById('cook-num').textContent   = `Étape ${cookIdx + 1} / ${total}`;
  document.getElementById('cook-text').textContent  = step;
  document.getElementById('cook-prev').disabled     = cookIdx === 0;
  document.getElementById('cook-next').textContent  = cookIdx === total - 1 ? '✓ Terminé' : 'Suivant ›';

  // Barre de progression
  document.getElementById('cook-progress').style.width = `${((cookIdx + 1) / total) * 100}%`;

  // Dots
  document.getElementById('cook-dots').innerHTML = cookSteps.map((_, i) =>
    `<div class="cook-dot${i === cookIdx ? ' on' : i < cookIdx ? ' done' : ''}"></div>`
  ).join('');
}

/* ── NAVIGATION ── */
function cookNext() {
  if (cookIdx < cookSteps.length - 1) { cookIdx++; renderCooking(); }
  else { closeCooking(); toast('Bonne dégustation ! 🍽️'); }
}

function cookPrev() {
  if (cookIdx > 0) { cookIdx--; renderCooking(); }
}

/* ── SWIPE ── */
function cookTouchStart(e) { cookStartX = e.touches[0].clientX; }
function cookTouchEnd(e) {
  const diff = cookStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) {
    if (diff > 0) cookNext();
    else cookPrev();
  }
}

/* ── MINUTEUR ── */
function startTimer() {
  if (cookInterval) return;
  if (cookTimer === 0) cookTimer = 60;
  cookInterval = setInterval(() => {
    cookTimer--;
    renderTimer();
    if (cookTimer <= 0) {
      stopTimer();
      vibrateAlert();
    }
  }, 1000);
  document.getElementById('cook-timer-btn').textContent = '⏸ Pause';
}

function pauseTimer() {
  clearInterval(cookInterval);
  cookInterval = null;
  document.getElementById('cook-timer-btn').textContent = '▶ Reprendre';
}

function stopTimer() {
  clearInterval(cookInterval);
  cookInterval = null;
  cookTimer = 0;
  renderTimer();
  const btn = document.getElementById('cook-timer-btn');
  if (btn) btn.textContent = '▶ Démarrer';
}

function toggleTimer() {
  if (cookInterval) pauseTimer();
  else startTimer();
}

function addTime(secs) {
  cookTimer = Math.max(0, cookTimer + secs);
  renderTimer();
}

function renderTimer() {
  const el = document.getElementById('cook-timer-display');
  if (!el) return;
  const m = Math.floor(cookTimer / 60);
  const s = cookTimer % 60;
  el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  el.classList.toggle('urgent', cookTimer > 0 && cookTimer <= 10);
}

function vibrateAlert() {
  if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
  toast('⏰ Minuteur terminé !');
}

/* ── WAKE LOCK ── */
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      cookWakeLock = await navigator.wakeLock.request('screen');
    }
  } catch(e) { /* non supporté */ }
}

function releaseWakeLock() {
  if (cookWakeLock) { cookWakeLock.release(); cookWakeLock = null; }
}
