const fs=require('fs');
eval(require('./moteur.js')+`
function jouerMatchAuto(skill,m){
 nouveauMatch(m,true);
 while(S.phase!=='fin'){
  if(S.type==='penalty'){ const g=S.main.find(c=>c.t==='gardien'); let p=1/3; if(g&&Math.random()<.5){retirerJouees([g]);p=2/3;} const marque=Math.random()>p; finTempsFort('tirAdverse',null,{marque}); }
  else {
   let sel=meilleurCoup().sel;
   if(Math.random()>skill){ const att=enAttaque(); const m=S.main.filter(c=>TYPES[c.t].att===att); sel=melanger(m).slice(0,1+rnd(Math.min(maxJouees(),m.length||1))); }
   const r=calcul(sel); const t=issue(r); let tir=null;
   if(t==='occasion'||t==='tirAdverse') tir={marque:Math.random()<2/3};
   finTempsFort(t,r,tir); retirerJouees(sel); activerConsignes(sel);
  }
  S.tf++; piocher(PIOCHE_TF); preparerTF();
 }
 return [S.score.p,S.score.ia];
}
function carriere(skill,saisons,club){
 nouvelleCarriere(club||'amiens'); const res=[];
 for(let s=0;s<saisons;s++){
  let w=0,d=0,l=0; const div=C.div; const cup={nat:0,eur:0,eurk:null,natw:0,eurw:0};
  let m;
  while((m=prochainMatch())){
   const dl=dilemmeDuJour(); if(dl) resoudreDilemme(dl, Math.random()<.5?'a':'b');
   const b=C.boutique; if(b.star&&C.stars.length<MAX_STARS){const st=STARS.find(x=>x.id===b.star); if(C.pieces>=PRIX_STAR[st.r]){C.pieces-=PRIX_STAR[st.r];C.stars.push(b.star);}}
   { const L=fichesOuvertes().sort((x,y)=>(C.niveaux[x.id]||1)-(C.niveaux[y.id]||1)); for(const k of L.slice(0,2)){ const p=prixNiveau(C.niveaux[k.id]||1); if(C.pieces>=p+40){C.pieces-=p; monterFiche(k.id);} } }
   // formation : promouvoir les jeunes prêts à potentiel >=3, vendre les autres
   C.formation.jeunes.filter(j=>j.prog>=100).forEach(j=>{ if(j.pot>=3) promouvoir(j.id); else vendreJeune(j.id); });
   if(CENTRE[C.formation.niveau].prix && C.pieces>CENTRE[C.formation.niveau].prix+100) agrandirCentre();
   while(C.pieces>=40){ const c=C.cartes.filter(c=>c.niv<RARETES[c.r].max).sort((x,y)=>valeurCarte(y)-valeurCarte(x))[0]; if(!c)break; const cout=RARETES[c.r].prix*c.niv; if(C.pieces<cout)break; C.pieces-=cout; c.niv++; }
   if(C.mercato&&fenetreMercato()){ const o=C.mercato.liste.filter(x=>x.q>=3&&C.pieces>=x.prix+40).sort((x,y)=>y.q-x.q)[0]; if(o) recruter(o.id); }
   const [a,bb]=jouerMatchAuto(skill,m);
   let tab=null; if(m.comp!=='ligue'&&a===bb){ tab=nouvelleSeance(); let moi=true; while(!tab.fini){ tirSeance(tab,moi,pick(['G','C','D'])); moi=!moi; } }
   if(m.comp==='ligue'){ if(a>bb)w++;else if(a<bb)l++;else d++; }
   const bl=bilanMatch(tab);
   if(m.comp==='nat'){cup.nat++; if(bl.coupe.gagne)cup.natw=1;}
   if(m.comp==='eur'){cup.eur++; cup.eurk=m.k; if(bl.coupe.gagne)cup.eurw=1;}
   const rec=bl.recompenses; if(rec.length){ const pref=rec.find(o=>o.k==='star')||rec.find(o=>o.k==='fiche')||rec.find(o=>o.k==='niveau')||rec[0]; appliquerRecompense(pref);}
  }
  const rang=rangDe(C.club); const fs2=finSaison();
  res.push({s:s+1,div,w,d,l,rang,issue:fs2.issue,cup,cartes:C.cartes.length});
 }
 return res;
}
`);
const N=+process.argv[2]||200, SA=+process.argv[3]||6;
for(const skill of [1,0.75]){
 const agg={};
 for(let k=0;k<N;k++){ carriere(skill,SA).forEach(r=>{const key='S'+r.s; const a=agg[key]=agg[key]||{n:0,w:0,d:0,l:0,div:{},natw:0,natr:0,eur:0,eurr:0,eurw:0,cartes:0}; a.n++;a.w+=r.w;a.d+=r.d;a.l+=r.l;a.div[r.div]=(a.div[r.div]||0)+1;a.natw+=r.cup.natw;a.natr+=r.cup.nat; if(r.cup.eurk){a.eur++;a.eurr+=r.cup.eur;a.eurw+=r.cup.eurw;} a.cartes+=r.cartes;}); }
 console.log('skill',skill);
 for(const [k,a] of Object.entries(agg)){ const m=a.w+a.d+a.l; console.log(k,'V/N/D',(a.w/m*100).toFixed(0),(a.d/m*100).toFixed(0),(a.l/m*100).toFixed(0),'div',JSON.stringify(a.div),'coupeNat gagnée',(a.natw/a.n*100).toFixed(0)+'%','matchs nat',(a.natr/a.n).toFixed(1),'| Europe',a.eur,'matchs',(a.eurr/(a.eur||1)).toFixed(1),'gagnée',a.eurw,'| cartes',(a.cartes/a.n).toFixed(0)); }
}
