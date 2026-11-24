from playwright.sync_api import sync_playwright
import pathlib; F=pathlib.Path(__file__).resolve().parents[2].joinpath('docs','index.html').as_uri()
def jouer_match(pg, pref, shots):
    k=0
    for i in range(120):
        if pg.is_visible('#bTutoSuite') or pg.is_visible('.recomp') or pg.is_visible('#bFinOk'): return
        if pg.is_visible('#eA'): pg.screenshot(path=f'/tmp/{pref}_evt.png'); pg.click('#eA'); pg.wait_for_timeout(300); continue
        if pg.is_visible('#mGo'): pg.click('#mGo'); pg.wait_for_timeout(400); continue
        ph=pg.evaluate("()=>S?S.phase:'none'")
        if ph=='choix':
            if k<shots: pg.screenshot(path=f'/tmp/{pref}_{k}.png'); k+=1
            pg.evaluate("()=>{const b=meilleurCoup(); b.sel.forEach(c=>choisirCarte(c));}"); pg.wait_for_timeout(200)
            if k<shots: pg.screenshot(path=f'/tmp/{pref}_{k}.png'); k+=1
            if pg.is_visible('#bPasse'): pg.click('#bPasse')
            else: pg.click('#bJouer')
            pg.wait_for_timeout(3200)
        elif ph=='occasion':
            if k<shots: pg.screenshot(path=f'/tmp/{pref}_{k}.png'); k+=1
            if pg.is_visible('[data-z="HG"]'): pg.click('[data-z="HG"]'); pg.wait_for_timeout(500)
            pg.click('#bFrappe'); pg.wait_for_timeout(2800)
        elif ph in ('tirAdverse','penalty'):
            if k<shots: pg.screenshot(path=f'/tmp/{pref}_{k}.png'); k+=1
            pg.click('[data-col="G"]'); pg.wait_for_timeout(500); pg.screenshot(path='/tmp/pl_jauge.png'); pg.click('#bPlonge'); pg.wait_for_timeout(2800)
        elif ph=='tirAnim': pg.wait_for_timeout(500)
        elif pg.is_visible('#bSuite'): pg.click('#bSuite'); pg.wait_for_timeout(500)
        else: pg.wait_for_timeout(400)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':375,'height':740},device_scale_factor=2)
    errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(F); pg.wait_for_timeout(500); pg.evaluate("()=>{effacer(); localStorage.removeItem('carton-plein-tuto');localStorage.setItem('carton-plein-cloud','')}"); pg.reload(); pg.wait_for_timeout(600)
    pg.click('#bNew'); pg.wait_for_timeout(400); pg.screenshot(path='/tmp/t_offre.png'); pg.click('#mTuto'); pg.wait_for_timeout(500)
    pg.screenshot(path='/tmp/t1_intro.png')
    jouer_match(pg,'t1',6)
    pg.screenshot(path='/tmp/t1_fin.png'); pg.click('#bTutoSuite'); pg.wait_for_timeout(500)
    jouer_match(pg,'t2',4)
    pg.screenshot(path='/tmp/t2_fin.png'); pg.click('#bTutoSuite'); pg.wait_for_timeout(500); pg.screenshot(path='/tmp/t_pays.png')
    print('save', pg.evaluate("()=>localStorage.getItem('carton-plein-carriere-v1')===null"), pg.evaluate("()=>localStorage.getItem('carton-plein-tuto')"))
    # carrière + vestiaire avec objectifs et rival
    pg.click('.pays-choix[data-p="fr"]'); pg.wait_for_timeout(300); pg.click('.club-choix[data-id="caen"]'); pg.wait_for_timeout(300)
    for i in range(4): pg.click('#bSc'); pg.wait_for_timeout(120)
    pg.wait_for_timeout(300); pg.screenshot(path='/tmp/t_vest.png', full_page=True)
    pg.evaluate("()=>document.querySelector('#vue').scrollTo(0,9999)"); pg.wait_for_timeout(200); pg.screenshot(path='/tmp/t_vest2.png')
    pg.click('#bJouer'); pg.wait_for_timeout(400); pg.screenshot(path='/tmp/t_ce.png')
    jouer_match(pg,'c',3)
    pg.wait_for_timeout(800); pg.screenshot(path='/tmp/t_finc.png', full_page=True)
    print(errs)
    b.close()
