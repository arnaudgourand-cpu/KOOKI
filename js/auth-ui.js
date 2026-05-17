/* ══ AUTH UI ══ */
function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tab-login').style.background = isLogin ? 'var(--r)' : 'var(--w)';
  document.getElementById('tab-login').style.color = isLogin ? '#fff' : 'var(--t)';
  document.getElementById('tab-login').style.borderColor = isLogin ? 'var(--r)' : 'var(--bd)';
  document.getElementById('tab-signup').style.background = !isLogin ? 'var(--r)' : 'var(--w)';
  document.getElementById('tab-signup').style.color = !isLogin ? '#fff' : 'var(--t)';
  document.getElementById('tab-signup').style.borderColor = !isLogin ? 'var(--r)' : 'var(--bd)';
  document.getElementById('auth-submit-btn').textContent = isLogin ? 'Se connecter' : 'Créer mon compte';
  document.getElementById('auth-submit-btn').onclick = isLogin ? () => submitAuth('login') : () => submitAuth('signup');
  window._authTab = tab;
}

function submitAuth(tab) {
  const t = tab || window._authTab || 'login';
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  if (!email || !password) { toast('Remplis tous les champs'); return; }
  if (t === 'login') loginEmail(email, password);
  else signupEmail(email, password);
}

function openOvProfile() {
  if (!currentUser) return;
  const name = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Moi';
  const avatar = currentUser.user_metadata?.avatar_url;
  document.getElementById('profile-name').textContent = name;
  document.getElementById('profile-email').textContent = currentUser.email || '';
  document.getElementById('profile-avatar').innerHTML = avatar
    ? `<img src="${avatar}" style="width:72px;height:72px;border-radius:50%;object-fit:cover">`
    : `<div style="width:72px;height:72px;border-radius:50%;background:var(--r);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:#fff;margin:0 auto">${name[0].toUpperCase()}</div>`;
}

/* ══ INIT ══ */
window._authTab = 'login';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('ov-profile').addEventListener('click', function(e) {
    if (e.target === this) closeOv('ov-profile');
  });

  document.getElementById('auth-btn').addEventListener('click', function() {
    if (currentUser) { openOvProfile(); openOv('ov-profile'); }
    else openOv('ov-auth');
  });

  initAuth().then(() => { renderRecipes(); renderCal(); });
});
