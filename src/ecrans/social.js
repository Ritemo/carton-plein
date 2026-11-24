// =====================================================================
// AMIS : fil d'actualité, messages, ombre, défi de la semaine, direct
// =====================================================================
let SOCIAL = null, SOCIAL_T = 0;
const amisListe = () => profil().amis || [];
const nonLus = () => { if (!SOCIAL) return 0; const p = profil(); return SOCIAL.messages.filter(m => m.a === p.code && m.t > (p.vuMsg || 0)).length; };
const ilYa = t => { const s = (Date.now() - t) / 1000; return s < 90 ? 'à l’instant' : s < 3600 ? `il y a ${Math.round(s / 60)} min` : s < 86400 ? `il y a ${Math.round(s / 3600)} h` : new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); };
const echap = t => String(t || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

async function chargerSocial(force) {
  if (!urlCloud()) return null;
  if (!force && SOCIAL && Date.now() - SOCIAL_T < 20000) return SOCIAL;
  const p = profil();
  const j = await apiLire('social', { code: p.code, amis: amisListe().map(a => a.code).join(','), semaine: semaineDefi() });
  if (!j.v || j.v < 2) throw new Error('le script Google doit être mis à jour (nouvelle version du déploiement).');
  SOCIAL = j; SOCIAL_T = Date.now();
  // complète les pseudos et clubs des amis à partir de leurs profils (une fois)
  const manque = amisListe().filter(a => !a.club);
  for (const a of manque) { try { const r = await apiLire('profil', { code: a.code }); if (r.profil) Object.assign(a, { pseudo: r.profil.pseudo, club: r.profil.club }); } catch (e) { } }
  if (manque.length) majProfil(p);
  majPastilleAmis();
  return SOCIAL;
}
function majPastilleAmis() {
  const b = document.querySelector('.onglet[data-o="amis"]'); if (!b) return;
  const n = nonLus() + invitations().length, i = b.querySelector('.pastille-notif');
  if (n && !i) b.insertAdjacentHTML('beforeend', '<i class="pastille-notif"></i>'); else if (!n && i) i.remove();
}
const invitations = () => { if (!SOCIAL) return []; const p = profil(); return SOCIAL.messages.filter(m => m.type === 'invite' && m.a === p.code && Date.now() - m.t < 20 * 60000); };

// ---------- écran principal ----------
function amis() {
  const p = profil();
  if (!urlCloud()) return vue(`<div class="page">${bulle('dede', 'Pour jouer avec tes amis, il faut d’abord la sauvegarde automatique (menu > Sauvegarde).')}</div>`);
  if (!p.pseudo) return demanderPrenom(() => hub('amis'));
  vue(`<div class="page soc">
    <div class="soc-moi"><div><b class="lil">${echap(p.pseudo)}</b><small>Ton code ami : <span class="code-j">${p.code}</span></small></div><button class="btn sec petit-btn" id="sPartage">Partager</button></div>
    <div id="sInvit"></div>
    <div id="sDefi" class="soc-bloc"><div class="soc-t lil">${img('medaille', 'mini-ic')} Défi de la semaine</div><p class="petit">Chargement…</p></div>
    <div class="soc-bloc"><div class="soc-t lil">${img('poignee', 'mini-ic')} Mes amis</div><div id="sAmis">${listeAmisHTML()}</div><p class="petit legende">⚔️ jouer contre son ombre · 💬 messages · ⚡ inviter en direct</p>
      <div class="soc-ajout"><input id="sCode" class="zone-txt code-j" maxlength="10" autocapitalize="characters" placeholder="CODE D’UN AMI"><button class="btn" id="sAjout">Ajouter</button></div></div>
    <div class="soc-bloc"><div class="soc-t lil">${img('epees', 'mini-ic')} Match en direct</div><p class="petit">Chacun sur son téléphone, avec son équipe. Les deux joueurs posent leurs cartes en même temps.</p>
      <div class="btns"><button class="btn" id="sCree">Créer un match</button><button class="btn sec" id="sRejoint">Rejoindre</button></div></div>
    <div class="soc-bloc"><div class="soc-t lil">${img('journal', 'mini-ic')} Fil d’actualité</div><div id="sFil"><p class="petit">Chargement…</p></div></div>
  </div>`);
  $('#sPartage').onclick = async () => { const t = `Ajoute-moi dans Carton Plein : mon code ami est ${p.code}`; try { if (navigator.share) await navigator.share({ text: t }); else { await navigator.clipboard.writeText(t); toast('Code copié'); } } catch (e) { } };
  $('#sAjout').onclick = () => ajouterAmi($('#sCode').value);
  $('#sCree').onclick = () => creerDirect(null);
  $('#sRejoint').onclick = rejoindreDirectCode;
  brancherAmis();
  chargerSocial(true).then(remplirSocial).catch(e => { const f = $('#sFil'); if (f) f.innerHTML = `<p class="petit">Pas de connexion : ${echap(e.message)}</p>`; });
}
function listeAmisHTML() {
  const L = amisListe(), p = profil();
  if (!L.length) return '<p class="petit">Ajoute un ami avec son code (il le trouve ici, dans son onglet Amis).</p>';
  return L.map(a => { const cl = a.club && clubPar(a.club), n = SOCIAL ? SOCIAL.messages.filter(m => m.de === a.code && m.a === p.code && m.t > (p.vuMsg || 0)).length : 0;
    return `<div class="ami">${cl ? blason(cl, 34) : img('maillot', 'mini-ic')}<div class="ami-t"><b>${echap(a.pseudo || a.code)}</b><small>${cl ? echap(cl.nom) : 'Profil en chargement'}</small></div>
      <div class="ami-b"><button class="btn petit-btn" data-ombre="${a.code}" aria-label="Jouer contre son ombre">${img('epees', 'mini-ic')}</button><button class="btn sec petit-btn" data-msg="${a.code}" aria-label="Messages">💬${n ? `<i class="pastille-notif"></i>` : ''}</button><button class="btn sec petit-btn" data-direct="${a.code}" aria-label="Inviter en direct">⚡</button></div></div>`; }).join('');
}
function brancherAmis() {
  document.querySelectorAll('[data-ombre]').forEach(b => (b.onclick = () => lancerOmbre(b.dataset.ombre)));
  document.querySelectorAll('[data-msg]').forEach(b => (b.onclick = () => conversation(b.dataset.msg)));
  document.querySelectorAll('[data-direct]').forEach(b => (b.onclick = () => creerDirect(b.dataset.direct)));
}
function remplirSocial(S0) {
  if (!S0 || !$('#sFil')) return;
  const p = profil();
  $('#sAmis').innerHTML = listeAmisHTML(); brancherAmis();
  // invitations à un match en direct
  const inv = invitations();
  $('#sInvit').innerHTML = inv.map(m => `<div class="soc-invit">${img('epees', 'mini-ic')}<span><b>${echap(m.pseudo)}</b> t’invite à un match en direct</span><button class="btn" data-salon="${m.salon}">Jouer</button></div>`).join('');
  document.querySelectorAll('[data-salon]').forEach(b => (b.onclick = () => rejoindreDirect(b.dataset.salon)));
  // fil
  const fil = [...S0.fil].reverse();
  $('#sFil').innerHTML = fil.length ? fil.map(x => `<div class="fil-l ${x.pour === p.code ? 'pour-moi' : ''}"><b>${echap(x.de === p.code ? 'Toi' : x.pseudo)}</b> ${echap(x.txt)}<small>${ilYa(x.t)}</small></div>`).join('') : '<p class="petit">Rien pour l’instant. Les trophées, montées et matchs entre amis s’afficheront ici.</p>';
  // défi
  const D = S0.defi || {}, codes = new Set([p.code, ...amisListe().map(a => a.code)]);
  const lignes = Object.entries(D).filter(([c]) => codes.has(c)).sort((a, b) => b[1].score - a[1].score);
  const moi = D[p.code], essais = Math.max(moi ? moi.essais : 0, essaisDefiLocaux()), reste = DEFI_ESSAIS - essais;
  const { m } = matchDefi(), opp = clubPar(m.opp);
  $('#sDefi').innerHTML = `<div class="soc-t lil">${img('medaille', 'mini-ic')} Défi de la semaine</div>
    <div class="defi-opp">${blason(opp, 40)}<div><b>${echap(opp.nom)}</b><small>Même adversaire et même tirage pour tout le monde. ${reste > 0 ? `${reste} essai${reste > 1 ? 's' : ''} restant${reste > 1 ? 's' : ''}` : 'Plus d’essai cette semaine'}.</small></div></div>
    ${lignes.length ? `<ol class="defi-cl">${lignes.map(([c, l]) => `<li class="${c === p.code ? 'moi' : ''}"><span>${echap(c === p.code ? 'Toi' : l.pseudo)}</span><b class="lil">${l.score}</b></li>`).join('')}</ol>` : ''}
    <button class="btn gros" id="sDefiGo" ${reste > 0 ? '' : 'disabled'}>Jouer le défi</button>`;
  $('#sDefiGo').onclick = lancerDefi;
  // messages lus quand on regarde ses invitations : non, seulement en ouvrant la conversation
}
function demanderPrenom(suite) {
  modal(`${img('maillot', 'grande-ic')}<h1 class="lil">Ton prénom</h1><p class="petit">Il s’affiche chez tes amis.</p><input id="pNom" class="zone-txt" maxlength="16" placeholder="Prénom"><div class="btns"><button class="btn" id="pOk">Valider</button><button class="btn sec" id="pNon">Plus tard</button></div>`, () => {
    $('#pOk').onclick = () => { const v = $('#pNom').value.trim(); if (!v) return; const p = profil(); p.pseudo = v; majProfil(p); syncPlanifier(); fermerModal(); suite(); };
    $('#pNon').onclick = () => { fermerModal(); hub('vestiaire'); };
  });
}
async function ajouterAmi(code) {
  code = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); const p = profil();
  if (code.length < 6) return toast('Le code ami fait 8 caractères');
  if (code === p.code) return toast('C’est ton propre code');
  if (amisListe().some(a => a.code === code)) return toast('Déjà dans tes amis');
  try {
    const r = await apiLire('profil', { code }); if (!r.profil) return toast('Aucun joueur avec ce code');
    p.amis = [...amisListe(), { code, pseudo: r.profil.pseudo, club: r.profil.club }]; majProfil(p); syncPlanifier();
    toast(`${r.profil.pseudo || 'Ami'} ajouté`); hub('amis');
  } catch (e) { toast(e.message); }
}

// ---------- messages ----------
const RAPIDES = ['Bien joué !', 'Revanche ?', 'Trop fort 😄', 'On joue ce soir ?', '⚽🔥'];
function conversation(code) {
  const p = profil(), a = amisListe().find(x => x.code === code) || { code };
  const rendre = () => {
    const L = SOCIAL ? SOCIAL.messages.filter(m => (m.de === code && m.a === p.code) || (m.de === p.code && m.a === code)) : [];
    modal(`<h1 class="lil">${echap(a.pseudo || code)}</h1>
      <div class="conv" id="conv">${L.length ? L.map(m => `<div class="msg ${m.de === p.code ? 'moi' : ''}">${m.type === 'invite' ? '⚡ Invitation à un match en direct' : echap(m.txt)}<small>${ilYa(m.t)}</small></div>`).join('') : '<p class="petit centre">Pas encore de message.</p>'}</div>
      <div class="rapides">${RAPIDES.map((t, i) => `<button class="chip" data-r="${i}">${t}</button>`).join('')}</div>
      <div class="soc-ajout"><input id="mTxt" class="zone-txt" maxlength="200" placeholder="Message"><button class="btn" id="mEnv">Envoyer</button></div>
      <div class="btns"><button class="btn sec" id="mFer">Fermer</button></div>`, () => {
      const cv = $('#conv'); cv.scrollTop = cv.scrollHeight;
      const envoyer = async txt => { if (!txt.trim()) return; try { await apiEcrire('message', { de: p.code, a: code, pseudo: p.pseudo, txt }); await chargerSocial(true); rendre(); } catch (e) { toast(e.message); } };
      $('#mEnv').onclick = () => envoyer($('#mTxt').value);
      document.querySelectorAll('[data-r]').forEach(b => (b.onclick = () => envoyer(RAPIDES[+b.dataset.r])));
      $('#mFer').onclick = () => { fermerModal(); if (ONGLET === 'amis') hub('amis'); };
    });
    p.vuMsg = Date.now(); majProfil(p); majPastilleAmis();
  };
  rendre();
}

// ---------- ombre ----------
async function lancerOmbre(code) {
  toast('Chargement de l’ombre…');
  try {
    const r = await apiLire('profil', { code }); if (!r.profil) return toast('Profil introuvable');
    const { m, opts } = matchOmbre(r.profil);
    lancerAmical(m, opts, `Tu affrontes l’équipe de <b>${echap(r.profil.pseudo)}</b>, jouée par l’ordinateur avec ses habitudes : ses combos préférés, ses côtés de tir et de plongeon.`);
  } catch (e) { toast(e.message); }
}
// ---------- défi ----------
const cleDefi = () => 'carton-plein-defi-' + semaineDefi();
const essaisDefiLocaux = () => { try { return +localStorage.getItem(cleDefi()) || 0; } catch (e) { return 0; } };
function lancerDefi() {
  if (essaisDefiLocaux() >= DEFI_ESSAIS) return toast('Plus d’essai cette semaine');
  try { localStorage.setItem(cleDefi(), essaisDefiLocaux() + 1); } catch (e) { }
  const { m, opts } = matchDefi();
  lancerAmical(m, opts, `Tout le monde affronte la même équipe avec le même tirage cette semaine. Chaque temps fort rapporte des points selon ton score face à l’objectif (150 au plus), +150 par but marqué, −100 par but encaissé. ${DEFI_ESSAIS} essais, le meilleur compte.`);
}
// ---------- lancement commun des matchs entre amis ----------
function lancerAmical(m, opts, texte) {
  document.body.className = 'match'; $('#barre-haut').innerHTML = ''; $('#nav').innerHTML = '';
  nouveauMatch(m, false, opts);
  const opp = S.eq.ia, M = MODES[S.comp];
  modal(`<div class="comp-tag lil europe">${M.nom}</div><div class="coup-envoi">${blason(S.eq.p, 56)}<span class="lil">VS</span>${blason(opp, 56)}</div><h1 class="lil centre">${S.eq.p.nom} - ${opp.nom}</h1>
    <div class="regles"><div>${img(M.ic)}<span>${texte}</span></div><div>${img(METEOS[S.meteo].ic)}<span><b>${METEOS[S.meteo].nom}</b> : ${METEOS[S.meteo].txt}.</span></div><div>${img('piece')}<span>Match amical : ta carrière n’est pas touchée, quelques pièces à gagner.</span></div></div>
    <div class="btns"><button class="btn gros" id="mGo">Coup d'envoi</button><button class="btn sec" id="mAnn">Annuler</button></div>`, () => {
    $('#mGo').onclick = () => { Son.sifflet(false); fermerModal(); afficherMatch(); };
    $('#mAnn').onclick = () => { fermerModal(); quitterDirect(); S = null; hub('amis'); };
  });
}
// fin d'un match entre amis : pièces, fil d'actualité, retour aux amis
function ecranFinAmical() {
  const gp = S.score.p, gc = S.score.ia, M = MODES[S.comp], res = gp > gc ? 0 : gp === gc ? 1 : 2;
  const gain = M.gain[res]; C.pieces += gain; sauver();
  let extra = '';
  const ami = S.ami ? S.ami.pseudo : S.eq.ia.nom;
  if (S.comp === 'ombre') publier(`${['a battu', 'a fait match nul contre', 'a perdu contre'][res]} l’ombre de ${ami} (${gp}-${gc})`, 'ombre', S.ami && S.ami.code);
  if (S.comp === 'direct' && S.direct && S.direct.role === 'hote') publier(`${['a battu', 'a fait match nul contre', 'a perdu contre'][res]} ${ami} en direct (${gp}-${gc})`, 'direct', S.ami && S.ami.code);
  if (S.comp === 'defi') {
    const sc = Math.max(0, scoreDefi()), p = profil();
    extra = `<div class="cp-res or">${img('medaille', 'mini-ic')} Score du défi : <b class="lil">${sc}</b> points</div>`;
    apiEcrire('defi', { semaine: S.semaine, code: p.code, pseudo: p.pseudo, club: clubPar(C.club).nom, score: sc }).then(() => publier(`a fait ${sc} points au défi de la semaine`, 'defi')).catch(() => { });
  }
  if (S.comp === 'direct') quitterDirect();
  const titre = ['Victoire !', 'Match nul', 'Défaite'][res];
  if (res === 0) setTimeout(() => { Son.jingle(); confettis(); }, 400);
  vue(`<div class="page fin-match">
    <div class="comp-tag lil europe">${M.nom}</div>
    <div class="fm-titre lil ${['v', 'n', 'd'][res]}">${titre}</div>
    <div class="score-fin lil">${blason(S.eq.p, 50)}<span>${gp} - ${gc}</span>${blason(S.eq.ia, 50)}</div>
    ${S.buteurs.length ? `<div class="buteurs">${img('ballon', 'mini-ic')} ${S.buteurs.map(ji => C.effectif[ji].nom).join(', ')}</div>` : ''}
    ${extra}
    <div class="gain lil">${img('piece')} +${gain} pièces</div>
    <button class="btn gros" id="bFinOk">Retour aux amis</button>
  </div>`, 'plein');
  $('#bFinOk').onclick = () => { Son.clic(); S = null; SOCIAL_T = 0; hub('amis'); };
}
