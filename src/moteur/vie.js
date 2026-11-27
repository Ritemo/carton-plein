// =====================================================================
// JOUEURS VIVANTS : expérience, progression, cadres, âge et retraites
// =====================================================================
// Un joueur gagne de l'expérience en jouant ses cartes (+1 par carte, +3 par but).
// Assez d'expérience : sa note monte (donc toutes ses cartes). 20 matchs joués : cadre du club (+1).
// Chaque été il prend un an ; vers 33 ans il raccroche et un jeune formé au club reprend ses cartes.
const NOTE_MAX = 7, CADRE_MATCHS = 20;
const seuilXP = note => 12 + 6 * Math.max(0, note);
const estCadre = j => (j.jm || 0) >= CADRE_MATCHS;
function initJoueur(j, i) {
  if (j.age == null) j.age = 19 + (hacher((j.nom || '') + i) % 13);
  if (j.xp == null) j.xp = 0;
  if (j.jm == null) j.jm = 0;
  return j;
}
// cartes jouées pendant ce match, par joueur (rempli à chaque temps fort)
function noterJoueurs(r) { if (!S || S.tuto) return; S.xpMatch = S.xpMatch || {}; r.valides.forEach(c => (S.xpMatch[c.ji] = (S.xpMatch[c.ji] || 0) + 1)); }
// fin de match (carrière) : expérience, montées de note, nouveaux cadres
function progresserJoueurs() {
  const gains = Object.assign({}, S.xpMatch || {}), progres = [];
  (S.buteurs || []).forEach(ji => (gains[ji] = (gains[ji] || 0) + 3));
  const bonus = 1 + 0.25 * niveauInfra('entrainement');
  Object.entries(gains).forEach(([ji, n]) => {
    const j = C.effectif[ji]; if (!j || j.vendu) return;
    initJoueur(j, ji);
    const cadreAvant = estCadre(j);
    j.jm++; j.xp += Math.round(n * bonus);
    while (j.note < NOTE_MAX && j.xp >= seuilXP(j.note)) { j.xp -= seuilXP(j.note); j.note++; progres.push({ nom: j.nom, txt: `passe à +${j.note}` }); }
    if (!cadreAvant && estCadre(j)) progres.push({ nom: j.nom, txt: 'devient un cadre du club (+1)' });
  });
  return progres;
}
// été : un an de plus, et les anciens raccrochent
function vieillir() {
  const retraites = [];
  C.effectif.forEach((j, i) => {
    if (j.vendu) return;
    initJoueur(j, i); j.age++;
    const part = j.age >= 35 || (j.age >= 33 && hasard() < 0.5);
    if (!part) return;
    const nv = nomJoueur(), ancien = j.nom;
    Object.assign(j, { nom: nv, note: Math.max(1, j.note - 2), age: 18 + rnd(3), xp: 0, jm: 0, buts: 0, matchs: 0, formé: true, recrue: false });
    retraites.push({ ancien, nouveau: nv, p: j.p });
  });
  return retraites;
}
