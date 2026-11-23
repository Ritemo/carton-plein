// =====================================================================
// CARTON PLEIN · données : styles, cartes, couleurs, combinaisons, stars
// =====================================================================
// ---------- Clubs (noms réels, écussons originaux, couleurs indicatives) ----------
const STYLES = {
  pressing: { nom: 'Pressing haut', txt: 'Ils jouent souvent Harcèlement et Marquage individuel' },
  possession: { nom: 'Possession', txt: 'Ils attaquent surtout à base de Passes' },
  bloc: { nom: 'Bloc compact', txt: 'Leur mur +10 %, leurs attaques −10 %' },
  feu: { nom: 'Ambiance bouillante', txt: 'Leurs attaques +10 %' },
  aerien: { nom: 'Jeu aérien', txt: 'Ils attaquent surtout en Centre-Tête' },
  contre: { nom: 'Contre-attaque', txt: 'Leurs attaques +15 %, leur mur −10 %' },
  physique: { nom: 'Impact physique', txt: 'Ils jouent souvent Marquage individuel et Bloc bas' }
};
const CLUBS = []; // rempli par monde/clubs.js
const nomDiv = (d, p) => PAYS[p || (C && C.pays) || 'fr'].divs[d];
let CLUB_MAP = null;
const clubPar = id => (CLUB_MAP || (CLUB_MAP = new Map(CLUBS.map(c => [c.id, c])))).get(id);

// ---------- Cartes ----------
const TYPES = {
  passe: { nom: 'Passe', base: 7, att: true },
  course: { nom: 'Course', base: 9, att: true },
  dribble: { nom: 'Dribble', base: 9, att: true },
  centre: { nom: 'Centre', base: 8, att: true },
  frappe: { nom: 'Frappe', base: 12, att: true },
  tete: { nom: 'Tête', base: 12, att: true },
  tacle: { nom: 'Tacle', base: 9, att: false },
  marquage: { nom: 'Marquage', base: 8, att: false },
  interception: { nom: 'Interception', base: 8, att: false },
  gardien: { nom: 'Gardien', base: 14, att: false },
  // Consignes : 0 point, jouables en attaque comme en défense, elles prennent une place dans l'action
  contrepied: { nom: 'Contre-pied', base: 0, att: null, consigne: true, txt: 'Ton prochain temps fort ×1,5' },
  pressing: { nom: 'Pressing haut', base: 0, att: null, consigne: true, txt: 'Prochain objectif adverse −20 %' },
  appel: { nom: 'Appel de balle', base: 0, att: null, consigne: true, txt: '+1 carte au prochain temps fort' },
  relance: { nom: 'Relance rapide', base: 0, att: null, consigne: true, txt: 'Pioche 2 cartes tout de suite' },
  genie: { nom: 'Coup de génie', base: 0, att: null, consigne: true, txt: 'Ta meilleure carte compte double' },
  grinta: { nom: 'Grinta', base: 0, att: null, consigne: true, txt: '+1 combo si tu n’es pas devant' },
  feinte: { nom: 'Feinte', base: 0, att: null, consigne: true, txt: 'Annule les cartes adverses de ce temps fort' }
};
const estConsigne = t => !!(TYPES[t] && TYPES[t].consigne);
const CONSIGNES = Object.keys(TYPES).filter(estConsigne);
// Couleurs des joueurs : 3 cartes de la même couleur dans une action = Trio, 4 = Carton plein
const COULEURS = {
  rouge: { nom: 'Puissance', hex: '#e8413c' },
  bleu: { nom: 'Technique', hex: '#2f7de1' },
  vert: { nom: 'Vitesse', hex: '#1fae5b' },
  jaune: { nom: 'Mental', hex: '#f2b400' }
};
const RARETES = {
  commune: { nom: 'Commune', bonus: 0, max: 3, prix: 15 },
  rare: { nom: 'Rare', bonus: 2, max: 4, prix: 25 },
  epique: { nom: 'Épique', bonus: 4, max: 5, prix: 40 },
  legendaire: { nom: 'Légendaire', bonus: 7, max: 5, prix: 60 }
};
const SPECIAUX = {
  passe: { nom: 'Passe laser', txt: 'Compte comme 2 Passes', compte: { passe: 2 } },
  frappe: { nom: 'Frappe enroulée', txt: 'Compte aussi comme un Centre', compte: { frappe: 1, centre: 1 } },
  dribble: { nom: 'Roulette', txt: 'Compte comme 2 Dribbles', compte: { dribble: 2 } },
  tete: { nom: 'Retournée', txt: 'Compte aussi comme une Frappe', compte: { tete: 1, frappe: 1 } },
  gardien: { nom: 'Arrêt miracle', txt: 'Compte toujours double', double: true },
  tacle: { nom: 'Tacle parfait', txt: 'Bonne lecture contre toutes les attaques', lectureTout: true },
  course: { nom: 'Fusée', txt: '+5 points', plus: 5 },
  centre: { nom: 'Centre millimétré', txt: '+5 points', plus: 5 },
  marquage: { nom: 'Ombre', txt: 'Bonne lecture contre toutes les attaques', lectureTout: true },
  interception: { nom: 'Radar', txt: 'Bonne lecture contre toutes les attaques', lectureTout: true }
};
// Effectif de départ : poste, ligne, cartes apportées
const GABARIT = [
  { p: 'Gardien', l: 'DEF', c: ['gardien', 'gardien'], k: 'jaune' },
  { p: 'Défenseur', l: 'DEF', c: ['tacle', 'marquage'], k: 'rouge' }, { p: 'Défenseur', l: 'DEF', c: ['tacle', 'interception', 'pressing'], k: 'rouge' },
  { p: 'Latéral', l: 'DEF', c: ['tacle', 'course'], k: 'vert' }, { p: 'Latéral', l: 'DEF', c: ['marquage', 'centre'], k: 'bleu' },
  { p: 'Milieu', l: 'MIL', c: ['passe', 'interception', 'passe'], k: 'jaune' }, { p: 'Milieu', l: 'MIL', c: ['passe', 'passe', 'contrepied'], k: 'bleu' }, { p: 'Meneur', l: 'MIL', c: ['passe', 'frappe', 'feinte'], k: 'bleu' },
  { p: 'Ailier', l: 'ATT', c: ['dribble', 'course', 'centre'], k: 'vert' }, { p: 'Ailier', l: 'ATT', c: ['dribble', 'course'], k: 'vert' }, { p: 'Buteur', l: 'ATT', c: ['frappe', 'tete'], k: 'rouge' }
];
const couleurCarte = c => (C.effectif[c.ji] && C.effectif[c.ji].k) || 'bleu';

// ---------- Combinaisons ----------
const COMBOS_ATT = [
  { id: 'tiki', nom: 'Tiki-taka', mult: 4, req: { passe: 4 }, txt: '4 Passes', ics: ['passe', 'passe', 'passe', 'passe'] },
  { id: 'ct', nom: 'Centre-Tête', mult: 3, req: { centre: 1, tete: 1 }, txt: 'Centre + Tête', ics: ['centre', 'tete'] },
  { id: 'solo', nom: 'Solo', mult: 2.5, req: { dribble: 2, frappe: 1 }, txt: '2 Dribbles + Frappe', ics: ['dribble', 'dribble', 'frappe'] },
  { id: 'contre', nom: 'Contre-attaque', mult: 2, req: { passe: 1, course: 1, frappe: 1 }, txt: 'Passe + Course + Frappe', ics: ['passe', 'course', 'frappe'] },
  { id: 'debord', nom: 'Débordement', mult: 2, req: { course: 1, centre: 1 }, txt: 'Course + Centre', ics: ['course', 'centre'] },
  { id: 'percee', nom: 'Percée', mult: 1.75, req: { dribble: 1, frappe: 1 }, txt: 'Dribble + Frappe', ics: ['dribble', 'frappe'] },
  { id: 'unedeux', nom: 'Une-deux', mult: 1.5, req: { passe: 2 }, txt: '2 Passes', ics: ['passe', 'passe'] },
  { id: 'simple', nom: 'Action simple', mult: 1, req: {}, txt: 'N’importe quelles cartes', ics: ['ballon'] }
];
const COMBOS_DEF = [
  { id: 'muraille', nom: 'Muraille', mult: 2, txt: '3 défenseurs + Gardien', ics: ['tacle', 'marquage', 'interception', 'gardien'] },
  { id: 'bloc', nom: 'Bloc', mult: 1.5, txt: '2 cartes de défense ou plus', ics: ['tacle', 'interception'] },
  { id: 'intervention', nom: 'Intervention', mult: 1, txt: '1 carte de défense', ics: ['tacle'] }
];
const LECTURE = { interception: ['tiki', 'unedeux', 'contre'], marquage: ['ct', 'debord'], tacle: ['solo', 'percee'] };
const tousCombos = () => COMBOS_ATT.concat(COMBOS_DEF);
const comboPar = id => tousCombos().find(k => k.id === id);

// ---------- Stars et staff ----------
const STARS = [
  { id: 'capitaine', nom: 'Le Capitaine', r: 'commune', txt: '×2 sur tes actions quand tu es mené' },
  { id: 'renard', nom: 'Le Renard', r: 'commune', txt: '+8 à chaque Tête' },
  { id: 'canonnier', nom: 'Le Canonnier', r: 'commune', txt: '+5 à chaque Frappe' },
  { id: 'mur', nom: 'Le Mur', r: 'commune', txt: 'Ton Gardien compte double' },
  { id: 'meneur', nom: 'Le Meneur', r: 'commune', txt: '+0,5 au multiplicateur par Passe jouée' },
  { id: 'prepa', nom: 'Le Préparateur', r: 'commune', txt: '+1 changement de cartes par match' },
  { id: 'supersub', nom: 'Le Supersub', r: 'commune', txt: '2e mi-temps : 1 carte de plus en main' },
  { id: 'chef', nom: 'Le Chef d’orchestre', r: 'rare', txt: 'Tu peux jouer 5 cartes au lieu de 4' },
  { id: 'ailier', nom: 'L’Ailier de feu', r: 'rare', txt: '+10 à chaque Course si l’action contient un Centre' },
  { id: 'libero', nom: 'Le Libéro', r: 'rare', txt: '+4 aux cartes de défense des défenseurs' },
  { id: 'supporters', nom: 'Les Supporters', r: 'rare', txt: '+10 % sur toutes tes actions à domicile' },
  { id: 'magicien', nom: 'Le Magicien', r: 'epique', txt: 'Tes Dribbles valent ×1,5' },
  { id: 'tacticien', nom: 'Le Tacticien', r: 'epique', txt: '+1 au multiplicateur de toutes tes combinaisons' },
  { id: 'buteur', nom: 'Le Buteur né', r: 'epique', txt: 'But direct dès 85 % du mur' },
  { id: 'kRouge', nom: 'La Force de la nature', r: 'commune', txt: '+2 à chaque carte Puissance (rouge)' },
  { id: 'kBleu', nom: 'Le Professeur', r: 'commune', txt: '+2 à chaque carte Technique (bleue)' },
  { id: 'kVert', nom: 'La Fusée', r: 'commune', txt: '+2 à chaque carte Vitesse (verte)' },
  { id: 'kJaune', nom: 'Le Roc', r: 'commune', txt: '+2 à chaque carte Mental (jaune)' },
  { id: 'arc', nom: 'L’Arc-en-ciel', r: 'rare', txt: '+2 au combo si l’action réunit les 4 couleurs' },
  { id: 'lucarne', nom: 'Le Spécialiste', r: 'rare', txt: 'Zone de frappe parfaite bien plus large aux tirs' },
  { id: 'anticipe', nom: 'Le Stratège', r: 'rare', txt: 'Annule la 1re carte adverse de chaque mi-temps' },
  { id: 'finisseur', nom: 'Le Finisseur', r: 'epique', txt: '+2 au combo sur le dernier temps fort du match' }
];
const IC_STAR = { capitaine: 'capitaine', renard: 'renard', canonnier: 'canonnier', mur: 'mur', meneur: 'meneur', prepa: 'prepa', supersub: 'supersub', chef: 'chef', ailier: 'feu', libero: 'bouclier', supporters: 'supporters', magicien: 'magicien', tacticien: 'tactique', buteur: 'eclair', kRouge: 'biceps', kBleu: 'diplome', kVert: 'fusee', kJaune: 'medaille', arc: 'gemme', lucarne: 'ballon', anticipe: 'ampoule', finisseur: 'trophee' };
const PRIX_STAR = { commune: 60, rare: 100, epique: 160 };
const MAX_STARS = 5;

// ---------- Utilitaires ----------
// Hasard à graine : un match peut être rejoué à l'identique (utile pour le futur mode 2 joueurs)
let GRAINE = (Date.now() ^ 0x5bd1e995) >>> 0;
function hasard() { GRAINE = (GRAINE + 0x6D2B79F5) >>> 0; let t = GRAINE; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const fixerGraine = g => { GRAINE = g >>> 0; };
const rnd = n => Math.floor(hasard() * n);
const pick = a => a[rnd(a.length)];
function melanger(a) { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function tirageRarete(div) {
  const t = { 3: [70, 25, 5, 0], 2: [50, 34, 13, 3], 1: [36, 36, 22, 6] }[div] || [70, 25, 5, 0], x = rnd(100);
  return x < t[0] ? 'commune' : x < t[0] + t[1] ? 'rare' : x < t[0] + t[1] + t[2] ? 'epique' : 'legendaire';
}
const fmt = n => String(Math.round(n * 100) / 100).replace('.', ',');

