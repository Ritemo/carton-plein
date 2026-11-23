"""Assemble le jeu en un seul fichier : docs/index.html (plus sw.js et manifest).
Lancer : python3 build.py"""
import json, re, os, shutil
ICI = os.path.dirname(os.path.abspath(__file__))
src = lambda f: open(os.path.join(ICI, 'src', f), encoding='utf-8').read()
ordre = json.loads(src('ordre.json'))
page = src('page.html')
jeu = '\n'.join(src(f) for f in ordre['moteur'])
ecrans = '\n'.join(src(f) for f in ordre['ecrans']).replace('__IMG__', json.dumps(json.loads(src('images.json'))))
html = page.replace('__CSS__', src('style.css')).replace('__JEU__', jeu).replace('__ECRANS__', ecrans)
assert '—' not in html, 'tiret cadratin interdit'
assert not re.search(r'__(CSS|JEU|ECRANS|IMG)__', html), 'marqueur non remplacé'
docs = os.path.join(ICI, 'docs'); os.makedirs(docs, exist_ok=True)
open(os.path.join(docs, 'index.html'), 'w', encoding='utf-8').write(html)
for f in ('sw.js', 'manifest.json', 'icone.svg'):
    shutil.copy(os.path.join(ICI, 'pwa', f), docs)
print(f'docs/index.html : {len(html.encode()) // 1024} Ko')
