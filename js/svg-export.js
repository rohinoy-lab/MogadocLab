/* ═══════════════════════════════════════════════════════
   Svg Export — MogadocLab
   ═══════════════════════════════════════════════════════ */

// SVG EXPORT
// ═══════════════════════════════════════════════════════════
function generateSVG(){
  if(!molecule||!molecule.atoms.length) return null;
  const W=800, H=600, cx=W/2, cy=H/2, scale=molecule.scale*zoom;
  const M=mat3Mul(mat3RotY(rotY),mat3RotX(rotX));
  molecule.atoms.forEach(a=>{a._proj=mat3Vec(M,[a.x,a.y,a.z]);});
  let maxZ=0; molecule.atoms.forEach(a=>{if(Math.abs(a._proj[2])>maxZ)maxZ=Math.abs(a._proj[2]);});
  const atomScale=parseFloat(document.getElementById('atomScale').value);
  const sorted=[...molecule.atoms].sort((a,b)=>a._proj[2]-b._proj[2]);
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="background:#fff">\n`;
  svg+=`<defs><filter id="glow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>\n`;
  // Bonds
  molecule.bonds.forEach(bond=>{
    const ai=molecule.atoms[bond.a],aj=molecule.atoms[bond.b]; if(!ai||!aj)return;
    const fov=500;
    const di=fov/(fov+ai._proj[2]*scale+400), dj=fov/(fov+aj._proj[2]*scale+400);
    const x1=cx+ai._proj[0]*scale*di, y1=cy-ai._proj[1]*scale*di;
    const x2=cx+aj._proj[0]*scale*dj, y2=cy-aj._proj[1]*scale*dj;
    svg+=`  <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#667" stroke-width="2" stroke-linecap="round"/>\n`;
  });
  // Atoms
  sorted.forEach(a=>{
    const el=getElement(a.symbol);
    const fov=500, d=fov/(fov+a._proj[2]*scale+400);
    const sx=cx+a._proj[0]*scale*d, sy=cy-a._proj[1]*scale*d;
    const r=Math.max(4,el.r*30*atomScale*d);
    svg+=`  <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${r.toFixed(1)}" fill="${getAtomDisplayColor(a)}" stroke="#fff" stroke-width="0.5" filter="url(#glow)"/>\n`;
    if(r>6) svg+=`  <text x="${sx.toFixed(1)}" y="${(sy+r*0.32).toFixed(1)}" text-anchor="middle" font-family="monospace" font-size="${Math.max(8,r*0.7).toFixed(0)}" font-weight="bold" fill="#fff">${a.symbol}</text>\n`;
  });
  svg+=`</svg>`;
  return svg;
}
function exportSVG(){
  if(!molecule) return notify('No structure loaded','error');
  const svg=generateSVG(); if(!svg) return;
  download(svg,(molecule.name||'molecule')+'.svg','image/svg+xml');
  notify('SVG exported','success');
}
function copySVGToClipboard(){
  if(!molecule) return notify('No structure loaded','error');
  const svg=generateSVG(); if(!svg) return;
  navigator.clipboard.writeText(svg).then(()=>notify('SVG copied to clipboard','success')).catch(()=>notify('Clipboard copy failed','error'));
}

// ═══════════════════════════════════════════════════════════
