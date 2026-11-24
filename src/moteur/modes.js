// =====================================================================
// MODES ENTRE AMIS : ombre, défi de la semaine, direct (règles sans affichage)
// =====================================================================
// Ces matchs ne comptent pas pour la carrière : ni classement ni coupe, un peu de pièces seulement.
const MODES = { ombre: { nom: 'Contre l’ombre', ic: 'epees', gain: [18, 8, 4] }, defi: { nom: 'Défi de la semaine', ic: 'medaille', gain: [12, 6, 4] }, direct: { nom: 'Match en direct', ic: 'poignee', gain: [20, 10, 6] } };
const DEFI_ESSAIS = 3;
const estAmical = () => !!(S && MODES[S.comp]);

// ---------- graines communes ----------
function hacher(txt) { let h = 2166136261; for (const ch of String(txt)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
// tirage indépendant du reste du jeu : les deux téléphones obtiennent le même nombre
function tirageCommun(graine, cle) { let t = (hacher(graine + ':' + cle) + 0x6D2B79F5) >>> 0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function semaineDefi(d) {
  d = d ? new Date(d) : new Date(); const j = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const n = j.getUTCDay() || 7; j.setUTCDate(j.getUTCDate() + 4 - n);
  const an = j.getUTCFullYear(), sem = Math.ceil(((j - Date.UTC(an, 0, 1)) / 864e5 + 1) / 7);
  return `${an}-${String(sem).padStart(2, '0')}`;
}
const pickPoids = (o, x) => { const e = Object.entries(o).filter(([, v]) => v > 0), tot = e.reduce((a, [, v]) => a + v, 0); if (!tot) return null; let r = (x == null ? hasard() : x) * tot; for (const [k, v] of e) { if ((r -= v) < 0) return k; } return e[e.length - 1][0]; };

// ---------- ombre : l'ordinateur joue le deck et les habitudes d'un ami ----------
const STYLE_COMBO = { tiki: 'possession', unedeux: 'possession', ct: 'aerien', debord: 'aerien', contre: 'contre', solo: 'contre', percee: 'feu' };
function habitudes(P) {
  const K = P.carnet || {}, cb = {};
  Object.entries(K.combos || {}).forEach(([id, n]) => { if (COMBOS_ATT.some(k => k.id === id) && id !== 'simple' && id !== 'cf') cb[id] = n; });
  const fav = Object.entries(cb).sort((a, b) => b[1] - a[1])[0];
  return {
    style: (fav && STYLE_COMBO[fav[0]]) || 'feu',
    intentions: Object.keys(cb).length ? cb : null,
    tirs: K.tirsCol && Object.values(K.tirsCol).some(Boolean) ? K.tirsCol : null,
    plongeons: K.plongeonsCol && Object.values(K.plongeonsCol).some(Boolean) ? K.plongeonsCol : null
  };
}
// force de l'ombre : la difficulté que l'ami affronte dans sa propre carrière, à mi-saison
function facteurOmbre(P) {
  const cl = clubPar(P.club) || { force: 0.5 };
  return DIFF[P.div || 3] * (0.88 + 0.3 * cl.force) * (1 + DIFF.j * 4.5) * (1 + DIFF.s * Math.max(0, (P.saison || 1) - 1)) * (1 + DIFF.r * (P.ansD1 || 0));
}
function matchOmbre(P) {
  const H = habitudes(P);
  return { m: { comp: 'ombre', opp: P.club, dom: true, nom: MODES.ombre.nom, tour: P.pseudo || 'ami' },
    opts: { ami: { code: P.code, pseudo: P.pseudo }, facteurFixe: facteurOmbre(P), style: H.style, ombre: H } };
}
// ---------- défi de la semaine : même adversaire et même graine pour tout le monde ----------
function matchDefi() {
  const sem = semaineDefi(), g = hacher('defi' + sem), grands = CLUBS.filter(c => c.div === 1 && c.force >= 0.75 && c.id !== C.club);
  const opp = grands[g % grands.length];
  const f = DIFF[C.div] * (0.88 + 0.3 * opp.force) * (1 + DIFF.s * Math.max(0, C.saison - 1)) * (1 + DIFF.r * (C.ansD1 || 0)) * 1.1;
  return { m: { comp: 'defi', opp: opp.id, dom: false, nom: MODES.defi.nom, tour: 'semaine ' + sem.slice(5) }, opts: { graine: g, semaine: sem, facteurFixe: f, defiPts: 0 } };
}
// score du défi : la qualité de chaque temps fort (score / objectif, plafonnée) plus les buts
const ptsTempsFort = r => Math.min(150, Math.round(100 * r.total / Math.max(1, S.cible)));
const scoreDefi = () => S.defiPts + 150 * S.score.p - 100 * S.score.ia;

// ---------- direct : deux téléphones ----------
// Attaque contre défense. Le pressing et les consignes de chacun s'appliquent à l'autre.
const DUEL = { K: 1.75, but: 1.5, occasion: 0.75 };
function issueDuel(att, def) {
  const a = att.total * (def.sur || 1), d = Math.max(1, def.total * (att.sur || 1));
  const ratio = a / (DUEL.K * d);
  return { issue: ratio >= DUEL.but ? 'but' : ratio >= DUEL.occasion ? 'occasion' : 'stoppe', a: Math.round(a), d: Math.round(d) };
}
// Duel de tir : le tireur vise une zone, le gardien un côté, chacun à la jauge.
// Mauvais côté = but. Bon côté : tout dépend des deux timings. Frappe ratée (rouge) = à côté.
const ARRET = { vert: { vert: 0.5, jaune: 0.8 }, jaune: { vert: 0.2, jaune: 0.5 }, rouge: { vert: 0.05, jaune: 0.15 } };
function duelTir(tir, gardien, x) {
  if (tir.q === 'rouge') return { marque: false, horsCadre: true, bonCote: tir.zone[1] === gardien.col };
  const bonCote = tir.zone[1] === gardien.col;
  if (!bonCote) return { marque: true, horsCadre: false, bonCote };
  return { marque: x >= ARRET[gardien.q][tir.q], horsCadre: false, bonCote };
}
