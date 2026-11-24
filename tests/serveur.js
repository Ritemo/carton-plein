// Faux serveur Google : exécute le vrai apps-script/Code.gs dans Node, avec un Drive et un cache en mémoire.
// Utilisé par les tests (node tests/social.js) et les robots (python3 tests/robots/social.py).
// Lancer seul : node tests/serveur.js 8765
const fs = require('fs'), path = require('path'), http = require('http'), vm = require('vm');
function creer() {
  const fichiers = {}, cache = {};
  const fichier = nom => ({ getBlob: () => ({ getDataAsString: () => fichiers[nom] }), setContent: t => { fichiers[nom] = t; } });
  const dossier = { getFilesByName: nom => { let lu = false; return { hasNext: () => !lu && nom in fichiers, next: () => { lu = true; return fichier(nom); } }; }, createFile: (nom, t) => { fichiers[nom] = t; return fichier(nom); } };
  const ctx = {
    DriveApp: { getFoldersByName: () => { let lu = false; return { hasNext: () => !lu, next: () => { lu = true; return dossier; } }; }, createFolder: () => dossier },
    MimeType: { PLAIN_TEXT: 'text/plain' },
    LockService: { getScriptLock: () => ({ waitLock() { }, releaseLock() { } }) },
    CacheService: { getScriptCache: () => ({ get: k => cache[k] || null, put: (k, v) => { cache[k] = v; } }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: t => ({ setMimeType() { return this; }, texte: t }) },
    Math, JSON, Date, String, Object
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Code.gs'), 'utf8'), ctx);
  return {
    fichiers, cache,
    get: params => JSON.parse(ctx.doGet({ parameter: params }).texte),
    post: obj => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(obj) } }).texte)
  };
}
function demarrer(port) {
  const S = creer();
  const srv = http.createServer((req, res) => {
    const h = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
    if (req.method === 'OPTIONS') { res.writeHead(204, { ...h, 'Access-Control-Allow-Headers': '*' }); return res.end(); }
    if (req.method === 'GET') { const u = new URL(req.url, 'http://x'); res.writeHead(200, h); return res.end(JSON.stringify(S.get(Object.fromEntries(u.searchParams)))); }
    let b = ''; req.on('data', d => (b += d)); req.on('end', () => { res.writeHead(200, h); res.end(JSON.stringify(S.post(JSON.parse(b)))); });
  });
  srv.listen(port); return srv;
}
module.exports = { creer, demarrer };
if (require.main === module) { const p = +process.argv[2] || 8765; demarrer(p); console.log('serveur sur http://localhost:' + p); }
