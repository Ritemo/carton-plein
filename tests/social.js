// Règles des matchs entre amis et serveur (vrai Code.gs dans Node). Lancer : node tests/social.js
const { creer } = require('./serveur.js'); let ok = 0, ko = 0;
const verif = (nom, cond) => { if (cond) ok++; else { ko++; console.log('ÉCHEC :', nom); } };
eval(require('./moteur.js') + `
// duel : le même calcul vu des deux téléphones
const a = { total: 150, sur: 1 }, d = { total: 50, sur: 1 };
verif('duel : grosse attaque = but', issueDuel(a, d).issue === 'but');
verif('duel : petite attaque = stoppée', issueDuel({ total: 40 }, { total: 90 }).issue === 'stoppe');
verif('duel : pressing de la défense compte', issueDuel({ total: 100, sur: 1 }, { total: 60, sur: 0.8 }).a === 80);
verif('tir : mauvais côté = but', duelTir({ zone: 'HG', q: 'jaune' }, { col: 'D', q: 'vert' }, 0.99).marque);
verif('tir : frappe ratée = à côté', duelTir({ zone: 'HG', q: 'rouge' }, { col: 'D', q: 'rouge' }, 0).horsCadre);
verif('tir : bon côté et plongeon parfait contre frappe moyenne', !duelTir({ zone: 'BG', q: 'jaune' }, { col: 'G', q: 'vert' }, 0.5).marque);
verif('tirage commun identique', tirageCommun(123, 'tir3') === tirageCommun(123, 'tir3') && tirageCommun(123, 'tir3') !== tirageCommun(123, 'tir4'));
verif('semaine ISO', semaineDefi('2026-11-24') === '2026-48' && semaineDefi('2027-01-01') === '2026-53');
// ombre : habitudes tirées du carnet
const P = { code: 'X', pseudo: 'Priam', club: 'amiens', div: 2, saison: 2, carnet: { combos: { tiki: 9, contre: 2, bloc: 5 }, tirsCol: { G: 7, C: 1, D: 0 }, plongeonsCol: { G: 0, C: 0, D: 4 } } };
const H = habitudes(P);
verif('ombre : style tiré du combo préféré', H.style === 'possession');
verif('ombre : intentions = ses combos d’attaque', H.intentions.tiki === 9 && !H.intentions.bloc);
nouvelleCarriere('amiens'); const o = matchOmbre(P); nouveauMatch(o.m, true, o.opts);
verif('ombre : match amical lancé', estAmical() && S.comp === 'ombre' && S.facteurFixe > 1);
let f = 0; for (let i = 0; i < 400; i++) if (pickPoids(H.tirs) === 'G') f++; verif('ombre : tire surtout à gauche', f > 300);
// défi : même adversaire et même tirage pour deux joueurs différents
const d1 = matchDefi(); nouveauMatch(d1.m, true, d1.opts); const main1 = S.main.map(c => c.t).join();
const d2 = matchDefi(); nouveauMatch(d2.m, true, d2.opts); const main2 = S.main.map(c => c.t).join();
verif('défi : même adversaire', d1.m.opp === d2.m.opp); verif('défi : même tirage', main1 === main2);
// direct : l'invité défend au premier temps fort
nouveauMatch({ comp: 'direct', opp: 'amiens', dom: false }, true, { inverse: true, facteurFixe: 1, direct: { graine: 1 } });
verif('direct : invité en défense au début', !enAttaque() && S.adv.length === 0);
`);
// serveur
const Sv = creer();
Sv.post({ action: 'save', code: 'PAPA1234', maj: 1, pseudo: 'Papa', amis: ['PRIAM123'], data: { club: 'amiens', div: 3, cartes: [], stars: [], niveaux: {}, carnet: { combos: { tiki: 3 } } } });
verif('serveur : profil public', Sv.get({ action: 'profil', code: 'PAPA1234' }).profil.carnet.combos.tiki === 3);
verif('serveur : refuse une sauvegarde plus ancienne', !Sv.post({ action: 'save', code: 'PAPA1234', maj: 0, data: {} }).ok);
Sv.post({ action: 'message', de: 'PAPA1234', a: 'PRIAM123', pseudo: 'Papa', txt: '<b>Salut</b>' });
const soc = Sv.get({ action: 'social', code: 'PRIAM123', amis: 'PAPA1234', semaine: '2026-48' });
verif('serveur : message reçu et nettoyé', soc.messages.length === 1 && !soc.messages[0].txt.includes('<'));
const sal = Sv.post({ action: 'salonCree', joueur: { code: 'PAPA1234' } }).salon;
verif('serveur : un salon refuse un troisième joueur', Sv.post({ action: 'salonRejoindre', id: sal.id, joueur: { code: 'PRIAM123' } }).ok && !Sv.post({ action: 'salonRejoindre', id: sal.id, joueur: { code: 'AUTRE123' } }).ok);
Sv.post({ action: 'defi', semaine: '2026-48', code: 'PAPA1234', score: 300 }); const df = Sv.post({ action: 'defi', semaine: '2026-48', code: 'PAPA1234', score: 200 }).defi;
verif('serveur : défi garde le meilleur score et compte les essais', df.PAPA1234.score === 300 && df.PAPA1234.essais === 2);
// carrière coop : un deuxième entraîneur, pas de troisième ; une sauvegarde périmée est refusée
const co = Sv.post({ action: 'coopCree', code: 'PAPA1234', pseudo: 'Papa', maj: 5, data: { club: 'cannes', coop: {} } });
verif('coop : rejoindre', Sv.post({ action: 'coopRejoindre', id: co.id, code: 'PRIAM123', pseudo: 'Priam' }).membres.length === 2);
verif('coop : pas de troisième', !Sv.post({ action: 'coopRejoindre', id: co.id, code: 'AUTRE123', pseudo: 'X' }).ok);
const s1 = Sv.post({ action: 'coopSave', id: co.id, code: 'PRIAM123', maj: 10, base: 5, data: { club: 'cannes', coop: { relais: { par: 'PRIAM123', pseudo: 'Priam', score: { p: 1, ia: 0 } } } } });
verif('coop : sauvegarde à jour acceptée', s1.ok);
verif('coop : sauvegarde périmée refusée', !Sv.post({ action: 'coopSave', id: co.id, code: 'PAPA1234', maj: 99, base: 5, data: { coop: {} } }).ok);
verif('coop : relais visible chez l’autre', Sv.get({ action: 'social', code: 'PAPA1234' }).coops[0].relais.par === 'PRIAM123');
console.log(`${ok} tests réussis, ${ko} en échec`); process.exit(ko ? 1 : 0);
