// =====================================================================
// HISTOIRE : entraîneur rival, conférences de presse, chapitres
// =====================================================================
const PRENOMS_COACH = ['Gérard', 'Lucien', 'Bernard', 'Raymond', 'Patrice', 'Didier', 'Hervé', 'Jean-Marc', 'Serge', 'Claude'];
const NOMS_COACH = ['Vasseur', 'Morin', 'Lambert', 'Garnier', 'Roussel', 'Leclerc', 'Fabre', 'Boyer', 'Chevalier', 'Perrot'];
function coachRival() {
  if (!C.rival) return null;
  if (!C.coachRival || C.coachRival.club !== C.rival) C.coachRival = { club: C.rival, nom: `${pick(PRENOMS_COACH)} ${pick(NOMS_COACH)}`, victoires: 0, defaites: 0 };
  return C.coachRival;
}
const PIQUES = [
  'Ils ont un joli paquet de cartes. Dommage qu’ils ne sachent pas s’en servir.',
  'Mon intendant a lavé nos maillots deux fois. On va briller.',
  'Leur coach ? Je ne le connais pas. Il est nouveau ?',
  'Ce derby, on le gagne les yeux fermés. Peut-être même en dormant.',
  'On a révisé leurs combos. Tous les deux.'
];
const REACTIONS = {
  gagne: ['fulmine devant les journalistes et accuse l’arbitre.', 'a quitté le stade sans un mot.', 'reconnaît du bout des lèvres : « Ils étaient meilleurs. Aujourd’hui. »'],
  perd: ['chambre en conférence : « Je l’avais dit. »', 'offre un café à son intendant pour fêter ça.', 'sourit : « On se reverra au match retour. Ah non, il n’y en a pas. »'],
  nul: ['estime que « le nul était logique ».', 'parle déjà de la revanche.']
};
// conférences de presse : une question, trois réponses aux effets différents
const PRESSE = [
  { q: 'On vous annonce parmi les favoris. Vous visez quoi cette saison ?', r: [
    { t: 'La première place, rien d’autre.', e: 'pari', d: 'Forme +6 au prochain match. Une défaite et le président retient 15 pièces.' },
    { t: 'Match après match.', e: 'pieces', n: 10, d: '+10 pièces : les sponsors aiment la sagesse.' },
    { t: 'Je fais confiance à mes jeunes.', e: 'xpJeunes', n: 4, d: '+4 expérience pour les 3 plus jeunes.' }] },
  { q: 'Votre rival dit que vous jouez « petit bras ». Une réaction ?', r: [
    { t: 'On répondra sur le terrain.', e: 'forme', n: 5, d: 'Forme +5 au prochain match.' },
    { t: 'Je ne commente pas.', e: 'pieces', n: 10, d: '+10 pièces.' },
    { t: '(Éclat de rire)', e: 'xp', n: 2, d: '+2 expérience pour tout le monde : le vestiaire a adoré.' }] },
  { q: 'Votre meilleur buteur intéresserait de grands clubs. Il reste ?', r: [
    { t: 'Il est intransférable.', e: 'xpButeur', n: 6, d: 'Ton meilleur buteur gagne 6 expérience.' },
    { t: 'Tout est possible à ce prix-là.', e: 'pieces', n: 25, d: '+25 pièces : un agent a laissé une enveloppe de jetons.' },
    { t: 'Demandez-lui !', e: 'forme', n: 3, d: 'Forme +3 au prochain match.' }] },
  { q: 'Le stade sera plein samedi. Un message aux supporters ?', r: [
    { t: 'Venez chanter, on a besoin de vous !', e: 'forme', n: 6, d: 'Forme +6 au prochain match.' },
    { t: 'Merci pour votre fidélité.', e: 'pieces', n: 15, d: '+15 pièces de buvette.' },
    { t: 'Les places sont encore à vendre.', e: 'pieces', n: 8, d: '+8 pièces.' }] },
  { q: 'Votre équipe joue beaucoup le même combo. Prévisible ?', r: [
    { t: 'On a d’autres cartes en main.', e: 'xp', n: 2, d: '+2 expérience pour tout le monde.' },
    { t: 'Si ça marche, pourquoi changer ?', e: 'forme', n: 4, d: 'Forme +4 au prochain match.' },
    { t: 'Secret professionnel.', e: 'pieces', n: 10, d: '+10 pièces.' }] }
];
const pressePrete = () => C && !S && C.journee > 0 && C.journee % 4 === 1 && C.presse !== `${C.saison}-${C.journee}` && !!prochainMatch();
function repondrePresse(qi, ri) {
  const R = PRESSE[qi].r[ri], j = C.effectif.map((x, i) => ({ x, i })).filter(o => !o.x.vendu);
  if (R.e === 'pieces') C.pieces += R.n;
  if (R.e === 'forme') C.forme = (C.forme || 0) + R.n;
  if (R.e === 'pari') { C.forme = (C.forme || 0) + 6; C.pari = true; }
  if (R.e === 'xp') j.forEach(o => (o.x.xp = (o.x.xp || 0) + R.n));
  if (R.e === 'xpJeunes') j.sort((a, b) => (a.x.age || 25) - (b.x.age || 25)).slice(0, 3).forEach(o => (o.x.xp = (o.x.xp || 0) + R.n));
  if (R.e === 'xpButeur') { const b = j.sort((a, b) => (b.x.buts || 0) - (a.x.buts || 0))[0]; if (b) b.x.xp = (b.x.xp || 0) + R.n; }
  C.presse = `${C.saison}-${C.journee}`; sauver();
  return R;
}
// chapitres : de petites scènes la première fois que ça arrive
const CHAPITRES = [
  { id: 'v1', ok: b => b.gp > b.gc, qui: 'dede', txt: c => `Première victoire avec ${c} ! J'ai gardé le ballon du match. Il ira dans la vitrine, à côté de mes vieilles chaussettes porte-bonheur.` },
  { id: 'derby', ok: b => b.derby && b.gp > b.gc, qui: 'president', txt: () => 'On a gagné le derby ! Ce soir, toute la ville chante. Demain, on paie la tournée... avec modération.' },
  { id: 'v10', ok: () => (C.victoires || 0) >= 10, qui: 'president', txt: c => `Dix victoires. On parle de ${c} dans les journaux du pays entier. Continue comme ça, coach.` },
  { id: 'trophee', ok: b => b.trophee, qui: 'president', txt: () => 'Un trophée ! Le premier d’une longue série, j’espère. On va devoir agrandir la vitrine.' },
  { id: 'm50', ok: () => (C.matchsCoach || 0) >= 50, qui: 'dede', txt: () => 'Cinquante matchs sur le banc. Les gamins du centre t’appellent « le chef ». Moi aussi, maintenant.' },
  { id: 'l1', ok: () => C.div === 1, qui: 'president', txt: c => `${c} en première division. Il y a quelques années, on jouait devant trois cents personnes. Merci, coach.` }
];
function chapitreDuMatch(b) {
  C.victoires = (C.victoires || 0) + (b.gp > b.gc ? 1 : 0); C.matchsCoach = (C.matchsCoach || 0) + 1;
  C.chapitres = C.chapitres || {};
  const ch = CHAPITRES.find(x => !C.chapitres[x.id] && x.ok(b));
  if (!ch) return null;
  C.chapitres[ch.id] = C.saison; sauver();
  return { qui: ch.qui, txt: ch.txt(clubPar(C.club).nom) };
}
