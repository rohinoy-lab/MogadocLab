/* ═══════════════════════════════════════════════════════
   Stats — MogadocLab
   ═══════════════════════════════════════════════════════ */

// STATS & LEGEND
// ═══════════════════════════════════════════════════════════
function updateStats() {
  if(!molecule)return;
  const counts={};let mw=0;
  molecule.atoms.forEach(a=>{const s=a.symbol.charAt(0).toUpperCase()+a.symbol.slice(1).toLowerCase();counts[s]=(counts[s]||0)+1;mw+=getElement(s).mass;});
  document.getElementById('statAtoms').textContent=molecule.atoms.length;
  document.getElementById('statBonds').textContent=molecule.bonds.length;
  document.getElementById('statElems').textContent=Object.keys(counts).length;
  document.getElementById('statMW').textContent=mw.toFixed(1);
  const ord=['C','H',...Object.keys(counts).filter(e=>e!=='C'&&e!=='H').sort()];
  const formula=ord.filter(e=>counts[e]).map(e=>e+(counts[e]>1?counts[e]:'')).join('');
  document.getElementById('statFormula').textContent=formula||'—';
  const hf=document.getElementById('headerFormula');
  hf.textContent=formula||'';hf.classList.toggle('visible',!!formula);
  renderImportDetails(lastImportMeta);
}
function updateLegend() {
  if(!molecule)return;
  const counts={};
  molecule.atoms.forEach(a=>{const s=a.symbol.charAt(0).toUpperCase()+a.symbol.slice(1).toLowerCase();counts[s]=(counts[s]||0)+1;});
  document.getElementById('atomLegend').innerHTML=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([sym,cnt])=>{
    const el=getElement(sym);
    return`<div class="legend-item"><div class="legend-dot" style="background:${el.color};box-shadow:0 0 5px ${el.color}80;"></div><span class="legend-sym">${sym}</span><span class="legend-name">${el.name}</span><span class="legend-count">×${cnt}</span></div>`;
  }).join('');
}
function updateCanvasInfo() {
  if(!molecule||!showInfo)return;
  const counts={};molecule.atoms.forEach(a=>{const s=a.symbol.charAt(0).toUpperCase()+a.symbol.slice(1).toLowerCase();counts[s]=(counts[s]||0)+1;});
  document.getElementById('canvasInfo').innerHTML=`<div style="color:var(--accent);margin-bottom:4px;font-weight:500;">${molecule.name}</div><div>Atoms: ${molecule.atoms.length}</div><div>Bonds: ${molecule.bonds.length}</div><div>Elements: ${Object.keys(counts).join(', ')}</div><div>Mode: ${viewMode}</div><div>Import: ${(lastImportMeta.source||'Unknown')} · ${(lastImportMeta.format||'—').toUpperCase()}</div>`;
}

// ═══════════════════════════════════════════════════════════
