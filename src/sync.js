// =====================================================================
// SAUVEGARDE : copie manuelle (tout de suite) et cloud (Apps Script)
// =====================================================================
// Le cloud est désactivé tant qu'aucune adresse n'est renseignée (menu > Sauvegarde).
// Échanges en text/plain pour éviter la vérification CORS préalable d'Apps Script.
const CLE_PROFIL = 'carton-plein-profil', CLE_CLOUD = 'carton-plein-cloud';
function profil() {
  let p = null; try { p = JSON.parse(localStorage.getItem(CLE_PROFIL)); } catch (e) { }
  if (!p) { const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; p = { code: Array.from({ length: 8 }, () => a[Math.floor(Math.random() * a.length)]).join(''), pseudo: '' }; try { localStorage.setItem(CLE_PROFIL, JSON.stringify(p)); } catch (e) { } }
  return p;
}
const urlCloud = () => { let u = null; try { u = localStorage.getItem(CLE_CLOUD); } catch (e) { } return u !== null ? u : CLOUD_URL; };
const majProfil = p => { try { localStorage.setItem(CLE_PROFIL, JSON.stringify(p)); } catch (e) { } };
// Reprendre une carrière depuis un autre téléphone : le code est adopté, ce téléphone continue la même sauvegarde
async function reprendreAvecCode(code) {
  code = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length < 6) throw new Error('Le code joueur fait 8 caractères.');
  let j; try { j = await syncLire(code); } catch (e) { throw new Error('Pas de connexion au cloud.'); }
  if (!j || !j.data) throw new Error('Aucune carrière avec ce code.');
  const p = profil(); p.code = code; if (j.pseudo) p.pseudo = j.pseudo; if (j.amis && j.amis.length) p.amis = j.amis.map(c => ({ code: c })); majProfil(p);
  C = migrer(j.data); sauver(); return C;
}
// --- copie manuelle : un texte à garder dans ses notes ou à coller sur un autre téléphone
function exporterSauvegarde() { return 'CP1:' + btoa(unescape(encodeURIComponent(JSON.stringify(C)))); }
function importerSauvegarde(txt) {
  const t = (txt || '').trim(); if (!t.startsWith('CP1:')) throw new Error('Ce texte n’est pas une sauvegarde Carton Plein.');
  const c = JSON.parse(decodeURIComponent(escape(atob(t.slice(4))))); if (!c || !c.club || !c.cartes) throw new Error('Sauvegarde incomplète.');
  C = migrer(c); sauver(); return C;
}
// --- cloud
let SYNC_TIMER = null, SYNC_ETAT = 'off';
function syncPlanifier() {
  if (!urlCloud() || !C || C.temp) return;
  clearTimeout(SYNC_TIMER); SYNC_TIMER = setTimeout(syncEnvoyer, 4000);
}
async function syncEnvoyer() {
  const url = urlCloud(); if (!url || !C) return;
  const p = profil(); SYNC_ETAT = 'envoi';
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'save', code: p.code, pseudo: p.pseudo, amis: (p.amis || []).map(a => a.code), maj: C.maj || Date.now(), data: C }) });
    const j = await r.json(); SYNC_ETAT = j.ok ? 'ok' : 'erreur';
  } catch (e) { SYNC_ETAT = 'hors-ligne'; }
}
async function syncLire(code) {
  const url = urlCloud(); if (!url) return null;
  const r = await fetch(`${url}?action=load&code=${encodeURIComponent(code || profil().code)}`);
  const j = await r.json(); return j.ok ? j : null;
}
// Au lancement : si le cloud a une sauvegarde plus récente que ce téléphone, on propose de la reprendre
async function syncVerifier(surPlusRecent) {
  if (!urlCloud()) return;
  try { const j = await syncLire(); if (!j || !j.data) return; const local = charger(); if (!local || (j.maj || 0) > (local.maj || 0) + 5000) surPlusRecent(j); } catch (e) { }
}

// --- appels au serveur pour le social et le direct
async function apiLire(action, params) {
  const url = urlCloud(); if (!url) throw new Error('Sauvegarde automatique non activée.');
  const q = new URLSearchParams(Object.assign({ action }, params || {}));
  const r = await fetch(`${url}?${q}`); const j = await r.json(); if (!j.ok) throw new Error(j.erreur || 'Erreur du serveur'); return j;
}
async function apiEcrire(action, corps) {
  const url = urlCloud(); if (!url) throw new Error('Sauvegarde automatique non activée.');
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action }, corps)) });
  const j = await r.json(); if (!j.ok) throw new Error(j.erreur || 'Erreur du serveur'); return j;
}
// publier dans le fil d'actualité, sans jamais bloquer le jeu
function publier(txt, type, pour) { const p = profil(); if (!urlCloud() || !p.pseudo) return; apiEcrire('publier', { code: p.code, pseudo: p.pseudo, txt, type: type || '', pour: pour || null }).catch(() => { }); }

// réglages de ce téléphone : niveau et indices
const reglages = () => Object.assign({ difficulte: 'normal', indices: true }, profil().reglages || {});
function changerReglage(k, v) { const p = profil(); p.reglages = Object.assign(reglages(), { [k]: v }); majProfil(p); }
