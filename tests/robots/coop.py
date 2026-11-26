# Robot : carrière coop à deux téléphones avec le faux serveur (vrai Code.gs).
# A crée le club, B le rejoint, A joue la 1re mi-temps, B la 2e ; primes versées aux carrières solo ; solo de A intact.
import pathlib, subprocess, sys, time
from playwright.sync_api import sync_playwright
RACINE = pathlib.Path(__file__).resolve().parents[2]
F = RACINE.joinpath('docs', 'index.html').as_uri()
PORT = 8797; URL = f'http://localhost:{PORT}'
srv = subprocess.Popen(['node', str(RACINE / 'tests' / 'serveur.js'), str(PORT)], stdout=subprocess.PIPE); time.sleep(0.8)
errs = []
JOUE = """() => {
  if (!S) return 'aucun';
  const ph = S.phase;
  if (document.getElementById('ecran').style.display === 'flex') { const b = document.querySelector('#mGo,#eA'); if (b) b.click(); return 'modal'; }
  if (ph === 'choix') { const b = meilleurCoup(false); S.sel = b.sel; if (!S.sel.length) { jouer(true); return ph; } jouer(); return ph; }
  if (ph === 'occasion') { if (!S.tirEtat || !S.tirEtat.zone) { choisirZone('BG'); return ph; } JAUGE.pos = 0.5; frapper(); return ph; }
  if (ph === 'tirAdverse' || ph === 'penalty') { if (!S.tirEtat || !S.tirEtat.col) { plonger('G'); return ph; } JAUGE.pos = 0.5; plongeon(); return ph; }
  const s = document.getElementById('bSuite'); if (s && ['but','rate','stoppe','butAdverse','tirRes'].includes(ph)) { s.click(); return ph; }
  if (ph === 'tab') { const t = document.querySelector('[data-z],[data-col]'); if (t) t.click(); return ph; }
  return ph;
}"""
def telephone(b, nom, club):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}); pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(nom + ': ' + str(e)))
    pg.goto(F); pg.evaluate(f"()=>{{localStorage.clear();localStorage.setItem('carton-plein-tuto','1');localStorage.setItem('carton-plein-profil',JSON.stringify({{code:Math.random().toString(36).slice(2,10).toUpperCase().padEnd(8,'X'),pseudo:'',niveauChoisi:true}}));localStorage.setItem('carton-plein-cloud','{URL}')}}"); pg.reload(); pg.wait_for_timeout(400)
    pg.evaluate(f"()=>{{nouvelleCarriere('{club}'); C.pieces=11; const p=profil(); p.pseudo='{nom}'; majProfil(p); sauver(); hub('vestiaire')}}"); pg.wait_for_timeout(500)
    return pg
def jouer_jusqua(pg, cond, limite=300):
    for _ in range(limite):
        if pg.evaluate(cond): return True
        pg.evaluate(JOUE); pg.wait_for_timeout(200)
    return False
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        A = telephone(b, 'Papa', 'cannes'); B = telephone(b, 'Priam', 'caen')
        cb = B.evaluate("()=>profil().code")
        A.evaluate(f"()=>{{const p=profil(); p.amis=[{{code:'{cb}',pseudo:'Priam',club:'caen'}}]; majProfil(p);}}")
        # A crée le club coop
        A.evaluate("()=>ecranCoop()"); A.wait_for_timeout(800); A.click('#cNew'); A.wait_for_timeout(300); A.click('#cGo'); A.wait_for_timeout(500)
        A.click('[data-p="fr"]') if A.query_selector('[data-p="fr"]') else A.evaluate("()=>choixClub('fr')"); A.wait_for_timeout(400)
        A.click('.club-choix[data-id="sochaux"]') if A.query_selector('.club-choix[data-id="sochaux"]') else A.evaluate("()=>document.querySelector('.club-choix').click()")
        A.wait_for_timeout(1500)
        for _ in range(5):
            bt = A.query_selector('#ecran .btn'); 
            if A.evaluate("()=>document.getElementById('ecran').style.display==='flex'") and bt: bt.click(); A.wait_for_timeout(400)
        idc = A.evaluate("()=>COOP"); print('club coop', idc, A.evaluate("()=>C.club"), 'solo de A', A.evaluate("()=>charger().club"))
        A.evaluate("()=>hub('vestiaire')"); A.wait_for_timeout(400); A.screenshot(path='/tmp/audit/coop_A_vest.png')
        # B rejoint
        B.evaluate("()=>ecranCoop()"); B.wait_for_timeout(800); B.click('#cJoin'); B.wait_for_timeout(300); B.fill('#cCode', idc); B.click('#cOk'); B.wait_for_timeout(2000)
        print('B dans le club', B.evaluate("()=>[COOP, C.club, C.coop.membres.map(m=>m.pseudo)]"))
        # A joue la 1re mi-temps
        A.evaluate("()=>{fermerModal(); hub('vestiaire')}"); A.wait_for_timeout(600); A.click('#bJouer'); A.wait_for_timeout(1500)
        ok = jouer_jusqua(A, "()=>!S && !!document.querySelector('#mPasse')"); print('mi-temps atteinte', ok); A.wait_for_timeout(1200)
        A.screenshot(path='/tmp/audit/coop_mitemps.png'); A.click('#mPasse'); A.wait_for_timeout(800)
        relais = A.evaluate("()=>C.coop.relais && C.coop.relais.score"); print('relais', relais)
        # B voit l'invitation et joue la 2e
        B.evaluate("()=>{SOCIAL_T=0; quitterCoop(); hub('amis')}"); B.wait_for_timeout(2000); B.screenshot(path='/tmp/audit/coop_B_amis.png', full_page=True)
        B.click('[data-coopj]'); B.wait_for_timeout(2000); B.screenshot(path='/tmp/audit/coop_B_vest.png')
        B.click('#bJouer'); B.wait_for_timeout(2500); B.screenshot(path='/tmp/audit/coop_B_reprise.png')
        print('reprise', B.evaluate("()=>S && [S.tf, S.score.p, S.score.ia]"))
        ok = jouer_jusqua(B, "()=>!!document.querySelector('.fin-match, #bFinOk, .recomp')"); print('fin', ok)
        B.screenshot(path='/tmp/audit/coop_fin.png')
        fo = B.query_selector('#bFinOk') or B.query_selector('.recomp'); fo.click(); B.wait_for_timeout(1500)
        print('journée coop chez B', B.evaluate("()=>[C.journee, C.coop.relais]"), 'prime B', B.evaluate("()=>profil().bonusSolo"))
        # B revient à son solo : prime versée
        B.evaluate("()=>{quitterCoop(); hub('vestiaire')}"); B.wait_for_timeout(800)
        print('solo B', B.evaluate("()=>[C.club, C.pieces, C.cartes.length]")); B.screenshot(path='/tmp/audit/coop_prime.png')
        # A recharge : relais effacé, journée avancée, sa prime l'attend
        A.evaluate(f"()=>entrerCoop('{idc}')"); A.wait_for_timeout(2000)
        print('A après', A.evaluate("()=>[C.journee, C.coop.relais, profil().bonusSolo]"), 'solo A intact', A.evaluate("()=>{const s=charger(); return [s.club, s.coop===undefined]}"))
        print('erreurs', errs)
finally:
    srv.kill()
sys.exit(1 if errs else 0)
