// =====================================================================
// CARNET DE JEU : comment le joueur joue (pour analyser l'équilibre)
// =====================================================================
// Léger : des compteurs cumulés et un résumé des 40 derniers matchs, rangés dans la sauvegarde.
const carnetVide = () => ({ matchs: 0, tf: 0, efficacite: 0, combos: {}, trios: 0, cartons: 0, consignes: {}, cartesJouees: 0,
  tirs: { vert: 0, orange: 0, rouge: 0, buts: 0 }, plongeons: { vert: 0, orange: 0, rouge: 0, bonCote: 0, arrets: 0 }, issues: {}, derniers: [] });
// au moment où le joueur valide ses cartes, avant qu'elles quittent la main
function noterChoix(r) {
  if (!S || S.tuto) return;
  let eff = 1; try { const best = meilleurCoup(true).total; if (best > 0) eff = Math.min(1, r.total / best); } catch (e) { }
  S.carnet = S.carnet || { tf: [], tirs: [], plongeons: [] };
  S.carnet.tf.push({ att: enAttaque(), type: S.type || '', combo: r.combo ? r.combo.id : '', coul: r.couleur ? r.couleur.n : 0, cons: (r.consignes || []).map(c => c.t), n: S.sel.length, total: r.total, eff: Math.round(eff * 100) / 100 });
}
function noterTir(moi, qualite, o) {
  if (!S || S.tuto) return; S.carnet = S.carnet || { tf: [], tirs: [], plongeons: [] };
  (moi ? S.carnet.tirs : S.carnet.plongeons).push(Object.assign({ q: qualite }, o));
}
// en fin de match : on verse le résumé dans la carrière
function verserCarnet(gp, gc) {
  if (!C || !S || S.tuto) return; const K = C.carnet = C.carnet || carnetVide(), m = S.carnet || { tf: [], tirs: [], plongeons: [] };
  K.matchs++;
  m.tf.forEach(t => {
    K.efficacite = (K.efficacite * K.tf + t.eff) / (K.tf + 1); K.tf++; K.cartesJouees += t.n;
    if (t.combo) K.combos[t.combo] = (K.combos[t.combo] || 0) + 1;
    if (t.coul === 3) K.trios++; if (t.coul === 4) K.cartons++;
    t.cons.forEach(c => (K.consignes[c] = (K.consignes[c] || 0) + 1));
  });
  m.tirs.forEach(t => { K.tirs[t.q]++; if (t.marque) K.tirs.buts++; });
  m.plongeons.forEach(t => { K.plongeons[t.q]++; if (t.bonCote) K.plongeons.bonCote++; if (t.arret) K.plongeons.arrets++; });
  const eff = m.tf.length ? m.tf.reduce((a, t) => a + t.eff, 0) / m.tf.length : 1;
  K.derniers.unshift({ s: C.saison, j: C.journee, div: C.div, comp: S.comp || 'ligue', opp: S.opp, score: `${gp}-${gc}`, mur: Math.round(facteurAdversaire(S.opp) * 100) / 100,
    eff: Math.round(eff * 100) / 100, tf: m.tf.map(t => `${t.att ? 'A' : 'D'}:${t.combo || '-'}${t.coul ? '+c' + t.coul : ''}${t.cons.length ? '+' + t.cons.join('/') : ''}=${t.total}(${Math.round(t.eff * 100)}%)`).join(' '),
    tirs: m.tirs.map(t => t.q[0] + (t.marque ? '!' : '')).join(''), gb: m.plongeons.map(t => t.q[0] + (t.bonCote ? '' : 'x') + (t.arret ? '!' : '')).join('') });
  if (K.derniers.length > 40) K.derniers.length = 40;
}
