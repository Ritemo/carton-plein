# Robot : deux téléphones et le faux serveur (vrai Code.gs). Amis, messages, ombre, défi, match en direct.
import pathlib, subprocess, sys, time, json
from playwright.sync_api import sync_playwright
RACINE = pathlib.Path(__file__).resolve().parents[2]
F = RACINE.joinpath('docs', 'index.html').as_uri()
PORT = 8799; URL = f'http://localhost:{PORT}'
srv = subprocess.Popen(['node', str(RACINE / 'tests' / 'serveur.js'), str(PORT)], stdout=subprocess.PIPE); time.sleep(0.8)
errs = []
# joue automatiquement l'étape en cours (cartes, tir, plongeon, suite) ; renvoie la phase
JOUE = """() => {
  if (!S) return 'aucun';
  const ph = S.phase;
  if (document.getElementById('ecran').style.display === 'flex') { const b = document.querySelector('#mGo,#eA'); if (b) b.click(); return 'modal'; }
  if (ph === 'choix') { const b = meilleurCoup(false); S.sel = b.sel.length ? b.sel : S.main.filter(c => TYPES[c.t].att === enAttaque()).slice(0, 1); if (!S.sel.length) { jouer(true); return ph; } jouer(); return ph; }
  if (ph === 'occasion') { if (!S.tirEtat || !S.tirEtat.zone) { choisirZone('BG'); return ph; } JAUGE.pos = 0.5; frapper(); return ph; }
  if (ph === 'tirAdverse' || ph === 'penalty') { if (!S.tirEtat || !S.tirEtat.col) { plonger('G'); return ph; } JAUGE.pos = 0.5; plongeon(); return ph; }
  const s = document.getElementById('bSuite'); if (s && ['but','rate','stoppe','butAdverse','tirRes'].includes(ph)) { s.click(); return ph; }
  return ph;
}"""
def telephone(b, nom, club):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}); pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(nom + ': ' + str(e)))
    pg.goto(F); pg.evaluate(f"()=>{{localStorage.clear();localStorage.setItem('carton-plein-tuto','1');localStorage.setItem('carton-plein-cloud','{URL}')}}"); pg.reload(); pg.wait_for_timeout(400)
    pg.evaluate(f"()=>{{nouvelleCarriere('{club}'); const p=profil(); p.pseudo='{nom}'; majProfil(p); sauver(); syncEnvoyer(); hub('vestiaire')}}"); pg.wait_for_timeout(600)
    return pg
def jusqua_fin(pages, limite=400):
    for _ in range(limite):
        fini = True
        for pg in pages:
            if pg.evaluate("()=>!!S && !document.querySelector('.fin-match')"): fini = False; pg.evaluate(JOUE)
        if fini: return True
        pages[0].wait_for_timeout(250)
    return False
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        A = telephone(b, 'Papa', 'amiens'); B = telephone(b, 'Priam', 'caen')
        ca, cb = A.evaluate("()=>profil().code"), B.evaluate("()=>profil().code")
        # amis
        A.evaluate("()=>hub('amis')"); A.wait_for_timeout(800); A.fill('#sCode', cb); A.click('#sAjout'); A.wait_for_timeout(1200)
        B.evaluate("()=>hub('amis')"); B.wait_for_timeout(800); B.fill('#sCode', ca); B.click('#sAjout'); B.wait_for_timeout(1200)
        print('amis', A.evaluate("()=>profil().amis.map(a=>a.pseudo)"), B.evaluate("()=>profil().amis.map(a=>a.pseudo)"))
        A.screenshot(path='/tmp/audit/amis.png', full_page=True)
        # message
        A.click(f'[data-msg="{cb}"]'); A.wait_for_timeout(300); A.click('[data-r="0"]'); A.wait_for_timeout(1000); A.click('#mFer'); A.wait_for_timeout(800)
        B.evaluate("()=>{SOCIAL_T=0; hub('amis')}"); B.wait_for_timeout(1500)
        print('pastille chez Priam', B.evaluate("()=>nonLus()"))
        # ombre
        A.click(f'[data-ombre="{cb}"]'); A.wait_for_timeout(1500); A.screenshot(path='/tmp/audit/ombre_debut.png')
        print('ombre lancée', A.evaluate("()=>S && S.comp"), A.evaluate("()=>S && S.style"))
        print('ombre finie', jusqua_fin([A])); A.screenshot(path='/tmp/audit/ombre_fin.png')
        A.click('#bFinOk'); A.wait_for_timeout(1200)
        # défi
        A.click('#sDefiGo'); A.wait_for_timeout(800); print('défi fini', jusqua_fin([A])); A.screenshot(path='/tmp/audit/defi_fin.png')
        A.click('#bFinOk'); A.wait_for_timeout(1800); A.screenshot(path='/tmp/audit/amis2.png', full_page=True)
        # direct : A invite B
        A.click(f'[data-direct="{cb}"]'); A.wait_for_timeout(1200); A.screenshot(path='/tmp/audit/direct_attente.png')
        B.evaluate("()=>{SOCIAL_T=0; hub('amis')}"); B.wait_for_timeout(1500)
        B.click('[data-salon]'); B.wait_for_timeout(2500)
        print('direct lancé', A.evaluate("()=>S && S.comp"), B.evaluate("()=>S && S.comp"))
        # suit le match en parallèle, en vérifiant que les deux scores restent miroir
        vus = set()
        for _ in range(500):
            for nom, pg in (('A', A), ('B', B)):
                ph = pg.evaluate("()=>S&&S.phase")
                if ph in ('attente', 'attenteTir', 'occasion', 'tirAdverse', 'tirRes') and (nom, ph) not in vus:
                    vus.add((nom, ph)); pg.screenshot(path=f'/tmp/audit/direct_{nom}_{ph}.png')
            ea, eb = A.evaluate("()=>!!S"), B.evaluate("()=>!!S")
            if not ea and not eb: break
            sa = A.evaluate("()=>S&&[S.score.p,S.score.ia,S.tf,S.phase]"); sb = B.evaluate("()=>S&&[S.score.p,S.score.ia,S.tf,S.phase]")
            if sa and sb and sa[2] == sb[2] and sa[3] in ('tirRes','but','rate','stoppe','butAdverse') and sb[3] in ('tirRes','but','rate','stoppe','butAdverse'):
                if not (sa[0] == sb[1] and sa[1] == sb[0]): print('DÉSACCORD', sa, sb); errs.append('scores différents')
                if _ % 7 == 0: A.screenshot(path='/tmp/audit/direct_A.png'); B.screenshot(path='/tmp/audit/direct_B.png')
            if ea: A.evaluate(JOUE)
            if eb: B.evaluate(JOUE)
            A.wait_for_timeout(300)
        fa = A.inner_text('.score-fin') if A.query_selector('.score-fin') else '?'; fb = B.inner_text('.score-fin') if B.query_selector('.score-fin') else '?'
        print('fin direct A', fa.replace('\n',' '), '| B', fb.replace('\n',' '))
        A.screenshot(path='/tmp/audit/direct_fin.png')
        A.click('#bFinOk'); A.wait_for_timeout(1500); A.evaluate("()=>{SOCIAL_T=0; hub('amis')}"); A.wait_for_timeout(1500)
        print('fil', A.evaluate("()=>SOCIAL.fil.map(x=>x.pseudo+' '+x.txt)"))
        print('erreurs', errs)
finally:
    srv.kill()
sys.exit(1 if errs else 0)
