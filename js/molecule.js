/* ═══════════════════════════════════════════════════════
   Molecule — MogadocLab
   ═══════════════════════════════════════════════════════ */

// LOAD
// ═══════════════════════════════════════════════════════════
function loadStructureText(inputName, text, options = {}) {
  const rawText = String(text ?? '');
  if (!rawText.trim()) throw new Error('The imported file is empty');
  const displayName = options.displayName || String(inputName || 'Imported Molecule').replace(/\.[^.]+$/, '') || 'Imported Molecule';
  const importMeta = { inputName, importedAt: new Date().toISOString(), ...(options.meta || {}) };
  const fmt = detectFormat(inputName, rawText);
  if (fmt === 'xyz') {
    const frames = parseMultiFrameXYZ(rawText, importMeta);
    if (frames.length > 1) {
      loadTrajectory(displayName, frames);
      return { kind: 'trajectory', frameCount: frames.length };
    }
  }
  const mol = parseMolecule(inputName, rawText);
  loadMolecule(displayName, mol);
  return { kind: 'molecule', atomCount: mol.atoms.length };
}

function loadMolecule(name, mol) {
  if(!mol?.atoms?.length) throw new Error('No atoms were parsed from the input');
  hideCanvasLoading();
  if(typeof clearTrajectory==='function' && trajectoryFrames?.length){
    clearTrajectory();
  }
  let cx=0,cy=0,cz=0;
  mol.atoms.forEach(a=>{cx+=a.x;cy+=a.y;cz+=a.z;});
  cx/=mol.atoms.length;cy/=mol.atoms.length;cz/=mol.atoms.length;
  mol.atoms.forEach(a=>{a.x-=cx;a.y-=cy;a.z-=cz;});
  let maxR=0;mol.atoms.forEach(a=>{const r=Math.sqrt(a.x*a.x+a.y*a.y+a.z*a.z);if(r>maxR)maxR=r;});
  const minCanvasDim=Math.min(canvas?.clientWidth||800, canvas?.clientHeight||600);
  mol.scale=maxR>0?(minCanvasDim*0.32)/maxR:60; mol.name=name;
  lastImportMeta={...(mol.meta||{}), source:mol.meta?.source||'Imported structure', format:mol.meta?.format||'unknown'};
  molecule=mol; panX=0;panY=0;zoom=1;
  if(typeof resetSelectionState==='function') resetSelectionState();
  document.getElementById('emptyState').style.display='none';
  const mb=document.getElementById('moleculeName');
  mb.textContent=name;mb.classList.add('loaded');
  renderImportDetails(lastImportMeta);
  updateStats();updateLegend();updateCanvasInfo();render();
  if(document.getElementById('editorPanel') && !document.getElementById('editorPanel').classList.contains('hidden')){ try{ loadEditorFromMolecule(); }catch(_){} }
  saveAppState();
  notify(`Loaded "${name}" — ${mol.atoms.length} atoms, ${mol.bonds.length} bonds`,'success');
}
function handleFileLoad(evt) {
  const file=evt.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try {
      loadStructureText(file.name, e.target.result, { displayName: file.name.replace(/\.[^.]+$/,'') });
    } catch(err) {
      notify('Import failed: '+err.message,'error');
    }
    evt.target.value='';
  };
  reader.readAsText(file);
}

// ═══════════════════════════════════════════════════════════
