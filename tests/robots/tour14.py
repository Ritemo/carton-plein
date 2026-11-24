from playwright.sync_api import sync_playwright
import pathlib; F=pathlib.Path(__file__).resolve().parents[2].joinpath('docs','index.html').as_uri()
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':375,'height':740},device_scale_factor=2)
    errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(F); pg.wait_for_timeout(600); pg.evaluate("()=>{localStorage.setItem('carton-plein-tuto','1');localStorage.setItem('carton-plein-cloud','')}"); pg.click('#bNew'); pg.wait_for_timeout(300); pg.click('.pays-choix[data-p="fr"]'); pg.wait_for_timeout(300); pg.click('.club-choix[data-id="caen"]'); pg.wait_for_timeout(300)
    for i in range(4): pg.click('#bSc'); pg.wait_for_timeout(120)
    pg.click('#bJouer'); pg.wait_for_timeout(300); pg.click('#mGo'); pg.wait_for_timeout(500)
    for typ,tf in [('cf',2),('corner',2),('eclair',2),('penalty',1)]:
        pg.evaluate(f"()=>{{ S.tf={tf}; S.type='{typ}'; S.phase='choix'; S.sel=[]; S.main=S.main.concat(S.pioche.splice(0,4)).slice(-8); const sv=tirerTypeTF; tirerTypeTF=()=>'{typ}'; preparerTF(); tirerTypeTF=sv; }}"); pg.wait_for_timeout(700)
        pg.screenshot(path=f'/tmp/v_{typ}_0.png')
        if typ!='penalty':
            pg.evaluate("()=>{ S.main.filter(c=>TYPES[c.t].att===true).sort((a,b)=>b.val-a.val).slice(0,maxJouees()).forEach(choisirCarte); }"); pg.wait_for_timeout(400)
            pg.screenshot(path=f'/tmp/v_{typ}_1.png')
            print(typ, pg.evaluate("()=>{const g=document.querySelector('.jauge .rempli'); return JSON.stringify({jauge: g? g.style.transform : 'ABSENT', type:S.type, cible:S.cible, sel:S.sel.length, total: calcul(S.sel).total})}"))
            pg.evaluate('()=>{document.querySelector("#bJouer").scrollIntoView()}'); pg.click('#bJouer'); pg.wait_for_timeout(1200); pg.screenshot(path=f'/tmp/v_{typ}_2.png'); pg.wait_for_timeout(2500); pg.screenshot(path=f'/tmp/v_{typ}_3.png')
        else:
            pg.click('[data-col="G"]'); pg.wait_for_timeout(500); pg.screenshot(path='/tmp/pl_jauge.png'); pg.click('#bPlonge'); pg.wait_for_timeout(1200); pg.screenshot(path=f'/tmp/v_{typ}_2.png'); pg.wait_for_timeout(2500); pg.screenshot(path=f'/tmp/v_{typ}_3.png')
    print(errs)
    b.close()
