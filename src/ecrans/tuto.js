// =====================================================================
// TUTORIEL : deux matchs d'entraînement guidés avant la carrière
// =====================================================================
const CLE_TUTO = 'carton-plein-tuto';
const tutoFait = () => { try { return localStorage.getItem(CLE_TUTO) === '1'; } catch (e) { return true; } };
const marquerTuto = () => { try { localStorage.setItem(CLE_TUTO, '1'); } catch (e) { } };
let C_AVANT_TUTO = null;
function demarrerNouvelle() {
  if (tutoFait()) return choixPays();
  modal(`${img('dede', 'grande-ic')}<h1 class="lil">Premier jour au club</h1><p>Avant la carrière, deux petits matchs d'entraînement pour apprendre les bases. Ça prend 5 minutes.</p><div class="btns col"><button class="btn gros" id="mTuto">C'est parti</button><button class="btn sec" id="mPasse">Je connais, passer</button></div>`, () => {
    $('#mTuto').onclick = () => { fermerModal(); lancerTuto(1); };
    $('#mPasse').onclick = () => { marquerTuto(); fermerModal(); choixPays(); };
  });
}
function lancerTuto(n) {
  if (!TUTO_EN_COURS) C_AVANT_TUTO = C;
  TUTO_EN_COURS = true;
  nouvelleCarriere('caen');
  C.temp = true; C.club = 'tuto-moi';
  document.body.className = 'match';
  $('#barre-haut').innerHTML = ''; $('#nav').innerHTML = '';
  nouveauMatch({ comp: 'ligue', opp: 'tuto-adv', dom: true, nom: 'Entraînement' });
  S.tuto = n; S.tutoVus = {};
  if (n === 1) {
    // pas de consignes, et une première main qui permet un Centre-Tête
    const tout = S.main.concat(S.pioche).filter(c => !estConsigne(c.t));
    const prendre = t => { const i = tout.findIndex(c => c.t === t); return i >= 0 ? tout.splice(i, 1)[0] : null; };
    const main = ['centre', 'tete', 'passe', 'dribble', 'tacle', 'marquage', 'interception', 'gardien'].map(prendre).filter(Boolean);
    S.main = main; S.pioche = melanger(tout); S.defausse = [];
  }
  S.tf = 0; preparerTF();
  modal(`${img(n === 1 ? 'ballon' : 'gemme', 'grande-ic')}<h1 class="lil">Entraînement ${n} sur 2</h1><p>${n === 1 ? 'Les bases : jouer des cartes, faire des combos, marquer et défendre.' : 'Les couleurs, les consignes et les cartes de l’adversaire.'}</p><div class="btns"><button class="btn gros" id="mGo">Coup d'envoi</button></div>`, () => ($('#mGo').onclick = () => { Son.init(); Son.sifflet(false); fermerModal(); afficherMatch(); }));
}
function finTuto() {
  const n = S.tuto, gp = S.score.p, gc = S.score.ia;
  S = null;
  vue(`<div class="scene">${img(n === 1 ? 'fete' : 'trophee', 'scene-ic grosse')}<div class="fm-titre lil v">${n === 1 ? 'Bien joué !' : 'Tu es prêt !'}</div>
    ${bulle('dede', n === 1 ? `${gp} - ${gc}. Tu as compris l'essentiel. Deuxième séance : les couleurs, les consignes, et un adversaire qui joue ses propres cartes.` : `${gp} - ${gc}. Le président t'attend. Choisis ton pays et ton club : tout commence en 3e division.`)}
    <button class="btn gros" id="bTutoSuite">${n === 1 ? 'Entraînement 2' : C_AVANT_TUTO ? 'Retour au vestiaire' : 'Commencer ma carrière'}</button></div>`, 'plein scene-fond');
  $('#bTutoSuite').onclick = () => {
    Son.clic();
    if (n === 1) return lancerTuto(2);
    marquerTuto(); TUTO_EN_COURS = false; C = C_AVANT_TUTO; C_AVANT_TUTO = null; document.body.className = '';
    if (C) hub('vestiaire'); else choixPays();
  };
}
// bulles d'aide pendant les matchs d'entraînement : chaque message une seule fois
function bulleTuto() {
  if (!S || !S.tuto) return '';
  const att = enAttaque(), ph = S.phase, vus = S.tutoVus, msgs = [];
  const une = (id, txt) => { if (!vus[id] || vus[id] === S.tf + ph) { vus[id] = S.tf + ph; msgs.push(txt); } };
  if (S.tuto === 1) {
    if (ph === 'choix' && att && !S.sel.length) une('att', 'Touche tes cartes d’attaque (les autres sont grisées). Essaie <b>Centre</b> puis <b>Tête</b> : c’est un combo ×3.');
    else if (ph === 'choix' && att && S.sel.length) une('calc', '<b>Points × combo = total.</b> Si le total dépasse le mur (en haut à droite), c’est but. Appuie sur Attaquer.');
    else if (ph === 'choix' && !att) une('def', 'En défense, l’adversaire annonce son attaque. Atteins son chiffre avec tes cartes de défense : Tacle, Marquage, Interception, Gardien.');
    else if (ph === 'occasion') une('occ', 'Presque ! Vise une zone du but, puis appuie quand le curseur est dans le <b>vert</b>.');
    else if (ph === 'tirAdverse' || ph === 'penalty') une('plonge', 'Le tireur a une habitude, indiquée sous le but. Choisis ton côté, puis plonge quand le curseur est dans le <b>vert</b>.');
    else if (['but', 'rate', 'stoppe', 'butAdverse', 'tirRes'].includes(ph)) une('suite', '6 temps forts par match : 3 attaques, 3 défenses. Après chaque temps fort, tu pioches 3 cartes ; ta main se remplit à la mi-temps.');
  } else {
    if (ph === 'choix' && S.adv && S.adv.length) une('adv', 'L’adversaire joue des <b>cartes</b>, affichées sous son cadre. Contourne-les, ou joue ta <b>Feinte</b> (violette) pour les annuler.');
    else if (ph === 'choix' && att && (!vus.coul || vus.coul === S.tf + ph)) une('coul', 'Regarde les <b>couleurs</b> : 3 cartes de la même couleur = Trio (+1 au combo), 4 = Carton plein (+2). La couleur vient du <b>joueur</b>, pas du type de carte : une Frappe peut être rouge ou bleue.');
    else if (ph === 'choix' && att) une('coll', 'Chaque joueur a une ligne, en bas de sa carte : <b>D</b> défense, <b>M</b> milieu, <b>A</b> attaque. Les trois lignes dans la même action = <b>Collectif</b> (+1 au combo).');
    else if (ph === 'choix' && S.main.some(c => estConsigne(c.t))) une('cons', 'Les cartes violettes sont des <b>Consignes</b> : 0 point, mais un effet tout de suite ou au temps fort suivant.');
  }
  return msgs.length ? `<div class="bulle-tuto">${img('dede', 'mini-ic')}<span>${msgs[0]}</span></div>` : '';
}
CLUBS.push({ id: 'tuto-moi', nom: 'Ton équipe', court: 'TOI', c1: '#2f7de1', c2: '#ffffff', pays: 'fr', force: 0.5, style: 'possession', div: 0, g: null });
CLUBS.push({ id: 'tuto-adv', nom: 'La Réserve', court: 'RES', c1: '#8a8fa8', c2: '#ffffff', pays: 'fr', force: 0.2, style: 'bloc', div: 0, g: null });
CLUB_MAP = null;
