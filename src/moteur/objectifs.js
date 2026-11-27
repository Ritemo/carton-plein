// =====================================================================
// OBJECTIFS : du président (saison) et défi du match
// =====================================================================
const OBJ_SAISON = {
  rang: { txt: o => `Finir dans les ${o.cible} premiers`, prime: 120 },
  buts: { txt: o => `Marquer ${o.cible} buts en championnat`, prime: 80 },
  jeune: { txt: () => 'Lancer un jeune du centre en pro', prime: 80 },
  coupe: { txt: () => `Atteindre la demi-finale de la ${nomCoupe('nat')}`, prime: 100 },
  derby: { txt: () => `Battre ${clubPar(C.rival) ? clubPar(C.rival).nom : 'le rival'} dans le derby`, prime: 60 },
  cartons: { txt: o => `Réussir ${o.cible} Cartons pleins`, prime: 90 },
  serie: { txt: o => `Rester invaincu ${o.cible} matchs d'affilée`, prime: 80 }
};
function nouveauxObjectifs() {
  const n = C.calendrier.length, Q = quotas(C.div), nb = Object.keys(C.classement).length;
  const cand = [
    { id: 'rang', cible: Math.min(nb - 2, C.div > 1 ? Q.up + 2 : 6) },
    { id: 'buts', cible: Math.round(n * 1.5) },
    { id: 'jeune', cible: 1 }, { id: 'coupe', cible: 1 },
    ...(C.rival ? [{ id: 'derby', cible: 1 }] : []),
    { id: 'cartons', cible: 2 }, { id: 'serie', cible: 5 }
  ];
  // toujours le classement, plus deux objectifs au hasard
  C.objectifs = [cand[0], ...melanger(cand.slice(1)).slice(0, 2)].map(o => ({ ...o, prog: 0, fait: false }));
  C.serie = 0;
}
function avancerObjectif(id, val, absolu) {
  const o = (C.objectifs || []).find(x => x.id === id && !x.fait); if (!o) return null;
  o.prog = absolu ? val : o.prog + val;
  if (o.prog >= o.cible) { o.fait = true; C.pieces += OBJ_SAISON[id].prime; return o; }
  return null;
}
const DEFIS = [
  { id: 'centretete', txt: 'Marque sur un Centre-Tête', ok: s => s.butsCombos.includes('ct') },
  { id: 'trio', txt: 'Réussis un Trio ou un Carton plein', ok: s => s.trios > 0 },
  { id: 'cleansheet', txt: 'Garde ta cage inviolée', ok: (s, S) => S.score.ia === 0 },
  { id: 'ecart', txt: 'Gagne avec 2 buts d’écart', ok: (s, S) => S.score.p - S.score.ia >= 2 },
  { id: 'mt1', txt: 'Marque en première mi-temps', ok: s => s.but1mt },
  { id: 'consigne', txt: 'Gagne un temps fort grâce à une consigne', ok: s => s.consigneUtile },
  { id: 'remontada', txt: 'Ne perds pas ce match', ok: (s, S) => S.score.p >= S.score.ia }
];
const PRIME_DEFI = 20;

// =====================================================================
// ÉVÉNEMENTS DE MATCH (entre deux temps forts)
// =====================================================================
function joueurSurLeTerrain() {
  const ids = [...new Set(S.main.concat(S.pioche).filter(c => !estConsigne(c.t) && c.t !== 'gardien').map(c => c.ji))].filter(ji => !(S.sortis || []).includes(ji));
  return ids.length ? pick(ids) : null;
}
function tirerEvenement() {
  if (S.auto || S.tuto || S.tf >= NB_TF || (S.evts || []).length >= 2 || hasard() > 0.11) return null;
  const derniers = S.histo[S.histo.length - 1];
  const inf = niveauInfra('infirmerie'), pool = ['rougeAdv', 'ferveur', 'orage'];
  if (inf === 0 || (inf === 1 && hasard() < 0.5)) pool.push('blessure'); // l'infirmerie évite les blessures
  if (S.tf >= 3) pool.push('rouge');
  if (derniers === 'p' || derniers === 'ia') pool.push('var', 'var');
  const id = pick(pool.filter(x => !(S.evts || []).includes(x)));
  if (!id) return null;
  const e = { id };
  if (id === 'blessure' || id === 'rouge') { e.ji = joueurSurLeTerrain(); if (e.ji == null) return null; e.nom = C.effectif[e.ji].nom; }
  if (id === 'var') e.annule = derniers;
  if (id === 'orage' && S.meteo === 'pluie') return null;
  S.evts.push(id);
  return e;
}
function sortirJoueur(ji) {
  S.sortis = (S.sortis || []).concat(ji);
  const garde = c => c.ji !== ji || estConsigne(c.t);
  S.main = S.main.filter(garde); S.pioche = S.pioche.filter(garde); S.defausse = S.defausse.filter(garde);
}
function appliquerEvenement(e, choix) {
  if (e.id === 'blessure') {
    if (choix === 'a') { sortirJoueur(e.ji); if (S.changements > 0) S.changements--; }
    else S.diminues = (S.diminues || []).concat(e.ji);
  }
  if (e.id === 'rouge') sortirJoueur(e.ji);
  if (e.id === 'rougeAdv') S.rougeAdv = true;
  if (e.id === 'ferveur') { S.attente.mult *= 1.3; S.attente.src.push('Ferveur ×1,3'); }
  if (e.id === 'orage') S.meteo = 'pluie';
  if (e.id === 'var') {
    if (e.annule === 'p') { S.score.p = Math.max(0, S.score.p - 1); S.buteurs.pop(); }
    else S.score.ia = Math.max(0, S.score.ia - 1);
    S.histo[S.histo.length - 1] = 'var';
  }
}
const TEXTE_EVT = {
  blessure: e => ({ titre: 'Blessure', ic: 'baisse', txt: `${e.nom} se tient la cuisse.`, a: 'Le remplacer (1 changement, ses cartes sortent)', b: 'Il serre les dents (ses cartes −3)' }),
  rouge: e => ({ titre: 'Carton rouge !', ic: 'feu', txt: `${e.nom} est expulsé. Ses cartes quittent le match.` }),
  rougeAdv: () => ({ titre: 'Rouge pour eux !', ic: 'feu', txt: `${S.eq.ia.nom} finit à 10 : leurs objectifs baissent de 15 % jusqu'à la fin.` }),
  ferveur: () => ({ titre: 'Le stade s’enflamme', ic: 'supporters', txt: 'Les supporters poussent : ton prochain temps fort ×1,3.' }),
  orage: () => ({ titre: 'L’orage éclate', ic: 'pluie', txt: 'Le terrain devient glissant : météo Pluie battante jusqu’à la fin.' }),
  var: e => ({ titre: 'VAR !', ic: 'journal', txt: e.annule === 'p' ? 'Hors-jeu de quelques centimètres : ton dernier but est annulé.' : 'Faute avant le but : leur dernier but est annulé !' })
};
