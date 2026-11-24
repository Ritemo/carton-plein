// Mesure : à quelle fréquence le meilleur coup diffère des « 4 plus fortes cartes » ?
const fs=require('fs');
eval(require('./moteur.js')+`
let tot=0,diff=0,avecConsigne=0,couleur=0,carton=0;
nouvelleCarriere('amiens');
for(let k=0;k<400;k++){
  nouveauMatch(prochainMatch(),true);
  while(S.phase!=='fin'){
    if(S.type==='penalty'){ finTempsFort('tirAdverse',null,{marque:Math.random()<.66}); }
    else {
      const att=enAttaque(), utiles=S.main.filter(c=>TYPES[c.t].att===att);
      const brut=utiles.slice().sort((a,b)=>b.val-a.val).slice(0,maxJouees()).map(c=>c.id).sort().join();
      const b=meilleurCoup(); const ids=b.sel.map(c=>c.id).sort().join();
      tot++; if(ids!==brut) diff++;
      const r=calcul(b.sel); if(r.consignes&&r.consignes.length) avecConsigne++; if(r.couleur) { couleur++; if(r.couleur.n===4) carton++; }
      const t=issue(r); finTempsFort(t,r,(t==='occasion'||t==='tirAdverse')?{marque:Math.random()<2/3}:null);
      if(typeof activerConsignes==='function') activerConsignes(b.sel);
      retirerJouees(b.sel);
    }
    S.tf++; piocher(PIOCHE_TF); preparerTF();
  }
}
console.log('temps forts',tot,'| coup ≠ 4 plus fortes :',(diff/tot*100).toFixed(0)+'%','| avec consigne',(avecConsigne/tot*100).toFixed(0)+'%','| bonus couleur',(couleur/tot*100).toFixed(0)+'%','dont carton plein',(carton/tot*100).toFixed(0)+'%');
`);
