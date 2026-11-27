from playwright.sync_api import sync_playwright
import pathlib, json; F=pathlib.Path(__file__).resolve().parents[2].joinpath('docs','index.html').as_uri()
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844})
    pg.goto(F); pg.wait_for_timeout(600); pg.evaluate("()=>{localStorage.setItem('carton-plein-tuto','1');localStorage.setItem('carton-plein-profil',JSON.stringify({code:'ROBOTDEF',pseudo:'',niveauChoisi:true}));localStorage.setItem('carton-plein-rapide','1');localStorage.setItem('carton-plein-cloud','')}"); pg.click('#bNew'); pg.wait_for_timeout(300); pg.click('.pays-choix[data-p="fr"]'); pg.wait_for_timeout(300); pg.click('.club-choix[data-id="caen"]'); pg.wait_for_timeout(300)
    for i in range(4): pg.click('#bSc'); pg.wait_for_timeout(120)
    pg.click('#bJouer'); pg.wait_for_timeout(300); pg.click('#mGo'); pg.wait_for_timeout(500)
    print(pg.evaluate("()=>JSON.stringify(C.cartes.filter(c=>!TYPES[c.t].att && !estConsigne(c.t)).map(c=>[c.t,c.ji,C.effectif[c.ji].p]))"))
    for essai in range(1):
        r=pg.evaluate("""async ()=>{ S.tf=1; S.type='normal'; S.phase='choix'; S.sel=[]; preparerTF();
          if(C.effectif.length<12){C.effectif.push({nom:'Kevin Remplaçant',p:'Gardien',l:'DEF',k:'jaune',note:1,buts:0,matchs:0}); C.cartes.push(nouvelleCarte('gardien',C.effectif.length-1,'commune'));} const G=C.cartes.filter(c=>c.t==='gardien'); const D=[G[0],G[G.length-1]].concat(C.cartes.filter(c=>c.t==='tacle').slice(0,2)).map(c=>({...c,val:valeurCarte(c)}));
          S.main=D; D.forEach(c=>S.sel.push(c));
          const log=[]; window.TOK=()=>new Set(Object.values(SCENE.joueurs)).size; const og=gesteSuivant; gesteSuivant=async (sc,imp)=>{ await og(sc,imp); log.push(Object.entries(sc.joueurs).map(([ji,o])=>[C.effectif[ji].p.slice(0,4),Math.round(o.x),Math.round(o.y)])); };
          const of=finAction; let fin=null; finAction=async (sc,t)=>{ const v=await of(sc,t); fin=[t, 'jetons:'+new Set(Object.values(sc.joueurs)).size+' gk:'+sc.calque.querySelectorAll('.tk').length,Object.entries(sc.joueurs).map(([ji,o])=>[C.effectif[ji].p.slice(0,4),Math.round(o.x),Math.round(o.y)])]; return v; };
          await jouer(true); gesteSuivant=og; finAction=of; return JSON.stringify({cartes:D.map(c=>c.t),log,fin}); }""")
        print(r)
    b.close()
