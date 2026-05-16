/* ═══════════════════════════════════════════════════════
   Atom List — MogadocLab
   ═══════════════════════════════════════════════════════ */

// FEATURE 3 — ATOM LIST PANEL with focus / isolate
// ═══════════════════════════════════════════════════════════
let showAtomList=false, focusedAtoms=null, highlightedAtom=null, selectedAtom=null, secondarySelectedAtom=null, selectedBond=null, showInspector=true, hiddenAtoms=new Set();

function toggleAtomList(){
  showAtomList=!showAtomList;
  document.getElementById('btnAtomList').classList.toggle('active',showAtomList);
  document.getElementById('atomListPanel').classList.toggle('visible',showAtomList);
  if(showAtomList&&molecule)buildAtomList('');
}
function toggleInspector(force){
  showInspector = typeof force === 'boolean' ? force : !showInspector;
  document.getElementById('btnInspector')?.classList.toggle('active',showInspector);
  document.getElementById('atomInspectorPanel')?.classList.toggle('visible',showInspector);
  if(showInspector) updateAtomInspector();
}
function buildAtomList(filter){
  const list=document.getElementById('alpList');
  if(!molecule){list.innerHTML='<div style="padding:10px;color:var(--text-muted);font-size:10px;">No structure loaded</div>';return;}
  const rows=molecule.atoms.filter(a=>{
    if(hiddenAtoms.has(a.idx)) return false;
    if(!filter)return true;
    return a.symbol.toLowerCase().includes(filter.toLowerCase())||String(a.idx+1).includes(filter);
  });
  list.innerHTML=rows.map(a=>{
    const el=getElement(a.symbol);
    const isHL=highlightedAtom===a.idx;
    const isFocus=focusedAtoms&&focusedAtoms.has(a.idx);
    const isSelected=selectedAtom===a.idx;
    return `<div class="alp-row${isHL||isFocus||isSelected?' highlighted':''}"
      onclick="selectAtom(${a.idx})"
      ondblclick="focusAtom(${a.idx})"
      onmouseenter="hoverAtomList(${a.idx})"
      onmouseleave="hoverAtomList(null)">
      <div class="alp-dot" style="background:${el.color};box-shadow:0 0 4px ${el.color}80;"></div>
      <span class="alp-sym">${a.symbol}</span>
      <span class="alp-idx">#${a.idx+1}</span>
      <span class="alp-coords">${a.x.toFixed(2)}, ${a.y.toFixed(2)}, ${a.z.toFixed(2)}</span>
    </div>`;
  }).join('');
}
function filterAtomList(){buildAtomList(document.getElementById('alpSearch').value);}
function hoverAtomList(idx){highlightedAtom=idx;render();}
function isAtomHidden(idx){ return hiddenAtoms.has(idx); }
function isAtomVisible(idx){ return !hiddenAtoms.has(idx); }
function getAtomNeighbors(idx){
  if(!molecule) return [];
  return molecule.bonds
    .filter(b=>(b.a===idx||b.b===idx) && isAtomVisible(b.a) && isAtomVisible(b.b))
    .map(b=>{
      const otherIdx=b.a===idx?b.b:b.a;
      const atom=molecule.atoms[otherIdx];
      return {idx:otherIdx, atom, bond:b, dist:calcDistance(molecule.atoms[idx], atom)};
    })
    .filter(item=>!!item.atom)
    .sort((a,b)=>a.dist-b.dist);
}
function selectAtom(idx, opts={}){
  if(!molecule||!molecule.atoms[idx]) return;
  const {notifyUser=false, openInspector=true}=opts;
  if(isAtomHidden(idx)) return;
  if(selectedAtom!==null && selectedAtom!==idx){
    secondarySelectedAtom=selectedAtom;
  } else if(selectedBond!==null){
    const bond=molecule.bonds[selectedBond];
    secondarySelectedAtom=bond ? bond.a : secondarySelectedAtom;
  }
  selectedAtom=idx;
  selectedBond=null;
  highlightedAtom=idx;
  if(openInspector) toggleInspector(true);
  if(showAtomList) buildAtomList(document.getElementById('alpSearch').value);
  updateAtomInspector();
  updateBondAssignHint?.();
  render();
  if(notifyUser){
    const a=molecule.atoms[idx];
    notify(`Selected ${a.symbol}#${idx+1}`,'info');
  }
}
function selectBond(idx, opts={}){
  if(!molecule||!molecule.bonds[idx]) return;
  const {notifyUser=false, openInspector=true}=opts;
  const bond=molecule.bonds[idx];
  if(isAtomHidden(bond.a)||isAtomHidden(bond.b)) return;
  selectedBond=idx;
  selectedAtom=null;
  secondarySelectedAtom=null;
  highlightedAtom=null;
  if(openInspector) toggleInspector(true);
  if(showAtomList) buildAtomList(document.getElementById('alpSearch').value);
  updateAtomInspector();
  updateBondAssignHint?.();
  render();
  if(notifyUser){
    const a=molecule.atoms[bond.a], b=molecule.atoms[bond.b];
    notify(`Selected bond ${a.symbol}#${bond.a+1}–${b.symbol}#${bond.b+1}`,'info');
  }
}
function getBondMidpoint(idx){
  const bond=molecule?.bonds?.[idx];
  if(!bond) return null;
  const a=molecule.atoms[bond.a], b=molecule.atoms[bond.b];
  return {x:(a.x+b.x)/2, y:(a.y+b.y)/2, z:(a.z+b.z)/2, a, b};
}
function getSelectionFragmentSet(){
  if(!molecule) return new Set();
  const seed =
    selectedAtom!==null ? selectedAtom :
    selectedBond!==null ? molecule.bonds[selectedBond]?.a :
    null;
  if(seed===null||seed===undefined||isAtomHidden(seed)) return new Set();
  const seen=new Set([seed]);
  const queue=[seed];
  while(queue.length){
    const cur=queue.shift();
    molecule.bonds.forEach(b=>{
      if(isAtomHidden(b.a)||isAtomHidden(b.b)) return;
      const next = b.a===cur ? b.b : b.b===cur ? b.a : null;
      if(next!==null && !seen.has(next)){
        seen.add(next);
        queue.push(next);
      }
    });
  }
  return seen;
}
function focusAtom(idx){
  if(!molecule)return;
  selectAtom(idx,{openInspector:true});
  const a=molecule.atoms[idx];
  panX=0; panY=0;
  const connected=new Set([idx]);
  molecule.bonds.forEach(b=>{if(b.a===idx)connected.add(b.b);if(b.b===idx)connected.add(b.a);});
  focusedAtoms=connected;
  zoom=2.8;
  document.getElementById('focusBar').classList.add('visible');
  document.getElementById('focusLabel').textContent=`${a.symbol}#${idx+1} · ${getElement(a.symbol).name}`;
  if(showAtomList)buildAtomList(document.getElementById('alpSearch').value);
  render(); notify(`Focused on ${a.symbol}#${idx+1}`,'info');
}
function centerCurrentSelection(){
  if(!molecule) return;
  if(selectedAtom!==null && molecule.atoms[selectedAtom]){
    const atom=molecule.atoms[selectedAtom];
    if(atom._screenX!==undefined && atom._screenY!==undefined){
      panX += canvas.width/2 - atom._screenX;
      panY += canvas.height/2 - atom._screenY;
    } else {
      panX=0; panY=0;
    }
  } else if(selectedBond!==null && molecule.bonds[selectedBond]){
    const bond=molecule.bonds[selectedBond];
    const a=molecule.atoms[bond.a], b=molecule.atoms[bond.b];
    if(a?._screenX!==undefined && b?._screenX!==undefined){
      const midX=(a._screenX+b._screenX)/2, midY=(a._screenY+b._screenY)/2;
      panX += canvas.width/2 - midX;
      panY += canvas.height/2 - midY;
    }
  } else {
    return;
  }
  render();
}
function focusCurrentSelection(){
  if(selectedAtom!==null) return focusAtom(selectedAtom);
  if(selectedBond!==null){
    const fragment=getSelectionFragmentSet();
    if(!fragment.size) return notify('Select an atom or bond first','error');
    focusedAtoms=fragment;
    zoom=2.8;
    panX=0; panY=0;
    const bond=molecule.bonds[selectedBond];
    const a=molecule.atoms[bond.a], b=molecule.atoms[bond.b];
    document.getElementById('focusBar').classList.add('visible');
    document.getElementById('focusLabel').textContent=`${a.symbol}#${bond.a+1} – ${b.symbol}#${bond.b+1} fragment`;
    render();
    return notify('Focused on connected fragment','info');
  }
  return notify('Select an atom or bond first','error');
}
function selectNeighborAtom(direction){
  if(selectedAtom===null) return notify('Select an atom first','error');
  const neighbors=getAtomNeighbors(selectedAtom);
  if(!neighbors.length) return notify('Selected atom has no bonded neighbors','info');
  const next = direction < 0 ? neighbors[neighbors.length-1] : neighbors[0];
  selectAtom(next.idx,{notifyUser:true});
  centerCurrentSelection();
}
function selectSelectionFragment(){
  const fragment=getSelectionFragmentSet();
  if(!fragment.size) return notify('Select an atom or bond first','error');
  focusedAtoms=fragment;
  document.getElementById('focusBar').classList.add('visible');
  document.getElementById('focusLabel').textContent=`Fragment · ${fragment.size} atoms`;
  render();
  notify(`Selected connected fragment of ${fragment.size} atoms`,'info');
}
function hideCurrentSelection(){
  if(!molecule) return notify('No structure loaded','error');
  const targets = selectedAtom!==null
    ? new Set([selectedAtom])
    : selectedBond!==null
      ? new Set([molecule.bonds[selectedBond].a, molecule.bonds[selectedBond].b])
      : getSelectionFragmentSet();
  if(!targets.size) return notify('Select an atom or bond first','error');
  targets.forEach(idx=>hiddenAtoms.add(idx));
  const visibleCount=molecule.atoms.filter(a=>!hiddenAtoms.has(a.idx)).length;
  if(visibleCount===0){
    targets.forEach(idx=>hiddenAtoms.delete(idx));
    return notify('Cannot hide the entire structure','error');
  }
  clearFocus();
  clearSelection();
  if(showAtomList) buildAtomList(document.getElementById('alpSearch').value);
  render();
  notify(`Hidden ${targets.size} atom${targets.size!==1?'s':''}`,'success');
}
function isolateCurrentSelection(){
  if(!molecule) return notify('No structure loaded','error');
  const fragment=getSelectionFragmentSet();
  if(!fragment.size) return notify('Select an atom or bond first','error');
  hiddenAtoms = new Set(molecule.atoms.map(a=>a.idx).filter(idx=>!fragment.has(idx)));
  focusedAtoms=new Set(fragment);
  document.getElementById('focusBar').classList.add('visible');
  document.getElementById('focusLabel').textContent=`Isolated fragment · ${fragment.size} atoms`;
  if(showAtomList) buildAtomList(document.getElementById('alpSearch').value);
  render();
  notify(`Isolated ${fragment.size}-atom fragment`,'success');
}
function showAllAtoms(){
  if(!hiddenAtoms.size) return notify('All atoms are already visible','info');
  hiddenAtoms.clear();
  if(showAtomList) buildAtomList(document.getElementById('alpSearch').value);
  render();
  notify('Restored all hidden atoms','success');
}
function pickBondFromMouseEvent(e){
  if(!molecule) return null;
  const rect=canvas.getBoundingClientRect();
  const mx=(e.clientX-rect.left)*devicePixelRatio,my=(e.clientY-rect.top)*devicePixelRatio;
  let best=-1, bestD=Infinity;
  molecule.bonds.forEach((bond, idx)=>{
    if(isAtomHidden(bond.a)||isAtomHidden(bond.b)) return;
    const a=molecule.atoms[bond.a], b=molecule.atoms[bond.b];
    if(a?._screenX===undefined||b?._screenX===undefined) return;
    const dx=b._screenX-a._screenX, dy=b._screenY-a._screenY;
    const len2=dx*dx+dy*dy;
    if(len2<1) return;
    const t=Math.max(0,Math.min(1,((mx-a._screenX)*dx+(my-a._screenY)*dy)/len2));
    const px=a._screenX+t*dx, py=a._screenY+t*dy;
    const dist=Math.hypot(mx-px,my-py);
    if(dist<14 && dist<bestD){
      bestD=dist;
      best=idx;
    }
  });
  return best>=0 ? best : null;
}
function updateAtomInspector(){
  const panel=document.getElementById('atomInspectorPanel');
  const body=document.getElementById('aipBody');
  const title=document.getElementById('aipTitle');
  if(!panel||!body||!title) return;
  if(!molecule||((selectedAtom===null||!molecule.atoms[selectedAtom]) && (selectedBond===null||!molecule.bonds[selectedBond]))){
    panel.classList.add('is-empty');
    title.textContent='No atom selected';
    body.innerHTML='<div class="aip-empty">Click an atom or bond in the canvas to inspect local chemistry, fragment context, and selection actions.</div>';
    return;
  }
  panel.classList.remove('is-empty');
  if(selectedBond!==null && molecule.bonds[selectedBond]){
    const bond=molecule.bonds[selectedBond];
    const a=molecule.atoms[bond.a], b=molecule.atoms[bond.b];
    const fragment=getSelectionFragmentSet();
    const dist=calcDistance(a,b);
    const sourceLabel=bond.inferred?'Inferred':'Explicit';
    const assignmentLabel=bond.inferenceNote || (bond.inferred ? 'detected from geometry' : 'read from source connectivity');
    title.textContent=`Bond ${a.symbol}${bond.a+1} – ${b.symbol}${bond.b+1}`;
    body.innerHTML=`
      <div class="aip-grid">
        <div class="aip-stat"><span class="aip-label">Type</span><div class="aip-value">${bond.type||'covalent'}</div></div>
        <div class="aip-stat"><span class="aip-label">Order</span><div class="aip-value">${bond.order||1}</div></div>
        <div class="aip-stat"><span class="aip-label">Length</span><div class="aip-value">${dist.toFixed(3)} A</div></div>
        <div class="aip-stat"><span class="aip-label">Fragment</span><div class="aip-value">${fragment.size} atoms</div></div>
      </div>
      <div class="aip-section">
        <div class="aip-section-title">Assignment</div>
        <div class="aip-coords">Source: ${sourceLabel}<br>Rule: ${assignmentLabel}</div>
      </div>
      <div class="aip-section">
        <div class="aip-section-title">Connected atoms</div>
        <div class="aip-neighbors">
          <div class="aip-neighbor" onclick="selectAtom(${bond.a},{notifyUser:true});centerCurrentSelection()">
            <span class="aip-chip" style="background:${getElement(a.symbol).color};">${a.symbol}</span>
            <span class="aip-neighbor-main"><span class="aip-neighbor-name">${getElement(a.symbol).name} #${bond.a+1}</span><span class="aip-neighbor-meta">${a.x.toFixed(2)}, ${a.y.toFixed(2)}, ${a.z.toFixed(2)}</span></span>
            <span class="aip-neighbor-dist">endpoint</span>
          </div>
          <div class="aip-neighbor" onclick="selectAtom(${bond.b},{notifyUser:true});centerCurrentSelection()">
            <span class="aip-chip" style="background:${getElement(b.symbol).color};">${b.symbol}</span>
            <span class="aip-neighbor-main"><span class="aip-neighbor-name">${getElement(b.symbol).name} #${bond.b+1}</span><span class="aip-neighbor-meta">${b.x.toFixed(2)}, ${b.y.toFixed(2)}, ${b.z.toFixed(2)}</span></span>
            <span class="aip-neighbor-dist">endpoint</span>
          </div>
        </div>
      </div>`;
    return;
  }
  const atom=molecule.atoms[selectedAtom];
  const el=getElement(atom.symbol);
  const neighbors=getAtomNeighbors(selectedAtom);
  const bondOrders=neighbors.reduce((sum,n)=>sum+(Number(n.bond.order)||1),0);
  title.textContent=`${atom.symbol} #${selectedAtom+1}`;
  body.innerHTML=`
    <div class="aip-grid">
      <div class="aip-stat"><span class="aip-label">Element</span><div class="aip-value">${el.name}</div></div>
      <div class="aip-stat"><span class="aip-label">Atomic Mass</span><div class="aip-value">${el.mass} u</div></div>
      <div class="aip-stat"><span class="aip-label">Neighbors</span><div class="aip-value">${neighbors.length}</div></div>
      <div class="aip-stat"><span class="aip-label">Bond Order Sum</span><div class="aip-value">${bondOrders.toFixed(1)}</div></div>
    </div>
    <div class="aip-section">
      <div class="aip-section-title">Coordinates</div>
      <div class="aip-coords">x = ${atom.x.toFixed(4)} A<br>y = ${atom.y.toFixed(4)} A<br>z = ${atom.z.toFixed(4)} A</div>
    </div>
    <div class="aip-section">
      <div class="aip-section-title">Bonded Neighborhood</div>
      <div class="aip-neighbors">
        ${neighbors.length?neighbors.map(item=>{
          const otherEl=getElement(item.atom.symbol);
          const orderLabel=item.bond.type==='aromatic'||item.bond.order===1.5?'aromatic':`order ${item.bond.order||1}`;
          return `<div class="aip-neighbor" onclick="selectAtom(${item.idx},{notifyUser:true});centerCurrentSelection()">
            <span class="aip-chip" style="background:${otherEl.color};">${item.atom.symbol}</span>
            <span class="aip-neighbor-main">
              <span class="aip-neighbor-name">${otherEl.name} #${item.idx+1}</span>
              <span class="aip-neighbor-meta">${item.bond.type||'covalent'} · ${orderLabel}</span>
            </span>
            <span class="aip-neighbor-dist">${item.dist.toFixed(2)} A</span>
          </div>`;
        }).join(''):'<div class="aip-empty">No bonded neighbors were detected for this atom.</div>'}
      </div>
    </div>
    <div class="aip-section">
      <div class="aip-section-title">Import Provenance</div>
      <div class="aip-coords">Source: ${(lastImportMeta?.source||'Unknown')}<br>Format: ${String(lastImportMeta?.format||'—').toUpperCase()}<br>Bonding: ${lastImportMeta?.bondingSource||'unknown'}${Number.isFinite(lastImportMeta?.qualityScore)?`<br>Quality: ${lastImportMeta.qualityScore}/100 · ${lastImportMeta.reviewLevel||'review'}`:''}${lastImportMeta?.bondingTypes?`<br>Types: ${lastImportMeta.bondingTypes}`:''}${lastImportMeta?.aromaticRings?`<br>Aromatic rings: ${lastImportMeta.aromaticRings}`:''}${lastImportMeta?.promotedBonds?`<br>Promoted bonds: ${lastImportMeta.promotedBonds}`:''}${lastImportMeta?.typedBonds?`<br>Classified contacts: ${lastImportMeta.typedBonds}`:''}${lastImportMeta?.flaggedAtoms?`<br>Flags: ${lastImportMeta.flaggedAtoms} coordination site${lastImportMeta.flaggedAtoms!==1?'s':''}`:''}</div>
    </div>`;
}
function clearFocus(){
  focusedAtoms=null;
  document.getElementById('focusBar').classList.remove('visible');
  if(showAtomList) buildAtomList(document.getElementById('alpSearch').value);
  render();
}
function clearSelection(){
  selectedAtom=null;
  secondarySelectedAtom=null;
  selectedBond=null;
  highlightedAtom=null;
  updateAtomInspector();
  updateBondAssignHint?.();
  if(showAtomList) buildAtomList(document.getElementById('alpSearch').value);
  render();
}
function resetSelectionState(){
  focusedAtoms=null;
  highlightedAtom=null;
  selectedAtom=null;
  secondarySelectedAtom=null;
  selectedBond=null;
  hiddenAtoms = new Set();
  const focusBar=document.getElementById('focusBar');
  if(focusBar) focusBar.classList.remove('visible');
  updateAtomInspector();
  updateBondAssignHint?.();
  if(showAtomList) buildAtomList(document.getElementById('alpSearch').value);
}
function pickAtomFromMouseEvent(e){
  if(!molecule) return null;
  const rect=canvas.getBoundingClientRect();
  const mx=(e.clientX-rect.left)*devicePixelRatio,my=(e.clientY-rect.top)*devicePixelRatio;
  let hit=null,minD=Infinity;
  molecule.atoms.forEach(a=>{
    if(isAtomHidden(a.idx)) return;
    if(a._screenX===undefined) return;
    const dx=mx-a._screenX,dy=my-a._screenY,d=Math.sqrt(dx*dx+dy*dy);
    if(d<Math.max(18,(a._screenR||0)+10)&&d<minD){minD=d;hit=a;}
  });
  return hit;
}

// ═══════════════════════════════════════════════════════════
