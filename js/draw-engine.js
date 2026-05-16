/* ═══════════════════════════════════════════════════════
   Draw Engine — MogadocLab
   ═══════════════════════════════════════════════════════ */

// DRAW MOLECULE ENGINE
// ═══════════════════════════════════════════════════════════

// ── Chemistry data: ideal bond lengths (Å) by element pair ─
// Derived from standard covalent radii; stored as lookup map
const BOND_LENGTHS = (() => {
  // Single-bond covalent radii (pm → Å)
  const R = {
    H:0.31,He:0.28,Li:1.28,Be:0.96,B:0.84,C:0.77,N:0.75,O:0.73,F:0.71,Ne:0.58,
    Na:1.66,Mg:1.41,Al:1.21,Si:1.11,P:1.07,S:1.05,Cl:1.02,Ar:0.97,
    K:2.03,Ca:1.74,Sc:1.44,Ti:1.36,V:1.25,Cr:1.27,Mn:1.39,Fe:1.25,Co:1.26,
    Ni:1.21,Cu:1.38,Zn:1.22,Ga:1.22,Ge:1.20,As:1.19,Se:1.20,Br:1.20,Kr:1.16,
    Rb:2.16,Sr:1.91,Y:1.62,Zr:1.48,Nb:1.37,Mo:1.45,Tc:1.56,Ru:1.26,Rh:1.35,
    Pd:1.31,Ag:1.53,Cd:1.48,In:1.44,Sn:1.41,Sb:1.38,Te:1.35,I:1.33,Xe:1.31,
    Cs:2.35,Ba:1.98,La:1.69,Ce:1.65,Pr:1.65,Nd:1.64,Sm:1.62,Eu:1.85,Gd:1.61,
    Hf:1.50,Ta:1.38,W:1.46,Re:1.59,Os:1.28,Ir:1.37,Pt:1.28,Au:1.44,Hg:1.49,
    Tl:1.48,Pb:1.47,Bi:1.46,Po:1.40,default:1.20
  };
  return {
    getBondLength(symA, symB, order=1) {
      const rA = R[symA] || R.default;
      const rB = R[symB] || R.default;
      // bond order correction factor (shorter for multiple bonds)
      const k = order===2 ? 0.87 : order===3 ? 0.78 : order===1.5 ? 0.93 : 1.0;
      return (rA + rB) * k;
    }
  };
})();

// Ideal bond angles by hybridization/element (degrees)
const BOND_ANGLES = {
  C: {sp3:109.5, sp2:120, sp:180},
  N: {sp3:107.0, sp2:120, sp:180},
  O: {sp3:104.5, sp2:120},
  S: {sp3:103.0, sp2:120},
  P: {sp3:107.0},
  Si:{sp3:109.5},
  default: 109.5
};

function getIdealAngle(sym, numBonds) {
  const tbl = BOND_ANGLES[sym] || {};
  if (numBonds<=1) return 180;
  if (numBonds===2) return tbl.sp2 || tbl.sp3 || BOND_ANGLES.default;
  if (numBonds===3) return tbl.sp3 || BOND_ANGLES.default;
  return tbl.sp3 || BOND_ANGLES.default;
}

// Valence table for auto-H
const VALENCE = {
  H:1,He:0,Li:1,Be:2,B:3,C:4,N:3,O:2,F:1,Ne:0,
  Na:1,Mg:2,Al:3,Si:4,P:3,S:2,Cl:1,Ar:0,
  K:1,Ca:2,Fe:3,Co:3,Ni:2,Cu:2,Zn:2,Br:1,I:1,Au:3,Pt:4,
  default:4
};
function getValence(sym){ return VALENCE[sym] ?? VALENCE.default; }

// ── Draw state ──────────────────────────────────────────────
let dmAtoms = [];    // {id, sym, x, y, selected}
let dmBonds = [];    // {id, a, b, order}  (indices into dmAtoms)
let dmNextId = 0;
let dmTool = 'add';
let dmBondOrder = 1;
let dmSelectedElem = 'C';
let dmBondStart = null;  // atom id for bond drawing
let dmHistory = [];      // undo stack
let dmDragging = null;   // {id, ox, oy, mx0, my0}
let dmHoverAtom = null;
let dmHoverBond = null;
let dmCanvasEl = null, dmCtx = null;
let dmScale = 60, dmOffX = 0, dmOffY = 0;  // pan/zoom
let dmGhostPos = null;  // ghost atom position when hovering

// ── Init draw modal ─────────────────────────────────────────
function openDrawModal() {
  const modal=document.getElementById('drawModal');
  modal.style.display='flex';
  modal.focus();
  if (!dmCanvasEl) {
    dmCanvasEl = document.getElementById('drawCanvas');
    dmCtx = dmCanvasEl.getContext('2d');
    dmResizeCanvas();
    dmBindEvents();
  }
  dmBuildElemList('');
  dmInitTemplatePalette();
  dmRender();
}
function closeDrawModal() {
  document.getElementById('drawModal').style.display='none';
  dmBondStart = null;
}
function toggleDrawSidebar() {
  const left=document.querySelector('#drawModal .dm-left');
  if(!left) return;
  left.classList.remove('compact');
  if(left.classList.contains('expanded')){
    left.classList.remove('expanded');
    left.classList.add('collapsed');
  } else if(left.classList.contains('collapsed')){
    left.classList.remove('collapsed');
  } else {
    left.classList.add('expanded');
  }
  const toggleBtn = document.querySelector('#drawModal button[onclick="toggleDrawSidebar()"]');
  if(toggleBtn){
    toggleBtn.textContent = left.classList.contains('collapsed') ? '⇔ Tools' : (left.classList.contains('expanded') ? '⇔ Tools++' : '⇔ Tools');
  }
  setTimeout(()=>{ if(dmCanvasEl) dmResizeCanvas(); }, 230);
}

function dmToggleSection(btn) {
  const section = btn && btn.closest('.dm-section');
  if(!section) return;
  section.classList.toggle('is-collapsed');
  const expanded = !section.classList.contains('is-collapsed');
  btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  const glyph = btn.querySelector('.dm-section-toggle');
  if(glyph) glyph.textContent = expanded ? '−' : '+';
  if(expanded) requestAnimationFrame(()=>section.scrollIntoView({block:'nearest', behavior:'smooth'}));
}

function dmResizeCanvas() {
  const wrap = document.getElementById('dmCanvasWrap');
  dmCanvasEl.width  = wrap.clientWidth  * devicePixelRatio;
  dmCanvasEl.height = wrap.clientHeight * devicePixelRatio;
  dmCanvasEl.style.width  = wrap.clientWidth  + 'px';
  dmCanvasEl.style.height = wrap.clientHeight + 'px';
  if (dmAtoms.length===0) { dmOffX=dmCanvasEl.width/2; dmOffY=dmCanvasEl.height/2; }
  dmRender();
}
window.addEventListener('resize', ()=>{ if(dmCanvasEl) dmResizeCanvas(); });

// ── Element list ────────────────────────────────────────────
const COMMON_ELEMS = ['H','C','N','O','F','S','P','Cl','Br','I','B','Si','Fe','Na','K','Ca','Mg','Zn','Cu','Au'];
function dmBuildElemList(filter) {
  const f = filter.toLowerCase();
  const container = document.getElementById('dmElemList');
  const elems = filter
    ? Object.entries(ELEMENTS_DEFAULT)
        .filter(([s,e])=>s.toLowerCase().includes(f)||e.name.toLowerCase().includes(f))
        .sort((a,b)=>a[1].z-b[1].z).slice(0,40).map(([s])=>s)
    : COMMON_ELEMS;
  container.innerHTML = elems.map(sym=>{
    const el = ELEMENTS_DEFAULT[sym]||{};
    const isActive = sym===dmSelectedElem;
    const col = el.color||'#888';
    const activeStyle = isActive
      ? `background:${col};border-color:${col};color:${lightness(col)>0.52?'#111':'#fff'};box-shadow:0 2px 10px ${col}66;`
      : `border-left:3px solid ${col};`;
    return `<button class="dm-elem-btn ${isActive?'active':''}"
      id="dm-eb-${sym}"
      onclick="dmSelectElem('${sym}')"
      title="${el.name||sym} (Z=${el.z||'?'})"
      style="${activeStyle}"
    >${sym}</button>`;
  }).join('');
}
function dmFilterElems(v){ dmBuildElemList(v); }
function dmSelectElem(sym) {
  dmSelectedElem = sym;
  dmBuildElemList(document.getElementById('dmElemSearch').value);
  notify(`Element: ${sym} — ${(ELEMENTS_DEFAULT[sym]||{}).name||''}`,'info');
}

function dmSetTool(t) {
  dmTool=t; dmBondStart=null; dmGhostPos=null;
  document.querySelectorAll('.dm-tool').forEach(b=>b.classList.remove('active'));
  document.getElementById('dm-tool-'+t)?.classList.add('active');
  const hints = {
    add:   '⊕ Click empty canvas to place atom · Click existing atom to extend',
    bond:  '⟷ Click first atom, then second atom to draw a bond',
    move:  '✥ Drag atoms to reposition',
    erase: '🗑 Click atom or bond to delete it',
    chain: '⬡ Click to start chain · Each click adds a carbon with ideal angle'
  };
  document.getElementById('dmHint').textContent = hints[t]||'';
  const infos = {
    add:   '<b>Add Atom</b> mode<br>Click canvas to place atom<br>Click atom to extend chain',
    bond:  '<b>Bond</b> mode<br>Click atom 1, then atom 2<br>Uses selected bond order',
    move:  '<b>Move</b> mode<br>Drag atoms freely<br>Bonds follow automatically',
    erase: '<b>Erase</b> mode<br>Click atom → removes it + bonds<br>Click bond → removes just bond',
    chain: '<b>Chain</b> mode<br>Click to grow carbon chain<br>Ideal angles auto-applied'
  };
  document.getElementById('dmInfo').innerHTML = infos[t]||'';
}
function dmSetBondOrder(o) {
  dmBondOrder=o;
  document.querySelectorAll('.dm-bond-btn').forEach(b=>b.classList.remove('active'));
  const map={1:'dm-bond-1',2:'dm-bond-2',3:'dm-bond-3',1.5:'dm-bond-ar'};
  document.getElementById(map[o])?.classList.add('active');
}

// ── Coordinate helpers ──────────────────────────────────────
function dmToScreen(x,y){ return { sx: x*dmScale+dmOffX, sy: y*dmScale+dmOffY }; }
function dmFromScreen(sx,sy){ return { x:(sx-dmOffX)/dmScale, y:(sy-dmOffY)/dmScale }; }
function dmDist(a,b){ const dx=a.x-b.x,dy=a.y-b.y; return Math.sqrt(dx*dx+dy*dy); }
function dmAtomAtScreen(sx,sy,exclude=-1) {
  const {x,y}=dmFromScreen(sx,sy);
  let best=null, bestD=Infinity;
  for(const a of dmAtoms){
    if(a.id===exclude) continue;
    const d=Math.sqrt((a.x-x)**2+(a.y-y)**2);
    if(d<0.7&&d<bestD){bestD=d;best=a;}
  }
  return best;
}
function dmBondAtScreen(sx,sy) {
  const {x,y}=dmFromScreen(sx,sy);
  for(const b of dmBonds){
    const a=dmAtoms[b.a], bb=dmAtoms[b.b];
    if(!a||!bb) continue;
    // point-to-segment distance
    const dx=bb.x-a.x, dy=bb.y-a.y, len2=dx*dx+dy*dy;
    if(len2===0) continue;
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/len2));
    const px=a.x+t*dx, py=a.y+t*dy;
    const d=Math.sqrt((x-px)**2+(y-py)**2);
    if(d<0.35) return b;
  }
  return null;
}

// ── Ideal position for new atom bonded to parent ────────────
function dmIdealPos(parentAtom, bondedAtom=null, overrideLen=null) {
  const el = ELEMENTS_DEFAULT[parentAtom.sym]||{};
  const bonds = dmBonds.filter(b=>b.a===dmAtoms.indexOf(parentAtom)||b.b===dmAtoms.indexOf(parentAtom));
  const numExisting = bonds.length;
  const len = overrideLen || BOND_LENGTHS.getBondLength(parentAtom.sym, dmSelectedElem, dmBondOrder);
  const scale = 1.5; // drawing units per Å

  if (numExisting===0) {
    // No bonds yet: place to the right
    return { x: parentAtom.x + len*scale, y: parentAtom.y };
  }

  // Collect existing neighbour directions
  const neighbors = bonds.map(b=>{
    const other = dmAtoms[b.a===dmAtoms.indexOf(parentAtom)?b.b:b.a];
    const dx=other.x-parentAtom.x, dy=other.y-parentAtom.y, d=Math.sqrt(dx*dx+dy*dy)||1;
    return Math.atan2(dy,dx);
  });

  const idealAngle = getIdealAngle(parentAtom.sym, numExisting+1) * Math.PI/180;

  // Find angle that maximizes min-distance from all existing neighbours
  let bestAngle=0, bestScore=-Infinity;
  for(let a=0;a<360;a+=5){
    const rad=a*Math.PI/180;
    let minDiff=Infinity;
    for(const n of neighbors){ let d=Math.abs(rad-n); if(d>Math.PI)d=2*Math.PI-d; if(d<minDiff)minDiff=d; }
    // Prefer angles close to idealAngle away from each neighbour
    let score=0;
    for(const n of neighbors){ let d=Math.abs(rad-n); if(d>Math.PI)d=2*Math.PI-d; score-=Math.abs(d-idealAngle); }
    score += minDiff*0.5;
    if(score>bestScore){ bestScore=score; bestAngle=rad; }
  }
  return { x: parentAtom.x + Math.cos(bestAngle)*len*scale, y: parentAtom.y + Math.sin(bestAngle)*len*scale };
}

// ── Undo history ────────────────────────────────────────────
function dmSaveHistory(){ dmHistory.push({atoms:JSON.parse(JSON.stringify(dmAtoms)),bonds:JSON.parse(JSON.stringify(dmBonds))}); if(dmHistory.length>60)dmHistory.shift(); }
function dmUndo(){
  if(!dmHistory.length) return notify('Nothing to undo','error');
  const s=dmHistory.pop(); dmAtoms=s.atoms; dmBonds=s.bonds; dmBondStart=null;
  dmRender(); dmUpdateStats(); dmUpdateMeasurements();
}
function dmClearAll(){
  dmSaveHistory(); dmAtoms=[]; dmBonds=[]; dmNextId=0; dmBondStart=null;
  dmRender(); dmUpdateStats(); dmUpdateMeasurements();
}

// ── Add/remove primitives ────────────────────────────────────
function dmAddAtom(x,y,sym,skipHistory=false){
  if(!skipHistory) dmSaveHistory();
  const a={id:dmNextId++,sym:sym||dmSelectedElem,x,y,selected:false};
  dmAtoms.push(a); return a;
}
function dmAddBond(iA,iB,order,skipHistory=false){
  if(!skipHistory) dmSaveHistory();
  // No duplicate bonds
  if(dmBonds.find(b=>(b.a===iA&&b.b===iB)||(b.a===iB&&b.b===iA))) return null;
  if(iA===iB) return null;
  const b={id:dmNextId++,a:iA,b:iB,order:order||dmBondOrder};
  dmBonds.push(b); return b;
}
function dmRemoveAtom(atom){
  dmSaveHistory();
  const idx=dmAtoms.indexOf(atom); if(idx<0)return;
  dmBonds=dmBonds.filter(b=>b.a!==idx&&b.b!==idx);
  dmAtoms.splice(idx,1);
  // Re-index bond references
  dmBonds=dmBonds.map(b=>({...b,a:b.a>idx?b.a-1:b.a,b:b.b>idx?b.b-1:b.b}));
}
function dmRemoveBond(bond){ dmSaveHistory(); dmBonds=dmBonds.filter(b=>b!==bond); }

// ── Bond check ──────────────────────────────────────────────
function dmHasBond(iA,iB){ return dmBonds.some(b=>(b.a===iA&&b.b===iB)||(b.a===iB&&b.b===iA)); }

// ── Events ──────────────────────────────────────────────────
function dmBindEvents(){
  const wrap=document.getElementById('dmCanvasWrap');
  if(wrap.dataset.bound==='1') return;
  wrap.dataset.bound='1';

  wrap.addEventListener('mousedown', dmMouseDown);
  wrap.addEventListener('mousemove', dmMouseMove);
  wrap.addEventListener('mouseup',   dmMouseUp);
  wrap.addEventListener('mouseleave', dmMouseUp);
  wrap.addEventListener('wheel',     dmWheel, {passive:false});
  wrap.addEventListener('contextmenu', e=>e.preventDefault());

  // Keyboard shortcuts inside modal
  document.getElementById('drawModal').addEventListener('keydown', e=>{
    if(e.target.tagName==='INPUT') return;
    if((e.ctrlKey||e.metaKey)&&e.key==='z'){ dmUndo(); e.preventDefault(); }
    if(e.key==='Escape'){ dmBondStart=null; dmRender(); }
    if(e.key==='a'||e.key==='A') dmSetTool('add');
    if(e.key==='b'||e.key==='B') dmSetTool('bond');
    if(e.key==='m'||e.key==='M') dmSetTool('move');
    if(e.key==='e'||e.key==='E') dmSetTool('erase');
  });

  // Pan with middle mouse
  let panDrag=false, panLX=0, panLY=0;
  wrap.addEventListener('mousedown', e=>{ if(e.button===1){panDrag=true;panLX=e.clientX;panLY=e.clientY;e.preventDefault();}});
  wrap.addEventListener('mousemove', e=>{ if(panDrag){dmOffX+=(e.clientX-panLX)*devicePixelRatio;dmOffY+=(e.clientY-panLY)*devicePixelRatio;panLX=e.clientX;panLY=e.clientY;dmRender();}});
  wrap.addEventListener('mouseup',   e=>{ if(e.button===1)panDrag=false; });
}

let dmMouseIsDown=false, dmMouseBtn=0;
function dmGetPos(e){
  const rect=dmCanvasEl.getBoundingClientRect();
  return {sx:(e.clientX-rect.left)*devicePixelRatio, sy:(e.clientY-rect.top)*devicePixelRatio};
}

function dmMouseDown(e){
  if(e.button===1) return; // middle = pan (handled separately)
  dmMouseIsDown=true; dmMouseBtn=e.button;
  const {sx,sy}=dmGetPos(e);
  const {x,y}=dmFromScreen(sx,sy);

  if(dmTool==='move'){
    const hit=dmAtomAtScreen(sx,sy);
    if(hit) dmDragging={id:hit.id,ox:hit.x,oy:hit.y,mx0:sx,my0:sy};
    return;
  }
  if(dmTool==='erase'){
    const hit=dmAtomAtScreen(sx,sy);
    if(hit){ dmRemoveAtom(hit); dmRender(); dmUpdateStats(); dmUpdateMeasurements(); return; }
    const hb=dmBondAtScreen(sx,sy);
    if(hb){ dmRemoveBond(hb); dmRender(); dmUpdateStats(); dmUpdateMeasurements(); return; }
    return;
  }
  if(dmTool==='bond'){
    const hit=dmAtomAtScreen(sx,sy);
    if(hit){
      if(dmBondStart===null){ dmBondStart=hit.id; dmRender(); }
      else {
        if(dmBondStart!==hit.id){
          const iA=dmAtoms.findIndex(a=>a.id===dmBondStart);
          const iB=dmAtoms.findIndex(a=>a.id===hit.id);
          // Toggle bond order if bond exists
          const existing=dmBonds.find(b=>(b.a===iA&&b.b===iB)||(b.a===iB&&b.b===iA));
          if(existing){ dmSaveHistory(); existing.order=dmBondOrder; }
          else { dmAddBond(iA,iB,dmBondOrder); }
        }
        dmBondStart=null; dmRender(); dmUpdateStats(); dmUpdateMeasurements();
      }
    } else { dmBondStart=null; dmRender(); }
    return;
  }
  if(dmTool==='add'){
    const hit=dmAtomAtScreen(sx,sy);
    if(hit){
      // Extend: add new atom bonded to this one
      const pos=dmIdealPos(hit);
      // Check no atom already too close
      const clash=dmAtoms.find(a=>a!==hit&&Math.sqrt((a.x-pos.x)**2+(a.y-pos.y)**2)<0.4);
      if(!clash){
        dmSaveHistory();
        const na=dmAddAtom(pos.x,pos.y,dmSelectedElem,true);
        dmAddBond(dmAtoms.indexOf(hit),dmAtoms.indexOf(na),dmBondOrder,true);
        dmRender(); dmUpdateStats(); dmUpdateMeasurements();
      }
    } else {
      const a=dmAddAtom(x,y,dmSelectedElem);
      dmRender(); dmUpdateStats(); dmUpdateMeasurements();
    }
    return;
  }
  if(dmTool==='chain'){
    const hit=dmAtomAtScreen(sx,sy);
    if(hit){
      const pos=dmIdealPos(hit,null,null);
      const clash=dmAtoms.find(a=>a!==hit&&Math.sqrt((a.x-pos.x)**2+(a.y-pos.y)**2)<0.4);
      if(!clash){
        dmSaveHistory();
        const na=dmAddAtom(pos.x,pos.y,'C',true);
        dmAddBond(dmAtoms.indexOf(hit),dmAtoms.indexOf(na),1,true);
        dmRender(); dmUpdateStats(); dmUpdateMeasurements();
      }
    } else {
      const a=dmAddAtom(x,y,'C');
      dmRender(); dmUpdateStats(); dmUpdateMeasurements();
    }
  }
}
function dmMouseMove(e){
  const {sx,sy}=dmGetPos(e);
  dmLastMouse={sx,sy};
  if(dmDragging&&dmTool==='move'){
    const a=dmAtoms.find(a=>a.id===dmDragging.id);
    if(a){ a.x=dmDragging.ox+(sx-dmDragging.mx0)/dmScale; a.y=dmDragging.oy+(sy-dmDragging.my0)/dmScale; }
    dmRender(); dmUpdateMeasurements(); return;
  }
  dmHoverAtom=dmAtomAtScreen(sx,sy);
  dmHoverBond=dmHoverAtom?null:dmBondAtScreen(sx,sy);
  // Ghost atom preview
  if((dmTool==='add'||dmTool==='chain')&&!dmHoverAtom){
    const {x,y}=dmFromScreen(sx,sy);
    dmGhostPos={x,y,sym:dmTool==='chain'?'C':dmSelectedElem};
  } else dmGhostPos=null;
  dmRender();
}
function dmMouseUp(e){
  dmMouseIsDown=false; dmDragging=null;
}
function dmWheel(e){
  e.preventDefault();
  const {sx,sy}=dmGetPos(e);
  const factor=e.deltaY>0?0.88:1.14;
  dmOffX=sx+(dmOffX-sx)*factor; dmOffY=sy+(dmOffY-sy)*factor;
  dmScale*=factor; dmScale=Math.max(20,Math.min(400,dmScale));
  dmRender();
}

// ── Render ──────────────────────────────────────────────────
function dmRender(){
  if(!dmCtx) return;
  const W=dmCanvasEl.width, H=dmCanvasEl.height;
  const dpr=devicePixelRatio||1;
  dmCtx.clearRect(0,0,W,H);

  // Draw bonds (below atoms)
  for(const b of dmBonds){
    const a=dmAtoms[b.a], bb=dmAtoms[b.b];
    if(!a||!bb) continue;
    const {sx:ax,sy:ay}=dmToScreen(a.x,a.y);
    const {sx:bx,sy:by}=dmToScreen(bb.x,bb.y);
    const isHover=b===dmHoverBond;
    dmDrawBond(ax,ay,bx,by,b.order,
      ELEMENTS[a.sym]?.color||'#888',
      ELEMENTS[bb.sym]?.color||'#888',
      isHover,dpr);
  }

  // Ghost bond line when bond tool active and start chosen
  if(dmTool==='bond'&&dmBondStart!==null){
    const sa=dmAtoms.find(a=>a.id===dmBondStart);
    if(sa){
      const {sx:ax,sy:ay}=dmToScreen(sa.x,sa.y);
      let gx=ax,gy=ay;
      if(dmLastMouse){gx=dmLastMouse.sx;gy=dmLastMouse.sy;}
      dmCtx.save();
      dmCtx.setLineDash([6*dpr,4*dpr]);
      dmCtx.strokeStyle='rgba(168,85,247,0.55)';
      dmCtx.lineWidth=2*dpr;
      dmCtx.lineCap='round';
      dmCtx.beginPath(); dmCtx.moveTo(ax,ay); dmCtx.lineTo(gx,gy); dmCtx.stroke();
      dmCtx.restore();
    }
  }

  // Draw atoms
  for(const a of dmAtoms){
    const {sx,sy}=dmToScreen(a.x,a.y);
    const el=ELEMENTS[a.sym]||{color:'#ff69b4',r:0.8};
    const r=Math.max(12*dpr,(el.r||0.8)*dmScale*0.55);
    const isHover=a===dmHoverAtom;
    const isBondStart=a.id===dmBondStart;
    dmDrawAtom(sx,sy,r,a.sym,el.color,isHover,isBondStart,dpr);
  }

  // Ghost atom preview
  if(dmGhostPos){
    const {sx,sy}=dmToScreen(dmGhostPos.x,dmGhostPos.y);
    const el=ELEMENTS[dmGhostPos.sym]||{color:'#ff69b4',r:0.8};
    const r=Math.max(12*dpr,(el.r||0.8)*dmScale*0.55);
    dmCtx.save(); dmCtx.globalAlpha=0.32;
    dmDrawAtom(sx,sy,r,dmGhostPos.sym,el.color,false,false,dpr);
    dmCtx.restore();
    // Ghost bond to nearest hovered atom
    if(dmHoverAtom){
      const {sx:hx,sy:hy}=dmToScreen(dmHoverAtom.x,dmHoverAtom.y);
      dmCtx.save(); dmCtx.globalAlpha=0.25;
      dmCtx.setLineDash([4*dpr,3*dpr]);
      dmCtx.strokeStyle='rgba(168,85,247,0.6)'; dmCtx.lineWidth=2*dpr;
      dmCtx.beginPath(); dmCtx.moveTo(hx,hy); dmCtx.lineTo(sx,sy); dmCtx.stroke();
      dmCtx.restore();
    }
  }

  // Update coordinate display
  if(dmLastMouse){
    const {x,y}=dmFromScreen(dmLastMouse.sx,dmLastMouse.sy);
    const coord=document.getElementById('dmCoords');
    if(coord) coord.textContent=`x ${(x/1.5).toFixed(2)} Å  y ${(-y/1.5).toFixed(2)} Å`;
  }
  const zb=document.getElementById('dmZoomBadge');
  if(zb) zb.textContent=`${Math.round(dmScale/60*100)}%`;
}

let dmLastMouse=null;

function dmDrawAtom(sx,sy,r,sym,color,isHover,isStart,dpr=1){
  const ctx=dmCtx;
  const hex=color||'#888';

  // Ambient outer glow for all atoms (subtle)
  {
    const glow=ctx.createRadialGradient(sx,sy,r*0.6,sx,sy,r*2.2);
    glow.addColorStop(0,hexAlpha(hex,0.12));
    glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(sx,sy,r*2.2,0,Math.PI*2);
    ctx.fillStyle=glow; ctx.fill();
  }

  // Hover / bond-start pulse ring
  if(isHover||isStart){
    ctx.save();
    const ringColor=isStart?'#a855f7':hex;
    // Outer ring
    ctx.beginPath(); ctx.arc(sx,sy,r+5*dpr,0,Math.PI*2);
    ctx.strokeStyle=hexAlpha(ringColor,0.45);
    ctx.lineWidth=1.5*dpr; ctx.stroke();
    // Glow fill
    const gf=ctx.createRadialGradient(sx,sy,r,sx,sy,r+8*dpr);
    gf.addColorStop(0,hexAlpha(ringColor,0.22));
    gf.addColorStop(1,'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(sx,sy,r+8*dpr,0,Math.PI*2);
    ctx.fillStyle=gf; ctx.fill();
    ctx.restore();
  }

  // Main sphere — 3-stop radial gradient for plasticity
  const hilightX=sx-r*0.32, hilightY=sy-r*0.32;
  const grad=ctx.createRadialGradient(hilightX,hilightY,r*0.02,sx,sy,r);
  // Bright specular hilight
  grad.addColorStop(0,'rgba(255,255,255,0.92)');
  // Midtone with element color
  grad.addColorStop(0.28,hexAlpha(hex,0.95));
  // Dark rim for depth
  grad.addColorStop(0.82,darkHex(hex,0.6));
  grad.addColorStop(1,darkHex(hex,0.35));

  ctx.beginPath(); ctx.arc(sx,sy,r,0,Math.PI*2);
  ctx.fillStyle=grad; ctx.fill();

  // Subtle rim stroke
  const strokeCol=isStart?'rgba(168,85,247,0.9)':isHover?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.18)';
  ctx.strokeStyle=strokeCol;
  ctx.lineWidth=(isHover||isStart)?2*dpr:1*dpr;
  ctx.stroke();

  // Small specular dot
  {
    const sdot=ctx.createRadialGradient(hilightX,hilightY,0,hilightX,hilightY,r*0.28);
    sdot.addColorStop(0,'rgba(255,255,255,0.7)');
    sdot.addColorStop(1,'rgba(255,255,255,0)');
    ctx.beginPath(); ctx.arc(hilightX,hilightY,r*0.28,0,Math.PI*2);
    ctx.fillStyle=sdot; ctx.fill();
  }

  // Element symbol — crisp label
  const fs=Math.max(9*dpr, Math.min(r*0.88, 20*dpr));
  ctx.font=`700 ${fs}px 'JetBrains Mono',monospace`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  // Shadow for legibility
  ctx.shadowColor='rgba(0,0,0,0.6)'; ctx.shadowBlur=3*dpr;
  ctx.fillStyle=lightness(hex)>0.52?'rgba(0,0,0,0.85)':'rgba(255,255,255,0.95)';
  ctx.fillText(sym,sx,sy);
  ctx.shadowBlur=0;
}

function dmDrawBond(ax,ay,bx,by,order,colorA,colorB,isHover,dpr=1){
  const ctx=dmCtx;
  const dx=bx-ax, dy=by-ay, len=Math.sqrt(dx*dx+dy*dy)||1;
  const nx=-dy/len, ny=dx/len; // normal
  const baseW=isHover?4*dpr:2.5*dpr;

  // Element-color gradient along bond
  const grad=ctx.createLinearGradient(ax,ay,bx,by);
  grad.addColorStop(0,colorA);
  grad.addColorStop(0.5, blendHex(colorA,colorB,0.5));
  grad.addColorStop(1,colorB);

  // Hover glow underneath
  if(isHover){
    ctx.save();
    ctx.strokeStyle='rgba(168,85,247,0.3)';
    ctx.lineWidth=(baseW+8)*dpr; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
    ctx.restore();
  }

  const drawLine=(ox,oy,lw,alpha=1)=>{
    ctx.beginPath();
    ctx.moveTo(ax+nx*ox,ay+ny*oy);
    ctx.lineTo(bx+nx*ox,by+ny*oy);
    ctx.strokeStyle=grad;
    ctx.lineWidth=lw;
    ctx.lineCap='round';
    ctx.globalAlpha=alpha;
    ctx.stroke();
    ctx.globalAlpha=1;
  };

  ctx.save();
  if(order===1.5){
    // Aromatic: solid + dashed offset
    drawLine(0,baseW);
    ctx.save();
    ctx.setLineDash([6*dpr,4*dpr]);
    drawLine(3.5*dpr,baseW*0.75,0.75);
    ctx.setLineDash([]);
    ctx.restore();
  } else if(order===2){
    drawLine(-2.5*dpr,baseW*0.85);
    drawLine( 2.5*dpr,baseW*0.85);
  } else if(order===3){
    drawLine(0,baseW);
    drawLine(-4*dpr,baseW*0.7);
    drawLine( 4*dpr,baseW*0.7);
  } else {
    drawLine(0,baseW);
  }
  ctx.restore();
}

function blendHex(a,b,t){
  const ar=parseInt(a.slice(1,3),16),ag=parseInt(a.slice(3,5),16),ab=parseInt(a.slice(5,7),16);
  const br=parseInt(b.slice(1,3),16),bg=parseInt(b.slice(3,5),16),bb2=parseInt(b.slice(5,7),16);
  const rr=Math.round(ar+(br-ar)*t),rg=Math.round(ag+(bg-ag)*t),rb=Math.round(ab+(bb2-ab)*t);
  return `#${rr.toString(16).padStart(2,'0')}${rg.toString(16).padStart(2,'0')}${rb.toString(16).padStart(2,'0')}`;
}

function darkHex(hex,factor){
  const r=Math.round(parseInt(hex.slice(1,3),16)*factor);
  const g=Math.round(parseInt(hex.slice(3,5),16)*factor);
  const b=Math.round(parseInt(hex.slice(5,7),16)*factor);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}
function lightness(hex){
  const r=parseInt(hex.slice(1,3),16)/255;
  const g=parseInt(hex.slice(3,5),16)/255;
  const b=parseInt(hex.slice(5,7),16)/255;
  return 0.299*r+0.587*g+0.114*b;
}

// ── Stats & measurements ────────────────────────────────────
function dmUpdateStats(){
  const counts={};
  dmAtoms.forEach(a=>{ counts[a.sym]=(counts[a.sym]||0)+1; });
  const formula=Object.entries(counts).sort((a,b)=>a[0]==='C'?-1:b[0]==='C'?1:a[0]==='H'?-1:b[0]==='H'?1:0).map(([s,n])=>s+(n>1?n:'')).join('');

  // Legacy element (kept for compatibility)
  const legEl=document.getElementById('dmStats');
  if(legEl) legEl.innerHTML=`Atoms: ${dmAtoms.length}<br>Bonds: ${dmBonds.length}<br>Formula: ${formula||'—'}`;

  // Stat boxes
  const sa=document.getElementById('dmStatAtoms');
  const sb=document.getElementById('dmStatBonds');
  if(sa) sa.textContent=dmAtoms.length;
  if(sb) sb.textContent=dmBonds.length;

  const fb=document.getElementById('dmFormulaBox');
  if(fb) fb.textContent=formula||'—';

  // Header pills
  const lp=document.getElementById('dmLivePill');
  if(lp) lp.textContent=`${dmAtoms.length} atom${dmAtoms.length!==1?'s':''}`;
  const fp=document.getElementById('dmFormulaPill');
  if(fp) fp.textContent=formula||'—';
}
function dmUpdateMeasurements(){
  const box=document.getElementById('dmMeasList');
  const lines=[];

  // Bond lengths with deviation bars
  dmBonds.forEach(b=>{
    const a=dmAtoms[b.a],bb=dmAtoms[b.b];
    if(!a||!bb) return;
    const dWorld=dmDist(a,bb)/1.5;
    const ideal=BOND_LENGTHS.getBondLength(a.sym,bb.sym,b.order);
    const dev=Math.abs(dWorld-ideal)/ideal;
    const barColor=dev<0.05?'var(--green)':dev<0.12?'var(--yellow)':'var(--red)';
    const barW=Math.min(100,Math.round(dev*500));
    lines.push(`<div class="dm-meas-item">
      <div class="dm-meas-label">${a.sym}–${bb.sym} · ${b.order===1.5?'Ar':b.order+'×'}</div>
      <div class="dm-meas-val">${dWorld.toFixed(3)} Å</div>
      <div class="dm-meas-ideal">ideal: ${ideal.toFixed(3)} Å</div>
      <div class="dm-meas-bar-wrap"><div class="dm-meas-bar" style="width:${barW}%;background:${barColor};"></div></div>
    </div>`);
  });

  // Bond angles
  const anglesDone=new Set();
  dmBonds.forEach(b1=>{
    dmBonds.forEach(b2=>{
      if(b1===b2) return;
      let center=-1, end1=-1, end2=-1;
      if(b1.a===b2.a){center=b1.a;end1=b1.b;end2=b2.b;}
      else if(b1.a===b2.b){center=b1.a;end1=b1.b;end2=b2.a;}
      else if(b1.b===b2.a){center=b1.b;end1=b1.a;end2=b2.b;}
      else if(b1.b===b2.b){center=b1.b;end1=b1.a;end2=b2.a;}
      if(center<0) return;
      const key=[Math.min(end1,end2),center,Math.max(end1,end2)].join('-');
      if(anglesDone.has(key)) return; anglesDone.add(key);
      const ca=dmAtoms[center],ea=dmAtoms[end1],eb=dmAtoms[end2];
      if(!ca||!ea||!eb) return;
      const v1x=ea.x-ca.x,v1y=ea.y-ca.y;
      const v2x=eb.x-ca.x,v2y=eb.y-ca.y;
      const dot=v1x*v2x+v1y*v2y;
      const mag=Math.sqrt((v1x*v1x+v1y*v1y)*(v2x*v2x+v2y*v2y))||1;
      const angle=Math.acos(Math.max(-1,Math.min(1,dot/mag)))*180/Math.PI;
      const idealAng=getIdealAngle(ca.sym,dmBonds.filter(b=>b.a===center||b.b===center).length);
      const angDev=Math.abs(angle-idealAng)/idealAng;
      const angColor=angDev<0.04?'var(--green)':angDev<0.1?'var(--yellow)':'var(--red)';
      const angBarW=Math.min(100,Math.round(angDev*500));
      lines.push(`<div class="dm-meas-item">
        <div class="dm-meas-label">${ea.sym}–${ca.sym}–${eb.sym} angle</div>
        <div class="dm-meas-val">${angle.toFixed(1)}°</div>
        <div class="dm-meas-ideal">ideal: ${idealAng.toFixed(1)}°</div>
        <div class="dm-meas-bar-wrap"><div class="dm-meas-bar" style="width:${angBarW}%;background:${angColor};"></div></div>
      </div>`);
    });
  });

  box.innerHTML = lines.length ? lines.join('') :
    `<div style="padding:18px 14px;font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--text-muted);line-height:1.9;text-align:center;">
      <div style="font-size:24px;opacity:0.15;margin-bottom:8px;">📐</div>
      Add bonds to see<br>lengths &amp; angles
    </div>`;
}


// ── Templates ───────────────────────────────────────────────
function dmTplBuilder(){
  return {
    atoms: [],
    bonds: [],
    atom(sym, x, y, unique=false, eps=0.08){
      if(unique){
        const hit=this.atoms.findIndex(a=>a.sym===sym && Math.hypot(a.x-x,a.y-y)<=eps);
        if(hit>=0) return hit;
      }
      this.atoms.push({sym, x, y});
      return this.atoms.length-1;
    },
    bond(a, b, order=1){
      if(a==null || b==null || a===b) return;
      if(this.bonds.some(x=>(x.a===a&&x.b===b)||(x.a===b&&x.b===a))) return;
      this.bonds.push({a,b,order});
    }
  };
}
function dmTplRing(b, opts={}){
  const {
    n=6, radius=2.1, cx=0, cy=0, sym='C',
    rotation=-Math.PI/2, bondPattern=null,
    ellipticalY=1, unique=false
  } = opts;
  const idx=[];
  for(let i=0;i<n;i++){
    const t=rotation + i*2*Math.PI/n;
    idx.push(b.atom(sym, cx + radius*Math.cos(t), cy + radius*ellipticalY*Math.sin(t), unique));
  }
  for(let i=0;i<n;i++){
    const order=bondPattern ? bondPattern[i % bondPattern.length] : 1;
    b.bond(idx[i], idx[(i+1)%n], order);
  }
  return idx;
}
function dmTplChain(b, points, syms='C', bondOrders=null){
  const idx=points.map((p,i)=>b.atom(Array.isArray(syms)?(syms[i]||syms[syms.length-1]||'C'):syms, p.x, p.y));
  for(let i=0;i<idx.length-1;i++) b.bond(idx[i], idx[i+1], bondOrders ? (bondOrders[i]||1) : 1);
  return idx;
}
function dmTplBounds(struct){
  const xs=struct.atoms.map(a=>a.x), ys=struct.atoms.map(a=>a.y);
  return {
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minY: Math.min(...ys), maxY: Math.max(...ys)
  };
}
function dmTplNormalize(struct){
  const bounds=dmTplBounds(struct);
  const cx=(bounds.minX+bounds.maxX)/2;
  const cy=(bounds.minY+bounds.maxY)/2;
  return {
    atoms: struct.atoms.map(a=>({sym:a.sym,x:a.x-cx,y:a.y-cy})),
    bonds: struct.bonds.map(b=>({...b}))
  };
}
function dmTplInsertOffset(bounds){
  if(!dmAtoms.length) return {dx:0, dy:0};
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  dmAtoms.forEach(a=>{
    minX=Math.min(minX,a.x); maxX=Math.max(maxX,a.x);
    minY=Math.min(minY,a.y); maxY=Math.max(maxY,a.y);
  });
  const gap=Math.max(2.8, (bounds.maxX-bounds.minX)*0.18 + 2.2);
  const existingCY=(minY+maxY)/2;
  const localCY=(bounds.minY+bounds.maxY)/2;
  return { dx:maxX - bounds.minX + gap, dy:existingCY - localCY };
}
function dmAppendTemplateStructure(struct, label){
  if(!struct || !struct.atoms || !struct.atoms.length) return;
  const centered=dmTplNormalize(struct);
  const bounds=dmTplBounds(centered);
  const {dx,dy}=dmTplInsertOffset(bounds);
  const map=centered.atoms.map(a=>dmAtoms.push({
    id:dmNextId++, sym:a.sym, x:a.x+dx, y:a.y+dy, selected:false
  })-1);
  centered.bonds.forEach(b=>dmAddBond(map[b.a], map[b.b], b.order, true));
  dmZoomFit(); dmRender(); dmUpdateStats(); dmUpdateMeasurements();
  notify(`${label} template inserted`, 'success');
}

function dmBuildTemplate(name){
  const b=dmTplBuilder();
  const aromatic=[2,1,2,1,2,1];

  const makeNanotube=(symA='C', symB='C')=>{
    const cols=5, rows=4;
    const A=[...Array(rows)].map(()=>Array(cols).fill(null));
    const B=[...Array(rows)].map(()=>Array(cols).fill(null));
    const dx=2.15, dy=1.86, skew=1.08;
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const bx=(c-(cols-1)/2)*dx + (r%2?skew:0);
        const by=(r-(rows-1)/2)*dy;
        A[r][c]=b.atom(symA, bx-0.62, by-0.44);
        B[r][c]=b.atom(symB, bx+0.62, by+0.44);
      }
    }
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        b.bond(A[r][c], B[r][c], 1);
        if(c<cols-1) b.bond(B[r][c], A[r][c+1], 1);
        if(r<rows-1) b.bond(B[r][c], A[r+1][c], 1);
      }
    }
    return b;
  };

  switch(name){
    case 'water': {
      const O=b.atom('O',0,0), H1=b.atom('H',-1.25,0.88), H2=b.atom('H',1.25,0.88);
      b.bond(O,H1,1); b.bond(O,H2,1);
      return b;
    }
    case 'methane': {
      const C=b.atom('C',0,0);
      [[-1.05,-1.05],[1.05,-1.05],[1.05,1.05],[-1.05,1.05]].forEach(([x,y])=>{
        const H=b.atom('H',x,y); b.bond(C,H,1);
      });
      return b;
    }
    case 'ammonia': {
      const N=b.atom('N',0,0);
      [[-1.18,0.82],[1.18,0.82],[0,-1.28]].forEach(([x,y])=>{
        const H=b.atom('H',x,y); b.bond(N,H,1);
      });
      return b;
    }
    case 'ring5':
      dmTplRing(b,{n:5,radius:2.0,sym:'C'});
      return b;
    case 'ring6':
      dmTplRing(b,{n:6,radius:2.1,sym:'C'});
      return b;
    case 'benzene':
      dmTplRing(b,{n:6,radius:2.1,sym:'C',bondPattern:aromatic});
      return b;

    case 'fullerene': {
      const outer=dmTplRing(b,{n:10,radius:4.1,sym:'C',rotation:-Math.PI/2+Math.PI/10});
      const inner=dmTplRing(b,{n:10,radius:2.55,sym:'C',rotation:-Math.PI/2});
      const core=dmTplRing(b,{n:5,radius:1.05,sym:'C'});
      outer.forEach((id,i)=>b.bond(id, inner[i], 1));
      inner.forEach((id,i)=>{
        b.bond(id, core[Math.floor(i/2)%core.length], 1);
        if(i%2===0) b.bond(id, core[(Math.floor(i/2)+1)%core.length], 1);
      });
      return b;
    }
    case 'fullerenol': {
      const shell=dmBuildTemplate('fullerene');
      shell.atoms.forEach(a=>b.atoms.push({...a}));
      shell.bonds.forEach(x=>b.bonds.push({...x}));
      const bounds=dmTplBounds(shell);
      const shellCenter={x:(bounds.minX+bounds.maxX)/2, y:(bounds.minY+bounds.maxY)/2};
      const pick=[0,2,4,6,8,9];
      pick.forEach(i=>{
        const base=b.atoms[i];
        const vx=base.x-shellCenter.x, vy=base.y-shellCenter.y;
        const mag=Math.hypot(vx,vy)||1;
        const O=b.atom('O', base.x + vx/mag*1.25, base.y + vy/mag*1.25);
        const H=b.atom('H', base.x + vx/mag*2.1,  base.y + vy/mag*2.1);
        b.bond(i,O,1); b.bond(O,H,1);
      });
      return b;
    }
    case 'nanotube':
      return makeNanotube('C','C');
    case 'bn_nanotube':
      return makeNanotube('B','N');

    case 'borospherene': {
      const outer=dmTplRing(b,{n:12,radius:4.0,sym:'B',rotation:-Math.PI/2+Math.PI/12});
      const inner=dmTplRing(b,{n:6,radius:2.0,sym:'B',rotation:-Math.PI/2});
      const core=b.atom('B',0,0);
      outer.forEach((id,i)=>b.bond(id, inner[Math.floor(i/2)%inner.length], 1));
      inner.forEach((id,i)=>{
        b.bond(id, core, 1);
        b.bond(id, outer[(i*2+1)%outer.length], 1);
      });
      return b;
    }
    case 'dodecahedrane': {
      const outer=dmTplRing(b,{n:5,radius:4.2,sym:'C'});
      const mid=dmTplRing(b,{n:10,radius:2.75,sym:'C',rotation:-Math.PI/2+Math.PI/10});
      const inner=dmTplRing(b,{n:5,radius:1.08,sym:'C'});
      outer.forEach((id,i)=>b.bond(id, mid[(i*2)%mid.length], 1));
      inner.forEach((id,i)=>b.bond(id, mid[(i*2+1)%mid.length], 1));
      return b;
    }
    case 'cubane': {
      const front=[[-2.2,-2.2],[0.4,-2.2],[0.4,0.4],[-2.2,0.4]].map(([x,y])=>b.atom('C',x,y));
      const back=[[-0.9,-0.9],[1.7,-0.9],[1.7,1.7],[-0.9,1.7]].map(([x,y])=>b.atom('C',x,y));
      for(let i=0;i<4;i++){ b.bond(front[i], front[(i+1)%4],1); b.bond(back[i], back[(i+1)%4],1); b.bond(front[i], back[i],1); }
      return b;
    }
    case 'prismane': {
      const front=[[0,-2.4],[-2.1,1.0],[2.1,1.0]].map(([x,y])=>b.atom('C',x,y));
      const back=[[0,-0.7],[-2.1,2.7],[2.1,2.7]].map(([x,y])=>b.atom('C',x,y));
      for(let i=0;i<3;i++){ b.bond(front[i], front[(i+1)%3],1); b.bond(back[i], back[(i+1)%3],1); b.bond(front[i], back[i],1); }
      return b;
    }
    case 'propellane': {
      const top=b.atom('C',0,-2.05), bottom=b.atom('C',0,2.05);
      const left=b.atom('C',-2.1,0), right=b.atom('C',2.1,0), mid=b.atom('C',0,0);
      b.bond(top,bottom,1);
      [left,right,mid].forEach(x=>{ b.bond(top,x,1); b.bond(bottom,x,1); });
      return b;
    }
    case 'helicene': {
      const r=1.25, rt=-Math.PI/2;
      const dx=Math.sqrt(3)*r, diagx=Math.sqrt(3)*r/2, dy=1.5*r;
      const centers=[
        {x:-4.4,y:-1.9},
        {x:-4.4+dx,y:-1.9},
        {x:-4.4+dx+diagx,y:-1.9+dy},
        {x:-4.4+dx+diagx+dx,y:-1.9+dy},
        {x:-4.4+dx+diagx+dx+diagx,y:-1.9+2*dy}
      ];
      centers.forEach(c=>dmTplRing(b,{n:6,radius:r,cx:c.x,cy:c.y,sym:'C',rotation:rt,bondPattern:aromatic,unique:true}));
      return b;
    }
    case 'mobius': {
      const ring=dmTplRing(b,{n:12,radius:4.0,sym:'C',rotation:-Math.PI/2+Math.PI/12,bondPattern:[2,1]});
      b.bond(ring[1], ring[7], 1);
      b.bond(ring[4], ring[10], 1);
      return b;
    }
    case 'molecular_tweezers': {
      const left=dmTplRing(b,{n:6,radius:1.7,cx:-3.0,cy:-0.2,sym:'C',rotation:-Math.PI/2,bondPattern:aromatic});
      const right=dmTplRing(b,{n:6,radius:1.7,cx:3.0,cy:-0.2,sym:'C',rotation:-Math.PI/2,bondPattern:aromatic});
      const bridge=dmTplChain(b,[{x:-1.55,y:1.35},{x:-0.8,y:2.55},{x:0,y:3.15},{x:0.8,y:2.55},{x:1.55,y:1.35}],'C');
      b.bond(left[2], bridge[0],1); b.bond(right[4], bridge[bridge.length-1],1);
      return b;
    }
    case 'catenane': {
      dmTplRing(b,{n:10,radius:2.6,cx:-1.95,cy:0,sym:'C',rotation:-Math.PI/2+Math.PI/10,ellipticalY:0.78});
      dmTplRing(b,{n:10,radius:2.6,cx:1.95,cy:0,sym:'C',rotation:-Math.PI/2,ellipticalY:0.78});
      return b;
    }
    case 'rotaxane': {
      const chain=dmTplChain(b,
        [{x:-5.8,y:0},{x:-4.2,y:0},{x:-2.6,y:0},{x:-1.0,y:0},{x:0.6,y:0},{x:2.2,y:0},{x:3.8,y:0},{x:5.4,y:0}],
        'C');
      const leftStop=dmTplRing(b,{n:6,radius:1.55,cx:-7.7,cy:0,sym:'C',rotation:-Math.PI/2,bondPattern:aromatic});
      const rightStop=dmTplRing(b,{n:6,radius:1.55,cx:7.7,cy:0,sym:'C',rotation:-Math.PI/2,bondPattern:aromatic});
      b.bond(leftStop[2], chain[0], 1); b.bond(chain[chain.length-1], rightStop[4], 1);
      dmTplRing(b,{n:10,radius:3.0,cx:0.2,cy:0,sym:'C',rotation:-Math.PI/2+Math.PI/10,ellipticalY:0.72});
      return b;
    }
    case 'cryptand': {
      const top=b.atom('N',0,-3.15), bottom=b.atom('N',0,3.15);
      const left=[b.atom('O',-1.7,-1.95), b.atom('C',-2.7,0), b.atom('O',-1.7,1.95)];
      const mid=[b.atom('C',0,-1.25), b.atom('O',0,0), b.atom('C',0,1.25)];
      const right=[b.atom('O',1.7,-1.95), b.atom('C',2.7,0), b.atom('O',1.7,1.95)];
      [left,mid,right].forEach(path=>{
        b.bond(top,path[0],1); b.bond(path[0],path[1],1); b.bond(path[1],path[2],1); b.bond(path[2],bottom,1);
      });
      return b;
    }
    case 'molecular_motor': {
      const leftAx=b.atom('C',-1.1,0), rightAx=b.atom('C',1.1,0);
      b.bond(leftAx,rightAx,2);
      const leftRing=dmTplRing(b,{n:5,radius:1.8,cx:-3.7,cy:-0.8,sym:'C',rotation:-Math.PI/2});
      const rightRing=dmTplRing(b,{n:5,radius:1.8,cx:3.7,cy:0.8,sym:'C',rotation:-Math.PI/2});
      b.bond(leftAx,leftRing[1],1); b.bond(leftAx,leftRing[2],1);
      b.bond(rightAx,rightRing[4],1); b.bond(rightAx,rightRing[3],1);
      b.bond(leftRing[4], b.atom('C',-5.8,-1.5),1);
      b.bond(rightRing[1], b.atom('C',5.8,1.5),1);
      return b;
    }
    case 'enzyme': {
      const backbone=[];
      const n=6;
      for(let i=0;i<n;i++){
        const x=i*2.45-6.2;
        const N=b.atom('N',x, Math.sin(i*0.82)*0.55);
        const CA=b.atom('C',x+0.82, Math.sin(i*0.82+0.35)*1.05);
        const C=b.atom('C',x+1.64, Math.sin(i*0.82+0.78)*0.35);
        const O=b.atom('O',x+2.18, Math.sin(i*0.82+0.95)-1.15);
        b.bond(N,CA,1); b.bond(CA,C,1); b.bond(C,O,2);
        if(backbone.length) b.bond(backbone[backbone.length-1].C, N, 1);
        backbone.push({N,CA,C});
        const side=b.atom('C',x+0.75, Math.sin(i*0.82+0.35)*1.05 + (i%2===0?1.55:-1.55));
        b.bond(CA,side,1);
      }
      return b;
    }
    case 'dendrimer': {
      const root=b.atom('N',0,0);
      const level1=[[0,-2.2],[-2.05,1.45],[2.05,1.45]].map(([x,y])=>b.atom('C',x,y));
      level1.forEach(id=>b.bond(root,id,1));
      const branches=[
        [{x:-0.95,y:-4.15,s:'N'},{x:0.95,y:-4.15,s:'N'}],
        [{x:-4.0,y:2.8,s:'N'},{x:-2.55,y:4.55,s:'N'}],
        [{x:4.0,y:2.8,s:'N'},{x:2.55,y:4.55,s:'N'}]
      ];
      level1.forEach((parent,i)=>{
        branches[i].forEach(p=>{
          const child=b.atom(p.s,p.x,p.y);
          b.bond(parent,child,1);
        });
      });
      return b;
    }
    case 'mxene': {
      const tiTop=[-2.6,0,2.6].map(x=>b.atom('Ti',x,-1.5));
      const tiBot=[-2.6,0,2.6].map(x=>b.atom('Ti',x,1.5));
      const carb=[-1.3,1.3].map(x=>b.atom('C',x,0));
      const oxTop=[-1.3,1.3].map(x=>b.atom('O',x,-2.8));
      const oxBot=[-1.3,1.3].map(x=>b.atom('O',x,2.8));
      tiTop.forEach((id,i)=>{ if(i<tiTop.length-1) b.bond(id, tiTop[i+1], 1); });
      tiBot.forEach((id,i)=>{ if(i<tiBot.length-1) b.bond(id, tiBot[i+1], 1); });
      carb.forEach((cid,i)=>{
        b.bond(cid, tiTop[i],1); b.bond(cid, tiTop[i+1],1);
        b.bond(cid, tiBot[i],1); b.bond(cid, tiBot[i+1],1);
        b.bond(cid, oxTop[i],1); b.bond(cid, oxBot[i],1);
      });
      return b;
    }
    case 'mof': {
      const tl=b.atom('Zn',-4.2,-4.2), tr=b.atom('Zn',4.2,-4.2), br=b.atom('Zn',4.2,4.2), bl=b.atom('Zn',-4.2,4.2);
      const topO1=b.atom('O',-2.8,-4.2), topC1=b.atom('C',-1.3,-4.2), topC2=b.atom('C',1.3,-4.2), topO2=b.atom('O',2.8,-4.2);
      const rightO1=b.atom('O',4.2,-2.8), rightC1=b.atom('C',4.2,-1.3), rightC2=b.atom('C',4.2,1.3), rightO2=b.atom('O',4.2,2.8);
      const bottomO1=b.atom('O',2.8,4.2), bottomC1=b.atom('C',1.3,4.2), bottomC2=b.atom('C',-1.3,4.2), bottomO2=b.atom('O',-2.8,4.2);
      const leftO1=b.atom('O',-4.2,2.8), leftC1=b.atom('C',-4.2,1.3), leftC2=b.atom('C',-4.2,-1.3), leftO2=b.atom('O',-4.2,-2.8);
      [[tl,topO1],[topO1,topC1],[topC1,topC2],[topC2,topO2],[topO2,tr],
       [tr,rightO1],[rightO1,rightC1],[rightC1,rightC2],[rightC2,rightO2],[rightO2,br],
       [br,bottomO1],[bottomO1,bottomC1],[bottomC1,bottomC2],[bottomC2,bottomO2],[bottomO2,bl],
       [bl,leftO1],[leftO1,leftC1],[leftC1,leftC2],[leftC2,leftO2],[leftO2,tl]].forEach(([a1,a2])=>b.bond(a1,a2,1));
      const center=dmTplRing(b,{n:6,radius:1.55,cx:0,cy:0,sym:'C',rotation:-Math.PI/2,bondPattern:aromatic});
      [center[0],center[1],center[3],center[4]].forEach((id,i)=>b.bond(id, [tl,tr,br,bl][i], 1));
      return b;
    }
    default:
      return null;
  }
}

const dmTemplateRegistry = [
  {id:'benzene', label:'Benzene', icon:'⬡', category:'Organic', desc:'Aromatic six-membered ring', featured:true},
  {id:'ring5', label:'Ring 5', icon:'⬠', category:'Organic', desc:'Five-membered carbocycle'},
  {id:'ring6', label:'Ring 6', icon:'⬢', category:'Organic', desc:'Six-membered carbocycle'},
  {id:'water', label:'Water', icon:'💧', category:'Organic', desc:'Bent H₂O geometry'},
  {id:'methane', label:'Methane', icon:'✦', category:'Organic', desc:'Tetrahedral carbon sketch'},
  {id:'ammonia', label:'Ammonia', icon:'🜁', category:'Organic', desc:'Trigonal pyramidal NH₃'},
  {id:'cubane', label:'Cubane', icon:'🧊', category:'Cages', desc:'Strained cubic hydrocarbon', featured:true},
  {id:'prismane', label:'Prismane', icon:'△', category:'Cages', desc:'Triangular prism cage'},
  {id:'propellane', label:'Propellane', icon:'✣', category:'Cages', desc:'Compact bridgehead scaffold'},
  {id:'dodecahedrane', label:'Dodecahedrane', icon:'⬟', category:'Cages', desc:'Polyhedral carbon cage', featured:true},
  {id:'fullerene', label:'Fullerene', icon:'⚽', category:'Carbon & Boron', desc:'Cage-like carbon starter', featured:true},
  {id:'fullerenol', label:'Fullerenol', icon:'💠', category:'Carbon & Boron', desc:'Hydroxylated fullerene motif'},
  {id:'nanotube', label:'Nanotube', icon:'🧵', category:'Carbon & Boron', desc:'Honeycomb tube segment', featured:true},
  {id:'bn_nanotube', label:'BN Nanotube', icon:'🌀', category:'Carbon & Boron', desc:'Alternating B/N tube strip'},
  {id:'borospherene', label:'Borospherene', icon:'◌', category:'Carbon & Boron', desc:'Boron cage-inspired motif'},
  {id:'helicene', label:'Helicene', icon:'🜭', category:'Carbon & Boron', desc:'Fused aromatic helix starter'},
  {id:'mobius', label:'Möbius Molecule', icon:'∞', category:'Carbon & Boron', desc:'Twisted conjugated macrocycle'},
  {id:'catenane', label:'Catenane', icon:'⛓', category:'Supramolecular', desc:'Interlocked macrocycles', featured:true},
  {id:'rotaxane', label:'Rotaxane', icon:'🪢', category:'Supramolecular', desc:'Axle through macrocycle', featured:true},
  {id:'molecular_tweezers', label:'Molecular Tweezers', icon:'🗜', category:'Supramolecular', desc:'Host-guest clamp motif'},
  {id:'cryptand', label:'Cryptand', icon:'⌬', category:'Supramolecular', desc:'Three-bridge cage host'},
  {id:'molecular_motor', label:'Molecular Motor', icon:'↻', category:'Supramolecular', desc:'Overcrowded-alkene-inspired rotor'},
  {id:'enzyme', label:'Enzyme', icon:'🧬', category:'Bio & Polymer', desc:'Peptide backbone pocket starter', featured:true},
  {id:'dendrimer', label:'Dendrimer', icon:'🌿', category:'Bio & Polymer', desc:'Branched generation scaffold'},
  {id:'mxene', label:'MXene', icon:'▦', category:'Materials & Frameworks', desc:'Layered Ti/C/O fragment', featured:true},
  {id:'mof', label:'MOF', icon:'▣', category:'Materials & Frameworks', desc:'Metal-organic framework cell', featured:true}
];
function dmTemplateCategories(){
  return ['All','Featured', ...Array.from(new Set(dmTemplateRegistry.map(t=>t.category)))];
}
function dmInitTemplatePalette(){
  const sel=document.getElementById('dmTemplateCategory');
  const grid=document.getElementById('dmTemplateGrid');
  if(!sel || !grid) return;
  if(sel.dataset.ready!=='1'){
    sel.innerHTML = dmTemplateCategories().map(cat=>`<option value="${cat}">${cat}</option>`).join('');
    sel.value='Featured';
    sel.dataset.ready='1';
  }
  dmRenderTemplatePalette();
}
function dmRenderTemplatePalette(){
  const sel=document.getElementById('dmTemplateCategory');
  const search=document.getElementById('dmTemplateSearch');
  const grid=document.getElementById('dmTemplateGrid');
  const meta=document.getElementById('dmTemplateMeta');
  if(!sel || !grid) return;
  const cat=(sel.value||'Featured').toLowerCase();
  const q=(search?.value||'').trim().toLowerCase();
  const list=dmTemplateRegistry.filter(t=>{
    const passCat = cat==='all' ? true : cat==='featured' ? !!t.featured : t.category.toLowerCase()===cat;
    const hay=[t.label,t.category,t.desc].join(' ').toLowerCase();
    return passCat && (!q || hay.includes(q));
  });
  if(meta) meta.innerHTML = `<strong>${list.length}</strong> template${list.length===1?'':'s'}`;
  if(!list.length){
    grid.innerHTML = `<div class="dm-template-empty">No templates match this filter.<br>Try another category or a less fussy search term.</div>`;
    return;
  }
  grid.innerHTML = list.map(t=>`
    <button class="dm-template-card ${t.featured?'featured':''} ${(t.featured && ['Benzene','Fullerene','Nanotube','MOF','Enzyme','Dodecahedrane','Catenane','Rotaxane'].includes(t.label))?'wide':''}"
            onclick="dmInsertTemplate('${t.id}')" title="${t.desc}">
      <span class="dm-template-card-icon">${t.icon}</span>
      <span class="dm-template-card-title">${t.label}</span>
      <span class="dm-template-card-desc">${t.desc}</span>
      <span class="dm-template-card-tag">${t.category}</span>
    </button>
  `).join('');
}
function dmInsertTemplate(name){
  const tpl=dmTemplateRegistry.find(t=>t.id===name);
  if(!tpl) return notify('Template not found','error');
  const struct=dmBuildTemplate(name);
  if(!struct || !struct.atoms?.length) return notify('Template failed to build','error');
  dmSaveHistory();
  dmAppendTemplateStructure(struct, tpl.label);
}


// ── Auto-add Hydrogens by valence ────────────────────────────
function dmAddHydrogens(){
  dmSaveHistory();
  for(let i=0;i<dmAtoms.length;i++){
    const a=dmAtoms[i];
    if(a.sym==='H') continue;
    const val=getValence(a.sym);
    let used=0;
    dmBonds.forEach(b=>{ if(b.a===i||b.b===i) used+=b.order||1; });
    const need=Math.max(0,Math.round(val-used));
    for(let h=0;h<need;h++){
      const pos=dmIdealPos(a,null,null);
      // Avoid overlap
      const clash=dmAtoms.find(x=>x!==a&&Math.sqrt((x.x-pos.x)**2+(x.y-pos.y)**2)<0.35);
      if(!clash){
        const H=dmAddAtom(pos.x,pos.y,'H',true);
        dmAddBond(i,dmAtoms.indexOf(H),1,true);
      }
    }
  }
  dmRender(); dmUpdateStats(); dmUpdateMeasurements();
  notify('Hydrogens added by valence','success');
}

// ── Layout optimizer (force-directed) ───────────────────────
function dmOptimize(){
  const n=dmAtoms.length; if(n<2) return;
  const iters=150;
  for(let iter=0;iter<iters;iter++){
    const fx=new Float64Array(n), fy=new Float64Array(n);
    // Bond spring forces
    dmBonds.forEach(b=>{
      const a=dmAtoms[b.a],bb=dmAtoms[b.b];
      const dx=bb.x-a.x,dy=bb.y-a.y,d=Math.sqrt(dx*dx+dy*dy)||0.001;
      const ideal=BOND_LENGTHS.getBondLength(a.sym,bb.sym,b.order)*1.5;
      const f=(d-ideal)*0.12;
      fx[b.a]+=f*dx/d; fy[b.a]+=f*dy/d;
      fx[b.b]-=f*dx/d; fy[b.b]-=f*dy/d;
    });
    // Repulsion
    for(let i=0;i<n;i++) for(let j=i+1;j<n;j++){
      const dx=dmAtoms[j].x-dmAtoms[i].x,dy=dmAtoms[j].y-dmAtoms[i].y;
      const d2=dx*dx+dy*dy||0.001, d=Math.sqrt(d2);
      const f=0.8/(d2);
      fx[i]-=f*dx/d; fy[i]-=f*dy/d;
      fx[j]+=f*dx/d; fy[j]+=f*dy/d;
    }
    const cool=1-iter/iters;
    dmAtoms.forEach((a,i)=>{ a.x+=Math.max(-0.3,Math.min(0.3,fx[i]*cool)); a.y+=Math.max(-0.3,Math.min(0.3,fy[i]*cool)); });
  }
  dmRender(); dmUpdateMeasurements();
  notify('Layout optimized','success');
}

// ── Zoom fit ────────────────────────────────────────────────
function dmZoomFit(){
  if(!dmCanvasEl||!dmAtoms.length) return;
  const W=dmCanvasEl.width, H=dmCanvasEl.height;
  const pad=60;
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  dmAtoms.forEach(a=>{ minX=Math.min(minX,a.x);maxX=Math.max(maxX,a.x);minY=Math.min(minY,a.y);maxY=Math.max(maxY,a.y); });
  const dX=maxX-minX||1, dY=maxY-minY||1;
  const s=Math.min((W-pad*2)/dX,(H-pad*2)/dY,300);
  dmScale=s;
  dmOffX=W/2-((minX+maxX)/2)*s;
  dmOffY=H/2-((minY+maxY)/2)*s;
  dmRender();
}

// ── 3D coordinate generation & send to viewer ────────────────
function dmSendToViewer(){
  if(!dmAtoms.length) return notify('Draw some atoms first','error');
  // Convert 2D to 3D: lay flat in XY plane, add slight z variation
  const atoms3d=dmAtoms.map((a,i)=>({
    symbol: a.sym,
    x: a.x,   // Å (1.5 drawing units per Å)
    y: -a.y,  // flip Y (canvas Y is down, chemistry Y is up)
    z: 0,
    idx: i
  }));
  // Normalize scale from drawing units to Å
  const SCALE=1/1.5;
  atoms3d.forEach(a=>{ a.x*=SCALE; a.y*=SCALE; });

  // Add slight Z stagger for rings (improves 3D appearance)
  dmBonds.forEach(b=>{
    const a=atoms3d[b.a],bb=atoms3d[b.b];
    if(a&&bb){ a.z+=(Math.random()-0.5)*0.05; bb.z+=(Math.random()-0.5)*0.05; }
  });

  const bonds3d=dmBonds.map(b=>({a:b.a,b:b.b,order:b.order,type:'covalent'}));
  const mol={atoms:atoms3d,bonds:bonds3d};
  const name=`Drawn Molecule (${dmAtoms.length} atoms)`;
  closeDrawModal();
  loadMolecule(name,mol);
  notify('Molecule sent to 3D viewer','success');
}

// Init draw modal element list on page load
window.addEventListener('DOMContentLoaded',()=>{ try{updateDatabaseUI();}catch(_){} updateSidebarToggleUI(); try{dmInitTemplatePalette();}catch(_){} /* lazy init */ });

