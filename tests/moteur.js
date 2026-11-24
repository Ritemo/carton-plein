// Charge le moteur du jeu (sans écran) dans Node, dans le même ordre que build.py
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', 'src');
global.localStorage = { _d: { 'carton-plein-cloud': '', ...(process.env.CP_NIVEAU ? { 'carton-plein-profil': JSON.stringify({ code: 'TESTTEST', pseudo: '', reglages: { difficulte: process.env.CP_NIVEAU } }) } : {}) }, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
const ordre = JSON.parse(fs.readFileSync(path.join(SRC, 'ordre.json'), 'utf8'));
module.exports = ordre.moteur.map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n') + '\nfunction finMatch(){S.phase="fin";}\n';
