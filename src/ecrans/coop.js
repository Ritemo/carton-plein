// =====================================================================
// CARRIÈRE COOP : un club pour deux entraîneurs, matchs en relais
// =====================================================================
// Le club partagé vit sur le serveur (coop_XXXXXX.json) et sur chaque téléphone, à part de la carrière solo.
// Un match se joue en relais : l'un joue la première mi-temps, l'autre la seconde (ou le même, s'il préfère).
// Chaque match de coop rapporte une prime aux carrières solo des deux entraîneurs.
const PRIME_COOP = [15, 8, 4], PRIME_COOP_TROPHEE = 1; // pièces (victoire, nul, défaite) ; cartes rares par trophée
const moiCoop = () => profil().code;
const partenaire = () => (C && C.coop ? (C.coop.membres || []).find(m => m.code !== moiCoop()) : null);
const nomPartenaire = () => (partenaire() ? partenaire().pseudo : 'ton coéquipier');

// ---------- synchronisation ----------
let COOP_TIMER = null, COOP_BASE = null; // COOP_BASE : version du serveur sur laquelle ce téléphone travaille
function coopPlanifier() { clearTimeout(COOP_TIMER); COOP_TIMER = setTimeout(() => { COOP_TIMER = null; coopEnvoyer().catch(() => { }); }, 1500); }
async function coopEnvoyer() {
  if (!COOP || !C || !C.coop) return;
  clearTimeout(COOP_TIMER); COOP_TIMER = null;
  try { const j = await apiEcrire('coopSave', { id: COOP, code: moiCoop(), maj: C.maj, base: COOP_BASE, data: C }); COOP_BASE = j.maj; }
  catch (e) {
    if (/récente/.test(e.message)) { await coopRecharger(); toast(`${nomPartenaire()} a joué entre-temps : club mis à jour`); if (!S) hub(ONGLET || 'vestiaire'); }
    else throw e;
  }
}
async function coopRecharger() {
  const j = await apiLire('coopLoad', { id: COOP });
  C = migrer(j.data); C.coop.membres = j.membres; C.maj = j.maj; COOP_BASE = j.maj;
  try { localStorage.setItem(cleCoop(COOP), JSON.stringify(C)); } catch (e) { }
  recupererPrime();
}
// la prime gagnée en coop attend dans le club ; on la range dans le profil pour la carrière solo
function recupererPrime() {
  const b = C && C.coop && C.coop.bonus && C.coop.bonus[moiCoop()];
  if (!b || (!b.pieces && !b.rares)) return;
  const p = profil(); p.bonusSolo = p.bonusSolo || { pieces: 0, rares: 0 };
  p.bonusSolo.pieces += b.pieces || 0; p.bonusSolo.rares += b.rares || 0; majProfil(p);
  C.coop.bonus[moiCoop()] = { pieces: 0, rares: 0 }; sauver();
}
// de retour dans la carrière solo : on verse la prime
function verserPrimeSolo() {
  const p = profil(), b = p.bonusSolo;
  if (COOP || !C || !b || (!b.pieces && !b.rares)) return;
  C.pieces += b.pieces;
  const types = Object.keys(TYPES).filter(t => !TYPES[t].consigne && !TYPES[t].special);
  for (let i = 0; i < b.rares; i++) { const t = pick(types); C.cartes.push(nouvelleCarte(t, jiPourType(t), 'rare')); }
  p.bonusSolo = { pieces: 0, rares: 0 }; majProfil(p); sauver();
  modal(`${img('poignee', 'grande-ic')}<h1 class="lil">Prime de la coop</h1><p>Tes matchs en coop rapportent à ta carrière solo : <b>+${b.pieces} pièces</b>${b.rares ? ` et <b>${b.rares} carte${b.rares > 1 ? 's' : ''} rare${b.rares > 1 ? 's' : ''}</b>` : ''}.</p><div class="btns"><button class="btn" id="pOk">Merci coach</button></div>`, () => ($('#pOk').onclick = () => { fermerModal(); barreHaut(); }));
}

// clubs coop affichés : sans ceux que j'ai retirés, ni les doublons vides (même club, créé seul, jamais joué)
function coopsVisibles(L) {
  L = L || []; const p = profil(), caches = p.coopsCaches || [];
  return L.filter(c => !caches.includes(c.id) && !(c.membres.length === 1 && !(c.journee > 0) && L.some(o => o.id !== c.id && o.club === c.club && o.membres.length === 2)));
}
function retirerCoop(id) { const p = profil(); p.coopsCaches = [...(p.coopsCaches || []), id]; majProfil(p); }

// ---------- écran : mes carrières coop ----------
async function ecranCoop() {
  if (!urlCloud()) return toast('Il faut la sauvegarde automatique (menu, Sauvegarde)');
  const p = profil(); if (!p.pseudo) return demanderPrenom(ecranCoop);
  modal(`<h1 class="lil">Carrière coop</h1><p class="petit">Un club pour deux. Chaque match se joue en relais : une mi-temps chacun. Chaque match rapporte aussi une prime à vos carrières solo.</p><div id="cListe"><p class="petit">Chargement…</p></div>
    <div class="btns col"><button class="btn" id="cNew">Créer un club coop</button><button class="btn sec" id="cJoin">Rejoindre avec un code</button><button class="btn sec" id="cFer">Fermer</button></div>`, () => {
    $('#cNew').onclick = creerCoopChoix; $('#cJoin').onclick = rejoindreCoopCode; $('#cFer').onclick = fermerModal;
  });
  try {
    const j = await chargerSocial(true);
    if (j && j.v < 3) throw new Error('le script Google doit être mis à jour (nouvelle version du déploiement).');
    const L = coopsVisibles(j && j.coops);
    const el = $('#cListe'); if (!el) return;
    el.innerHTML = L.length ? L.map(c => { const cl = clubPar(c.club), aMoi = c.relais && c.relais.par !== p.code, autre = c.pseudos.find((x, i) => c.membres[i] !== p.code) || 'en attente d’un coéquipier';
      return `<div class="coop-ligne"><button class="coop-l" data-coop="${c.id}">${cl ? blason(cl, 36) : ''}<div><b>${cl ? echap(cl.nom) : c.club}</b><small>avec ${echap(autre)} · saison ${c.saison || 1}, journée ${(c.journee || 0) + 1} · code ${c.id}</small>${aMoi ? `<small class="coop-tour">À toi : 2e mi-temps (${c.relais.score.p}-${c.relais.score.ia})</small>` : ''}</div></button><button class="btn sec petit-btn" data-retire="${c.id}" aria-label="Retirer de ma liste">✕</button></div>`; }).join('') : '<p class="petit">Pas encore de club coop.</p>';
    document.querySelectorAll('[data-coop]').forEach(b => (b.onclick = () => unSeul(b, () => entrerCoop(b.dataset.coop))));
    document.querySelectorAll('[data-retire]').forEach(b => (b.onclick = () => { retirerCoop(b.dataset.retire); ecranCoop(); }));
  } catch (e) { const el = $('#cListe'); if (el) el.innerHTML = `<p class="petit">${echap(e.message)}</p>`; }
}
function creerCoopChoix() {
  const amis = amisListe(), opt = (k, v, t, d) => `<button class="choix-rgl ${k === 'niveau' && v === 'facile' ? 'on' : ''}" data-k="${k}" data-v="${v}"><b>${t}</b><small>${d}</small></button>`;
  let choix = { niveau: 'facile', ami: amis[0] ? amis[0].code : null };
  modal(`<h1 class="lil">Nouveau club coop</h1>
    <h2 class="lil">Avec qui ?</h2><div class="rgl">${amis.length ? amis.map((a, i) => `<button class="choix-rgl ${i === 0 ? 'on' : ''}" data-k="ami" data-v="${a.code}"><b>${echap(a.pseudo || a.code)}</b></button>`).join('') : '<p class="petit">Ajoute d’abord ton coéquipier dans l’onglet Amis, ou donne-lui le code du club après la création.</p>'}</div>
    <h2 class="lil">Niveau du club</h2><div class="rgl">${opt('niveau', 'facile', 'Facile', 'Conseillé avec un enfant')}${opt('niveau', 'normal', 'Normal', 'Pour les coachs confirmés')}</div>
    <div class="btns"><button class="btn" id="cGo">Choisir le club</button><button class="btn sec" id="cAnn">Annuler</button></div>`, () => {
    document.querySelectorAll('.choix-rgl').forEach(b => (b.onclick = () => { choix[b.dataset.k] = b.dataset.v; document.querySelectorAll(`.choix-rgl[data-k="${b.dataset.k}"]`).forEach(x => x.classList.toggle('on', x === b)); }));
    $('#cGo').onclick = () => { fermerModal(); COOP_CREATION = choix; choixPays(); };
    $('#cAnn').onclick = fermerModal;
  });
}
// appelé quand le club est choisi pendant une création coop
async function finCreationCoop(clubId) {
  if (!COOP_CREATION || COOP_CREATION.enCours) return;
  COOP_CREATION.enCours = true;
  const choix = COOP_CREATION, p = profil();
  nouvelleCarriere(clubId);
  C.coop = { niveau: choix.niveau, membres: [{ code: p.code, pseudo: p.pseudo }], relais: null, bonus: {} };
  C.maj = Date.now();
  try {
    const j = await apiEcrire('coopCree', { code: p.code, pseudo: p.pseudo, maj: C.maj, data: C });
    C.coop.id = j.id; COOP = j.id; COOP_BASE = j.maj; COOP_CREATION = null; sauver();
    if (choix.ami) apiEcrire('message', { de: p.code, a: choix.ami, pseudo: p.pseudo, txt: `Je t’ai créé une place de coach à ${clubPar(clubId).nom} ! Onglet Amis, Carrière coop, code ${j.id}`, type: 'texte' }).catch(() => { });
    publier(`lance une carrière coop avec ${clubPar(clubId).nom}`, 'coop');
    intro();
    setTimeout(() => toast(`Code du club : ${j.id}`), 600);
  } catch (e) { COOP_CREATION = null; COOP = null; C = charger(); toast(e.message); accueil(); }
}
function rejoindreCoopCode() {
  modal(`<h1 class="lil">Rejoindre un club coop</h1><input id="cCode" class="zone-txt code-j" maxlength="6" autocapitalize="characters" placeholder="CODE DU CLUB"><p class="petit" id="cMsg"></p>
    <div class="btns"><button class="btn" id="cOk">Rejoindre</button><button class="btn sec" id="cNon">Annuler</button></div>`, () => {
    $('#cOk').onclick = e => unSeul(e.currentTarget, async () => { try { const p = profil(), id = $('#cCode').value.toUpperCase().trim(); await apiEcrire('coopRejoindre', { id, code: p.code, pseudo: p.pseudo }); fermerModal(); entrerCoop(id); } catch (e) { $('#cMsg').textContent = e.message; } });
    $('#cNon').onclick = fermerModal;
  });
}
async function entrerCoop(id) {
  fermerModal(); toast('Ouverture du club coop…');
  if (C && !COOP) sauver(); // la carrière solo reste rangée telle quelle
  COOP = id;
  try { await coopRecharger(); } catch (e) {
    let local = null; try { local = JSON.parse(localStorage.getItem(cleCoop(id))); } catch (x) { }
    if (!local) { COOP = null; C = charger(); return toast(e.message); }
    C = migrer(local); toast('Hors ligne : club tel que sur ce téléphone');
  }
  hub('vestiaire');
}
function quitterCoop() { if (COOP && C && COOP_TIMER) { try { localStorage.setItem(cleCoop(COOP), JSON.stringify(C)); } catch (e) { } coopEnvoyer().catch(() => { }); } COOP = null; COOP_BASE = null; C = charger(); }

// ---------- bandeau du vestiaire ----------
function bandeauCoop() {
  if (!COOP || !C || !C.coop) return '';
  const R = C.coop.relais, pa = nomPartenaire();
  const etat = !partenaire() ? `En attente d’un coéquipier : donne-lui le code <b class="code-j">${C.coop.id}</b>`
    : R && R.par !== moiCoop() ? `<b>${echap(R.pseudo)}</b> a joué la 1re mi-temps (${R.score.p}-${R.score.ia}) : à toi la 2e !`
    : R ? `Tu as joué la 1re mi-temps (${R.score.p}-${R.score.ia}). ${echap(pa)} prend la suite, ou finis-la toi-même.`
    : `Club partagé avec <b>${echap(pa)}</b>. Le premier qui joue lance la 1re mi-temps.`;
  return `<div class="coop-band">${img('poignee', 'mini-ic')}<span>${etat}</span><button class="btn sec petit-btn" id="bSolo">Mon solo</button></div>`;
}
function brancherBandeauCoop() { const b = $('#bSolo'); if (b) b.onclick = () => { quitterCoop(); C ? hub('vestiaire') : accueil(); }; }

// ---------- relais pendant le match ----------
async function lancerMatchCoop() {
  toast('Vérification du club…');
  try { await coopRecharger(); } catch (e) { }
  const R = C.coop.relais;
  if (R) return reprendreCoop(R);
  lancerMatch(); S.coopMoitie = 1;
}
// mi-temps : on range le match dans le club et on passe la main
async function pauseCoop() {
  const p = profil();
  C.coop.relais = { par: p.code, pseudo: p.pseudo, score: { ...S.score }, buteurs: [...S.buteurs], histo: [...S.histo], attente: S.attente, meteo: S.meteo, minute: S.minute, t: Date.now() };
  const opp = S.eq.ia.nom, sc = `${S.score.p}-${S.score.ia}`;
  S = null; sauver();
  try { await coopEnvoyer(); } catch (e) { }
  const pa = partenaire();
  if (pa) apiEcrire('message', { de: p.code, a: pa.code, pseudo: p.pseudo, txt: `Mi-temps contre ${opp} (${sc}) : à toi la 2e mi-temps !`, type: 'texte' }).catch(() => { });
  modal(`${img('sablier', 'grande-ic')}<h1 class="lil">Mi-temps ${sc}</h1><p>${pa ? `${echap(pa.pseudo)} est prévenu : il peut jouer la 2e mi-temps quand il veut.` : 'Ton coéquipier n’a pas encore rejoint le club.'}</p>
    <div class="btns col"><button class="btn" id="mPasse">Passer la main</button><button class="btn sec" id="mMoi">Jouer la 2e mi-temps moi-même</button></div>`, () => {
    $('#mPasse').onclick = () => { fermerModal(); hub('vestiaire'); };
    $('#mMoi').onclick = () => { fermerModal(); reprendreCoop(C.coop.relais); };
  });
}
function reprendreCoop(R) {
  document.body.className = 'match'; $('#barre-haut').innerHTML = ''; $('#nav').innerHTML = '';
  nouveauMatch(prochainMatch());
  Object.assign(S, { score: { ...R.score }, buteurs: [...R.buteurs], histo: [...R.histo], attente: R.attente || effetsVides(), meteo: R.meteo || S.meteo, tf: NB_TF / 2, main: [], coopMoitie: 2, coopRelais: R });
  piocher(); preparerTF();
  const opp = S.eq.ia, moiJoue = R.par === moiCoop();
  modal(`<div class="comp-tag lil">2e mi-temps</div><div class="coup-envoi">${blason(S.eq.p, 56)}<span class="lil">${S.score.p} - ${S.score.ia}</span>${blason(opp, 56)}</div><h1 class="lil centre">${S.eq.p.nom} - ${opp.nom}</h1>
    <p class="centre">${moiJoue ? 'Tu reprends ton match.' : `${echap(R.pseudo)} te laisse le match à <b>${S.score.p}-${S.score.ia}</b>. À toi de finir le travail !`}</p>
    <div class="btns"><button class="btn gros" id="mGo">Reprise</button></div>`, () => ($('#mGo').onclick = () => { Son.sifflet(false); fermerModal(); afficherMatch(); }));
}
// fin de match : prime pour les deux carrières solo, on efface le relais
function finMatchCoop(gp, gc, trophee) {
  if (!COOP || !C || !C.coop) return;
  const res = gp > gc ? 0 : gp === gc ? 1 : 2;
  C.coop.relais = null; C.coop.bonus = C.coop.bonus || {};
  (C.coop.membres || []).forEach(m => { const b = C.coop.bonus[m.code] = C.coop.bonus[m.code] || { pieces: 0, rares: 0 }; b.pieces += PRIME_COOP[res]; if (trophee) b.rares += PRIME_COOP_TROPHEE; });
  const pa = partenaire(), p = profil(), opp = S && S.eq ? S.eq.ia.nom : '';
  if (pa) apiEcrire('message', { de: p.code, a: pa.code, pseudo: p.pseudo, txt: `${['Victoire', 'Match nul', 'Défaite'][res]} ${gp}-${gc} contre ${opp}. Prochain match : à qui le premier !`, type: 'texte' }).catch(() => { });
  if (res === 0 || trophee) publier(`${trophee ? 'remporte un trophée' : 'gagne'} en coop avec ${pa ? pa.pseudo : 'son coéquipier'} (${clubPar(C.club).nom} ${gp}-${gc})`, 'coop');
  recupererPrime();
}
