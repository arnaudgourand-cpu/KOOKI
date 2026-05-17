/* ══ SUPABASE CONFIG ══ */
const SUPABASE_URL = 'https://qddakraxcwwrtvushlam.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkZGFrcmF4Y3d3cnR2dXNobGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5Njc4NzcsImV4cCI6MjA5NDU0Mzg3N30.Gj0u0hSO9sd91gdKlS0a33dzpqi8N6nUnWcYFf6VY54';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ══ STATE AUTH ══ */
let currentUser = null;

/* ══ INIT AUTH ══ */
async function initAuth() {
  const { data: { session } } = await db.auth.getSession();
  currentUser = session?.user ?? null;
  renderAuthUI();

  db.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    renderAuthUI();
    if (currentUser) {
      loadRecipesFromSupabase();
    } else {
      R = [];
      renderRecipes();
    }
  });

  if (currentUser) await loadRecipesFromSupabase();
}

/* ══ LOGIN EMAIL ══ */
async function loginEmail(email, password) {
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) { toast('❌ ' + error.message); return; }
  closeOv('ov-auth');
  toast('✅ Connecté !');
}

/* ══ SIGNUP EMAIL ══ */
async function signupEmail(email, password) {
  const { error } = await db.auth.signUp({ email, password });
  if (error) { toast('❌ ' + error.message); return; }
  closeOv('ov-auth');
  toast('✅ Compte créé ! Vérifie tes emails.');
}

/* ══ LOGIN GOOGLE ══ */
async function loginGoogle() {
  const { error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: 'https://arnaudgourand-cpu.github.io/KOOKI/' }
  });
  if (error) toast('❌ ' + error.message);
}

/* ══ LOGOUT ══ */
async function logout() {
  await db.auth.signOut();
  toast('👋 Déconnecté');
}

/* ══ RENDU UI AUTH ══ */
function renderAuthUI() {
  const btn = document.getElementById('auth-btn');
  if (!btn) return;
  if (currentUser) {
    const name = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Moi';
    const avatar = currentUser.user_metadata?.avatar_url;
    btn.innerHTML = avatar
      ? `<img src="${avatar}" style="width:28px;height:28px;border-radius:50%;object-fit:cover"> <span>${name}</span>`
      : `<svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> <span>${name}</span>`;
    btn.onclick = () => openOv('ov-profile');
  } else {
    btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> <span>Connexion</span>`;
    btn.onclick = () => openOv('ov-auth');
  }
}

/* ══ SUPABASE CRUD RECETTES ══ */
async function loadRecipesFromSupabase() {
  if (!currentUser) return;
  const { data, error } = await db.from('recipes').select('*').order('created_at', { ascending: false });
  if (error) { toast('❌ Erreur chargement recettes'); return; }
  R = (data || []).map(dbToLocal);
  renderRecipes();
}

async function saveRecipeToSupabase(recipe) {
  if (!currentUser) return null;
  const payload = localToDb(recipe);
  const { data, error } = await db.from('recipes').insert([payload]).select().single();
  if (error) { toast('❌ Erreur sauvegarde'); return null; }
  return data;
}

async function updateRecipeInSupabase(supabaseId, recipe) {
  if (!currentUser || !supabaseId) return;
  const payload = localToDb(recipe);
  const { error } = await db.from('recipes').update(payload).eq('id', supabaseId);
  if (error) toast('❌ Erreur mise à jour');
}

async function deleteRecipeFromSupabase(supabaseId) {
  if (!currentUser || !supabaseId) return;
  const { error } = await db.from('recipes').delete().eq('id', supabaseId);
  if (error) toast('❌ Erreur suppression');
}

async function toggleFavInSupabase(supabaseId, favValue) {
  if (!currentUser || !supabaseId) return;
  await db.from('recipes').update({ is_favorite: favValue }).eq('id', supabaseId);
}

/* ══ CONVERTISSEURS ══ */
function localToDb(r) {
  return {
    user_id:      currentUser.id,
    title:        r.name || '',
    description:  r.description || null,
    ingredients:  r.ingredients || [],
    steps:        r.instructions ? r.instructions.split('\n').filter(s => s.trim()) : [],
    image_url:    r.photo && r.photo.startsWith('data:') ? null : (r.photo || null),
    category:     r.category || 'plat',
    prep_time:    parseInt(r.time) || null,
    servings:     parseInt(r.servings) || null,
    is_favorite:  r.fav || false,
    source_url:   r.url || null,
    updated_at:   new Date().toISOString()
  };
}

function dbToLocal(d) {
  return {
    _id:          d.id,
    name:         d.title,
    description:  d.description || '',
    ingredients:  d.ingredients || [],
    instructions: Array.isArray(d.steps) ? d.steps.join('\n') : (d.steps || ''),
    photo:        d.image_url || null,
    category:     d.category || 'plat',
    time:         d.prep_time || '',
    servings:     d.servings || '',
    price:        d.price || '',
    fav:          d.is_favorite || false,
    url:          d.source_url || '',
    regime:       d.regime || 'normal'
  };
}
