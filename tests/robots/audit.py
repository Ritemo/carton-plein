import json, sys
from playwright.sync_api import sync_playwright
import pathlib; F=pathlib.Path(__file__).resolve().parents[2].joinpath('docs','index.html').as_uri()
W,H=int(sys.argv[1]),int(sys.argv[2]); TAG=f'{W}x{H}'
MESURE = """(nom)=>{
 const vw=innerWidth, out={nom, debord:[], coupe:[], vue:null};
 const vue=document.querySelector('#vue'); if(vue) out.vue={sh:vue.scrollHeight, ch:vue.clientHeight};
 document.querySelectorAll('body *').forEach(el=>{
   const cs=getComputedStyle(el); if(cs.display==='none'||cs.visibility==='hidden'||el.closest('#celeb')) return;
   const r=el.getBoundingClientRect(); if(!r.width||!r.height) return;
   if(r.right>vw+1 && !el.closest('.cb-scene')) out.debord.push((el.id?'#'+el.id:el.className||el.tagName).toString().slice(0,40)+' '+Math.round(r.right-vw));
   if(el.children.length===0 && el.textContent.trim() && (el.scrollWidth>el.clientWidth+1) && (cs.overflow.includes('hidden')||cs.textOverflow==='ellipsis')) out.coupe.push(el.textContent.trim().slice(0,30));
 });
 out.debord=[...new Set(out.debord)].slice(0,8); out.coupe=[...new Set(out.coupe)].slice(0,12);
 return out;}"""
res=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':W,'height':H})
    errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    n=[0]
    def shot(nom):
        n[0]+=1; pg.wait_for_timeout(450)
        pg.screenshot(path=f'/tmp/audit/{TAG}_{n[0]:02d}_{nom}.png')
        res.append(pg.evaluate(MESURE, nom))
    def clic(s, t=350): pg.click(s); pg.wait_for_timeout(t)
    pg.goto(F); pg.wait_for_timeout(500); pg.evaluate("()=>effacer()"); pg.reload(); pg.wait_for_timeout(600)
    shot('accueil')
    clic('#bRegles'); shot('regles'); pg.evaluate("()=>fermerModal()"); pg.wait_for_timeout(300); pg.wait_for_timeout(300)
    pg.evaluate("()=>{localStorage.setItem('carton-plein-tuto','1');localStorage.setItem('carton-plein-cloud','')}"); clic('#bNew'); shot('pays')
    clic('.pays-choix[data-p="it"]'); shot('club_it')
    clic('#bRet'); clic('.pays-choix[data-p="fr"]'); shot('club_fr')
    clic('.club-choix[data-id="caen"]'); shot('intro1')
    for i in range(3): clic('#bSc')
    shot('intro4'); clic('#bSc'); shot('vestiaire')
    clic('#bMenu'); shot('menu'); pg.evaluate("()=>fermerModal()"); pg.wait_for_timeout(300)
    clic('.onglet[data-o="effectif"]'); shot('eff_cartes')
    clic('.carte >> nth=0'); shot('fiche_carte'); pg.evaluate("()=>fermerModal()"); pg.wait_for_timeout(300)
    clic('[data-ge="joueurs"]'); shot('eff_joueurs')
    clic('[data-ge="mercato"]'); shot('eff_mercato')
    clic('.onglet[data-o="formation"]'); shot('formation')
    clic('.onglet[data-o="boutique"]'); shot('boutique')
    clic('.onglet[data-o="competitions"]'); shot('compet_ligue')
    for g in ['coupes','palmares','une']: clic(f'[data-g="{g}"]'); shot('compet_'+g)
    clic('.onglet[data-o="vestiaire"]')
    clic('#bJouer'); shot('coup_envoi'); clic('#mGo',600); shot('match_choix')
    pg.evaluate("()=>{S.main.filter(c=>TYPES[c.t].att===enAttaque()).slice(0,3).forEach(choisirCarte)}"); shot('match_sel')
    clic('#bAide2'); shot('aide'); pg.evaluate("()=>fermerModal()"); pg.wait_for_timeout(300)
    clic('#bChg'); shot('match_changement'); clic('#bAnn') if pg.is_visible('#bAnn') else None
    pg.evaluate("()=>{S.modeChange=false; S.sel=[]; S.main.filter(c=>TYPES[c.t].att===enAttaque()).slice(0,3).forEach(choisirCarte); S.cible=9999; zoneAction();}")
    pg.click('#bJouer'); pg.wait_for_timeout(700); shot('match_calcul'); pg.wait_for_timeout(3500); shot('match_resultat')
    # occasion
    pg.evaluate("()=>{S.phase='occasion'; S.res=calcul(S.main.slice(0,1)); zoneAction();}"); shot('match_occasion')
    pg.click('[data-z="HG"]'); pg.wait_for_timeout(500); shot('match_jauge'); pg.click('#bFrappe'); pg.wait_for_timeout(300); shot('match_tir'); pg.wait_for_timeout(2200)
    # fin de match perdue sans récompense
    pg.evaluate("()=>{S.score={p:0,ia:1}; finMatch();}"); pg.wait_for_timeout(800); shot('fin_defaite')
    clic('#bFinOk',600) if pg.is_visible('#bFinOk') else clic('.recomp >> nth=0',900)
    # victoire avec récompenses
    pg.click('#bJouer'); pg.wait_for_timeout(300); pg.click('#mGo'); pg.wait_for_timeout(400)
    pg.evaluate("()=>{S.score={p:3,ia:1}; S.buteurs=[10,10,7]; finMatch();}"); pg.wait_for_timeout(900); shot('fin_victoire')
    clic('.recomp >> nth=0',900)
    # dilemme
    pg.evaluate("()=>{C.journee=2; sauver(); hub('vestiaire')}"); shot('dilemme')
    pg.evaluate("()=>{C.journee=3; sauver(); hub('vestiaire')}")
    # coupe + tab
    pg.evaluate("()=>{C.journee=3; sauver(); hub('vestiaire')}"); shot('vestiaire_coupe')
    # fin de saison + offres
    pg.evaluate("()=>{C.journee=C.calendrier.length;Object.values(C.coupes).forEach(c=>c.elim=true);C.classement[C.club].pts=90;sauver();Math.random=(()=>0.2);hub('vestiaire')}"); shot('fin_saison')
    if pg.is_visible('#bSaison'): clic('#bSaison',500); shot('apres_saison')
    print(json.dumps({'errs':errs}))
    b.close()
json.dump(res, open(f'/tmp/audit/{TAG}.json','w'), ensure_ascii=False, indent=0)
for r in res:
    v=r['vue']; sc = f"{v['sh']}/{v['ch']}" if v else '-'
    print(f"{r['nom']:<18} scroll {sc:<10} debord {r['debord']}  coupé {r['coupe']}")
