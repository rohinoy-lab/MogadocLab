/* ═══════════════════════════════════════════════════════
   Interaction — MogadocLab
   ═══════════════════════════════════════════════════════ */

// INTERACTION
// ═══════════════════════════════════════════════════════════
let dragging=false,dragButton=0,lastMX=0,lastMY=0,dragMoved=false;
let dragOriginX=0,dragOriginY=0;
canvas.addEventListener('mousedown',e=>{dragging=true;dragMoved=false;dragButton=e.button;lastMX=e.clientX;lastMY=e.clientY;dragOriginX=e.clientX;dragOriginY=e.clientY;e.preventDefault();});
canvas.addEventListener('mousemove',e=>{
  if(dragging){
    const dx=e.clientX-lastMX,dy=e.clientY-lastMY;
    // Cumulative-distance drag detection — a real drag will move several
    // pixels total before mouseup. Per-event jitter no longer trips this.
    if(Math.hypot(e.clientX-dragOriginX, e.clientY-dragOriginY) > 6) dragMoved=true;
    if(dragButton===2||e.ctrlKey){panX+=dx*devicePixelRatio;panY+=dy*devicePixelRatio;}
    else{rotY+=dx*0.012;rotX+=dy*0.012;}
    lastMX=e.clientX;lastMY=e.clientY;if(!autoRotate)render();
  }
  handleHover(e);
});
canvas.addEventListener('mouseup',e=>{
  const wasDrag=dragMoved;
  dragging=false;
  dragMoved=false;
  if(wasDrag||e.button!==0||measureMode) return;
  const hit=pickAtomFromMouseEvent(e);
  if(hit){
    selectAtom(hit.idx,{notifyUser:true});
  } else {
    const hitBond=pickBondFromMouseEvent(e);
    if(hitBond!==null){
      selectBond(hitBond,{notifyUser:true});
      return;
    }
  }
  if(!hit && selectedAtom!==null){
    clearSelection();
  } else if(!hit && selectedBond!==null){
    clearSelection();
  }
});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{zoom*=e.deltaY>0?0.92:1.09;zoom=Math.max(0.05,Math.min(15,zoom));if(!autoRotate)render();e.preventDefault();},{passive:false});
canvas.addEventListener('dblclick',e=>{
  if(measureMode) return;
  const hit=pickAtomFromMouseEvent(e);
  if(hit) focusAtom(hit.idx);
  else{
    const hitBond=pickBondFromMouseEvent(e);
    if(hitBond!==null){
      selectBond(hitBond,{notifyUser:true});
      focusCurrentSelection();
    }
  }
});
canvas.addEventListener('mouseleave',()=>{dragging=false;dragMoved=false;document.getElementById('tooltip').style.display='none';});

let lastTouchDist=0;
canvas.addEventListener('touchstart',e=>{if(e.touches.length===1){dragging=true;dragButton=0;lastMX=e.touches[0].clientX;lastMY=e.touches[0].clientY;}else if(e.touches.length===2){lastTouchDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);}e.preventDefault();},{passive:false});
canvas.addEventListener('touchmove',e=>{if(e.touches.length===1&&dragging){const dx=e.touches[0].clientX-lastMX,dy=e.touches[0].clientY-lastMY;rotY+=dx*0.01;rotX+=dy*0.01;lastMX=e.touches[0].clientX;lastMY=e.touches[0].clientY;if(!autoRotate)render();}else if(e.touches.length===2){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);zoom*=d/lastTouchDist;zoom=Math.max(0.05,Math.min(15,zoom));lastTouchDist=d;render();}e.preventDefault();},{passive:false});
canvas.addEventListener('touchend',()=>dragging=false);

function handleHover(e) {
  if(!molecule)return;
  const rect=canvas.getBoundingClientRect(),mx=(e.clientX-rect.left)*devicePixelRatio,my=(e.clientY-rect.top)*devicePixelRatio;
  const tooltip=document.getElementById('tooltip');
  let hit=null,minD=Infinity;
  molecule.atoms.forEach(a=>{if(a._screenX===undefined)return;const dx=mx-a._screenX,dy=my-a._screenY,d=Math.sqrt(dx*dx+dy*dy);if(d<Math.max(20,(a._screenR||0)+14)&&d<minD){minD=d;hit=a;}});
  if(hit){
    const el=getElement(hit.symbol),bc=molecule.bonds.filter(b=>b.a===hit.idx||b.b===hit.idx).length;
    document.getElementById('ttSym').textContent=hit.symbol;document.getElementById('ttSym').style.color=el.color;
    document.getElementById('ttName').textContent=el.name+` · mass ${el.mass}`;
    document.getElementById('ttMass').textContent=el.mass+' u';
    document.getElementById('ttBonds').textContent=bc+' bond'+(bc!==1?'s':'');
    document.getElementById('ttCoords').textContent=`${hit.x.toFixed(2)}, ${hit.y.toFixed(2)}, ${hit.z.toFixed(2)}`;
    tooltip.style.display='block';tooltip.style.borderColor=el.color;
    tooltip.style.left=Math.min(e.clientX+16,window.innerWidth-200)+'px';
    tooltip.style.top=Math.max(e.clientY-10,4)+'px';
  } else {tooltip.style.display='none';}
}

// ─── Shortcut help overlay ────────────────────────────────
function toggleShortcutHelp(){
  const el=document.getElementById('shortcutOverlay');
  if(el) el.classList.toggle('visible');
}
// ─── Canvas loading overlay ──────────────────────────────
function showCanvasLoading(msg){
  const el=document.getElementById('canvasLoading');
  const txt=document.getElementById('canvasLoadingText');
  if(txt) txt.textContent=msg||'Loading structure...';
  if(el) el.classList.add('visible');
}
function hideCanvasLoading(){
  const el=document.getElementById('canvasLoading');
  if(el) el.classList.remove('visible');
}

document.addEventListener('keydown',e=>{
  if(e.target.tagName==='TEXTAREA'||e.target.tagName==='INPUT')return;
  if(e.key==='?'||e.key==='/'){toggleShortcutHelp();e.preventDefault();return;}
  // Trajectory controls when active
  if(trajectoryFrames.length > 1){
    if(e.key==='ArrowLeft') {trajPrev();e.preventDefault();return;}
    if(e.key==='ArrowRight'){trajNext();e.preventDefault();return;}
    if(e.key===' '){trajTogglePlay();e.preventDefault();return;}
    if(e.key==='Home'){trajGoToFrame(0);e.preventDefault();return;}
    if(e.key==='End'){trajGoToFrame(trajectoryFrames.length-1);e.preventDefault();return;}
  }
  if(e.key==='r'||e.key==='R')resetView();
  if(e.key===' '){toggleAutoRotate();e.preventDefault();}
  if(e.key==='l'||e.key==='L')toggleLabels();
  if((e.key==='s'||e.key==='S') && e.shiftKey){pubshotQuickDownload('png');e.preventDefault();return;}
  if(e.key==='s'||e.key==='S')screenshot();
  if(e.key==='i'||e.key==='I')toggleInfo();
  if(e.key==='a'||e.key==='A')toggleAtomList();
  if(e.key==='d'||e.key==='D')toggleInspector();
  if(e.key==='p'||e.key==='P')takeSnapshot();
  if(e.key==='Enter'&&(selectedAtom!==null||selectedBond!==null)){focusCurrentSelection();e.preventDefault();}
  if(e.key==='['){selectNeighborAtom(-1);e.preventDefault();}
  if(e.key===']'){selectNeighborAtom(1);e.preventDefault();}
  if(e.key==='h'||e.key==='H'){hideCurrentSelection();e.preventDefault();}
  if(e.key==='u'||e.key==='U'){showAllAtoms();e.preventDefault();}
  if(e.key==='f'||e.key==='F'){selectSelectionFragment();e.preventDefault();}
  if(e.key==='ArrowLeft') {nudgeRotation('y',-1);e.preventDefault();}
  if(e.key==='ArrowRight'){nudgeRotation('y', 1);e.preventDefault();}
  if(e.key==='ArrowUp')   {nudgeRotation('x',-1);e.preventDefault();}
  if(e.key==='ArrowDown') {nudgeRotation('x', 1);e.preventDefault();}
  if(e.key==='Escape'){
    const shortcutEl=document.getElementById('shortcutOverlay');
    if(shortcutEl&&shortcutEl.classList.contains('visible')){toggleShortcutHelp();return;}
    if(trajectoryFrames.length>1){trajStop();clearTrajectory();return;}
    if(measureMode)stopMeasure();else if(focusedAtoms)clearFocus();else if(selectedAtom!==null||selectedBond!==null) clearSelection();
  }
});

// ═══════════════════════════════════════════════════════════
