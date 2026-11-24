// =====================================================================
// TIRS : règles des occasions, penalties et plongeons (sans affichage)
// =====================================================================
// Jauge de frappe : vert = avantage au tireur, orange = avantage au gardien, rouge = raté.
// Le gardien adverse choisit un côté au hasard.
function issueFrappe(zone, qualite, gkChoix) {
  const gk = gkChoix || pick(['G', 'C', 'D']), devine = zone[1] === gk, lucarne = zone === 'HG' || zone === 'HD';
  const marque = qualite === 'vert' ? (!devine || hasard() < (lucarne ? 0.5 : 0.3)) : qualite === 'jaune' ? (!devine && hasard() < 0.7) : false;
  return { gk, devine, marque, horsCadre: qualite === 'rouge' };
}
// Le tireur adverse suit sa tendance une fois sur deux.
// Plongeon : vert = arrêt assuré du bon côté, orange = une chance sur deux, rouge = plongeon raté.
function issuePlongeon(qualite, couverts, tendance) {
  const colTir = hasard() < 0.5 ? tendance : pick(['G', 'C', 'D'].filter(c => c !== tendance));
  const zone = (hasard() < 0.5 ? 'H' : 'B') + colTir, bonCote = couverts.includes(colTir);
  const arret = bonCote && (qualite === 'vert' || (qualite === 'jaune' && hasard() < 0.5));
  return { zone, colTir, bonCote, arret };
}
// Qualité selon la position du curseur (0 à 1) et la largeur des zones vertes et orange (en %)
function qualiteJauge(pos, vert, orange) { const p = Math.abs(pos - 0.5) * 100; return p <= vert / 2 ? 'vert' : p <= orange / 2 ? 'jaune' : 'rouge'; }
