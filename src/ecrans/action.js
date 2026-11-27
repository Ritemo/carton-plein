// =====================================================================
// L'ACTION EN IMAGES : le match vu d'en haut, comme à la télé
// =====================================================================
// Chaque carte jouée devient un geste : passe, course, dribble, centre, tête, frappe ;
// en défense : marquage, interception, tacle, parade.
// Règles de finition :
// - le ballon va toujours vers un joueur (coéquipier, adversaire, gardien) ou dans le filet ;
// - les points, le son et l'effet visuel tombent au contact du ballon ;
// - le tir final part avec le résultat ; le son du but arrive quand le ballon touche le filet ;
// - une caméra suit le ballon et se rapproche du but au moment du tir (ralenti).
// Le terrain est dessiné à la verticale (on attaque vers le haut). Les gestes raisonnent
// en coordonnées « terrain » : x de 0 (notre but) à 300 (le leur), y de 0 à 100 (largeur).
const ORDRE_GESTE = { passe: 0, course: 1, dribble: 1, centre: 2, tete: 3, frappe: 3, marquage: 0, interception: 1, tacle: 2, gardien: 3 };
const NS = 'http://www.w3.org/2000/svg';
let SCENE = null;
// Rythme : LENT multiplie toutes les durées. Toucher l'écran accélère sans à-coup.
let LENT = 1.5;
const LENT_NORMAL = 1.5, LENT_RAPIDE = 0.55;
const plusTard = (f, ms) => setTimeout(f, ms * LENT); // compatibilité

function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v)); if (parent) parent.appendChild(e); return e; }
const proj = (x, y) => [y * 1.9, 300 - x];
const borne = (v, a, b) => Math.max(a, Math.min(b, v));
const hasardFx = (a, b) => a + Math.random() * (b - a);

// ---------- horloge d'animation : une seule boucle, accélérable ----------
const ANIM = { tw: new Set(), continu: new Set(), raf: 0, last: 0 };
function boucleAnim(now) {
  const brut = Math.min(50, now - ANIM.last), dt = brut / LENT; ANIM.last = now;
  ANIM.tw.forEach(tw => { tw.t += tw.reel ? brut : dt; const u = Math.min(1, tw.t / tw.d); tw.step(u); if (u >= 1) { ANIM.tw.delete(tw); tw.res(); } });
  ANIM.continu.forEach(f => f(dt, brut));
  ANIM.raf = ANIM.tw.size || ANIM.continu.size ? requestAnimationFrame(boucleAnim) : 0;
}
function demarrerAnim() { if (!ANIM.raf) { ANIM.last = performance.now(); ANIM.raf = requestAnimationFrame(boucleAnim); } }
function tween(d, step, reel) { return new Promise(res => { ANIM.tw.add({ t: 0, d: Math.max(1, d), step, res, reel }); demarrerAnim(); }); }
function finirAnims() { ANIM.tw.forEach(tw => { try { tw.step(1); } catch (e) { } tw.res(); }); ANIM.tw.clear(); ANIM.continu.clear(); if (ANIM.raf) cancelAnimationFrame(ANIM.raf); ANIM.raf = 0; }
const attendre = d => tween(d, () => { });
const doux = u => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const frappe = u => 1 - Math.pow(1 - u, 2.2);
// au contact : le son part maintenant, et l'image attend le temps que le son sorte du haut-parleur
async function contact(fn) { fn(); const l = Son.latence() * 1000; if (l > 15) await sleep(l); }

// ---------- objets du terrain ----------
function poser(o, x, y) {
  const dx = x - o.x, dy = y - o.y; o.x = x; o.y = y;
  const [sx, sy] = proj(x, y); o.g.setAttribute('transform', `translate(${sx.toFixed(1)},${sy.toFixed(1)})`);
  const d = Math.hypot(dx, dy * 1.9);
  if (o.nez && d > 0.08) {
    o.ang = Math.atan2(-dx, dy * 1.9) * 180 / Math.PI; o.nez.setAttribute('transform', `rotate(${o.ang.toFixed(0)})`);
    o.phase = (o.phase || 0) + d * 0.7; o.bob.setAttribute('transform', `scale(${(1 + 0.07 * Math.abs(Math.sin(o.phase))).toFixed(3)})`);
  }
  if (o.motif && d > 0.02) { o.rot = (o.rot || 0) + d * 22; o.motif.setAttribute('transform', `rotate(${(o.rot % 360).toFixed(0)})`); }
}
const ecran = o => proj(o.x, o.y);
function aller(o, x, y, d, e) { const x0 = o.x, y0 = o.y; e = e || doux; return tween(d, u => { const k = e(u); poser(o, x0 + (x - x0) * k, y0 + (y - y0) * k); }); }
// le son part quand le ballon arrive à l'œil (92 % du trajet), en avance de la latence du haut-parleur
function allerSon(o, x, y, d, e, fn) {
  e = e || doux; let uc = 1; for (let u = 0; u <= 1; u += 0.01) if (e(u) >= 0.92) { uc = u; break; }
  const x0 = o.x, y0 = o.y; let fait = false;
  return tween(d, u => {
    const k = e(u); poser(o, x0 + (x - x0) * k, y0 + (y - y0) * k);
    if (!fait && u >= uc - Son.latence() * 1000 / (d * LENT)) { fait = true; fn(); }
  }).then(() => { if (!fait) fn(); });
}
function hauteur(b, h) { b.h = h; b.corps.setAttribute('transform', `translate(0,${(-h).toFixed(2)}) scale(${(1 + h * 0.05).toFixed(3)})`); b.ombre.setAttribute('opacity', Math.max(0.12, 0.42 - h * 0.025).toFixed(2)); }
function lober(b, x, y, d, h) { const x0 = b.x, y0 = b.y; return tween(d, u => { const k = doux(u); poser(b, x0 + (x - x0) * k, y0 + (y - y0) * k); hauteur(b, 4 * u * (1 - u) * h); }); }
function sauter(o, d) { return tween(d || 260, u => o.saut.setAttribute('transform', `scale(${(1 + 0.35 * Math.sin(Math.PI * u)).toFixed(3)})`)); }
function vaciller(o, d) { const x0 = o.x, y0 = o.y; return tween(d || 300, u => poser(o, x0 + Math.sin(u * Math.PI * 5) * 2 * (1 - u), y0)); }

// ---------- couleurs ----------
const rgbDe = h => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(h || ''); return m ? m.slice(1).map(x => parseInt(x, 16)) : [128, 128, 128]; };
const ecart = (a, b) => { const x = rgbDe(a), y = rgbDe(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
const clair = h => { const [r, g, b] = rgbDe(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6; };
// maillot adverse : sa couleur, sinon sa deuxième, sinon rouge ou noir, jamais confondu avec le mien
function maillotAdverse(moi, eq) {
  for (const c of [eq.c1, eq.c2, '#c62828', '#1b1f2a']) if (c && ecart(c, moi) > 150 && ecart(c, '#ffffff') > 120) return c; // jamais blanc : c'est la couleur du ballon
  return '#1b1f2a';
}

// ---------- décor ----------
function dessinerTerrain(cam, c1, c2) {
  const defs = el('defs', {}, cam);
  defs.innerHTML = `<radialGradient id="taLum" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></radialGradient>
    <pattern id="taFilet" width="3" height="3" patternUnits="userSpaceOnUse"><path d="M0 0H3M0 0V3" stroke="rgba(255,255,255,.55)" stroke-width=".45" fill="none"/></pattern>`;
  // tribunes et public aux couleurs du club qui reçoit
  el('rect', { x: -60, y: -60, width: 310, height: 420, fill: '#1a1238' }, cam);
  const foule = el('g', { class: 'ta-foule' }, cam), coul = [c1, c1, c1, c2, c2, '#f1f1f1', '#3a3560', '#5b4f8a'];
  const point = (x, y) => el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 1.9, fill: coul[Math.floor(Math.random() * coul.length)] }, foule);
  for (let r = 0; r < 3; r++) {
    for (let y = -36; y <= 336; y += 5.5) { point(-14 - r * 6 + hasardFx(-0.6, 0.6), y); point(204 + r * 6 + hasardFx(-0.6, 0.6), y); }
    for (let x = -8; x <= 198; x += 5.5) { point(x, -18 - r * 6 + hasardFx(-0.6, 0.6)); point(x, 318 + r * 6 + hasardFx(-0.6, 0.6)); }
  }
  el('rect', { x: -7, y: -9, width: 204, height: 318, rx: 3, fill: '#267a3c' }, cam);
  // pelouse tondue en bandes
  for (let i = 0; i < 12; i++) el('rect', { x: 0, y: i * 25, width: 190, height: 25, fill: i % 2 ? '#2e9a4b' : '#33a552' }, cam);
  el('rect', { x: 0, y: 0, width: 190, height: 300, fill: 'url(#taLum)' }, cam);
  const L = el('g', { fill: 'none', stroke: 'rgba(255,255,255,.85)', 'stroke-width': 0.9 }, cam);
  el('rect', { x: 1, y: 1, width: 188, height: 298 }, L);
  el('line', { x1: 1, y1: 150, x2: 189, y2: 150 }, L); el('circle', { cx: 95, cy: 150, r: 24 }, L);
  el('circle', { cx: 95, cy: 150, r: 1.2, fill: 'rgba(255,255,255,.85)' }, L);
  el('rect', { x: 38, y: 1, width: 114, height: 44 }, L); el('rect', { x: 66, y: 1, width: 58, height: 15 }, L);
  el('circle', { cx: 95, cy: 32, r: 1, fill: 'rgba(255,255,255,.85)' }, L); el('path', { d: 'M 77.3 45 A 22 22 0 0 0 112.7 45' }, L);
  el('rect', { x: 38, y: 255, width: 114, height: 44 }, L); el('rect', { x: 66, y: 284, width: 58, height: 15 }, L);
  el('circle', { cx: 95, cy: 268, r: 1, fill: 'rgba(255,255,255,.85)' }, L); el('path', { d: 'M 77.3 255 A 22 22 0 0 1 112.7 255' }, L);
  ['M1 5 A4 4 0 0 0 5 1', 'M185 1 A4 4 0 0 0 189 5', 'M1 295 A4 4 0 0 1 5 299', 'M185 299 A4 4 0 0 1 189 295'].forEach(d => el('path', { d }, L));
  // les buts, avec un filet qui peut se gonfler
  const but = (haut) => {
    const g = el('g', { transform: `translate(95,${haut ? 0 : 300})` }, cam), filet = el('g', {}, g), s = haut ? -1 : 1;
    el('rect', { x: -17, y: haut ? -9 : 0, width: 34, height: 9, fill: 'url(#taFilet)', stroke: 'rgba(255,255,255,.7)', 'stroke-width': 0.5 }, filet);
    el('path', { d: `M-17 0 V${9 * s} H17 V0`, fill: 'none', stroke: '#fff', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, g);
    return filet;
  };
  return { filetHaut: but(true), filetBas: but(false), foule };
}
// météo par-dessus la caméra
function meteoScene(racine, met) {
  const g = el('g', { class: 'ta-meteo', 'pointer-events': 'none' }, racine), parts = [];
  if (met === 'nocturne') {
    g.innerHTML = `<defs><radialGradient id="taSpot"><stop offset="0" stop-color="#fff7c2" stop-opacity=".45"/><stop offset="1" stop-color="#fff7c2" stop-opacity="0"/></radialGradient></defs>`;
    el('rect', { x: 0, y: 0, width: 190, height: 300, fill: '#050525', opacity: 0.44 }, g);
    [[0, 0], [190, 0], [0, 300], [190, 300]].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 120, fill: 'url(#taSpot)' }, g));
    return null;
  }
  if (met === 'soleil') { el('rect', { x: 0, y: 0, width: 190, height: 300, fill: '#fff3b0', opacity: 0.06 }, g); return null; }
  const n = { pluie: 38, neige: 42, vent: 9 }[met] || 0;
  if (met === 'pluie') el('rect', { x: 0, y: 0, width: 190, height: 300, fill: '#0b2a4a', opacity: 0.18 }, g);
  for (let i = 0; i < n; i++) {
    const p = { x: hasardFx(-20, 200), y: hasardFx(-10, 310), v: hasardFx(0.8, 1.2) };
    p.e = met === 'pluie' ? el('line', { x1: 0, y1: 0, x2: -2, y2: 7, stroke: 'rgba(200,225,255,.55)', 'stroke-width': 0.7 }, g)
      : met === 'neige' ? el('circle', { r: hasardFx(0.7, 1.6), fill: '#fff', opacity: 0.85 }, g)
        : el('line', { x1: 0, y1: 0, x2: 16, y2: 0, stroke: 'rgba(255,255,255,.28)', 'stroke-width': 0.8, 'stroke-linecap': 'round' }, g);
    parts.push(p);
  }
  return (dt, brut) => parts.forEach(p => {
    if (met === 'pluie') { p.y += brut * 0.42 * p.v; p.x -= brut * 0.11 * p.v; }
    else if (met === 'neige') { p.y += brut * 0.035 * p.v; p.x += Math.sin((p.y + p.v * 50) / 18) * 0.15; }
    else { p.x += brut * 0.3 * p.v; }
    if (p.y > 310) { p.y = -10; p.x = hasardFx(-20, 210); } if (p.x > 215) { p.x = -20; p.y = hasardFx(0, 300); } if (p.x < -25) p.x = 210;
    p.e.setAttribute('transform', `translate(${p.x.toFixed(1)},${p.y.toFixed(1)})`);
  });
}

// ---------- effets ----------
function fxAnneau(sc, sx, sy, coul) {
  const c = el('circle', { cx: sx, cy: sy, r: 3, fill: 'none', stroke: coul || '#ffd23f', 'stroke-width': 1.6 }, sc.fx);
  tween(420, u => { c.setAttribute('r', (3 + 13 * frappe(u)).toFixed(1)); c.setAttribute('opacity', (1 - u).toFixed(2)); }, true).then(() => c.remove());
}
function fxPoints(sc, sx, sy, txt) {
  const t = el('text', { x: sx, y: sy - 12, class: 'fx-pts' }, sc.fx); t.textContent = txt;
  tween(1000, u => { t.setAttribute('y', (sy - 12 - 20 * frappe(u)).toFixed(1)); t.setAttribute('opacity', (u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4).toFixed(2)); }, true).then(() => t.remove());
}
function fxPoussiere(sc, sx, sy) {
  for (let i = 0; i < 8; i++) {
    const a = Math.random() * Math.PI * 2, d = hasardFx(6, 13), c = el('circle', { cx: sx, cy: sy, r: hasardFx(0.8, 1.6), fill: i % 2 ? '#e9e2c9' : '#a8d5a0' }, sc.fx);
    tween(460, u => { const k = frappe(u); c.setAttribute('cx', (sx + Math.cos(a) * d * k).toFixed(1)); c.setAttribute('cy', (sy + Math.sin(a) * d * k).toFixed(1)); c.setAttribute('opacity', (1 - u).toFixed(2)); }, true).then(() => c.remove());
  }
}
function fxTrace(sc, a, b) {
  const l = el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#fff', 'stroke-width': 1, 'stroke-dasharray': '2 3', 'stroke-linecap': 'round' }, sc.fxSous);
  tween(900, u => l.setAttribute('opacity', (0.7 * (1 - u)).toFixed(2)), true).then(() => l.remove());
}
function fxEtincelle(sc, sx, sy) {
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, l = el('line', { stroke: '#fff7c2', 'stroke-width': 1.3, 'stroke-linecap': 'round' }, sc.fx);
    tween(380, u => { const r1 = 4 + 8 * u, r2 = 6 + 12 * u; l.setAttribute('x1', sx + Math.cos(a) * r1); l.setAttribute('y1', sy + Math.sin(a) * r1); l.setAttribute('x2', sx + Math.cos(a) * r2); l.setAttribute('y2', sy + Math.sin(a) * r2); l.setAttribute('opacity', 1 - u); }, true).then(() => l.remove());
  }
}
function fxConfettis(sc, sx, sy, cols) {
  for (let i = 0; i < 46; i++) {
    const r = el('rect', { width: 2.4, height: 1.4, fill: cols[i % cols.length] }, sc.fx), vx = hasardFx(-38, 38), vy = hasardFx(-30, 8), rot = hasardFx(-720, 720);
    tween(1700, u => { const x = sx + vx * u, y = sy + vy * u + 70 * u * u; r.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${(rot * u).toFixed(0)})`); r.setAttribute('opacity', (1 - u * u).toFixed(2)); }, true).then(() => r.remove());
  }
}
function fxFilet(filet) { return tween(520, u => filet.setAttribute('transform', `scale(1,${(1 + 0.6 * Math.sin(Math.PI * Math.min(1, u * 1.6)) * (1 - u * 0.6)).toFixed(3)})`), true); }
function fxFoule(sc) { return tween(1500, u => sc.foule.setAttribute('transform', `translate(0,${(-1.6 * Math.abs(Math.sin(u * Math.PI * 6)) * (1 - u)).toFixed(2)})`), true); }
function banniere(sc, txt, cls) {
  const b = document.createElement('div'); b.className = 'ap-ban lil ' + (cls || ''); b.textContent = txt;
  sc.ov.querySelector('.ap-terrain').appendChild(b); setTimeout(() => b.remove(), 1900);
}
function eclair(sc) { const f = document.createElement('div'); f.className = 'ap-eclair'; sc.ov.querySelector('.ap-terrain').appendChild(f); setTimeout(() => f.remove(), 500); }

// ---------- commentaire ----------
const COMM = {
  passe: ['{n} trouve {m}', '{n} glisse le ballon à {m}', 'Passe propre de {n} pour {m}', '{n} lance {m}'],
  passeVa: ['{n} joue en appui et repart', 'Passe et va de {n}'],
  uneDeux: ['Une-deux pour {n} !', '{n} combine et file'],
  course: ['{n} s’envole balle au pied', '{n} prend le couloir', 'Accélération de {n}'],
  longue: ['{n} traverse le terrain !', 'Quelle chevauchée de {n} !'],
  dribble: ['{n} efface son vis-à-vis', 'Crochet de {n} !', '{n} élimine son défenseur'],
  double: ['{n} en dribble deux !', 'Double crochet de {n} !'],
  centre: ['Centre de {n}…', '{n} déborde et centre', 'Ballon brossé de {n}'],
  tete: ['{n} s’élève…', '{n} attaque le ballon de la tête'],
  frappe: ['{n} arme sa frappe…', '{n} se met en position de tir', '{n} ajuste…'],
  contre: ['Frappe de {n}, contrée !', '{n} tente, ça rebondit'],
  marquage: ['{n} colle son attaquant', '{n} ne lâche pas son homme'],
  interception: ['{n} coupe la trajectoire !', 'Interception de {n} !'],
  tacle: ['Tacle de {n} !', '{n} glisse et gêne le porteur'],
  gardien: ['{n} se place sur sa ligne', '{n} est prêt'],
  doubleParade: ['{n} est sur tous les ballons', '{n} se démultiplie']
};
const phrase = (k, n, m) => { const L = COMM[k]; return L[Math.floor(Math.random() * L.length)].replace('{n}', n).replace('{m}', m || ''); };
const nomCourt = ji => { const n = (C.effectif[ji] || {}).nom || ''; const p = n.split(' '); return p.length > 1 ? p.slice(1).join(' ') : n; };

// ---------- jetons de joueurs ----------
function jeton(sc, x, y, o) {
  const g = el('g', { class: 'tk' + (o.part ? ' part' : '') }, sc.calque);
  el('ellipse', { cx: 1.3, cy: 2.2, rx: 6.4, ry: 5.4, fill: '#000', opacity: 0.32 }, g);
  el('circle', { r: 9.8, class: 'tk-anneau' }, g);
  const saut = el('g', {}, g), bob = el('g', {}, saut), nez = el('g', {}, bob);
  el('path', { d: 'M5.6 -2.8 L9.2 0 L5.6 2.8 Z', fill: o.c2, stroke: '#000', 'stroke-width': 0.5 }, nez);
  el('circle', { r: 6.2, fill: o.c1, stroke: o.c2, 'stroke-width': 1.7 }, bob);
  if (o.num != null) { const t = el('text', { y: 2.1, class: 'tk-num', fill: clair(o.c1) ? '#111' : '#fff' }, bob); t.textContent = o.num; }
  if (o.nom) {
    const tag = el('g', { class: 'tk-tag', transform: 'translate(0,-14)' }, g), w = o.nom.length * 3.3 + 8;
    el('rect', { x: -w / 2, y: -5, width: w, height: 9, rx: 4.5, fill: '#120a33', stroke: '#ffd23f', 'stroke-width': 0.6 }, tag);
    const t = el('text', { y: 1.8, class: 'tk-nom' }, tag); t.textContent = o.nom;
    var etiquette = (nom) => { const w2 = nom.length * 3.3 + 8; tag.firstChild.setAttribute('x', -w2 / 2); tag.firstChild.setAttribute('width', w2); t.textContent = nom; };
  }
  const j = { g, saut, bob, nez, x, y, joueur: true, etiquette }; poser(j, x, y); j.nez.setAttribute('transform', `rotate(${o.vers || -90})`); return j;
}

function creerScene(r) {
  if (!r.valides.length) return null;
  LENT = (() => { try { return localStorage.getItem('carton-plein-rapide') ? 0.2 : LENT_NORMAL; } catch (e) { return LENT_NORMAL; } })();
  finirAnims();
  const att = enAttaque();
  const pts = [...r.pts].sort((a, b) => (ORDRE_GESTE[a.c.t] ?? 2) - (ORDRE_GESTE[b.c.t] ?? 2));
  const buteur = att ? buteurDe(r) : null;
  if (att) { const k = pts.findIndex(p => (p.c.t === 'frappe' || p.c.t === 'tete') && p.c.ji === buteur); if (k >= 0) pts.push(pts.splice(k, 1)[0]); }
  const ancien = $('#actionPlein'); if (ancien) ancien.remove();
  const ov = document.createElement('div'); ov.id = 'actionPlein';
  const R = refCible(), sb = att ? seuilBut() : 1, F = S.fourchette;
  const reperes = S.comp === 'direct' ? '' : F ? `<span class="ap-bande" style="left:${F[0] * sb / R / 1.3 * 100}%;width:${(F[1] - F[0]) * sb / R / 1.3 * 100}%"></span>` : `<span class="ap-rep" style="left:${sb * 100 / 1.3}%"></span><span class="ap-rep occ" style="left:${70 / 1.3}%"></span>`;
  const eqP = S.eq.p, eqA = S.eq.ia;
  ov.innerHTML = `<div class="ap-haut lil">${att ? 'Ton attaque' : 'Ta défense'} · ${r.combo.nom}</div>
    <div class="ap-terrain">
      <div class="ap-score"><b class="lil">${eqP.court}</b><span class="lil" id="apSc">${S.score.p} - ${S.score.ia}</span><b class="lil">${eqA.court}</b><i>${S.minute || 0}’</i></div>
      <div class="ap-comm" id="apLeg">&nbsp;</div>
    </div>
    <div class="ap-cartes">${pts.map((p, i) => `<span class="ap-ch k-${couleurCarte(p.c)}" data-i="${i}">${img(ICT[p.c.t] || 'ballon', 'mini-ic')}<b>+${p.v}</b></span>`).join('')}</div>
    <div class="ap-calc lil"><span id="apPts">0</span><small>points</small><b>×</b><span id="apMult">${fmt(r.combo.mult)}</span><small>combo</small><b>=</b><span id="apTot" class="tot">?</span></div>
    <div class="ap-jauge"><i id="apFill"></i>${reperes}</div>
    <div class="ap-cible">${S.comp === 'direct' ? 'Contre le choix de ton adversaire' : att ? `Mur : ${F ? `${F[0]} à ${F[1]}` : S.cible}` : `Leur attaque : ${F ? `${F[0]} à ${F[1]}` : S.cible}`}</div>
    <div class="ap-astuce">Touche l’écran pour accélérer</div>`;
  document.body.appendChild(ov);
  ov.onpointerdown = () => { LENT = Math.min(LENT, LENT_RAPIDE); ov.querySelector('.ap-astuce').style.opacity = 0; };
  requestAnimationFrame(() => ov.classList.add('on'));

  // couleurs : mes maillots, les leurs, les gardiens
  // maillot blanc : on prend la deuxième couleur, pour ne jamais confondre un joueur avec le ballon
  const blanc = c => ecart(c || '#888888', '#ffffff') <= 120;
  const moiC1 = blanc(eqP.c1) ? (eqP.c2 && !blanc(eqP.c2) ? eqP.c2 : '#2f7de1') : (eqP.c1 || '#2f7de1'), moiC2 = blanc(eqP.c1) ? '#ffffff' : (eqP.c2 && ecart(eqP.c2, moiC1) > 60 ? eqP.c2 : (clair(moiC1) ? '#1c1240' : '#ffffff'));
  const euxC1 = maillotAdverse(moiC1, eqA), euxC2 = euxC1 === eqA.c1 && eqA.c2 && ecart(eqA.c2, euxC1) > 60 ? eqA.c2 : (clair(euxC1) ? '#111' : '#fff');
  const gkMoi = ['#7ee081', '#111'], gkEux = ['#ffb703', '#111'];
  const domicile = S.dom ? eqP : eqA;

  const racine = el('svg', { viewBox: '0 0 190 300', class: 'terrain-action', 'aria-label': 'L’action sur le terrain' }, ov.querySelector('.ap-terrain'));
  const cam = el('g', {}, racine);
  const decor = dessinerTerrain(cam, domicile.c1 || '#888', domicile.c2 || '#ddd');
  const sc = { ov, att, pts, buteur, i: 0, dernier: null, porteur: null, tireur: null, joueurs: {}, partenaires: [], eux: {} };
  sc.foule = decor.foule; sc.filetHaut = decor.filetHaut; sc.filetBas = decor.filetBas;
  sc.fxSous = el('g', {}, cam); sc.trace = el('polyline', { fill: 'none', stroke: '#fff', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.45 }, cam);
  sc.calque = el('g', {}, cam);
  const calqueBallon = el('g', {}, cam); sc.fx = el('g', {}, cam);
  const meteo = meteoScene(racine, S.meteo);

  // mes joueurs (ceux qui ont une carte), à leur poste
  const POSTE_ATT = { 'Défenseur': [122, [40, 60]], 'Latéral': [150, [14, 86]], 'Milieu': [172, [38, 62]], 'Meneur': [192, [50]], 'Ailier': [214, [16, 84]], 'Buteur': [230, [50]] };
  const POSTE_DEF = { 'Défenseur': [52, [40, 60]], 'Latéral': [66, [16, 84]], 'Milieu': [98, [36, 64]], 'Meneur': [112, [50]], 'Ailier': [126, [18, 82]], 'Buteur': [140, [50]] };
  const LIGNE = { DEF: 'Défenseur', MIL: 'Milieu', ATT: 'Buteur' }, vus = {}, places = [];
  pts.forEach(({ c }) => {
    if (sc.joueurs[c.ji]) return;
    const j = C.effectif[c.ji] || { l: 'MIL' };
    let x, y;
    if (j.p === 'Gardien' || c.t === 'gardien') { x = 8; y = 50; }
    else {
      const P = (att ? POSTE_ATT : POSTE_DEF)[j.p] || (att ? POSTE_ATT : POSTE_DEF)[LIGNE[j.l] || 'Milieu'];
      const k = vus[j.p] = (vus[j.p] || 0) + 1; x = P[0]; y = P[1][(k - 1) % P[1].length];
      while (places.some(p => Math.abs(p[0] - x) < 9 && Math.abs(p[1] - y) < 9)) { y = y > 50 ? y - 12 : y + 12; x += 4; }
    }
    const gk = j.p === 'Gardien' || c.t === 'gardien';
    // un seul gardien dans le but : si deux gardiens ont une carte, ils partagent le même jeton
    if (gk && sc.jetonGardien) { sc.joueurs[c.ji] = sc.jetonGardien; return; }
    places.push([x, y]);
    sc.joueurs[c.ji] = jeton(sc, x, y, { c1: gk ? gkMoi[0] : moiC1, c2: gk ? gkMoi[1] : moiC2, num: c.ji + 1, nom: nomCourt(c.ji), vers: att ? -90 : 90 });
    if (gk) sc.jetonGardien = sc.joueurs[c.ji];
  });
  if (att) {
    const pris = new Set(Object.keys(sc.joueurs).map(ji => +ji + 1)), libres = [7, 11, 9, 10, 14, 17, 19, 21].filter(n => !pris.has(n));
    sc.partenaires = [jeton(sc, 200, 28, { c1: moiC1, c2: moiC2, num: libres[0], part: true }), jeton(sc, 204, 74, { c1: moiC1, c2: moiC2, num: libres[1], part: true })];
    const ad = (x, y) => jeton(sc, x, y, { c1: euxC1, c2: euxC2, vers: 90 });
    sc.eux = { gk: jeton(sc, 291, 50, { c1: gkEux[0], c2: gkEux[1], vers: 90 }), def: [ad(252, 36), ad(254, 64), ad(234, 50)], mil: [ad(206, 22), ad(198, 78)] };
  } else {
    sc.gardien = sc.jetonGardien || jeton(sc, 8, 50, { c1: gkMoi[0], c2: gkMoi[1], num: 1, part: true, vers: 90 });
    const ad = (x, y) => jeton(sc, x, y, { c1: euxC1, c2: euxC2, vers: 90 });
    sc.eux = { porteur: ad(200, 50), appui: [ad(178, 24), ad(170, 76)], fond: [ad(238, 38), ad(242, 64)] };
  }
  // ballon : ombre au sol, ballon qui peut monter, motif qui tourne quand il roule
  const B = { g: el('g', {}, calqueBallon), x: 0, y: 0, h: 0 };
  B.ombre = el('ellipse', { cx: 1, cy: 1.6, rx: 2.8, ry: 2.2, fill: '#000', opacity: 0.42 }, B.g);
  B.corps = el('g', {}, B.g); el('circle', { r: 2.9, fill: '#fff', stroke: '#111', 'stroke-width': 0.6 }, B.corps);
  B.motif = el('g', {}, B.corps); [[0, 0, 1], [1.8, -1.2, 0.6], [-1.7, 1.1, 0.6], [0.4, 2, 0.5]].forEach(([x, y, r]) => el('circle', { cx: x, cy: y, r, fill: '#111' }, B.motif));
  sc.ballon = B;
  if (att) { sc.porteur = pts[0].c.ji; const p = sc.joueurs[sc.porteur]; poser(B, p.x + 4.5, p.y); }
  else poser(B, sc.eux.porteur.x - 4.5, sc.eux.porteur.y);

  // caméra : suit le ballon avec un peu d'avance vers le but, se rapproche au moment du tir
  const [bx, by] = ecran(B);
  sc.cam = { x: bx, y: by + (att ? -30 : 30), z: 1.22, tz: 1.22, shake: 0, focus: null };
  const hist = [];
  ANIM.continu.add((dt, brut) => {
    const K = sc.cam, [sx, sy] = ecran(B);
    const [tx, ty] = K.focus || [sx * 0.85 + 95 * 0.15, sy + (att ? -32 : 32)];
    const k = 1 - Math.exp(-dt / 230);
    K.x += (tx - K.x) * k; K.y += (ty - K.y) * k; K.z += (K.tz - K.z) * (1 - Math.exp(-dt / 320));
    const hw = 95 / K.z, hh = 150 / K.z;
    const cx = hw - 14 > 190 - hw + 14 ? 95 : borne(K.x, hw - 14, 190 - hw + 14), cy = borne(K.y, hh - 24, 300 - hh + 24);
    const ox = K.shake ? hasardFx(-K.shake, K.shake) : 0, oy = K.shake ? hasardFx(-K.shake, K.shake) : 0;
    K.shake = K.shake > 0.05 ? K.shake * Math.exp(-brut / 140) : 0;
    cam.setAttribute('transform', `translate(95,150) scale(${K.z.toFixed(3)}) translate(${(-cx + ox).toFixed(2)},${(-cy + oy).toFixed(2)})`);
    // traînée du ballon quand il va vite
    hist.push([sx, sy - (B.h || 0)]); if (hist.length > 7) hist.shift();
    const v = Math.hypot(hist[hist.length - 1][0] - hist[0][0], hist[hist.length - 1][1] - hist[0][1]);
    sc.trace.setAttribute('points', v > 14 ? hist.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') : '');
  });
  if (meteo) ANIM.continu.add(meteo);
  demarrerAnim();
  const legende = ov.querySelector('#apLeg');
  sc.dire = (x, y, txt) => { legende.textContent = txt; legende.classList.remove('ta-pop'); void legende.offsetWidth; legende.classList.add('ta-pop'); };
  sc.actif = o => { sc.calque.querySelectorAll('.tk.actif').forEach(e => e.classList.remove('actif')); if (o) o.g.classList.add('actif'); };
  return sc;
}

const pied = (sc, o) => ({ x: o.x + (sc.att ? 4.5 : -4.5), y: o.y });
async function passerA(sc, vers, d, lob) {
  const cible = pied(sc, vers);
  fxTrace(sc, ecran(sc.ballon), proj(cible.x, cible.y));
  if (lob) await lober(sc.ballon, cible.x, cible.y, d, 9); else await aller(sc.ballon, cible.x, cible.y, d, frappe);
}
const plusProche = (L, o) => L.reduce((a, b) => (Math.hypot(b.x - o.x, b.y - o.y) < Math.hypot(a.x - o.x, a.y - o.y) ? b : a));

// un geste par carte ; impact() tombe au contact du ballon (points + son + effet)
async function gesteSuivant(sc, impact) {
  if (!sc || sc.i >= sc.pts.length) { if (impact) impact(); return; }
  const k = sc.i++, P = sc.pts[k], c = P.c, moi = sc.joueurs[c.ji], nom = nomCourt(c.ji), meme = sc.dernier === c.ji;
  const suivant = sc.pts[k + 1] ? sc.pts[k + 1].c : null, lui = suivant ? sc.joueurs[suivant.ji] : null;
  const puce = sc.ov.querySelector(`.ap-ch[data-i="${k}"]`); if (puce) puce.classList.add('en-cours');
  let fait = false;
  const touche = () => {
    if (fait) return; fait = true; if (impact) impact();
    const [sx, sy] = ecran(moi); fxAnneau(sc, sx, sy); fxPoints(sc, sx, sy, '+' + P.v);
    if (puce) { puce.classList.remove('en-cours'); puce.classList.add('fait'); }
  };
  sc.dernier = c.ji; sc.actif(moi); if (moi.etiquette) moi.etiquette(nom);
  try {
    if (sc.att) await gesteAttaque(sc, c, moi, nom, meme, suivant, lui, touche);
    else await gesteDefense(sc, c, moi, nom, meme, touche);
  } finally { touche(); }
  await attendre(140);
}

async function gesteAttaque(sc, c, moi, nom, meme, suivant, lui, touche) {
  const B = sc.ballon;
  // le ballon n'est pas à lui : un coéquipier lui donne d'abord
  if (sc.porteur !== c.ji) { await contact(() => Son.touche()); await passerA(sc, moi, 320); sc.porteur = c.ji; }
  // le milieu adverse se replace un peu à chaque geste
  sc.eux.mil.forEach(m => aller(m, Math.max(m.x - 6, 170), m.y + (moi.y - m.y) * 0.15, 600));
  switch (c.t) {
    case 'passe': {
      if (lui && lui !== moi) {
        sc.dire(0, 0, phrase('passe', nom, nomCourt(suivant.ji)));
        const rx = borne(lui.x + 10, 60, 250), ry = lui.y;
        aller(lui, rx, ry, 460);
        await attendre(90); await contact(touche); await passerA(sc, { x: rx, y: ry }, 380);
        sc.porteur = suivant.ji;
      } else {
        sc.dire(0, 0, phrase(meme ? 'uneDeux' : 'passeVa', nom));
        const p = sc.partenaires.reduce((a, b) => (Math.abs(b.y - moi.y) > Math.abs(a.y - moi.y) ? b : a));
        const px = borne(moi.x + 28, 60, 245), py = p.y < 50 ? 26 : 74;
        aller(p, px, py, 320);
        await contact(touche); await passerA(sc, { x: px, y: py }, 320);
        const nx = borne(moi.x + 40, 60, 250), course = aller(moi, nx, moi.y, 520);
        await attendre(150); await contact(() => Son.touche()); await passerA(sc, { x: nx, y: moi.y }, 360); await course;
      }
      break;
    }
    case 'course': {
      sc.dire(0, 0, phrase(meme ? 'longue' : 'course', nom));
      const nx = borne(moi.x + (meme ? 44 : 34), 60, 250), ny = moi.y;
      await contact(touche);
      const d = plusProche(sc.eux.def, { x: nx, y: ny }); aller(d, d.x - 4, d.y + (ny - d.y) * 0.3, 640);
      await Promise.all([aller(moi, nx, ny, 660), aller(B, nx + 7, ny, 640, doux)]);
      await aller(B, nx + 4.5, ny, 120);
      break;
    }
    case 'dribble': {
      sc.dire(0, 0, phrase(meme ? 'double' : 'dribble', nom));
      const d = plusProche(sc.eux.def, moi);
      const fx = borne(d.x - 14, 60, 240), fy = d.y, my = moi.y + (fy - moi.y) * 0.6;
      await Promise.all([aller(d, fx + 8, fy, 380), aller(moi, fx - 8, my, 380), aller(B, fx - 3.5, my, 380)]);
      const cote = fy > 50 ? -1 : 1, px = borne(fx + 18, 60, 250), py = borne(fy + cote * 16, 12, 88);
      await contact(touche);
      await Promise.all([aller(moi, px, py, 440), aller(B, px + 4.5, py, 440), vaciller(d, 440)]);
      aller(d, d.x - 6, d.y, 320);
      break;
    }
    case 'centre': {
      const aile = moi.y < 50 ? 12 : 88, wx = borne(moi.x + 24, 200, 254);
      sc.dire(0, 0, phrase('centre', nom));
      await Promise.all([aller(moi, wx, aile, 500), aller(B, wx + 4.5, aile, 500)]);
      const recv = lui && lui !== moi ? lui : sc.partenaires[aile < 50 ? 1 : 0];
      const cx = 263, cy = aile < 50 ? 56 : 44;
      aller(recv, cx - 4.5, cy, 560); aller(sc.eux.def[2], cx + 6, cy + (aile < 50 ? 8 : -8), 600);
      sc.cam.tz = 1.4;
      await attendre(100); await contact(touche); await lober(B, cx, cy, 560, 12);
      sc.porteur = lui && lui !== moi ? suivant.ji : null;
      break;
    }
    case 'tete':
    case 'frappe': {
      const final = !suivant || (sc.buteur === c.ji && !sc.pts.slice(sc.i).some(p => p.c.t === 'frappe' || p.c.t === 'tete'));
      if (final) {
        const tx = c.t === 'tete' ? 263 : borne(Math.max(moi.x, 238), 230, 248), ty = c.t === 'tete' ? borne(moi.y, 44, 56) : borne(moi.y, 34, 66);
        sc.dire(0, 0, phrase(c.t === 'tete' ? 'tete' : 'frappe', nom));
        sc.cam.tz = 1.55;
        const d = plusProche(sc.eux.def, { x: tx, y: ty }); aller(d, tx + 9, ty + (ty > 50 ? -5 : 5), 420);
        await Promise.all([aller(moi, tx - 4.5, ty, 400), aller(B, tx, ty, 400)]);
        if (c.t === 'tete') sauter(moi, 280);
        await contact(touche);
        sc.tireur = { o: moi, t: c.t, ji: c.ji }; sc.porteur = c.ji;
      } else {
        sc.dire(0, 0, phrase('contre', nom));
        const d = plusProche(sc.eux.def, moi); await aller(d, moi.x + 14, moi.y, 300);
        await contact(() => { touche(); Son.frappe(); });
        await aller(B, moi.x + 13, moi.y, 160, frappe); vaciller(d, 280);
        const [sx, sy] = ecran(B); fxPoussiere(sc, sx, sy);
        await passerA(sc, lui || moi, 320);
        sc.porteur = (suivant || c).ji;
      }
      break;
    }
    default: await contact(touche); await aller(moi, moi.x + 12, moi.y, 300);
  }
}

async function gesteDefense(sc, c, moi, nom, meme, touche) {
  const B = sc.ballon, P = sc.eux.porteur;
  const nx = Math.max(60, P.x - 26), ny = 50 + (P.y - 50) * 0.7;
  const avance = Promise.all([aller(P, nx, ny, 540), aller(B, nx - 4.5, ny, 540)]);
  sc.eux.appui.forEach(a => aller(a, Math.max(70, a.x - 18), a.y, 560));
  switch (c.t) {
    case 'marquage': {
      sc.dire(0, 0, phrase('marquage', nom));
      const cible = sc.eux.appui.reduce((a, b) => (Math.abs(b.x - nx) < Math.abs(a.x - nx) ? b : a));
      await attendre(170); await contact(touche);
      await aller(moi, Math.max(62, cible.x - 26), cible.y + (cible.y < 50 ? 5 : -5), 480);
      await avance;
      break;
    }
    case 'interception': {
      sc.dire(0, 0, phrase('interception', nom));
      await avance;
      const ap = sc.eux.appui[0], mx = (P.x + ap.x) / 2, my = (P.y + ap.y) / 2;
      aller(moi, mx, my, 360);
      await attendre(150); await contact(() => Son.touche());
      fxTrace(sc, ecran(B), proj(ap.x, ap.y));
      await allerSon(B, mx + 3, my, 280, frappe, touche);
      await aller(B, pied(sc, P).x, P.y, 340, frappe);
      break;
    }
    case 'tacle': {
      sc.dire(0, 0, phrase('tacle', nom));
      await avance;
      await allerSon(moi, P.x - 5, P.y + 4, 320, doux, touche);
      const [sx, sy] = ecran(P); fxPoussiere(sc, sx, sy);
      await Promise.all([vaciller(P, 380), aller(B, P.x - 2, P.y - 8, 220, frappe)]);
      await aller(B, pied(sc, P).x, P.y, 280);
      aller(moi, moi.x - 6, moi.y + 4, 280);
      break;
    }
    case 'gardien': {
      sc.dire(0, 0, phrase(meme ? 'doubleParade' : 'gardien', nom));
      await avance;
      await aller(moi, 9, borne(P.y, 44, 56), 320);
      await contact(touche); await sauter(moi, 300);
      break;
    }
    default: await contact(touche); await avance;
  }
}

// fin de l'action selon le résultat. Renvoie true si le son du résultat a été joué ici.
async function finAction(sc, issue) {
  if (!sc) return false;
  const B = sc.ballon, cols = [S.eq.p.c1 || '#ffd23f', S.eq.p.c2 || '#fff', '#ffd23f'];
  const majScore = (p, ia) => { const e = sc.ov.querySelector('#apSc'); if (e) { e.textContent = `${S.score.p + p} - ${S.score.ia + ia}`; e.classList.add('ap-tape'); } };
  if (sc.att) {
    if (issue === 'occasion') { if (sc.tireur) sc.actif(sc.tireur.o); sc.dire(0, 0, 'Occasion ! À toi de tirer'); sc.cam.tz = 1.6; await attendre(320); return false; }
    if (issue !== 'but' && issue !== 'rate') return false;
    let t = sc.tireur ? sc.tireur.o : null;
    if (!t) {
      t = sc.joueurs[sc.buteur] || sc.joueurs[sc.porteur] || Object.values(sc.joueurs)[0];
      const tx = borne(Math.max(t.x, 236), 230, 246), ty = borne(t.y, 36, 64);
      sc.dire(0, 0, phrase('frappe', nomCourt(sc.buteur)));
      await aller(t, tx - 4.5, ty, 320); await contact(() => Son.touche()); await aller(B, tx, ty, 280, frappe);
    }
    sc.actif(t);
    const gk = sc.eux.gk, haut = t.y < 50, vy = issue === 'but' ? (haut ? 56 : 44) : borne(t.y, 44, 56);
    // ralenti et gros plan sur le but
    sc.cam.focus = proj(270, (t.y + vy) / 2); sc.cam.tz = 1.75;
    Son.nappe(1.1, 750, 0.08, 0.8);
    await attendre(380);
    const lent0 = LENT; LENT = LENT * 1.6;
    await contact(() => Son.frappe());
    const [sx, sy] = ecran(B); fxAnneau(sc, sx, sy, '#fff');
    if (issue === 'but') {
      aller(gk, 289, haut ? 42 : 58, 320);
      await allerSon(B, 304, vy, 360, frappe, () => Son.but());
      LENT = Math.min(LENT, lent0);
      sc.dire(0, 0, 'BUT !'); banniere(sc, 'BUT !', 'but'); eclair(sc); majScore(1, 0);
      sc.cam.shake = 2.2; fxFilet(sc.filetHaut); fxFoule(sc);
      const [gx, gy] = proj(300, vy); fxConfettis(sc, gx, gy + 8, cols);
      try { if (navigator.vibrate) navigator.vibrate(25); } catch (e) { }
      await aller(B, 305, vy + (vy > 50 ? 1 : -1), 160);
      return true;
    }
    const parade = aller(gk, 287, vy, 280);
    await allerSon(B, 285, vy, 320, frappe, () => { Son.perdu(); Son.oh(); });
    LENT = Math.min(LENT, lent0); await parade;
    const [px, py] = ecran(gk); fxEtincelle(sc, px, py);
    sc.dire(0, 0, 'Arrêt du gardien'); banniere(sc, 'Arrêté !', 'rate');
    await aller(B, 289, vy, 140);
    return true;
  }
  // défense
  const P = sc.eux.porteur, G = sc.gardien;
  const approche = async () => { if (P.x > 74) await Promise.all([aller(P, 74, borne(P.y, 38, 62), 440), aller(B, 69.5, borne(P.y, 38, 62), 440)]); };
  if (issue === 'stoppe') {
    const gk = sc.pts.length && sc.pts[sc.pts.length - 1].c.t === 'gardien';
    if (gk) {
      await approche(); sc.actif(G); sc.dire(0, 0, 'Ils frappent…'); sc.cam.focus = proj(35, 50); sc.cam.tz = 1.7;
      await contact(() => Son.frappe());
      const vy = borne(P.y, 44, 56); aller(G, 10, vy, 240);
      await allerSon(B, 14, vy, 320, frappe, () => Son.arret());
      const [gx, gy] = ecran(G); fxEtincelle(sc, gx, gy); sauter(G, 280);
      sc.dire(0, 0, 'Quel arrêt !'); banniere(sc, 'Arrêt !', 'arret'); fxFoule(sc);
      return true;
    }
    const d = sc.joueurs[sc.pts[sc.pts.length - 1].c.ji]; sc.actif(d);
    await allerSon(d, P.x - 5, P.y + 3, 280, doux, () => Son.arret());
    const [sx, sy] = ecran(P); fxPoussiere(sc, sx, sy);
    sc.dire(0, 0, 'Ballon récupéré !'); banniere(sc, 'Récupéré !', 'arret');
    await Promise.all([vaciller(P, 320), aller(B, d.x + 4.5, d.y, 220, frappe)]);
    await Promise.all([aller(d, d.x + 32, d.y, 460), aller(B, d.x + 36.5, d.y, 460)]);
    return true;
  }
  if (issue === 'tirAdverse') {
    await approche(); sc.dire(0, 0, 'Ils vont tirer, à toi de jouer !'); sc.cam.focus = proj(40, 50); sc.cam.tz = 1.6;
    await Promise.all([aller(P, Math.max(42, P.x - 12), P.y, 320), aller(B, Math.max(37.5, P.x - 16.5), P.y, 320)]);
    return false;
  }
  if (issue === 'butAdverse') {
    await approche(); sc.dire(0, 0, 'Ils frappent…'); sc.cam.focus = proj(35, 50); sc.cam.tz = 1.7;
    await contact(() => Son.frappe());
    const vy = P.y < 50 ? 56 : 44; aller(G, 10, P.y < 50 ? 42 : 58, 280);
    await allerSon(B, -4, vy, 360, frappe, () => { Son.perdu(); Son.oh(); });
    sc.dire(0, 0, 'But adverse'); majScore(0, 1); fxFilet(sc.filetBas); sc.cam.shake = 1.2;
    return true;
  }
  return false;
}

// petit coup sur un chiffre du calcul, au moment exact du son
function frapperChiffre(id) { const e = SCENE && SCENE.ov && SCENE.ov.querySelector(id); if (!e) return; e.classList.remove('ap-tape'); void e.offsetWidth; e.classList.add('ap-tape'); }
// le calcul et la jauge en bas de l'écran d'action
function majActionPlein() {
  if (!SCENE || !SCENE.ov || !S || !S.anim) return;
  const a = S.anim, q = id => SCENE.ov.querySelector(id);
  q('#apPts').textContent = a.pts; q('#apMult').textContent = fmt(a.mult == null ? a.r.combo.mult : a.mult);
  // la jauge monte à chaque carte : points × combo du moment ; le total exact arrive après le multiplicateur
  const prov = Math.round(a.pts * (a.mult == null ? a.r.combo.mult : a.mult)), tot = a.total == null ? prov : a.total;
  const T = q('#apTot'); T.textContent = a.total == null ? (a.pts ? '≈ ' + prov : '?') : a.total; T.classList.toggle('prov', a.total == null);
  q('#apFill').style.transform = `scaleX(${Math.min(1, tot / (refCible() * 1.3))})`;
}
function fermerActionPlein() {
  finirAnims();
  const ov = SCENE && SCENE.ov; if (!ov) return;
  ov.classList.remove('on'); setTimeout(() => ov.remove(), 260); SCENE.ov = null;
}
