/* ═══════════════════════════════════════════════════════
   Render Full — MogadocLab
   ═══════════════════════════════════════════════════════ */

// PATCH RENDER — wire in color schemes + measurement highlights
// + focus/isolate dimming + hover highlight from atom list
// ═══════════════════════════════════════════════════════════
function _renderFull(){
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  if(!molecule||!molecule.atoms.length)return;
  const _dpr=window._pubDPR??window.devicePixelRatio;
  const cx=W/2,cy=H/2,scale=molecule.scale*zoom*_dpr;
  const M=mat3Mul(mat3RotY(rotY),mat3RotX(rotX));
  molecule.atoms.forEach(a=>{a._proj=mat3Vec(M,[a.x,a.y,a.z]);});
  let maxZ=0;molecule.atoms.forEach(a=>{if(Math.abs(a._proj[2])>maxZ)maxZ=Math.abs(a._proj[2]);});
  const atomScale=parseFloat(document.getElementById('atomScale').value);
  const bWidth=parseFloat(document.getElementById('bondWidth').value)*_dpr;
  const fog=parseFloat(document.getElementById('depthFog').value);
  const glow=parseFloat(document.getElementById('glowAmt').value);
  const sorted=[...molecule.atoms].sort((a,b)=>a._proj[2]-b._proj[2]);
  const lightTheme=document.documentElement.getAttribute('data-theme')==='arctic';

  function colorLuma(hex){
    if(!hex||hex[0]!=='#'||hex.length<7) return 0.5;
    const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
    return 0.2126*r+0.7152*g+0.0722*b;
  }

  // ─── BONDS ────────────────────────────────────────────────
  if(viewMode!=='spacefill'){
    molecule.bonds.forEach(bond=>{
      const ai=molecule.atoms[bond.a],aj=molecule.atoms[bond.b];if(!ai||!aj)return;
      if(isAtomHidden?.(bond.a)||isAtomHidden?.(bond.b)) return;
      const btype=bond.type||'covalent';
      const order=bond.order||1;

      // Visibility gates
      if(btype==='hydrogen'&&!showHBonds) return;
      if(btype==='ionic'&&!showIonicBonds) return;
      if(btype==='vdw'&&!showVdwBonds) return;

      const pi=project(ai,cx,cy,scale),pj=project(aj,cx,cy,scale);
      const fogF=Math.max(0,Math.min(1,1-fog*(-(ai._proj[2]+aj._proj[2])/2/(molecule.scale*2+1))));
      let alpha=0.3+0.7*fogF;
      if(focusedAtoms&&!focusedAtoms.has(bond.a)&&!focusedAtoms.has(bond.b))alpha*=0.12;
      const isSelectedBond = selectedBond!==null && molecule.bonds[selectedBond]===bond;
      if(isSelectedBond) alpha=Math.min(1, alpha+0.3);

      const dx=pj.sx-pi.sx, dy=pj.sy-pi.sy, len=Math.sqrt(dx*dx+dy*dy);
      if(len<0.5){return;}
      const nx=-dy/len, ny=dx/len; // perpendicular unit vector

      ctx.save();
      ctx.lineCap='round';

      // ── Helper: draw one stroke ──────────────────────────
      function stroke1(ox,oy, lw, style, dash=[]){
        ctx.lineWidth=lw;
        ctx.strokeStyle=style;
        ctx.setLineDash(dash);
        ctx.beginPath();
        ctx.moveTo(pi.sx+ox,pi.sy+oy);
        ctx.lineTo(pj.sx+ox,pj.sy+oy);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ── Bond colour helpers ──────────────────────────────
      const lightBg=window._pubshotLightBg;
      function baseBondCol(a){
        if(bondStyleMode==='gradient') return null; // handled separately
        if(bondStyleMode==='uniform') return lightBg?`rgba(80,90,110,${a*0.9})`:`rgba(180,190,210,${a*0.75})`;
        return lightBg?`rgba(50,70,100,${a*0.85})`:`rgba(160,190,220,${a*0.55})`;
      }
      function gradientBond(a){
        const g=ctx.createLinearGradient(pi.sx,pi.sy,pj.sx,pj.sy);
        g.addColorStop(0,hexAlpha(getAtomDisplayColor(ai),a));
        g.addColorStop(1,hexAlpha(getAtomDisplayColor(aj),a));
        return g;
      }
      function bondColor(a){
        if(viewMode==='wireframe'||bondStyleMode==='gradient') return gradientBond(a);
        return baseBondCol(a);
      }

      // ════════════════════════════════════════════════════
      // DRAW BY BOND TYPE
      // ════════════════════════════════════════════════════
      if(btype==='hydrogen'){
        // ── Hydrogen bond: fine dotted line, cyan/blue tint ─
        const col=lightBg?`rgba(0,100,200,${alpha*0.7})`:`rgba(100,200,255,${alpha*0.75})`;
        stroke1(0,0, bWidth*0.7, col, [3*_dpr,4*_dpr]);

      } else if(btype==='ionic'){
        // ── Ionic bond: coarse dash-dot, amber/gold tint ────
        const col=lightBg?`rgba(160,100,0,${alpha*0.8})`:`rgba(255,200,80,${alpha*0.8})`;
        stroke1(0,0, bWidth*1.0, col, [6*_dpr,3*_dpr,1.5*_dpr,3*_dpr]);

      } else if(btype==='metallic'){
        // ── Metallic bond: thick solid + thin highlight ─────
        const col=lightBg?`rgba(80,80,100,${alpha*0.9})`:`rgba(200,210,230,${alpha*0.7})`;
        stroke1(0,0, bWidth*1.8, col);
        stroke1(0,0, bWidth*0.5, lightBg?`rgba(255,255,255,${alpha*0.5})`:`rgba(255,255,255,${alpha*0.35})`);

      } else if(btype==='vdw'){
        // ── vdW contact: very faint long-dash ───────────────
        const col=lightBg?`rgba(100,100,120,${alpha*0.35})`:`rgba(140,160,190,${alpha*0.3})`;
        stroke1(0,0, bWidth*0.5, col, [2*_dpr,6*_dpr]);

      } else if(btype==='amide'){
        // ── Amide bond: solid + thin parallel phantom line ──
        const col=bondColor(alpha);
        stroke1(0,0, bWidth, col);
        const off=3.5*_dpr;
        ctx.globalAlpha=alpha*0.35;
        stroke1(nx*off,ny*off, bWidth*0.6, col);
        ctx.globalAlpha=1;

      } else if(btype==='aromatic'||order===1.5){
        // ── Aromatic/resonance bond: solid + dashed partner ─
        const col=bondColor(alpha);
        const off=3.5*_dpr;
        stroke1(-nx*off,-ny*off, bWidth, col);
        const resonCol=lightBg?`rgba(80,120,200,${alpha*0.7})`:`rgba(120,180,255,${alpha*0.65})`;
        stroke1( nx*off, ny*off, bWidth*0.9, resonCol, [4*_dpr,3*_dpr]);

      } else {
        // ── Covalent bonds: single / double / triple ────────
        if(viewMode==='wireframe'){
          stroke1(0,0, bWidth*1.6, bondColor(alpha));
        } else if(order===1){
          stroke1(0,0, bWidth, bondColor(alpha));
        } else if(order===2){
          const off=3.5*_dpr;
          stroke1(-nx*off,-ny*off, bWidth, bondColor(alpha));
          stroke1( nx*off, ny*off, bWidth, bondColor(alpha));
        } else if(order>=3){
          // Triple: centre + two flanking
          stroke1(0,0, bWidth, bondColor(alpha));
          const off=5*_dpr;
          stroke1(-nx*off,-ny*off, bWidth*0.8, bondColor(alpha*0.7));
          stroke1( nx*off, ny*off, bWidth*0.8, bondColor(alpha*0.7));
        }
      }

      ctx.restore();

      if(isSelectedBond){
        ctx.save();
        ctx.lineCap='round';
        ctx.strokeStyle='rgba(0,217,255,0.9)';
        ctx.lineWidth=Math.max(3*_dpr,bWidth*1.8);
        ctx.beginPath();
        ctx.moveTo(pi.sx,pi.sy);
        ctx.lineTo(pj.sx,pj.sy);
        ctx.stroke();
        ctx.strokeStyle='rgba(255,255,255,0.45)';
        ctx.lineWidth=Math.max(1.2*_dpr,bWidth*0.6);
        ctx.beginPath();
        ctx.moveTo(pi.sx,pi.sy);
        ctx.lineTo(pj.sx,pj.sy);
        ctx.stroke();
        ctx.restore();
      }
    });
  }

  // draw measurement lines between selected atoms
  if(measureMode&&measureAtoms.length>1){
    ctx.save();
    const mColors=['#00d9ff','#f97316','#10b981','#f59e0b'];
    for(let i=0;i<measureAtoms.length-1;i++){
      const ai=molecule.atoms[measureAtoms[i]],aj=molecule.atoms[measureAtoms[i+1]];
      const pi=project(ai,cx,cy,scale),pj=project(aj,cx,cy,scale);
      ctx.setLineDash([5*_dpr,4*_dpr]);
      ctx.strokeStyle=mColors[i]||'#fff'; ctx.lineWidth=1.5*_dpr;
      ctx.beginPath();ctx.moveTo(pi.sx,pi.sy);ctx.lineTo(pj.sx,pj.sy);ctx.stroke();
    }
    ctx.setLineDash([]);ctx.restore();
  }

  // — ATOMS —
  sorted.forEach(a=>{
    if(isAtomHidden?.(a.idx)) return;
    const pi=project(a,cx,cy,scale),el=getElement(a.symbol);
    const fogF=Math.max(0,Math.min(1,1-fog*(-a._proj[2]/(molecule.scale*2+1))));
    let alpha=0.5+0.5*fogF;
    // dim non-focused atoms
    if(focusedAtoms&&!focusedAtoms.has(a.idx))alpha*=0.15;
    // On light/transparent backgrounds boost base alpha so atoms stay fully opaque
    if(window._pubshotLightBg) alpha=Math.max(alpha, 0.92);
    let baseR;
    if     (viewMode==='spacefill') baseR=el.r*90*atomScale*pi.d;
    else if(viewMode==='wireframe'||viewMode==='stick') baseR=0;
    else if(viewMode==='cartoon')   baseR=el.symbol==='C'?6*atomScale*pi.d*_dpr:4*atomScale*pi.d*_dpr;
    else                            baseR=el.r*40*atomScale*pi.d;
    a._screenX=pi.sx; a._screenY=pi.sy; a._screenR=baseR;
    const displayColor=getAtomDisplayColor(a);
    if(baseR<0.5){
      // Sub-pixel atom — draw a minimum-size dot so it never disappears in
      // exports or at extreme atom-size / perspective settings. Skip the
      // radial gradient and glow for performance.
      ctx.beginPath();
      ctx.arc(pi.sx,pi.sy,Math.max(0.8,baseR),0,Math.PI*2);
      ctx.fillStyle=hexAlpha(displayColor,Math.min(1,alpha+0.3));
      ctx.fill();
      return;
    }
    // Suppress glow on light/transparent BG — glow fades to transparent black which hazes light BGs
    if(glow>0.05&&viewMode!=='wireframe'&&!window._pubshotLightBg){
      const glowR=baseR*(1.5+glow*1.5),grad=ctx.createRadialGradient(pi.sx,pi.sy,baseR*0.5,pi.sx,pi.sy,glowR);
      grad.addColorStop(0,hexAlpha(displayColor,alpha*glow*0.6));grad.addColorStop(1,'rgba(0,0,0,0)');
      ctx.beginPath();ctx.arc(pi.sx,pi.sy,glowR,0,Math.PI*2);ctx.fillStyle=grad;ctx.fill();
    }
    // On light BGs: use fully opaque fill without the semi-transparent rim falloff
    const rimAlpha = window._pubshotLightBg ? alpha : alpha*0.2;
    const sg=ctx.createRadialGradient(pi.sx-baseR*0.3,pi.sy-baseR*0.3,baseR*0.05,pi.sx,pi.sy,baseR);
    sg.addColorStop(0,hexAlpha(displayColor,Math.min(1,alpha+0.3)));
    sg.addColorStop(0.5,shadedColor(displayColor,a._proj[2],maxZ,alpha));
    sg.addColorStop(1,hexAlpha(displayColor,rimAlpha));
    ctx.beginPath();ctx.arc(pi.sx,pi.sy,baseR,0,Math.PI*2);ctx.fillStyle=sg;ctx.fill();
    if(showLabels&&baseR>3){
      const fontSize=Math.max(10,baseR*0.78);
      const luma=colorLuma(displayColor);
      const useDarkLabel = window._pubshotLightBg || lightTheme || luma > 0.72;
      ctx.save();
      ctx.font=`bold ${fontSize}px "JetBrains Mono",monospace`;
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      ctx.lineJoin='round';
      ctx.lineWidth=Math.max(2,_dpr*2.4);
      ctx.strokeStyle=useDarkLabel?`rgba(255,255,255,${Math.min(0.98, alpha)})`:`rgba(4,9,15,${Math.min(0.92, alpha)})`;
      ctx.fillStyle=useDarkLabel?`rgba(10,18,28,${Math.min(0.95, alpha)})`:`rgba(248,251,255,${Math.min(0.98, alpha)})`;
      ctx.strokeText(a.symbol,pi.sx,pi.sy);
      ctx.fillText(a.symbol,pi.sx,pi.sy);
      ctx.restore();
    }
    // hover highlight from atom list
    if(highlightedAtom===a.idx){
      ctx.beginPath();ctx.arc(pi.sx,pi.sy,baseR+5,0,Math.PI*2);
      ctx.strokeStyle='rgba(255,255,255,0.6)';ctx.lineWidth=1.5*_dpr;ctx.stroke();
    }
    if(selectedAtom===a.idx){
      ctx.beginPath();ctx.arc(pi.sx,pi.sy,baseR+9,0,Math.PI*2);
      ctx.strokeStyle='rgba(0,217,255,0.95)';ctx.lineWidth=2.25*_dpr;ctx.stroke();
      ctx.beginPath();ctx.arc(pi.sx,pi.sy,baseR+13,0,Math.PI*2);
      ctx.strokeStyle='rgba(0,217,255,0.28)';ctx.lineWidth=3.5*_dpr;ctx.stroke();
    }
    if(secondarySelectedAtom===a.idx){
      ctx.beginPath();ctx.arc(pi.sx,pi.sy,baseR+7,0,Math.PI*2);
      ctx.strokeStyle='rgba(255,163,26,0.9)';ctx.lineWidth=2*_dpr;ctx.stroke();
      ctx.beginPath();ctx.arc(pi.sx,pi.sy,baseR+11,0,Math.PI*2);
      ctx.strokeStyle='rgba(255,163,26,0.24)';ctx.lineWidth=3*_dpr;ctx.stroke();
    }
    // measurement selection rings
    if(measureMode&&measureAtoms.includes(a.idx)){
      const mIdx=measureAtoms.indexOf(a.idx);
      const ringColors=['#00d9ff','#f97316','#10b981','#f59e0b'];
      ctx.beginPath();ctx.arc(pi.sx,pi.sy,baseR+5,0,Math.PI*2);
      ctx.strokeStyle=ringColors[mIdx]||'#fff';ctx.lineWidth=2.5*_dpr;ctx.stroke();
      ctx.font=`bold ${Math.max(9,baseR*0.7)}px "JetBrains Mono",monospace`;
      ctx.fillStyle=ringColors[mIdx]||'#fff';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(mIdx+1,pi.sx,pi.sy+baseR+9);
    }
  });
}

// ─── INIT ─────────────────────────────────────────────────
renderImportDetails(lastImportMeta);
resizeCanvas();
drawBondLegends();
const _restoredState = restoreAppState();
if(!_restoredState) loadDemo('caffeine');
applyResponsiveSidebarDefaults?.();
initEditorRegime();

// ═══════════════════════════════════════════════════════════
