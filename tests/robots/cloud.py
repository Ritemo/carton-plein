# Robot : deux téléphones et un faux script Google. A sauvegarde tout seul, B retrouve la carrière avec le code.
import pathlib, json, sys
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright
F = pathlib.Path(__file__).resolve().parents[2].joinpath('docs', 'index.html').as_uri()
URL = 'https://script.google.com/macros/s/test/exec'
NUAGE = {}
def script(route):
    r = route.request
    if r.method == 'POST':
        o = json.loads(r.post_data); NUAGE[o['code']] = o; body = {'ok': True}
    else:
        q = parse_qs(urlparse(r.url).query); o = NUAGE.get(q['code'][0])
        body = {'ok': True, 'data': o['data'], 'maj': o['maj'], 'pseudo': o['pseudo']} if o else {'ok': True, 'data': None}
    route.fulfill(status=200, content_type='application/json', body=json.dumps(body), headers={'Access-Control-Allow-Origin': '*'})
with sync_playwright() as p:
    b = p.chromium.launch(); errs = []
    def tel():
        ctx = b.new_context(viewport={'width': 390, 'height': 844}); ctx.route(URL + '*', script)
        pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(F); pg.evaluate(f"()=>{{localStorage.clear();localStorage.setItem('carton-plein-tuto','1');localStorage.setItem('carton-plein-profil',JSON.stringify({{code:Math.random().toString(36).slice(2,10).toUpperCase().padEnd(8,'X'),pseudo:'',niveauChoisi:true}}));localStorage.setItem('carton-plein-cloud','{URL}')}}"); pg.reload(); pg.wait_for_timeout(500)
        return pg
    a = tel()
    a.evaluate("()=>{nouvelleCarriere('amiens'); C.pieces=777; sauver(); hub('vestiaire')}"); a.wait_for_timeout(5000)
    code = a.evaluate("()=>profil().code"); print('code A', code, 'dans le nuage :', code in NUAGE)
    bb = tel(); bb.screenshot(path='/tmp/audit/cloud_accueil.png')
    bb.click('#bRecup'); bb.wait_for_timeout(300); bb.fill('#rCode', code.lower()); bb.click('#rOk'); bb.wait_for_timeout(1200)
    res = bb.evaluate("()=>({club:C.club, pieces:C.pieces, code:profil().code})"); print('téléphone B', res, 'erreurs', errs)
    bb.click('#bMenu'); bb.wait_for_timeout(300); bb.click('#mSauv'); bb.wait_for_timeout(400); bb.screenshot(path='/tmp/audit/cloud_menu.png')
    sys.exit(0 if res['pieces'] == 777 and res['code'] == code and not errs else 1)
