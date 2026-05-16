/* ═══════════════════════════════════════════════════════
   Controls — MogadocLab
   ═══════════════════════════════════════════════════════ */

// CONTROLS
// ═══════════════════════════════════════════════════════════
function resetView(){rotX=0.4;rotY=0;zoom=1;panX=0;panY=0;render();}
function toggleAutoRotate(){
  autoRotate=!autoRotate;
  document.getElementById('btnRotate').classList.toggle('active',autoRotate);
  document.getElementById('hudRotating').style.display=autoRotate?'flex':'none';
  document.getElementById('hud').style.display=(autoRotate||showLabels)?'flex':'none';
  if(autoRotate){
    rotEaseVel=0;  // always start from 0 for smooth ease-in
    lastTime=performance.now();
    animFrame=requestAnimationFrame(animate);
  } else {
    if(animFrame)cancelAnimationFrame(animFrame);
    render();
  }
  updateRotPanel();
  saveAppState();
}

// ── Rotation panel helpers ───────────────────────────────────
function setRotMode(mode){
  rotMode=mode;
  rotRockPhase=0;
  document.querySelectorAll('.rotmode-btn').forEach(b=>b.classList.toggle('active',b.dataset.m===mode));
  updateRotPanel();
  if(autoRotate) notify('Rotation: '+mode,'info');
  saveAppState();
}

function setRotTilt(deg){
  rotTiltAngle=deg*Math.PI/180;
  document.getElementById('rotTiltVal').textContent=deg+'°';
  saveAppState();
}

function setRotEasing(on){
  rotEasing=on;
  document.getElementById('btnRotEase').classList.toggle('active',on);
  saveAppState();
}

function updateRotPanel(){
  const tiltRow=document.getElementById('rotTiltRow');
  if(tiltRow) tiltRow.style.display=rotMode==='tilt'?'flex':'none';
}

function nudgeRotation(axis, sign){
  // Manual single-step nudge — useful for precise positioning before screenshot
  const step=0.05*sign;
  if(axis==='x') rotX+=step;
  if(axis==='y') rotY+=step;
  if(axis==='z'){rotX+=step*0.4;rotY+=step*0.7;}
  if(!autoRotate)render();
  saveAppState();
}
function toggleLabels(){
  showLabels=!showLabels;
  document.getElementById('btnLabels').classList.toggle('active',showLabels);
  document.getElementById('hudLabels').style.display=showLabels?'flex':'none';
  document.getElementById('hud').style.display=(autoRotate||showLabels)?'flex':'none';render();
  saveAppState();
}
function toggleInfo(){
  showInfo=!showInfo;
  document.getElementById('btnInfo').classList.toggle('active',showInfo);
  document.getElementById('canvasInfo').classList.toggle('visible',showInfo);
  if(showInfo)updateCanvasInfo();
  saveAppState();
}
function centerMolecule(){panX=0;panY=0;render();}
function setViewMode(mode){
  viewMode=mode;
  ['ballstick','spacefill','wireframe','stick','cartoon'].forEach(m=>document.getElementById('mode-'+m)?.classList.toggle('active',m===mode));
  render();
  saveAppState();
}
function updateDisplay(){
  const ids=['atomScale','bondWidth','depthFog','glowAmt','rotSpeed'];
  ids.forEach(id=>{const v=parseFloat(document.getElementById(id).value);document.getElementById(id+'Val').textContent=v;});
  rotSpeedVal=parseFloat(document.getElementById('rotSpeed').value);
  if(!autoRotate)render();
}
function isLightCanvasBg(bg, theme){
  if(bg === 'white' || bg === 'cream') return true;
  if(bg === 'dark') return false;
  // grid / plain / gradient inherit the theme's --bg lightness
  return theme === 'arctic' || theme === 'journal';
}
function setBg(bg){
  document.getElementById('canvasArea').setAttribute('data-bg',bg);
  document.querySelectorAll('.bg-swatch').forEach(s=>s.classList.toggle('active',s.dataset.bg===bg));
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  window._pubshotLightBg = isLightCanvasBg(bg, theme);
  render();
  if(showInfo) updateCanvasInfo();
  saveAppState();
}
function setLighting(mode){
  lightingMode=mode;
  document.querySelectorAll('.light-btn').forEach(b=>b.classList.toggle('active',b.dataset.l===mode));render();
  saveAppState();
}

// ─── Bond Style ───────────────────────────────────────────
function setBondStyleMode(mode){
  bondStyleMode=mode;
  ['smart','gradient','uniform'].forEach(m=>{
    const el=document.getElementById('bsm-'+m);
    if(el)el.classList.toggle('active',m===mode);
  });
  render();
  saveAppState();
}

// ─── Manual bond assignment ───────────────────────────────
function getBondAssignmentSelection(){
  if(!molecule) return null;
  if(selectedBond!==null && molecule.bonds[selectedBond]){
    const bond=molecule.bonds[selectedBond];
    return {a:bond.a, b:bond.b, via:'bond'};
  }
  if(selectedAtom!==null && secondarySelectedAtom!==null && selectedAtom!==secondarySelectedAtom){
    return {a:secondarySelectedAtom, b:selectedAtom, via:'atom-pair'};
  }
  if(measureAtoms.length>=2){
    return {a:measureAtoms[0], b:measureAtoms[1], via:'measurement'};
  }
  return null;
}
function updateBondAssignHint(){
  const el=document.getElementById('bondAssignHint');
  if(!el){
    return;
  }
  if(!molecule){
    el.textContent='Load a structure to edit bond orders and bond types';
    return;
  }
  const pair=getBondAssignmentSelection();
  if(pair){
    const a=molecule.atoms[pair.a], b=molecule.atoms[pair.b];
    const sourceLabel=pair.via==='bond' ? 'selected bond' : pair.via==='measurement' ? 'measurement pair' : 'clicked atom pair';
    el.textContent=`Ready: ${a.symbol}${pair.a+1}–${b.symbol}${pair.b+1} (${sourceLabel})`;
    return;
  }
  if(selectedAtom!==null && molecule.atoms[selectedAtom]){
    const a=molecule.atoms[selectedAtom];
    el.textContent=`First atom: ${a.symbol}${selectedAtom+1} selected. Click a second atom, or select a bond directly.`;
    return;
  }
  el.textContent='Click atom A, click atom B, then choose Single/Double/Triple. Or select a bond and restyle it directly.';
}
function assignBond(order,type){
  if(!molecule)return notify('No structure loaded','error');
  const pair=getBondAssignmentSelection();
  if(!pair) return notify('Select two atoms, or select an existing bond first','error');
  const {a,b}=pair;
  const existing=molecule.bonds.findIndex(bd=>(bd.a===a&&bd.b===b)||(bd.a===b&&bd.b===a));
  if(existing>=0){
    molecule.bonds[existing].order=order;
    molecule.bonds[existing].type=type;
    molecule.bonds[existing].inferred=false;
    molecule.bonds[existing].inferenceKind='manual';
    molecule.bonds[existing].inferenceNote='edited manually in viewer';
    selectedBond=existing;
    selectedAtom=null;
    secondarySelectedAtom=null;
  } else {
    molecule.bonds.push({a,b,order,type,inferred:false,inferenceKind:'manual',inferenceNote:'created manually in viewer'});
    selectedBond=molecule.bonds.length-1;
    selectedAtom=null;
    secondarySelectedAtom=null;
  }
  document.getElementById('bondAssignHint').textContent=
    `Bond ${molecule.atoms[a].symbol}${a+1}–${molecule.atoms[b].symbol}${b+1}: ${type} (×${order})`;
  updateAtomInspector?.();
  render();notify(`Set ${type} bond (order ${order})`,'success');
}

function removeBond(){
  if(!molecule)return notify('No structure loaded','error');
  const pair=getBondAssignmentSelection();
  if(!pair) return notify('Select two atoms, or select an existing bond first','error');
  const {a,b}=pair;
  const idx=molecule.bonds.findIndex(bd=>(bd.a===a&&bd.b===b)||(bd.a===b&&bd.b===a));
  if(idx>=0){
    molecule.bonds.splice(idx,1);
    clearSelection?.();
    updateBondAssignHint();
    render();
    notify('Bond removed','success');
  }
  else notify('No bond between those atoms','error');
}

// ─── Bond legend canvases ─────────────────────────────────
function drawBondLegends(){
  const W=52,H=14,y=H/2;
  const configs=[
    {id:'blc-single',   fn(c2){c2.strokeStyle='rgba(160,190,220,0.8)';c2.lineWidth=1.5;c2.beginPath();c2.moveTo(4,y);c2.lineTo(W-4,y);c2.stroke();}},
    {id:'blc-double',   fn(c2){c2.strokeStyle='rgba(160,190,220,0.8)';c2.lineWidth=1.5;[-2.5,2.5].forEach(o=>{c2.beginPath();c2.moveTo(4,y+o);c2.lineTo(W-4,y+o);c2.stroke();});}},
    {id:'blc-triple',   fn(c2){c2.strokeStyle='rgba(160,190,220,0.8)';c2.lineWidth=1.2;[0,-4,4].forEach(o=>{c2.beginPath();c2.moveTo(4,y+o);c2.lineTo(W-4,y+o);c2.stroke();});}},
    {id:'blc-aromatic', fn(c2){
      c2.strokeStyle='rgba(160,190,220,0.85)';c2.lineWidth=1.5;c2.beginPath();c2.moveTo(4,y-2.5);c2.lineTo(W-4,y-2.5);c2.stroke();
      c2.strokeStyle='rgba(100,170,255,0.75)';c2.lineWidth=1.2;c2.setLineDash([3,3]);c2.beginPath();c2.moveTo(4,y+2.5);c2.lineTo(W-4,y+2.5);c2.stroke();c2.setLineDash([]);
    }},
    {id:'blc-hbond',    fn(c2){c2.strokeStyle='rgba(80,200,255,0.85)';c2.lineWidth=1;c2.setLineDash([2.5,3]);c2.beginPath();c2.moveTo(4,y);c2.lineTo(W-4,y);c2.stroke();c2.setLineDash([]);}},
    {id:'blc-ionic',    fn(c2){c2.strokeStyle='rgba(255,195,60,0.85)';c2.lineWidth=1.5;c2.setLineDash([5,2.5,1,2.5]);c2.beginPath();c2.moveTo(4,y);c2.lineTo(W-4,y);c2.stroke();c2.setLineDash([]);}},
    {id:'blc-metallic', fn(c2){c2.strokeStyle='rgba(190,200,220,0.8)';c2.lineWidth=3;c2.beginPath();c2.moveTo(4,y);c2.lineTo(W-4,y);c2.stroke();c2.strokeStyle='rgba(255,255,255,0.35)';c2.lineWidth=0.8;c2.beginPath();c2.moveTo(4,y);c2.lineTo(W-4,y);c2.stroke();}},
    {id:'blc-vdw',      fn(c2){c2.strokeStyle='rgba(140,160,190,0.4)';c2.lineWidth=0.8;c2.setLineDash([1.5,5]);c2.beginPath();c2.moveTo(4,y);c2.lineTo(W-4,y);c2.stroke();c2.setLineDash([]);}}
  ];
  configs.forEach(({id,fn})=>{
    const el=document.getElementById(id);
    if(!el)return;
    el.width=W*devicePixelRatio; el.height=H*devicePixelRatio;
    el.style.width=W+'px'; el.style.height=H+'px';
    const c2=el.getContext('2d');
    c2.scale(devicePixelRatio,devicePixelRatio);
    c2.clearRect(0,0,W,H);
    c2.lineCap='round';
    fn(c2);
  });
}
function setTheme(t){
  document.documentElement.setAttribute('data-theme',t==='dark'?'':t);
  document.querySelectorAll('.theme-dot').forEach(d=>d.classList.toggle('active',d.dataset.t===t));
  // Recompute light-bg flag — grid/plain/gradient bgs follow theme lightness.
  const bg = document.getElementById('canvasArea')?.getAttribute('data-bg') || 'grid';
  window._pubshotLightBg = isLightCanvasBg(bg, t);
  if(showInfo) updateCanvasInfo();
  render();
  saveAppState();
}
function toggleSidebar(){
  const sb=document.getElementById('sidebar'),tog=document.getElementById('sidebarToggle');
  if(sb.classList.contains('collapsed')){
    sb.classList.remove('collapsed');
    sb.classList.remove('super-expanded');
    sb.classList.remove('expanded');
    tog.textContent='‹';
    tog.title='Collapse sidebar';
  } else {
    sb.classList.remove('expanded','super-expanded');
    sb.classList.add('collapsed');
    tog.textContent='›';
    tog.title='Expand sidebar';
  }
  setTimeout(resizeCanvas,280);
  saveAppState();
}
function normalizeSidebarState({forceDesktopVisible=false}={}){
  const sidebar=document.getElementById('sidebar');
  if(!sidebar) return;
  const isCompactViewport = window.matchMedia('(max-width: 768px)').matches;
  if(isCompactViewport){
    sidebar.classList.remove('expanded','super-expanded');
    sidebar.classList.add('collapsed');
    return;
  }
  if(forceDesktopVisible || sidebar.classList.contains('collapsed')){
    sidebar.classList.remove('collapsed');
  }
  if(sidebar.classList.contains('super-expanded')){
    sidebar.classList.add('expanded');
  }
}
function updateSidebarToggleUI(){
  const sb=document.getElementById('sidebar'),tog=document.getElementById('sidebarToggle');
  if(!sb||!tog) return;
  if(sb.classList.contains('collapsed')){ tog.textContent='›'; tog.title='Expand sidebar'; }
  else if(sb.classList.contains('super-expanded') || sb.classList.contains('expanded')){ tog.textContent='‹'; tog.title='Collapse sidebar'; }
  else { tog.textContent='‹'; tog.title='Collapse sidebar'; }
}
function applyResponsiveSidebarDefaults(){
  const isCompactViewport = window.matchMedia('(max-width: 768px)').matches;
  const sidebar=document.getElementById('sidebar');
  const editor=document.getElementById('editorPanel');
  if(!sidebar) return;
  if(isCompactViewport){
    sidebar.classList.remove('expanded','super-expanded');
    sidebar.classList.add('collapsed');
    document.getElementById('searchSection')?.classList.remove('search-expanded');
    if(editor) editor.classList.add('hidden');
  } else {
    normalizeSidebarState({forceDesktopVisible:true});
  }
  updateSidebarToggleUI();
}
function toggleEditor(){document.getElementById('editorPanel').classList.toggle('hidden');setTimeout(resizeCanvas,280);}
function toggleSection(head){head.closest('.section').classList.toggle('collapsed');}

// ═══════════════════════════════════════════════════════════
