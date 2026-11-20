// =====================================================================
//  Couche serveur : comptes agents, clés d'invitation, données synchronisées
//  - Firebase si firebase-config.js est rempli
//  - sinon « mode démo » : tout reste sur cet appareil (pour tester)
// =====================================================================
const FB_VERSION = '10.14.1';

function genCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const r = crypto.getRandomValues(new Uint8Array(8));
  const s = [...r].map(x => A[x % A.length]).join('');
  return `EVIM-${s.slice(0, 4)}-${s.slice(4)}`;
}
async function sha256(t) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function errFr(e) {
  const c = e && (e.code || e.message || '');
  const M = {
    'auth/invalid-email': 'Adresse email invalide.',
    'auth/email-already-in-use': 'Un compte existe déjà avec cet email.',
    'auth/weak-password': 'Mot de passe trop faible (6 caractères minimum).',
    'auth/invalid-credential': 'Email ou mot de passe incorrect.',
    'auth/wrong-password': 'Email ou mot de passe incorrect.',
    'auth/user-not-found': 'Email ou mot de passe incorrect.',
    'auth/too-many-requests': 'Trop de tentatives, réessaie dans quelques minutes.',
    'auth/network-request-failed': 'Pas de connexion internet.',
    'permission-denied': "Accès refusé (clé invalide, déjà utilisée ou compte désactivé).",
    'unavailable': 'Serveur injoignable, vérifie ta connexion.'
  };
  for (const k in M) if (String(c).includes(k)) return M[k];
  return (e && e.message) || String(e);
}

// ---------------------------------------------------------------------
//  Mode démo (local)
// ---------------------------------------------------------------------
const LocalBackend = {
  mode: 'demo', user: null,
  async init() {
    const uid = await DB.getSetting('session', null);
    const users = await DB.getSetting('users', []);
    this.user = users.find(u => u.uid === uid) || null;
  },
  async signIn(email, pw) {
    const users = await DB.getSetting('users', []);
    const h = await sha256(pw);
    const u = users.find(x => x.email === email.toLowerCase().trim() && x.pw === h);
    if (!u) throw new Error('Email ou mot de passe incorrect.');
    if (!u.actif) throw new Error("Ce compte a été désactivé par l'administrateur.");
    await DB.setSetting('session', u.uid); this.user = u; return u;
  },
  async signUp({ email, pw, nom, invite }) {
    email = email.toLowerCase().trim();
    const users = await DB.getSetting('users', []);
    if (users.some(u => u.email === email)) throw new Error('Un compte existe déjà avec cet email.');
    if (pw.length < 6) throw new Error('Mot de passe trop faible (6 caractères minimum).');
    let role = 'agent';
    if (!users.length) role = 'admin';            // démo : le 1er compte est administrateur
    else {
      const invites = await DB.getSetting('invites', []);
      const inv = invites.find(i => i.code === invite.trim().toUpperCase());
      if (!inv || inv.used) throw new Error("Clé d'invitation invalide ou déjà utilisée.");
      inv.used = true; inv.usedEmail = email; inv.usedAt = Date.now();
      await DB.setSetting('invites', invites);
    }
    const u = { uid: DB.uid(), email, nom, role, actif: true, cree: Date.now(), pw: await sha256(pw) };
    users.push(u); await DB.setSetting('users', users); await DB.setSetting('session', u.uid); this.user = u; return u;
  },
  async needsAdminSetup() { return !(await DB.getSetting('users', [])).length; },
  async resetPassword() { throw new Error('En mode démo, la réinitialisation par email n’est pas disponible.'); },
  async signOut() { await DB.setSetting('session', null); this.user = null; },
  async updateProfile(p) { const users = await DB.getSetting('users', []); const u = users.find(x => x.uid === this.user.uid); Object.assign(u, p); await DB.setSetting('users', users); Object.assign(this.user, p); },
  // données
  mine(o) { return this.user.role === 'admin' || o.owner === this.user.uid; },
  async listBiens() { return (await DB.all('biens')).filter(o => this.mine(o)); },
  getBien: id => DB.get('biens', id),
  saveBien(b) { b.owner = b.owner || this.user.uid; return DB.put('biens', b); },
  async listEdls() { return (await DB.all('edls')).filter(o => this.mine(o)); },
  getEdl: id => DB.get('edls', id),
  saveEdl(e) { e.owner = e.owner || this.user.uid; e.ownerNom = e.ownerNom || this.user.nom; return DB.put('edls', e); },
  deleteEdl: id => DB.del('edls', id),
  async getPhoto(id) { const p = await DB.get('photos', id); return p ? p.data : null; },
  savePhoto(id, data, edlId, owner) { return DB.put('photos', { id, data, edlId, owner: owner || this.user.uid }); },
  deletePhoto: id => DB.del('photos', id),
  // configuration partagée (clé Gemini)
  getConfig: () => DB.getSetting('appConfig', {}),
  setConfig: c => DB.setSetting('appConfig', c),
  // administration
  async listInvites() { return (await DB.getSetting('invites', [])).sort((a, b) => b.cree - a.cree); },
  async createInvite(note) { const inv = await DB.getSetting('invites', []); const i = { code: genCode(), note: note || '', used: false, cree: Date.now() }; inv.push(i); await DB.setSetting('invites', inv); return i; },
  async deleteInvite(code) { await DB.setSetting('invites', (await DB.getSetting('invites', [])).filter(i => i.code !== code)); },
  async listUsers() { return (await DB.getSetting('users', [])).map(({ pw, ...u }) => u); },
  async setUserActive(uid, actif) { const users = await DB.getSetting('users', []); const u = users.find(x => x.uid === uid); if (u) u.actif = actif; await DB.setSetting('users', users); },
};

// ---------------------------------------------------------------------
//  Firebase (Auth + Firestore). Les photos sont stockées dans Firestore
//  (compressées) : pas besoin de l'offre payante Firebase Storage.
// ---------------------------------------------------------------------
const FirebaseBackend = {
  mode: 'firebase', user: null,
  async init() {
    const base = `https://www.gstatic.com/firebasejs/${FB_VERSION}/`;
    const [A, U, F] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
    this.U = U; this.F = F;
    const app = A.initializeApp(window.FIREBASE_CONFIG);
    this.auth = U.getAuth(app);
    try { this.db = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) }); }
    catch (e) { this.db = F.getFirestore(app); }
    await new Promise(res => { const off = U.onAuthStateChanged(this.auth, async u => { off(); await this._load(u); res(); }); });
  },
  async _load(fbUser) {
    this.user = null; if (!fbUser) return;
    const snap = await this.F.getDoc(this.F.doc(this.db, 'users', fbUser.uid)).catch(() => null);
    if (snap && snap.exists()) this.user = { uid: fbUser.uid, ...snap.data() };
  },
  d(col, id) { return this.F.doc(this.db, col, id); },
  // écritures « fire and forget » : appliquées tout de suite en local, envoyées au serveur dès que possible (hors-ligne OK)
  _w(p) { p.catch(e => { console.error(e); if (window.onBackendError) window.onBackendError(errFr(e)); }); return Promise.resolve(); },
  async signIn(email, pw) {
    try {
      const c = await this.U.signInWithEmailAndPassword(this.auth, email.trim(), pw);
      await this._load(c.user);
      if (!this.user) { await this.U.signOut(this.auth); throw new Error("Ce compte n'a pas de profil agent (inscription incomplète)."); }
      if (!this.user.actif) { await this.U.signOut(this.auth); this.user = null; throw new Error("Ce compte a été désactivé par l'administrateur."); }
      return this.user;
    } catch (e) { throw new Error(errFr(e)); }
  },
  async signUp({ email, pw, nom, invite }) {
    const F = this.F; email = email.toLowerCase().trim();
    const code = (invite || '').trim().toUpperCase();
    const isAdmin = !code;   // sans clé : tentative de compte administrateur (autorisée par les règles uniquement pour l'email admin)
    let cred;
    try { cred = await this.U.createUserWithEmailAndPassword(this.auth, email, pw); }
    catch (e) { throw new Error(errFr(e)); }
    const uid = cred.user.uid;
    const profil = { email, nom, role: isAdmin ? 'admin' : 'agent', actif: true, cree: Date.now(), invite: isAdmin ? '' : code };
    try {
      const b = F.writeBatch(this.db);
      b.set(this.d('users', uid), profil);
      if (!isAdmin) b.update(this.d('invites', code), { used: true, usedBy: uid, usedEmail: email, usedAt: Date.now() });
      await b.commit();
    } catch (e) {
      await cred.user.delete().catch(() => {});      // on annule le compte si la clé est refusée
      const refus = String(e.code || '').includes('permission') || String(e.code || '').includes('not-found');
      throw new Error(refus ? (isAdmin ? "La clé d'invitation est obligatoire." : "Clé d'invitation invalide ou déjà utilisée.") : errFr(e));
    }
    this.user = { uid, ...profil }; return this.user;
  },
  async needsAdminSetup() { return false; },
  async resetPassword(email) { try { await this.U.sendPasswordResetEmail(this.auth, email.trim()); } catch (e) { throw new Error(errFr(e)); } },
  async signOut() { await this.U.signOut(this.auth); this.user = null; },
  async updateProfile(p) { await this.F.updateDoc(this.d('users', this.user.uid), p); Object.assign(this.user, p); },
  async _list(col) {
    const F = this.F; const c = F.collection(this.db, col);
    const q = this.user.role === 'admin' ? c : F.query(c, F.where('owner', '==', this.user.uid));
    const s = await F.getDocs(q); return s.docs.map(x => x.data());
  },
  listBiens() { return this._list('biens'); },
  async getBien(id) { const s = await this.F.getDoc(this.d('biens', id)); return s.exists() ? s.data() : null; },
  saveBien(b) { b.owner = b.owner || this.user.uid; return this._w(this.F.setDoc(this.d('biens', b.id), b)); },
  listEdls() { return this._list('edls'); },
  async getEdl(id) { const s = await this.F.getDoc(this.d('edls', id)); return s.exists() ? s.data() : null; },
  saveEdl(e) { e.owner = e.owner || this.user.uid; e.ownerNom = e.ownerNom || this.user.nom; return this._w(this.F.setDoc(this.d('edls', e.id), JSON.parse(JSON.stringify(e)))); },
  deleteEdl(id) { return this._w(this.F.deleteDoc(this.d('edls', id))); },
  _pc: {},
  async getPhoto(id) {
    if (this._pc[id]) return this._pc[id];
    const s = await this.F.getDoc(this.d('photos', id)).catch(() => null);
    const v = s && s.exists() ? s.data().data : null; if (v) this._pc[id] = v; return v;
  },
  savePhoto(id, data, edlId, owner) { this._pc[id] = data; return this._w(this.F.setDoc(this.d('photos', id), { id, data, edlId, owner: owner || this.user.uid, cree: Date.now() })); },
  deletePhoto(id) { delete this._pc[id]; return this._w(this.F.deleteDoc(this.d('photos', id))); },
  async getConfig() { const s = await this.F.getDoc(this.d('config', 'app')).catch(() => null); return s && s.exists() ? s.data() : {}; },
  setConfig(c) { return this.F.setDoc(this.d('config', 'app'), c, { merge: true }); },
  async listInvites() { const s = await this.F.getDocs(this.F.collection(this.db, 'invites')); return s.docs.map(x => x.data()).sort((a, b) => b.cree - a.cree); },
  async createInvite(note) { const i = { code: genCode(), note: note || '', used: false, cree: Date.now(), creePar: this.user.uid }; await this.F.setDoc(this.d('invites', i.code), i); return i; },
  deleteInvite(code) { return this.F.deleteDoc(this.d('invites', code)); },
  async listUsers() { const s = await this.F.getDocs(this.F.collection(this.db, 'users')); return s.docs.map(x => ({ uid: x.id, ...x.data() })); },
  setUserActive(uid, actif) { return this.F.updateDoc(this.d('users', uid), { actif }); },
};

const cfgOk = window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey && !/A_REMPLIR/.test(window.FIREBASE_CONFIG.apiKey);
const Backend = cfgOk ? FirebaseBackend : LocalBackend;
