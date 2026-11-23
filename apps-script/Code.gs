/**
 * Carton Plein : sauvegarde cloud des carrières (Google Apps Script).
 * Un fichier JSON par joueur dans un dossier Drive « Carton Plein - sauvegardes ».
 *
 * Déploiement : Déployer > Nouveau déploiement > Application Web
 *   - Exécuter en tant que : moi
 *   - Accès : tout le monde
 * Copier l'adresse /exec et la coller dans le jeu (menu > Sauvegarde).
 */
const DOSSIER = 'Carton Plein - sauvegardes';

function dossier_() {
  const it = DriveApp.getFoldersByName(DOSSIER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(DOSSIER);
}
function fichier_(code) {
  if (!/^[A-Z0-9]{6,12}$/.test(code || '')) throw new Error('code invalide');
  const it = dossier_().getFilesByName(code + '.json');
  return it.hasNext() ? it.next() : null;
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function doGet(e) {
  try {
    const p = e.parameter || {};
    if (p.action === 'load') {
      const f = fichier_(p.code);
      if (!f) return json_({ ok: true, data: null });
      const o = JSON.parse(f.getBlob().getDataAsString());
      return json_({ ok: true, maj: o.maj, pseudo: o.pseudo, data: o.data });
    }
    return json_({ ok: true, info: 'Carton Plein : sauvegarde cloud' });
  } catch (err) { return json_({ ok: false, erreur: String(err) }); }
}
function doPost(e) {
  const verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    const o = JSON.parse(e.postData.contents);
    if (o.action !== 'save') return json_({ ok: false, erreur: 'action inconnue' });
    const f = fichier_(o.code), contenu = JSON.stringify({ maj: o.maj, pseudo: o.pseudo || '', data: o.data });
    if (contenu.length > 5e6) return json_({ ok: false, erreur: 'sauvegarde trop grosse' });
    if (f) {
      // ne jamais écraser une sauvegarde plus récente (deux téléphones)
      const avant = JSON.parse(f.getBlob().getDataAsString());
      if ((avant.maj || 0) > (o.maj || 0)) return json_({ ok: false, erreur: 'plus récente sur le cloud', maj: avant.maj });
      f.setContent(contenu);
    } else dossier_().createFile(o.code + '.json', contenu, MimeType.PLAIN_TEXT);
    return json_({ ok: true });
  } catch (err) { return json_({ ok: false, erreur: String(err) }); }
  finally { verrou.releaseLock(); }
}
