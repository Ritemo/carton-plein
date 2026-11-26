/**
 * Carton Plein : serveur gratuit (Google Apps Script).
 *   - sauvegarde des carrières : un fichier JSON par joueur dans le dossier Drive « Carton Plein - sauvegardes »
 *   - social : profils publics, fil d'actualité, messages, défi de la semaine (fichier social.json)
 *   - matchs en direct : salons temporaires en cache (6 heures)
 *   - carrières coop : un fichier coop_XXXXXX.json par club partagé, résumé dans social.json
 *
 * Première installation : Déployer > Nouveau déploiement > Application Web
 *   (Exécuter en tant que : moi ; Accès : tout le monde), puis coller l'adresse /exec dans src/config.js.
 * Mise à jour du code : Déployer > Gérer les déploiements > crayon > Version : « Nouvelle version » > Déployer.
 *   L'adresse ne change pas.
 */
const VERSION_SERVEUR = 3;
const DOSSIER = 'Carton Plein - sauvegardes';
const MAX_FIL = 300, MAX_MSG = 500, DUREE_SALON = 6 * 3600;

// ---------- outils ----------
function dossier_() {
  const it = DriveApp.getFoldersByName(DOSSIER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(DOSSIER);
}
function codeOk_(code) { if (!/^[A-Z0-9]{6,12}$/.test(code || '')) throw new Error('code invalide'); return code; }
function fichier_(nom) { const it = dossier_().getFilesByName(nom); return it.hasNext() ? it.next() : null; }
function lireJSON_(nom, defaut) { const f = fichier_(nom); return f ? JSON.parse(f.getBlob().getDataAsString()) : defaut; }
function ecrireJSON_(nom, o) {
  const f = fichier_(nom), txt = JSON.stringify(o);
  if (f) f.setContent(txt); else dossier_().createFile(nom, txt, MimeType.PLAIN_TEXT);
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function propre_(t, n) { return String(t || '').replace(/[<>]/g, '').slice(0, n || 200); }
function verrou_(f) { const v = LockService.getScriptLock(); v.waitLock(15000); try { return f(); } finally { v.releaseLock(); } }
function social_() { const s = lireJSON_('social.json', { fil: [], messages: [], defis: {} }); s.coops = s.coops || {}; return s; }
function sauverSocial_(s) {
  if (s.fil.length > MAX_FIL) s.fil = s.fil.slice(-MAX_FIL);
  if (s.messages.length > MAX_MSG) s.messages = s.messages.slice(-MAX_MSG);
  const semaines = Object.keys(s.defis).sort(); while (semaines.length > 8) delete s.defis[semaines.shift()];
  ecrireJSON_('social.json', s);
}

// Profil public tiré de la sauvegarde : de quoi afficher un ami et jouer contre son ombre
function profilPublic_(code) {
  const o = lireJSON_(codeOk_(code) + '.json', null);
  if (!o || !o.data) return null;
  const d = o.data;
  return {
    code: code, pseudo: o.pseudo || '', maj: o.maj, club: d.club, pays: d.pays, div: d.div, saison: d.saison, ansD1: d.ansD1 || 0,
    trophees: (d.trophees || []).length, cartes: d.cartes, stars: d.stars, niveaux: d.niveaux, carnet: d.carnet || null
  };
}

// ---------- salons (matchs en direct) ----------
const cache_ = () => CacheService.getScriptCache();
function lireSalon_(id) { const t = cache_().get('salon_' + id); return t ? JSON.parse(t) : null; }
function ecrireSalon_(s) { cache_().put('salon_' + s.id, JSON.stringify(s), DUREE_SALON); }
function nouvelId_() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; let id; do { id = ''; for (let i = 0; i < 4; i++) id += a[Math.floor(Math.random() * a.length)]; } while (lireSalon_(id)); return id; }

// ---------- carrières coop ----------
function idCoop_(id) { id = String(id || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (id.length !== 6) throw new Error('Code coop invalide.'); return id; }
// résumé visible dans l'onglet Amis : qui joue, où en est le club, qui a laissé une mi-temps en suspens
function indexerCoop_(s, id, c) {
  const d = c.data || {}, r = d.coop && d.coop.relais;
  s.coops[id] = { membres: c.membres.map(m => m.code), pseudos: c.membres.map(m => m.pseudo), club: d.club, div: d.div, saison: d.saison, journee: d.journee, relais: r ? { par: r.par, pseudo: r.pseudo, score: r.score } : null, maj: c.maj };
}

// ---------- lecture ----------
function doGet(e) {
  try {
    const p = e.parameter || {};
    switch (p.action) {
      case 'load': {
        const o = lireJSON_(codeOk_(p.code) + '.json', null);
        return json_(o ? { ok: true, maj: o.maj, pseudo: o.pseudo, amis: o.amis || [], data: o.data } : { ok: true, data: null });
      }
      case 'profil': return json_({ ok: true, profil: profilPublic_(p.code) });
      case 'social': {
        // fil et messages qui concernent ce joueur et ses amis, plus le défi de la semaine
        const moi = codeOk_(p.code), amis = (p.amis || '').split(',').filter(Boolean), cercle = [moi].concat(amis);
        const s = social_(), depuis = +p.depuis || 0;
        return json_({
          ok: true, v: VERSION_SERVEUR,
          fil: s.fil.filter(x => cercle.indexOf(x.de) >= 0 || x.pour === moi).slice(-40),
          messages: s.messages.filter(m => (m.a === moi || m.de === moi) && m.t > depuis),
          defi: p.semaine ? (s.defis[p.semaine] || {}) : {},
          coops: Object.keys(s.coops).filter(id => s.coops[id].membres.indexOf(moi) >= 0).map(id => Object.assign({ id: id }, s.coops[id]))
        });
      }
      case 'salon': return json_({ ok: true, salon: lireSalon_(p.id) });
      case 'coopLoad': { const c = lireJSON_('coop_' + idCoop_(p.id) + '.json', null); return json_(c ? { ok: true, maj: c.maj, membres: c.membres, data: c.data } : { ok: false, erreur: 'Carrière coop introuvable.' }); }
      default: return json_({ ok: true, info: 'Carton Plein : serveur', v: VERSION_SERVEUR });
    }
  } catch (err) { return json_({ ok: false, erreur: String(err) }); }
}

// ---------- écriture ----------
function doPost(e) {
  try {
    const o = JSON.parse(e.postData.contents);
    switch (o.action) {
      case 'save': return verrou_(() => {
        codeOk_(o.code);
        const avant = lireJSON_(o.code + '.json', null);
        // ne jamais écraser une sauvegarde plus récente (deux téléphones)
        if (avant && (avant.maj || 0) > (o.maj || 0)) return json_({ ok: false, erreur: 'plus récente sur le cloud', maj: avant.maj });
        const contenu = { maj: o.maj, pseudo: propre_(o.pseudo, 16), amis: (o.amis || []).slice(0, 30), data: o.data };
        if (JSON.stringify(contenu).length > 5e6) return json_({ ok: false, erreur: 'sauvegarde trop grosse' });
        ecrireJSON_(o.code + '.json', contenu);
        return json_({ ok: true });
      });
      case 'publier': return verrou_(() => {
        const s = social_();
        s.fil.push({ de: codeOk_(o.code), pseudo: propre_(o.pseudo, 16), type: propre_(o.type, 20), txt: propre_(o.txt, 160), pour: o.pour || null, t: Date.now() });
        sauverSocial_(s); return json_({ ok: true });
      });
      case 'message': return verrou_(() => {
        const s = social_();
        s.messages.push({ de: codeOk_(o.de), a: codeOk_(o.a), pseudo: propre_(o.pseudo, 16), txt: propre_(o.txt, 200), type: o.type === 'invite' ? 'invite' : 'texte', salon: o.salon || null, t: Date.now() });
        sauverSocial_(s); return json_({ ok: true });
      });
      case 'defi': return verrou_(() => {
        const s = social_(), sem = propre_(o.semaine, 10), code = codeOk_(o.code);
        const L = s.defis[sem] = s.defis[sem] || {}, avant = L[code];
        const essais = (avant ? avant.essais : 0) + 1;
        L[code] = { pseudo: propre_(o.pseudo, 16), club: propre_(o.club, 40), score: Math.max(avant ? avant.score : 0, +o.score || 0), essais: essais, t: Date.now() };
        sauverSocial_(s); return json_({ ok: true, defi: L });
      });
      case 'salonCree': return verrou_(() => {
        const s = { id: nouvelId_(), graine: Math.floor(Math.random() * 4294967295), hote: o.joueur, invite: null, coups: {}, t: Date.now() };
        ecrireSalon_(s); return json_({ ok: true, salon: s });
      });
      case 'salonRejoindre': return verrou_(() => {
        const s = lireSalon_(propre_(o.id, 4).toUpperCase());
        if (!s) return json_({ ok: false, erreur: 'Salon introuvable ou expiré.' });
        if (s.invite && s.invite.code !== o.joueur.code) return json_({ ok: false, erreur: 'Ce match a déjà deux joueurs.' });
        if (s.hote.code === o.joueur.code) return json_({ ok: false, erreur: 'C’est ton propre salon.' });
        s.invite = o.joueur; ecrireSalon_(s); return json_({ ok: true, salon: s });
      });
      case 'salonCoup': return verrou_(() => {
        const s = lireSalon_(o.id);
        if (!s) return json_({ ok: false, erreur: 'Salon expiré.' });
        s.coups[propre_(o.cle, 30)] = o.valeur; s.t = Date.now(); ecrireSalon_(s); return json_({ ok: true, salon: s });
      });
      case 'coopCree': return verrou_(() => {
        const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let id;
        do { id = ''; for (let i = 0; i < 6; i++) id += a[Math.floor(Math.random() * a.length)]; } while (fichier_('coop_' + id + '.json'));
        const c = { maj: o.maj || Date.now(), membres: [{ code: codeOk_(o.code), pseudo: propre_(o.pseudo, 16) }], data: o.data };
        c.data.coop.id = id; ecrireJSON_('coop_' + id + '.json', c);
        const s = social_(); indexerCoop_(s, id, c); sauverSocial_(s);
        return json_({ ok: true, id: id, maj: c.maj });
      });
      case 'coopRejoindre': return verrou_(() => {
        const id = idCoop_(o.id), c = lireJSON_('coop_' + id + '.json', null), code = codeOk_(o.code);
        if (!c) return json_({ ok: false, erreur: 'Carrière coop introuvable.' });
        if (!c.membres.some(m => m.code === code)) {
          if (c.membres.length >= 2) return json_({ ok: false, erreur: 'Ce club a déjà ses deux entraîneurs.' });
          c.membres.push({ code: code, pseudo: propre_(o.pseudo, 16) }); c.data.coop.membres = c.membres;
          ecrireJSON_('coop_' + id + '.json', c);
          const s = social_(); indexerCoop_(s, id, c); sauverSocial_(s);
        }
        return json_({ ok: true, maj: c.maj, membres: c.membres, data: c.data });
      });
      case 'coopSave': return verrou_(() => {
        const id = idCoop_(o.id), c = lireJSON_('coop_' + id + '.json', null), code = codeOk_(o.code);
        if (!c) return json_({ ok: false, erreur: 'Carrière coop introuvable.' });
        if (!c.membres.some(m => m.code === code)) return json_({ ok: false, erreur: 'Tu ne fais pas partie de ce club.' });
        // l'autre entraîneur a enregistré depuis la dernière lecture de ce téléphone : on refuse, le téléphone recharge
        if (o.base !== c.maj) return json_({ ok: false, erreur: 'plus récente sur le cloud', maj: c.maj });
        c.maj = Math.max(o.maj || 0, (c.maj || 0) + 1); c.data = o.data; c.data.coop.membres = c.membres; c.data.maj = c.maj;
        ecrireJSON_('coop_' + id + '.json', c);
        const s = social_(); indexerCoop_(s, id, c); sauverSocial_(s);
        return json_({ ok: true, maj: c.maj });
      });
      default: return json_({ ok: false, erreur: 'action inconnue' });
    }
  } catch (err) { return json_({ ok: false, erreur: String(err) }); }
}
