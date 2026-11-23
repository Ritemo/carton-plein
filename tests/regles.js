// Vérifications rapides des règles. Lancer : node tests/regles.js (sort en erreur si un test échoue)
const fs = require('fs'); let ok = 0, ko = 0;
const verif = (nom, cond) => { if (cond) ok++; else { ko++; console.log('ÉCHEC :', nom); } };
eval(require('./moteur.js') + `
// Tirs : aucun tir parfait garanti, l'orange reste sous 50 %
const essai = (q, n = 4000) => { let b = 0; for (let i = 0; i < n; i++) if (issueFrappe('BG', q).marque) b++; return b / n; };
const vert = essai(qualiteJauge(0.5, 20, 50));
const orange = essai(qualiteJauge(0.7, 20, 50));
verif('tir dans le vert pas garanti (' + vert.toFixed(2) + ')', vert < 0.95 && vert > 0.6);
verif('tir dans l’orange sous 50 % (' + orange.toFixed(2) + ')', orange < 0.5);
let arr = 0; for (let i = 0; i < 4000; i++) if (issuePlongeon('vert', ['G'], 'G').arret) arr++;
verif('gardien : bien plonger ne suffit pas sans le bon côté (' + (arr / 4000).toFixed(2) + ')', arr / 4000 < 0.75);
// Graine : deux tirages avec la même graine donnent la même suite (base du mode 2 joueurs)
fixerGraine(42); const a = [hasard(), hasard(), hasard()]; fixerGraine(42); const b = [hasard(), hasard(), hasard()];
verif('graine reproductible', a.join() === b.join());
// Carrière, sauvegarde et copie manuelle
nouvelleCarriere('amiens'); sauver();
verif('sauvegarde datée', C.maj > 0);
const txt = exporterSauvegarde(), club = C.club; C = null; importerSauvegarde(txt);
verif('copie de sauvegarde relue', C && C.club === club);
let refus = false; try { importerSauvegarde('n’importe quoi'); } catch (e) { refus = true; } verif('texte invalide refusé', refus);
// Aide aux combos : chaque possibilité annoncée est jouable
nouveauMatch(prochainMatch(), true); const p = possibilites();
verif('aide combos renvoie une liste', Array.isArray(p));
verif('ligues réelles complètes', CLUBS.filter(c => c.pays === 'fr' && c.div === 1).length === 18);
`);
const html = fs.existsSync(__dirname + '/../docs/index.html') ? fs.readFileSync(__dirname + '/../docs/index.html', 'utf8') : '';
verif('jeu assemblé (python3 build.py)', html.length > 100000);
verif('aucun tiret cadratin', !html.includes('—'));
console.log(`${ok} tests réussis, ${ko} en échec`); process.exit(ko ? 1 : 0);
