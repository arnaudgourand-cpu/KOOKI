/* ══ DONNÉES ══ */
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const JOURS  = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const CATS   = { plat:'Plat', entree:'Entrée', dessert:'Dessert', pdej:'Petit-déj', snack:'Snack' };
const FOODS = {
  'Primeur - Légumes':    ['carotte','courgette','tomate','oignon','ail','salade','épinard','poivron','champignon','pomme de terre','brocoli','chou','poireau','aubergine','concombre','céleri','radis','navet','artichaut','fenouil','maïs','haricot vert','petits pois','asperge','courge'],
  'Primeur - Fruits':     ['pomme','poire','banane','orange','citron','fraise','framboise','raisin','pêche','abricot','mangue','ananas','kiwi','pastèque','melon','cerise','prune','figue','grenade','myrtille'],
  'Viandes & Charcuterie':['poulet','bœuf','porc','agneau','dinde','veau','lapin','canard','jambon','lardons','bacon','saucisse','chorizo','salami','sauciflard','merguez','steak','côte','rôti','escalope'],
  'Poissonnerie':         ['saumon','thon','crevette','cabillaud','sole','dorade','bar','sardine','maquereau','truite','calamar','moule','huître','langouste','homard','poulpe','anchois'],
  'Produits laitiers':    ['lait','crème','beurre','fromage','yaourt','œuf','mozzarella','parmesan','gruyère','camembert','brie','roquefort','comté','emmental','ricotta','mascarpone'],
  'Boulangerie':          ['pain','baguette','brioche','croissant','farine','levure','biscotte','pain de mie','crackers','fougasse'],
  'Épicerie salée':       ['pâtes','riz','semoule','quinoa','lentille','haricot','pois chiche','boîte','conserve','huile','sel','poivre','moutarde','vinaigre','bouillon','sauce','mayonnaise','ketchup','cornichon'],
  'Épicerie sucrée':      ['sucre','miel','confiture','nutella','chocolat','caramel','sirop','compote','biscuit','gâteau','céréales'],
  'Boissons':             ['eau','jus','soda','café','thé','lait végétal','vin','bière','cidre','sirop','smoothie','limonade'],
  'Apéro':                ['chips','cacahuète','olive','tarama','houmous','guacamole','toast','gougère','nems','bouchée'],
  'Desserts':             ['glace','sorbet','mousse','tarte','éclair','madeleine','tiramisu','panna cotta','crème brûlée','flan'],
  'Hygiène & Soin':       ['shampoing','gel douche','savon','dentifrice','déodorant','crème','rasoir','coton','maquillage','parfum'],
  'Maison & Entretien':   ['lessive','liquide vaisselle','éponge','essuie-tout','poubelle','produit ménager','balai','serpillière','papier toilette','aspirateur'],
  'Animaux':              ['croquette','pâtée','litière','jouet animal','gamelle','cage','aquarium','os','friandise animal'],
};

const SICO = {
  'Primeur - Légumes':    '#5cb85c',
  'Primeur - Fruits':     '#f0a500',
  'Viandes & Charcuterie':'#c0392b',
  'Poissonnerie':         '#2980b9',
  'Produits laitiers':    '#f5e642',
  'Boulangerie':          '#d4a55a',
  'Épicerie salée':       '#7f8c8d',
  'Épicerie sucrée':      '#e91e8c',
  'Boissons':             '#3498db',
  'Apéro':                '#8e44ad',
  'Desserts':             '#e74c6a',
  'Hygiène & Soin':       '#1abc9c',
  'Maison & Entretien':   '#27ae60',
  'Animaux':              '#e67e22',
  'Ajoutés manuellement': '#bdc3c7',
  'Autre':                '#95a5a6',
};

/* ══ STATE ══ */
let R   = JSON.parse(localStorage.getItem('kk-r')||'[]');
let P   = JSON.parse(localStorage.getItem('kk-p')||'{}');
let CK  = JSON.parse(localStorage.getItem('kk-c')||'{}');
let CAT_OVERRIDE = JSON.parse(localStorage.getItem('kk-catov')||'{}');
let pkey = null, urldat = null, editIdx = null, photoData = null;

const sv = () => {
  localStorage.setItem('kk-r', JSON.stringify(R));
  localStorage.setItem('kk-p', JSON.stringify(P));
  localStorage.setItem('kk-c', JSON.stringify(CK));
  localStorage.setItem('kk-catov', JSON.stringify(CAT_OVERRIDE));
};

/* ══ NAVIGATION ══ */
function showPg(id, btn) {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.ni').forEach(b => b.classList.remove('on'));
  document.getElementById('pg-'+id).classList.add('on');
  if (btn) btn.classList.add('on');
  if (id==='planning') renderCal();
  if (id==='shopping') { renderShop(); initManual(); }
  if (id==='frigo')    { renderFrigo(); }
}

function openFrigoPage() {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.getElementById('pg-frigo').classList.add('on');
  renderFrigo();
  window.scrollTo(0, 0);
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
