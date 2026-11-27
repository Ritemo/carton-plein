from playwright.sync_api import sync_playwright
import pathlib; F=pathlib.Path(__file__).resolve().parents[2].joinpath('docs','index.html').as_uri()
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':375,'height':740},device_scale_factor=2)
    errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(F); pg.wait_for_timeout(600); pg.evaluate("()=>{localStorage.setItem('carton-plein-tuto','1');localStorage.setItem('carton-plein-profil',JSON.stringify({code:'ROBOTTRN',pseudo:'',niveauChoisi:true}));localStorage.setItem('carton-plein-rapide','1');localStorage.setItem('carton-plein-cloud','')}"); pg.click('#bNew'); pg.wait_for_timeout(300); pg.click('.pays-choix[data-p="fr"]'); pg.wait_for_timeout(300); pg.click('.club-choix[data-id="caen"]'); pg.wait_for_timeout(300)
    for i in range(4): pg.click('#bSc'); pg.wait_for_timeout(120)
    pg.evaluate("()=>{C.journee=3; hub('vestiaire');}"); pg.wait_for_timeout(300)
    assert pg.query_selector('#bTournee'), 'carte Tournée absente'
    pg.click('#bTournee'); pg.wait_for_timeout(300); pg.screenshot(path='/tmp/tr_0.png', full_page=True)
    pg.click('#trGo'); pg.wait_for_timeout(300); pieces0=pg.evaluate('C.pieces')
    scores=[(2,0),(1,1),(0,1),(3,1),(2,2),(1,0),(0,2),(2,1)]
    n=0
    while True:
        st=pg.evaluate("()=>{const R=C.tournee.run; return R.fini?null:R.etape}")
        if st is None: break
        noeuds=pg.query_selector_all('[data-noeud]')
        types=[pg.evaluate("e=>e.className",x) for x in noeuds]
        vi=[i for i,t in enumerate(types) if 'vestiaire' in t]
        k=vi[0] if vi and not pg.evaluate('C.tournee.run.renforts.length') else (1 if vi==[0] else 0)
        if 'vestiaire' in types[k]:
            noeuds[k].click(); pg.wait_for_timeout(300); pg.screenshot(path='/tmp/tr_vest.png'); pg.click('[data-bonus="renfort"]'); pg.wait_for_timeout(400); n+=1; continue
        noeuds[k].click(); pg.wait_for_timeout(400)
        if n==0: pg.screenshot(path='/tmp/tr_lance.png')
        pg.click('#mGo'); pg.wait_for_timeout(500)
        gp,gc=scores[n%len(scores)]
        pg.evaluate(f"()=>{{S.score.p={gp};S.score.ia={gc};S.buteurs=Array({gp}).fill(0);finMatch();}}"); pg.wait_for_timeout(600)
        pg.screenshot(path=f'/tmp/tr_fin{n}.png')
        pg.click('#bFinOk'); pg.wait_for_timeout(400); n+=1
        if n>15: break
    pg.wait_for_timeout(1200); pg.screenshot(path='/tmp/tr_bout.png', full_page=True)
    R=pg.evaluate("()=>JSON.stringify({run:C.tournee.run, essais:C.tournee.essais, pieces:C.pieces, cartes:C.cartes.length})")
    print(R, 'pieces avant', pieces0)
    print('erreurs', errs)
    b.close()
