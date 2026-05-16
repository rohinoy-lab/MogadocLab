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

// Refit molecule (or trajectory frames) to current canvas dimensions.
// Recomputes the scale so the molecule fills ~64% of the shorter canvas
// axis. Used after sidebar/editor/database panel toggles so the molecule
// adapts to the new canvas size instead of drifting at its old scale.
// Re-center atoms around their mass-weighted COM. Floating-point drift
// across many edits/transitions can move the COM off origin; this resets it.
function recenterMolecule(atoms){
  if(!atoms?.length) return;
  let cx=0,cy=0,cz=0,M=0;
  atoms.forEach(a=>{
    const m = (typeof getElement==='function' ? getElement(a.symbol).mass : 1) || 1;
    cx+=a.x*m; cy+=a.y*m; cz+=a.z*m; M+=m;
  });
  if(M<=0) return;
  cx/=M; cy/=M; cz/=M;
  atoms.forEach(a=>{a.x-=cx;a.y-=cy;a.z-=cz;});
}
function refitMoleculeToCanvas(){
  const minDim = Math.min(canvas?.clientWidth || 800, canvas?.clientHeight || 600);
  // Trajectory mode: all frames share trajGlobalScale; refit and propagate.
  if(typeof trajectoryFrames !== 'undefined' && trajectoryFrames.length){
    let globalMaxR = 0;
    trajectoryFrames.forEach(f => {
      recenterMolecule(f.atoms);
      f.atoms.forEach(a => {
        const r = Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z);
        if(r > globalMaxR) globalMaxR = r;
      });
    });
    trajGlobalScale = globalMaxR > 0 ? (minDim * 0.32) / globalMaxR : 60;
    trajectoryFrames.forEach(f => { f.scale = trajGlobalScale; });
    if(molecule) molecule.scale = trajGlobalScale;
    return;
  }
  if(!molecule || !molecule.atoms || !molecule.atoms.length) return;
  recenterMolecule(molecule.atoms);
  let maxR = 0;
  molecule.atoms.forEach(a => {
    const r = Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z);
    if(r > maxR) maxR = r;
  });
  molecule.scale = maxR > 0 ? (minDim * 0.32) / maxR : 60;
}

function loadMolecule(name, mol) {
  if(!mol?.atoms?.length) throw new Error('No atoms were parsed from the input');
  hideCanvasLoading();
  if(typeof clearTrajectory==='function' && trajectoryFrames?.length){
    clearTrajectory();
  }
  // Mass-weighted center-of-mass — for asymmetric molecules with heavy
  // atoms on one side the geometric mean would put the rotation pivot
  // away from the visual centroid and the molecule would wobble during
  // auto-rotate. Use mass weights so the pivot is the actual COM.
  let cx=0,cy=0,cz=0, totalMass=0;
  mol.atoms.forEach(a=>{
    const m = (typeof getElement==='function' ? getElement(a.symbol).mass : 1) || 1;
    cx += a.x*m; cy += a.y*m; cz += a.z*m; totalMass += m;
  });
  if(totalMass > 0){ cx/=totalMass; cy/=totalMass; cz/=totalMass; }
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
