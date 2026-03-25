/* ══ DONNÉES ══ */
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const JOURS  = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
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

/* ══ STATE ══ */
let R   = JSON.parse(localStorage.getItem('kk-r')||'[]');
let P   = JSON.parse(localStorage.getItem('kk-p')||'{}');
let CK  = JSON.parse(localStorage.getItem('kk-c')||'{}');
let pkey = null, urldat = null, editIdx = null, photoData = null;

const sv = () => {
  localStorage.setItem('kk-r', JSON.stringify(R));
  localStorage.setItem('kk-p', JSON.stringify(P));
  localStorage.setItem('kk-c', JSON.stringify(CK));
};

/* ══ NAVIGATION ══ */
function showPg(id, btn) {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.ni').forEach(b => b.classList.remove('on'));
  document.getElementById('pg-'+id).classList.add('on');
  if (btn) btn.classList.add('on');
  if (id==='planning') renderCal();
  if (id==='shopping') { renderShop(); initFrigo(); initManual(); }
}

/* ══ TOAST ══ */
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('on');
  setTimeout(() => el.classList.remove('on'), 2300);
}

/* ══ OVERLAYS ══ */
function openOv(id)  { document.getElementById(id).classList.add('on'); }
function closeOv(id) { document.getElementById(id).classList.remove('on'); }
document.querySelectorAll('.ov').forEach(o => o.addEventListener('click', e => { if(e.target===o) o.classList.remove('on'); }));
