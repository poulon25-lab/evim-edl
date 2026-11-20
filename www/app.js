// =====================================================================
//  État des Lieux IA — evim immobilier · By NSimo
// =====================================================================
const VERSION = '2.0';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const view = $('#view');
const ETATS = Gemini.ETATS;
const RANG = { 'Neuf': 0, 'Bon état': 1, "État d'usage": 2, 'Mauvais état': 3 };

// ---------- icônes ----------
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.9.7 3.1 2.5 3.5 5.2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.3-6.5 8-6.5s7 2.5 8 6.5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', chev: '<path d="M9 5l7 7-7 7"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="M21 16l-5-5-9 9"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  doc: '<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  check: '<path d="M5 12.5 10 17 19 7"/>',
  sign: '<path d="M3 17c3 0 4-8 7-8s1 7 4 7 3-3 5-3"/><path d="M3 21h18"/>',
  compare: '<path d="M7 4 3 8l4 4M3 8h13M17 12l4 4-4 4M21 16H8"/>',
  door: '<path d="M5 21V4a1 1 0 0 1 1-1h9l3 1v17M3 21h18M14 12h.01"/>',
  out: '<path d="M10 3H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9"/>',
  room: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h7v9M14 3v6h7"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  share: '<path d="M12 3v13M7 8l5-5 5 5M5 14v6h14v-6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  cloud: '<path d="M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 10a4 4 0 0 1 0 8z"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V8M7 13l5-5 5 5M5 4h14"/>',
};
const I = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24">${P[n] || ''}</svg>`;

// ---------- modèles de pièces ----------
const PIECES_DEFAUT = ['Entrée', 'Séjour', 'Cuisine', 'Chambre 1', 'Salle de bain', 'WC'];
const PIECES_SUGG = ['Chambre 2', 'Chambre 3', 'Bureau', "Salle d'eau", 'Couloir', 'Dégagement', 'Buanderie', 'Cellier', 'Balcon', 'Terrasse', 'Cave', 'Garage', 'Jardin', 'Salle à manger', 'Dressing'];
const BASE = ['Murs', 'Sol', 'Plafond', 'Portes', 'Fenêtres / volets', 'Électricité (prises, interrupteurs)'];
function elementsPour(nom) {
  const n = nom.toLowerCase();
  if (n.includes('cuisine')) return [...BASE, 'Chauffage', 'Évier / robinetterie', 'Plan de travail', 'Placards', 'Électroménager'];
  if (n.includes('bain') || n.includes('douche') || n.includes("d'eau")) return [...BASE, 'Lavabo / robinetterie', 'Baignoire / douche', 'Joints / faïence', 'Ventilation', 'Chauffage / sèche-serviette'];
  if (n.includes('wc') || n.includes('toilette')) return ['Murs', 'Sol', 'Plafond', 'Porte', "Cuvette / chasse d'eau", 'Lave-mains', 'Ventilation', 'Électricité'];
  if (n.includes('balcon') || n.includes('terrasse') || n.includes('jardin')) return ['Sol', 'Garde-corps / clôture', 'Murs / façade', 'Éclairage', 'Végétation'];
  if (n.includes('cave') || n.includes('garage') || n.includes('parking')) return ['Murs', 'Sol', 'Plafond', 'Porte / accès', 'Éclairage'];
  return [...BASE, 'Chauffage', 'Rangements'];
}
const nouvellePiece = nom => ({ id: DB.uid(), nom, elements: elementsPour(nom).map(e => ({ nom: e, etat: null, commentaire: '', ia: false })), photos: [], analyse: null, comparaison: null });

// ---------- utilitaires ----------
let toastT;
function toast(msg, ms = 2800) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, ms); }
window.onBackendError = m => toast('Synchronisation : ' + m, 5000);
const fmtDate = d => { if (!d) return ''; const [y, m, j] = d.split('-'); return `${j}/${m}/${y}`; };
const fmtLong = d => d ? new Date(d + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
const today = () => new Date().toISOString().slice(0, 10);
const initiales = n => (n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join('');
const prenom = n => (n || '').split(/\s+/)[0];
function openModal(html) { const m = $('#modal'); m.innerHTML = `<div class="sheet">${html}</div>`; m.hidden = false; m.onclick = e => { if (e.target === m) closeModal(); }; return m; }
function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; }
function confirmer(titre, texte = '', ok = 'Confirmer', danger = true) {
  return new Promise(res => {
    openModal(`<h2>${esc(titre)}</h2>${texte ? `<p class="muted">${esc(texte)}</p>` : ''}<div class="btns"><button class="btn ghost" id="c-no">Annuler</button><button class="btn ${danger ? 'danger' : ''}" id="c-ok">${esc(ok)}</button></div>`);
    $('#c-no').onclick = () => { closeModal(); res(false); };
    $('#c-ok').onclick = () => { closeModal(); res(true); };
  });
}
function demander(titre, valeur = '', placeholder = '') {
  return new Promise(res => {
    openModal(`<h2>${esc(titre)}</h2><input type="text" id="d-v" value="${esc(valeur)}" placeholder="${esc(placeholder)}"><div class="btns"><button class="btn ghost" id="d-no">Annuler</button><button class="btn" id="d-ok">Valider</button></div>`);
    const i = $('#d-v'); i.focus(); i.select();
    const ok = () => { const v = i.value.trim(); closeModal(); res(v || null); };
    $('#d-ok').onclick = ok; i.onkeydown = e => { if (e.key === 'Enter') ok(); };
    $('#d-no').onclick = () => { closeModal(); res(null); };
  });
}
async function copier(t) { try { await navigator.clipboard.writeText(t); toast('Copié ✓'); } catch { openModal(`<h2>Copie</h2><input type="text" value="${esc(t)}" onclick="this.select()"><div class="btns"><button class="btn" onclick="closeModal()">OK</button></div>`); } }
const ME = () => Backend.user;
const isAdmin = () => ME() && ME().role === 'admin';

// ---------- navigation ----------
const stack = [];
let navCourant = 'home';
function go(fn, ...args) { stack.push([fn, args]); render(); }
function navTo(id) { derniereCle = null; navCourant = id; stack.length = 0; renderNav(); go(NAV[id].fn); }
function back() { if (!$('#modal').hidden) { closeModal(); return true; } if (stack.length > 1) { stack.pop(); render(); return true; } return false; }
function replace(fn, ...args) { stack.pop(); go(fn, ...args); }
async function render() {
  const [fn, args] = stack[stack.length - 1];
  const racine = stack.length <= 1;
  $('#btn-back').hidden = racine;
  $('#brand-m').hidden = !racine;
  $('#top-actions').innerHTML = '';
  window.scrollTo(0, 0);
  try { await fn(...args); } catch (e) { console.error(e); view.innerHTML = `<div class="empty"><div class="ill">${I('alert')}</div><h3>Erreur de chargement</h3><p>${esc(e.message)}</p></div>`; }
}
function setTitle(t, home = false) { $('#title').textContent = home ? '' : t; document.title = t + ' · evim'; }
const NAV = {
  home: { label: 'Tableau de bord', icon: 'home', fn: () => viewHome() },
  team: { label: 'Équipe', icon: 'users', fn: () => viewTeam(), admin: true },
  account: { label: 'Mon compte', icon: 'user', fn: () => viewAccount() },
};
function nouveau() { navCourant = 'home'; stack.length = 0; stack.push([NAV.home.fn, []]); renderNav(); go(viewNewEdl); }
function renderNav() {
  const items = Object.entries(NAV).filter(([, n]) => !n.admin || isAdmin());
  $('#side-nav').innerHTML = items.map(([id, n]) => `<button data-nav="${id}" class="${navCourant === id ? 'on' : ''}">${I(n.icon)} ${n.label}</button>`).join('');
  $('.new[data-nav="new"]').innerHTML = `${I('plus')} Nouvel état des lieux`;
  const bn = [['home', 'Accueil', 'home'], ['new', 'Nouveau', 'plus'], ...(isAdmin() ? [['team', 'Équipe', 'users']] : []), ['account', 'Compte', 'user']];
  $('#bottomnav').innerHTML = bn.map(([id, l, ic]) => id === 'new'
    ? `<button data-nav="new" class="plus"><span class="pl">${I('plus')}</span>${l}</button>`
    : `<button data-nav="${id}" class="${navCourant === id ? 'on' : ''}">${I(ic)}${l}</button>`).join('');
  const u = ME();
  $('#side-me').innerHTML = `<div class="avatar">${esc(initiales(u.nom))}</div><div class="grow"><div class="b ell">${esc(u.nom)}</div><div class="xs muted ell">${u.role === 'admin' ? 'Administrateur' : 'Agent'}</div></div><button class="icon-btn" id="side-logout" title="Se déconnecter">${I('logout')}</button>`;
  $$('[data-nav]').forEach(b => b.onclick = () => b.dataset.nav === 'new' ? nouveau() : navTo(b.dataset.nav));
  $('#side-logout').onclick = deconnexion;
}
$('#btn-back').innerHTML = I('back');
$('#btn-back').onclick = back;

// ---------- images ----------
function lireImage(file, max = 1400, q = 0.72) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const r = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', q));
      };
      img.onerror = rej; img.src = fr.result;
    };
    fr.onerror = rej; fr.readAsDataURL(file);
  });
}
function choisirPhotos(camera) {
  return new Promise(res => { const inp = camera ? $('#in-camera') : $('#in-gallery'); inp.value = ''; inp.onchange = () => res([...inp.files]); inp.click(); });
}
async function photosData(ids) { const out = await Promise.all(ids.map(id => Backend.getPhoto(id))); return out.filter(Boolean); }

// ---------- données ----------
const getEdl = id => Backend.getEdl(id);
async function saveEdl(edl) { clearTimeout(saveT); edl.modifie = Date.now(); await Backend.saveEdl(edl); }
let saveT;
function saveLater(edl) { clearTimeout(saveT); saveT = setTimeout(() => saveEdl(edl), 700); }
function progression(edl) { let t = 0, ok = 0; edl.pieces.forEach(p => p.elements.forEach(e => { t++; if (e.etat) ok++; })); return t ? Math.round(ok * 100 / t) : 0; }
const estSigne = e => !!(e.signatures?.agent && e.signatures?.locataire);
const pieceRef = (entree, nom) => entree ? entree.pieces.find(p => p.nom.toLowerCase() === nom.toLowerCase()) : null;
function synthese(edl, entree) {
  const degr = [], ia = [];
  if (!entree) return { degr, ia };
  for (const p of edl.pieces) {
    const ref = pieceRef(entree, p.nom);
    if (ref) for (const e of p.elements) { const r = ref.elements.find(x => x.nom === e.nom); if (r && e.etat && r.etat && RANG[e.etat] > RANG[r.etat]) degr.push({ piece: p.nom, element: e.nom, avant: r.etat, apres: e.etat, commentaire: e.commentaire }); }
    for (const d of (p.comparaison?.nouveaux_degats || [])) ia.push({ piece: p.nom, ...d });
  }
  return { degr, ia };
}
const imputLabel = i => i === 'locataire' ? 'Imputable au locataire' : i === 'vetuste' ? 'Vétusté' : 'À vérifier';
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function ring(pct, size = 64, light = true) {
  const r = 26, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
  return `<svg class="ring-svg" viewBox="0 0 64 64" style="width:${size}px;height:${size}px"><circle cx="32" cy="32" r="${r}" fill="none" stroke="${light ? 'rgba(255,255,255,.18)' : '#eef1f2'}" stroke-width="6"/><circle cx="32" cy="32" r="${r}" fill="none" stroke="#02adb4" stroke-width="6" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 32 32)"/><text x="32" y="37" text-anchor="middle" font-family="Poppins,sans-serif" font-weight="600" font-size="15" fill="${light ? '#fff' : '#24292e'}">${pct}%</text></svg>`;
}

// =====================================================================
//  AUTHENTIFICATION
// =====================================================================
async function showAuth(mode = 'login') {
  $('#app').hidden = true; $('#boot').hidden = true; const a = $('#auth'); a.hidden = false;
  const premier = await Backend.needsAdminSetup();
  if (premier) mode = 'signup';
  const demo = Backend.mode === 'demo';
  a.innerHTML = `<div class="auth-card">
    <div class="brand" style="--w:200px"><img src="logo-h.png" alt="evim immobilier"><div class="by">By <b>NSimo</b></div></div>
    ${demo ? `<div class="demo">Mode démo : comptes et données restent sur cet appareil. Branche Firebase pour la version en ligne.</div>` : ''}
    ${mode === 'reset' ? `
      <h1>Mot de passe oublié</h1><p class="lead">Reçois un lien de réinitialisation par email.</p>
      <label class="f">Email</label><div class="input-ic">${I('mail')}<input type="email" id="a-email" autocomplete="email" placeholder="prenom.nom@evim.fr"></div>
      <div id="a-msg"></div>
      <button class="btn block" id="a-go" style="margin-top:18px">Envoyer le lien</button>
      <p class="small" style="text-align:center;margin-top:16px"><button class="link" data-m="login">← Retour à la connexion</button></p>`
    : `
      <h1>${premier ? 'Créer le compte administrateur' : mode === 'login' ? 'Bon retour 👋' : 'Créer mon compte agent'}</h1>
      <p class="lead">${premier ? 'Ce premier compte gérera l’équipe et les clés d’invitation.' : mode === 'login' ? 'Connecte-toi pour accéder à tes états des lieux.' : 'Il te faut la clé d’invitation fournie par ton responsable.'}</p>
      ${premier ? '' : `<div class="tabs"><button data-m="login" class="${mode === 'login' ? 'on' : ''}">Connexion</button><button data-m="signup" class="${mode === 'signup' ? 'on' : ''}">Créer un compte</button></div>`}
      ${mode === 'signup' ? `<label class="f">Nom et prénom</label><div class="input-ic">${I('user')}<input type="text" id="a-nom" autocomplete="name" placeholder="Julie Martin"></div>` : ''}
      <label class="f">Email</label><div class="input-ic">${I('mail')}<input type="email" id="a-email" autocomplete="email" placeholder="prenom.nom@evim.fr"></div>
      <label class="f">Mot de passe</label><div class="input-ic">${I('lock')}<input type="password" id="a-pw" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" placeholder="${mode === 'login' ? '••••••••' : '6 caractères minimum'}"></div>
      ${mode === 'signup' && !premier ? `<label class="f">Clé d'invitation</label><div class="input-ic">${I('key')}<input type="text" id="a-key" placeholder="EVIM-XXXX-XXXX" style="text-transform:uppercase;letter-spacing:.06em"></div>
        ${demo ? '' : `<div class="xs muted" style="margin-top:6px">Administrateur : laisse ce champ vide.</div>`}` : ''}
      <div id="a-msg"></div>
      <button class="btn block" id="a-go" style="margin-top:20px">${mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</button>
      ${mode === 'login' && !demo ? `<p class="small" style="text-align:center;margin-top:14px"><button class="link" data-m="reset">Mot de passe oublié ?</button></p>` : ''}`}
    <p class="xs muted" style="text-align:center;margin:22px 0 0">État des Lieux IA · v${VERSION}</p>
  </div>`;
  $$('[data-m]', a).forEach(b => b.onclick = () => showAuth(b.dataset.m));
  const msg = (t, ok) => $('#a-msg').innerHTML = `<div class="${ok ? 'info' : 'err'}">${esc(t)}</div>`;
  const goBtn = $('#a-go');
  const submit = async () => {
    const email = $('#a-email').value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return msg('Adresse email invalide.');
    goBtn.disabled = true; const old = goBtn.innerHTML; goBtn.innerHTML = '<span class="spinner"></span>';
    try {
      if (mode === 'reset') { await Backend.resetPassword(email); msg('Si un compte existe, un email de réinitialisation vient d’être envoyé.', true); }
      else if (mode === 'login') { await Backend.signIn(email, $('#a-pw').value); return showApp(); }
      else {
        const nom = $('#a-nom').value.trim(); if (!nom) throw new Error('Indique ton nom et prénom.');
        await Backend.signUp({ email, pw: $('#a-pw').value, nom, invite: $('#a-key') ? $('#a-key').value : '' });
        toast(`Bienvenue ${prenom(nom)} !`); return showApp();
      }
    } catch (e) { msg(e.message); }
    goBtn.disabled = false; goBtn.innerHTML = old;
  };
  goBtn.onclick = submit;
  $$('input', a).forEach(i => i.onkeydown = e => { if (e.key === 'Enter') submit(); });
}
async function deconnexion() {
  if (!await confirmer('Se déconnecter ?', '', 'Se déconnecter', false)) return;
  await Backend.signOut(); showAuth('login');
}
function showApp() {
  $('#auth').hidden = true; $('#boot').hidden = true; $('#app').hidden = false;
  navTo('home');
}

// =====================================================================
//  TABLEAU DE BORD
// =====================================================================
const filtres = { q: '', f: 'tous', agent: '' };
async function viewHome() {
  setTitle('Tableau de bord', true);
  view.innerHTML = `<div class="empty"><span class="spinner d"></span></div>`;
  const [edls, biens, cfg] = await Promise.all([Backend.listEdls(), Backend.listBiens(), Backend.getConfig().catch(() => ({}))]);
  const bmap = Object.fromEntries(biens.map(b => [b.id, b]));
  edls.sort((a, b) => (b.modifie || 0) - (a.modifie || 0));
  const mois = today().slice(0, 7);
  const signes = edls.filter(estSigne).length;
  const agents = [...new Map(edls.map(e => [e.owner, e.ownerNom || '—'])).entries()];
  const h = new Date().getHours();
  view.innerHTML = `
    <div class="hello"><h2>${h < 18 ? 'Bonjour' : 'Bonsoir'} ${esc(prenom(ME().nom))}</h2><p>${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}${isAdmin() ? ' · Vue administrateur (toute l’agence)' : ''}</p></div>
    ${!cfg.geminiKey ? `<div class="card" style="margin-top:16px;display:flex;gap:12px;align-items:center;border:1px solid #e4dcfb;background:linear-gradient(90deg,var(--ai-l),#fff)"><div class="avatar" style="background:var(--ai)">${I('spark')}</div><div class="grow"><b>Analyse IA désactivée</b><div class="small muted">${isAdmin() ? 'Ajoute la clé Gemini de l’agence pour activer l’analyse automatique des photos.' : 'Ton administrateur doit configurer la clé Gemini.'}</div></div>${isAdmin() ? `<button class="btn sm ai" id="go-ia">Configurer</button>` : ''}</div>` : ''}
    <div class="stats">
      <div class="stat hero"><div class="ic">${I('doc')}</div><div class="v">${edls.length}</div><div class="l">États des lieux</div></div>
      <div class="stat"><div class="ic" style="background:var(--warn-l);color:#a96a00">${I('clock')}</div><div class="v">${edls.length - signes}</div><div class="l">À finaliser</div></div>
      <div class="stat"><div class="ic" style="background:var(--ok-l);color:var(--ok)">${I('check')}</div><div class="v">${signes}</div><div class="l">Signés</div></div>
      <div class="stat"><div class="ic">${I('cal')}</div><div class="v">${edls.filter(e => (e.date || '').startsWith(mois)).length}</div><div class="l">Ce mois-ci</div></div>
    </div>
    <div class="toolbar">
      <div class="input-ic">${I('search')}<input type="search" id="q" placeholder="Rechercher une adresse, un locataire…" value="${esc(filtres.q)}"></div>
      ${isAdmin() && agents.length ? `<select id="agent" style="width:auto;min-width:170px"><option value="">Tous les agents</option>${agents.map(([id, n]) => `<option value="${esc(id)}" ${filtres.agent === id ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>` : ''}
    </div>
    <div class="chips" id="chips">${[['tous', 'Tous'], ['entree', 'Entrées'], ['sortie', 'Sorties'], ['afinir', 'À finaliser'], ['signe', 'Signés']].map(([k, l]) => `<button class="chip ${filtres.f === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
    <div class="sec-t"><span>Récents</span><span id="count"></span></div>
    <div id="list" class="grid-auto"></div>`;
  const drawList = () => {
    const q = norm(filtres.q);
    const list = edls.filter(e => {
      const b = bmap[e.bienId] || {};
      if (filtres.f === 'entree' && e.type !== 'entree') return false;
      if (filtres.f === 'sortie' && e.type !== 'sortie') return false;
      if (filtres.f === 'afinir' && estSigne(e)) return false;
      if (filtres.f === 'signe' && !estSigne(e)) return false;
      if (filtres.agent && e.owner !== filtres.agent) return false;
      return !q || norm([b.adresse, e.locataire, e.ownerNom].join(' ')).includes(q);
    });
    $('#count').textContent = list.length + ' résultat' + (list.length > 1 ? 's' : '');
    $('#list').innerHTML = list.length ? list.map(e => {
      const b = bmap[e.bienId] || {}; const pr = progression(e); const s = estSigne(e);
      return `<div class="edl-card" data-id="${e.id}">
        <div class="thumb ${e.type === 'sortie' ? 's' : ''}">${I(e.type === 'entree' ? 'door' : 'out')}</div>
        <div class="grow"><div class="t ell">${esc(b.adresse || 'Sans adresse')}</div>
          <div class="meta ell">${esc(e.locataire || 'Locataire non renseigné')} · ${fmtDate(e.date)}${isAdmin() && e.ownerNom ? ' · ' + esc(e.ownerNom) : ''}</div>
          <div class="tags"><span class="badge ${e.type}">${e.type === 'entree' ? 'Entrée' : 'Sortie'}</span>${s ? `<span class="badge ok">${I('check')} Signé</span>` : `<span class="badge warn">${pr} % rempli</span>`}</div>
          <div class="prog ${s ? 'ok' : ''}"><i style="width:${s ? 100 : pr}%"></i></div></div>
        <span class="chev">${I('chev')}</span></div>`;
    }).join('') : `<div class="empty" style="grid-column:1/-1"><div class="ill">${I('doc')}</div><h3>${edls.length ? 'Aucun résultat' : 'Aucun état des lieux'}</h3><p>${edls.length ? 'Modifie ta recherche ou les filtres.' : 'Crée ton premier état des lieux en quelques secondes.'}</p>${edls.length ? '' : `<button class="btn" id="first">${I('plus')} Nouvel état des lieux</button>`}</div>`;
    $$('.edl-card', view).forEach(el => el.onclick = () => go(viewEdl, el.dataset.id));
    const f = $('#first'); if (f) f.onclick = () => go(viewNewEdl);
  };
  drawList();
  $('#q').oninput = e => { filtres.q = e.target.value; drawList(); };
  $$('#chips .chip').forEach(c => c.onclick = () => { filtres.f = c.dataset.f; $$('#chips .chip').forEach(x => x.classList.toggle('on', x === c)); drawList(); });
  const ag = $('#agent'); if (ag) ag.onchange = () => { filtres.agent = ag.value; drawList(); };
  const gi = $('#go-ia'); if (gi) gi.onclick = () => navTo('account');
}

// =====================================================================
//  NOUVEL ÉTAT DES LIEUX
// =====================================================================
async function viewNewEdl() {
  setTitle('Nouvel état des lieux');
  const [biens, edls] = await Promise.all([Backend.listBiens(), Backend.listEdls()]);
  biens.sort((a, b) => (a.adresse || '').localeCompare(b.adresse || ''));
  view.innerHTML = `
  <div class="card"><div class="card-h"><h2>Type d'état des lieux</h2></div>
    <div class="type-pick" id="type">
      <button data-v="entree" class="on">${I('door')}<b>Entrée</b><span>Arrivée du locataire</span></button>
      <button data-v="sortie">${I('out')}<b>Sortie</b><span>Départ, comparé à l'entrée</span></button>
    </div></div>
  <div class="card"><div class="card-h"><h2>Logement</h2></div>
    <select id="bien"><option value="">＋ Nouveau logement</option>${biens.map(b => `<option value="${b.id}">${esc(b.adresse)}</option>`).join('')}</select>
    <div id="bien-new">
      <label class="f">Adresse complète</label><input type="text" id="adresse" placeholder="12 rue des Lilas, 75011 Paris">
      <div class="grid2"><div><label class="f">Type de bien</label><select id="tbien"><option>Appartement</option><option>Maison</option><option>Studio</option><option>Local commercial</option></select></div>
      <div><label class="f">Surface (m²)</label><input type="number" id="surface" inputmode="decimal" placeholder="48"></div></div>
      <label class="f">Bailleur / propriétaire</label><input type="text" id="bailleur" placeholder="Nom du propriétaire">
    </div>
    <div id="ref-wrap" hidden><label class="f">État des lieux d'entrée de référence</label><select id="ref"></select><div class="xs muted" style="margin-top:6px">Les pièces et états d'entrée seront repris pour la comparaison.</div></div>
  </div>
  <div class="card"><div class="card-h"><h2>Intervenants</h2></div>
    <div class="grid2 stack"><div><label class="f" style="margin-top:0">Locataire(s)</label><input type="text" id="locataire" placeholder="Nom et prénom"></div>
    <div><label class="f" style="margin-top:0">Date</label><input type="date" id="date" value="${today()}"></div></div>
    <label class="f">Agent</label><input type="text" id="agent" value="${esc(ME().nom)}">
  </div>
  <div class="card" id="pieces-card"><div class="card-h"><h2>Pièces du logement</h2><span class="sub">Modifiable ensuite</span></div>
    <div class="checks" id="pieces">${[...PIECES_DEFAUT, 'Chambre 2', 'Balcon', 'Cave'].map((p, i) => `<label class="check"><input type="checkbox" ${i < PIECES_DEFAUT.length ? 'checked' : ''} value="${esc(p)}"> ${esc(p)}</label>`).join('')}</div>
  </div>
  <button class="btn block" id="create" style="padding:15px">${I('check')} Créer l'état des lieux</button>`;
  let type = 'entree';
  const refreshRef = () => {
    const bid = $('#bien').value; $('#bien-new').hidden = !!bid;
    const entrees = edls.filter(e => e.type === 'entree' && e.bienId === bid).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const show = type === 'sortie' && entrees.length;
    $('#ref-wrap').hidden = !show;
    if (show && !$('#ref').options.length) $('#ref').innerHTML = entrees.map(e => `<option value="${e.id}">${fmtDate(e.date)} · ${esc(e.locataire || '')}</option>`).join('') + `<option value="">— Aucun —</option>`;
    if (!show) $('#ref').innerHTML = '';
    $('#pieces-card').hidden = !!(show && $('#ref').value);
    if (show && $('#ref').value) { const e = entrees.find(x => x.id === $('#ref').value); if (e && !$('#locataire').value) $('#locataire').value = e.locataire || ''; }
  };
  $$('#type button').forEach(b => b.onclick = () => { $$('#type button').forEach(x => x.classList.toggle('on', x === b)); type = b.dataset.v; refreshRef(); });
  $('#bien').onchange = () => { $('#ref').innerHTML = ''; refreshRef(); }; $('#ref').onchange = refreshRef; refreshRef();
  $('#create').onclick = async () => {
    let bienId = $('#bien').value;
    if (!bienId) {
      const adresse = $('#adresse').value.trim(); if (!adresse) { $('#adresse').focus(); return toast("Indique l'adresse du logement"); }
      bienId = DB.uid();
      await Backend.saveBien({ id: bienId, adresse, type: $('#tbien').value, surface: $('#surface').value, bailleur: $('#bailleur').value.trim(), cree: Date.now() });
    }
    const refId = type === 'sortie' ? ($('#ref').value || null) : null;
    let pieces;
    if (refId) { const ref = await getEdl(refId); pieces = ref.pieces.map(p => ({ ...nouvellePiece(p.nom), elements: p.elements.map(e => ({ nom: e.nom, etat: null, commentaire: '', ia: false })) })); }
    else pieces = $$('#pieces input:checked').map(i => nouvellePiece(i.value));
    const edl = { id: DB.uid(), bienId, type, refEntreeId: refId, date: $('#date').value || today(), locataire: $('#locataire').value.trim(), agent: $('#agent').value.trim(),
      pieces, compteurs: { elec: '', eauFroide: '', eauChaude: '', gaz: '' }, cles: '', observations: '', signatures: { agent: null, locataire: null }, cree: Date.now() };
    await saveEdl(edl); toast('État des lieux créé'); replace(viewEdl, edl.id);
  };
}

// =====================================================================
//  ÉTAT DES LIEUX
// =====================================================================
async function viewEdl(id) {
  const edl = await getEdl(id); if (!edl) { toast('État des lieux introuvable'); return back(); }
  const bien = await Backend.getBien(edl.bienId) || {};
  const entree = edl.refEntreeId ? await getEdl(edl.refEntreeId) : null;
  setTitle(edl.type === 'entree' ? "État des lieux d'entrée" : 'État des lieux de sortie');
  const c = edl.compteurs || {}; const pr = progression(edl);
  $('#top-actions').innerHTML = `<button class="btn sm" id="pdf-top">${I('doc')} PDF</button>`;
  const sig = (k, t) => `<div><div class="b small">${t}</div><div class="sig-box">${edl.signatures?.[k] ? `<img src="${edl.signatures[k]}">` : `<span class="muted small">Non signé</span>`}</div><button class="btn ${edl.signatures?.[k] ? 'ghost' : 'sec'} block sm" data-sig="${k}">${I('sign')} ${edl.signatures?.[k] ? 'Signer à nouveau' : 'Faire signer'}</button></div>`;
  let compHtml = '';
  if (entree) {
    const sy = synthese(edl, entree); const cE = entree.compteurs || {}; const num = v => parseFloat(String(v).replace(',', '.'));
    const conso = [['Électricité', 'elec', 'kWh'], ['Gaz', 'gaz', 'm³'], ['Eau froide', 'eauFroide', 'm³'], ['Eau chaude', 'eauChaude', 'm³']].filter(([, k]) => cE[k] && c[k]).map(([l, k, u]) => `<div class="row small" style="justify-content:space-between;padding:4px 0"><span>${l}</span><span class="muted">${esc(cE[k])} → ${esc(c[k])} ${u} · <b style="color:var(--ink)">+${Math.round((num(c[k]) - num(cE[k])) * 100) / 100} ${u}</b></span></div>`);
    const nLoc = sy.ia.filter(d => d.imputation === 'locataire').length;
    compHtml = `<div class="sec-t"><span>Comparaison avec l'entrée</span></div>
    <div class="card"><div class="card-h"><div><h2>Entrée du ${fmtDate(entree.date)} → sortie</h2><div class="sub">${esc(entree.locataire || '')}</div></div>${I('compare')}</div>
      <div class="row wrap" style="gap:6px"><span class="badge ${sy.degr.length ? 'bad' : 'ok'}">${sy.degr.length} élément(s) dégradé(s)</span><span class="badge ${nLoc ? 'bad' : ''}">${nLoc} dégât(s) imputable(s) (IA)</span></div>
      ${sy.degr.map(d => `<div class="issue elevee"><span class="dot"></span><div><b>${esc(d.piece)} · ${esc(d.element)}</b> : ${esc(d.avant)} → ${esc(d.apres)}${d.commentaire ? `<div class="xs muted">${esc(d.commentaire)}</div>` : ''}</div></div>`).join('')}
      ${sy.ia.map(d => `<div class="issue ${esc(d.imputation)}"><span class="dot"></span><div><b>${esc(d.piece)} · ${esc(d.element)}</b> — ${esc(d.description)}<div class="xs muted">${imputLabel(d.imputation)}</div></div></div>`).join('')}
      ${!sy.degr.length && !sy.ia.length ? '<p class="small muted">Aucune dégradation relevée pour l’instant. Renseigne les états des pièces ou lance la comparaison IA.</p>' : ''}
      ${conso.length ? `<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--line2)"><div class="b small" style="margin-bottom:4px">Consommations sur la période</div>${conso.join('')}</div>` : ''}
      <div class="btns"><button class="btn ai" id="cmp-all">${I('spark')} Comparer toutes les pièces (IA)</button></div></div>`;
  }
  view.innerHTML = `
  <div class="hero-edl">
    <span class="badge" style="background:rgba(255,255,255,.15);color:#fff">${edl.type === 'entree' ? 'Entrée' : 'Sortie'}${estSigne(edl) ? ' · Signé ✓' : ''}</span>
    <h2 style="padding-right:76px">${esc(bien.adresse)}</h2>
    <div class="m" style="padding-right:76px">${esc([bien.type, bien.surface ? bien.surface + ' m²' : '', bien.bailleur ? 'Bailleur : ' + bien.bailleur : ''].filter(Boolean).join(' · '))}</div>
    <div class="m" style="margin-top:8px">${fmtLong(edl.date)}${edl.ownerNom && isAdmin() ? ' · Agent : ' + esc(edl.ownerNom) : ''}</div>
    <div class="ring">${ring(pr)}</div>
  </div>
  <div class="card"><div class="card-h"><h2>Informations</h2></div>
    <div class="grid2 stack"><div><label class="f" style="margin-top:0">Locataire(s)</label><input type="text" id="locataire" value="${esc(edl.locataire)}"></div>
    <div><label class="f" style="margin-top:0">Date</label><input type="date" id="date" value="${esc(edl.date)}"></div></div>
    <label class="f">Agent</label><input type="text" id="agent" value="${esc(edl.agent)}">
  </div>
  <div class="sec-t"><span>Pièces · ${edl.pieces.length}</span><button class="btn sm sec" id="add-piece">${I('plus')} Pièce</button></div>
  <div class="pieces-grid">${edl.pieces.map(p => {
    const n = p.elements.filter(e => e.etat).length; const ref = pieceRef(entree, p.nom);
    const pires = ref ? p.elements.filter(e => { const r = ref.elements.find(x => x.nom === e.nom); return r && e.etat && r.etat && RANG[e.etat] > RANG[r.etat]; }).length : 0;
    const nd = p.comparaison?.nouveaux_degats?.filter(d => d.imputation !== 'vetuste').length || 0;
    const done = n === p.elements.length;
    return `<div class="piece" data-p="${p.id}"><div class="pi" style="${done ? 'background:var(--ok-l);color:var(--ok)' : ''}">${I(done ? 'check' : 'room')}</div>
      <div class="grow"><div class="b ell">${esc(p.nom)}</div><div class="row wrap" style="gap:6px;margin-top:6px">
      <span class="badge">${n}/${p.elements.length}</span><span class="badge">${I('camera')} ${p.photos.length}</span>
      ${p.analyse ? `<span class="badge ai">${I('spark')} IA</span>` : ''}${pires || nd ? `<span class="badge bad">${Math.max(pires, nd)} dégradation(s)</span>` : ''}</div></div>
      <span class="chev">${I('chev')}</span></div>`;
  }).join('')}</div>
  ${compHtml}
  <div class="sec-t"><span>Compteurs et clés</span></div>
  <div class="card">
    <div class="grid2">
      <div><label class="f" style="margin-top:0">Électricité (kWh)</label><input type="text" inputmode="decimal" data-c="elec" value="${esc(c.elec)}"></div>
      <div><label class="f" style="margin-top:0">Gaz (m³)</label><input type="text" inputmode="decimal" data-c="gaz" value="${esc(c.gaz)}"></div>
      <div><label class="f">Eau froide (m³)</label><input type="text" inputmode="decimal" data-c="eauFroide" value="${esc(c.eauFroide)}"></div>
      <div><label class="f">Eau chaude (m³)</label><input type="text" inputmode="decimal" data-c="eauChaude" value="${esc(c.eauChaude)}"></div>
    </div>
    <label class="f">Clés remises</label><input type="text" id="cles" value="${esc(edl.cles)}" placeholder="2 clés porte d'entrée, 1 badge, 1 clé boîte aux lettres">
  </div>
  <div class="sec-t"><span>Observations générales</span></div>
  <div class="card"><textarea id="obs" placeholder="Remarques, réserves, éléments particuliers…">${esc(edl.observations)}</textarea></div>
  <div class="sec-t"><span>Signatures</span></div>
  <div class="card">
    <div class="grid2 stack">${sig('agent', 'Agent / bailleur')}${sig('locataire', 'Locataire')}</div>
    <label class="f">Fait à</label><input type="text" id="lieu" value="${esc(edl.lieuSignature || '')}" placeholder="Ville">
  </div>
  <div class="btns"><button class="btn" id="pdf" style="padding:15px">${I('doc')} Générer et partager le PDF</button></div>
  <div class="btns"><button class="btn danger" id="del">${I('trash')} Supprimer</button></div>`;

  $$('[data-p]', view).forEach(el => el.onclick = () => go(viewPiece, edl.id, el.dataset.p));
  ['locataire', 'date', 'agent'].forEach(k => $('#' + k).oninput = e => { edl[k] = e.target.value; saveLater(edl); });
  $$('[data-c]', view).forEach(i => i.oninput = () => { edl.compteurs[i.dataset.c] = i.value; saveLater(edl); });
  $('#cles').oninput = e => { edl.cles = e.target.value; saveLater(edl); };
  $('#obs').oninput = e => { edl.observations = e.target.value; saveLater(edl); };
  $('#lieu').oninput = e => { edl.lieuSignature = e.target.value; saveLater(edl); };
  $('#add-piece').onclick = () => ajouterPiece(edl);
  $$('[data-sig]', view).forEach(b => b.onclick = () => signer(edl, b.dataset.sig));
  const pdf = ev => exporterPdf(edl, bien, entree, ev.currentTarget);
  $('#pdf').onclick = pdf; $('#pdf-top').onclick = pdf;
  $('#del').onclick = async () => {
    if (!await confirmer('Supprimer cet état des lieux ?', 'Ses photos et signatures seront définitivement supprimées.', 'Supprimer')) return;
    for (const p of edl.pieces) for (const ph of p.photos) await Backend.deletePhoto(ph);
    await Backend.deleteEdl(edl.id); toast('Supprimé'); back();
  };
  const ca = $('#cmp-all');
  if (ca) ca.onclick = async () => {
    const todo = edl.pieces.filter(p => { const r = pieceRef(entree, p.nom); return r && r.photos.length && p.photos.length; });
    if (!todo.length) return toast('Ajoute des photos dans les pièces (entrée et sortie) pour comparer');
    ca.disabled = true; let i = 0;
    try {
      for (const p of todo) {
        ca.innerHTML = `<span class="spinner"></span> ${++i}/${todo.length} · ${esc(p.nom)}…`;
        const r = pieceRef(entree, p.nom);
        p.comparaison = { ...(await Gemini.comparerPiece(p.nom, await photosData(r.photos.slice(0, 6)), await photosData(p.photos.slice(0, 6)), r.elements)), date: Date.now() };
        await saveEdl(edl);
      }
      toast('Comparaison terminée ✓'); render();
    } catch (e) { toast(e.message, 5000); ca.disabled = false; ca.innerHTML = `${I('spark')} Comparer toutes les pièces (IA)`; }
  };
}

function ajouterPiece(edl) {
  openModal(`<h2>Ajouter une pièce</h2><p class="muted small">Choisis un modèle ou saisis un nom.</p>
    <input type="text" id="np" placeholder="Nom de la pièce">
    <div class="chips" style="flex-wrap:wrap;margin-top:12px">${PIECES_SUGG.map(s => `<button class="chip" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div>
    <div class="btns"><button class="btn ghost" id="cancel">Annuler</button><button class="btn" id="ok">Ajouter</button></div>`);
  $$('[data-s]').forEach(b => b.onclick = () => { $('#np').value = b.dataset.s; $$('[data-s]').forEach(x => x.classList.toggle('on', x === b)); });
  $('#cancel').onclick = closeModal;
  $('#ok').onclick = async () => { const nom = $('#np').value.trim(); if (!nom) return; edl.pieces.push(nouvellePiece(nom)); await saveEdl(edl); closeModal(); render(); };
}

function signer(edl, qui) {
  openModal(`<h2>Signature ${qui === 'agent' ? "de l'agent / bailleur" : 'du locataire'}</h2>
    <p class="muted small" style="margin:0">Mention « Lu et approuvé ». Signe avec le doigt (ou la souris) dans le cadre.</p>
    <canvas class="sig-pad" id="pad"></canvas>
    <div class="btns"><button class="btn ghost" id="clr">Effacer</button><button class="btn ghost" id="cancel">Annuler</button><button class="btn" id="ok">${I('check')} Valider</button></div>`);
  const cv = $('#pad'); const r = cv.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
  cv.width = r.width * dpr; cv.height = r.height * dpr;
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr); ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1d2a35';
  let drawing = false, vide = true, last;
  const pos = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  cv.onpointerdown = e => { drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = e => { if (!drawing) return; const p = pos(e); ctx.beginPath(); ctx.moveTo(...last); ctx.lineTo(...p); ctx.stroke(); last = p; vide = false; };
  cv.onpointerup = cv.onpointercancel = () => drawing = false;
  $('#clr').onclick = () => { ctx.clearRect(0, 0, cv.width, cv.height); vide = true; };
  $('#cancel').onclick = closeModal;
  $('#ok').onclick = async () => {
    if (vide) return toast('La signature est vide');
    edl.signatures = edl.signatures || {}; edl.signatures[qui] = cv.toDataURL('image/png'); edl.signatures[qui + 'Date'] = new Date().toISOString();
    await saveEdl(edl); closeModal(); toast('Signature enregistrée ✓'); render();
  };
}

// =====================================================================
//  PIÈCE
// =====================================================================
async function viewPiece(edlId, pieceId) {
  const edl = await getEdl(edlId); const p = edl && edl.pieces.find(x => x.id === pieceId); if (!p) return back();
  const entree = edl.refEntreeId ? await getEdl(edl.refEntreeId) : null;
  const ref = pieceRef(entree, p.nom);
  setTitle(p.nom);
  $('#top-actions').innerHTML = `<button class="icon-btn" id="ren" title="Renommer">${I('edit')}</button><button class="icon-btn" id="delp" title="Supprimer" style="color:var(--bad)">${I('trash')}</button>`;
  view.innerHTML = `<div class="empty"><span class="spinner d"></span></div>`;
  const imgs = await photosData(p.photos);
  const n = p.elements.filter(e => e.etat).length;
  view.innerHTML = `
  <div class="card">
    <div class="card-h"><div><h2>Photos</h2><div class="sub">${p.photos.length} photo(s) · murs, sol, plafond, équipements</div></div></div>
    <div class="photos">
      <button class="ph-add" id="cam">${I('camera')}Photo</button>
      <button class="ph-add" id="gal">${I('image')}Galerie</button>
      ${imgs.map((d, i) => `<div class="ph"><img src="${d}" data-zoom="${i}" alt=""><button class="del" data-delph="${i}" aria-label="Supprimer">${I('x')}</button></div>`).join('')}
    </div>
    <div class="btns"><button class="btn ai" id="ia" ${p.photos.length ? '' : 'disabled'}>${I('spark')} Analyser avec l'IA</button>
    ${ref ? `<button class="btn ai" id="cmp" ${p.photos.length && ref.photos.length ? '' : 'disabled'}>${I('compare')} Comparer avec l'entrée</button>` : ''}</div>
  </div>
  ${p.analyse ? `<div class="ai-box"><h2>${I('spark')} Analyse IA</h2><div class="small" style="color:var(--ink2)">${esc(p.analyse.resume || '')}</div>
    ${(p.analyse.defauts || []).map(d => `<div class="issue ${esc(norm(d.gravite))}"><span class="dot"></span><div><b>${esc(d.element)}</b> — ${esc(d.description)}<div class="xs muted">Gravité ${esc(d.gravite || '')}</div></div></div>`).join('') || '<div class="small muted" style="margin-top:6px">Aucun défaut détecté.</div>'}</div>` : ''}
  ${p.comparaison ? `<div class="ai-box"><h2>${I('compare')} Comparaison entrée → sortie</h2><div class="small" style="color:var(--ink2)">${esc(p.comparaison.resume || '')}</div>
    ${(p.comparaison.nouveaux_degats || []).map(d => `<div class="issue ${esc(d.imputation)}"><span class="dot"></span><div><b>${esc(d.element)}</b> — ${esc(d.description)}<div class="xs muted">${imputLabel(d.imputation)}</div></div></div>`).join('') || '<div class="small muted" style="margin-top:6px">Aucun nouveau dégât détecté.</div>'}</div>` : ''}
  <div class="card"><div class="card-h"><div><h2>Éléments</h2><div class="sub" id="el-count">${n}/${p.elements.length} renseignés</div></div></div>
  ${p.elements.map((e, i) => {
    const r = ref ? ref.elements.find(x => x.nom === e.nom) : null;
    const pire = r && e.etat && r.etat && RANG[e.etat] > RANG[r.etat];
    return `<div class="el"><div class="el-h"><span>${esc(e.nom)}</span>${e.ia ? `<span class="badge ai">${I('spark')} IA</span>` : ''}</div>
      <div class="seg" data-i="${i}">${ETATS.map(s => `<button data-v="${esc(s)}" class="${e.etat === s ? 'on' : ''}">${esc(s)}</button>`).join('')}</div>
      ${r ? `<div class="ref ${pire ? 'worse' : ''}">${pire ? I('alert') + ' Dégradé · ' : ''}Entrée : ${esc(r.etat || 'non renseigné')}${r.commentaire ? ' — ' + esc(r.commentaire) : ''}</div>` : ''}
      <textarea data-com="${i}" placeholder="Observations (défaut, localisation…)">${esc(e.commentaire)}</textarea></div>`;
  }).join('')}
  <button class="btn ghost block" id="add-el" style="margin-top:6px">${I('plus')} Ajouter un élément</button></div>`;

  $$('.seg[data-i]', view).forEach(seg => $$('button', seg).forEach(b => b.onclick = () => {
    const e = p.elements[+seg.dataset.i]; e.etat = e.etat === b.dataset.v ? null : b.dataset.v; e.ia = false;
    $$('button', seg).forEach(x => x.classList.toggle('on', x.dataset.v === e.etat));
    $('#el-count').textContent = `${p.elements.filter(x => x.etat).length}/${p.elements.length} renseignés`;
    saveLater(edl);
  }));
  $$('[data-com]', view).forEach(t => t.oninput = () => { const e = p.elements[+t.dataset.com]; e.commentaire = t.value; e.ia = false; saveLater(edl); });
  const ajouter = async camera => {
    const files = await choisirPhotos(camera); if (!files.length) return;
    toast('Ajout de ' + files.length + ' photo(s)…');
    for (const f of files) { const data = await lireImage(f); const id = DB.uid(); await Backend.savePhoto(id, data, edl.id, edl.owner); p.photos.push(id); }
    await saveEdl(edl); render();
  };
  $('#cam').onclick = () => ajouter(true); $('#gal').onclick = () => ajouter(false);
  $$('[data-delph]', view).forEach(b => b.onclick = async ev => {
    ev.stopPropagation(); if (!await confirmer('Supprimer cette photo ?', '', 'Supprimer')) return;
    const id = p.photos.splice(+b.dataset.delph, 1)[0]; await Backend.deletePhoto(id); await saveEdl(edl); render();
  });
  $$('[data-zoom]', view).forEach(img => img.onclick = () => openModal(`<img src="${img.src}" style="width:100%;border-radius:14px;display:block"><div class="btns"><button class="btn ghost" onclick="closeModal()">Fermer</button></div>`));
  $('#ia').onclick = async ev => {
    const b = ev.currentTarget; b.disabled = true; b.innerHTML = '<span class="spinner"></span> Analyse en cours…';
    try {
      const r = await Gemini.analyserPiece(p.nom, p.elements.map(e => e.nom), await photosData(p.photos.slice(0, 12)));
      let k = 0;
      for (const re of r.elements) { const e = p.elements.find(x => x.nom.toLowerCase() === String(re.nom || '').toLowerCase()); if (!e || !re.etat) continue; e.etat = re.etat; e.commentaire = re.commentaire || ''; e.ia = true; k++; }
      p.analyse = { resume: r.resume, defauts: r.defauts, date: Date.now() };
      await saveEdl(edl); toast(`${k} élément(s) pré-rempli(s) par l'IA — vérifie et corrige si besoin`, 4000); render();
    } catch (e) { toast(e.message, 5000); b.disabled = false; b.innerHTML = `${I('spark')} Analyser avec l'IA`; }
  };
  const cmp = $('#cmp');
  if (cmp) cmp.onclick = async ev => {
    const b = ev.currentTarget; b.disabled = true; b.innerHTML = '<span class="spinner"></span> Comparaison…';
    try { p.comparaison = { ...(await Gemini.comparerPiece(p.nom, await photosData(ref.photos.slice(0, 6)), await photosData(p.photos.slice(0, 6)), ref.elements)), date: Date.now() }; await saveEdl(edl); render(); }
    catch (e) { toast(e.message, 5000); b.disabled = false; b.innerHTML = `${I('compare')} Comparer avec l'entrée`; }
  };
  $('#add-el').onclick = async () => { const v = await demander('Nouvel élément', '', 'Radiateur, placard, interphone…'); if (v) { p.elements.push({ nom: v, etat: null, commentaire: '', ia: false }); await saveEdl(edl); render(); } };
  $('#ren').onclick = async () => { const v = await demander('Renommer la pièce', p.nom); if (v) { p.nom = v; await saveEdl(edl); render(); } };
  $('#delp').onclick = async () => {
    if (!await confirmer(`Supprimer « ${p.nom} » ?`, 'Les photos de cette pièce seront supprimées.', 'Supprimer')) return;
    for (const ph of p.photos) await Backend.deletePhoto(ph);
    edl.pieces = edl.pieces.filter(x => x.id !== p.id); await saveEdl(edl); back();
  };
}

// =====================================================================
//  ÉQUIPE (administrateur)
// =====================================================================
let derniereCle = null;
async function viewTeam() {
  setTitle('Équipe');
  if (!isAdmin()) return navTo('home');
  view.innerHTML = `<div class="empty"><span class="spinner d"></span></div>`;
  const [invites, users, edls] = await Promise.all([Backend.listInvites(), Backend.listUsers(), Backend.listEdls()]);
  const dispo = invites.filter(i => !i.used);
  const dc = derniereCle;
  view.innerHTML = `
  <div class="grid2 stack" style="align-items:start">
  <div>
    <div class="card"><div class="card-h"><div><h2>Inviter un agent</h2><div class="sub">Une clé = un compte, utilisable une seule fois</div></div>${I('key')}</div>
      <label class="f" style="margin-top:0">Pour qui ? (facultatif)</label>
      <div class="row"><input type="text" id="inv-note" placeholder="Ex : Julie Martin"><button class="btn" id="inv-new">${I('plus')} Générer</button></div>
      ${dc ? `<div class="info" style="text-align:center;margin-top:14px"><div class="xs">Nouvelle clé${dc.note ? ' pour ' + esc(dc.note) : ''}</div><div class="key" style="font-size:21px;margin:6px 0">${esc(dc.code)}</div>
        <div class="row" style="justify-content:center;gap:8px"><button class="btn sm" id="cp-new">${I('copy')} Copier</button><button class="btn sm ghost" id="sh-new">${I('share')} Envoyer</button></div></div>` : ''}
    </div>
    <div class="card"><div class="card-h"><h2>Clés créées</h2><span class="badge">${dispo.length} disponible(s)</span></div>
      ${invites.length ? invites.map(i => `<div class="li"><div class="grow"><div class="key">${esc(i.code)}</div>
        <div class="xs muted">${i.note ? esc(i.note) + ' · ' : ''}${i.used ? 'Utilisée par ' + esc(i.usedEmail || '') : 'Créée le ' + new Date(i.cree).toLocaleDateString('fr-FR')}</div></div>
        ${i.used ? `<span class="badge ok">${I('check')} Utilisée</span>` : `<button class="icon-btn" data-copy="${esc(i.code)}" title="Copier">${I('copy')}</button><button class="icon-btn" data-delinv="${esc(i.code)}" title="Supprimer" style="color:var(--bad)">${I('trash')}</button>`}</div>`).join('')
        : '<p class="small muted" style="margin:0">Aucune clé pour l’instant. Génère une clé et transmets-la à ton agent.</p>'}
    </div>
  </div>
  <div class="card"><div class="card-h"><div><h2>Agents</h2><div class="sub">${users.length} compte(s)</div></div>${I('users')}</div>
    ${users.sort((a, b) => (b.role === 'admin') - (a.role === 'admin')).map(u => `<div class="li">
      <div class="avatar ${u.actif === false ? 'g' : ''}">${esc(initiales(u.nom))}</div>
      <div class="grow"><div class="b ell">${esc(u.nom)} ${u.role === 'admin' ? '<span class="badge entree" style="margin-left:4px">Admin</span>' : ''}${u.actif === false ? '<span class="badge bad" style="margin-left:4px">Désactivé</span>' : ''}</div>
      <div class="xs muted ell">${esc(u.email)} · ${edls.filter(e => e.owner === u.uid).length} EDL</div></div>
      ${u.uid === ME().uid ? '<span class="xs muted">Vous</span>' : `<label class="switch" title="Accès actif"><input type="checkbox" data-uid="${u.uid}" ${u.actif === false ? '' : 'checked'}><span></span></label>`}
    </div>`).join('')}
    <p class="xs muted" style="margin:12px 0 0">Désactiver un agent bloque immédiatement son accès, sans supprimer ses états des lieux.</p>
  </div></div>`;
  $('#inv-new').onclick = async ev => {
    ev.currentTarget.disabled = true;
    try { derniereCle = await Backend.createInvite($('#inv-note').value.trim()); render(); }
    catch (e) { toast(e.message, 5000); ev.currentTarget.disabled = false; }
  };
  if (dc) {
    const msg = `Bonjour${dc.note ? ' ' + prenom(dc.note) : ''}, voici ta clé pour créer ton compte sur l'application État des Lieux evim : ${dc.code}`;
    $('#cp-new').onclick = () => copier(dc.code);
    $('#sh-new').onclick = async () => { const Cap = window.Capacitor; try { if (Cap?.Plugins?.Share && Cap.isNativePlatform()) await Cap.Plugins.Share.share({ title: 'Clé evim', text: msg }); else if (navigator.share) await navigator.share({ text: msg }); else copier(msg); } catch { } };
  }
  $$('[data-copy]', view).forEach(b => b.onclick = () => copier(b.dataset.copy));
  $$('[data-delinv]', view).forEach(b => b.onclick = async () => { if (await confirmer('Supprimer cette clé ?', b.dataset.delinv, 'Supprimer')) { await Backend.deleteInvite(b.dataset.delinv); if (derniereCle && derniereCle.code === b.dataset.delinv) derniereCle = null; render(); } });
  $$('[data-uid]', view).forEach(c => c.onchange = async () => { try { await Backend.setUserActive(c.dataset.uid, c.checked); toast(c.checked ? 'Agent réactivé' : 'Agent désactivé'); render(); } catch (e) { toast(e.message, 5000); c.checked = !c.checked; } });
}

// =====================================================================
//  MON COMPTE
// =====================================================================
async function viewAccount() {
  setTitle('Mon compte');
  const u = ME(); const cfg = isAdmin() ? await Backend.getConfig().catch(() => ({})) : {};
  view.innerHTML = `
  <div class="card" style="display:flex;gap:16px;align-items:center">
    <div class="avatar" style="width:60px;height:60px;font-size:20px">${esc(initiales(u.nom))}</div>
    <div class="grow"><h2 style="margin:0;font-size:19px">${esc(u.nom)}</h2><div class="muted small ell">${esc(u.email)}</div>
    <div class="row wrap" style="gap:6px;margin-top:8px"><span class="badge ${u.role === 'admin' ? 'entree' : ''}">${u.role === 'admin' ? 'Administrateur' : 'Agent'}</span><span class="badge">${Backend.mode === 'demo' ? 'Mode démo (local)' : I('cloud') + ' Synchronisé'}</span></div></div>
  </div>
  <div class="grid2 stack" style="align-items:start">
  <div class="card"><div class="card-h"><h2>Profil</h2></div>
    <label class="f" style="margin-top:0">Nom et prénom</label><input type="text" id="nom" value="${esc(u.nom)}">
    <div class="btns"><button class="btn sec" id="save-nom">Enregistrer</button>${Backend.mode === 'firebase' ? `<button class="btn ghost" id="reset">${I('lock')} Mot de passe</button>` : ''}</div>
  </div>
  ${isAdmin() ? `<div class="card"><div class="card-h"><div><h2>Intelligence artificielle</h2><div class="sub">Clé Gemini partagée par toute l'agence</div></div>${I('spark')}</div>
    <div class="xs muted">Crée une clé sur <b>aistudio.google.com</b> → « Get API key » avec ton compte Google.</div>
    <label class="f">Clé API Gemini</label><input type="password" id="key" value="${esc(cfg.geminiKey || '')}" placeholder="AIza…" autocomplete="off">
    <label class="f">Modèle</label><input type="text" id="model" value="${esc(cfg.model || 'gemini-2.5-flash')}">
    <div class="btns"><button class="btn ghost" id="test">Tester</button><button class="btn" id="save-ia">Enregistrer</button></div></div>` : ''}
  </div>
  <div class="card"><div class="card-h"><div><h2>Sauvegarde</h2><div class="sub">${Backend.mode === 'demo' ? 'En mode démo, les données restent sur cet appareil.' : 'Tes données sont déjà sauvegardées en ligne.'}</div></div></div>
    <div class="btns" style="margin-top:0"><button class="btn ghost" id="export">${I('download')} Exporter</button><button class="btn ghost" id="import">${I('upload')} Importer</button></div></div>
  <div class="btns"><button class="btn danger" id="logout">${I('logout')} Se déconnecter</button></div>
  <div style="text-align:center;margin-top:26px"><div class="brand" style="--w:130px"><img src="logo-h.png" alt="evim immobilier"><div class="by">By <b>NSimo</b></div></div><div class="xs muted">État des Lieux IA · v${VERSION}</div></div>`;
  $('#save-nom').onclick = async () => { const n = $('#nom').value.trim(); if (!n) return; try { await Backend.updateProfile({ nom: n }); renderNav(); toast('Profil mis à jour'); render(); } catch (e) { toast(e.message, 5000); } };
  const rs = $('#reset'); if (rs) rs.onclick = async () => { try { await Backend.resetPassword(u.email); toast('Email de changement de mot de passe envoyé à ' + u.email, 5000); } catch (e) { toast(e.message, 5000); } };
  if (isAdmin()) {
    const sauver = () => Backend.setConfig({ geminiKey: $('#key').value.trim(), model: $('#model').value.trim() || 'gemini-2.5-flash' });
    $('#save-ia').onclick = async () => { try { await sauver(); toast('Configuration IA enregistrée ✓'); } catch (e) { toast(e.message, 5000); } };
    $('#test').onclick = async ev => { const b = ev.currentTarget; b.disabled = true; b.textContent = 'Test…'; try { await sauver(); await Gemini.tester(); toast('Connexion à Gemini OK ✓'); } catch (e) { toast(e.message, 5000); } b.disabled = false; b.textContent = 'Tester'; };
  }
  $('#logout').onclick = deconnexion;
  $('#export').onclick = async () => {
    const edls = await Backend.listEdls(); const biens = await Backend.listBiens(); const photos = [];
    for (const e of edls) for (const p of e.pieces) for (const id of p.photos) { const d = await Backend.getPhoto(id); if (d) photos.push({ id, data: d, edlId: e.id }); }
    await partagerFichier(new TextEncoder().encode(JSON.stringify({ app: 'edl-evim', version: VERSION, biens, edls, photos })), `sauvegarde-edl-${today()}.json`, 'application/json');
  };
  $('#import').onclick = () => { const i = $('#in-import'); i.value = ''; i.click(); };
  $('#in-import').onchange = async ev => {
    const f = ev.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text()); if (!Array.isArray(data.edls)) throw new Error('fichier non reconnu');
      if (!await confirmer(`Importer ${data.edls.length} état(s) des lieux ?`, 'Ils seront ajoutés à ton compte.', 'Importer', false)) return;
      const mine = o => { if (!isAdmin() || !o.owner) { o.owner = u.uid; o.ownerNom = u.nom; } return o; };
      for (const b of data.biens || []) await Backend.saveBien(mine(b));
      const owners = {};
      for (const e of data.edls) { mine(e); owners[e.id] = e.owner; await Backend.saveEdl(e); }
      for (const p of data.photos || []) await Backend.savePhoto(p.id, p.data, p.edlId, owners[p.edlId]);
      toast('Sauvegarde importée ✓'); navTo('home');
    } catch (e) { toast('Import impossible : ' + e.message, 5000); }
  };
}

// =====================================================================
//  PDF + PARTAGE
// =====================================================================
async function exporterPdf(edl, bien, entree, btn) {
  const old = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> PDF…';
  try {
    await saveEdl(edl);
    const photos = {};
    for (const id of edl.pieces.flatMap(p => p.photos)) { const d = await Backend.getPhoto(id); if (d) photos[id] = d; }
    const bytes = await Rapport.generer(edl, bien, entree, photos);
    const nom = `EDL-${edl.type}-${(bien.adresse || 'logement').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').slice(0, 40)}-${edl.date}.pdf`;
    await partagerFichier(bytes, nom, 'application/pdf');
  } catch (e) { console.error(e); toast('Erreur PDF : ' + e.message, 5000); }
  btn.disabled = false; btn.innerHTML = old;
}
function b64(bytes) { let s = ''; const ch = 0x8000; for (let i = 0; i < bytes.length; i += ch) s += String.fromCharCode.apply(null, bytes.subarray(i, i + ch)); return btoa(s); }
async function partagerFichier(bytes, nom, mime) {
  const Cap = window.Capacitor;
  if (Cap && Cap.isNativePlatform && Cap.isNativePlatform() && Cap.Plugins.Filesystem && Cap.Plugins.Share) {
    const w = await Cap.Plugins.Filesystem.writeFile({ path: nom, data: b64(bytes), directory: 'CACHE' });
    await Cap.Plugins.Share.share({ title: nom, url: w.uri, dialogTitle: 'Envoyer / enregistrer' });
    return;
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const a = document.createElement('a'); a.href = url; a.download = nom; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000); toast('Téléchargé : ' + nom);
}

// ---------- démarrage ----------
(async function boot() {
  const Cap = window.Capacitor;
  if (Cap && Cap.Plugins && Cap.Plugins.App) Cap.Plugins.App.addListener('backButton', () => { if (!back()) Cap.Plugins.App.exitApp(); });
  try { await Backend.init(); }
  catch (e) { console.error(e); $('#boot').innerHTML = `<div class="brand" style="--w:180px"><img src="logo-h.png" alt="evim immobilier"><div class="by">By <b>NSimo</b></div></div><div class="err" style="max-width:360px">Impossible de joindre le serveur. Vérifie ta connexion internet puis relance l'application.<br><small>${esc(e.message)}</small></div><button class="btn" onclick="location.reload()">Réessayer</button>`; return; }
  if (Backend.user && Backend.user.actif !== false) showApp(); else showAuth('login');
})();
