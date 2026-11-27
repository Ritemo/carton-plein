// =====================================================================
// MATCH
// =====================================================================
function lancerMatch() {
  document.body.className = 'match';
  $('#barre-haut').innerHTML = ''; $('#nav').innerHTML = '';
  nouveauMatch(prochainMatch());
  const met = METEOS[S.meteo], opp = S.eq.ia, inf = S.info;
  modal(`<div class="comp-tag lil ${S.comp === 'eur' ? 'europe' : S.comp === 'nat' ? 'coupe' : ''}">${inf.comp === 'ligue' ? inf.nom : inf.nom + ' · ' + inf.tour}</div><div class="coup-envoi">${blason(S.eq.p, 56)}<span class="lil">VS</span>${blason(opp, 56)}</div><h1 class="lil centre">${S.eq.p.nom} - ${opp.nom}</h1>
    <div class="regles"><div>${img('tactique')}<span><b>${STYLES[opp.style].nom}</b> : ${STYLES[opp.style].txt}.</span></div><div>${img(met.ic)}<span><b>${met.nom}</b> : ${met.txt}.</span></div><div class="defi">${img('medaille')}<span><b>Défi du match</b> : ${DEFIS.find(x => x.id === S.defi).txt} (+${PRIME_DEFI} pièces)</span></div></div>
    <div class="btns"><button class="btn gros" id="mGo">Coup d'envoi</button></div>`, () => ($('#mGo').onclick = () => { Son.sifflet(false); fermerModal(); afficherMatch(); }));
}
function afficherMatch() {
  if (!S || S.auto) return;
  if (S.type === 'penalty' && S.phase === 'choix') S.phase = 'penalty';
  const att = enAttaque(), sp = TF_SPECIAUX[S.type];
  document.body.className = 'match' + (!att ? ' defense' : '') + (S.comp === 'direct' ? ' direct' : '');
  vue(`<div class="match-vue">
    <div id="tableau"><div class="club">${blason(S.eq.p, 36)}<span class="lil">${S.eq.p.court}</span></div><div class="centre-sc"><div class="sc lil">${S.score.p}<span>-</span>${S.score.ia}</div><div class="mn lil ${S.comp !== 'ligue' ? 'cp' : ''}">${S.phase === 'fin' ? 'TERMINÉ' : S.minute + "'"}</div></div><div class="club d">${blason(S.eq.ia, 36)}<span class="lil">${S.eq.ia.court}</span></div></div>
    <div class="ligne-frise"><div class="frise">${Array.from({ length: NB_TF }, (_, i) => { const h = S.histo[i]; return `<span class="${i % 2 === 0 ? 'a' : 'd'} ${i === S.tf ? 'now' : ''} ${i < S.tf ? 'fait' : ''}">${h === 'p' ? img('ballon') : h === 'ia' ? '<b>✕</b>' : h === 'var' ? '<b>VAR</b>' : ''}</span>`; }).join('')}</div>
    <div id="stars">${S.stars.map(id => `<span class="star" data-mot="${id}">${img(IC_STAR[id])}</span>`).join('')}<span class="star meteo">${img(METEOS[S.meteo].ic)}</span></div></div>
    <div id="adv"></div>
    ${S.advAnnulee ? `<div class="effets-actifs"><span class="chip on">${img('ampoule')}Le Stratège a lu : ${CARTES_ADV[S.advAnnulee].nom} annulé</span></div>` : ''}
    ${S.adv && S.adv.length ? `<div class="cartes-adv">${S.adv.map(k => { const A = CARTES_ADV[k]; const txt = k === 'lecture' && S.favori ? `${comboPar(S.favori.id).nom} : −1 au combo` : A.txt; return `<div class="carte-adv ${k === 'star' ? 'star' : ''}">${img(A.ic)}<div><b>${k === 'star' ? `Le numéro 10 de ${S.eq.ia.nom}` : A.nom}</b><small>${txt}</small></div></div>`; }).join('')}</div>` : ''}
    ${S.actif && S.actif.src.length ? `<div class="effets-actifs">${S.actif.src.map(t => `<span class="chip on">${img('etincelles')}${t}</span>`).join('')}</div>` : ''}
    <div id="tuto-b"></div>
    <div id="action"></div>
    <div id="actions"></div>
    <div id="possibles"></div>
    <div id="main"></div>
  </div>`, 'match');
  Son.tension(0.02 + 0.08 * (S.tf / NB_TF));
  document.querySelectorAll('#stars .star').forEach(el => (el.onclick = () => {
    if (el.classList.contains('meteo')) { const M = METEOS[S.meteo], mods = Object.entries(M.mod || {}).map(([t, v]) => `${TYPES[t].nom} ${v > 0 ? '+' : ''}${v}`).join(', '); return infoBulle(M.ic, M.nom, `${M.txt}.${mods ? ` ${mods}.` : ''}`); }
    const st = STARS.find(x => x.id === el.dataset.mot); if (st) infoBulle(IC_STAR[st.id], st.nom, st.txt);
  }));
  const adv = $('#adv');
  const nb = n => S.fourchette ? `<span class="fourch">${S.fourchette[0]}<small>-</small>${S.fourchette[1]}</span>` : `<span class="${n >= 100 ? 'l3' : ''}">${n}</span>`;
  adv.classList.toggle('special', !!sp); adv.classList.remove('en-action');
  if (S.comp === 'direct') adv.innerHTML = `${blason(S.eq.ia, 40)}<div class="txt"><div class="titre lil">${echap(S.ami.pseudo)} ${att ? 'défend' : 'attaque'}</div><div class="sous">${att ? 'Il pose ses défenseurs en même temps que toi. Fais le plus gros total.' : 'Il prépare son attaque en même temps. Défends fort.'}</div></div><div class="cible ${att ? 'mur' : 'danger'} lil">${img(att ? 'mur' : 'feu', 'fond')}<span>?</span></div>`;
  else if (att) adv.innerHTML = `${blason(S.eq.ia, 40)}<div class="txt"><div class="titre lil">${sp ? sp.nom + ' !' : S.eq.ia.nom + ' défend'}</div><div class="sous">${sp ? sp.txt : (S.fourchette ? 'Le mur est quelque part dans la fourchette. Au-dessus : <b>but</b>. Dès 70 % : <b>occasion</b>.' : 'Dépasse le mur : <b>but</b>. Dès 70 % : <b>occasion</b>.')}</div></div><div class="cible mur lil">${img('mur', 'fond')}${nb(S.cible)}</div>`;
  else if (S.type === 'penalty') adv.innerHTML = `${blason(S.eq.ia, 40)}<div class="txt"><div class="titre lil">Penalty pour ${S.eq.ia.nom}</div><div class="sous">Faute dans la surface !</div></div><div class="cible danger lil">${img('filet', 'fond')}</div>`;
  else adv.innerHTML = `${blason(S.eq.ia, 40)}<div class="txt"><div class="titre lil">${S.eq.ia.nom} : ${comboPar(S.intention).nom}</div><div class="sous">Atteins <b>${S.fourchette ? `${S.fourchette[0]} à ${S.fourchette[1]}` : S.cible}</b> avec tes défenseurs.</div></div><div class="cible danger lil">${img('feu', 'fond')}${nb(S.cible)}</div>`;
  zoneAction();
}
function zoneAction() {
  const att = enAttaque(), ac = $('#action'), bt = $('#actions'), mn = $('#main');
  const tb = $('#tuto-b'); if (tb) tb.innerHTML = bulleTuto();
  const pz = $('#possibles');
  if (pz) { const t = S.phase === 'choix' && !S.modeChange && !S.tuto ? indice() : ''; pz.innerHTML = t ? `<span class="pz-i">${img('ampoule', 'ic')}${t}</span>` : ''; }
  bt.innerHTML = '';
  const ph = S.phase;
  if (ph === 'choix' || ph === 'calcul' || ph === 'attente') {
    const enCalc = ph === 'calcul' || ph === 'attente', r = enCalc ? S.anim.r : calcul(S.sel), vide = !S.sel.length && !enCalc;
    const pts = enCalc ? S.anim.pts : r.somme, mult = enCalc ? (S.anim.mult == null ? r.combo.mult : S.anim.mult) : r.mult, tot = enCalc ? (S.anim.total == null ? '?' : S.anim.total) : r.total;
    const sb = seuilBut();
    ac.innerHTML = `<div class="ruban lil ${vide ? 'vide' : ''}">${vide ? (S.modeChange ? 'Échange : touche les cartes à remplacer' : `${att ? 'Ton attaque' : 'Ta défense'} : jusqu'à ${maxJouees()} carte${maxJouees() > 1 ? 's' : ''}${S.main.some(c => estConsigne(c.t)) ? ' + 1 consigne' : ''}`) : r.combo.nom + (r.niv > 1 ? ` <small>niv. ${r.niv}</small>` : '')}</div>
      <div class="calcul"><div class="boite-pts"><span class="n lil">${vide ? 0 : pts}</span><small>points</small></div><div class="fois lil">×</div><div class="boite-mult"><span class="n lil">${vide ? 1 : fmt(mult)}</span><small>combo</small></div><div class="fois lil">=</div><div class="total"><span class="n lil">${vide ? 0 : tot}</span></div></div>
      <div class="jauge"><div class="rempli"></div>${S.fourchette ? (() => { const R = refCible(), s = att ? sb : 1, a = S.fourchette[0] * s / R / 1.3 * 100, b = S.fourchette[1] * s / R / 1.3 * 100; return `<span class="repere occ" style="left:${0.7 * S.fourchette[0] / R / 1.3 * 100}%"></span><span class="bande" style="left:${a}%;width:${b - a}%"></span>`; })() : `<span class="repere occ" style="left:${70 / 1.3}%"></span>`}<span class="repere but" style="left:${(S.fourchette ? (att ? sb : 1) * S.fourchette[1] / refCible() : (att ? sb : 1)) * 100 / 1.3}%">${img(att ? 'ballon' : 'bouclier')}</span></div>
      <div class="detail">${vide ? '' : detailCalcul(r)}</div>
      ${!vide && r.futur && r.futur.length ? `<div class="futur">${img('sablier', 'mini-ic')} Au prochain temps fort : ${r.futur.map(t => TYPES[t].txt.replace('Ton prochain temps fort ', '').replace(' au prochain temps fort', '').replace('Prochain objectif adverse', 'objectif adverse')).join(' · ')}</div>` : ''}`;
    majJauge(enCalc ? (S.anim.total == null ? 0 : S.anim.total) : (vide ? 0 : r.total));
    if (ph === 'attente') bt.innerHTML = `<div class="attente-dir lil">${img('sablier', 'mini-ic')} ${echap(S.ami.pseudo)} choisit ses cartes…</div>`;
    if (ph === 'choix') {
      if (S.modeChange) bt.innerHTML = `<button class="btn" id="bChg">Valider l'échange</button><button class="btn sec" id="bAnn">Annuler</button>`;
      else if (!S.sel.length && !S.changements && !S.main.some(c => TYPES[c.t].att === att || TYPES[c.t].consigne)) bt.innerHTML = `<button class="btn gros" id="bPasse">${att ? 'Pas de carte d’attaque : passer' : 'Pas de défenseur : subir'}</button>`;
      else bt.innerHTML = `<button class="btn gros" id="bJouer" ${S.sel.length ? '' : 'disabled'}>${att ? 'Attaquer' : 'Défendre'}</button><button class="btn sec" id="bChg" ${S.changements ? '' : 'disabled'} aria-label="Changer des cartes">🔄 ${S.changements}</button><button class="btn rond" id="bAide2" aria-label="Combinaisons">?</button>`;
    }
  } else if (ph === 'occasion' || ph === 'tirAdverse' || ph === 'penalty') {
    const moi = ph === 'occasion', pen = ph === 'penalty', gk = S.main.find(c => c.t === 'gardien');
    if (!moi && !S.tendance) S.tendance = { col: (S.ombre && S.ombre.tirs && pickPoids(S.ombre.tirs)) || pick(['G', 'C', 'D']) };
    const T = S.tirEtat || (S.tirEtat = { zone: null, col: null });
    const jauge = (vert, jaune) => `<div class="jauge-tir" id="jt"><i class="z-rouge"></i><i class="z-jaune" style="left:${50 - jaune / 2}%;width:${jaune}%"></i><i class="z-vert" style="left:${50 - vert / 2}%;width:${vert}%"></i><b id="curseur"></b></div>`;
    ac.innerHTML = `<div class="ruban lil">${moi ? (T.zone ? 'Frappe au bon moment !' : 'Occasion ! Vise une zone') : T.col ? 'Plonge au bon moment !' : pen ? 'Penalty ! Choisis ton côté' : S.eq.ia.nom + ' frappe ! Choisis ton côté'}</div>
      ${sceneTir({ moi, choix: true, zone: T.zone, col: T.col, gardienEq: moi ? S.eq.ia : S.eq.p })}
      ${moi ? (T.zone ? `${jauge(T.vert, T.jaune)}<div class="sous-cage"><b class="c-vert">Vert</b> : avantage au tireur. <b class="c-orange">Orange</b> : avantage au gardien. <b class="c-rouge">Rouge</b> : à côté.</div>`
        : `<div class="sous-cage">${S.res.total} sur ${S.cible} : le gardien va plonger d'un côté. ${S.res.valides.some(c => c.t === 'frappe') ? 'Ta Frappe élargit la zone verte.' : ''}</div>`)
        : T.col ? `${jauge(T.vert, T.jaune)}<div class="sous-cage"><b class="c-vert">Vert</b> : arrêt assuré si tu es du bon côté. <b class="c-orange">Orange</b> : tu peux le toucher. <b class="c-rouge">Rouge</b> : plongeon raté.</div>`
        : S.comp === 'direct' ? `<div class="sous-cage">${echap(S.ami.pseudo)} vise en même temps que toi. À toi de deviner.</div>`
        : `<div class="sous-cage">${img('ampoule', 'mini-ic')} Le tireur frappe souvent <b>${cote(S.tendance.col)}</b>.${pen && gk ? `<br><label class="sacrif"><input type="checkbox" id="sacr"> Sacrifier ton Gardien (${gk.val}) pour couvrir 2 côtés</label>` : ''}</div>`}`;
    if (moi && T.zone) { bt.innerHTML = `<button class="btn gros" id="bFrappe">Frapper !</button>`; lancerJauge(); }
    if (!moi && T.col) { bt.innerHTML = `<button class="btn gros" id="bPlonge">Plonger !</button>`; lancerJauge(); }
  } else if (ph === 'attenteTir') {
    const T = S.tirEtat || {}, moi = enAttaque();
    ac.innerHTML = `<div class="ruban lil">${moi ? 'Frappe partie…' : 'Plongeon choisi…'}</div>${sceneTir({ moi, choix: false, zone: T.zone, col: T.col, gardienEq: moi ? S.eq.ia : S.eq.p })}`;
    bt.innerHTML = `<div class="attente-dir lil">${img('sablier', 'mini-ic')} ${echap(S.ami.pseudo)} ${moi ? 'plonge' : 'frappe'}…</div>`;
  } else if (ph === 'tirRes') {
    const t = S.tir;
    const titre = t.moiTire ? (t.marque ? 'BUT !' : t.horsCadre ? 'À côté !' : 'Arrêté !') : (t.marque ? 'But adverse' : 'Arrêt !');
    ac.innerHTML = `<div class="ruban lil ${t.marque === t.moiTire ? 'gagne' : 'perd'}">${titre}</div>
      ${sceneTir({ moi: t.moiTire, final: t, gardienEq: t.moiTire ? S.eq.ia : S.eq.p })}
      <div class="sous-cage">${t.texte}</div>`;
    bt.innerHTML = `<button class="btn gros" id="bSuite">${S.tf === NB_TF - 1 ? 'Coup de sifflet final' : 'Temps fort suivant'}</button>`;
  } else {
    const r = S.res || { combo: {}, total: 0 };
    const R = {
      but: ['ballon', 'BUT !', `${r.combo.nom} à ${r.total} : le mur${S.fourchette ? ' était à' : ''} ${S.cible}${S.fourchette ? ', il a cédé' : ' a cédé'}.`, 'gagne'],
      rate: ['mur', 'Le mur tient', `${r.total}, trop peu : le mur était à ${S.cible}.`, 'perd'],
      stoppe: ['bouclier', 'Action stoppée !', `${r.combo.nom} à ${r.total} contre ${S.cible}.`, 'gagne'],
      butAdverse: ['feu', 'But adverse', `Ta défense (${r.total}) n'a rien pu faire contre ${S.cible}.`, 'perd']
    }[ph] || ['ballon', '', '', ''];
    if (S.comp === 'direct' && S.duelAdv) {
      const c = S.duelAdv.combo;
      R[2] = { but: `${r.total} contre sa défense (${S.cible}) : ça passe !`, rate: `Sa défense (${S.cible}) a tout bloqué.`, stoppe: `Ta défense (${r.total}) stoppe son ${c} (${S.cible}).`, butAdverse: `Son ${c} (${S.cible}) passe ta défense (${r.total}).` }[ph] || R[2];
    }
    ac.innerHTML = `<div class="resultat ${R[3]}">${img(R[0], 'icone-res')}<div><div class="titre-res lil">${R[1]}</div><div class="sous">${R[2]}</div></div></div>`;
    bt.innerHTML = `<button class="btn gros" id="bSuite">${S.tf === NB_TF - 1 ? 'Coup de sifflet final' : 'Temps fort suivant'}</button>`;
  }
  // main
  const visible = ph === 'choix' || ph === 'calcul' || ph === 'attente';
  // ce que la carte vaut vraiment ici (météo, stars, cartes adverses, lecture...) avant même de la choisir
  const plusDe = c => {
    if (TYPES[c.t].consigne || TYPES[c.t].att !== att) return '';
    const autres = S.sel.filter(x => x.id !== c.id && TYPES[x.t].att === att), { v, notes } = valeurEnMatch(c, att, compteTypes([...autres, c]));
    if (v === c.val) return '';
    if (v === 0) return '0';
    if (v === c.val * 2) return '×2';
    return (v > c.val ? '+' : '') + (v - c.val);
  };
  mn.innerHTML = S.main.map((c, i) => {
    const sel = S.sel.some(x => x.id === c.id), utile = TYPES[c.t].att === att || !!TYPES[c.t].consigne;
    const cls = (sel ? 'sel ' : '') + (!visible || (!utile && !S.modeChange) ? 'off ' : '') + (S.modeChange && sel ? 'change ' : '') + (ph === 'choix' && !S.dejaVu ? 'distrib' : '');
    return carteHTML(c, { cls, plus: visible && utile ? plusDe(c) : '', style: `--i:${i}` });
  }).join('');
  S.dejaVu = true;
  mn.querySelectorAll('.carte').forEach(el => (el.onclick = () => { const c = S.main.find(x => x.id === +el.dataset.id); if (c) choisirCarte(c); }));
  const on = (id, f) => { const b = document.getElementById(id); if (b) b.onclick = f; };
  on('bJouer', jouer); on('bPasse', () => jouer(true)); on('bChg', changer); on('bAnn', () => { S.modeChange = false; S.sel = []; zoneAction(); }); on('bSuite', suiteTF); on('bAide2', aideCombos);
  ac.querySelectorAll('[data-z]').forEach(b => (b.onclick = () => choisirZone(b.dataset.z)));
  ac.querySelectorAll('[data-col]').forEach(b => (b.onclick = () => plonger(b.dataset.col)));
  const bf = $('#bFrappe'); if (bf) bf.onclick = frapper;
  const bpl = $('#bPlonge'); if (bpl) bpl.onclick = plongeon;
  const jt = $('#jt'); if (jt) jt.onclick = () => (S.phase === 'occasion' ? frapper() : plongeon());
}
// détail du calcul : d'où viennent les points et le multiplicateur
function detailCalcul(r) {
  if (!r.valides.length) return `<span class="dc neutre">Aucune carte qui marque</span>`;
  const coul = b => /^(Trio|Carton plein)/.test(b) && r.couleur ? `style="--k:${COULEURS[r.couleur.k].hex}"` : '';
  const pts = `<span class="dc pts">Points : ${r.pts.map(p => p.v).join(' + ')}${r.plus ? ` + ${r.plus} fiche` : ''} = ${r.somme}</span>`;
  const total = r.bonusMult.filter(b => /Supporters|Contre-pied/.test(b));
  const mult = r.bonusMult.filter(b => !/Supporters|Contre-pied/.test(b));
  const notes = r.pts.filter(p => p.notes.length).map(p => `${TYPES[p.c.t].nom} ${p.notes.join(', ')}`);
  return `<div class="dc-ligne">${pts}</div>${notes.length ? `<div class="dc-ligne">${[...new Set(notes)].map(t => `<span class="dc note">${t}</span>`).join('')}</div>` : ''}<div class="dc-ligne"><span class="dc base">${r.combo.nom} ×${fmt(r.combo.mult)}</span>${mult.map(b => `<span class="dc ${/^(Trio|Carton plein)/.test(b) ? 'coul' : ''}" ${coul(b)}>${b}</span>`).join('')}<span class="dc egal">= ×${fmt(r.mult)}</span></div>`
    + (total.length ? `<div class="dc-ligne">${total.map(b => `<span class="dc tot">${b} sur le total</span>`).join('')}</div>` : '');
}
function majJauge(total) {
  const g = document.querySelector('.jauge .rempli'); if (!g) return;
  const pct = Math.min(100, total / (refCible() * 1.3) * 100);
  g.style.transform = `scaleX(${pct / 100})`;
  const sb = enAttaque() ? seuilBut() : 1, F = S.fourchette;
  // avec une fourchette : vert seulement si c'est sûr, jaune rayé si ça peut passer
  g.className = 'rempli ' + (S.comp === 'direct' && !S.duelAdv ? '' : F ? (total >= sb * F[1] ? 'ok' : total >= sb * F[0] ? 'peut' : total >= 0.7 * F[0] ? 'presque' : '') : total >= sb * S.cible ? 'ok' : total >= 0.7 * S.cible ? 'presque' : '');
}
function majCalcul() {
  const r = S.anim.r, p = document.querySelector('.boite-pts .n'), m = document.querySelector('.boite-mult .n'), t = document.querySelector('.total .n');
  if (p) p.textContent = S.anim.pts; if (m) m.textContent = fmt(S.anim.mult == null ? r.combo.mult : S.anim.mult);
  if (t) t.textContent = S.anim.total == null ? '?' : S.anim.total;
  majJauge(S.anim.total == null ? 0 : S.anim.total);
}
function choisirCarte(c) {
  if (S.phase !== 'choix') return;
  if (TYPES[c.t].att !== enAttaque() && !TYPES[c.t].consigne && !S.modeChange) { toast(enAttaque() ? 'Carte de défense : elle servira en défense' : 'Carte d’attaque : elle servira en attaque'); return; }
  Son.init(); Son.clic();
  const i = S.sel.findIndex(x => x.id === c.id);
  if (i >= 0) S.sel.splice(i, 1);
  else if (S.modeChange || peutAjouter(S.sel, c)) S.sel.push(c);
  else { toast(estConsigne(c.t) ? 'Une seule consigne par temps fort' : `${maxJouees()} carte${maxJouees() > 1 ? 's' : ''} maximum ici, plus 1 consigne`); return; }
  zoneAction();
}
function changer() {
  if (S.changements <= 0) return;
  Son.clic();
  if (!S.modeChange) { S.modeChange = true; S.sel = []; return zoneAction(); }
  if (!S.sel.length) { S.modeChange = false; return zoneAction(); }
  const n = S.sel.length; S.sel.forEach(c => { S.main = S.main.filter(x => x.id !== c.id); S.defausse.push(c); });
  S.changements--; S.sel = []; S.modeChange = false; S.dejaVu = false; piocher(n); zoneAction();
}
async function jouer(force) {
  if (S.phase !== 'choix' || (!S.sel.length && force !== true)) return;
  Son.init();
  const r = calcul(S.sel);
  noterChoix(r);
  S.phase = 'calcul'; S.anim = { r, pts: 0, mult: null, total: null };
  zoneAction();
  SCENE = REDUIT ? null : creerScene(r);
  for (let i = 0; i < r.pts.length; i++) {
    S.anim.pts += r.pts[i].v; Son.tick(i); gesteSuivant(SCENE);
    const el = document.querySelector(`#main .carte[data-id="${r.pts[i].c.id}"]`);
    if (el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); flotter(el, '+' + r.pts[i].v); }
    majCalcul(); await sleep(360);
  }
  if (r.plus) { S.anim.pts += r.plus; flotterCentre('+' + r.plus + ' tactique'); majCalcul(); await sleep(300); }
  S.anim.mult = r.mult; Son.mult(); majCalcul();
  const mb = document.querySelector('.boite-mult'); if (mb) { mb.classList.remove('slam'); void mb.offsetWidth; mb.classList.add('slam'); }
  secouer(); etoilesActives(r).forEach(allumer);
  await sleep(320);
  await compter(r.total);
  let t;
  if (S.comp === 'direct') { try { t = await attendreDuel(r); } catch (e) { if (S) { toast(e.message === 'quitté' ? 'Match arrêté' : e.message); quitterDirect(); S = null; hub('amis'); } return; } }
  else t = issue(r);
  if (t === 'but' || t === 'stoppe') { const tt = document.querySelector('.total'); if (tt) tt.classList.add('enfeu'); }
  finAction(SCENE, t);
  await sleep(650);
  document.querySelectorAll('#main .carte.sel').forEach(el => el.classList.add('part'));
  await sleep(250);
  retirerJouees(S.sel);
  activerConsignes(S.sel);
  if (r.consignes.some(c => c.t === 'relance')) toast('Relance rapide : +2 cartes');
  if (r.total > S.stats.meilleur) { S.stats.meilleur = r.total; S.stats.meilleurCombo = r.combo.nom; }
  S.res = r; S.issueType = t;
  if (t === 'occasion' || t === 'tirAdverse') { S.phase = t; return zoneAction(); }
  S.marque = finTempsFort(t, r);
  S.phase = t;
  if (t === 'but') { Son.but(); celebrer('but', nomButeur()); confettis(); }
  if (t === 'butAdverse') { Son.perdu(); flash('But adverse'); }
  if (t === 'stoppe') { Son.arret(); const g = r.valides.find(c => c.t === 'gardien'); celebrer(g ? 'arret' : 'stop', g ? C.effectif[g.ji].nom : null); }
  if (t === 'rate') Son.perdu();
  rafraichirTableau(); zoneAction();
}
// ---------- Tirs : 6 zones, jauge de frappe, gardien qui plonge ----------
const ZONES = ['HG', 'HC', 'HD', 'BG', 'BC', 'BD'];
const nomZone = z => ({ H: 'en haut', B: 'à ras de terre' })[z[0]] + ' ' + cote(z[1]);
function gardienSVG(eq) {
  return `<svg viewBox="0 0 60 70" class="gk-svg" aria-hidden="true"><circle cx="30" cy="14" r="10" fill="#ffd2a1" stroke="#000" stroke-width="2.5"/><rect x="16" y="24" width="28" height="30" rx="8" fill="${eq.c1 === '#ffffff' ? eq.c2 : eq.c1}" stroke="#000" stroke-width="2.5"/><rect x="20" y="52" width="8" height="14" rx="3" fill="#1c1240"/><rect x="32" y="52" width="8" height="14" rx="3" fill="#1c1240"/><circle cx="8" cy="30" r="7" fill="#9b5cff" stroke="#000" stroke-width="2.5"/><circle cx="52" cy="30" r="7" fill="#9b5cff" stroke="#000" stroke-width="2.5"/><path d="M16 30 L10 30 M44 30 L50 30" stroke="#000" stroke-width="5"/></svg>`;
}
const POS_ZONE = { HG: [19, 22], HC: [50, 22], HD: [81, 22], BG: [19, 60], BC: [50, 60], BD: [81, 60] };
const POS_GK = { G: 'translate(-112%,10%) rotate(-75deg)', C: 'translate(0,-28%)', D: 'translate(112%,10%) rotate(75deg)' };
function sceneTir(o) {
  const f = o.final;
  const zonesHTML = o.choix && o.moi && !o.zone ? `<div class="zones6">${ZONES.map(z => `<button class="z6" data-z="${z}" aria-label="Viser ${nomZone(z)}"></button>`).join('')}</div>`
    : o.choix && !o.moi && o.col ? `<div class="zones3 fixe">${['G', 'C', 'D'].map(c => `<span class="z3 ${c === o.col ? 'vise' : ''}"></span>`).join('')}</div>`
    : o.choix && !o.moi ? `<div class="zones3">${['G', 'C', 'D'].map(c => `<button class="z3" data-col="${c}" aria-label="Plonger ${cote(c)}">${{ G: '⤺', C: '⤒', D: '⤻' }[c]}</button>`).join('')}</div>`
    : o.zone ? `<div class="zones6 fixe">${ZONES.map(z => `<span class="z6 ${z === o.zone ? 'vise' : ''}"></span>`).join('')}</div>` : '';
  const gkT = f ? POS_GK[f.gk] : 'none';
  const bp = f ? (f.horsCadre ? [POS_ZONE[f.zone][0], -6] : f.marque ? POS_ZONE[f.zone] : f.rebond) : [50, 92];
  return `<div class="scene-tir ${f && f.marque ? 'filet-bouge' : ''}">
    <svg class="but-svg" viewBox="0 0 300 150" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="maille" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 0 L12 12 M12 0 L0 12" stroke="rgba(255,255,255,.35)" stroke-width="1"/></pattern></defs><rect x="10" y="8" width="280" height="142" fill="url(#maille)"/><path d="M10 150 L10 8 L290 8 L290 150" fill="none" stroke="#fff" stroke-width="8" stroke-linejoin="round"/><path d="M10 150 L10 8 L290 8 L290 150" fill="none" stroke="#000" stroke-width="2" transform="translate(0,0)"/></svg>
    ${zonesHTML}
    <div class="gk" style="transform:${gkT}">${gardienSVG(o.gardienEq)}</div>
    <img class="balle-t" src="${IMG.ballon}" alt="" style="left:${bp[0]}%;top:${bp[1]}%">
  </div>`;
}
function choisirZone(z) {
  Son.init(); Son.clic();
  const r = S.res, frappe = r.valides.some(c => c.t === 'frappe'), ratio = r.total / S.cible;
  S.tirEtat = { zone: z, vert: Math.round((16 + (frappe ? 8 : 0) + (ratio >= 0.9 ? 6 : 0) + (aStar('lucarne') ? 14 : 0)) * (jaugeDure() ? 0.6 : 1)), jaune: jaugeDure() ? 50 : 62 };
  zoneAction();
}
let JAUGE = null;
// niveau Normal (et défi, direct) : zone verte plus étroite, curseur plus rapide
const jaugeDure = () => S && (S.comp === 'defi' || S.comp === 'direct' || reglages().difficulte !== 'facile') && !S.tuto;
function lancerJauge() {
  cancelAnimationFrame(JAUGE && JAUGE.raf);
  const cur = $('#curseur'); if (!cur) return;
  const t0 = performance.now(), periode = jaugeDure() ? 820 : 1100;
  JAUGE = { pos: 0, raf: 0 };
  const pas = t => { const x = ((t - t0) % (2 * periode)) / periode; JAUGE.pos = x <= 1 ? x : 2 - x; cur.style.transform = `translateX(${JAUGE.pos * 100}cqw)`; cur.style.left = ''; JAUGE.raf = requestAnimationFrame(pas); };
  if (REDUIT) { JAUGE.pos = 0.5; cur.style.transform = 'translateX(50cqw)'; return; }
  JAUGE.raf = requestAnimationFrame(pas);
}
async function frapper() {
  if (S.phase !== 'occasion' || !S.tirEtat || !S.tirEtat.zone || !JAUGE) return;
  cancelAnimationFrame(JAUGE.raf);
  const T = S.tirEtat, z = T.zone, qualite = qualiteJauge(JAUGE.pos, T.vert, T.jaune);
  if (S.comp === 'direct') {
    let d; try { d = await attendreTir(true, { zone: z, q: qualite }); } catch (e) { if (S) { toast('Match arrêté'); quitterDirect(); S = null; hub('amis'); } return; }
    const g = d.gardien, nom = echap(S.ami.pseudo);
    noterTir(true, qualite, { marque: d.R.marque, col: z[1] });
    const t = { moiTire: true, zone: z, gk: g.col, marque: d.R.marque, horsCadre: d.R.horsCadre, qualite, rebond: [POS_ZONE[z][0] + (z[1] === 'D' ? 12 : -12), Math.min(88, POS_ZONE[z][1] + 26)] };
    t.texte = t.horsCadre ? `Frappe ratée : le ballon passe ${z[0] === 'H' ? 'au-dessus' : 'à côté'}.` : !d.R.bonCote ? `Tir ${nomZone(z)}, ${nom} a plongé ${cote(g.col)}.` : d.R.marque ? `${nom} avait deviné, mais ta frappe passe !` : `${nom} a deviné et sorti le ballon.`;
    return resoudreTir(t);
  }
  const { gk, devine, marque } = issueFrappe(z, qualite, S.ombre && S.ombre.plongeons ? pickPoids(S.ombre.plongeons) : null);
  noterTir(true, qualite, { marque, col: z[1] });
  const t = { moiTire: true, zone: z, gk, marque, horsCadre: qualite === 'rouge', qualite, rebond: [POS_ZONE[z][0] + (z[1] === 'D' ? 12 : -12), Math.min(88, POS_ZONE[z][1] + 26)] };
  t.texte = t.horsCadre ? `Frappe ratée : le ballon passe ${z[0] === 'H' ? 'au-dessus' : 'à côté'}.` : marque ? (devine ? 'Le gardien était du bon côté, mais la frappe parfaite le bat !' : `Tir ${nomZone(z)}, le gardien plonge ${cote(gk)}.`) : devine ? `Le gardien a deviné : tir ${nomZone(z)}.` : 'Frappe trop molle : le gardien a le temps de revenir.';
  resoudreTir(t);
}
function plonger(col) {
  if (S.phase !== 'tirAdverse' && S.phase !== 'penalty') return;
  Son.init(); Son.clic();
  const gant = (S.res && S.res.valides && S.res.valides.some(c => c.t === 'gardien')) || aStar('mur');
  S.tirEtat = { zone: null, col, sac: S.phase === 'penalty' && document.getElementById('sacr') && document.getElementById('sacr').checked, vert: Math.round((18 + (gant ? 8 : 0)) * (jaugeDure() ? 0.6 : 1)), jaune: jaugeDure() ? 50 : 62 };
  zoneAction();
}
async function plongeon() {
  if ((S.phase !== 'tirAdverse' && S.phase !== 'penalty') || !S.tirEtat || !S.tirEtat.col || !JAUGE) return;
  cancelAnimationFrame(JAUGE.raf);
  const T = S.tirEtat, col = T.col, pen = S.phase === 'penalty', qualite = qualiteJauge(JAUGE.pos, T.vert, T.jaune);
  if (S.comp === 'direct') {
    let d; try { d = await attendreTir(false, { col, q: qualite }); } catch (e) { if (S) { toast('Match arrêté'); quitterDirect(); S = null; hub('amis'); } return; }
    const z = d.tir.zone, nom = echap(S.ami.pseudo);
    noterTir(false, qualite, { bonCote: d.R.bonCote, arret: !d.R.marque, col });
    const t = { moiTire: false, zone: z, gk: col, couverts: [col], marque: d.R.marque, horsCadre: d.R.horsCadre, rebond: [POS_ZONE[z][0] + (z[1] === 'D' ? 12 : -12), Math.min(88, POS_ZONE[z][1] + 26)] };
    t.texte = d.R.horsCadre ? `${nom} rate sa frappe : à côté !` : !d.R.bonCote ? `${nom} tire ${nomZone(z)}, tu as plongé ${cote(col)}.` : d.R.marque ? 'Bon côté, mais la frappe était trop belle.' : `Arrêt ! Tu as lu le tir de ${nom}.`;
    return resoudreTir(t, false);
  }
  const couverts = [col];
  if (T.sac) { const g = S.main.find(x => x.t === 'gardien'); if (g) retirerJouees([g]); couverts.push(col === 'C' ? pick(['G', 'D']) : 'C'); }
  const { zone: z, colTir, bonCote, arret } = issuePlongeon(qualite, couverts, S.tendance.col);
  noterTir(false, qualite, { bonCote, arret, col });
  const t = { moiTire: false, zone: z, gk: arret || qualite !== 'rouge' ? col : 'C', couverts, marque: !arret, rebond: [POS_ZONE[z][0] + (colTir === 'D' ? 12 : -12), Math.min(88, POS_ZONE[z][1] + 26)] };
  t.texte = arret ? `${qualite === 'vert' ? 'Plongeon parfait' : 'Du bout des gants'} : tir ${nomZone(z)}${T.sac ? ', ton sacrifice a payé' : ''}.`
    : !bonCote ? `Tir ${nomZone(z)}, tu as plongé ${cote(col)}.` : qualite === 'rouge' ? 'Bon côté, mais plongeon raté : trop tôt ou trop tard.' : 'Bon côté, mais le ballon passe sous les gants.';
  resoudreTir(t, pen);
}
function resoudreTir(t, pen) {
  Son.frappe();
  S.marque = t.moiTire ? finTempsFort('occasion', S.res, t) : finTempsFort('tirAdverse', pen ? null : S.res, t);
  S.tir = t; S.tirEtat = null; S.tendance = null; S.phase = 'tirAnim';
  // animation : le gardien plonge, le ballon file
  const sc = document.querySelector('.scene-tir'), gk = sc && sc.querySelector('.gk'), b = sc && sc.querySelector('.balle-t');
  const fin = () => {
    S.phase = 'tirRes';
    if (t.moiTire && t.marque) { Son.but(); celebrer('but', nomButeur()); confettis(); }
    else if (!t.moiTire && t.marque) { Son.perdu(); flash('But adverse'); }
    else if (!t.moiTire) { Son.arret(); celebrer('arret', nomGardien()); }
    else Son.arret();
    rafraichirTableau(); zoneAction();
  };
  if (!sc || REDUIT) return fin();
  sc.querySelectorAll('.z6,.z3').forEach(e => (e.style.pointerEvents = 'none'));
  const cible = t.horsCadre ? [POS_ZONE[t.zone][0], -6] : POS_ZONE[t.zone];
  const W = sc.clientWidth, H = sc.clientHeight, dx = (cible[0] - 50) / 100 * W, dy = (cible[1] - 92) / 100 * H;
  gk.animate([{ transform: 'none' }, { transform: POS_GK[t.gk] }], { duration: 380, delay: 120, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' });
  const anim = b.animate([{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: `translate(calc(-50% + ${dx * 0.55}px), calc(-50% + ${dy * 0.6 - 30}px)) scale(.8)`, offset: 0.55 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.62)` }], { duration: 520, easing: 'cubic-bezier(.3,.1,.3,1)', fill: 'forwards' });
  anim.onfinish = () => setTimeout(fin, t.marque ? 120 : 380);
}
function rafraichirTableau() { const s = document.querySelector('#tableau .sc'); if (s) s.innerHTML = `${S.score.p}<span>-</span>${S.score.ia}`; }
function suiteTF() {
  Son.clic(); S.histo.push(S.marque || ''); S.marque = ''; S.duelAdv = null; S.tf++; S.dejaVu = false; if (S.tf === NB_TF / 2) Son.sifflet(false);
  if (S.coopMoitie === 1 && S.tf === NB_TF / 2) return pauseCoop();
  const go = () => { piocher(PIOCHE_TF); preparerTF(); };
  const e = S.comp === 'defi' || S.comp === 'direct' ? null : tirerEvenement(); if (!e) return go();
  const T = TEXTE_EVT[e.id](e);
  modal(`${img(T.ic, 'grande-ic')}<h1 class="lil">${T.titre}</h1><p>${T.txt}</p><div class="btns col">${T.a ? `<button class="btn" id="eA">${T.a}</button><button class="btn sec" id="eB">${T.b}</button>` : `<button class="btn" id="eA">Continuer</button>`}</div>`, () => {
    $('#eA').onclick = () => { appliquerEvenement(e, 'a'); fermerModal(); go(); };
    const b = $('#eB'); if (b) b.onclick = () => { appliquerEvenement(e, 'b'); fermerModal(); go(); };
  });
}
function aideCombos() {
  const l = (k) => { const n = C.niveaux[k.id] || 1; return `<div class="lcombo"><div class="ics">${k.ics.map(x => img(x)).join('')}</div><div class="lt"><b>${k.nom}</b><small>${k.txt}</small></div><div class="lm"><span class="lil">×${fmt(k.mult + 0.5 * (n - 1))}</span>${n > 1 ? `<small>niv. ${n}</small>` : ''}</div></div>`; };
  modal(`<h1 class="lil">Combinaisons</h1><h2 class="lil">Attaque</h2>${COMBOS_ATT.map(l).join('')}<h2 class="lil">Défense</h2>${COMBOS_DEF.map(l).join('')}
    <div class="lcombo"><div class="ics">${img('interception')}${img('marquage')}${img('tacle')}</div><div class="lt"><b>Bonne lecture</b><small>Interception contre les actions à Passes, Marquage contre Centre-Tête et Débordement, Tacle contre Solo et Percée</small></div><div class="lm"><span class="lil">×2</span></div></div>
    <div class="lcombo"><div class="ics">${img('tacle')}${img('passe')}${img('frappe')}</div><div class="lt"><b>Jeu collectif</b><small>Des joueurs des 3 lignes dans la même action : lettre D, M ou A en bas de chaque carte</small></div><div class="lm"><span class="lil">+1</span></div></div>
    <h2 class="lil">Couleurs</h2>
    <div class="lcombo"><div class="ics">${Object.keys(COULEURS).map(pastilleK).join('')}</div><div class="lt"><b>Trio</b><small>3 cartes de joueurs de la même couleur : ${Object.values(COULEURS).map(k => k.nom).join(', ')}</small></div><div class="lm"><span class="lil">+1</span></div></div>
    <div class="lcombo"><div class="ics">${pastilleK('rouge')}${pastilleK('rouge')}${pastilleK('rouge')}${pastilleK('rouge')}</div><div class="lt"><b>Carton plein</b><small>4 cartes de la même couleur</small></div><div class="lm"><span class="lil">+2</span></div></div>
    <h2 class="lil">Consignes</h2>
    ${CONSIGNES.map(t => `<div class="lcombo"><div class="ics">${img(ICT[t])}</div><div class="lt"><b>${TYPES[t].nom}</b><small>${TYPES[t].txt}</small></div></div>`).join('')}
    <div class="btns"><button class="btn" id="mOk">Retour au match</button></div>`, () => ($('#mOk').onclick = fermerModal));
}
function etoilesActives(r) {
  const txt = (r.bonusMult.join(' ') + ' ' + r.pts.map(p => p.notes.join(' ')).join(' ')).toLowerCase();
  const mots = { capitaine: 'capitaine', renard: 'renard', canonnier: 'canonnier', mur: '×2', meneur: 'meneur', ailier: 'ailier', libero: 'libéro', supporters: 'supporters', magicien: 'magicien', tacticien: 'tacticien', kRouge: 'force de la nature', kBleu: 'professeur', kVert: 'fusée', kJaune: 'roc', arc: 'arc-en-ciel', finisseur: 'finisseur' };
  return S.stars.filter(id => mots[id] && txt.includes(mots[id]));
}
function flotter(el, txt) { if (REDUIT) return; const r = el.getBoundingClientRect(), f = document.createElement('div'); f.className = 'flotte lil'; f.textContent = txt; f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top + 10) + 'px'; document.body.appendChild(f); setTimeout(() => f.remove(), 900); }
function flotterCentre(txt) { const el = document.querySelector('.boite-pts'); if (el) flotter(el, txt); }
function secouer() { if (REDUIT) return; const j = document.querySelector('.match-vue'); if (!j) return; j.classList.remove('secoue'); void j.offsetWidth; j.classList.add('secoue'); }
function allumer(id) { const el = document.querySelector(`.star[data-mot="${id}"]`); if (el) { el.classList.remove('actif'); void el.offsetWidth; el.classList.add('actif'); } }
function compter(cible) {
  return new Promise(res => {
    if (REDUIT) { S.anim.total = cible; majCalcul(); return res(); }
    const t0 = performance.now(), d = 650;
    const pas = t => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); S.anim.total = Math.round(cible * e); majCalcul(); if (k < 1) requestAnimationFrame(pas); else res(); };
    requestAnimationFrame(pas);
  });
}

// ---------- Fin de match ----------
function finMatch() {
  $('#flash').style.display = 'none';
  S.phase = 'fin'; Son.sifflet(true); Son.tension(0);
  if (S.tuto) return finTuto();
  if (estAmical()) return ecranFinAmical();
  if (S.comp !== 'ligue' && S.score.p === S.score.ia) return seanceTab();
  ecranFin(null);
}
function seanceTab() {
  const T = nouvelleSeance(); let moi = true;
  const rendre = dernier => {
    const pastilles = who => Array.from({ length: Math.max(5, T.tirs.filter(t => t.moi === who).length) }, (_, i) => { const t = T.tirs.filter(x => x.moi === who)[i]; return `<i class="${t ? (t.marque ? 'ok' : 'ko') : ''}"></i>`; }).join('');
    const msg = dernier ? (dernier.moi ? (dernier.marque ? 'BUT !' : 'Arrêté !') : (dernier.marque ? 'Ils marquent' : 'ARRÊT !')) : 'Tirs au but';
    vue(`<div class="page tab-vue">
      <div class="tab-tete lil">${S.info.nom} · ${S.info.tour}</div>
      <div class="tab-score"><div>${blason(S.eq.p, 40)}<span class="pastilles">${pastilles(true)}</span></div><b class="lil">${T.p} - ${T.ia}</b><div>${blason(S.eq.ia, 40)}<span class="pastilles">${pastilles(false)}</span></div></div>
      <div class="ruban lil ${dernier ? (dernier.marque === dernier.moi ? 'gagne' : 'perd') : ''}">${msg}</div>
      ${dernier ? (() => { const garde = dernier.moi ? dernier.autre : dernier.cote, tir = dernier.moi ? dernier.cote : dernier.autre; return `<div class="cage">${img('filet', 'filet')}<div class="zones fixe">${['G', 'C', 'D'].map(c => `<span class="zone">${c === garde ? img('gardien', 'gant') : ''}${c === tir ? img('ballon', 'balle') : ''}</span>`).join('')}</div></div><p class="sous-cage">Tir ${cote(tir)}, gardien ${cote(garde)}.</p>`; })() : ''}
      ${T.fini ? `<div class="fm-titre lil ${T.gagne ? 'v' : 'd'}">${T.gagne ? 'Qualifiés !' : 'Éliminés'}</div><button class="btn gros" id="bTabFin">Continuer</button>`
        : dernier ? `<button class="btn gros" id="bTabSuite">${moi ? 'À toi de tirer' : `${S.eq.ia.nom} s'élance`}</button>`
        : `<p class="sous-cage">${moi ? 'À toi de tirer : choisis ton côté.' : `${S.eq.ia.nom} s'élance : choisis ton plongeon.`}</p>
        <div class="cage">${img('filet', 'filet')}<div class="zones">${['G', 'C', 'D'].map(c => `<button class="zone lil" data-t="${c}">${{ G: '↖', C: '↑', D: '↗' }[c]}</button>`).join('')}</div></div>`}
    </div>`, 'plein');
    document.querySelectorAll('[data-t]').forEach(b => (b.onclick = () => {
      Son.init(); Son.frappe();
      const d = tirSeance(T, moi, b.dataset.t); moi = !moi;
      if (d.marque === d.moi) { d.moi ? Son.but() : (Son.arret(), celebrer('arret', nomGardien())); } else Son.perdu();
      rendre(d);
      if (T.fini && T.gagne) setTimeout(() => { Son.jingle(); confettis(); }, 300);
    }));
    const f = $('#bTabFin'); if (f) f.onclick = () => { Son.clic(); ecranFin(T); };
    const g = $('#bTabSuite'); if (g) g.onclick = () => { Son.clic(); rendre(null); };
  };
  modal(`${img('filet', 'grande-ic')}<h1 class="lil">Égalité !</h1><p>${S.score.p} - ${S.score.ia} : tout se joue aux tirs au but. 5 tirs chacun, puis mort subite.</p><div class="btns"><button class="btn gros" id="mGo">C'est parti</button></div>`, () => ($('#mGo').onclick = () => { fermerModal(); rendre(null); }));
}
function ecranFin(tab) {
  const gp = S.score.p, gc = S.score.ia, opp = S.eq.ia;
  const bilan = bilanMatch(tab), cp = bilan.coupe;
  if (COOP) finMatchCoop(gp, gc, cp && cp.gagne);
  const gagne = gp > gc || (cp && cp.qualifie);
  const titre = cp ? (cp.gagne ? `${cp.nom} !` : cp.qualifie ? 'Qualifiés !' : 'Éliminés') : gp > gc ? 'Victoire !' : gp < gc ? 'Défaite' : 'Match nul';
  if (gagne) setTimeout(() => { Son.jingle(); confettis(); }, 500);
  if (cp && cp.gagne) { setTimeout(() => souleverTrophee(cp.nom, clubPar(C.club).nom), 900); publier(`a remporté la ${cp.nom} avec ${clubPar(C.club).nom}`, 'trophee'); }
  const cpTxt = cp ? `<div class="cp-res ${cp.gagne ? 'or' : ''}">${img(cp.gagne ? 'trophee' : COUPES[cp.k].ic, 'mini-ic')} ${cp.gagne ? `Vainqueur de la ${cp.nom} ! Prime : ${cp.prime} pièces` : cp.qualifie ? `${cp.nom} : direction la ${cp.suivant.toLowerCase()}` : `${cp.nom} : fin de l'aventure en ${cp.tourJoue.toLowerCase()}`}</div>` : '';
  vue(`<div class="page fin-match">
    <div class="fm-titre lil ${gagne ? 'v' : gp < gc || (cp && !cp.qualifie) ? 'd' : 'n'}">${titre}</div>
    <div class="score-fin lil">${blason(S.eq.p, 50)}<span>${gp} - ${gc}</span>${blason(opp, 50)}</div>
    ${tab ? `<div class="buteurs">Tirs au but : ${tab.p} - ${tab.ia}</div>` : ''}
    ${S.buteurs.length ? `<div class="buteurs">${img('ballon', 'mini-ic')} ${S.buteurs.map(ji => C.effectif[ji].nom).join(', ')}</div>` : ''}
    ${cpTxt}
    <div class="journal-une"><div class="une-logo lil">${img('journal', 'mini-ic')} La Une</div><div class="une-t">${bilan.une}</div><div class="une-s">Meilleure action : ${S.stats.meilleurCombo || 'aucune'} à ${S.stats.meilleur}</div>${C.journal[0] && C.journal[0].rival ? `<div class="une-s">${C.journal[0].rival}</div>` : ''}</div>
    ${bilan.defi ? `<div class="cp-res ${bilan.defiOk ? 'or' : ''}">${img('medaille', 'mini-ic')} Défi « ${bilan.defi.txt} » ${bilan.defiOk ? `réussi : +${PRIME_DEFI}` : 'manqué'}</div>` : ''}
    ${(bilan.objFaits || []).map(o => `<div class="cp-res or">${img('trophee', 'mini-ic')} Objectif du président atteint : ${OBJ_SAISON[o.id].txt(o)} (+${OBJ_SAISON[o.id].prime})</div>`).join('')}
    ${(bilan.progres || []).map(x => `<div class="cp-res">${img('fusee', 'mini-ic')} <b>${x.nom}</b> ${x.txt}</div>`).join('')}
    <div class="gain lil">${img('piece')} +${bilan.gain} pièces${bilan.recettes ? ` <small>(dont ${bilan.recettes} de recettes)</small>` : ''}</div>
    ${bilan.recompenses.length ? `<h2 class="lil centre">Choisis ta récompense</h2>
    <div class="recompenses">${bilan.recompenses.map((o, i) => `<button class="recomp" data-i="${i}">${recompHTML(o)}</button>`).join('')}</div>` : `<p class="petit centre">Pas de récompense sans victoire. On se rattrape au prochain match.</p><button class="btn gros" id="bFinOk">Retour au vestiaire</button>`}
  </div>`, 'plein');
  const fo = $('#bFinOk'); if (fo) fo.onclick = () => { Son.clic(); S = null; hub('vestiaire'); };
  document.querySelectorAll('.recomp').forEach(b => (b.onclick = () => {
    Son.piece(); appliquerRecompense(bilan.recompenses[+b.dataset.i]); sauver();
    document.querySelectorAll('.recomp').forEach(x => x.classList.add(x === b ? 'pris' : 'pas-pris'));
    setTimeout(() => { S = null; hub('vestiaire'); }, 650);
  }));
}
function recompHTML(o) {
  if (o.k === 'carte') { const c = { id: -1, t: o.t, ji: o.ji, r: o.r, niv: 1, sp: o.r === 'legendaire' }; return `${carteHTML(c, { cls: 'mini', tag: 'div' })}<b class="lil">${TYPES[o.t].consigne ? 'Nouvelle consigne' : 'Nouvelle carte'}</b><small class="rar r-${o.r}">${TYPES[o.t].consigne ? TYPES[o.t].txt : RARETES[o.r].nom}</small>`; }
  if (o.k === 'niveau') { const c = C.cartes.find(x => x.id === o.id); return `${carteHTML(c, { cls: 'mini', tag: 'div' })}<b class="lil">Entraînement</b><small>+1 niveau (+2 pts)</small>`; }
  if (o.k === 'star') { const s = STARS.find(x => x.id === o.id); return `${img(IC_STAR[s.id], 'rc-ic')}<b class="lil">${s.nom}</b><small>${s.txt}</small>`; }
  if (o.k === 'fiche') { const k = comboPar(o.id), n = C.niveaux[o.id] || 1; return `${img('tactique', 'rc-ic')}<b class="lil">${k.nom}</b><small>Niveau ${n} → ${n + 1}</small>`; }
  return `${img('piece', 'rc-ic')}<b class="lil">+${o.n} pièces</b><small>Pour la boutique</small>`;
}

// ---------- Fin de saison ----------
function finDeSaison() {
  const t = classementTrie(), rang = t.findIndex(l => l.id === C.club) + 1;
  const res = finSaison();
  const bm = $('#bMenu') && $('#bMenu').onclick; barreHaut(); if (bm) $('#bMenu').onclick = bm;
  const cl = clubPar(C.club), P = PAYS[C.pays];
  const txt = {
    montee: [`On monte ! ${cl.nom} retrouve la ${nomDiv(res.apres)}. Dédé a pleuré dans la buanderie, ne le dis à personne.`, 'fusee', 'Montée !'],
    champion: [`Champions ${P.de} ! Le président a fait ouvrir le champagne dans le vestiaire. La Coupe des Champions nous attend.`, 'trophee', 'Champion !'],
    europe: [`${rang}e place : qualifiés pour la ${res.qualif === 'c1' ? 'Coupe des Champions' : 'Coupe d’Europe'} ! Qui aurait cru ça quand tu es arrivé ?`, 'globe', 'Europe !'],
    maintien: [`${rang}e place. ${C.div === 1 ? 'Pas d’Europe cette fois' : 'Pas de montée cette fois'}, mais l'équipe progresse. On repart plus forts.`, 'biceps', 'Fin de saison'],
    descente: [`La descente fait mal. Mais un club, ça se relève. Dédé a déjà relavé les maillots.`, 'baisse', 'Relégation']
  }[res.issue];
  const cps = (res.coupes || []).map(c => `<div class="palm">${img(c.gagne ? 'trophee' : 'medaille2', 'mini-ic')} ${c.nom} : ${c.gagne ? 'vainqueur !' : c.tour.toLowerCase()}</div>`).join('');
  const retr = (res.retraites || []).map(r => `<div class="palm">${img('poignee', 'mini-ic')} ${r.ancien} prend sa retraite. ${r.nouveau}, formé au club, reprend ses cartes.</div>`).join('');
  const jeunes = res.nouveaux && res.nouveaux.length ? `<div class="palm">${img('poussin', 'mini-ic')} ${res.nouveaux.length} jeune${res.nouveaux.length > 1 ? 's' : ''} au centre de formation : ${res.nouveaux.map(j => `${j.nom} (${'★'.repeat(j.pot)})`).join(', ')}</div>` : '';
  vue(`<div class="scene">${img(txt[1], 'scene-ic grosse')}<div class="fm-titre lil v">${txt[2]}</div>${bulle(res.issue === 'champion' ? 'president' : 'dede', txt[0])}
    <div class="bilan-saison">${(res.objectifsSaison || []).map(o => `<div class="palm ${o.fait ? 'ok' : ''}">${o.fait ? '✓' : '✕'} ${o.txt}${o.fait ? ` (+${o.prime})` : ''}</div>`).join('')}${cps}${jeunes}${retr}</div>
    <div class="gain lil">${img('piece')} +${{ montee: 80, champion: 150, europe: 100, maintien: 40, descente: 30 }[res.issue]} pièces de prime</div>
    <button class="btn gros" id="bSaison">${res.offres && res.offres.length ? `Voir les offres (${res.offres.length})` : `Saison ${C.saison} en ${nomDiv(C.div)}`}</button></div>`, 'plein scene-fond');
  if (['montee', 'champion', 'europe'].includes(res.issue)) { Son.jingle(); confettis(); }
  if (rang === 1) setTimeout(() => souleverTrophee(`Champion de ${nomDiv(res.avant || C.div)}`, cl.nom), 500);
  const fil = { montee: `monte en ${nomDiv(res.apres)} avec ${cl.nom}`, champion: `est champion ${P.de} avec ${cl.nom} !`, europe: `qualifie ${cl.nom} pour l’Europe`, descente: `descend avec ${cl.nom}, la revanche se prépare` }[res.issue];
  if (fil) publier(fil, 'saison');
  $('#bSaison').onclick = () => { Son.clic(); if (res.offres && res.offres.length) choixOffres(); else hub('vestiaire'); };
}
function choixOffres() {
  const moi = clubPar(C.club), offres = C.offres || [];
  vue(`<div class="page">
    ${bulle('president', offres.length > 1 ? `Ton téléphone n'arrête pas de sonner. Moi, je veux que tu restes. Mais c'est ta carrière.` : `Un club te veut. Je ne vais pas te retenir de force... mais ici, on a besoin de toi.`)}
    ${offres.map(o => { const cl = clubPar(o.id), d = C.divisions[o.id]; return `<div class="offre-club"><div class="oc-haut">${blason(cl, 52)}<div class="j-id"><b class="lil">${cl.nom}</b><small>${drapeau(cl.pays, 14)} ${nomDiv(d, cl.pays)} · ${STYLES[cl.style].nom}</small></div></div><p class="oc-txt">${o.raison}</p><button class="btn large" data-off="${o.id}">Signer · prime ${o.prime} ${img('piece', 'mini-piece')}</button></div>`; }).join('')}
    <button class="btn sec large" id="bRester">Rester à ${moi.nom} (${nomDiv(C.div)})</button>
    <p class="astuce">Tu pars avec ton paquet, tes stars et ton centre de formation : c'est ta méthode que le club achète. Changer de pays fait baisser ta réputation d'un cran.</p>
  </div>`, 'plein');
  document.querySelectorAll('[data-off]').forEach(b => (b.onclick = () => {
    const cl = clubPar(b.dataset.off);
    accepterOffre(cl.id); Son.jingle(); confettis();
    scenes([{ qui: 'dede', ic: 'maillot', txt: `Tu croyais te débarrasser de moi ? Le président de ${cl.nom} m'a embauché aussi. Les maillots, c'est une vocation. Allez, au travail, coach.`, bouton: 'Au vestiaire' }], () => hub('vestiaire'));
  }));
  $('#bRester').onclick = () => { Son.clic(); C.offres = null; sauver(); scenes([{ qui: 'president', ic: 'poignee', txt: `Tu restes ! Les supporters ont chanté ton nom toute la nuit. On va écrire l'histoire ici.`, bouton: 'Au vestiaire' }], () => hub('vestiaire')); };
}

// ---------- Démarrage ----------
accueil();
function infoBulle(ic, titre, txt) { Son.clic(); modal(`${img(ic, 'grande-ic')}<h1 class="lil">${titre}</h1><p>${txt}</p><div class="btns"><button class="btn" id="ibOk">OK</button></div>`, () => ($('#ibOk').onclick = fermerModal)); }
