// =====================================================================
// MATCH EN DIRECT : deux téléphones, un salon sur le serveur
// =====================================================================
// L'hôte attaque aux temps forts pairs, l'invité aux impairs. Chaque téléphone envoie ses choix
// (total de cartes, tir, plongeon) puis attend ceux de l'autre. Le résultat se calcule pareil des deux côtés.
let DIRECT = null;
const POLL_MS = 1500, PATIENCE_MS = 90000;
const moiJoueur = () => { const p = profil(); return { code: p.code, pseudo: p.pseudo, club: C.club }; };

async function creerDirect(codeAmi) {
  try {
    const j = await apiEcrire('salonCree', { joueur: moiJoueur() }), s = j.salon, p = profil();
    DIRECT = { id: s.id, role: 'hote', graine: s.graine, actif: true };
    if (codeAmi) apiEcrire('message', { de: p.code, a: codeAmi, pseudo: p.pseudo, txt: 'Invitation', type: 'invite', salon: s.id }).catch(() => { });
    modal(`${img('epees', 'grande-ic')}<h1 class="lil">Match en direct</h1>
      <p>${codeAmi ? 'Invitation envoyée. ' : ''}Code du match :</p><div class="code-salon lil">${s.id}</div>
      <p class="petit">${codeAmi ? 'Ton ami la voit dans son onglet Amis.' : 'Ton ami touche « Rejoindre » dans son onglet Amis et tape ce code.'}</p>
      <p class="petit attente-pts">En attente de l’autre joueur</p>
      <div class="btns"><button class="btn sec" id="dAnn">Annuler</button></div>`, () => { $('#dAnn').onclick = () => { quitterDirect(); fermerModal(); }; });
    const t0 = Date.now();
    while (DIRECT && DIRECT.actif && !DIRECT.adv) {
      await sleep(POLL_MS);
      if (!DIRECT) return;
      try { const r = await apiLire('salon', { id: s.id }); if (r.salon && r.salon.invite) DIRECT.adv = r.salon.invite; } catch (e) { }
      if (Date.now() - t0 > 20 * 60000) { quitterDirect(); fermerModal(); return toast('Personne n’a rejoint le match'); }
    }
    if (DIRECT && DIRECT.adv) { fermerModal(); demarrerDirect(); }
  } catch (e) { toast(e.message); }
}
function rejoindreDirectCode() {
  modal(`${img('epees', 'grande-ic')}<h1 class="lil">Rejoindre un match</h1><input id="dCode" class="zone-txt code-j" maxlength="4" autocapitalize="characters" placeholder="CODE"><p class="petit" id="dMsg"></p>
    <div class="btns"><button class="btn" id="dOk">Rejoindre</button><button class="btn sec" id="dNon">Annuler</button></div>`, () => {
    $('#dOk').onclick = () => rejoindreDirect($('#dCode').value, m => ($('#dMsg').textContent = m));
    $('#dNon').onclick = fermerModal;
  });
}
async function rejoindreDirect(id, erreur) {
  try {
    const j = await apiEcrire('salonRejoindre', { id: (id || '').toUpperCase().trim(), joueur: moiJoueur() }), s = j.salon;
    DIRECT = { id: s.id, role: 'invite', graine: s.graine, adv: s.hote, actif: true };
    fermerModal(); demarrerDirect();
  } catch (e) { erreur ? erreur(e.message) : toast(e.message); }
}
function quitterDirect() { if (DIRECT) DIRECT.actif = false; DIRECT = null; }
function demarrerDirect() {
  const a = DIRECT.adv, mets = Object.keys(METEOS);
  const m = { comp: 'direct', opp: a.club, dom: DIRECT.role === 'hote', nom: MODES.direct.nom, tour: a.pseudo };
  const opts = { direct: DIRECT, ami: { code: a.code, pseudo: a.pseudo }, inverse: DIRECT.role === 'invite', meteo: mets[Math.floor(tirageCommun(DIRECT.graine, 'meteo') * mets.length)], facteurFixe: 1 };
  lancerAmical(m, opts, `Contre <b>${echap(a.pseudo)}</b>, en direct. Vous posez vos cartes en même temps : ton attaque contre sa défense, puis l’inverse. Sur une occasion, le tireur vise et le gardien plonge, chacun à la jauge.`);
}
// envoie mon coup puis attend celui de l'autre (même clé, autre rôle)
async function echanger(cle, valeur) {
  const D = S.direct, autre = D.role === 'hote' ? 'invite' : 'hote';
  await apiEcrire('salonCoup', { id: D.id, cle: `${cle}:${D.role}`, valeur }).catch(() => { });
  const t0 = Date.now(); let relance = false;
  for (;;) {
    if (!S || S.direct !== D || !D.actif) throw new Error('quitté');
    try { const r = await apiLire('salon', { id: D.id }); if (!r.salon) throw new Error('Le salon a expiré.'); const v = r.salon.coups[`${cle}:${autre}`]; if (v) return v;
      if (!r.salon.coups[`${cle}:${D.role}`] && !relance) { relance = true; apiEcrire('salonCoup', { id: D.id, cle: `${cle}:${D.role}`, valeur }).catch(() => { }); }
    } catch (e) { if (/expiré/.test(e.message)) throw e; }
    if (Date.now() - t0 > PATIENCE_MS && !S.patience) { S.patience = true; afficherPatience(); }
    await sleep(POLL_MS);
  }
}
function afficherPatience() {
  const bt = $('#actions'); if (!bt) return;
  bt.innerHTML = `<button class="btn sec" id="bAband">${echap(S.ami.pseudo)} ne répond plus : arrêter</button>`;
  $('#bAband').onclick = () => { quitterDirect(); S = null; hub('amis'); };
}
// temps fort : mon total contre le sien
async function attendreDuel(r) {
  S.phase = 'attente'; zoneAction();
  const moi = { total: r.total, sur: S.actif && S.actif.cible !== 1 ? S.actif.cible : 1, combo: r.combo.nom };
  const lui = await echanger('tf' + S.tf, moi);
  S.patience = false;
  const att = enAttaque(), d = att ? issueDuel(moi, lui) : issueDuel(lui, moi);
  S.cible = att ? d.d : d.a; S.duelAdv = lui;
  return att ? { but: 'but', occasion: 'occasion', stoppe: 'rate' }[d.issue] : { but: 'butAdverse', occasion: 'tirAdverse', stoppe: 'stoppe' }[d.issue];
}
// occasion : ma frappe ou mon plongeon contre le sien
async function attendreTir(moiTire, coup) {
  S.phase = 'attenteTir'; zoneAction();
  const lui = await echanger('tir' + S.tf, coup);
  S.patience = false;
  const tir = moiTire ? coup : lui, gardien = moiTire ? lui : coup;
  const R = duelTir(tir, gardien, tirageCommun(S.direct.graine, 'tir' + S.tf));
  return { tir, gardien, R };
}
