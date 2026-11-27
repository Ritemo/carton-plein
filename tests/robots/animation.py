from playwright.sync_api import sync_playwright
import pathlib,sys; F=pathlib.Path(__file__).resolve().parents[2].joinpath('docs','index.html').as_uri()
types=sys.argv[1].split(','); att=sys.argv[2]=='att'; issue=sys.argv[3]; tag=sys.argv[4]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(F); pg.wait_for_timeout(600); pg.evaluate("()=>{localStorage.setItem('carton-plein-tuto','1');localStorage.setItem('carton-plein-profil',JSON.stringify({code:'ROBOTANI',pseudo:'',niveauChoisi:true}));localStorage.setItem('carton-plein-cloud','')}"); pg.click('#bNew'); pg.wait_for_timeout(300); pg.click('.pays-choix[data-p="fr"]'); pg.wait_for_timeout(300); pg.click('.club-choix[data-id="caen"]'); pg.wait_for_timeout(300)
    for i in range(4): pg.click('#bSc'); pg.wait_for_timeout(120)
    pg.click('#bJouer'); pg.wait_for_timeout(300); pg.click('#mGo'); pg.wait_for_timeout(500)
    js=f"""()=>{{ S.tf={0 if att else 1}; S.type='normal'; S.phase='choix'; S.sel=[]; preparerTF();
      const T={types!r}; S.main=T.map((t,i)=>({{...nouvelleCarte(t, jiPourType(t), 'commune'), id:9000+i}})).map(c=>({{...c,val:valeurCarte(c)}}));
      S.main.forEach(c=>S.sel.push(c)); issue=()=>'{issue}'; jouer(true); }}"""
    pg.evaluate(js)
    t0=0
    for k in range(40):
        pg.wait_for_timeout(250); 
        if k%2==0: pg.screenshot(path=f'/tmp/an_{tag}_{k:02d}.png', clip={'x':0,'y':0,'width':390,'height':844})
    print(errs, pg.evaluate("S.phase"))
    b.close()
