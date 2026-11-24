// VARIÉTÉ : météo, temps forts spéciaux, dilemmes de vestiaire
// =====================================================================
const METEOS = {
  soleil: { nom: 'Grand soleil', ic: 'soleil', txt: 'Aucun effet', mod: {} },
  pluie: { nom: 'Pluie battante', ic: 'pluie', txt: 'Passes −2, Frappes +3 (ballon glissant)', mod: { passe: -2, frappe: 3 } },
  vent: { nom: 'Vent violent', ic: 'vent', txt: 'Centres −3, Courses +2', mod: { centre: -3, course: 2 } },
  neige: { nom: 'Terrain gelé', ic: 'neige', txt: 'Dribbles −3, Tacles +2', mod: { dribble: -3, tacle: 2 } },
  nocturne: { nom: 'Nocturne électrique', ic: 'eclair', txt: 'Gardiens +5, Têtes +3', mod: { gardien: 5, tete: 3 } }
};
const TF_SPECIAUX = {
  normal: null,
  cf: { nom: 'Coup franc', txt: '2 cartes maximum, combo ×3. Une Frappe dedans : +1 au combo.', max: 2 },
  corner: { nom: 'Corner', txt: 'Les Centres et les Têtes valent double.' },
  eclair: { nom: 'Contre éclair', txt: '3 cartes maximum, mais +1 au multiplicateur.', max: 3 },
  penalty: { nom: 'Penalty adverse', txt: 'Choisis ton côté. Sacrifie un Gardien pour couvrir deux côtés.' }
};
function tirerTypeTF(tf) {
  if (tf === 0 || (S && (S.tuto === 1 || S.comp === 'direct'))) return 'normal';
  if (tf % 2 === 0) { const x = rnd(100); return x < 58 ? 'normal' : x < 74 ? 'cf' : x < 90 ? 'corner' : 'eclair'; }
  return rnd(100) < 7 ? 'penalty' : 'normal';
}
const DILEMMES = [
  { id: 'jeune', titre: 'Un gamin du centre de formation', txt: 'Il dribble tout le monde à l’entraînement. Le président veut le prêter pour renflouer les caisses.',
    a: { lib: 'Le garder au centre', eff: 'Un jeune à gros potentiel rejoint ton centre de formation', f: () => { const F = C.formation; if (F.jeunes.length < CENTRE[F.niveau].places) { const j = nouveauJeune(4); j.prog = 40; F.jeunes.push(j); } else C.cartes.push(nouvelleCarte('dribble', jiPourType('dribble'), 'rare')); } },
    b: { lib: 'Le prêter', eff: '+50 pièces', f: () => (C.pieces += 50) } },
  { id: 'vente', titre: 'Une offre pour ton buteur', txt: 'Un club étranger propose une fortune pour ton meilleur tireur.',
    a: { lib: 'Vendre', eff: '+120 pièces, tu perds ta meilleure Frappe', f: () => { const f = C.cartes.filter(c => c.t === 'frappe').sort((x, y) => valeurCarte(y) - valeurCarte(x))[0]; if (f) C.cartes = C.cartes.filter(c => c.id !== f.id); C.pieces += 120; } },
    b: { lib: 'Le garder', eff: 'Ta meilleure Frappe gagne +1 niveau', f: () => { const f = C.cartes.filter(c => c.t === 'frappe' && c.niv < RARETES[c.r].max).sort((x, y) => valeurCarte(y) - valeurCarte(x))[0]; if (f) f.niv++; } } },
  { id: 'video', titre: 'Vidéo ou physique ?', txt: 'Dédé a préparé la salle vidéo. Le préparateur, lui, veut faire courir tout le monde.',
    a: { lib: 'Séance vidéo', eff: '+1 niveau sur une combinaison au hasard', f: () => { const k = pick(COMBOS_ATT.filter(x => x.id !== 'simple')); C.niveaux[k.id] = (C.niveaux[k.id] || 1) + 1; } },
    b: { lib: 'Séance physique', eff: '+1 niveau sur 2 cartes de défense', f: () => melanger(C.cartes.filter(c => !TYPES[c.t].att && c.niv < RARETES[c.r].max)).slice(0, 2).forEach(c => c.niv++) } },
  { id: 'ultras', titre: 'Les ultras sont venus', txt: 'Ils veulent voir des joueurs qui mouillent le maillot.',
    a: { lib: 'Promettre du combat', eff: 'Nouvelle carte Tacle épique', f: () => C.cartes.push(nouvelleCarte('tacle', jiPourType('tacle'), 'epique')) },
    b: { lib: 'Les calmer', eff: '+30 pièces', f: () => (C.pieces += 30) } },
  { id: 'gloire', titre: 'Une vieille gloire du club', txt: 'L’ancien buteur des années 90 propose de coacher tes attaquants. Il n’est pas gratuit.',
    a: { lib: 'Accepter (−40 pièces)', eff: '+1 niveau sur toutes tes Frappes et Têtes', f: () => { C.pieces = Math.max(0, C.pieces - 40); C.cartes.filter(c => (c.t === 'frappe' || c.t === 'tete') && c.niv < RARETES[c.r].max).forEach(c => c.niv++); } },
    b: { lib: 'Décliner poliment', eff: '+10 pièces', f: () => (C.pieces += 10) } },
  { id: 'grippe', titre: 'La grippe au vestiaire', txt: 'Trois joueurs toussent. Dédé distribue des tisanes.',
    a: { lib: 'Mettre au repos', eff: 'Ta carte la plus faible quitte le paquet', f: () => { if (C.cartes.length > 16) { const w = C.cartes.slice().sort((x, y) => valeurCarte(x) - valeurCarte(y))[0]; C.cartes = C.cartes.filter(c => c.id !== w.id); } } },
    b: { lib: 'Jouer quand même', eff: '+20 pièces de prime de match', f: () => (C.pieces += 20) } },
  { id: 'stage', titre: 'Stage à la montagne', txt: 'Une semaine au grand air, mais le car coûte cher.',
    a: { lib: 'Partir (−50 pièces)', eff: '+1 niveau sur 3 cartes au hasard', f: () => { C.pieces = Math.max(0, C.pieces - 50); melanger(C.cartes.filter(c => c.niv < RARETES[c.r].max)).slice(0, 3).forEach(c => c.niv++); } },
    b: { lib: 'Rester au club', eff: '+1 niveau sur la combinaison Une-deux', f: () => (C.niveaux.unedeux = (C.niveaux.unedeux || 1) + 1) } },
  { id: 'tele', titre: 'Plateau télé', txt: 'Une chaîne veut t’interviewer en direct.',
    a: { lib: 'Faire le show', eff: '+40 pièces', f: () => (C.pieces += 40) },
    b: { lib: 'Protéger le groupe', eff: '+1 niveau sur 2 cartes de Passe', f: () => melanger(C.cartes.filter(c => c.t === 'passe' && c.niv < RARETES[c.r].max)).slice(0, 2).forEach(c => c.niv++) } }
];
function dilemmeDuJour() {
  if (![2, 6, 10, 14, 18].includes(C.journee)) return null;
  const cle = `${C.saison}-${C.journee}`;
  if (C.vus['d' + cle]) return null;
  const dispo = DILEMMES.filter(d => !(C.dilemmesVus || []).includes(d.id));
  const d = dispo.length ? pick(dispo) : pick(DILEMMES);
  return { d, cle };
}
function resoudreDilemme(o, choix) {
  (choix === 'a' ? o.d.a : o.d.b).f();
  C.vus['d' + o.cle] = true;
  C.dilemmesVus = (C.dilemmesVus || []).concat(o.d.id).slice(-5);
  sauver();
}

