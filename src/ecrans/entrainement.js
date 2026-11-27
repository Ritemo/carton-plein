// =====================================================================
// ENTRAÎNEMENT : un mini-jeu au doigt entre deux matchs
// =====================================================================
// Une séance par journée. Trois ateliers : coup franc, jongles, passe en profondeur.
// La réussite donne de l'expérience à tout l'effectif, de la forme pour le prochain match et quelques pièces.
const ATELIERS = {
  cf: { nom: 'Coup franc', ic: 'tactique', txt: 'Vise, puis dose la puissance : au-dessus du mur, sous la barre, loin du gardien. 3 tirs.' },
  jongles: { nom: 'Jongles', ic: 'ballon', txt: 'Touche quand le ballon arrive au pied. Ça accélère ! 20 secondes.' },
  passe: { nom: 'Passe en profondeur', ic: 'passe', txt: 'Trouve le coéquipier libre : pas de défenseur sur la ligne de passe. 5 situations.' }
};
const cleEntrainement = () => `${C.saison}-${C.journee}`;
const entrainementDispo = () => C && !S && C.entrainement !== cleEntrainement() && !!prochainMatch();
let ATELIER = null;

function carteEntrainement() {
  if (!entrainementDispo()) return '';
  return `<button class="coupe-ligne entrainement" id="bEntr" data-merc="1">${img('sablier')}<b class="lil">Entraînement du jour</b><small>Un atelier pour faire progresser l’équipe</small></button>`;
}
function ecranEntrainement() {
  modal(`<h1 class="lil">Entraînement</h1><p class="petit">Choisis un atelier. Une séance par journée.</p><div class="rgl">${Object.entries(ATELIERS).map(([k, A]) => `<button class="choix-rgl atelier" data-at="${k}">${img(A.ic, 'mini-ic')}<b>${A.nom}</b><small>${A.txt}</small></button>`).join('')}</div><div class="btns"><button class="btn sec" id="eAnn">Plus tard</button></div>`, () => {
    document.querySelectorAll('[data-at]').forEach(b => (b.onclick = () => { fermerModal(); lancerAtelier(b.dataset.at); }));
    $('#eAnn').onclick = fermerModal;
  });
}
function lancerAtelier(k) {
  document.body.className = 'match';
  $('#barre-haut').innerHTML = ''; $('#nav').innerHTML = '';
  vue(`<div class="page atelier-page"><div class="at-tete"><b class="lil">${ATELIERS[k].nom}</b><span id="atScore" class="lil">0</span></div><p class="petit centre" id="atConsigne">${ATELIERS[k].txt}</p><div id="atZone" class="at-zone"></div><button class="btn gros" id="atGo">C'est parti</button></div>`, 'plein');
  $('#atGo').onclick = () => { $('#atGo').remove(); ({ cf: atelierCF, jongles: atelierJongles, passe: atelierPasse })[k](score => finAtelier(k, score)); };
}
// ---------- coup franc ----------
function atelierCF(fin) {
  const z = $('#atZone'); let tir = 0, buts = 0, etape = 'vise', t0 = performance.now(), visee = 0, raf = 0;
  z.innerHTML = `<svg viewBox="0 0 300 200" class="at-svg"><rect width="300" height="200" fill="#2e8b47"/><rect x="40" y="20" width="220" height="90" fill="rgba(255,255,255,.12)" stroke="#fff" stroke-width="4"/>
    <g id="cfGk"><circle cx="0" cy="62" r="13" fill="#ffd23f" stroke="#000" stroke-width="2"/><rect x="-16" y="74" width="32" height="30" rx="8" fill="#ffd23f" stroke="#000" stroke-width="2"/></g>
    ${[110, 130, 150, 170].map(x => `<rect x="${x - 9}" y="118" width="18" height="40" rx="6" fill="#1b1f2a" stroke="#fff" stroke-width="1.5"/>`).join('')}
    <line id="cfVise" x1="150" y1="20" x2="150" y2="110" stroke="#ff5b5b" stroke-width="3" stroke-dasharray="5 4"/>
    <circle id="cfBall" cx="150" cy="185" r="7" fill="#fff" stroke="#000" stroke-width="2"/>
    <g id="cfPuiss" opacity="0"><rect x="272" y="40" width="16" height="140" rx="6" fill="#1c1240" stroke="#000" stroke-width="2"/><rect x="272" y="72" width="16" height="34" fill="#29c46a"/><rect id="cfCurs" x="268" y="0" width="24" height="5" rx="2" fill="#fff" stroke="#000"/></g></svg>`;
  const gk = $('#cfGk'), vise = $('#cfVise'), puiss = $('#cfPuiss'), curs = $('#cfCurs'), ball = $('#cfBall');
  const boucle = t => {
    const s = (t - t0) / 1000, gx = 150 + Math.sin(s * 1.7) * 75;
    gk.setAttribute('transform', `translate(${gx},0)`);
    if (etape === 'vise') { const x = 150 + Math.sin(s * 2.4) * 100; vise.setAttribute('x1', x); vise.setAttribute('x2', x); visee = x; }
    if (etape === 'puissance') curs.setAttribute('y', 40 + (1 - Math.abs(((s * 1.3) % 2) - 1)) * 135);
    raf = requestAnimationFrame(boucle);
  };
  raf = requestAnimationFrame(boucle);
  z.onpointerdown = () => {
    if (etape === 'vise') { etape = 'puissance'; puiss.setAttribute('opacity', 1); return; }
    if (etape !== 'puissance') return;
    etape = 'vol';
    const y = +curs.getAttribute('y'), gx = +(/translate\(([-\d.]+)/.exec(gk.getAttribute('transform')) || [0, 150])[1];
    const trop = y < 72, mur = y > 106, attrape = Math.abs(gx - visee) < 34;
    const but = !trop && !mur && !attrape;
    ball.style.transition = 'transform 380ms cubic-bezier(.2,.7,.2,1)';
    ball.style.transform = `translate(${visee - 150}px, ${mur ? -50 : trop ? -185 : -120}px)`;
    if (but) { buts++; Son.but(); } else Son.perdu();
    $('#atScore').textContent = buts;
    $('#atConsigne').textContent = but ? 'BUT !' : mur ? 'Dans le mur...' : trop ? 'Au-dessus !' : 'Le gardien la capte.';
    setTimeout(() => {
      tir++;
      if (tir >= 3) { cancelAnimationFrame(raf); z.onpointerdown = null; return fin(buts); }
      ball.style.transition = 'none'; ball.style.transform = ''; puiss.setAttribute('opacity', 0); etape = 'vise';
      $('#atConsigne').textContent = `Tir ${tir + 1} sur 3`;
    }, 900);
  };
}
// ---------- jongles ----------
// Le ballon monte puis redescend vers le pied. Touche quand il arrive en bas (zone jaune) : il repart, un peu plus vite.
function atelierJongles(fin) {
  const z = $('#atZone'); let n = 0, P = 1.3, t0 = performance.now(), debut = t0, fini = false, raf = 0;
  z.innerHTML = `<svg viewBox="0 0 300 220" class="at-svg"><rect width="300" height="220" fill="#2e8b47"/><rect x="110" y="164" width="80" height="30" rx="10" fill="#ffd23f" opacity=".35"/><circle id="jgB" cx="150" cy="180" r="14" fill="#fff" stroke="#000" stroke-width="2.5"/><text id="jgT" x="150" y="30" text-anchor="middle" class="at-t">20</text><rect x="125" y="196" width="50" height="18" rx="6" fill="#1b1f2a"/></svg>`;
  const B = $('#jgB'), T = $('#jgT');
  const u = t => (t - t0) / 1000 / P; // 0 : départ du pied, 1 : retour au pied
  const terminer = txt => { if (fini) return; fini = true; cancelAnimationFrame(raf); z.onpointerdown = null; $('#atConsigne').textContent = txt; setTimeout(() => fin(n), 800); };
  const boucle = t => {
    const k = u(t), y = 180 - 150 * 4 * Math.min(1, k) * (1 - Math.min(1, k));
    B.setAttribute('cy', k > 1 ? 180 + (k - 1) * 200 : y);
    const reste = Math.max(0, 20 - (t - debut) / 1000); T.textContent = Math.ceil(reste);
    if (k > 1.12) return terminer('Il est tombé !');
    if (reste <= 0) return terminer('Temps écoulé !');
    raf = requestAnimationFrame(boucle);
  };
  raf = requestAnimationFrame(boucle);
  z.onpointerdown = () => {
    const k = u(performance.now());
    if (k >= 0.82) { n++; $('#atScore').textContent = n; t0 = performance.now(); P = Math.max(0.6, P * 0.96); Son.tick(n % 6); }
    else if (k > 0.15) terminer('Trop tôt !');
  };
}
// ---------- passe en profondeur ----------
function atelierPasse(fin) {
  const z = $('#atZone'); let manche = 0, bons = 0, timer = null;
  const seg = (a, b, p) => { const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy, t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)); return Math.hypot(a.x + t * dx - p.x, a.y + t * dy - p.y); };
  const situation = () => {
    if (manche >= 5) return fin(bons);
    manche++;
    const porteur = { x: 60, y: 110 }, coeq = [{ x: 170 + rnd(30), y: 40 + rnd(20) }, { x: 190 + rnd(30), y: 105 + rnd(15) }, { x: 170 + rnd(30), y: 170 + rnd(20) }];
    const libre = rnd(3), defs = [];
    coeq.forEach((c, i) => { if (i !== libre) defs.push({ x: (porteur.x + c.x) / 2 + rnd(12) - 6, y: (porteur.y + c.y) / 2 + rnd(10) - 5 }); });
    defs.push({ x: 250, y: 30 + rnd(160) });
    // on vérifie qu'aucun défenseur ne gêne la passe libre
    if (defs.some(d => seg(porteur, coeq[libre], d) < 14)) defs[defs.length - 1].y = 5;
    z.innerHTML = `<svg viewBox="0 0 300 220" class="at-svg"><rect width="300" height="220" fill="#2e8b47"/><line x1="150" y1="0" x2="150" y2="220" stroke="#fff" opacity=".4"/>
      ${defs.map(d => `<circle cx="${d.x}" cy="${d.y}" r="10" fill="#1b1f2a" stroke="#fff" stroke-width="2"/>`).join('')}
      <circle cx="${porteur.x}" cy="${porteur.y}" r="11" fill="#e8413c" stroke="#fff" stroke-width="2.5"/><circle cx="${porteur.x + 9}" cy="${porteur.y + 8}" r="5" fill="#fff" stroke="#000"/>
      ${coeq.map((c, i) => `<g class="at-cible" data-c="${i}"><circle cx="${c.x}" cy="${c.y}" r="22" fill="transparent"/><circle cx="${c.x}" cy="${c.y}" r="11" fill="#e8413c" stroke="#fff" stroke-width="2.5"/></g>`).join('')}
      <rect id="psT" x="0" y="214" width="300" height="6" fill="#ffd23f"/></svg>`;
    const barre = $('#psT'); barre.style.transition = 'transform 4s linear'; barre.style.transformOrigin = 'left'; requestAnimationFrame(() => (barre.style.transform = 'scaleX(0)'));
    $('#atConsigne').textContent = `Situation ${manche} sur 5 : à qui passer ?`;
    const repondre = i => {
      clearTimeout(timer); document.querySelectorAll('.at-cible').forEach(g => (g.onpointerdown = null));
      const ok = i === libre; if (ok) { bons++; Son.tick(bons); } else Son.perdu();
      $('#atScore').textContent = bons; $('#atConsigne').textContent = ok ? 'Bien vu !' : i == null ? 'Trop tard !' : 'Interceptée...';
      const c = coeq[libre]; z.querySelector('svg').insertAdjacentHTML('beforeend', `<line x1="${porteur.x}" y1="${porteur.y}" x2="${c.x}" y2="${c.y}" stroke="#ffd23f" stroke-width="3" stroke-dasharray="6 4"/>`);
      setTimeout(situation, 900);
    };
    document.querySelectorAll('.at-cible').forEach(g => (g.onpointerdown = () => repondre(+g.dataset.c)));
    timer = setTimeout(() => repondre(null), 4000);
  };
  situation();
}
// ---------- récompense ----------
function finAtelier(k, score) {
  const paliers = { cf: [1, 2, 3], jongles: [8, 15, 25], passe: [3, 4, 5] }[k];
  const rang = score >= paliers[2] ? 3 : score >= paliers[1] ? 2 : score >= paliers[0] ? 1 : 0;
  const mult = 1 + 0.25 * niveauInfra('entrainement');
  const xp = Math.round([1, 2, 4, 6][rang] * mult), forme = [0, 3, 6, 10][rang], pieces = Math.round([0, 5, 10, 20][rang] * mult);
  const progres = [];
  C.effectif.forEach((j, i) => { if (j.vendu) return; initJoueur(j, i); j.xp += xp; while (j.note < NOTE_MAX && j.xp >= seuilXP(j.note)) { j.xp -= seuilXP(j.note); j.note++; progres.push(`${j.nom} passe à +${j.note}`); } });
  C.forme = forme; C.pieces += pieces; C.entrainement = cleEntrainement(); sauver();
  const med = ['Séance ratée', 'Bronze', 'Argent', 'Or'][rang];
  if (rang === 3) { Son.jingle(); confettis(); }
  vue(`<div class="scene">${img(rang ? 'medaille' : 'sablier', 'scene-ic grosse')}<div class="fm-titre lil ${rang ? 'v' : 'd'}">${med}</div>
    ${bulle('dede', rang === 3 ? 'Impeccable. Les gars en redemandent.' : rang ? 'Bonne séance. On progresse.' : 'On fera mieux demain. Ça arrive.')}
    <div class="bilan-saison"><div class="palm ok">${img('fusee', 'mini-ic')} +${xp} expérience pour chaque joueur</div>${forme ? `<div class="palm ok">${img('feu', 'mini-ic')} Forme : +${forme} points au début du prochain match</div>` : ''}${progres.map(t => `<div class="palm ok">${img('fusee', 'mini-ic')} ${t}</div>`).join('')}</div>
    ${pieces ? `<div class="gain lil">${img('piece')} +${pieces} pièces</div>` : ''}
    <button class="btn gros" id="atFin">Retour au vestiaire</button></div>`, 'plein scene-fond');
  $('#atFin').onclick = () => { Son.clic(); hub('vestiaire'); };
}
