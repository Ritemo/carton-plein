// =====================================================================
// LA TOURNÉE : un parcours de 7 étapes, renouvelé chaque semaine
// =====================================================================
// Même carte pour tout le monde la même semaine (comme les labyrinthes du Fil des Moires).
// À chaque étape on choisit entre deux chemins : match classique, match sous la tempête,
// adversaire costaud ou passage au vestiaire (un bonus sans jouer). Le boss attend au bout.
// 3 cœurs : une défaite en coûte un. Hors carrière : seules des pièces reviennent au club.
const TOURNEE_ETAPES = 7, TOURNEE_COEURS = 3, TOURNEE_ESSAIS = 2, TOURNEE_COEURS_MAX = 4;
const NOEUDS = {
  match: { nom: 'Match', ic: 'ballon', txt: 'Un adversaire à ta mesure.', mod: 1, pts: 100 },
  tempete: { nom: 'Tempête', ic: 'pluie', txt: 'Météo imposée et sans pitié.', mod: 1, pts: 130 },
  costaud: { nom: 'Costaud', ic: 'biceps', txt: 'Plus fort, mais ça rapporte plus.', mod: 1.15, pts: 150 },
  vestiaire: { nom: 'Vestiaire', ic: 'maillot', txt: 'Pas de match : un bonus au choix.', mod: 0, pts: 0 },
  boss: { nom: 'Le boss', ic: 'trophee', txt: 'Un grand d’Europe, deux cartes adverses. Il faut gagner.', mod: 1.25, pts: 300 }
};
const BONUS_VESTIAIRE = {
  coeur: { nom: 'Soigneur', ic: 'mains', txt: '+1 cœur' },
  renfort: { nom: 'Renfort', ic: 'etoile', txt: 'Une carte épique en plus pour toute la Tournée' },
  forme: { nom: 'Séance vidéo', ic: 'tactique', txt: 'Forme +4 au prochain match' }
};
const semTournee = () => 'T' + semaineDefi();

// ---------- la carte de la semaine (graine commune) ----------
function carteTournee(sem) {
  const g = 'tournee' + sem, types = ['match', 'tempete', 'costaud', 'vestiaire'], etapes = [];
  for (let i = 0; i < TOURNEE_ETAPES - 1; i++) {
    // pas de vestiaire à la première étape, et jamais deux fois le même chemin
    const dispo = i === 0 ? types.slice(0, 3) : types;
    const a = dispo[Math.floor(tirageCommun(g, 'a' + i) * dispo.length)];
    const reste = dispo.filter(t => t !== a), b = reste[Math.floor(tirageCommun(g, 'b' + i) * reste.length)];
    etapes.push([a, b]);
  }
  // au moins un vestiaire au milieu du parcours
  if (!etapes.some(e => e.includes('vestiaire'))) etapes[3][1] = 'vestiaire';
  etapes.push(['boss']);
  return etapes;
}
function adversaireTournee(sem, i, k, type) {
  const g = 'tournee' + sem;
  if (type === 'boss') { const grands = CLUBS.filter(c => c.div === 1 && c.id !== C.club).sort((a, b) => b.force - a.force).slice(0, 4); return grands[Math.floor(tirageCommun(g, 'boss') * grands.length)]; }
  const div = Math.max(1, C.div - (i >= 4 ? 1 : 0)), L = CLUBS.filter(c => c.div === div && c.id !== C.club);
  return L[Math.floor(tirageCommun(g, `o${i}-${k}`) * L.length)];
}
const meteoTournee = (sem, i) => ['pluie', 'vent', 'neige'][Math.floor(tirageCommun('tournee' + sem, 'm' + i) * 3)];
function facteurTournee(opp, i, type) {
  return DIFF[C.div] * (0.88 + 0.3 * opp.force) * (1 + DIFF.s * Math.max(0, C.saison - 1)) * (1 + DIFF.r * (C.ansD1 || 0)) * (1 + 0.06 * i) * NOEUDS[type].mod;
}

// ---------- état (dans la sauvegarde : suit le joueur d'un téléphone à l'autre) ----------
function etatTournee() {
  const sem = semTournee();
  if (!C.tournee || C.tournee.sem !== sem) C.tournee = { sem, essais: 0, run: null, meilleur: 0 };
  return C.tournee;
}
function nouvelleTournee() {
  const T = etatTournee();
  if (T.essais >= TOURNEE_ESSAIS) return toast('Plus de Tournée cette semaine');
  T.essais++;
  T.run = { etape: 0, coeurs: TOURNEE_COEURS, pts: 0, buts: 0, renforts: [], forme: 0, chemin: [], fini: false, gagne: false };
  sauver(); ecranTournee();
}

// ---------- carte d'entrée dans le vestiaire ----------
function carteTourneeHTML() {
  if (!C || COOP || C.saison === 1 && C.journee < 3) return '';
  const T = etatTournee(), R = T.run, enCours = R && !R.fini;
  const reste = TOURNEE_ESSAIS - T.essais;
  if (!enCours && reste <= 0) return '';
  return `<button class="coupe-ligne tournee" id="bTournee" data-merc="1">${img('globe')}<b class="lil">La Tournée</b><small>${enCours ? `Étape ${R.etape + 1}/${TOURNEE_ETAPES} · ${'♥'.repeat(R.coeurs)}` : `7 étapes, un boss · ${reste} essai${reste > 1 ? 's' : ''} cette semaine`}</small></button>`;
}

// ---------- écran du parcours ----------
function ecranTournee() {
  const T = etatTournee(), R = T.run, sem = T.sem, carte = carteTournee(sem);
  document.body.className = 'hub'; barreHaut(); $('#nav').innerHTML = '';
  const enCours = R && !R.fini;
  const lignes = carte.map((noeuds, i) => {
    const passe = R && i < R.etape, ici = enCours && i === R.etape, pris = R && R.chemin[i];
    return `<div class="tr-etape ${passe ? 'passe' : ''} ${ici ? 'ici' : ''}"><span class="tr-num lil">${i + 1}</span>${noeuds.map((t, k) => {
      const N = NOEUDS[t], opp = t !== 'vestiaire' ? adversaireTournee(sem, i, k, t) : null;
      const choisi = pris && pris.k === k, gris = passe && !choisi;
      return `<button class="tr-noeud ${t} ${choisi ? 'choisi' : ''} ${gris ? 'gris' : ''}" ${ici ? `data-noeud="${k}"` : 'disabled'}>${img(N.ic, 'mini-ic')}<b>${N.nom}</b><small>${opp ? echap(opp.nom) : N.txt}${t === 'tempete' ? ' · ' + METEOS[meteoTournee(sem, i)].nom : ''}</small>${choisi && pris.res ? `<i class="tr-res lil">${pris.res}</i>` : ''}</button>`;
    }).join('')}</div>`;
  }).reverse().join('');
  const tete = enCours
    ? `<div class="tr-tete"><span class="tr-coeurs">${'♥'.repeat(R.coeurs)}<s>${'♥'.repeat(Math.max(0, TOURNEE_COEURS_MAX - R.coeurs))}</s></span><b class="lil">${R.pts} pts</b></div>
       ${R.renforts.length || R.forme ? `<p class="petit centre">${R.renforts.length ? `${R.renforts.length} renfort${R.renforts.length > 1 ? 's' : ''} · ` : ''}${R.forme ? `Forme +${R.forme} au prochain match` : ''}</p>` : ''}`
    : `<p class="petit centre">Même parcours pour tout le monde cette semaine. À chaque étape, choisis ton chemin. Une défaite coûte un cœur ; à zéro, la Tournée s’arrête. Bats le boss pour la gagner.</p>`;
  vue(`<div class="page tournee-page">
    <h1 class="lil centre">${img('globe', 'mini-ic')} La Tournée <small>semaine ${sem.slice(6)}</small></h1>
    ${tete}
    <div class="tr-carte">${lignes}</div>
    ${!enCours ? `${R && R.fini ? `<div class="cp-res ${R.gagne ? 'or' : ''}">${R.gagne ? 'Tournée gagnée !' : 'Tournée terminée'} : <b class="lil">${R.pts}</b> points</div>` : ''}
      ${T.essais < TOURNEE_ESSAIS ? `<button class="btn gros large" id="trGo">${R ? 'Repartir' : 'Partir en Tournée'} (${TOURNEE_ESSAIS - T.essais} essai${TOURNEE_ESSAIS - T.essais > 1 ? 's' : ''})</button>` : ''}` : ''}
    <div id="trClass"></div>
    <button class="btn sec large" id="trRet">Retour au club</button>
  </div>`);
  on('trGo', () => { Son.clic(); nouvelleTournee(); });
  $('#trRet').onclick = () => { Son.clic(); hub('vestiaire'); };
  document.querySelectorAll('[data-noeud]').forEach(b => (b.onclick = () => { Son.clic(); choisirNoeud(+b.dataset.noeud); }));
  const ici = $('.tr-etape.ici'); if (ici) ici.scrollIntoView({ block: 'center' });
  classementTournee();
}
async function classementTournee() {
  const z = $('#trClass'), p = profil(); if (!z || !urlCloud() || !p.pseudo) return;
  try {
    const j = await apiLire('social', { code: p.code, amis: amisListe().map(a => a.code).join(','), semaine: semTournee() });
    const codes = new Set([p.code, ...amisListe().map(a => a.code)]);
    const L = Object.entries(j.defi || {}).filter(([c]) => codes.has(c)).sort((a, b) => b[1].score - a[1].score);
    if (L.length && $('#trClass')) $('#trClass').innerHTML = `<div class="soc-t lil">${img('classement', 'mini-ic')} Classement de la semaine</div><ol class="defi-cl">${L.map(([c, l]) => `<li class="${c === p.code ? 'moi' : ''}"><span>${echap(c === p.code ? 'Toi' : l.pseudo)}</span><b class="lil">${l.score}</b></li>`).join('')}</ol>`;
  } catch (e) { }
}

// ---------- choix d'un chemin ----------
function choisirNoeud(k) {
  const T = etatTournee(), R = T.run, i = R.etape, type = carteTournee(T.sem)[i][k];
  if (type === 'vestiaire') return vestiaireTournee(k);
  const opp = adversaireTournee(T.sem, i, k, type), N = NOEUDS[type];
  const m = { comp: 'tournee', opp: opp.id, dom: i % 2 === 0, nom: 'La Tournée', tour: type === 'boss' ? 'boss' : `étape ${i + 1}` };
  const opts = { graine: hacher(`tournee${T.sem}-${i}-${k}`), facteurFixe: facteurTournee(opp, i, type), renforts: R.renforts, tourneeNoeud: { i, k, type } };
  if (type === 'tempete') opts.meteo = meteoTournee(T.sem, i);
  if (type === 'boss') opts.boss = true;
  if (R.forme) opts.forme = R.forme;
  document.body.className = 'match'; $('#barre-haut').innerHTML = ''; $('#nav').innerHTML = '';
  nouveauMatch(m, false, opts);
  const met = METEOS[S.meteo];
  modal(`<div class="comp-tag lil europe">La Tournée · ${m.tour}</div><div class="coup-envoi">${blason(S.eq.p, 56)}<span class="lil">VS</span>${blason(opp, 56)}</div><h1 class="lil centre">${S.eq.p.nom} - ${opp.nom}</h1>
    <div class="regles"><div>${img(N.ic)}<span><b>${N.nom}</b> : ${N.txt} Victoire : +${N.pts} points, nul : +40${type === 'boss' ? ' mais il faut gagner' : ''}, +20 par but.</span></div>
    <div>${img(met.ic)}<span><b>${met.nom}</b> : ${met.txt}.</span></div>
    ${R.renforts.length ? `<div>${img('etoile')}<span>${R.renforts.length} renfort${R.renforts.length > 1 ? 's' : ''} dans ta pioche.</span></div>` : ''}
    <div>${img('piece')}<span>Hors carrière : ni classement ni fatigue. Les pièces arrivent à la fin de la Tournée.</span></div></div>
    <div class="btns"><button class="btn gros" id="mGo">Coup d'envoi</button><button class="btn sec" id="mAnn">Plus tard</button></div>`, () => {
    $('#mGo').onclick = () => { Son.sifflet(false); fermerModal(); R.forme = 0; sauver(); afficherMatch(); };
    $('#mAnn').onclick = () => { fermerModal(); S = null; ecranTournee(); };
  });
}
function vestiaireTournee(k) {
  const R = etatTournee().run;
  modal(`${img('maillot', 'grande-ic')}<h1 class="lil">Vestiaire</h1><p class="petit">Un moment pour souffler. Choisis un bonus.</p><div class="rgl">${Object.entries(BONUS_VESTIAIRE).map(([id, B]) => {
    const off = id === 'coeur' && R.coeurs >= TOURNEE_COEURS_MAX;
    return `<button class="choix-rgl" data-bonus="${id}" ${off ? 'disabled' : ''}>${img(B.ic, 'mini-ic')}<b>${B.nom}</b><small>${off ? 'Cœurs au maximum' : B.txt}</small></button>`;
  }).join('')}</div><button class="btn sec" id="vAnn">Retour</button>`, () => {
    document.querySelectorAll('[data-bonus]').forEach(b => (b.onclick = () => {
      const id = b.dataset.bonus; let txt = BONUS_VESTIAIRE[id].txt;
      if (id === 'coeur') R.coeurs = Math.min(TOURNEE_COEURS_MAX, R.coeurs + 1);
      if (id === 'forme') R.forme += 4;
      if (id === 'renfort') {
        const types = Object.keys(TYPES).filter(t => !estConsigne(t)), t = types[Math.floor(tirageCommun(R.etape + '-' + R.renforts.length, C.club) * types.length)];
        R.renforts.push(nouvelleCarte(t, jiPourType(t), 'epique')); txt = `${TYPES[t].nom} épique pour ${C.effectif[jiPourType(t)].nom}`;
      }
      R.chemin[R.etape] = { k, res: BONUS_VESTIAIRE[id].nom }; R.etape++;
      sauver(); Son.clic(); fermerModal(); toast(txt); ecranTournee();
    }));
    $('#vAnn').onclick = fermerModal;
  });
}

// ---------- fin d'un match de Tournée ----------
function finMatchTournee() {
  const T = etatTournee(), R = T.run, Nd = S.tourneeNoeud, N = NOEUDS[Nd.type];
  const gp = S.score.p, gc = S.score.ia, res = gp > gc ? 0 : gp === gc ? 1 : 2;
  const boss = Nd.type === 'boss', perdu = res === 2 || (boss && res === 1);
  let pts = (res === 0 ? N.pts : res === 1 && !boss ? 40 : 0) + 20 * gp;
  R.pts += pts; R.buts += gp;
  if (perdu) R.coeurs--;
  // on avance sauf contre le boss perdu (on peut le retenter s'il reste des cœurs)
  if (!(boss && perdu)) { R.chemin[R.etape] = { k: Nd.k, res: `${gp}-${gc}` }; R.etape++; }
  if (boss && !perdu) { R.fini = true; R.gagne = true; }
  if (R.coeurs <= 0) R.fini = true;
  let fin = '';
  if (R.fini) fin = terminerTournee();
  sauver();
  const titre = ['Victoire !', 'Match nul', 'Défaite'][res];
  if (res === 0) setTimeout(() => { Son.jingle(); confettis(); }, 400);
  vue(`<div class="page fin-match">
    <div class="comp-tag lil europe">La Tournée · ${S.info.tour}</div>
    <div class="fm-titre lil ${['v', 'n', 'd'][res]}">${titre}</div>
    <div class="score-fin lil">${blason(S.eq.p, 50)}<span>${gp} - ${gc}</span>${blason(S.eq.ia, 50)}</div>
    ${S.buteurs.length ? `<div class="buteurs">${img('ballon', 'mini-ic')} ${S.buteurs.map(ji => C.effectif[ji].nom).join(', ')}</div>` : ''}
    <div class="gain lil">+${pts} points</div>
    ${perdu ? `<div class="cp-res">Un cœur perdu : ${R.coeurs > 0 ? '♥'.repeat(R.coeurs) + ' restant' + (R.coeurs > 1 ? 's' : '') : 'plus aucun'}${boss && R.coeurs > 0 ? '. Le boss t’attend encore.' : ''}</div>` : ''}
    ${fin}
    <button class="btn gros" id="bFinOk">${R.fini ? 'Voir la Tournée' : 'Étape suivante'}</button>
  </div>`, 'plein');
  $('#bFinOk').onclick = () => { Son.clic(); S = null; ecranTournee(); };
  if (R.fini && R.gagne) setTimeout(() => souleverTrophee('La Tournée', `${R.pts} points`), 900);
}
function terminerTournee() {
  const T = etatTournee(), R = T.run;
  const pieces = 8 * R.etape + (R.gagne ? 60 : 0);
  C.pieces += pieces; T.meilleur = Math.max(T.meilleur || 0, R.pts);
  const p = profil();
  if (urlCloud() && p.pseudo) {
    apiEcrire('defi', { semaine: T.sem, code: p.code, pseudo: p.pseudo, club: clubPar(C.club).nom, score: R.pts }).catch(() => { });
    publier(R.gagne ? `a gagné la Tournée de la semaine (${R.pts} points)` : `a fini la Tournée après ${R.etape} étape${R.etape > 1 ? 's' : ''} (${R.pts} points)`, 'defi');
  }
  return `<div class="cp-res or">${img('globe', 'mini-ic')} ${R.gagne ? 'Tournée gagnée' : 'Fin de la Tournée'} : <b class="lil">${R.pts}</b> points</div><div class="gain lil">${img('piece')} +${pieces} pièces</div>`;
}
