// =====================================================================
// CARRIÈRE (C) : sauvegarde, saison, récompenses, fin de match, fin de saison
// =====================================================================
// CARRIÈRE (C)
// =====================================================================
let C = null;
const CLE = 'carton-plein-carriere-v1';
let TUTO_EN_COURS = false;
// carrière coop : C est alors le club partagé, rangé à part (jamais à la place de la carrière solo)
let COOP = null, COOP_CREATION = null;
const cleCoop = id => 'carton-plein-coop-' + id;
function sauver() {
  if (!C || C.temp || TUTO_EN_COURS || COOP_CREATION) return; C.maj = Date.now();
  try { localStorage.setItem(COOP ? cleCoop(COOP) : CLE, JSON.stringify(C)); } catch (e) { }
  if (COOP) { if (typeof coopPlanifier === 'function') coopPlanifier(); } else if (typeof syncPlanifier === 'function') syncPlanifier();
}
function charger() { try { const t = localStorage.getItem(CLE); return t ? migrer(JSON.parse(t)) : null; } catch (e) { return null; } }
const ALIAS = { 'es-ponfe': 'es-ponferradina' };
function migrer(c) { // sauvegardes de la v7 et de la v8
  if (!c) return c;
  c.pays = c.pays || 'fr'; c.trophees = c.trophees || []; c.coupes = c.coupes || {};
  if (ALIAS[c.club]) c.club = ALIAS[c.club];
  const av = C; C = c;
  if (!c.formation) initFormation();
  if ((c.v || 1) < 3) { // vraies ligues 2026-2027 : on repart en début de saison, tout le reste est gardé
    const div = c.div; c.divisions = {}; c.groupes = {};
    CLUBS.forEach(cl => { c.divisions[cl.id] = cl.div; c.groupes[cl.id] = cl.g; });
    if (!clubPar(c.club)) c.club = CLUBS.find(cl => cl.pays === c.pays && cl.div === div).id;
    c.divisions[c.club] = div;
    if (aGroupes(c.pays, div) && !c.groupes[c.club]) c.groupes[c.club] = '1';
    if (!aGroupes(c.pays, div)) c.groupes[c.club] = null;
    c.rival = choisirRival(); c.offres = null; c.offre = null;
    nouvelleSaison();
    c.migre = true;
  }
  if ((c.v || 1) < 4) {
    c.effectif.forEach((j, i) => { if (!j.k) j.k = GABARIT[i] ? GABARIT[i].k : pick(Object.keys(COULEURS)); });
    if (!c.cartes.some(x => estConsigne(x.t))) { c.cartes.push(nouvelleCarte('contrepied', 6, 'rare')); c.cartes.push(nouvelleCarte('pressing', 2, 'rare')); }
    c.nouveautesV10 = true;
  }
  if (!c.objectifs) { const av2 = C; C = c; try { nouveauxObjectifs(); } catch (e) {} C = av2; }
  if ((c.v || 1) < 5) { if (!c.cartes.some(x => x.t === 'feinte')) c.cartes.push(nouvelleCarte('feinte', 7, 'rare')); c.nouveautesV13 = true; }
  if ((c.v || 1) < 6) c.nouveautesV16 = true;
  if ((c.v || 1) < 7 && !c.nouveautesV16) c.nouveautesV17 = true;
  // titres de division (champion de Ligue 3, de Ligue 2...) : désormais dans la vitrine
  if ((c.v || 1) < 8) (c.palmares || []).forEach(p => { if (p.rang === 1 && !c.trophees.some(t => t.k === 'titre' && t.s === p.s)) c.trophees.push({ s: p.s, k: 'titre', nom: `Champion de ${PAYS[p.pays || c.pays].divs[p.div]}` }); });
  if ((c.v || 1) < 9) {
    // nouvelles défenses : Bloc devient un repli sans fiche. On rembourse ce qui a été payé (anciens prix).
    let rendu = 0; const ancienPrix = l => 60 + 20 * (l - 1);
    Object.entries(c.niveaux || {}).forEach(([id, n]) => {
      const k = comboPar(id), garde = !k || !ficheAmeliorable(k) ? 1 : Math.min(n, NIV_MAX);
      for (let l = garde; l < n; l++) rendu += ancienPrix(l);
      if (garde <= 1) delete c.niveaux[id]; else c.niveaux[id] = garde;
    });
    c.pieces += rendu; c.nouveautesV18 = rendu || true;
  }
  C = av;
  c.v = 9; return c;
}
function effacer() { try { localStorage.removeItem(CLE); } catch (e) { } }

function valeurCarte(c) {
  if (estConsigne(c.t)) return 0;
  const j = C.effectif[c.ji], R = RARETES[c.r];
  return TYPES[c.t].base + (j ? j.note : 0) + R.bonus + 2 * (c.niv - 1) + (c.sp && SPECIAUX[c.t].plus ? SPECIAUX[c.t].plus : 0);
}
function nouvelleCarte(t, ji, r) {
  const c = { id: C.nid++, t, ji, r: r || 'commune', niv: 1 };
  if (c.r === 'legendaire') c.sp = true;
  return c;
}
function nouvelleCarriere(clubId) {
  const pays = clubPar(clubId).pays;
  C = { v: 2, pays, club: clubId, saison: 1, div: 3, journee: 0, nid: 0, pieces: 40, stars: ['capitaine'], niveaux: {}, effectif: [], cartes: [], journal: [], palmares: [], trophees: [], vus: {}, rival: null, boutique: null, divisions: {}, coupes: {}, qualifEurope: null };
  GABARIT.forEach(g => C.effectif.push({ nom: nomJoueur(), p: g.p, l: g.l, k: g.k, note: rnd(3), buts: 0, matchs: 0 }));
  GABARIT.forEach((g, ji) => g.c.forEach(t => C.cartes.push(nouvelleCarte(t, ji, estConsigne(t) ? 'rare' : 'commune'))));
  // deux cartes rares pour démarrer
  melanger(C.cartes.filter(c => TYPES[c.t].att)).slice(0, 2).forEach(c => (c.r = 'rare'));
  C.groupes = {};
  CLUBS.forEach(cl => { C.divisions[cl.id] = cl.div; C.groupes[cl.id] = cl.g; });
  C.rival = choisirRival();
  initFormation();
  nouvelleSaison();
  sauver();
}
const NB_GROUPES = { es: 2, it: 3 };
const aGroupes = (p, d) => d === 3 && !!NB_GROUPES[p];
function clubsDiv(div, tous) {
  const g = C.groupes[C.club];
  return CLUBS.filter(cl => cl.pays === C.pays && C.divisions[cl.id] === div && (tous || div !== C.div || !aGroupes(C.pays, div) || C.groupes[cl.id] === g)).map(cl => cl.id);
}
function choisirRival() { const l = clubsDiv(C.div).filter(id => id !== C.club); return l.length ? pick(l) : null; }
// combien montent depuis le tableau du joueur, combien descendent
function quotas(div) {
  const P = PAYS[C.pays];
  const up = div > 1 ? (aGroupes(C.pays, div) ? Math.ceil(P.ech[div - 2] / NB_GROUPES[C.pays]) : P.ech[div - 2]) : 0;
  const down = div < 3 ? P.ech[div - 1] : 0;
  return { up, down, europe: div === 1 ? 4 : 0 };
}
function nouvelleSaison() {
  C.journee = 0;
  const ids = clubsDiv(C.div);
  C.classement = {}; ids.forEach(id => (C.classement[id] = { pts: 0, j: 0, g: 0, n: 0, p: 0, bp: 0, bc: 0 }));
  C.calendrier = melanger(ids.filter(id => id !== C.club));
  // le rival tombe en milieu de saison si on est dans la même division
  const ir = C.calendrier.indexOf(C.rival);
  if (ir >= 0) { C.calendrier.splice(ir, 1); C.calendrier.splice(Math.floor(C.calendrier.length / 2), 0, C.rival); }
  C.domicile = C.calendrier.map((_, i) => i % 2 === 0);
  C.meteoProchaine = pick(Object.keys(METEOS));
  initCoupes();
  nouveauxObjectifs();
  nouvelleBoutique();
  C.mercato = null; majMercato();
}
const forceClub = id => { const b = clubPar(id).force; return id === C.club ? 0.5 : b; };
function adversaire() { return C.calendrier[C.journee]; }
function rangDe(id) { return classementTrie().findIndex(l => l.id === id) + 1; }
function classementTrie() {
  return Object.entries(C.classement).map(([id, l]) => ({ id, ...l })).sort((a, b) => b.pts - a.pts || (b.bp - b.bc) - (a.bp - a.bc) || b.bp - a.bp || a.id.localeCompare(b.id));
}
function enregistrer(a, b, ga, gb) {
  const A = C.classement[a], B = C.classement[b];
  A.j++; B.j++; A.bp += ga; A.bc += gb; B.bp += gb; B.bc += ga;
  if (ga > gb) { A.g++; A.pts += 3; B.p++; } else if (ga < gb) { B.g++; B.pts += 3; A.p++; } else { A.n++; B.n++; A.pts++; B.pts++; }
}
function poisson(l) { let k = 0, p = 1; const L = Math.exp(-l); do { k++; p *= hasard(); } while (p > L); return k - 1; }
function simulerJournee() { // les autres matchs de la journée
  const restants = clubsDiv(C.div).filter(id => id !== C.club && id !== adversaire());
  melanger(restants);
  for (let i = 0; i + 1 < restants.length; i += 2) {
    const a = restants[i], b = restants[i + 1], fa = forceClub(a), fb = forceClub(b);
    enregistrer(a, b, poisson(1.25 + (fa - fb) * 1.6), poisson(1.1 + (fb - fa) * 1.6));
  }
}
function nouvelleBoutique() {
  const libres = STARS.filter(s => !C.stars.includes(s.id));
  const st = libres.length ? pick(libres.filter(s => s.r !== 'epique' || C.div <= 2).length ? libres.filter(s => s.r !== 'epique' || C.div <= 2) : libres) : null;
  const combo = pick(fichesOuvertes().length ? fichesOuvertes() : COMBOS_ATT.filter(k => !k.repli));
  const r = hasard() < 0.5 ? 'rare' : C.div <= 2 ? 'epique' : 'rare';
  const t = pick(Object.keys(TYPES));
  C.boutique = { star: st ? st.id : null, fiche: combo.id, carte: { t, r, prix: r === 'rare' ? 70 : 120 }, achete: {} };
}

// ---------- Récompenses après match ----------
function jiPourType(t) {
  const lignes = TYPES[t].att ? (t === 'tete' || t === 'frappe' ? ['ATT', 'MIL'] : ['ATT', 'MIL', 'DEF']) : t === 'gardien' ? ['G'] : ['DEF', 'MIL'];
  const cand = C.effectif.map((j, i) => ({ j, i })).filter(o => !o.j.parti).filter(o => (t === 'gardien' ? o.j.p === 'Gardien' : lignes.includes(o.j.l) && o.j.p !== 'Gardien'));
  return pick(cand).i;
}
function genRecompenses(europe) {
  const out = [];
  const t = hasard() < 0.22 ? pick(CONSIGNES) : pick(Object.keys(TYPES).filter(x => !estConsigne(x)));
  let r = estConsigne(t) ? 'rare' : tirageRarete(C.div); if (europe && (r === 'commune' || r === 'rare')) r = hasard() < 0.3 ? 'legendaire' : 'epique';
  out.push({ k: 'carte', t, r, ji: jiPourType(t) });
  const upg = C.cartes.filter(c => !estConsigne(c.t) && c.niv < RARETES[c.r].max);
  if (upg.length) { const c = pick(upg); out.push({ k: 'niveau', id: c.id }); }
  const libres = STARS.filter(s => !C.stars.includes(s.id) && (s.r !== 'epique' || C.div <= 2));
  if (libres.length && C.stars.length < MAX_STARS && hasard() < 0.6) out.push({ k: 'star', id: pick(libres).id });
  else if (fichesOuvertes().length) out.push({ k: 'fiche', id: pick(fichesOuvertes()).id });
  if (out.length < 3) out.push({ k: 'pieces', n: 40 });
  return out;
}
function appliquerRecompense(o) {
  if (o.k === 'carte') C.cartes.push(nouvelleCarte(o.t, o.ji, o.r));
  if (o.k === 'niveau') { const c = C.cartes.find(x => x.id === o.id); if (c) c.niv++; }
  if (o.k === 'star' && C.stars.length < MAX_STARS) C.stars.push(o.id);
  if (o.k === 'fiche' && !monterFiche(o.id)) C.pieces += 60; // fiche au maximum : remplacée par des pièces
  if (o.k === 'pieces') C.pieces += o.n;
}

// ---------- Facteur de difficulté ----------
// niveau Facile : murs et attaques adverses plus bas (sauf défi de la semaine et direct, pour rester comparables)
const NIVEAUX = { facile: 0.85, normal: 1.19 };
function facteurAdversaire(id) {
  const f = facteurBrut(id), fixe = S && (S.comp === 'defi' || S.comp === 'direct');
  return fixe ? f : f * (NIVEAUX[reglages().difficulte] || 1);
}
function facteurBrut(id) {
  if (S && S.facteurFixe) return S.facteurFixe;
  let base = DIFF[C.div];
  if (S && S.cup) { const K = COUPES[S.cup.k]; base = S.cup.k === 'nat' ? DIFF[C.divisions[id]] * K.diff[S.cup.tour] : K.diff[S.cup.tour]; }
  return base * (0.88 + 0.3 * clubPar(id).force) * (1 + DIFF.j * C.journee * 9 / Math.max(9, C.calendrier.length)) * (1 + DIFF.s * Math.max(0, C.saison - 1)) * (1 + DIFF.r * (C.ansD1 || 0));
}

// ---------- Fin de match côté carrière ----------
function bilanMatch(tab) {
  const opp = S.opp, gp = S.score.p, gc = S.score.ia, comp = S.comp || 'ligue';
  verserCarnet(gp, gc);
  let gain, coupe = null;
  let rivalTxt = null;
  if (comp === 'ligue') {
    enregistrer(C.club, opp, gp, gc);
    const avR = C.rival && C.classement[C.rival] ? C.classement[C.rival].pts : null, avJ = avR != null ? C.classement[C.rival].j : 0;
    simulerJournee();
    if (avR != null && opp !== C.rival && C.classement[C.rival].j > avJ) { const d = C.classement[C.rival].pts - avR, nr = clubPar(C.rival).nom; rivalTxt = d === 3 ? `${nr}, le rival, a gagné de son côté.` : d === 1 ? `${nr}, le rival, a fait match nul.` : `${nr}, le rival, a perdu !`; }
    gain = (gp > gc ? 22 : gp === gc ? 12 : 8) + 3 * gp;
  } else {
    const cp = C.coupes[comp], K = COUPES[cp.k], tourJoue = TOURS[cp.tour];
    const qualifie = gp > gc || (gp === gc && !!(tab && tab.gagne));
    gain = (qualifie ? K.gain : Math.round(K.gain / 2)) + 3 * gp;
    if (qualifie) { cp.tour++; if (cp.tour >= 3) { cp.gagne = true; gain += K.prime; C.trophees.push({ s: C.saison, k: cp.k, nom: nomCoupe(cp.k) }); } }
    else cp.elim = true;
    coupe = { nom: nomCoupe(cp.k), k: cp.k, tourJoue, qualifie, gagne: cp.gagne, suivant: !cp.gagne && qualifie ? TOURS[cp.tour] : null, prime: cp.gagne ? K.prime : 0 };
  }
  gain = Math.round(gain * 0.6);
  // défi du match
  const D = DEFIS.find(x => x.id === S.defi), defiOk = !!(D && D.ok(S.stats, S));
  if (defiOk) gain += PRIME_DEFI;
  // objectifs du président
  const objFaits = [];
  const ajoute = o => o && objFaits.push(o);
  if (comp === 'ligue') ajoute(avancerObjectif('buts', gp));
  if (comp === 'ligue' && opp === C.rival && gp > gc) ajoute(avancerObjectif('derby', 1));
  if (S.stats.cartons) ajoute(avancerObjectif('cartons', S.stats.cartons));
  C.serie = gp >= gc ? (C.serie || 0) + 1 : 0; ajoute(avancerObjectif('serie', C.serie, true));
  if (comp === 'nat' && C.coupes.nat && (C.coupes.nat.tour >= 2 || C.coupes.nat.gagne)) ajoute(avancerObjectif('coupe', 1));
  C.pieces += gain;
  S.buteurs.forEach(ji => C.effectif[ji] && C.effectif[ji].buts++);
  C.effectif.forEach(j => j.matchs++);
  const une = titreJournal(gp, gc, coupe, tab);
  const sc = `${clubPar(C.club).court} ${gp} - ${gc} ${clubPar(opp).court}` + (tab ? ` (t.a.b. ${tab.p}-${tab.ia})` : '');
  C.journal.unshift({ rival: rivalTxt, s: C.saison, j: C.journee + 1, div: C.div, pays: C.pays, comp: coupe ? `${coupe.nom} · ${coupe.tourJoue}` : null, txt: une, score: sc, opp });
  if (C.journal.length > 60) C.journal.length = 60;
  if (comp === 'ligue') { C.journee++; majMercato(); C.offres = null; } // les offres de l'été expirent au 1er match
  progresserJeunes(comp === 'ligue' ? 1 : 0.6);
  // récompense au choix seulement après une victoire (ou une qualification)
  const recompenses = (gp > gc || (coupe && coupe.qualifie)) ? genRecompenses(comp === 'eur') : [];
  C.meteoProchaine = pick(Object.keys(METEOS));
  nouvelleBoutique();
  sauver();
  return { gain, une, recompenses, coupe, defi: D, defiOk, objFaits };
}
function titreJournal(gp, gc, coupe, tab) {
  const moi = clubPar(C.club).nom, eux = clubPar(S.opp).nom;
  const b = S.buteurs.length ? C.effectif[S.buteurs[S.buteurs.length - 1]].nom : null;
  if (coupe) {
    if (coupe.gagne) return pick([`${moi} soulève la ${coupe.nom} !`, `${coupe.nom} : ${moi} entre dans l'histoire`, `Nuit de folie : ${moi} remporte la ${coupe.nom}`]);
    if (coupe.qualifie) return (tab ? `${moi} passe aux tirs au but face à ${eux}` : pick([`${moi} sort ${eux} et file en ${coupe.suivant.toLowerCase()}`, `${coupe.nom} : ${moi} élimine ${eux}`])) ;
    return tab ? `Cruel : ${moi} tombe aux tirs au but` : pick([`${moi} éliminé de la ${coupe.nom}`, `Fin de l'aventure en ${coupe.nom} pour ${moi}`]);
  }
  const derby = S.opp === C.rival;
  if (gp > gc && gp - gc >= 2) return pick([`${moi} écrase ${eux}`, `Démonstration de ${moi} face à ${eux}`, `${eux} balayé par ${moi}`]) + (derby ? ' : le derby est à nous !' : '');
  if (gp > gc) return pick([`${b} offre la victoire à ${moi}`, `${moi} s'impose face à ${eux}`, `${b}, l'homme du match`]) + (derby ? ' dans le derby' : '');
  if (gp === gc) return pick([`${moi} et ${eux} dos à dos`, `Partage des points entre ${moi} et ${eux}`, `${moi} accroché par ${eux}`]);
  return pick([`${moi} chute face à ${eux}`, `Soirée difficile pour ${moi}`, `${eux} fait tomber ${moi}`]) + (derby ? ' : le derby perdu' : '');
}
function finSaison() {
  const tri = classementTrie().map(l => l.id), nb = tri.length, rang = tri.indexOf(C.club) + 1, P = PAYS[C.pays];
  const Q = quotas(C.div);
  let issueS = 'maintien';
  if (C.div > 1 && rang <= Q.up) issueS = 'montee';
  else if (C.div === 1 && rang === 1) issueS = 'champion';
  else if (C.div < 3 && rang > nb - Q.down) issueS = 'descente';
  else if (C.div === 1 && rang <= 4) issueS = 'europe';
  C.qualifEurope = C.div === 1 ? (rang <= 2 ? 'c1' : rang <= 4 ? 'c3' : null) : null;
  const coupesSaison = Object.values(C.coupes || {}).map(cp => ({ nom: nomCoupe(cp.k), gagne: cp.gagne, tour: cp.gagne ? 'Vainqueur' : cp.elim ? TOURS[cp.tour] : TOURS[Math.min(cp.tour, 2)] }));
  const objRang = avancerObjectif('rang', rang <= ((C.objectifs || []).find(o => o.id === 'rang') || { cible: 0 }).cible ? 99 : 0, true);
  const objectifsSaison = (C.objectifs || []).map(o => ({ txt: OBJ_SAISON[o.id].txt(o), fait: o.fait, prime: OBJ_SAISON[o.id].prime }));
  C.palmares.push({ s: C.saison, div: C.div, pays: C.pays, club: C.club, rang, nb, issue: issueS, coupes: coupesSaison });
  if (rang === 1) C.trophees.push({ s: C.saison, k: 'titre', nom: `Champion de ${nomDiv(C.div)}` });
  // montées et descentes dans tout le pays
  const bruit = {}; CLUBS.forEach(cl => { if (cl.pays === C.pays) bruit[cl.id] = cl.force + hasard() * 0.25; });
  const mouv = [];
  for (const d of [1, 2]) {
    const n = P.ech[d - 1];
    const haut = clubsDiv(d, true), bas = clubsDiv(d + 1, true);
    const desc = d === C.div ? tri.slice(nb - n) : haut.sort((x, y) => bruit[x] - bruit[y]).slice(0, n);
    let mont;
    if (d + 1 === C.div) {
      mont = tri.slice(0, Q.up);
      const autres = bas.filter(id => !mont.includes(id) && !tri.includes(id)).sort((x, y) => bruit[y] - bruit[x]);
      mont = mont.concat(autres.slice(0, n - mont.length));
    } else mont = bas.sort((x, y) => bruit[y] - bruit[x]).slice(0, n);
    mouv.push({ d, desc, mont });
  }
  mouv.forEach(({ d, desc, mont }) => {
    desc.forEach((id, i) => { C.divisions[id] = d + 1; C.groupes[id] = aGroupes(C.pays, d + 1) ? (mont[i] ? C.groupes[mont[i]] : '1') : null; });
    mont.forEach(id => { C.divisions[id] = d; C.groupes[id] = null; });
  });
  const avant = C.div;
  if (avant === 1) C.ansD1 = (C.ansD1 || 0) + 1;
  C.div = C.divisions[C.club];
  if (C.divisions[C.rival] !== C.div || (aGroupes(C.pays, C.div) && C.groupes[C.rival] !== C.groupes[C.club])) C.rival = choisirRival();
  C.saison++;
  C.pieces += { montee: 80, champion: 150, europe: 100, maintien: 40, descente: 30 }[issueS];
  C.offres = genOffres(issueS, rang, nb, avant);
  nouvelleSaison();
  const nouveaux = arriveeJeunes();
  sauver();
  return { objectifsSaison, rang, nb, issue: issueS, avant, apres: C.div, qualif: C.qualifEurope || (C.coupes.eur && C.coupes.eur.k), nouveaux, offres: C.offres, coupes: coupesSaison };
}
function accepterOffre(id) {
  const o = (C.offres || []).find(x => x.id === id); if (!o) return;
  const cl = clubPar(id), etranger = cl.pays !== C.pays;
  C.pays = cl.pays; C.club = id; C.div = C.divisions[id]; C.offres = null;
  C.pieces += o.prime;
  C.rival = choisirRival();
  C.qualifEurope = null;
  if (etranger) C.ansD1 = Math.max(0, (C.ansD1 || 0) - 1); // nouveau championnat : on te connaît moins
  nouvelleSaison();
  sauver();
}
// =====================================================================
