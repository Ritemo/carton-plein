// =====================================================================
// L'ACTION EN IMAGES : un petit terrain montre ce que font tes joueurs
// =====================================================================
// Pendant que la jauge monte, chaque carte jouée devient un geste sur le terrain : passe, course,
// dribble, centre, tête, frappe ; en défense : tacle, interception, marquage, parade.
// Un même joueur peut jouer deux cartes : c'est montré comme au foot (une-deux avec un partenaire,
// longue course, double dribble, reprise de son propre tir, double parade).
const ORDRE_GESTE = { passe: 0, course: 1, dribble: 1, centre: 2, tete: 3, frappe: 3, marquage: 0, interception: 1, tacle: 2, gardien: 3 };
const X_LIGNE = { DEF: 70, MIL: 140, ATT: 205 }; // en attaque on va vers la droite
const NS = 'http://www.w3.org/2000/svg';
let SCENE = null;
// Rythme : chaque geste dure environ une seconde. Toucher l'écran accélère la fin de l'action.
let LENT = 2.4;
const plusTard = (f, ms) => setTimeout(f, ms * LENT);

function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v)); if (parent) parent.appendChild(e); return e; }

function creerScene(r) {
  if (!r.valides.length) return null;
  LENT = (() => { try { return localStorage.getItem('carton-plein-rapide') ? 0.25 : 2.4; } catch (e) { return 2.4; } })(); // les robots de test jouent en accéléré
  const att = enAttaque(), cartes = [...r.valides].sort((a, b) => (ORDRE_GESTE[a.t] ?? 2) - (ORDRE_GESTE[b.t] ?? 2));
  // plein écran : le terrain en grand, le calcul et la jauge juste en dessous
  const ancien = $('#actionPlein'); if (ancien) ancien.remove();
  const ov = document.createElement('div'); ov.id = 'actionPlein';
  const R = refCible(), sb = att ? seuilBut() : 1, F = S.fourchette;
  const reperes = S.comp === 'direct' ? '' : F ? `<span class="ap-bande" style="left:${F[0] * sb / R / 1.3 * 100}%;width:${(F[1] - F[0]) * sb / R / 1.3 * 100}%"></span>` : `<span class="ap-rep" style="left:${sb * 100 / 1.3}%"></span><span class="ap-rep occ" style="left:${70 / 1.3}%"></span>`;
  ov.innerHTML = `<div class="ap-haut lil">${att ? 'Ton attaque' : 'Ta défense'} · ${r.combo.nom}</div><div class="ap-terrain"></div>
    <div class="ap-legende lil" id="apLeg">&nbsp;</div>
    <div class="ap-calc lil"><span id="apPts">0</span><small>points</small><b>×</b><span id="apMult">${fmt(r.combo.mult)}</span><small>combo</small><b>=</b><span id="apTot" class="tot">?</span></div>
    <div class="ap-jauge"><i id="apFill"></i>${reperes}</div>
    <div class="ap-cible">${S.comp === 'direct' ? 'Contre le choix de ton adversaire' : att ? `Mur : ${F ? `${F[0]} à ${F[1]}` : S.cible}` : `Leur attaque : ${F ? `${F[0]} à ${F[1]}` : S.cible}`}</div>
    <div class="ap-astuce">Touche l’écran pour accélérer</div>`;
  document.body.appendChild(ov);
  ov.onpointerdown = () => { LENT = 0.8; };
  requestAnimationFrame(() => ov.classList.add('on'));
  // terrain vertical sur téléphone (on attaque vers le haut) : dessiné en largeur puis tourné
  const racine = el('svg', { viewBox: '0 0 190 300', class: 'terrain-action', 'aria-label': 'L’action sur le terrain' }, ov.querySelector('.ap-terrain'));
  const svg = el('g', { transform: 'translate(0,300) rotate(-90)' }, racine);
  // terrain
  el('rect', { x: 2, y: 2, width: 296, height: 186, rx: 10, class: 'ta-herbe' }, svg);
  for (let i = 0; i < 6; i++) el('rect', { x: 2 + i * 49.3, y: 2, width: 24.6, height: 186, class: 'ta-bande' }, svg);
  el('line', { x1: 150, y1: 4, x2: 150, y2: 186, class: 'ta-ligne' }, svg);
  el('circle', { cx: 150, cy: 95, r: 24, class: 'ta-ligne', fill: 'none' }, svg);
  el('rect', { x: 2, y: 50, width: 34, height: 90, class: 'ta-ligne', fill: 'none' }, svg);
  el('rect', { x: 264, y: 50, width: 34, height: 90, class: 'ta-ligne', fill: 'none' }, svg);
  el('rect', { x: 0, y: 78, width: 5, height: 34, class: 'ta-but' }, svg);
  el('rect', { x: 295, y: 78, width: 5, height: 34, class: 'ta-but' }, svg);
  // tout le reste est dessiné sur 100 de haut, étiré à 190
  const scene = el('g', { transform: 'scale(1,1.9)' }, svg);
  const cMoi = S.eq.p.c1 || '#2f7de1', cEux = '#1b1f2a'; // adversaires en sombre : jamais confondus avec tes joueurs
  // joueurs : les miens à leur ligne ; en défense on défend le but de gauche
  const parLigne = {}, pos = {};
  const placer = ji => {
    if (pos[ji]) return pos[ji];
    const j = C.effectif[ji] || { l: 'MIL' }, l = j.l || 'MIL', i = (parLigne[l] = (parLigne[l] || 0) + 1) - 1;
    let x = X_LIGNE[l]; if (!att) x = { DEF: 45, MIL: 95, ATT: 140 }[l];
    if (j.p === 'Gardien') x = att ? 30 : 14;
    pos[ji] = { x, y: [50, 28, 72, 40, 62][i % 5] };
    return pos[ji];
  };
  const joueurs = {}, calque = el('g', {}, scene), etiquettes = el('g', {}, svg);
  // pions ronds malgré l'étirement vertical : ellipse compensée
  const pion = (x, y, coul, cls) => { const g = el('g', { class: 'ta-pion ' + (cls || '') }, calque); g.style.transform = `translate(${x}px,${y}px)`; el('ellipse', { rx: cls === 'moi' ? 6.5 : 5.5, ry: (cls === 'moi' ? 6.5 : 5.5) / 1.9, fill: coul, stroke: cls === 'moi' ? '#fff' : '#000', 'stroke-width': cls === 'moi' ? 1.4 : 1 }, g); return g; };
  cartes.forEach(c => { if (!joueurs[c.ji]) { const p = placer(c.ji); joueurs[c.ji] = pion(p.x, p.y, cMoi, 'moi'); } });
  // adversaires : un gardien et deux joueurs sur le chemin
  const eux = att ? [pion(286, 50, cEux, 'eux'), pion(235, 38, cEux, 'eux'), pion(250, 64, cEux, 'eux')] : [pion(205, 46, cEux, 'eux'), pion(170, 66, cEux, 'eux'), pion(185, 30, cEux, 'eux')];
  const ballon = el('g', { class: 'ta-ballon' }, scene); el('ellipse', { rx: 3.6, ry: 3.6 / 1.9, fill: '#fff', stroke: '#000', 'stroke-width': 0.8 }, ballon);
  const bouger = (g, x, y, ms) => { g.style.transition = `transform ${Math.round((ms || 300) * LENT)}ms cubic-bezier(.45,0,.25,1)`; g.style.transform = `translate(${x}px,${y}px)`; };
  const posDe = g => { const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(g.style.transform); return m ? { x: +m[1], y: +m[2] } : { x: 0, y: 0 }; };
  // une seule légende, sous le terrain : le geste en cours
  const legende = ov.querySelector('#apLeg');
  const dire = (x, y, txt) => { legende.textContent = txt; legende.classList.remove('ta-pop'); void legende.offsetWidth; legende.classList.add('ta-pop'); };
  // départ du ballon
  if (att) { const p = posDe(joueurs[cartes[0].ji]); bouger(ballon, p.x + 4, p.y + 3, 0); }
  else { const p = posDe(eux[0]); bouger(ballon, p.x - 5, p.y + 3, 0); }
  return { ov, att, cartes, joueurs, eux, ballon, bouger, posDe, dire, i: 0, porteur: att ? cartes[0].ji : null, dernier: null };
}

// un geste par carte, au rythme du comptage des points
function gesteSuivant(sc) {
  if (!sc || sc.i >= sc.cartes.length) return;
  const c = sc.cartes[sc.i++], g = sc.joueurs[c.ji], p = sc.posDe(g), nom = (C.effectif[c.ji] || {}).nom || '', meme = sc.dernier === c.ji;
  const suivant = sc.cartes[sc.i], gs = suivant ? sc.joueurs[suivant.ji] : null;
  const B = (x, y, ms) => sc.bouger(sc.ballon, x, y, ms);
  sc.dernier = c.ji;
  if (sc.att) {
    // le ballon vient d'abord au joueur qui agit, s'il ne l'a pas
    if (sc.porteur !== c.ji) { B(p.x + 4, p.y + 3, 180); sc.porteur = c.ji; }
    const avance = (dx, dy) => { const x = Math.min(262, p.x + dx), y = Math.max(14, Math.min(86, p.y + dy)); sc.bouger(g, x, y, 320); plusTard(() => B(x + 4, y + 3, 200), 60); };
    switch (c.t) {
      case 'passe': {
        if (gs && gs !== g) { const q = sc.posDe(gs); B(q.x + 4, q.y + 3, 300); sc.porteur = suivant.ji; sc.dire(p.x, p.y, `${nom} · passe`); }
        else { // passe sans partenaire désigné, ou deux passes du même joueur : une-deux avec un coéquipier
          const rx = Math.min(250, p.x + 30), ry = p.y > 50 ? p.y - 22 : p.y + 22; B(rx, ry, 160); plusTard(() => { sc.bouger(g, Math.min(255, p.x + 34), p.y, 200); B(Math.min(259, p.x + 38), p.y + 3, 200); }, 170);
          sc.dire(p.x, p.y, meme ? `${nom} · une-deux` : `${nom} · passe`);
        }
        break;
      }
      case 'course': avance(meme ? 40 : 30, 0); sc.dire(p.x, p.y, `${nom} · ${meme ? 'longue course' : 'course'}`); break;
      case 'dribble': { const e = sc.eux[1], q = sc.posDe(e); sc.bouger(e, q.x - 6, q.y + 8, 250); avance(28, p.y > 50 ? -14 : 14); sc.dire(p.x, p.y, `${nom} · ${meme ? 'double dribble' : 'dribble'}`); break; }
      case 'centre': { sc.bouger(g, Math.min(255, p.x + 20), p.y < 50 ? 16 : 84, 260); const cible = gs ? sc.posDe(gs) : { x: 262, y: 50 }; if (gs) sc.bouger(gs, 262, 50, 300); plusTard(() => B(262, 47, 300), 220); if (gs) sc.porteur = suivant.ji; sc.dire(p.x, p.y, `${nom} · centre`); break; }
      case 'tete': sc.bouger(g, 262, 50, 220); plusTard(() => { g.classList.add('saute'); plusTard(() => g.classList.remove('saute'), 300); B(288, 46, 260); }, 200); sc.dire(262, 50, `${nom} · tête`); break;
      case 'frappe': {
        sc.bouger(g, Math.min(248, Math.max(p.x, 230)), p.y, 220);
        if (meme) { plusTard(() => B(270, p.y, 150), 200); plusTard(() => B(250, p.y + 6, 150), 360); sc.dire(p.x, p.y, `${nom} · reprise`); }
        else { plusTard(() => B(284, 50 + (p.y - 50) * 0.3, 240), 220); sc.dire(p.x, p.y, `${nom} · frappe`); }
        break;
      }
      default: avance(15, 0);
    }
  } else {
    // défense : leur attaque avance vers notre but, chaque carte la gêne
    const e = sc.eux[0], q = sc.posDe(e), nx = Math.max(40, q.x - 30);
    sc.bouger(e, nx, q.y, 320); B(nx - 5, q.y + 3, 320);
    const vers = (x, y, ms) => sc.bouger(g, x, y, ms || 320);
    switch (c.t) {
      case 'tacle': plusTard(() => { vers(nx - 2, q.y + 6, 220); B(nx - 2, q.y + 14, 200); }, 200); sc.dire(p.x, p.y, `${nom} · tacle`); break;
      case 'interception': { const o = sc.posDe(sc.eux[1]); plusTard(() => { B(o.x, o.y, 220); vers((o.x + nx) / 2, (o.y + q.y) / 2, 220); }, 160); sc.dire(p.x, p.y, `${nom} · interception`); break; }
      case 'marquage': vers(nx - 8, q.y - 6); sc.dire(p.x, p.y, `${nom} · marquage`); break;
      case 'gardien': plusTard(() => { g.classList.add('saute'); plusTard(() => g.classList.remove('saute'), 300); }, 120); sc.dire(p.x, p.y, meme ? `${nom} · double parade` : `${nom} · parade`); break;
      default: vers(nx - 6, q.y);
    }
  }
}
// fin de l'action selon le résultat
function finAction(sc, issue) {
  if (!sc) return;
  const b = sc.posDe(sc.ballon), B = (x, y, ms) => sc.bouger(sc.ballon, x, y, ms || 320);
  if (issue === 'but') { B(299, 50, 280); sc.dire(270, 30, 'BUT !'); }
  else if (issue === 'rate') { B(Math.max(230, b.x - 25), b.y < 50 ? 10 : 90, 320); sc.dire(260, 30, 'Repoussé'); }
  else if (issue === 'occasion') { B(255, 50, 260); sc.dire(255, 30, 'Occasion !'); }
  else if (issue === 'butAdverse') { B(1, 50, 280); sc.dire(40, 30, 'But adverse'); }
  else if (issue === 'tirAdverse') { B(40, 50, 260); sc.dire(45, 30, 'Ils tirent !'); }
  else if (issue === 'stoppe') { B(b.x + 40, b.y, 320); sc.dire(b.x, 30, 'Ballon récupéré'); }
}

// le calcul et la jauge en bas de l'écran d'action
function majActionPlein() {
  if (!SCENE || !SCENE.ov || !S || !S.anim) return;
  const a = S.anim, q = id => SCENE.ov.querySelector(id);
  q('#apPts').textContent = a.pts; q('#apMult').textContent = fmt(a.mult == null ? a.r.combo.mult : a.mult);
  q('#apTot').textContent = a.total == null ? '?' : a.total;
  const tot = a.total == null ? 0 : a.total; q('#apFill').style.transform = `scaleX(${Math.min(1, tot / (refCible() * 1.3))})`;
}
function fermerActionPlein() {
  const ov = SCENE && SCENE.ov; if (!ov) return;
  ov.classList.remove('on'); setTimeout(() => ov.remove(), 260); SCENE.ov = null;
}
