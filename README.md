# Carton Plein

Jeu de cartes de football contre l'ordinateur, inspiré du Buteur. Un match se joue en temps forts : on pose jusqu'à 4 cartes, la jauge monte selon la qualité du combo, puis les occasions se jouent à la jauge (tireur comme gardien). Mode carrière avec les vraies ligues 2026-27 de cinq pays (clubs et joueurs fictifs, blasons originaux).

## Comment ça marche

```
src/  (les sources, découpées par thème)
  │   python3 build.py
  ▼
docs/index.html  (le jeu complet en un seul fichier)
  │   GitHub Pages
  ▼
https://ritemo.github.io/carton-plein/  (s'installe comme une appli)
  │   sauvegarde automatique, facultative
  ▼
Google Apps Script (apps-script/Code.gs) : un fichier par joueur dans ton Drive
```

| Dossier | Contenu |
| --- | --- |
| `src/moteur/` | Les règles, sans affichage : cartes, combos, match, carrière, objectifs, tirs |
| `src/monde/` | Les ligues, clubs, coupes, mercato, centre de formation |
| `src/ecrans/` | Tout ce qui s'affiche : club, match, tutoriel |
| `src/sync.js` | Sauvegarde : copie manuelle et cloud |
| `src/style.css`, `src/page.html`, `src/images.json` | Apparence, squelette de page, images (emoji Fluent, licence MIT) |
| `pwa/` | Fichiers de l'appli installable (`sw.js`, `manifest.json`, icône) |
| `docs/` | Le jeu assemblé, servi par GitHub Pages. Ne pas modifier à la main |
| `tests/` | Vérifications automatiques et robots de test |
| `apps-script/` | Le petit serveur gratuit de sauvegarde cloud |

## Mettre le jeu en ligne (une seule fois)

1. Sur github.com (compte Ritemo) : **New repository**, nom `carton-plein`, **Public**.
2. **Add file > Upload files** : glisser tout le contenu du dossier, puis **Commit changes**.
3. **Settings > Pages** : *Source* = *Deploy from a branch*, branche `main`, dossier `/docs`. Enregistrer.
4. Après une minute, le jeu est sur `https://ritemo.github.io/carton-plein/`. Sur le téléphone : ouvrir l'adresse puis *Ajouter à l'écran d'accueil*.
5. Facultatif : **Settings > Secrets and variables > Actions > New secret** `NTFY_SUJET` (un sujet ntfy avec un suffixe aléatoire) pour recevoir une alerte si les tests échouent.

## Activer la sauvegarde cloud (facultatif)

Sans cloud, la carrière reste sur le téléphone. Le menu **Sauvegarde** permet toujours de la copier (un texte qui commence par `CP1:`) et de la coller sur un autre appareil.

1. Aller sur script.google.com, **Nouveau projet**, coller le contenu de `apps-script/Code.gs`, enregistrer.
2. **Déployer > Nouveau déploiement > Application Web** : *Exécuter en tant que* = moi, *Accès* = tout le monde. Autoriser.
3. Copier l'adresse qui finit par `/exec`.
4. Dans le jeu : menu **Sauvegarde**, coller l'adresse, **Enregistrer l'adresse**.

Chaque téléphone reçoit un code joueur (8 caractères). La sauvegarde part quelques secondes après chaque action. Au lancement, si le cloud a une carrière plus récente, le jeu propose de la reprendre. Le script refuse d'écraser une sauvegarde plus récente. Les fichiers sont dans le dossier Drive *Carton Plein - sauvegardes*.

Note : dans l'aperçu claude.ai, le cloud peut être bloqué. Il fonctionne depuis GitHub Pages.

## Gestes courants

- **Modifier le jeu** : changer les fichiers dans `src/`, puis `python3 build.py`, puis envoyer `src/` et `docs/`.
- **À chaque mise en ligne** : augmenter la version dans `pwa/sw.js` (`carton-plein-v14` devient `v15`), sinon les téléphones gardent l'ancien jeu.
- **Vérifier** : `node tests/regles.js` (règles), `node tests/equilibre.js` (difficulté sur 6 saisons, environ une minute), `node tests/profondeur.js` (le meilleur coup n'est pas juste les 4 plus fortes cartes). Robots d'écran (Playwright) : `python3 tests/robots/audit.py 390 844`, `tour14.py`, `tuto.py`, `tir.py`, `sauvegarde.py`.
- **Nouvelle saison réelle** : mettre à jour les listes de clubs dans `src/monde/clubs.js` (`DONNEES_LIGUES`) et augmenter la version de migration dans `src/moteur/carriere.js` si les anciennes carrières doivent repartir sur les nouvelles ligues.

## En cas d'alerte

Ouvrir l'onglet **Actions** du dépôt, cliquer sur l'exécution en rouge : le message dit quel test a échoué. Le plus fréquent : `docs/` pas à jour, il suffit de relancer `python3 build.py` et de renvoyer `docs/`.

## Préparé pour plus tard

Le hasard du jeu passe par une graine (`fixerGraine`) : deux téléphones qui partagent la même graine tirent les mêmes cartes et obtiennent les mêmes résultats. C'est la base du futur mode deux joueurs en direct (voir le document de conception).
