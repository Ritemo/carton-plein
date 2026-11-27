// =====================================================================
// CARTON PLEIN : écrans
// =====================================================================
const IMG = __IMG__;
const $ = s => document.querySelector(s);
const img = (k, cls) => (IMG[k] ? `<img class="${cls || ''}" src="${IMG[k]}" alt="" draggable="false">` : '');
const on = (id, f) => { const b = document.getElementById(id); if (b) b.onclick = f; };
const REDUIT = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ICT = { passe: 'passe', course: 'course', dribble: 'dribble', centre: 'centre', frappe: 'frappe', tete: 'tete', tacle: 'tacle', marquage: 'marquage', interception: 'interception', gardien: 'gardien', contrepied: 'epees', pressing: 'biceps', appel: 'fusee', relance: 'eclair', genie: 'ampoule', grinta: 'etincelles', feinte: 'magicien' };
const pastilleK = k => k ? `<i class="pk" style="--k:${COULEURS[k].hex}" title="${COULEURS[k].nom}"></i>` : '';
const cote = c => ({ G: 'à gauche', C: 'au centre', D: 'à droite' }[c]);
let ONGLET = 'vestiaire';

// ---------------- Son ----------------
const Son = {
  ctx: null, on: true,
  init() { if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; } try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; } },
  bruit(d) { const c = this.ctx, b = c.createBuffer(1, Math.floor(c.sampleRate * d), c.sampleRate), x = b.getChannelData(0); for (let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; return s; },
  tension() { }, // ambiance de foule retirée : bruitages seulement
  ton(f, d, type = 'square', v = 0.07, w = 0) { if (!this.ctx || !this.on) return; const c = this.ctx, t = c.currentTime + w, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.05); },
  souffle(d, f, v, type = 'lowpass') { if (!this.ctx || !this.on) return; const c = this.ctx, s = this.bruit(d), fi = c.createBiquadFilter(), g = c.createGain(); fi.type = type; fi.frequency.value = f; g.gain.setValueAtTime(v, c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + d); s.connect(fi).connect(g).connect(c.destination); s.start(); },
  clic() { this.souffle(0.05, 3000, 0.08, 'highpass'); },
  tick(i) { this.ton(440 * Math.pow(1.19, i), 0.1, 'square', 0.06); },
  mult() { this.ton(196, 0.25, 'sawtooth', 0.08); this.ton(392, 0.3, 'square', 0.06, 0.05); this.souffle(0.4, 1200, 0.25, 'bandpass'); },
  perdu() { this.ton(330, 0.12); this.ton(220, 0.25, 'square', 0.06, 0.1); },
  frappe() { this.ton(140, 0.2, 'sine', 0.45); this.souffle(0.06, 1800, 0.2); },
  sifflet(long) { if (!this.ctx || !this.on) return; const c = this.ctx, t = c.currentTime, o = c.createOscillator(), l = c.createOscillator(), lg = c.createGain(), g = c.createGain(); o.frequency.value = 2900; l.frequency.value = 28; lg.gain.value = 90; l.connect(lg).connect(o.frequency); const d = long ? 0.9 : 0.3; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.02); g.gain.setValueAtTime(0.08, t + d - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(c.destination); o.start(t); l.start(t); o.stop(t + d + 0.05); l.stop(t + d + 0.05); },
  but() { this.souffle(2.2, 900, 0.5, 'bandpass'); [523, 659, 784, 1047].forEach((f, i) => this.ton(f, 0.22, 'square', 0.07, 0.12 * i)); },
  arret() { this.souffle(1.2, 700, 0.3, 'bandpass'); this.ton(523, 0.12); this.ton(784, 0.2, 'square', 0.07, 0.1); },
  piece() { this.ton(988, 0.08, 'square', 0.06); this.ton(1319, 0.16, 'square', 0.06, 0.07); },
  jingle() { [392, 523, 659, 784, 659, 1047].forEach((f, i) => this.ton(f, 0.16, 'triangle', 0.12, 0.11 * i)); }
};

// ---------------- Éléments réutilisables ----------------
function blason(eq, t) {
  const tx = ['#ffffff', '#ffd200', '#fcd405'].includes(eq.c1) ? (eq.c2 === '#ffffff' ? '#1c1240' : eq.c2) : '#ffffff';
  const s = eq.court.length;
  return `<svg class="blason" width="${t}" height="${Math.round(t * 1.15)}" viewBox="0 0 40 46" aria-hidden="true"><path d="M20 2L37 8V24C37 35 29 41 20 44C11 41 3 35 3 24V8Z" fill="${eq.c1}" stroke="#1c1240" stroke-width="3"/><path d="M20 4L35 9.3V24C35 34 28 39.5 20 42Z" fill="${eq.c2}" opacity=".85"/><path d="M8 10L20 6L32 10" stroke="#fff" stroke-opacity=".45" stroke-width="2" fill="none" stroke-linecap="round"/><text x="20" y="${s > 3 ? 27 : s > 2 ? 28 : 29}" text-anchor="middle" font-family="Lilita One,system-ui" font-size="${s > 3 ? 9.5 : s > 2 ? 12 : 15}" fill="${tx}" stroke="#1c1240" stroke-width="2.5" paint-order="stroke">${eq.court}</text></svg>`;
}
function drapeau(p, w) {
  const d = PAYS[p].drapeau, h = Math.round(w * 0.68);
  let f = '';
  if (d[0] === 'v') f = `<rect width="10" height="20" fill="${d[1]}"/><rect x="10" width="10" height="20" fill="${d[2]}"/><rect x="20" width="10" height="20" fill="${d[3]}"/>`;
  else if (d[0] === 'h') f = `<rect width="30" height="${d[1] === '#c60b1e' ? 5 : 6.67}" fill="${d[1]}"/><rect y="${d[1] === '#c60b1e' ? 5 : 6.67}" width="30" height="${d[1] === '#c60b1e' ? 10 : 6.67}" fill="${d[2]}"/><rect y="${d[1] === '#c60b1e' ? 15 : 13.33}" width="30" height="${d[1] === '#c60b1e' ? 5 : 6.67}" fill="${d[3]}"/>`;
  else f = `<rect width="30" height="20" fill="${d[1]}"/><rect x="12.5" width="5" height="20" fill="${d[2]}"/><rect y="7.5" width="30" height="5" fill="${d[2]}"/>`;
  return `<svg class="drapeau" width="${w}" height="${h}" viewBox="0 0 30 20" aria-hidden="true">${f}<rect width="30" height="20" fill="none" stroke="#1c1240" stroke-width="2.4" rx="2"/></svg>`;
}
function carteHTML(c, opts) {
  opts = opts || {};
  const T = TYPES[c.t], j = C.effectif[c.ji], v = c.val != null ? c.val : valeurCarte(c);
  const pips = TYPES[c.t].consigne ? '' : '<span class="pips">' + Array.from({ length: RARETES[c.r].max }, (_, i) => `<i class="${i < c.niv ? 'on' : ''}"></i>`).join('') + '</span>';
  const cons = !!T.consigne;
  const sp = cons ? `<span class="sp effet">${T.txt}</span>` : c.sp ? `<span class="sp">${SPECIAUX[c.t].nom}</span>` : '';
  const tag = opts.tag || 'button', k = j && j.k ? COULEURS[j.k].hex : '#8a7fb0';
  const st = `--k:${k};` + (opts.style || '');
  return `<${tag} class="carte t-${c.t} r-${c.r} ${cons ? 'consigne' : `k-${(j && j.k) || 'bleu'}`} ${opts.cls || ''}" data-id="${c.id}" style="${st}"><span class="art">${img(ICT[c.t])}</span><span class="haut lil ${T.nom.length > 10 ? 'long' : ''}">${T.nom}</span>${sp}${cons ? '' : `<span class="piece lil">${v}</span>`}${opts.plus ? `<span class="plus lil">${opts.plus}</span>` : ''}<span class="nom">${j && !cons ? `<i class="lg lg-${j.l}" title="${NOM_LIGNE[j.l]}">${j.l[0]}</i>` : ''}${j ? j.nom : ''}</span>${pips}</${tag}>`;
}
function bulle(qui, txt) { return `<div class="bulle">${img(qui === 'president' ? 'president' : 'dede', 'portrait')}<div><b class="lil">${qui === 'president' ? 'Le président' : 'Dédé, l’intendant'}</b><p>${txt}</p></div></div>`; }
// Célébrations : but (le buteur fait la roue) et arrêt (gants + ballon dévié)
function celebrer(type, nom) {
  const ancien = $('#celeb'); if (ancien) ancien.remove();
  const eq = S.eq.p, d = document.createElement('div');
  d.id = 'celeb'; d.className = type;
  d.style.setProperty('--cb1', type === 'but' ? eq.c1 : '#1c1240'); d.style.setProperty('--cb2', type === 'but' ? (eq.c2 === eq.c1 ? '#ffffff' : eq.c2) : '#3a2a8a');
  const tx = { but: 'BUT !', arret: 'ARRÊT !', stop: 'STOPPÉ !' }[type];
  d.innerHTML = type === 'but'
    ? `<div class="cb-fond"></div><div class="cb-burst"></div><div class="cb-scene"><img class="cb-net" src="${IMG.filet}" alt=""><img class="cb-ball" src="${IMG.ballon}" alt=""><img class="cb-hero" src="${IMG.roue}" alt=""><div class="cb-txt lil">${tx}</div>${nom ? `<div class="cb-nom">${nom}</div>` : ''}</div>`
    : `<div class="cb-fond"></div><div class="cb-burst"></div><div class="cb-scene"><img class="cb-impact" src="${IMG.impact}" alt=""><img class="cb-ball" src="${IMG.ballon}" alt=""><img class="cb-gants" src="${IMG[type === 'arret' ? 'gardien' : 'bouclier']}" alt=""><img class="cb-hero" src="${IMG.bras}" alt=""><div class="cb-txt lil">${tx}</div>${nom ? `<div class="cb-nom">${nom}</div>` : ''}</div>`;
  document.body.appendChild(d);
  setTimeout(() => d.classList.add('sortie'), 1900);
  setTimeout(() => d.remove(), 2300);
}
const nomGardien = () => { const o = effectifActif().find(o => o.j.p === 'Gardien'); return o ? o.j.nom : null; };
const nomButeur = () => S.buteurs.length ? C.effectif[S.buteurs[S.buteurs.length - 1]].nom : null;
function flash(t) { const f = $('#flash'), s = f.querySelector('span'); s.textContent = t; f.style.display = 'flex'; s.style.animation = 'none'; void s.offsetWidth; s.style.animation = ''; setTimeout(() => (f.style.display = 'none'), 1500); }
function modal(html, onReady) { const e = $('#ecran'); e.style.display = 'flex'; e.innerHTML = `<div class="boite">${html}</div>`; if (onReady) onReady(e); }
function fermerModal() { $('#ecran').style.display = 'none'; }
function toast(t) { const d = document.createElement('div'); d.className = 'toast lil'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 1800); }
function confettis() {
  if (REDUIT) return;
  const cols = ['#ffd23f', '#ff5a5f', '#3fa7f5', '#6fff9a', '#ffffff', '#b06cff'];
  for (let i = 0; i < 40; i++) { const c = document.createElement('div'); c.className = 'confetti'; c.style.left = (50 + (Math.random() - 0.5) * 30) + 'vw'; c.style.background = pick(cols); c.style.setProperty('--dx', ((Math.random() - 0.5) * 90) + 'vw'); c.style.setProperty('--rot', (Math.random() * 720) + 'deg'); c.style.animationDelay = (Math.random() * 0.15) + 's'; document.body.appendChild(c); setTimeout(() => c.remove(), 1600); }
}
function vue(html, cls) { const v = $('#vue'); v.className = cls || ''; v.innerHTML = html; v.scrollTop = 0; }

// =====================================================================
// ACCUEIL ET DÉBUT DE CARRIÈRE
// =====================================================================
function ecranRecup() {
  modal(`${img('bouclier', 'grande-ic')}<h1 class="lil">Retrouver ma carrière</h1>
    <p class="petit">Sur l’ancien téléphone : menu > Sauvegarde, le code joueur est affiché (8 caractères).</p>
    <input id="rCode" class="zone-txt code-j" maxlength="10" autocapitalize="characters" placeholder="CODE JOUEUR">
    <p class="petit" id="rMsg"></p>
    <div class="btns"><button class="btn" id="rOk">Reprendre</button><button class="btn sec" id="rNon">Annuler</button></div>`, () => {
    $('#rOk').onclick = async () => { $('#rMsg').textContent = 'Recherche…'; try { await reprendreAvecCode($('#rCode').value); fermerModal(); toast('Carrière retrouvée'); hub('vestiaire'); } catch (e) { $('#rMsg').textContent = e.message; } };
    $('#rNon').onclick = fermerModal;
  });
}
function ecranSauvegarde() {
  const p = profil(), url = urlCloud();
  modal(`${img('bouclier', 'grande-ic')}<h1 class="lil">Sauvegarde</h1>
    <p class="petit">Ta carrière est enregistrée sur ce téléphone. Pour ne rien perdre, ou pour continuer sur un autre appareil :</p>
    <div class="btns col"><button class="btn" id="sCop">Copier ma sauvegarde</button><button class="btn sec" id="sCol">Coller une sauvegarde</button></div>
    <textarea id="sTxt" class="zone-txt" placeholder="Colle ici une sauvegarde (texte commençant par CP1:)" hidden></textarea>
    <h2 class="lil">Sauvegarde automatique</h2>
    ${url ? `<p class="petit">Activée. Ton code joueur : <b class="code-j">${p.code}</b> · ${SYNC_ETAT === 'ok' ? 'à jour' : SYNC_ETAT === 'hors-ligne' ? 'hors ligne, réessaie plus tard' : SYNC_ETAT === 'erreur' ? 'erreur' : 'en attente'}<br>Note ce code : il permet de retrouver ta carrière sur un autre téléphone.</p>
    <input id="sNom" class="zone-txt" maxlength="16" placeholder="Ton prénom" value="${p.pseudo || ''}">
    <button class="lien" id="sAutre">Reprendre une carrière avec un autre code</button>` : '<p class="petit">Pas encore activée.</p>'}
    <details class="avance"><summary>Réglage avancé</summary><input id="sUrl" class="zone-txt" placeholder="https://script.google.com/macros/s/…/exec" value="${url}"><button class="btn sec" id="sUrlOk">Enregistrer l’adresse</button></details>
    <div class="btns"><button class="btn" id="sFer">Fermer</button></div>`, () => {
    $('#sCop').onclick = async () => { const t = exporterSauvegarde(); try { await navigator.clipboard.writeText(t); toast('Sauvegarde copiée : colle-la dans tes notes'); } catch (e) { const z = $('#sTxt'); z.hidden = false; z.value = t; z.select(); toast('Copie ce texte'); } };
    $('#sCol').onclick = () => { const z = $('#sTxt'); if (z.hidden) { z.hidden = false; z.value = ''; z.focus(); return; } try { importerSauvegarde(z.value); fermerModal(); toast('Sauvegarde reprise'); hub('vestiaire'); } catch (e) { toast(e.message); } };
    $('#sUrlOk').onclick = () => { try { localStorage.setItem(CLE_CLOUD, $('#sUrl').value.trim()); } catch (e) { } toast($('#sUrl').value.trim() ? 'Sauvegarde cloud activée' : 'Sauvegarde cloud désactivée'); syncPlanifier(); fermerModal(); };
    $('#sFer').onclick = () => { const n = $('#sNom'); if (n && n.value.trim() !== (p.pseudo || '')) { p.pseudo = n.value.trim(); majProfil(p); syncPlanifier(); } fermerModal(); };
    on('sAutre', ecranRecup);
  });
}
function accueil() {
  if (COOP) quitterCoop();
  Son.tension(0); document.body.className = 'menu';
  syncVerifier(j => modal(`${img('bouclier', 'grande-ic')}<h1 class="lil">Sauvegarde plus récente</h1><p>Le cloud a une carrière plus récente (${new Date(j.maj).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}). La reprendre sur ce téléphone ?</p><div class="btns"><button class="btn" id="mOui">Reprendre</button><button class="btn sec" id="mNon">Garder celle-ci</button></div>`, () => { $('#mOui').onclick = () => { C = migrer(j.data); sauver(); fermerModal(); accueil(); }; $('#mNon').onclick = fermerModal; }));
  const sv = charger();
  const cl = sv ? clubPar(sv.club) : null;
  vue(`<div class="accueil">
    <div class="logo">${img('ballon', 'logo-ballon')}<div class="logo-t lil">CARTON<br>PLEIN</div></div>
    <div class="logo-s">Le foot en combos</div>
    ${sv ? `<button class="bloc-continuer" id="bCont">${blason(cl, 44)}<span><b class="lil">Continuer</b><small>${cl.nom} · Saison ${sv.saison} · ${nomDiv(sv.div, sv.pays)} · journée ${Math.min(sv.journee + 1, (sv.calendrier || []).length || 9)}</small></span><span class="fleche lil">›</span></button>` : ''}
    <button class="btn gros" id="bNew">${sv ? 'Nouvelle carrière' : 'Commencer ma carrière'}</button>
    <button class="btn sec" id="bRegles">Comment jouer</button>
    ${urlCloud() ? '<button class="btn sec" id="bCoop">Carrière coop</button>' : ''}
    ${!sv && urlCloud() ? '<button class="lien" id="bRecup">J’ai déjà une carrière sur un autre téléphone</button>' : ''}
    <p class="credit">Émoticônes 3D Fluent Emoji (Microsoft, licence MIT). Noms de clubs réels, écussons et joueurs inventés.</p>
  </div>`, 'plein');
  const go = () => { Son.init(); Son.clic(); };
  on('bRecup', () => { go(); ecranRecup(); });
  on('bCoop', () => { go(); ecranCoop(); });
  if (sv) $('#bCont').onclick = () => { go(); C = sv; hub('vestiaire'); };
  $('#bNew').onclick = () => { go(); if (sv) modal(`<h1 class="lil">Nouvelle carrière ?</h1><p>Ta carrière avec ${cl.nom} sera effacée.</p><div class="btns"><button class="btn" id="mOui">Recommencer</button><button class="btn sec" id="mNon">Annuler</button></div>`, () => { $('#mOui').onclick = () => { fermerModal(); demarrerNouvelle(); }; $('#mNon').onclick = fermerModal; }); else demarrerNouvelle(); };
  $('#bRegles').onclick = () => { go(); regles(); };
}
function choixPays() {
  vue(`<div class="page"><h1 class="lil titre-page">Choisis ton pays</h1><p class="intro-p">Cinq championnats, trois divisions chacun. Tu commences tout en bas.</p>
    <div class="liste-pays">${Object.entries(PAYS).map(([k, p]) => `<button class="pays-choix" data-p="${k}">${drapeau(k, 46)}<span><b class="lil">${p.nom}</b><small>${p.divs[3]} → ${p.divs[1]}</small></span><span class="fleche lil">›</span></button>`).join('')}</div></div>`, 'plein');
  document.querySelectorAll('.pays-choix').forEach(b => (b.onclick = () => { Son.clic(); GROUPE_VU = '1'; choixClub(b.dataset.p); }));
}
let GROUPE_VU = '1';
function choixClub(pays) {
  const clubs = CLUBS.filter(c => c.div === 3 && c.pays === pays);
  const groupes = [...new Set(clubs.map(c => c.g))];
  const tuile = c => `<button class="club-choix" data-id="${c.id}">${blason(c, 46)}<span class="lil">${c.nom}</span><small>${STYLES[c.style].nom}</small></button>`;
  vue(`<div class="page"><button class="retour lil" id="bRet">‹ Pays</button><h1 class="lil titre-page">${drapeau(pays, 30)} Choisis ton club</h1><p class="intro-p">Tout commence en ${PAYS[pays].divs[3]}, la 3e division. Chaque club a son style de jeu.</p>
    ${groupes.length > 1 ? `<div class="segments">${groupes.map(g => `<button class="seg ${g === GROUPE_VU ? 'on' : ''}" data-grp="${g}">Groupe ${g}</button>`).join('')}</div>` : ''}
    <div class="grille-clubs">${clubs.filter(c => groupes.length < 2 || c.g === GROUPE_VU).map(tuile).join('')}</div></div>`, 'plein');
  document.querySelectorAll('[data-grp]').forEach(b => (b.onclick = () => { Son.clic(); GROUPE_VU = b.dataset.grp; choixClub(pays); }));
  $('#bRet').onclick = () => { Son.clic(); choixPays(); };
  document.querySelectorAll('.club-choix').forEach(b => (b.onclick = () => { Son.clic(); if (COOP_CREATION) return finCreationCoop(b.dataset.id); nouvelleCarriere(b.dataset.id); profil().niveauChoisi ? intro() : choisirNiveau(intro); }));
}
async function scenes(liste, fin) {
  let i = 0;
  const montrer = () => {
    const s = liste[i];
    vue(`<div class="scene">${s.ic ? img(s.ic, 'scene-ic') : ''}${bulle(s.qui || 'dede', s.txt)}<button class="btn gros" id="bSc">${i === liste.length - 1 ? (s.bouton || 'C’est parti') : 'Suite'}</button></div>`, 'plein scene-fond');
    $('#bSc').onclick = () => { Son.clic(); i++; if (i < liste.length) montrer(); else fin(); };
  };
  montrer();
}
function intro() {
  const cl = clubPar(C.club), riv = clubPar(C.rival);
  scenes([
    { qui: 'president', ic: 'stade', txt: `${cl.nom} est tombé bien bas. Tribunes à moitié vides, sponsors partis. Je n'ai plus qu'une carte à jouer : toi. Ramène ce club en ${nomDiv(1)}.` },
    { qui: 'dede', ic: 'maillot', txt: `Bienvenue, coach. Moi c'est Dédé, l'intendant depuis 41 ans. J'ai lavé les maillots de toutes les légendes de ce club. Tes joueurs sont jeunes, mais il y a du talent.` },
    { qui: 'dede', ic: 'etoile', txt: `Ici, on gagne avec des combinaisons. Une-deux, Contre-attaque, Centre-Tête : plus l'action est belle, plus elle pèse. Et méfie-toi de ${riv.nom}, notre rival de toujours.` },
    { qui: 'dede', ic: 'capitaine', txt: `Je t'ai trouvé un Capitaine. Quand on est mené, il double tout. Et passe voir les gamins du centre de formation : l'avenir du club, c'est eux.`, bouton: 'Au vestiaire' }
  ], () => hub('vestiaire'));
}
// au début d'une carrière : le niveau, une fois pour toutes (modifiable ensuite dans Réglages)
function choisirNiveau(suite) {
  modal(`${img('dede', 'grande-ic')}<h1 class="lil">Quel niveau ?</h1><p class="petit">Tu pourras changer plus tard dans le menu, Réglages.</p><div class="rgl">
    <button class="choix-rgl" data-niv="facile"><b>Facile</b><small>Pour découvrir, ou pour les plus jeunes. Adversaires plus faibles, mur affiché au point près.</small></button>
    <button class="choix-rgl" data-niv="normal"><b>Normal</b><small>Le vrai défi : mur en fourchette, adversaires coriaces.</small></button></div>`, () => {
    document.querySelectorAll('[data-niv]').forEach(b => (b.onclick = () => { Son.clic(); changerReglage('difficulte', b.dataset.niv); fermerModal(); suite(); }));
  });
}
// série sans victoire au niveau Normal : Dédé propose le Facile (une fois par série)
function proposerFacile() {
  if (COOP || !C || !C.carnet || reglages().difficulte !== 'normal') return;
  const L = (C.carnet.derniers || []).filter(m => m.comp === 'ligue' && m.s === C.saison).slice(0, 5), p = profil();
  if (L.length < 5 || L.some(m => { const [a, b] = m.score.split('-').map(Number); return a > b; })) return;
  if (p.propFacile && p.propFacile.s === C.saison && C.journee - p.propFacile.j < 6) return;
  p.propFacile = { s: C.saison, j: C.journee }; majProfil(p);
  modal(`${img('dede', 'grande-ic')}<h1 class="lil">Coup de main ?</h1><p>Cinq matchs sans victoire... Ça arrive aux meilleurs. Tu veux passer en <b>Facile</b> le temps de reprendre confiance ? Tu pourras revenir en Normal quand tu veux (menu, Réglages).</p>
    <div class="btns col"><button class="btn" id="fOui">Passer en Facile</button><button class="btn sec" id="fNon">Non, je m’accroche</button></div>`, () => {
    $('#fOui').onclick = () => { changerReglage('difficulte', 'facile'); fermerModal(); toast('Niveau Facile'); };
    $('#fNon').onclick = fermerModal;
  });
}
function ecranReglages() {
  const R = reglages(), opt = (k, v, t, d) => `<button class="choix-rgl ${R[k] === v ? 'on' : ''}" data-k="${k}" data-v="${v}"><b>${t}</b><small>${d}</small></button>`;
  modal(`<h1 class="lil">Réglages</h1>
    <h2 class="lil">Niveau</h2><div class="rgl">${opt('difficulte', 'facile', 'Facile', 'Adversaires plus faibles, mur affiché au point près. Idéal pour débuter.')}${opt('difficulte', 'normal', 'Normal', 'Le vrai défi : mur annoncé en fourchette, adversaires plus coriaces.')}</div>
    <h2 class="lil">Indices</h2><div class="rgl">${opt('indices', true, 'Avec indices', 'Une piste sous l’Attaquer : combinaison à une carte près.')}${opt('indices', false, 'Sans indice', 'À toi de tout voir.')}</div>
    <p class="petit">${COOP ? 'En coop, le niveau est celui du club : il change aussi pour ton coéquipier. ' : ''}Les indices sont propres à ce téléphone. Le défi de la semaine et le direct se jouent toujours au niveau Normal.</p>
    <div class="btns"><button class="btn" id="rOk">OK</button></div>`, () => {
    document.querySelectorAll('.choix-rgl').forEach(b => (b.onclick = () => { Son.clic(); changerReglage(b.dataset.k, b.dataset.v === 'true' ? true : b.dataset.v === 'false' ? false : b.dataset.v); ecranReglages(); }));
    $('#rOk').onclick = fermerModal;
  });
}
function regles() {
  modal(`<h1 class="lil">Comment jouer</h1>
    <div class="regles">
      <div>${img('passe')}<span>Un match, c'est <b>6 temps forts</b> : 3 attaques et 3 défenses.</span></div>
      <div>${img('gemme')}<span><b>Couleurs</b> : chaque joueur a une couleur (bandeau en bas de la carte). 3 cartes de la même couleur : <b>Trio</b>, +1 au combo. 4 : <b>Carton plein</b>, +2.</span></div>
      <div>${img('epees')}<span><b>Consignes</b> : 0 point, jouables en attaque comme en défense. Une par temps fort, <b>en plus</b> de tes cartes : elle ne prend pas de place. Elles agissent tout de suite ou préparent le temps fort suivant (Contre-pied ×1,5, Pressing haut −20 % à l'adversaire...).</span></div>
      <div>${img('etoile')}<span>Joue <b>jusqu'à 4 cartes</b>. Leurs points s'additionnent, la <b>combinaison</b> les multiplie.</span></div>
      <div>${img('mur')}<span>En attaque, dépasse le <b>mur</b>. En défense, atteins la force de <b>leur attaque</b>. Au niveau Normal, ils sont annoncés en <b>fourchette</b> : la vraie valeur se révèle après ton choix.</span></div>
      <div>${img('sablier')}<span>Après chaque temps fort, tu ne pioches que <b>3 cartes</b> (main pleine à la mi-temps). Tout donner maintenant, ou garder des cartes pour la suite ?</span></div>
      <div>${img('filet')}<span>Presque (70 %) : un <b>tir</b> où l'on choisit son côté.</span></div>
      <div>${img('tactique')}<span>Coups francs, corners, contres éclair et penalties pimentent les matchs.</span></div>
      <div>${img('gemme')}<span>Entre les matchs : récompenses, boutique, améliorations, dilemmes de vestiaire.</span></div>
      <div>${img('trophee')}<span>Coupe nationale chaque saison, coupes d'Europe pour le top 4 de 1re division. En coupe, un nul se joue aux tirs au but.</span></div>
      <div>${img('poignee')}<span>Mercato en début et en milieu de saison : recrute des joueurs (et leurs cartes) ou vends les tiens. En fin de saison, d'autres clubs peuvent te proposer un poste.</span></div>
      <div>${img('pousse')}<span>Le centre de formation fait grandir des jeunes : lance-les en pro avec leurs cartes, ou vends-les.</span></div>
    </div><div class="btns"><button class="btn" id="mOk">Compris</button></div>`, () => ($('#mOk').onclick = fermerModal));
}

// =====================================================================
// LE CLUB (HUB) : vestiaire, effectif, boutique, classement, journal
// =====================================================================
function hub(onglet) {
  ONGLET = onglet || ONGLET; document.body.className = 'hub'; Son.tension(0);
  barreHaut();
  const cl = clubPar(C.club);
  $('#bMenu').onclick = () => { Son.clic(); modal(`<h1 class="lil">Menu</h1><div class="btns col"><button class="btn sec" id="mReg">Comment jouer</button><button class="btn sec" id="mSon">${Son.on ? 'Couper le son' : 'Activer le son'}</button><button class="btn sec" id="mRgl">Réglages</button><button class="btn sec" id="mSauv">Sauvegarde</button><button class="btn sec" id="mTut">Refaire l'entraînement</button><button class="btn sec" id="mAcc">Écran d'accueil</button>${COOP ? '<button class="btn sec" id="mSolo">Revenir à ma carrière solo</button>' : '<button class="btn sec" id="mCoop">Carrière coop</button><button class="btn sec" id="mNew">Recommencer ma carrière</button>'}<button class="btn" id="mFer">Fermer</button></div>`, () => { $('#mReg').onclick = regles; $('#mSon').onclick = () => { Son.on = !Son.on; fermerModal(); }; $('#mAcc').onclick = () => { fermerModal(); $('#barre-haut').innerHTML = ''; $('#nav').innerHTML = ''; accueil(); }; $('#mFer').onclick = fermerModal; $('#mTut').onclick = () => { fermerModal(); lancerTuto(1); }; $('#mSauv').onclick = ecranSauvegarde; $('#mRgl').onclick = ecranReglages; on('mSolo', () => { fermerModal(); quitterCoop(); C ? hub('vestiaire') : accueil(); }); on('mCoop', () => { fermerModal(); ecranCoop(); }); if ($('#mNew')) $('#mNew').onclick = () => modal(`<h1 class="lil">Recommencer ?</h1><p>Ta carrière avec ${clubPar(C.club).nom} sera effacée, sur ce téléphone et dans la sauvegarde automatique. Tes amis et ton code restent.</p><div class="btns"><button class="btn" id="mOui">Recommencer</button><button class="btn sec" id="mNon">Annuler</button></div>`, () => { $('#mOui').onclick = () => { fermerModal(); $('#barre-haut').innerHTML = ''; $('#nav').innerHTML = ''; demarrerNouvelle(); }; $('#mNon').onclick = fermerModal; }); }); };
  if (ONGLET === 'classement' || ONGLET === 'journal') ONGLET = 'competitions';
  const pret = C.formation.jeunes.some(j => j.prog >= 100);
  const tabs = [['vestiaire', 'stade', 'Vestiaire'], ['effectif', 'maillot', 'Effectif'], ['formation', 'pousse', 'Formation'], ['boutique', 'boutique', 'Boutique'], ['competitions', 'classement', 'Compét.'], ['amis', 'poignee', 'Amis']];
  $('#nav').innerHTML = tabs.map(([id, ic, nom]) => `<button class="onglet ${id === ONGLET ? 'on' : ''}" data-o="${id}">${img(ic)}<span>${nom}</span>${id === 'formation' && pret ? '<i class="pastille-notif"></i>' : ''}</button>`).join('');
  $('#nav').querySelectorAll('.onglet').forEach(b => (b.onclick = () => { Son.clic(); hub(b.dataset.o); }));
  ({ vestiaire, effectif, formation, boutique, competitions, amis })[ONGLET]();
  if (urlCloud() && ONGLET !== 'amis') chargerSocial().then(majPastilleAmis).catch(() => { });
  if (!COOP) verserPrimeSolo();
}
function maj() { sauver(); hub(ONGLET); }
function barreHaut() {
  const cl = clubPar(C.club);
  $('#barre-haut').innerHTML = `<div class="hb-club">${blason(cl, 34)}<div><b class="lil">${cl.nom}</b><small>${drapeau(C.pays, 14)} Saison ${C.saison} · ${nomDiv(C.div)}</small></div></div><div class="hb-pieces lil">${img('piece')}<span>${C.pieces}</span></div><button class="ico" id="bMenu" aria-label="Menu">≡</button>`;
}

// ---------- Vestiaire ----------
function vestiaire() {
  const m = prochainMatch();
  if (!m) return finDeSaison();
  const dl = dilemmeDuJour();
  if (dl) return dilemme(dl);
  const opp = clubPar(m.opp), moi = clubPar(C.club), dom = m.dom, ligue = m.comp === 'ligue', derby = ligue && opp.id === C.rival, met = METEOS[C.meteoProchaine];
  const rang = rangDe(C.club), l = C.classement[C.club];
  const cp = !ligue ? C.coupes[m.comp] : null;
  const conseil = !ligue ? (m.comp === 'eur' ? `${m.nom}, ${m.tour.toLowerCase()} contre ${opp.nom}. Les grands clubs d'Europe ne font pas de cadeau. En cas d'égalité : tirs au but.` : `${m.nom}, ${m.tour.toLowerCase()}. ${C.divisions[opp.id] < C.div ? `${opp.nom} joue au-dessus de nous : un exploit, ça se prépare.` : `Sur le papier on est favoris. Méfiance quand même.`} En cas d'égalité : tirs au but.`)
    : derby ? `Le derby contre ${opp.nom}. Toute la ville ne parle que de ça. Ne me fais pas honte.`
    : C.journee === 0 ? (C.saison > 1 && C.formation.jeunes.length ? `Nouvelle saison. Passe voir le centre de formation, des gamins viennent d'arriver.` : `Premier match de la saison. Lis bien le style de l'adversaire avant de jouer.`)
      : C.nouveautesV18 ? `Grosse nouveauté en défense : comme en attaque, chaque combinaison demande ses cartes. Muraille (Gardien + 3), Verrou (Marquage + Tacle + Interception), Récupération, Marquage serré, Sortie du gardien. Bloc n'est plus qu'un repli et n'a plus de fiche${C.nouveautesV18 > 1 ? ` : on t'a remboursé ${C.nouveautesV18} pièces` : ''}. Les fiches s'arrêtent au niveau 5 et coûtent plus cher à chaque niveau.`
      : C.nouveautesV17 ? `Bonne nouvelle pour les consignes : tu peux en ajouter une à ton action, en plus de tes cartes. Plus besoin de sacrifier un temps fort pour préparer le suivant.`
      : C.nouveautesV16 ? `Du nouveau, et ça va piquer. Après chaque temps fort, on ne pioche plus que 3 cartes : réfléchis avant de tout lâcher. Et au niveau Normal, le mur adverse est annoncé en fourchette. Si c'est trop dur, passe en Facile dans le menu, Réglages.`
      : C.nouveautesV10 ? `Du nouveau au club ! Chaque joueur a une couleur : 3 cartes de la même couleur font un Trio, 4 un Carton plein. Et je t'ai mis deux Consignes dans le paquet : Contre-pied et Pressing haut. Elles ne marquent rien, mais elles préparent le coup d'après.`
      : C.migre ? `Le championnat a changé : on joue maintenant contre tous les vrais clubs de la division, en matchs aller. Ton paquet, tes stars et tes pièces sont intactes. On repart du début de saison.`
      : C.pieces >= 120 && !C.boutique.achete.fiche && comboFavori() ? `Tu dors sur ${C.pieces} pièces ! Ton ${comboFavori().nom}, tu le joues tout le temps : passe à la boutique faire améliorer sa fiche tactique.`
      : fenetreMercato() && C.journee > 0 ? `Le mercato d'hiver est ouvert. Si un poste te manque, c'est le moment.`
      : rang <= Math.max(1, quotas(C.div).up) ? `On est ${rang === 1 ? 'premiers' : rang + 'es'}. ${C.div > 1 ? `Les ${quotas(C.div).up} premiers montent : on garde le cap.` : 'Le titre est à portée.'}`
        : rang > Object.keys(C.classement).length - quotas(C.div).down ? `On est dans le dur. Améliore tes meilleures cartes à la boutique, ça peut tout changer.`
          : C.formation.jeunes.some(j => j.prog >= 100) ? `Un gamin du centre est prêt. Lance-le en pro ou vends-le, mais décide-toi.`
            : pick([`Pense à tes changements de cartes : 3 par match, ne les garde pas pour la fin.`, `Une combinaison de niveau supérieur, c'est plus de points à chaque fois. La boutique vend des fiches tactiques.`]);
  const entete = ligue ? `${derby ? `${img('derby')} DERBY · ` : ''}${nomDiv(C.div)} · journée ${C.journee + 1} / ${C.calendrier.length} · ${dom ? 'à domicile' : 'à l’extérieur'}`
    : `${img(COUPES[cp.k].ic)} ${m.nom} · ${m.tour}`;
  const sousOpp = ligue ? `${rangDe(opp.id)}e · ${C.classement[opp.id].pts} pts` : opp.pays !== C.pays ? `${drapeau(opp.pays, 16)} ${nomDiv(C.divisions[opp.id] || opp.div, opp.pays)}` : nomDiv(C.divisions[opp.id]);
  const rep = C.ansD1 ? `<span class="chip">${img('etoile')}Réputation ${C.ansD1}</span>` : '';
  vue(`<div class="page">${bandeauCoop()}
    ${bulle('dede', conseil)}
    <div class="prochain ${derby ? 'derby' : ''} ${!ligue ? 'coupe ' + (m.comp === 'eur' ? 'europe' : '') : ''}">
      <div class="pm-haut lil">${entete}</div>
      <div class="pm-affiche"><div class="pm-club">${blason(moi, 64)}<b class="lil">${moi.nom}</b><small>${ligue ? `${rang}e · ${l.pts} pts` : nomDiv(C.div)}</small></div><div class="pm-vs lil">VS</div><div class="pm-club">${blason(opp, 64)}<b class="lil">${opp.nom}</b><small>${sousOpp}</small></div></div>
      <div class="pm-infos"><span class="chip">${img('tactique')}${STYLES[opp.style].nom}</span><span class="chip">${img(met.ic)}${met.nom}</span>${rep}</div>
      <div class="pm-detail">${STYLES[opp.style].txt}. Météo : ${met.txt.toLowerCase()}.${C.ansD1 ? ` Réputation ${C.ansD1} : tout le monde te prend au sérieux, adversaires +${Math.round(DIFF.r * C.ansD1 * 100)} %.` : ''}</div>
      <button class="btn gros large" id="bJouer">${COOP && C.coop.relais ? 'Jouer la 2e mi-temps' : COOP ? 'Jouer la 1re mi-temps' : ligue ? 'Jouer le match' : 'Jouer le ' + m.tour.toLowerCase()}</button>
    </div>
    ${C.offres && C.offres.length && C.journee === 0 && !COOP ? `<button class="coupe-ligne mercato" id="bOffres" data-merc="1">${img('poignee')}<b class="lil">${C.offres.length} club${C.offres.length > 1 ? 's' : ''} te ${C.offres.length > 1 ? 'veulent' : 'veut'}</b><small>Voir les offres avant le 1er match</small></button>` : ''}
    ${fenetreMercato() ? `<button class="coupe-ligne mercato" id="bMerc" data-merc="1">${img('poignee')}<b class="lil">Mercato ${fenetreMercato() === 'ete' ? 'd’été' : 'd’hiver'} ouvert</b><small>${C.mercato ? C.mercato.liste.length : 0} joueurs à recruter</small></button>` : ''}
    ${coupesResume()}
    ${objectifsHTML()}
    ${rivalHTML()}
    <h2 class="lil">Tes stars <small>${C.stars.length}/${MAX_STARS}</small></h2>
    <div class="stars-ligne">${Array.from({ length: MAX_STARS }, (_, i) => { const id = C.stars[i]; if (!id) return `<div class="star-slot vide">${img('etoile')}<small>libre</small></div>`; const s = STARS.find(x => x.id === id); return `<button class="star-slot r-${s.r}" data-s="${id}">${img(IC_STAR[id])}<small>${s.nom.replace(/^(Le |La |Les |L’)/, '')}</small></button>`; }).join('')}</div>
  </div>`);
  if (C.migre || C.nouveautesV10 || C.nouveautesV16 || C.nouveautesV17 || C.nouveautesV18) { C.migre = false; C.nouveautesV10 = false; C.nouveautesV16 = false; C.nouveautesV17 = false; C.nouveautesV18 = false; sauver(); }
  $('#bJouer').onclick = () => { Son.init(); Son.clic(); COOP ? lancerMatchCoop() : lancerMatch(); };
  brancherBandeauCoop();
  proposerFacile();
  on('bOffres', () => { Son.clic(); choixOffres(); });
  const bm = $('#bMerc'); if (bm) bm.onclick = () => { Son.clic(); SEG_EFF = 'mercato'; hub('effectif'); };
  document.querySelectorAll('.coupe-ligne:not([data-merc])').forEach(b => (b.onclick = () => { Son.clic(); SEG = 'coupes'; hub('competitions'); }));
  document.querySelectorAll('.star-slot[data-s]').forEach(b => (b.onclick = () => { const s = STARS.find(x => x.id === b.dataset.s); modal(`${img(IC_STAR[s.id], 'grande-ic')}<h1 class="lil">${s.nom}</h1><p class="rar r-${s.r}">${RARETES[s.r].nom}</p><p>${s.txt}</p><div class="btns"><button class="btn" id="mOk">OK</button></div>`, () => ($('#mOk').onclick = fermerModal)); }));
}
function objectifsHTML() {
  if (!C.objectifs || !C.objectifs.length) return '';
  return `<div class="objectifs"><div class="obj-titre">${img('president', 'mini-ic')} <b class="lil">Objectifs du président</b></div>${C.objectifs.map(o => `<div class="obj ${o.fait ? 'fait' : ''}"><span>${o.fait ? '✓' : '○'} ${OBJ_SAISON[o.id].txt(o)}</span><small>${o.fait ? 'fait' : o.id === 'rang' ? `actuellement ${rangDe(C.club)}e` : o.cible > 1 ? `${Math.min(o.prog, o.cible)}/${o.cible}` : ''} · +${OBJ_SAISON[o.id].prime}</small></div>`).join('')}</div>`;
}
function rivalHTML() {
  const r = C.rival && clubPar(C.rival); if (!r || !C.classement[C.rival]) return '';
  const ecart = C.classement[C.club].pts - C.classement[C.rival].pts;
  const j = C.calendrier.indexOf(C.rival), dans = j >= C.journee ? j - C.journee : null;
  return `<div class="rival">${blason(r, 34)}<div><b class="lil">Rival : ${r.nom}</b><small>${rangDe(C.rival)}e · ${ecart > 0 ? `${ecart} pt${ecart > 1 ? 's' : ''} derrière toi` : ecart < 0 ? `${-ecart} pt${ecart < -1 ? 's' : ''} devant toi` : 'à égalité'}${dans != null ? ` · derby ${dans === 0 ? 'maintenant' : `dans ${dans} journée${dans > 1 ? 's' : ''}`}` : ''}</small></div></div>`;
}
function etatCoupe(cp) {
  if (cp.gagne) return 'Vainqueur !';
  if (cp.elim) return `Éliminé en ${TOURS[cp.tour].toLowerCase()}`;
  return `${TOURS[cp.tour]} · après J${slotCoupe(cp.k, cp.tour)}`;
}
function coupesResume() {
  const cps = Object.values(C.coupes || {}); if (!cps.length) return '';
  return `<div class="coupes-mini">${cps.map(cp => `<button class="coupe-ligne ${cp.gagne ? 'gagne' : cp.elim ? 'elim' : ''}">${img(COUPES[cp.k].ic)}<b class="lil">${nomCoupe(cp.k)}</b><small>${etatCoupe(cp)}</small></button>`).join('')}</div>`;
}
function dilemme(o) {
  const d = o.d;
  vue(`<div class="page dilemme">
    <div class="dl-titre lil">${img('dede', 'dl-ic')}Au vestiaire</div>
    <h1 class="lil titre-page">${d.titre}</h1>
    ${bulle('dede', d.txt)}
    <button class="choix-dl" id="dA"><b class="lil">${d.a.lib}</b><small>${d.a.eff}</small></button>
    <button class="choix-dl" id="dB"><b class="lil">${d.b.lib}</b><small>${d.b.eff}</small></button>
  </div>`);
  const ch = k => { Son.clic(); resoudreDilemme(o, k); toast('Décision prise'); maj(); };
  $('#dA').onclick = () => ch('a'); $('#dB').onclick = () => ch('b');
}

// ---------- Effectif ----------
let FILTRE = 'tout';
let SEG_EFF = 'cartes';
function effectif() {
  const segs = `<div class="segments">${[['cartes', 'Cartes'], ['joueurs', 'Joueurs'], ['mercato', 'Mercato']].map(([k, n]) => `<button class="seg ${SEG_EFF === k ? 'on' : ''}" data-ge="${k}">${n}${k === 'mercato' && fenetreMercato() ? ' •' : ''}</button>`).join('')}</div>`;
  const brancher = () => document.querySelectorAll('[data-ge]').forEach(b => (b.onclick = () => { Son.clic(); SEG_EFF = b.dataset.ge; effectif(); }));
  if (SEG_EFF === 'joueurs') { joueurs(segs); return brancher(); }
  if (SEG_EFF === 'mercato') { mercato(segs); return brancher(); }
  const cartes = C.cartes.map(c => ({ ...c, val: valeurCarte(c) }))
    .filter(c => FILTRE === 'tout' || (FILTRE === 'att' ? TYPES[c.t].att === true : FILTRE === 'cons' ? !!TYPES[c.t].consigne : TYPES[c.t].att === false))
    .sort((a, b) => ((TYPES[b.t].att === true) - (TYPES[a.t].att === true)) || ((TYPES[a.t].consigne ? 1 : 0) - (TYPES[b.t].consigne ? 1 : 0)) || a.t.localeCompare(b.t) || b.val - a.val);
  const combos = tousCombos().filter(ficheAmeliorable);
  vue(`<div class="page">${segs}
    <div class="filtres">${[['tout', 'Tout'], ['att', 'Attaque'], ['def', 'Défense'], ['cons', 'Consignes']].map(([k, n]) => `<button class="chip ${FILTRE === k ? 'on' : ''}" data-f="${k}">${n}</button>`).join('')}<span class="compte">${C.cartes.length} cartes</span></div>
    <div class="grille-cartes">${cartes.map(c => carteHTML(c)).join('')}</div>
    <h2 class="lil">Tactiques <small>niveau des combinaisons</small></h2>
    <div class="liste-combos">${combos.map(k => { const n = C.niveaux[k.id] || 1; return `<div class="lcombo"><div class="ics">${k.ics.map(x => img(x)).join('')}</div><div class="lt"><b>${k.nom}</b><small>${k.txt}</small></div><div class="lm"><span class="lil">×${fmt(k.mult + 0.5 * (n - 1))}</span><small>niv. ${n}${n > 1 ? ' · +' + 5 * (n - 1) + ' pts' : ''}</small></div></div>`; }).join('')}</div>
    <p class="astuce">Jeu collectif : une action avec des joueurs des trois lignes (défense, milieu, attaque) gagne +1 au multiplicateur. La lettre D, M ou A en bas de chaque carte indique la ligne du joueur.</p>
  </div>`);
  brancher();
  document.querySelectorAll('[data-f]').forEach(b => (b.onclick = () => { Son.clic(); FILTRE = b.dataset.f; effectif(); }));
  document.querySelectorAll('.grille-cartes .carte').forEach(b => (b.onclick = () => ficheCarte(+b.dataset.id)));
}
const etoilesQ = q => '<span class="pot">' + Array.from({ length: 5 }, (_, i) => `<i class="${i < q ? 'on' : ''}"></i>`).join('') + '</span>';
function joueurs(segs) {
  const liste = effectifActif(), ouvert = !!fenetreMercato();
  const ordre = { G: 0, DEF: 1, MIL: 2, ATT: 3 };
  liste.sort((a, b) => (ordre[a.j.l] ?? 2) - (ordre[b.j.l] ?? 2));
  vue(`<div class="page">${segs}
    <p class="astuce">${liste.length} joueurs. Chaque joueur apporte ses cartes ; sa note s’ajoute à leur valeur.${ouvert ? '' : ' Les ventes se font pendant le mercato.'}</p>
    ${liste.map(({ j, i }) => { const cs = C.cartes.filter(c => c.ji === i); return `<div class="joueur"><div class="j-id"><b class="lil">${pastilleK(j.k)} ${j.nom}${j.recrue ? ' <em class="tag">recrue</em>' : j.formé ? ' <em class="tag">formé</em>' : ''}</b><small>${j.p}${j.note ? ` · note +${j.note}` : ''}${j.buts ? ` · ${j.buts} but${j.buts > 1 ? 's' : ''}` : ''}</small></div><div class="j-cartes">${cs.map(c => `<span class="mini-t r-${c.r}">${img(ICT[c.t])}</span>`).join('')}</div>${ouvert ? `<button class="btn sec petit" data-vj="${i}">Vendre ${valeurJoueur(i)} ${img('piece', 'mini-piece')}</button>` : ''}</div>`; }).join('')}
  </div>`);
  document.querySelectorAll('[data-vj]').forEach(b => (b.onclick = () => {
    const i = +b.dataset.vj, j = C.effectif[i], err = peutVendre(i);
    if (err) { toast(err); return; }
    modal(`<h1 class="lil">Vendre ${j.nom} ?</h1><p>Il part avec ses ${C.cartes.filter(c => c.ji === i).length} cartes. Tu touches ${valeurJoueur(i)} pièces.</p><div class="btns"><button class="btn" id="mOui">Vendre</button><button class="btn sec" id="mNon">Garder</button></div>`, () => {
      $('#mOui').onclick = () => { const p = vendreJoueur(i); Son.piece(); fermerModal(); toast(`${j.nom} vendu : +${p} pièces`); maj(); }; $('#mNon').onclick = fermerModal; });
  }));
}
function mercato(segs) {
  const f = fenetreMercato(), M = C.mercato;
  const mi = Math.floor(C.calendrier.length / 2);
  if (!f || !M) {
    vue(`<div class="page">${segs}${bulle('dede', `Le mercato est fermé. Il rouvre ${C.journee < mi ? `pour l'hiver, après la journée ${mi}` : 'cet été, en début de saison'}. En attendant, tu peux toujours entraîner tes cartes.`)}</div>`);
    return;
  }
  vue(`<div class="page">${segs}
    ${bulle('president', f === 'ete' ? `Mercato d'été. J'ai débloqué un peu d'argent. Recrute malin : chaque joueur ajoute 2 cartes à ton paquet.` : `Mercato d'hiver : dernière chance de renforcer l'équipe pour la deuxième partie de saison.`)}
    ${M.liste.length ? M.liste.map(o => { const r = RAR_POT[o.q], cl = clubPar(o.club); return `<div class="jeune recrue-c r-${r}"><div class="j-haut">${cl ? blason(cl, 40) : ''}<div class="j-id"><b class="lil">${pastilleK(o.k)} ${o.nom} ${o.pays !== C.pays ? drapeau(o.pays, 16) : ''}</b><small>${o.p} · ${o.k ? COULEURS[o.k].nom + ' · ' : ''}${o.age} ans · ${cl ? cl.nom : ''}</small>${etoilesQ(o.q)}</div><div class="j-cartes">${o.c.map(t => `<span class="mini-t r-${r}">${img(ICT[t])}</span>`).join('')}</div></div>
      <div class="j-btns"><span class="rar r-${r}">${RARETES[r].nom} · note +${o.q - 1}</span>${C.pieces < o.prix ? `<span class="manque">${o.prix} ${img('piece', 'mini-piece')} · il manque ${o.prix - C.pieces}</span>` : `<button class="btn petit" data-rec="${o.id}">Recruter ${o.prix} ${img('piece', 'mini-piece')}</button>`}</div></div>`; }).join('') : bulle('dede', 'Tu as fait le marché. Plus personne de disponible pour cette fenêtre.')}
    <p class="astuce">Les étoiles fixent la rareté des cartes et la note du joueur, qui s'ajoute à la valeur de chaque carte. Un paquet plus gros est moins régulier : vends ou retire les cartes faibles.</p>
  </div>`);
  document.querySelectorAll('[data-rec]').forEach(b => (b.onclick = () => {
    const o = M.liste.find(x => x.id === +b.dataset.rec);
    const cartes = recruter(o.id); if (!cartes) return;
    Son.jingle(); confettis();
    modal(`${img('poignee', 'grande-ic')}<h1 class="lil">${o.nom} signe !</h1><p>Il arrive de ${clubPar(o.club) ? clubPar(o.club).nom : 'l’étranger'} avec ses cartes.</p><div class="fiche-duo">${cartes.map(c => carteHTML(c, { cls: 'mini', tag: 'div' })).join('')}</div><div class="btns"><button class="btn" id="mOk">Bienvenue</button></div>`, () => ($('#mOk').onclick = () => { fermerModal(); maj(); }));
  }));
}
function ficheCarte(id) {
  const c = C.cartes.find(x => x.id === id); if (!c) return;
  Son.clic();
  const R = RARETES[c.r], j = C.effectif[c.ji], max = c.niv >= R.max || !!TYPES[c.t].consigne, cout = R.prix * c.niv;
  const sp = TYPES[c.t].consigne ? `<p class="sp-txt"><b>Consigne</b> : ${TYPES[c.t].txt}. Jouable en attaque comme en défense, 0 point.</p>` : c.sp ? `<p class="sp-txt"><b>${SPECIAUX[c.t].nom}</b> : ${SPECIAUX[c.t].txt}</p>` : '';
  modal(`<div class="fiche">${carteHTML(c, { cls: 'grande', tag: 'div' })}<div><p class="rar r-${c.r}">${R.nom} · niveau ${c.niv}/${R.max}</p><p><b>${j.nom}</b> ${pastilleK(j.k)}, ${j.p.toLowerCase()} · ${j.buts} but${j.buts > 1 ? 's' : ''}${j.k ? ` · ${COULEURS[j.k].nom}` : ''}</p>${sp}<p class="petit">Chaque niveau : +2 points.</p></div></div>
    <div class="btns col"><button class="btn" id="mUp" ${max || C.pieces < cout ? 'disabled' : ''}>${TYPES[c.t].consigne ? 'Une consigne ne s’entraîne pas' : max ? 'Niveau maximum' : `Entraîner : +2 pts (${cout} ${img('piece', 'mini-piece')})`}</button>
    <button class="btn sec" id="mDel" ${C.cartes.length <= 16 || C.pieces < 20 ? 'disabled' : ''}>Retirer du paquet (20 ${img('piece', 'mini-piece')})</button>
    <button class="btn sec" id="mFer">Fermer</button></div>
    <p class="petit centre">Retirer les cartes faibles rend ton paquet plus régulier. Minimum 16 cartes.</p>`, () => {
    $('#mFer').onclick = fermerModal;
    $('#mUp').onclick = () => { if (max || C.pieces < cout) return; C.pieces -= cout; c.niv++; Son.piece(); fermerModal(); toast(`${TYPES[c.t].nom} niveau ${c.niv} !`); maj(); };
    $('#mDel').onclick = () => { if (C.cartes.length <= 16 || C.pieces < 20) return; C.pieces -= 20; C.cartes = C.cartes.filter(x => x.id !== c.id); Son.clic(); fermerModal(); toast('Carte retirée'); maj(); };
  });
}

// ---------- Boutique ----------
const prixFiche = id => prixNiveau(C.niveaux[id] || 1);
const comboFavori = () => { const K = C.carnet && C.carnet.combos; if (!K) return null; const e = Object.entries(K).filter(([id]) => comboPar(id) && ficheAmeliorable(comboPar(id))).sort((a, b) => b[1] - a[1])[0]; return e ? comboPar(e[0]) : null; };
function choisirFiche() {
  const fav = comboFavori(), liste = tousCombos().filter(ficheAmeliorable);
  const nbJ = id => (C.carnet && C.carnet.combos && C.carnet.combos[id]) || 0; liste.sort((a, b) => nbJ(b.id) - nbJ(a.id));
  modal(`<h1 class="lil">Fiche tactique</h1><p class="petit">Choisis la combinaison à faire progresser.${fav ? ` Ta plus jouée : <b>${fav.nom}</b>.` : ''}</p>
    <div class="liste-fiches">${liste.map(k => { const n = C.niveaux[k.id] || 1, p = prixFiche(k.id), maxi = n >= NIV_MAX; return `<button class="lcombo fiche-ch" data-f="${k.id}" ${maxi || C.pieces < p ? 'disabled' : ''}><div class="ics">${k.ics.map(x => img(x)).join('')}</div><div class="lt"><b>${k.nom}</b><small>${maxi ? `niveau max (${NIV_MAX})` : `niv. ${n} → ${n + 1}`} · joué ${nbJ(k.id)} fois</small></div><div class="lm">${maxi ? '' : `<span class="lil">${p}</span>${img('piece', 'mini-ic')}`}</div></button>`; }).join('')}</div>
    <div class="btns"><button class="btn sec" id="fNon">Annuler</button></div>`, () => {
    document.querySelectorAll('.fiche-ch').forEach(bt => (bt.onclick = () => { const id = bt.dataset.f, p = prixFiche(id); if (C.pieces < p || (C.niveaux[id] || 1) >= NIV_MAX) return; C.pieces -= p; monterFiche(id); C.boutique.achete.fiche = true; Son.piece(); toast(`${comboPar(id).nom} niveau ${C.niveaux[id]}`); fermerModal(); maj(); }));
    $('#fNon').onclick = fermerModal;
  });
}
function boutique() {
  const b = C.boutique, st = b.star ? STARS.find(x => x.id === b.star) : null, fi = comboPar(b.fiche);
  const nf = C.niveaux[b.fiche] || 1;
  const offre = (k, ic, titre, sous, prix, deja, plein) => `<div class="offre ${deja ? 'vendu' : ''}">${img(ic, 'of-ic')}<div class="of-txt"><b class="lil">${titre}</b><small>${sous}</small></div><button class="btn prix" data-k="${k}" ${deja || plein || C.pieces < prix ? 'disabled' : ''}>${deja ? 'Acheté' : `${prix} ${img('piece', 'mini-piece')}`}</button></div>`;
  vue(`<div class="page">
    ${bulle('dede', 'Le stock change après chaque match. Les pièces se gagnent en jouant : victoire, buts, fin de saison.')}
    <div class="offres">
      ${st ? offre('star', IC_STAR[st.id], st.nom, `<span class="rar r-${st.r}">${RARETES[st.r].nom}</span> ${st.txt}`, PRIX_STAR[st.r], b.achete.star, C.stars.length >= MAX_STARS) : ''}
      ${offre('fiche', 'tactique', 'Fiche tactique au choix', 'La combinaison de ton choix gagne +0,5 au multiplicateur et +5 points. Dès 60 pièces', 60, b.achete.fiche)}
      ${offre('carte', ICT[b.carte.t], `${TYPES[b.carte.t].nom} ${RARETES[b.carte.r].nom.toLowerCase()}`, `Une nouvelle carte pour ton paquet`, b.carte.prix, b.achete.carte)}
    </div>
    ${C.stars.length >= MAX_STARS ? '<p class="astuce">Tes 5 places de stars sont prises.</p>' : ''}
    <p class="astuce">Pour entraîner ou retirer une carte, touche-la dans l'onglet Effectif.</p>
  </div>`);
  document.querySelectorAll('.offre [data-k]').forEach(bt => (bt.onclick = () => {
    const k = bt.dataset.k;
    if (k === 'star') { const p = PRIX_STAR[st.r]; if (C.pieces < p) return; C.pieces -= p; C.stars.push(st.id); toast(`${st.nom} rejoint le club !`); }
    if (k === 'fiche') return choisirFiche();
    if (k === 'carte') { if (C.pieces < b.carte.prix) return; C.pieces -= b.carte.prix; C.cartes.push(nouvelleCarte(b.carte.t, jiPourType(b.carte.t), b.carte.r)); toast('Nouvelle carte !'); }
    b.achete[k] = true; Son.piece(); maj();
  }));
}

// ---------- Compétitions : championnat, coupes, palmarès, La Une ----------
let SEG = 'ligue';
function competitions() {
  const segs = [['ligue', 'Championnat'], ['coupes', 'Coupes'], ['palmares', 'Palmarès'], ['une', 'La Une']];
  const corps = { ligue: segClassement, coupes: segCoupes, palmares: segPalmares, une: segUne }[SEG]();
  vue(`<div class="page"><div class="segments">${segs.map(([k, n]) => `<button class="seg ${SEG === k ? 'on' : ''}" data-g="${k}">${n}</button>`).join('')}</div>${corps}</div>`);
  document.querySelectorAll('[data-g]').forEach(b => (b.onclick = () => { Son.clic(); SEG = b.dataset.g; competitions(); }));
}
function segClassement() {
  const t = classementTrie(), n = t.length, Q = quotas(C.div), poule = aGroupes(C.pays, C.div) ? ` · groupe ${C.groupes[C.club]}` : '';
  return `<h1 class="lil titre-page">${nomDiv(C.div)}${poule}</h1><p class="astuce">${C.journee ? `Après ${C.journee} journée${C.journee > 1 ? 's' : ''} sur ${C.calendrier.length}` : `${C.calendrier.length} journées, matchs aller`}</p>
    <div class="table">${t.map((l, i) => { const cl = clubPar(l.id); const zone = i < Q.up ? 'montee' : i < Q.europe ? 'europe' : i >= n - Q.down ? 'descente' : ''; return `<div class="ligne ${l.id === C.club ? 'moi' : ''} ${zone}"><span class="rg lil">${i + 1}</span>${blason(cl, 22)}<span class="nm">${cl.nom}${l.id === C.rival ? ' ' + img('derby', 'mini-ic') : ''}</span><span class="st">${l.j} j · ${l.bp}-${l.bc}</span><span class="pt lil">${l.pts}</span></div>`; }).join('')}</div>
    <p class="astuce">${Q.up ? `<span class="pastille montee"></span> ${Q.up === 1 ? 'Le premier monte' : `Les ${Q.up} premiers montent`}. ` : '<span class="pastille europe"></span> 1er et 2e : Coupe des Champions. 3e et 4e : Coupe d’Europe. '}${Q.down ? `<span class="pastille descente"></span> Les ${Q.down} derniers descendent.` : ''}</p>`;
}
function segCoupes() {
  const cps = Object.values(C.coupes || {});
  const bloc = cp => { const K = COUPES[cp.k]; return `<div class="arbre ${cp.k !== 'nat' ? 'europe' : ''}"><div class="ar-titre lil">${img(K.ic)}${nomCoupe(cp.k)}</div>
    ${TOURS.map((t, i) => { const opp = clubPar(cp.adv[i]); const etat = i < cp.tour ? 'passe' : i === cp.tour && cp.elim ? 'perdu' : i === cp.tour && !cp.gagne ? 'next' : 'futur'; const cache = etat === 'futur' && i > cp.tour; return `<div class="tour ${etat}"><span class="t-nom lil">${t}</span>${cache ? `<span class="t-opp">${img('sablier', 'mini-ic')} Adversaire inconnu</span>` : `<span class="t-opp">${blason(opp, 22)}${opp.nom}${opp.pays !== C.pays ? ' ' + drapeau(opp.pays, 16) : ''}</span>`}<span class="t-etat">${etat === 'passe' ? '✓' : etat === 'perdu' ? '✕' : etat === 'next' ? 'après J' + slotCoupe(cp.k, i) : ''}</span></div>`; }).join('')}
    <div class="ar-pied">${cp.gagne ? `${img('trophee', 'mini-ic')} Vainqueur ! +${K.prime} pièces` : cp.elim ? 'Éliminé. Revanche la saison prochaine.' : `Victoire finale : +${K.prime} pièces`}</div></div>`; };
  const europe = C.coupes.eur ? '' : `<p class="astuce">${img('globe', 'mini-ic')} Termine dans le top 4 de ${nomDiv(1)} pour jouer une coupe d'Europe la saison suivante.</p>`;
  return `${cps.map(bloc).join('')}${europe}`;
}
function segPalmares() {
  const tr = C.trophees || [];
  const vitrine = tr.length ? `<div class="vitrine">${tr.map(t => `<div class="trophee-v">${img(t.k === 'nat' ? 'trophee' : t.k === 'titre' ? 'medaille' : 'globe')}<small>${t.nom}<br>saison ${t.s}</small></div>`).join('')}</div>` : bulle('dede', 'La vitrine du club est vide. J’ai pourtant fait de la place à côté de la photo de 1987.');
  const champ = tr.filter(t => t.k === 'titre').length, nbCoupes = tr.length - champ;
  return `<h1 class="lil titre-page">${img('trophee', 'titre-ic')}Vitrine</h1>${vitrine}
    <div class="stats-car"><div><b class="lil">${C.saison}</b><small>saison${C.saison > 1 ? 's' : ''}</small></div><div><b class="lil">${champ}</b><small>titre${champ > 1 ? 's' : ''}</small></div><div><b class="lil">${nbCoupes}</b><small>coupe${nbCoupes > 1 ? 's' : ''}</small></div><div><b class="lil">${C.formation.recrues || 0}</b><small>formé${(C.formation.recrues || 0) > 1 ? 's' : ''}</small></div></div>
    ${C.palmares.length ? `<h2 class="lil">Saison par saison</h2>${C.palmares.slice().reverse().map(p => `<div class="palm">${drapeau(p.pays || 'fr', 16)} Saison ${p.s}${p.club && clubPar(p.club) ? ' · ' + clubPar(p.club).nom : ''} · ${nomDiv(p.div, p.pays)} · ${p.rang}e ${{ montee: '· montée', champion: '· champion !', europe: '· qualifié en Europe', descente: '· relégué', maintien: '' }[p.issue]}${(p.coupes || []).map(c => `<small>${c.nom} : ${c.gagne ? 'vainqueur' : c.tour.toLowerCase()}</small>`).join('')}</div>`).join('')}` : ''}`;
}
function segUne() {
  return `<h1 class="lil titre-page">${img('journal', 'titre-ic')}La Une</h1>
    ${C.journal.length ? C.journal.slice(0, 30).map(a => `<div class="une ${a.comp ? 'une-coupe' : ''}"><div class="une-h">Saison ${a.s} · ${a.comp || nomDiv(a.div, a.pays) + ' · J' + a.j}</div><div class="une-t">${a.txt}</div><div class="une-s lil">${a.score}</div>${a.rival ? `<div class="une-r">${img('derby', 'mini-ic')} ${a.rival}</div>` : ''}</div>`).join('') : bulle('dede', 'Rien encore dans le journal. Joue ton premier match et on verra ce que la presse raconte.')}`;
}

// ---------- Centre de formation ----------
function formation() {
  const F = C.formation, N = CENTRE[F.niveau], suiv = CENTRE[F.niveau + 1];
  const etoiles = p => '<span class="pot">' + Array.from({ length: 5 }, (_, i) => `<i class="${i < p ? 'on' : ''}"></i>`).join('') + '</span>';
  const jeune = j => { const pret = j.prog >= 100, r = RAR_POT[j.pot];
    return `<div class="jeune ${pret ? 'pret' : ''}"><div class="j-haut"><div class="j-av">${img(pret ? 'diplome' : 'poussin')}</div><div class="j-id"><b class="lil">${pastilleK(j.k)} ${j.nom}</b><small>${j.p} · ${j.k ? COULEURS[j.k].nom + ' · ' : ''}${j.age || 17} ans</small>${etoiles(j.pot)}</div><div class="j-cartes">${j.c.map(t => `<span class="mini-t r-${r}">${img(ICT[t])}</span>`).join('')}</div></div>
      <div class="j-prog"><div class="barre"><i style="transform:scaleX(${j.prog / 100})"></i></div><small>${pret ? 'Prêt pour le monde pro' : j.prog + ' %'}</small></div>
      <div class="j-btns">${pret ? `<button class="btn petit" data-pro="${j.id}">Lancer en pro</button><button class="btn sec petit" data-vend="${j.id}">Vendre ${prixVente(j)} ${img('piece', 'mini-piece')}</button>`
        : `<button class="btn sec petit" data-seance="${j.id}" ${C.pieces < 30 ? 'disabled' : ''}>Séance +30 % · 30 ${img('piece', 'mini-piece')}</button><button class="btn sec petit" data-vend="${j.id}">Vendre ${Math.round(prixVente(j) * 0.4)} ${img('piece', 'mini-piece')}</button>`}</div></div>`; };
  vue(`<div class="page">
    <div class="centre-tete">${img('pousse', 'ct-ic')}<div><h1 class="lil">Centre de formation</h1><small>Niveau ${F.niveau} · ${F.jeunes.length}/${N.places} places · progression ${N.vit} % par match</small></div></div>
    ${F.jeunes.length ? F.jeunes.map(jeune).join('') : bulle('dede', 'Le centre est vide. De nouveaux jeunes arrivent à chaque début de saison s’il reste de la place.')}
    <div class="offre">${img('chantier', 'of-ic')}<div class="of-txt"><b class="lil">${suiv ? `Agrandir (niveau ${F.niveau + 1})` : 'Centre au maximum'}</b><small>${suiv ? `${suiv.places} places, ${suiv.vit} % par match, plus de chances de pépites.` : 'Le meilleur centre du pays.'}</small></div>${suiv ? `<button class="btn prix" id="bAgr" ${C.pieces < N.prix ? 'disabled' : ''}>${N.prix} ${img('piece', 'mini-piece')}</button>` : ''}</div>
    <p class="astuce">Le potentiel (étoiles) fixe la rareté des cartes du joueur : 3 étoiles rare, 4 épique, 5 légendaire. Un joueur lancé en pro ajoute ses 2 cartes à ton paquet. Deux jeunes arrivent à chaque début de saison.</p>
  </div>`);
  document.querySelectorAll('[data-pro]').forEach(b => (b.onclick = () => {
    const j = F.jeunes.find(x => x.id === +b.dataset.pro); const cartes = promouvoir(+b.dataset.pro); if (!cartes) return;
    Son.jingle(); confettis();
    modal(`${img('diplome', 'grande-ic')}<h1 class="lil">${j.nom} signe pro !</h1><p>Formé au club. Dédé lui a prêté son vieux maillot porte-bonheur.</p><div class="fiche-duo">${cartes.map(c => carteHTML(c, { cls: 'mini', tag: 'div' })).join('')}</div><div class="btns"><button class="btn" id="mOk">Super</button></div>`, () => ($('#mOk').onclick = () => { fermerModal(); maj(); }));
  }));
  document.querySelectorAll('[data-vend]').forEach(b => (b.onclick = () => {
    const j = F.jeunes.find(x => x.id === +b.dataset.vend);
    modal(`<h1 class="lil">Vendre ${j.nom} ?</h1><p>${j.prog >= 100 ? 'Il est prêt : il part au prix fort.' : 'Il n’a pas fini sa formation : tu le brades.'}</p><div class="btns"><button class="btn" id="mOui">Vendre</button><button class="btn sec" id="mNon">Garder</button></div>`, () => {
      $('#mOui').onclick = () => { const p = vendreJeune(j.id); Son.piece(); fermerModal(); toast(`+${p} pièces`); maj(); }; $('#mNon').onclick = fermerModal; });
  }));
  document.querySelectorAll('[data-seance]').forEach(b => (b.onclick = () => { if (seanceJeune(+b.dataset.seance)) { Son.piece(); toast('Séance spécifique : +30 %'); maj(); } }));
  const ag = $('#bAgr'); if (ag) ag.onclick = () => { if (agrandirCentre()) { Son.jingle(); toast(`Centre niveau ${F.niveau} !`); maj(); } };
}

