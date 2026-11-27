// =====================================================================
// LE CLUB GRANDIT : installations à acheter
// =====================================================================
// Elles appartiennent au club : en signant ailleurs, on repart des installations du nouveau club.
const INFRAS = {
  tribunes: { nom: 'Tribunes', ic: 'stade', niveaux: [150, 300, 500], effet: n => `+${[0, 5, 10, 15][n]} pièces par match à domicile`, txt: 'Plus de supporters, plus de recettes.' },
  boutique: { nom: 'Boutique du club', ic: 'maillot', niveaux: [100, 200, 350], effet: n => `+${[0, 3, 6, 10][n]} pièces après chaque match`, txt: 'Maillots et écharpes aux couleurs du club.' },
  pelouse: { nom: 'Pelouse et éclairage', ic: 'soleil', niveaux: [200, 400], effet: n => `+${n} point${n > 1 ? 's' : ''} sur chaque carte à domicile`, txt: 'Un billard sous les projecteurs : on joue mieux chez soi.' },
  entrainement: { nom: 'Centre d’entraînement', ic: 'sablier', niveaux: [120, 250, 450], effet: n => `entraînements et expérience +${25 * n} %`, txt: 'Les joueurs progressent plus vite.' },
  infirmerie: { nom: 'Infirmerie', ic: 'bouclier', niveaux: [150, 300], effet: n => n >= 2 ? 'plus de blessure en match' : 'deux fois moins de blessures', txt: 'Kiné, cryo, bons soins.' }
};
const infraClub = () => { C.infras = C.infras || {}; return (C.infras[C.club] = C.infras[C.club] || {}); };
const niveauInfra = k => (typeof C !== 'undefined' && C ? infraClub()[k] || 0 : 0);
const prixInfra = k => INFRAS[k].niveaux[niveauInfra(k)];
function acheterInfra(k) {
  const p = prixInfra(k); if (p == null || C.pieces < p) return false;
  C.pieces -= p; infraClub()[k] = niveauInfra(k) + 1; sauver(); return true;
}
// recettes après un match de carrière
const recettesMatch = dom => (dom ? [0, 5, 10, 15][niveauInfra('tribunes')] : 0) + [0, 3, 6, 10][niveauInfra('boutique')];
