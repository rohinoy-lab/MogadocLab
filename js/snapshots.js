/* ═══════════════════════════════════════════════════════
   Snapshots — MogadocLab
   ═══════════════════════════════════════════════════════ */

// FEATURE 4 — SNAPSHOT / VIEW BOOKMARKS
// ═══════════════════════════════════════════════════════════
const snapshots=[];
function takeSnapshot(){
  if(!molecule)return notify('No structure loaded','error');
  const thumb=canvas.toDataURL('image/jpeg',0.55);
  snapshots.push({rotX,rotY,zoom,panX,panY,viewMode,colorScheme,thumb,label:molecule.name});
  renderSnapshotStrip();
  notify('View snapshot saved · click thumbnail to restore','success');
}
function renderSnapshotStrip(){
  const strip=document.getElementById('snapshotStrip');
  strip.innerHTML=snapshots.map((s,i)=>`
    <img class="snap-thumb" src="${s.thumb}" title="Snap ${i+1}: ${s.label}" onclick="restoreSnapshot(${i})">
  `).join('');
}
function restoreSnapshot(i){
  const s=snapshots[i];
  rotX=s.rotX; rotY=s.rotY; zoom=s.zoom; panX=s.panX; panY=s.panY;
  if(s.viewMode!==viewMode)setViewMode(s.viewMode);
  if(s.colorScheme!==colorScheme)setColorScheme(s.colorScheme);
  render(); notify(`Restored snapshot ${i+1}`,'info');
}

// ═══════════════════════════════════════════════════════════
