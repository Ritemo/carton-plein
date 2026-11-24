# Robot : écran Sauvegarde (copie manuelle aller-retour)
import pathlib, sys
from playwright.sync_api import sync_playwright
F = pathlib.Path(__file__).resolve().parents[2].joinpath('docs', 'index.html').as_uri()
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(F); pg.evaluate("()=>{localStorage.clear();localStorage.setItem('carton-plein-tuto','1');localStorage.setItem('carton-plein-cloud','')}"); pg.reload(); pg.wait_for_timeout(500)
    pg.evaluate("()=>{nouvelleCarriere('amiens'); C.pieces=123; sauver(); hub('vestiaire')}"); pg.wait_for_timeout(400)
    pg.click('#bMenu'); pg.wait_for_timeout(300); pg.click('#mSauv'); pg.wait_for_timeout(400)
    pg.screenshot(path='/tmp/audit/sauvegarde.png')
    txt = pg.evaluate("()=>exporterSauvegarde()")
    pg.evaluate("()=>{C.pieces=0; sauver()}")
    pg.click('#sCol'); pg.fill('#sTxt', txt); pg.click('#sCol'); pg.wait_for_timeout(400)
    pieces = pg.evaluate("()=>C.pieces")
    print('pièces après reprise', pieces, 'erreurs', errs)
    sys.exit(0 if pieces == 123 and not errs else 1)
