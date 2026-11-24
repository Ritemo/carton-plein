
// =====================================================================
// MATCH (S)
// =====================================================================
const DIFF = { 3: 0.85, 2: 1.5, 1: 2.35, j: 0.02, s: 0.2, r: 0.32 };
let S = null;
const NB_TF = 6, CHANGEMENTS = 3, PIOCHE_TF = 3; // après chaque temps fort, on ne pioche que 3 cartes (main pleine à la mi-temps)
const aStar = id => S && S.stars.includes(id);
function nouveauMatch(m, auto, opts) {
  m = m || prochainMatch(); const oppId = m.opp;
  if (opts && opts.graine != null) fixerGraine(opts.graine);
  const cp = m.comp !== 'ligue' ? C.coupes[m.comp] : null;
  S = { auto: !!auto, opp: oppId, comp: m.comp, info: m, cup: cp ? { k: cp.k, tour: cp.tour } : null, eq: { p: clubPar(C.club), ia: clubPar(oppId) }, dom: m.dom, stars: [...C.stars],
    pioche: melanger(C.cartes.map(c => ({ ...c, val: valeurCarte(c) }))), defausse: [], main: [], sel: [], score: { p: 0, ia: 0 }, tf: 0,
    changements: CHANGEMENTS + (C.stars.includes('prepa') ? 1 : 0), phase: 'choix', attente: effetsVides(), actif: effetsVides(), histo: [], buteurs: [], defi: pick(DEFIS).id, evts: [], stats: { butsCombos: [], trios: 0, cartons: 0, but1mt: false, consigneUtile: false, meilleur: 0, meilleurCombo: '', arrets: 0 } };
  S.style = S.eq.ia.style;
  S.meteo = C.meteoProchaine || pick(Object.keys(METEOS));
  if (opts) { Object.assign(S, opts); if (opts.style) S.style = opts.style; if (opts.meteo) S.meteo = opts.meteo; }
  piocher();
  preparerTF();
}
const tailleMain = () => 8 + (aStar('supersub') && S.tf >= NB_TF / 2 ? 1 : 0);
const effetsVides = () => ({ mult: 1, cible: 1, cartes: 0, src: [] });
// une consigne par temps fort, en plus des cartes d'action (elle ne prend pas de place)
const nbActions = sel => sel.filter(c => !estConsigne(c.t)).length;
const peutAjouter = (sel, c) => estConsigne(c.t) ? !sel.some(x => estConsigne(x.t)) : nbActions(sel) < maxJouees();
const maxJouees = () => (S && S.type && TF_SPECIAUX[S.type] && TF_SPECIAUX[S.type].max ? TF_SPECIAUX[S.type].max : (aStar('chef') ? 5 : 4) + ((S && S.actif && S.actif.cartes) || 0) - (S && S.adv && S.adv.some(k => CARTES_ADV[k].cartes) ? 1 : 0));
// une consigne jouée agit sur le temps fort suivant (contre-pied, pressing, appel) ou tout de suite (relance)
function activerConsignes(sel) {
  sel.filter(c => estConsigne(c.t)).forEach(c => {
    const A = S.attente;
    if (c.t === 'contrepied') { A.mult *= 1.5; A.src.push('Contre-pied ×1,5'); }
    if (c.t === 'pressing') { A.cible *= 0.8; A.src.push('Pressing haut −20 %'); }
    if (c.t === 'appel') { A.cartes += 1; A.src.push('Appel de balle +1 carte'); }
    if (c.t === 'relance') { for (let i = 0; i < 2; i++) { if (!S.pioche.length) { S.pioche = melanger(S.defausse); S.defausse = []; } if (S.pioche.length) S.main.push(S.pioche.pop()); } }
  });
}
function piocher(n) {
  let reste = n == null ? Infinity : n;
  while (S.main.length < tailleMain() && reste-- > 0) {
    if (!S.pioche.length) { S.pioche = melanger(S.defausse); S.defausse = []; if (!S.pioche.length) return; }
    S.main.push(S.pioche.pop());
  }
}
const enAttaque = () => (S.tf % 2 === 0) !== !!S.inverse;
// =====================================================================
// CARTES ADVERSES : l'ordinateur annonce ce qu'il joue avant ton choix
// =====================================================================
const CARTES_ADV = {
  // quand tu attaques
  marquage: { nom: 'Marquage individuel', ic: 'marquage', txt: 'Ta meilleure carte compte moitié', cote: 'att' },
  horsjeu: { nom: 'Piège du hors-jeu', ic: 'interception', txt: 'Tes Courses valent 0', cote: 'att' },
  blocbas: { nom: 'Bloc bas', ic: 'mur', txt: 'Dribbles −4, mais Frappes +3', cote: 'att' },
  harcelement: { nom: 'Harcèlement', ic: 'feu', txt: '1 carte de moins cette action', cote: 'att', cartes: -1 },
  lecture: { nom: 'Lecture du jeu', ic: 'ampoule', txt: 'Ton combo favori : −1 au combo', cote: 'att' },
  gardienfeu: { nom: 'Gardien en feu', ic: 'gardien', txt: 'Le mur est 15 % plus haut', cote: 'att', cible: 1.15 },
  // quand ils attaquent
  appels: { nom: 'Appels en profondeur', ic: 'course', txt: 'Tes Marquages valent 0', cote: 'def' },
  surnombre: { nom: 'Surnombre', ic: 'supporters', txt: 'Ton combo défensif −0,5', cote: 'def' },
  rapide: { nom: 'Transition rapide', ic: 'eclair', txt: '1 défenseur de moins cette action', cote: 'def', cartes: -1 },
  lointaine: { nom: 'Frappe de loin', ic: 'frappe', txt: 'Tes Gardiens comptent double', cote: 'def' },
  star: { nom: 'Le numéro 10', ic: 'etoile', txt: 'Leur attaque est 20 % plus forte', cote: 'def', cible: 1.2 }
};
const PREF_STYLE = {
  pressing: ['harcelement', 'marquage', 'rapide'], possession: ['lecture', 'surnombre', 'marquage'], bloc: ['blocbas', 'gardienfeu', 'surnombre'],
  feu: ['harcelement', 'rapide', 'appels'], aerien: ['gardienfeu', 'lointaine', 'surnombre'], contre: ['horsjeu', 'rapide', 'appels'], physique: ['marquage', 'blocbas', 'surnombre']
};
function choisirCartesAdv() {
  const att = enAttaque(), cote = att ? 'att' : 'def';
  // combien de cartes : selon la division et la compétition
  const eur = S.comp === 'eur' || S.comp === 'defi', d = S.comp === 'ombre' ? 2 : C.div;
  let n = eur ? 2 : d === 1 ? (hasard() < 0.35 ? 2 : 1) : d === 2 ? 1 : (hasard() < 0.6 ? 1 : 0);
  if (S.type && S.type !== 'normal') n = Math.min(n, 1);
  if (S.tuto === 2) n = 1;
  const pool = Object.keys(CARTES_ADV).filter(k => CARTES_ADV[k].cote === cote && k !== 'star');
  const prefs = (PREF_STYLE[S.style] || []).filter(k => CARTES_ADV[k].cote === cote);
  const out = [];
  // s'adapte : tu rejoues le même combo, il sort la Lecture du jeu
  if (att && S.favori && S.favori.n >= 2 && n > 0 && hasard() < 0.7) out.push('lecture');
  // mené au score : il prend des risques (son numéro 10) ; devant : il ferme le jeu
  if (!att && n > 0 && !out.length && (S.score.ia < S.score.p || clubPar(S.opp).force >= 0.8) && !S.starAdvJouee && hasard() < 0.45) { out.push('star'); S.starAdvJouee = true; }
  while (out.length < n) { const src = hasard() < 0.65 && prefs.length ? prefs : pool; const k = pick(src); if (!out.includes(k)) out.push(k); }
  return out;
}
const advActif = k => S && S.adv && S.adv.includes(k) && !S.feinteActive;
function preparerTF() {
  if (S.tf >= NB_TF) return finMatch();
  S.actif = S.attente || effetsVides(); S.attente = effetsVides();
  const i = Math.floor(S.tf / 2), f = facteurAdversaire(S.opp), st = S.style;
  S.minute = Math.round(8 + S.tf * 14 + rnd(6));
  S.type = tirerTypeTF(S.tf);
  if (enAttaque()) {
    let m = (85 + i * 15 + rnd(17) - 8) * f;
    if (st === 'bloc') m *= 1.1; if (st === 'contre') m *= 0.9;
    if (S.type === 'cf') m *= 0.85;
    S.cible = Math.round(m); S.intention = null;
  } else {
    const pool = S.ombre && S.ombre.intentions ? [pickPoids(S.ombre.intentions)] : st === 'possession' ? ['tiki', 'unedeux', 'contre', 'unedeux', 'ct'] : st === 'aerien' ? ['ct', 'ct', 'debord', 'ct', 'contre'] : ['unedeux', 'contre', 'solo', 'ct', 'tiki', 'debord', 'percee'];
    S.intention = pick(pool);
    let m = (100 - i * 10 + rnd(17) - 8) * f;
    if (st === 'feu') m *= 1.1; if (st === 'bloc') m *= 0.9; if (st === 'contre') m *= 1.15;
    S.cible = Math.round(m);
  }
  if (S.actif.cible !== 1) S.cible = Math.round(S.cible * S.actif.cible);
  if (S.rougeAdv) S.cible = Math.round(S.cible * 0.85);
  S.adv = S.type === 'penalty' || S.tuto === 1 || S.comp === 'direct' ? [] : choisirCartesAdv();
  S.advAnnulee = null;
  if (aStar('anticipe') && S.adv.length) { const mi = S.tf < NB_TF / 2 ? 1 : 2; S.strat = S.strat || {}; if (!S.strat[mi]) { S.strat[mi] = true; S.advAnnulee = S.adv.shift(); } }
  S.adv.forEach(k => { if (CARTES_ADV[k].cible) S.cible = Math.round(S.cible * CARTES_ADV[k].cible); });
  fixerFourchette();
  S.sel = []; S.phase = 'choix'; S.res = null; S.modeChange = false;
  if (S.tf === NB_TF / 2) piocher();
  if (typeof afficherMatch === 'function' && !S.auto) afficherMatch();
}
function compteTypes(cartes) {
  const n = {};
  cartes.forEach(c => { const sp = c.sp && SPECIAUX[c.t].compte; if (sp) Object.entries(sp).forEach(([t, q]) => (n[t] = (n[t] || 0) + q)); else n[c.t] = (n[c.t] || 0) + 1; });
  return n;
}
// valeur d'une carte dans ce temps fort : météo, stars, cartes adverses, lecture...
function valeurEnMatch(c, att, n) {
    let v = c.val; const notes = [];
    const mm = METEOS[S.meteo].mod[c.t]; if (mm) { v += mm; notes.push((mm > 0 ? '+' : '') + mm + ' météo'); }
    if (att && S.type === 'corner' && (c.t === 'centre' || c.t === 'tete')) { v *= 2; notes.push('corner ×2'); }
    if (c.t === 'tete' && aStar('renard')) { v += 8; notes.push('Renard +8'); }
    if (c.t === 'frappe' && aStar('canonnier')) { v += 5; notes.push('Canonnier +5'); }
    if (c.t === 'course' && aStar('ailier') && (n.centre || 0) > 0) { v += 10; notes.push('Ailier +10'); }
    if (c.t === 'dribble' && aStar('magicien')) { v = Math.round(v * 1.5); notes.push('Magicien ×1,5'); }
    if (!att && aStar('libero') && C.effectif[c.ji] && C.effectif[c.ji].l === 'DEF' && c.t !== 'gardien') { v += 4; notes.push('Libéro +4'); }
    if (c.t === 'gardien' && (aStar('mur') || (c.sp && SPECIAUX.gardien.double))) { v *= 2; notes.push('×2'); }
    if (!att && ((LECTURE[c.t] && LECTURE[c.t].includes(S.intention)) || (c.sp && SPECIAUX[c.t].lectureTout))) { v *= 2; notes.push('lecture ×2'); }
    if ((S.diminues || []).includes(c.ji)) { v = Math.max(0, v - 3); notes.push('blessé −3'); }
    const kc = couleurCarte(c), kStar = { rouge: 'kRouge', bleu: 'kBleu', vert: 'kVert', jaune: 'kJaune' }[kc];
    if (kStar && aStar(kStar)) { v += 2; notes.push(`${STARS.find(x => x.id === kStar).nom} +2`); }
    if (advActif('horsjeu') && c.t === 'course') { v = 0; notes.push('hors-jeu'); }
    if (advActif('blocbas') && c.t === 'dribble') { v = Math.max(0, v - 4); notes.push('bloc bas −4'); }
    if (advActif('blocbas') && c.t === 'frappe') { v += 3; notes.push('bloc bas +3'); }
    if (advActif('appels') && c.t === 'marquage') { v = 0; notes.push('appels'); }
    if (advActif('lointaine') && c.t === 'gardien') { v *= 2; notes.push('frappe de loin ×2'); }
    return { c, v, notes };
}
function calcul(cartes) {
  const att = enAttaque();
  const valides = cartes.filter(c => TYPES[c.t].att === att);
  S.feinteActive = cartes.some(c => c.t === 'feinte');
  const n = compteTypes(valides);
  let combo;
  if (att) combo = COMBOS_ATT.find(k => Object.entries(k.req).every(([t, q]) => (n[t] || 0) >= q));
  else { const nDef = valides.filter(c => c.t !== 'gardien').length, g = valides.some(c => c.t === 'gardien'); combo = nDef >= 3 && g ? COMBOS_DEF[0] : valides.length >= 2 ? COMBOS_DEF[1] : COMBOS_DEF[2]; }
  const pts = valides.map(c => valeurEnMatch(c, att, n));
  if (att && S.type === 'cf') combo = { id: 'cf', nom: 'Coup franc', mult: 3 };
  const niv = C.niveaux[combo.id] || 1;
  let mult = combo.mult + 0.5 * (niv - 1); const bonusMult = [];
  if (advActif('marquage') && pts.length) { const best = pts.reduce((a, b) => (b.v > a.v ? b : a)); best.v = Math.floor(best.v / 2); best.notes.push('marquée ÷2'); }
  if (att && advActif('lecture') && S.favori && combo.id === S.favori.id && combo.mult > 1) { mult -= 1; bonusMult.push('Lecture du jeu −1'); }
  if (!att && advActif('surnombre') && valides.length) { mult = Math.max(1, mult - 0.5); bonusMult.push('Surnombre −0,5'); }
  if (S.feinteActive && S.adv && S.adv.length) bonusMult.push('Feinte : cartes adverses annulées');
  if (att && S.type === 'eclair') { mult += 1; bonusMult.push('Éclair +1'); }
  if (att && S.type === 'cf' && valides.some(c => c.t === 'frappe')) { mult += 1; bonusMult.push('Tireur +1'); }
  let plus = 5 * (niv - 1);
  if (niv > 1) bonusMult.push(`Fiche niv. ${niv} +${fmt(0.5 * (niv - 1))}`);
  // jeu collectif : les trois lignes dans la même action
  const lignes = new Set(valides.map(c => C.effectif[c.ji] && C.effectif[c.ji].l));
  if (valides.length >= 3 && lignes.has('DEF') && lignes.has('MIL') && lignes.has('ATT')) { mult += 1; bonusMult.push('Collectif +1'); }
  // couleurs : 3 ou 4 cartes du même joueur-couleur
  const parCouleur = {}; valides.forEach(c => { const k = couleurCarte(c); parCouleur[k] = (parCouleur[k] || 0) + 1; });
  const kMax = Object.entries(parCouleur).sort((a, b) => b[1] - a[1])[0];
  let couleur = null;
  if (kMax && kMax[1] >= 4) { mult += 2; couleur = { k: kMax[0], n: 4 }; bonusMult.push(`Carton plein ${COULEURS[kMax[0]].nom.toLowerCase()} +2`); }
  else if (kMax && kMax[1] >= 3) { mult += 1; couleur = { k: kMax[0], n: 3 }; bonusMult.push(`Trio ${COULEURS[kMax[0]].nom.toLowerCase()} +1`); }
  const consignes = cartes.filter(c => estConsigne(c.t));
  if (consignes.some(c => c.t === 'grinta') && valides.length && S.score.p <= S.score.ia) { mult += 1; bonusMult.push('Grinta +1'); }
  if (aStar('tacticien') && valides.length) { mult += 1; bonusMult.push('Tacticien +1'); }
  if (aStar('arc') && Object.keys(parCouleur).length >= 4) { mult += 2; bonusMult.push('Arc-en-ciel +2'); }
  if (aStar('finisseur') && valides.length && S.tf === NB_TF - 1) { mult += 2; bonusMult.push('Finisseur +2'); }
  if (att && aStar('meneur')) { const np = n.passe || 0; if (np) { mult += 0.5 * np; bonusMult.push(`Meneur +${fmt(0.5 * np)}`); } }
  if (aStar('capitaine') && S.score.p < S.score.ia) { mult *= 2; bonusMult.push('Capitaine ×2'); }
  if (consignes.some(c => c.t === 'genie') && pts.length) { const best = pts.reduce((a, b) => (b.v > a.v ? b : a)); best.v *= 2; best.notes.push('génie ×2'); }
  let somme = pts.reduce((s, p) => s + p.v, 0) + (valides.length ? plus : 0);
  let total = valides.length ? Math.round(somme * mult) : 0;
  if (aStar('supporters') && S.dom && valides.length) { total = Math.round(total * 1.1); bonusMult.push('Supporters +10 %'); }
  if (S.actif && S.actif.mult !== 1 && valides.length) { total = Math.round(total * S.actif.mult); bonusMult.push(`Contre-pied ×${fmt(S.actif.mult)}`); }
  const futur = consignes.map(c => c.t).filter(t => ['contrepied', 'pressing', 'appel', 'relance'].includes(t));
  return { pts, combo, niv, plus, mult, bonusMult, somme, total, valides, couleur, consignes, futur };
}
// Ce que la main permet : combinaisons et couleurs atteignables, avec les cartes à jouer
function possibilites() {
  const att = enAttaque(), max = maxJouees();
  const utiles = S.main.filter(c => TYPES[c.t].att === att).sort((a, b) => b.val - a.val);
  const out = [];
  const completer = sel => { for (const c of utiles) { if (sel.length >= max) break; if (!sel.includes(c)) sel.push(c); } return sel; };
  if (att && S.type !== 'cf') {
    COMBOS_ATT.filter(k => k.id !== 'simple').forEach(k => {
      const sel = [];
      const ok = Object.entries(k.req).every(([t, q]) => { const l = utiles.filter(c => c.t === t).slice(0, q); sel.push(...l); return l.length >= q; });
      if (ok && sel.length <= max) out.push({ type: 'combo', id: k.id, lib: `${k.nom} ×${fmt(k.mult + 0.5 * ((C.niveaux[k.id] || 1) - 1))}`, sel });
    });
  }
  if (!att) {
    const g = utiles.find(c => c.t === 'gardien'), autres = utiles.filter(c => c.t !== 'gardien');
    if (g && autres.length >= 3 && max >= 4) out.push({ type: 'combo', id: 'muraille', lib: `${COMBOS_DEF[0].nom} ×${fmt(COMBOS_DEF[0].mult)}`, sel: [g, ...autres.slice(0, 3)] });
  }
  // couleurs : Trio ou Carton plein
  const parK = {}; utiles.forEach(c => { const k = couleurCarte(c); (parK[k] = parK[k] || []).push(c); });
  Object.entries(parK).forEach(([k, l]) => {
    if (l.length >= 4 && max >= 4) out.push({ type: 'couleur', k, lib: `Carton plein ${COULEURS[k].nom.toLowerCase()} +2`, sel: l.slice(0, 4) });
    else if (l.length >= 3) out.push({ type: 'couleur', k, lib: `Trio ${COULEURS[k].nom.toLowerCase()} +1`, sel: completer(l.slice(0, 3)).slice(0, max) });
  });
  out.forEach(o => (o.total = calcul(o.sel).total));
  S.feinteActive = false;
  return out.sort((a, b) => b.total - a.total).slice(0, 4);
}
// Indice : une piste, jamais la solution. Sans sélection, on dit seulement combien de combinaisons
// la main cache. Avec une sélection, on signale la combinaison à une carte près, si cette carte est en main.
function indice() {
  if (!reglages().indices) return '';
  const att = enAttaque(), max = maxJouees(), sel = S.sel;
  const main = S.main.filter(c => TYPES[c.t].att === att && !sel.includes(c));
  if (!nbActions(sel)) {
    const n = possibilites().length;
    return n ? `Ta main cache ${n} combinaison${n > 1 ? 's' : ''}` : 'Pas de combinaison dans ta main : joue tes meilleures cartes';
  }
  if (nbActions(sel) >= max) return '';
  const r = calcul(sel), compte = {};
  sel.forEach(c => { const sp = c.sp && SPECIAUX[c.t].compte; Object.entries(sp || { [c.t]: 1 }).forEach(([t, q]) => (compte[t] = (compte[t] || 0) + q)); });
  if (att) {
    const proches = COMBOS_ATT.filter(k => k.mult > (r.combo ? r.combo.mult : 1) && k.id !== 'simple').map(k => {
      const manque = Object.entries(k.req).flatMap(([t, q]) => Array(Math.max(0, q - (compte[t] || 0))).fill(t));
      const deja = Object.keys(k.req).some(t => compte[t]);
      return { k, manque, deja };
    }).filter(o => o.deja && o.manque.length === 1 && nbActions(sel) + 1 <= max && main.some(c => c.t === o.manque[0]));
    if (proches.length) { const o = proches.sort((a, b) => b.k.mult - a.k.mult)[0], t = o.manque[0], fc = ['passe', 'frappe', 'course', 'tete'].includes(t), fk = ['contre', 'percee', 'unedeux'].includes(o.k.id); return `Encore ${fc ? 'une' : 'un'} ${TYPES[t].nom} et ça devient ${fk ? 'une' : 'un'} ${o.k.nom}`; }
  } else if (r.combo && r.combo.id !== 'muraille') {
    const g = r.valides.some(c => c.t === 'gardien'), nd = r.valides.filter(c => c.t !== 'gardien').length;
    const besoinD = Math.max(0, 3 - nd), besoinG = g ? 0 : 1, besoin = besoinD + besoinG;
    const dispoD = main.filter(c => c.t !== 'gardien').length, dispoG = main.some(c => c.t === 'gardien');
    if (r.valides.length >= 2 && besoin <= 2 && nbActions(sel) + besoin <= max && dispoD >= besoinD && (!besoinG || dispoG))
      return `${besoinG && besoinD ? 'Un Gardien et un défenseur de plus' : besoinG ? 'Un Gardien derrière' : besoinD === 2 ? 'Encore deux défenseurs' : 'Encore un défenseur'} : Muraille ×2`;
  }
  // jeu collectif : il manque une ligne (D, M ou A en bas de la carte)
  const lignes = new Set(r.valides.map(c => C.effectif[c.ji] && C.effectif[c.ji].l)), manqueL = ['DEF', 'MIL', 'ATT'].filter(l => !lignes.has(l));
  if (att && manqueL.length === 1 && r.valides.length >= 2 && nbActions(sel) < max && main.some(c => C.effectif[c.ji] && C.effectif[c.ji].l === manqueL[0] && TYPES[c.t].att)) return `Une carte jouée par ${{ DEF: 'un défenseur (D)', MIL: 'un milieu (M)', ATT: 'un attaquant (A)' }[manqueL[0]]} : Collectif +1`;
  const parK = {}; sel.forEach(c => { const k = couleurCarte(c); parK[k] = (parK[k] || 0) + 1; });
  const [k, n] = Object.entries(parK).sort((a, b) => b[1] - a[1])[0];
  if (n >= 2 && n < 4 && nbActions(sel) < max && main.some(c => couleurCarte(c) === k)) return `Encore une carte ${COULEURS[k].nom} pour ${n === 2 ? 'un Trio' : 'un Carton plein'}`;
  return '';
}
function valeurCoup(r) {
  const ratio = r.total / S.cible, seuil = enAttaque() ? seuilBut() : 1;
  let v = (ratio >= seuil ? 2000 : ratio >= 0.7 ? 900 + ratio * 400 : ratio * 800);
  const futur = { contrepied: 0.5, pressing: 0.25, appel: 0.2, relance: 0.15 };
  r.futur.forEach(t => (v += futur[t] * 900));
  return v;
}
function meilleurCoup(brut) {
  const att = enAttaque(), m = S.main.filter(c => TYPES[c.t].att === att || estConsigne(c.t)), n = m.length, max = maxJouees();
  let best = [], bt = -1, btot = 0;
  for (let mask = 1; mask < (1 << n); mask++) {
    const sel = m.filter((_, i) => mask & (1 << i));
    if (nbActions(sel) > max || sel.length - nbActions(sel) > 1) continue;
    const r = calcul(sel), v = brut ? r.total : valeurCoup(r);
    if (v > bt) { bt = v; best = sel; btot = r.total; }
  }
  return { sel: best, total: btot };
}
// mur approximatif (niveau Normal) : on annonce une fourchette, la vraie valeur est quelque part dedans
function fixerFourchette() {
  S.fourchette = null;
  if (S.tuto || S.comp === 'direct' || (reglages().difficulte === 'facile' && S.comp !== 'defi')) return;
  const w = Math.max(6, Math.round(S.cible * 0.2)), off = rnd(w + 1);
  S.fourchette = [S.cible - off, S.cible - off + w];
}
const refCible = () => (S.fourchette ? (S.fourchette[0] + S.fourchette[1]) / 2 : S.cible);
function seuilBut() { return aStar('buteur') ? 0.85 : 1; }
function issue(r) {
  const ratio = r.total / S.cible;
  if (enAttaque()) return ratio >= seuilBut() ? 'but' : ratio >= 0.7 ? 'occasion' : 'rate';
  return ratio >= 1 ? 'stoppe' : ratio >= 0.7 ? 'tirAdverse' : 'butAdverse';
}
function buteurDe(r) {
  const att = r.valides.filter(c => TYPES[c.t].att);
  const pref = att.find(c => c.t === 'frappe' || c.t === 'tete') || att.sort((a, b) => b.val - a.val)[0];
  return pref ? pref.ji : 10;
}
function finTempsFort(type, r, tir) {
  // mémorise le combo favori du joueur (l'adversaire s'adapte)
  if (r && r.combo && r.valides && r.valides.length && TYPES[r.valides[0].t].att && r.combo.mult > 1 && r.combo.id !== 'cf') {
    S.combos = S.combos || {}; S.combos[r.combo.id] = (S.combos[r.combo.id] || 0) + 1;
    const [id, n] = Object.entries(S.combos).sort((a, b) => b[1] - a[1])[0]; S.favori = { id, n };
  }
  // statistiques pour le défi et les objectifs
  if (r && r.couleur) { S.stats.trios++; if (r.couleur.n === 4) S.stats.cartons++; }
  const reussi = type === 'but' || type === 'stoppe' || (type === 'occasion' && tir && tir.marque) || (type === 'tirAdverse' && tir && !tir.marque);
  if (reussi && r && r.consignes && r.consignes.length) S.stats.consigneUtile = true;
  // met à jour le score selon l'issue
  let marque = '';
  if (type === 'but' || (type === 'occasion' && tir && tir.marque)) { S.score.p++; marque = 'p'; S.buteurs.push(buteurDe(r)); if (r && r.combo) S.stats.butsCombos.push(r.combo.id); if (S.tf < NB_TF / 2) S.stats.but1mt = true; }
  if (type === 'butAdverse' || (type === 'tirAdverse' && tir && tir.marque)) { S.score.ia++; marque = 'ia'; }
  if (type === 'stoppe' || (type === 'tirAdverse' && tir && !tir.marque)) S.stats.arrets++;
  return marque;
}
function retirerJouees(sel) { sel.forEach(c => { S.main = S.main.filter(x => x.id !== c.id); S.defausse.push(c); }); }

