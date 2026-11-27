// =====================================================================
// L'ACTION EN IMAGES : le terrain en plein écran montre ce que font tes joueurs
// =====================================================================
// Chaque carte jouée devient un geste : passe, course, dribble, centre, tête, frappe ;
// en défense : marquage, interception, tacle, parade.
// Règles de finition :
// - le ballon va toujours vers un joueur (un coéquipier, un adversaire, le gardien) ou dans le but ;
// - les points et le son tombent au moment du contact avec le ballon, pas au début du geste ;
// - le geste final (tir) attend le résultat : il part après le calcul, et le son du but
//   ou de l'arrêt arrive quand le ballon touche le filet ou les gants.
// Un même joueur qui joue deux cartes fait un geste combiné (une-deux, longue course, double dribble, reprise).
const ORDRE_GESTE = { passe: 0, course: 1, dribble: 1, centre: 2, tete: 3, frappe: 3, marquage: 0, interception: 1, tacle: 2, gardien: 3 };
const NS = 'http://www.w3.org/2000/svg';
let SCENE = null;
// Rythme : LENT multiplie toutes les durées. Toucher l'écran accélère sans à-coup (l'horloge suit LENT en direct).
let LENT = 1.5;
const LENT_NORMAL = 1.5, LENT_RAPIDE = 0.55;
// gardé pour compatibilité (anciens appels)
const plusTard = (f, ms) => setTimeout(f, ms * LENT);

function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v)); if (parent) parent.appendChild(e); return e; }

// ---------- petite horloge d'animation (une seule boucle, accélérable) ----------
const ANIM = { tw: new Set(), raf: 0, last: 0 };
function boucleAnim(now) {
  const dt = Math.min(50, now - ANIM.last) / LENT; ANIM.last = now;
  ANIM.tw.forEach(tw => { tw.t += dt; const u = Math.min(1, tw.t / tw.d); tw.step(u); if (u >= 1) { ANIM.tw.delete(tw); tw.res(); } });
  ANIM.raf = ANIM.tw.size ? requestAnimationFrame(boucleAnim) : 0;
}
function tween(d, step) {
  return new Promise(res => {
    ANIM.tw.add({ t: 0, d: Math.max(1, d), step, res });
    if (!ANIM.raf) { ANIM.last = performance.now(); ANIM.raf = requestAnimationFrame(boucleAnim); }
  });
}
function finirAnims() { ANIM.tw.forEach(tw => { tw.step(1); tw.res(); }); ANIM.tw.clear(); if (ANIM.raf) cancelAnimationFrame(ANIM.raf); ANIM.raf = 0; }
const attendre = d => tween(d, () => { });
const doux = u => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2); // joueurs : départ et arrivée en douceur
const frappe = u => 1 - Math.pow(1 - u, 2.2); // ballon : part fort, ralentit

// ---------- objets du terrain ----------
function poser(o, x, y) { o.x = x; o.y = y; o.g.setAttribute('transform', `translate(${x.toFixed(2)},${y.toFixed(2)})`); }
function aller(o, x, y, d, e) {
  const x0 = o.x, y0 = o.y; e = e || doux;
  return tween(d, u => { const k = e(u); poser(o, x0 + (x - x0) * k, y0 + (y - y0) * k); });
}
// ballon en l'air : il grossit (il monte) pendant que son ombre reste au sol
function lober(b, x, y, d, h) {
  const x0 = b.x, y0 = b.y;
  return tween(d, u => { const k = doux(u); poser(b, x0 + (x - x0) * k, y0 + (y - y0) * k); const z = 4 * u * (1 - u) * h; b.corps.setAttribute('transform', `translate(${(z * 0.35).toFixed(2)},0) scale(${(1 + z * 0.09).toFixed(3)})`); b.ombre.setAttribute('opacity', (0.45 - z * 0.03).toFixed(2)); });
}
function sauter(o, d) { return tween(d || 260, u => o.corps.setAttribute('transform', `scale(${(1 + 0.4 * Math.sin(Math.PI * u)).toFixed(3)})`)); }
function vaciller(o, d) { const x0 = o.x, y0 = o.y; return tween(d || 300, u => poser(o, x0 + Math.sin(u * Math.PI * 5) * 2.2 * (1 - u), y0)); }

// adversaires à leur couleur, sauf si elle ressemble trop à la mienne ou au ballon blanc
function couleurAdverse(moi, eux) {
  const rgb = h => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(h || ''); return m ? m.slice(1).map(x => parseInt(x, 16)) : null; };
  const a = rgb(moi), b = rgb(eux), d = (x, y) => Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
  if (!b || (a && d(a, b) < 160) || d(b, [255, 255, 255]) < 150) return a && d(a, [200, 40, 40]) > 160 ? '#c62828' : '#1b1f2a';
  return eux;
}
function creerScene(r) {
  if (!r.valides.length) return null;
  LENT = (() => { try { return localStorage.getItem('carton-plein-rapide') ? 0.2 : LENT_NORMAL; } catch (e) { return LENT_NORMAL; } })(); // les robots de test jouent en accéléré
  finirAnims();
  const att = enAttaque();
  // ordre des gestes : construction, percussion, finition. Le buteur désigné finit l'action.
  const pts = [...r.pts].sort((a, b) => (ORDRE_GESTE[a.c.t] ?? 2) - (ORDRE_GESTE[b.c.t] ?? 2));
  const buteur = att ? buteurDe(r) : null;
  if (att) { const k = pts.findIndex(p => (p.c.t === 'frappe' || p.c.t === 'tete') && p.c.ji === buteur); if (k >= 0) pts.push(pts.splice(k, 1)[0]); }
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
  ov.onpointerdown = () => { LENT = Math.min(LENT, LENT_RAPIDE); ov.querySelector('.ap-astuce').style.opacity = 0; };
  requestAnimationFrame(() => ov.classList.add('on'));
  // terrain vertical sur téléphone (on attaque vers le haut) : dessiné en largeur puis tourné
  const racine = el('svg', { viewBox: '0 0 190 300', class: 'terrain-action', 'aria-label': 'L’action sur le terrain' }, ov.querySelector('.ap-terrain'));
  const svg = el('g', { transform: 'translate(0,300) rotate(-90)' }, racine);
  el('rect', { x: 2, y: 2, width: 296, height: 186, rx: 10, class: 'ta-herbe' }, svg);
  for (let i = 0; i < 6; i++) el('rect', { x: 2 + i * 49.3, y: 2, width: 24.6, height: 186, class: 'ta-bande' }, svg);
  el('line', { x1: 150, y1: 4, x2: 150, y2: 186, class: 'ta-ligne' }, svg);
  el('circle', { cx: 150, cy: 95, r: 24, class: 'ta-ligne', fill: 'none' }, svg);
  el('rect', { x: 2, y: 50, width: 34, height: 90, class: 'ta-ligne', fill: 'none' }, svg);
  el('rect', { x: 264, y: 50, width: 34, height: 90, class: 'ta-ligne', fill: 'none' }, svg);
  el('rect', { x: 0, y: 78, width: 5, height: 34, class: 'ta-but' }, svg);
  el('rect', { x: 295, y: 78, width: 5, height: 34, class: 'ta-but' }, svg);
  // tout le reste est dessiné sur 100 de haut, étiré à 190 (formes compensées pour rester rondes)
  const scene = el('g', { transform: 'scale(1,1.9)' }, svg);
  const cMoi = ['#ffffff', '#fff', '#f5f5f5'].includes((S.eq.p.c1 || '').toLowerCase()) ? (S.eq.p.c2 && S.eq.p.c2.toLowerCase() !== '#ffffff' ? S.eq.p.c2 : '#2f7de1') : (S.eq.p.c1 || '#2f7de1'), cEux = couleurAdverse(cMoi, S.eq.ia.c1);
  const calqueOmbres = el('g', {}, scene), calque = el('g', {}, scene);
  const pion = (x, y, coul, cls) => {
    const g = el('g', { class: 'ta-pion ' + cls }, calque), rx = cls.includes('moi') ? 6.5 : 5.5;
    const actif = el('ellipse', { rx: rx + 3, ry: (rx + 3) / 1.9, fill: 'none', stroke: '#ffd23f', 'stroke-width': 1.4, opacity: 0, class: 'ta-actif' }, g);
    const corps = el('g', {}, g);
    el('ellipse', { rx, ry: rx / 1.9, fill: coul, stroke: '#000', 'stroke-width': 1.1 }, corps);
    const o = { g, corps, actif, x: 0, y: 0 }; poser(o, x, y); return o;
  };
  const allumer = (o, on) => o && o.actif.setAttribute('opacity', on ? 1 : 0);
  // mes joueurs (ceux qui ont une carte), à leur ligne
  const parLigne = {}, joueurs = {};
  const X_ATT = { DEF: 125, MIL: 170, ATT: 212 }, X_DEF = { DEF: 62, MIL: 98, ATT: 132 };
  pts.forEach(({ c }) => {
    if (joueurs[c.ji]) return;
    const j = C.effectif[c.ji] || { l: 'MIL' }, l = j.l || 'MIL', i = (parLigne[l] = (parLigne[l] || 0) + 1) - 1;
    let x = (att ? X_ATT : X_DEF)[l], y = [50, 30, 70, 40, 60][i % 5];
    if (j.p === 'Gardien' || c.t === 'gardien') { x = 12; y = 50; }
    joueurs[c.ji] = pion(x, y, cMoi, 'moi');
  });
  // des coéquipiers sans carte pour recevoir les une-deux et les centres
  const partenaires = att ? [pion(195, 18, cMoi, 'moi part'), pion(205, 82, cMoi, 'moi part')] : [];
  // mon gardien est toujours là en défense
  let gardien = null;
  if (!att) { const gk = pts.find(p => p.c.t === 'gardien'); gardien = gk ? joueurs[gk.c.ji] : pion(12, 50, cMoi, 'moi part'); }
  // adversaires
  const eux = att
    ? { gk: pion(291, 50, cEux, 'eux'), def: [pion(248, 36, cEux, 'eux'), pion(250, 64, cEux, 'eux'), pion(228, 50, cEux, 'eux')] }
    : { porteur: pion(200, 50, cEux, 'eux'), appui: [pion(178, 24, cEux, 'eux'), pion(170, 76, cEux, 'eux')] };
  const ballon = { g: el('g', { class: 'ta-ballon' }, scene), x: 0, y: 0 };
  ballon.ombre = el('ellipse', { rx: 3.4, ry: 3.4 / 1.9, cx: 0.8, cy: 0.9, fill: '#000', opacity: 0.45 }, ballon.g);
  ballon.corps = el('g', {}, ballon.g); el('ellipse', { rx: 3.4, ry: 3.4 / 1.9, fill: '#fff', stroke: '#000', 'stroke-width': 0.8 }, ballon.corps); el('ellipse', { rx: 1.2, ry: 1.2 / 1.9, fill: '#000' }, ballon.corps);
  const legende = ov.querySelector('#apLeg');
  const dire = (x, y, txt) => { legende.textContent = txt; legende.classList.remove('ta-pop'); void legende.offsetWidth; legende.classList.add('ta-pop'); };
  const sc = { ov, att, pts, joueurs, partenaires, gardien, eux, ballon, dire, allumer, i: 0, buteur, dernier: null, porteur: null, aTire: false };
  // départ : le ballon est aux pieds du premier joueur (ou de leur porteur en défense)
  if (att) { sc.porteur = pts[0].c.ji; const p = joueurs[sc.porteur]; poser(ballon, p.x + 4.5, p.y); }
  else poser(ballon, eux.porteur.x - 4.5, eux.porteur.y);
  return sc;
}

// le ballon aux pieds d'un joueur (devant lui, dans le sens du jeu)
const pied = (sc, o) => ({ x: o.x + (sc.att ? 4.5 : -4.5), y: o.y });
async function passerA(sc, de, vers, d, lob) {
  const cible = pied(sc, vers);
  if (lob) await lober(sc.ballon, cible.x, cible.y, d, 9); else await aller(sc.ballon, cible.x, cible.y, d, frappe);
}
const borne = (v, a, b) => Math.max(a, Math.min(b, v));

// un geste par carte ; impact() tombe au contact du ballon (points + son)
async function gesteSuivant(sc, impact) {
  if (!sc || sc.i >= sc.pts.length) { if (impact) impact(); return; }
  let fait = false; const touche = () => { if (!fait) { fait = true; if (impact) impact(); } };
  const k = sc.i++, c = sc.pts[k].c, moi = sc.joueurs[c.ji], nom = (C.effectif[c.ji] || {}).nom || '', meme = sc.dernier === c.ji;
  const suivant = sc.pts[k + 1] ? sc.pts[k + 1].c : null, lui = suivant ? sc.joueurs[suivant.ji] : null;
  sc.dernier = c.ji;
  Object.values(sc.joueurs).forEach(o => sc.allumer(o, o === moi));
  try {
    if (sc.att) await gesteAttaque(sc, c, moi, nom, meme, suivant, lui, touche);
    else await gesteDefense(sc, c, moi, nom, meme, touche);
  } finally { touche(); }
  await attendre(120);
}

async function gesteAttaque(sc, c, moi, nom, meme, suivant, lui, touche) {
  const B = sc.ballon;
  // le ballon n'est pas à lui : un coéquipier lui donne d'abord (passe de relais)
  if (sc.porteur !== c.ji) {
    const de = sc.joueurs[sc.porteur] || sc.partenaires[0];
    Son.touche(); await passerA(sc, de, moi, 300); sc.porteur = c.ji;
  }
  switch (c.t) {
    case 'passe': {
      if (lui && lui !== moi) {
        sc.dire(0, 0, `${nom} · passe`);
        const rx = borne(lui.x + 10, 60, 250), ry = lui.y;
        aller(lui, rx, ry, 420); // le receveur se démarque pendant que le ballon arrive
        await attendre(80); touche(); await passerA(sc, moi, { x: rx, y: ry }, 360);
        sc.porteur = suivant.ji;
      } else {
        // une-deux avec un coéquipier : je donne, je file, il me la rend dans la course
        sc.dire(0, 0, `${nom} · ${meme ? 'une-deux' : 'passe et va'}`);
        const p = sc.partenaires.reduce((a, b) => (Math.abs(b.y - moi.y) > Math.abs(a.y - moi.y) ? b : a));
        aller(p, borne(moi.x + 28, 60, 245), p.y < 50 ? 26 : 74, 300);
        touche(); await passerA(sc, moi, { x: borne(moi.x + 28, 60, 245), y: p.y < 50 ? 26 : 74 }, 300);
        const nx = borne(moi.x + 40, 60, 250);
        const course = aller(moi, nx, moi.y, 480);
        await attendre(140); Son.touche(); await passerA(sc, p, { x: nx, y: moi.y }, 340); await course;
      }
      break;
    }
    case 'course': {
      sc.dire(0, 0, `${nom} · ${meme ? 'longue course' : 'course'}`);
      const nx = borne(moi.x + (meme ? 42 : 32), 60, 250), ny = moi.y;
      touche();
      await Promise.all([aller(moi, nx, ny, 620), aller(B, nx + 7, ny, 600, doux)]); // le ballon poussé devant
      await aller(B, nx + 4.5, ny, 120);
      break;
    }
    case 'dribble': {
      sc.dire(0, 0, `${nom} · ${meme ? 'double dribble' : 'dribble'}`);
      const d = sc.eux.def.reduce((a, b) => (Math.hypot(b.x - moi.x, b.y - moi.y) < Math.hypot(a.x - moi.x, a.y - moi.y) ? b : a));
      const fx = borne(d.x - 14, 60, 240), fy = d.y;
      await Promise.all([aller(d, fx + 8, fy, 360), aller(moi, fx - 8, moi.y + (fy - moi.y) * 0.6, 360), aller(B, fx - 3.5, moi.y + (fy - moi.y) * 0.6, 360)]);
      // feinte d'un côté, passage de l'autre
      const cote = fy > 50 ? -1 : 1, px = borne(fx + 16, 60, 250), py = borne(fy + cote * 16, 12, 88);
      touche();
      await Promise.all([aller(moi, px, py, 420), aller(B, px + 4.5, py, 420), vaciller(d, 420)]);
      aller(d, d.x - 6, d.y, 300); // le défenseur reste sur place, battu
      break;
    }
    case 'centre': {
      // débordement côté libre, centre en l'air vers la surface
      const aile = moi.y < 50 ? 14 : 86, wx = borne(moi.x + 22, 200, 252);
      sc.dire(0, 0, `${nom} · centre`);
      await Promise.all([aller(moi, wx, aile, 480), aller(B, wx + 4.5, aile, 480)]);
      const recv = lui && lui !== moi ? lui : sc.partenaires[aile < 50 ? 1 : 0];
      const cx = 262, cy = aile < 50 ? 56 : 44;
      aller(recv, cx - 4.5, cy, 520); aller(sc.eux.def[2], cx + 6, cy + (aile < 50 ? 8 : -8), 560);
      await attendre(90); touche(); await lober(B, cx, cy, 520, 11);
      if (lui && lui !== moi) sc.porteur = suivant.ji; else sc.porteur = null;
      break;
    }
    case 'tete':
    case 'frappe': {
      const final = !suivant || (sc.buteur === c.ji && !sc.pts.slice(sc.i).some(p => p.c.t === 'frappe' || p.c.t === 'tete'));
      if (final) {
        // le tireur se met en position et contrôle : le tir partira avec le résultat
        const tx = c.t === 'tete' ? 262 : borne(Math.max(moi.x, 238), 230, 248), ty = c.t === 'tete' ? 50 : borne(moi.y, 34, 66);
        sc.dire(0, 0, `${nom} · ${c.t === 'tete' ? 'tête' : meme ? 'reprise' : 'frappe'}`);
        await Promise.all([aller(moi, tx - 4.5, ty, 380), aller(B, tx, ty, 380)]);
        if (c.t === 'tete') sauter(moi, 260);
        touche();
        sc.tireur = { o: moi, t: c.t, ji: c.ji }; sc.porteur = c.ji;
      } else {
        // tir contré par un défenseur : le ballon revient au joueur suivant (ou au même : reprise)
        sc.dire(0, 0, `${nom} · ${c.t === 'tete' ? 'tête' : 'frappe'} contrée`);
        const d = sc.eux.def[0]; aller(d, moi.x + 14, moi.y, 240);
        await attendre(150); touche(); Son.frappe();
        await aller(B, moi.x + 13, moi.y, 160, frappe); vaciller(d, 260);
        const vers = lui || moi; await passerA(sc, { x: moi.x + 13, y: moi.y }, vers, 300);
        sc.porteur = (suivant || c).ji;
      }
      break;
    }
    default: touche(); await aller(moi, moi.x + 12, moi.y, 300);
  }
}

async function gesteDefense(sc, c, moi, nom, meme, touche) {
  const B = sc.ballon, P = sc.eux.porteur;
  // leur porteur avance vers notre but à chaque geste
  const nx = Math.max(58, P.x - 26), ny = 50 + (P.y - 50) * 0.7;
  const avance = Promise.all([aller(P, nx, ny, 520), aller(B, nx - 4.5, ny, 520)]);
  switch (c.t) {
    case 'marquage': {
      sc.dire(0, 0, `${nom} · marquage`);
      const cible = sc.eux.appui.reduce((a, b) => (Math.abs(b.x - nx) < Math.abs(a.x - nx) ? b : a));
      aller(cible, Math.max(70, cible.x - 22), cible.y, 520);
      await attendre(160); touche();
      await aller(moi, Math.max(64, cible.x - 28), cible.y + (cible.y < 50 ? 5 : -5), 460);
      await avance;
      break;
    }
    case 'interception': {
      sc.dire(0, 0, `${nom} · interception`);
      await avance;
      const ap = sc.eux.appui[0], mx = (P.x + ap.x) / 2, my = (P.y + ap.y) / 2;
      aller(moi, mx, my, 340);
      await attendre(140); Son.touche();
      await aller(B, mx + 3, my, 260, frappe); touche(); // passe coupée
      await aller(B, pied(sc, P).x, P.y, 320, frappe); // le ballon repart vers leur porteur, plus lent
      break;
    }
    case 'tacle': {
      sc.dire(0, 0, `${nom} · tacle`);
      await avance;
      await aller(moi, P.x - 5, P.y + 4, 300);
      touche();
      await Promise.all([vaciller(P, 360), aller(B, P.x - 2, P.y - 8, 220, frappe)]);
      await aller(B, pied(sc, P).x, P.y, 260); // il récupère de justesse
      aller(moi, moi.x - 6, moi.y + 4, 260);
      break;
    }
    case 'gardien': {
      sc.dire(0, 0, `${nom} · ${meme ? 'double parade' : 'parade'}`);
      await avance;
      await aller(moi, 14, borne(P.y, 44, 56), 300); // il se place face au tireur
      touche(); await sauter(moi, 280);
      break;
    }
    default: touche(); await avance;
  }
}

// fin de l'action selon le résultat. Renvoie true si le son du résultat a déjà été joué ici.
async function finAction(sc, issue) {
  if (!sc) return false;
  const B = sc.ballon;
  Object.values(sc.joueurs).forEach(o => sc.allumer(o, false));
  if (sc.att) {
    if (issue === 'occasion') { if (sc.tireur) sc.allumer(sc.tireur.o, true); sc.dire(0, 0, 'Occasion !'); await attendre(300); return false; }
    if (issue !== 'but' && issue !== 'rate') return false;
    // le tireur : celui qui a préparé le tir, sinon le buteur désigné, qui reçoit d'abord le ballon
    let t = sc.tireur ? sc.tireur.o : null;
    if (!t) {
      t = sc.joueurs[sc.buteur] || sc.joueurs[sc.porteur] || Object.values(sc.joueurs)[0];
      const tx = borne(Math.max(t.x, 236), 230, 246), ty = borne(t.y, 36, 64);
      await aller(t, tx - 4.5, ty, 300); Son.touche(); await aller(B, tx, ty, 260, frappe);
    }
    sc.allumer(t, true);
    const gk = sc.eux.gk, haut = t.y < 50;
    const vy = issue === 'but' ? (haut ? 56 : 44) : borne(t.y, 44, 56); // il vise le côté opposé
    Son.frappe();
    if (issue === 'but') {
      sc.dire(0, 0, 'Frappe…');
      aller(gk, 289, haut ? 42 : 58, 300); // plongeon du mauvais côté
      await aller(B, 297, vy, 300, frappe);
      Son.but(); sc.dire(0, 0, 'BUT !'); sc.ov.classList.add('but');
      await aller(B, 299, vy + (vy > 50 ? 1 : -1), 160);
      return true;
    }
    sc.dire(0, 0, 'Frappe…');
    const parade = aller(gk, 287, vy, 260);
    await aller(B, 285, vy, 280, frappe); await parade;
    Son.perdu(); sc.dire(0, 0, 'Arrêté par le gardien');
    await aller(B, 289, vy, 120);
    return true;
  }
  // défense
  const P = sc.eux.porteur, G = sc.gardien;
  // avant de tirer, leur porteur s'approche de la surface
  const approche = async () => { if (P.x > 72) await Promise.all([aller(P, 72, borne(P.y, 38, 62), 420), aller(sc.ballon, 67.5, borne(P.y, 38, 62), 420)]); };
  if (issue === 'stoppe') {
    const gk = sc.pts.some(p => p.c.t === 'gardien') && sc.pts[sc.pts.length - 1].c.t === 'gardien';
    if (gk) {
      await approche(); sc.allumer(G, true); sc.dire(0, 0, 'Ils tirent…'); Son.frappe();
      const vy = borne(P.y, 44, 56); aller(G, 12, vy, 220);
      await aller(B, 16, vy, 300, frappe); Son.arret(); sc.dire(0, 0, 'Arrêt !'); sauter(G, 260);
      return true;
    }
    // le dernier défenseur qui a joué récupère le ballon et relance
    const d = sc.joueurs[sc.pts[sc.pts.length - 1].c.ji]; sc.allumer(d, true);
    await aller(d, P.x - 5, P.y + 3, 260);
    Son.arret(); sc.dire(0, 0, 'Ballon récupéré !');
    await Promise.all([vaciller(P, 300), aller(B, d.x + 4.5, d.y, 200, frappe)]);
    await Promise.all([aller(d, d.x + 30, d.y, 420), aller(B, d.x + 34.5, d.y, 420)]);
    return true;
  }
  if (issue === 'tirAdverse') {
    await approche(); sc.dire(0, 0, 'Ils tirent !');
    await Promise.all([aller(P, Math.max(40, P.x - 12), P.y, 300), aller(B, Math.max(35.5, P.x - 16.5), P.y, 300)]);
    return false;
  }
  if (issue === 'butAdverse') {
    await approche(); sc.dire(0, 0, 'Ils tirent…'); Son.frappe();
    const vy = P.y < 50 ? 56 : 44; aller(G, 12, P.y < 50 ? 42 : 58, 260);
    await aller(B, 3, vy, 320, frappe); Son.perdu(); sc.dire(0, 0, 'But adverse');
    return true;
  }
  return false;
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
  finirAnims();
  const ov = SCENE && SCENE.ov; if (!ov) return;
  ov.classList.remove('on'); setTimeout(() => ov.remove(), 260); SCENE.ov = null;
}
