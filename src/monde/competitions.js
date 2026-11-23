// =====================================================================
// CARTON PLEIN : les cinq championnats
// =====================================================================
const PAYS = {
  fr: { nom: 'France', de: 'de France', divs: { 1: 'Ligue 1', 2: 'Ligue 2', 3: 'Ligue 3' }, ech: [2, 2], coupe: 'Coupe de France', drapeau: ['v', '#1d3c8f', '#ffffff', '#e2001a'],
    prenoms: ['Lucas', 'Hugo', 'Théo', 'Enzo', 'Nathan', 'Mathis', 'Noah', 'Yanis', 'Rayan', 'Adam', 'Léo', 'Jules', 'Malo', 'Sacha', 'Ilyes', 'Romain', 'Axel', 'Moussa', 'Kevin', 'Tom', 'Bilal', 'Kylian', 'Hamza', 'Evan', 'Gabin', 'Nolan'],
    noms: ['Moreau', 'Diallo', 'Lefèvre', 'Garnier', 'Traoré', 'Faure', 'Mercier', 'Bonnet', 'Girard', 'Lambert', 'Fontaine', 'Rousseau', 'Vincent', 'Blanc', 'Guérin', 'Camara', 'Roux', 'Perrin', 'Morel', 'Fournier', 'Barbier', 'Martinez', 'Sylla', 'Benali', 'Koné', 'Laurent', 'Mbemba', 'Lemoine', 'Picard', 'Renaud', 'Cissé', 'Dumont'] },
  en: { nom: 'Angleterre', de: 'd’Angleterre', divs: { 1: 'Premier League', 2: 'Championship', 3: 'League One' }, ech: [3, 3], coupe: 'FA Cup', drapeau: ['croix', '#ffffff', '#cf142b'],
    prenoms: ['Jack', 'Harry', 'Oliver', 'George', 'Charlie', 'Jacob', 'Alfie', 'Freddie', 'Kai', 'Callum', 'Mason', 'Reece', 'Declan', 'Jordan', 'Luke', 'Ryan', 'Tyler', 'Ethan', 'Kieran', 'Ben'],
    noms: ['Smith', 'Jones', 'Taylor', 'Brown', 'Walker', 'Wright', 'Robinson', 'Thompson', 'Hughes', 'Clarke', 'Turner', 'Hill', 'Cooper', 'Ward', 'Morris', 'Baker', 'Barnes', 'Kelly', 'Price', 'Hall', 'Okafor', 'Mensah'] },
  es: { nom: 'Espagne', de: 'd’Espagne', divs: { 1: 'LaLiga', 2: 'Segunda', 3: 'Primera RFEF' }, ech: [3, 4], coupe: 'Copa del Rey', drapeau: ['h', '#c60b1e', '#ffc400', '#c60b1e'],
    prenoms: ['Pablo', 'Álvaro', 'Sergio', 'Javi', 'Dani', 'Iker', 'Hugo', 'Marco', 'Rodrigo', 'Adrián', 'Raúl', 'Mario', 'Óscar', 'Unai', 'Pedro', 'Iván', 'Carlos', 'Diego'],
    noms: ['García', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Ruiz', 'Navarro', 'Torres', 'Romero', 'Moreno', 'Iglesias', 'Herrera', 'Vidal', 'Ortega', 'Castro', 'Medina'] },
  it: { nom: 'Italie', de: 'd’Italie', divs: { 1: 'Serie A', 2: 'Serie B', 3: 'Serie C' }, ech: [3, 4], coupe: 'Coppa Italia', drapeau: ['v', '#009246', '#ffffff', '#ce2b37'],
    prenoms: ['Luca', 'Marco', 'Matteo', 'Lorenzo', 'Andrea', 'Federico', 'Davide', 'Simone', 'Gianluca', 'Alessandro', 'Riccardo', 'Nicolò', 'Tommaso', 'Pietro', 'Stefano', 'Fabio'],
    noms: ['Rossi', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Costa', 'Esposito', 'Ferrari', 'Moretti', 'Barbieri', 'Lombardi', 'Rinaldi'] },
  de: { nom: 'Allemagne', de: 'd’Allemagne', divs: { 1: 'Bundesliga', 2: '2. Bundesliga', 3: '3. Liga' }, ech: [2, 2], coupe: 'DFB-Pokal', drapeau: ['h', '#000000', '#dd0000', '#ffce00'],
    prenoms: ['Lukas', 'Leon', 'Jonas', 'Felix', 'Niklas', 'Tim', 'Jan', 'Moritz', 'Paul', 'Florian', 'Julian', 'Max', 'Kai', 'Timo', 'Marco', 'Mats', 'Kevin', 'Tobias'],
    noms: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Koch', 'Richter', 'Wolf', 'Krüger', 'Neumann', 'Braun', 'Zimmermann', 'Hartmann', 'Yilmaz', 'Schulz'] }
};
// =====================================================================
// COUPES : coupe nationale (tout le monde) et coupes d'Europe (qualifiés)
// =====================================================================
const TOURS = ['Quart de finale', 'Demi-finale', 'Finale'];
const COUPES = {
  nat: { slots: [0.15, 0.45, 0.75], ic: 'trophee', diff: [1, 1.08, 1.16], gain: 20, prime: 80 },
  c1: { nom: 'Coupe des Champions', slots: [0.25, 0.55, 0.85], ic: 'globe', diff: [3.0, 3.3, 3.6], gain: 35, prime: 160 },
  c3: { nom: 'Coupe d’Europe', slots: [0.25, 0.55, 0.85], ic: 'globe', diff: [2.75, 2.95, 3.15], gain: 30, prime: 120 }
};
const slotCoupe = (k, t) => Math.max(1, Math.round(COUPES[k].slots[t] * C.calendrier.length));
const nomCoupe = k => (k === 'nat' ? PAYS[C.pays].coupe : COUPES[k].nom);
function tirerAdversairesCoupe(k) {
  if (k === 'nat') {
    const tous = CLUBS.filter(c => c.pays === C.pays && c.id !== C.club);
    const t0 = pick(tous.filter(c => C.divisions[c.id] && C.divisions[c.id] >= Math.min(C.div, 2)));
    const t1 = pick(tous.filter(c => C.divisions[c.id] && C.divisions[c.id] <= 2 && c.id !== t0.id));
    const t2 = pick(tous.filter(c => C.divisions[c.id] === 1 && c.id !== t0.id && c.id !== t1.id).sort((a, b) => b.force - a.force).slice(0, 5));
    return [t0.id, t1.id, t2.id];
  }
  const pool = CLUBS.filter(c => c.pays !== C.pays && c.div === 1).sort((a, b) => b.force - a.force);
  const zone = k === 'c1' ? pool.slice(0, 14) : pool.slice(8, 30);
  const tir = melanger(zone.slice()).slice(0, 3).sort((a, b) => a.force - b.force);
  return tir.map(c => c.id);
}
function initCoupes() {
  C.coupes = { nat: { k: 'nat', tour: 0, elim: false, gagne: false, adv: tirerAdversairesCoupe('nat') } };
  if (C.qualifEurope && C.div === 1) C.coupes.eur = { k: C.qualifEurope, tour: 0, elim: false, gagne: false, adv: tirerAdversairesCoupe(C.qualifEurope) };
  C.qualifEurope = null;
}
// Prochain match : coupe si un tour est prévu à cette journée, sinon championnat
function prochainMatch() {
  for (const cle of ['nat', 'eur']) {
    const cp = C.coupes && C.coupes[cle];
    if (!cp || cp.elim || cp.gagne || cp.tour >= 3) continue;
    if (C.journee >= slotCoupe(cp.k, cp.tour)) return { comp: cle, k: cp.k, opp: cp.adv[cp.tour], dom: cp.tour % 2 === 0, tour: TOURS[cp.tour], nom: nomCoupe(cp.k) };
  }
  if (C.journee >= C.calendrier.length) return null;
  return { comp: 'ligue', opp: C.calendrier[C.journee], dom: C.domicile[C.journee] !== false, nom: nomDiv(C.div) };
}

// =====================================================================
// CENTRE DE FORMATION
// =====================================================================
const POSTES_JEUNES = [
  { p: 'Gardien', l: 'DEF', c: ['gardien', 'gardien'] }, { p: 'Défenseur', l: 'DEF', c: ['tacle', 'marquage'] }, { p: 'Latéral', l: 'DEF', c: ['course', 'centre'] },
  { p: 'Milieu', l: 'MIL', c: ['passe', 'interception'] }, { p: 'Meneur', l: 'MIL', c: ['passe', 'passe'] }, { p: 'Ailier', l: 'ATT', c: ['dribble', 'centre'] },
  { p: 'Buteur', l: 'ATT', c: ['frappe', 'tete'] }, { p: 'Dribbleur', l: 'ATT', c: ['dribble', 'frappe'] }
];
const CENTRE = { 1: { places: 3, vit: 12, prix: 120 }, 2: { places: 4, vit: 16, prix: 220 }, 3: { places: 5, vit: 20, prix: 350 }, 4: { places: 6, vit: 25, prix: null } };
const RAR_POT = { 1: 'commune', 2: 'commune', 3: 'rare', 4: 'epique', 5: 'legendaire' };
function nomJoueur() {
  const P = PAYS[C.pays] || PAYS.fr, pris = new Set(C.effectif.map(j => j.nom).concat((C.formation ? C.formation.jeunes : []).map(j => j.nom)));
  const noms = new Set([...pris].map(x => x.slice(3)));
  let n, k = 0; do { n = pick(P.prenoms).charAt(0) + '. ' + pick(P.noms); k++; } while ((pris.has(n) || (k < 30 && noms.has(n.slice(3)))) && k < 60);
  return n;
}
function nouveauJeune(potMin) {
  const niv = C.formation.niveau, x = rnd(100);
  // le niveau du centre améliore les chances d'un gros potentiel
  let pot = x < 40 - niv * 6 ? 1 : x < 72 - niv * 6 ? 2 : x < 90 - niv * 4 ? 3 : x < 98 - niv * 2 ? 4 : 5;
  if (potMin) pot = Math.max(pot, potMin);
  const g = pick(POSTES_JEUNES);
  return { id: C.nid++, nom: nomJoueur(), p: g.p, l: g.l, c: g.c, k: pick(Object.keys(COULEURS)), pot, prog: 0, age: 16 + rnd(2) };
}
function initFormation() {
  C.formation = { niveau: 1, jeunes: [], recrues: 0 };
  C.formation.jeunes.push(nouveauJeune(2), nouveauJeune());
}
function arriveeJeunes() { // début de saison : deux jeunes se présentent s'il y a de la place
  const F = C.formation, pl = CENTRE[F.niveau].places, nv = [];
  for (let i = 0; i < 2 && F.jeunes.length < pl; i++) { const j = nouveauJeune(); F.jeunes.push(j); nv.push(j); }
  F.jeunes.forEach(j => (j.age = (j.age || 16) + 1));
  return nv;
}
function progresserJeunes(bonus) {
  const F = C.formation, v = CENTRE[F.niveau].vit;
  const k = 10 / Math.max(9, C.calendrier.length);
  F.jeunes.forEach(j => { j.prog = Math.min(100, j.prog + Math.round(v * k * (0.8 + j.pot * 0.08) * (bonus || 1))); });
}
const prixVente = j => 25 + j.pot * j.pot * 12;
function promouvoir(id) {
  const F = C.formation, j = F.jeunes.find(x => x.id === id); if (!j || j.prog < 100) return null;
  const ji = C.effectif.length;
  C.effectif.push({ nom: j.nom, p: j.p, l: j.l, k: j.k || pick(Object.keys(COULEURS)), note: Math.max(0, j.pot - 2), buts: 0, matchs: 0, formé: true });
  const r = RAR_POT[j.pot], cartes = j.c.map(t => nouvelleCarte(t, ji, r));
  cartes.forEach(c => C.cartes.push(c));
  F.jeunes = F.jeunes.filter(x => x.id !== id); F.recrues++;
  avancerObjectif('jeune', 1);
  sauver();
  return cartes;
}
function vendreJeune(id) {
  const F = C.formation, j = F.jeunes.find(x => x.id === id); if (!j) return 0;
  const p = j.prog >= 100 ? prixVente(j) : Math.round(prixVente(j) * 0.4);
  C.pieces += p; F.jeunes = F.jeunes.filter(x => x.id !== id); sauver();
  return p;
}
function seanceJeune(id) {
  const j = C.formation.jeunes.find(x => x.id === id); if (!j || C.pieces < 30 || j.prog >= 100) return false;
  C.pieces -= 30; j.prog = Math.min(100, j.prog + 30); sauver(); return true;
}
function agrandirCentre() {
  const F = C.formation, p = CENTRE[F.niveau].prix; if (!p || C.pieces < p) return false;
  C.pieces -= p; F.niveau++; sauver(); return true;
}

// =====================================================================
// SÉANCE DE TIRS AU BUT (coupes)
// =====================================================================
function nouvelleSeance() { return { tirs: [], p: 0, ia: 0, n: 0, fini: false, gagne: null }; }
function tirSeance(T, moiTire, cote) {
  const autre = pick(['G', 'C', 'D']), marque = moiTire ? cote !== autre : autre !== cote;
  T.tirs.push({ moi: moiTire, cote, autre, marque });
  if (marque) moiTire ? T.p++ : T.ia++;
  // une série = 1 tir de chaque côté ; 5 séries puis mort subite
  const nMoi = T.tirs.filter(t => t.moi).length, nIa = T.tirs.filter(t => !t.moi).length;
  const restMoi = Math.max(0, 5 - nMoi), restIa = Math.max(0, 5 - nIa);
  if (nMoi <= 5 && nIa <= 5) { if (T.p + restMoi < T.ia || T.ia + restIa < T.p) T.fini = true; }
  if (!T.fini && nMoi >= 5 && nMoi === nIa && T.p !== T.ia) T.fini = true;
  if (T.fini) T.gagne = T.p > T.ia;
  return T.tirs[T.tirs.length - 1];
}

// =====================================================================
// MERCATO : fenêtres d'été (début de saison) et d'hiver (mi-saison)
// =====================================================================
const PRIX_JOUEUR = [0, 45, 80, 150, 270, 460];
function fenetreMercato() {
  const n = C.calendrier.length, m = Math.floor(n / 2);
  if (C.journee <= 2) return 'ete';
  if (C.journee >= m && C.journee <= m + 1) return 'hiver';
  return null;
}
function qualiteMercato() {
  const t = { 3: [30, 40, 22, 7, 1], 2: [12, 33, 33, 17, 5], 1: [0, 18, 38, 30, 14] }[C.div], x = rnd(100);
  let a = 0; for (let i = 0; i < 5; i++) { a += t[i]; if (x < a) return i + 1; } return 3;
}
function nouveauJoueurMercato() {
  const q = qualiteMercato(), g = pick(POSTES_JEUNES), etranger = hasard() < 0.3;
  const pays = etranger ? pick(Object.keys(PAYS).filter(p => p !== C.pays)) : C.pays;
  const P = PAYS[pays];
  const clubs = CLUBS.filter(c => c.pays === pays && c.div && c.id !== C.club);
  return { id: C.nid++, nom: pick(P.prenoms).charAt(0) + '. ' + pick(P.noms), pays, club: pick(clubs).id, p: g.p, l: g.l, c: g.c, k: pick(Object.keys(COULEURS)), q, age: 19 + rnd(14), prix: Math.round(PRIX_JOUEUR[q] * (0.9 + hasard() * 0.25) / 5) * 5 };
}
function majMercato() {
  const f = fenetreMercato();
  if (!f) return;
  const cle = C.saison + '-' + f;
  if (!C.mercato || C.mercato.cle !== cle) C.mercato = { cle, f, liste: Array.from({ length: 5 }, nouveauJoueurMercato) };
}
const effectifActif = () => C.effectif.map((j, i) => ({ j, i })).filter(o => !o.j.parti);
function recruter(id) {
  const M = C.mercato; if (!M || !fenetreMercato()) return null;
  const o = M.liste.find(x => x.id === id); if (!o || C.pieces < o.prix) return null;
  C.pieces -= o.prix;
  const ji = C.effectif.length;
  C.effectif.push({ nom: o.nom, p: o.p, l: o.l, k: o.k || pick(Object.keys(COULEURS)), note: o.q - 1, buts: 0, matchs: 0, recrue: true, pays: o.pays });
  const r = RAR_POT[o.q], cartes = o.c.map(t => { const c = nouvelleCarte(t, ji, r); c.niv = Math.min(RARETES[r].max, o.q <= 2 ? 2 : 1); return c; });
  cartes.forEach(c => C.cartes.push(c));
  M.liste = M.liste.filter(x => x.id !== id);
  sauver();
  return cartes;
}
function valeurJoueur(ji) {
  const cartes = C.cartes.filter(c => c.ji === ji), j = C.effectif[ji];
  return Math.round((15 + cartes.reduce((s, c) => s + RARETES[c.r].prix * c.niv * 0.8, 0) + (j.note || 0) * 12) / 5) * 5;
}
function peutVendre(ji) {
  const j = C.effectif[ji]; if (!j || j.parti) return 'Joueur introuvable';
  if (effectifActif().length <= 11) return 'Il faut au moins 11 joueurs';
  const n = C.cartes.filter(c => c.ji === ji).length;
  if (C.cartes.length - n < 16) return 'Ton paquet descendrait sous 16 cartes';
  if (j.p === 'Gardien' && effectifActif().filter(o => o.j.p === 'Gardien').length <= 1) return 'C’est ton seul gardien';
  if (!fenetreMercato()) return 'Le mercato est fermé';
  return null;
}
function vendreJoueur(ji) {
  if (peutVendre(ji)) return 0;
  const p = valeurJoueur(ji);
  C.effectif[ji].parti = true;
  C.cartes = C.cartes.filter(c => c.ji !== ji);
  C.pieces += p; sauver();
  return p;
}

// =====================================================================
// CHANGER DE CLUB : offres de fin de saison
// =====================================================================
function genOffres(issue, rang, nb, avant) {
  const out = [], pris = new Set([C.club]);
  const ajoute = (liste, raison) => { const l = liste.filter(c => !pris.has(c.id)); if (!l.length) return; const c = pick(l); pris.add(c.id); out.push({ id: c.id, raison, prime: 40 + 40 * (3 - (C.divisions[c.id] || 3)) }); };
  const memePays = d => CLUBS.filter(c => c.pays === C.pays && C.divisions[c.id] === d);
  const fMoi = clubPar(C.club).force, haut = rang <= Math.max(3, Math.round(nb * 0.2)), milieu = rang <= nb / 2;
  // jamais plus d'une division au-dessus de celle qu'on vient de jouer
  const cible = Math.max(1, avant - 1);
  if (haut && cible < C.div) ajoute(memePays(cible).filter(c => c.force < 0.75), 'Un club de la division au-dessus veut ton projet de jeu.');
  if (haut || milieu) ajoute(memePays(C.div).filter(c => c.force > fMoi + 0.05), 'Un club plus riche de ta division te fait les yeux doux.');
  if (C.div === 1 && (issue === 'champion' || issue === 'europe' || (C.coupes.eur && C.coupes.eur.gagne)))
    ajoute(CLUBS.filter(c => c.pays !== C.pays && C.divisions[c.id] === 1 && c.force >= 0.6 && c.force <= 0.85), 'Un grand championnat étranger t’appelle.');
  if (issue === 'descente' && hasard() < 0.6) ajoute(memePays(Math.max(1, C.div - 1)).filter(c => c.force < 0.6), 'Malgré la descente, un club croit en toi.');
  return out;
}
