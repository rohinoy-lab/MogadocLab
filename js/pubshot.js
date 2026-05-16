/* ═══════════════════════════════════════════════════════
   Pubshot — MogadocLab
   ═══════════════════════════════════════════════════════ */

// PUBLICATION SCREENSHOT MODAL
// ═══════════════════════════════════════════════════════════
function openPubShotModal(){
  document.getElementById('pubshotModal').style.display='flex';
  applyJournalPreset();
  updatePubShotPreview();
}
function closePubShotModal(){
  document.getElementById('pubshotModal').style.display='none';
}

function getPubShotSettings(){
  return {
    resolution: document.getElementById('ps-resolution').value,
    format:     document.getElementById('ps-format').value,
    quality:    parseFloat(document.getElementById('ps-quality').value),
    bgOverride: document.getElementById('ps-bg').value,
    showLegend: document.getElementById('ps-legend').checked,
    showFormula:document.getElementById('ps-formula').checked,
    showTitle:  document.getElementById('ps-title').checked,
    showScale:  document.getElementById('ps-scale').checked,
    showAttrib: document.getElementById('ps-attrib').checked,
    borderStyle:document.getElementById('ps-border').value,
    framing:    document.getElementById('ps-framing').value,
    padding:    parseInt(document.getElementById('ps-padding').value),
    compact:    document.getElementById('ps-compact').checked,
    orthographic: document.getElementById('ps-ortho').checked,
    journal:    document.getElementById('ps-journal').checked,
    titleText:  document.getElementById('ps-titletext').value || (molecule?.name||'Molecule'),
    dpi:        parseInt(document.getElementById('ps-dpi').value),
  };
}

function updatePubShotPreview(){
  const prev=document.getElementById('ps-preview');
  try {
    const previewCanvas=renderPubShot(getPubShotSettings(), 0.25);
    prev.innerHTML='';
    previewCanvas.style.maxWidth='100%';
    previewCanvas.style.maxHeight='100%';
    previewCanvas.style.objectFit='contain';
    previewCanvas.style.borderRadius='4px';
    prev.appendChild(previewCanvas);
  } catch(e) {
    prev.innerHTML=`<div style="color:#ef4444;font-family:monospace;font-size:11px;padding:12px;">Preview error: ${e.message}</div>`;
    console.error('PubShot preview error:', e);
  }
  // update size display
  const s=getPubShotSettings();
  const dims=getOutputDims(s.resolution);
  document.getElementById('ps-sizeinfo').textContent=`${dims.w} × ${dims.h} px · ${s.dpi} DPI`;
}

function getOutputDims(res){
  const map={
    '1x':  {w:1920,h:1080},
    '2x':  {w:2560,h:1440},
    '4x':  {w:3840,h:2160},
    'a4p': {w:2480,h:3508},
    'a4l': {w:3508,h:2480},
    'sq':  {w:2048,h:2048},
    'banner':{w:4096,h:1536},
    'nature':{w:3543,h:2657},  // Nature figure: 90mm column @ 300dpi landscape
  };
  return map[res]||{w:2560,h:1440};
}

function renderPubShot(cfg, scaleFactor=1){
  const dims=getOutputDims(cfg.resolution);
  const W=Math.round(dims.w*scaleFactor), H=Math.round(dims.h*scaleFactor);
  const pad=Math.round(cfg.padding*scaleFactor);
  const isJournal = !!cfg.journal;
  const oc=document.createElement('canvas');
  oc.width=W; oc.height=H;
  const ox=oc.getContext('2d');

  // — Background —
  const bgC=cfg.bgOverride;
  if(bgC==='transparent'){
    ox.clearRect(0,0,W,H);
  } else if(bgC==='white'){
    ox.fillStyle='#ffffff'; ox.fillRect(0,0,W,H);
  } else if(bgC==='black'){
    ox.fillStyle='#000000'; ox.fillRect(0,0,W,H);
  } else if(bgC==='current'){
    const canvasArea=document.getElementById('canvasArea');
    const bg=canvasArea.getAttribute('data-bg');
    if(bg==='dark') { ox.fillStyle='#000'; ox.fillRect(0,0,W,H); }
    else if(bg==='plain') {
      const computed=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
      ox.fillStyle=computed||'#080c12'; ox.fillRect(0,0,W,H);
    } else if(bg==='gradient'){
      const grd=ox.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.7);
      const computed=getComputedStyle(document.documentElement).getPropertyValue('--surface2').trim()||'#141c28';
      grd.addColorStop(0,computed); grd.addColorStop(1,'#060a10');
      ox.fillStyle=grd; ox.fillRect(0,0,W,H);
    } else { // grid
      ox.fillStyle='#080c12'; ox.fillRect(0,0,W,H);
      const gridSz=Math.round(40*scaleFactor);
      ox.strokeStyle='rgba(31,45,66,0.4)'; ox.lineWidth=1;
      for(let x=0;x<=W;x+=gridSz){ox.beginPath();ox.moveTo(x,0);ox.lineTo(x,H);ox.stroke();}
      for(let y=0;y<=H;y+=gridSz){ox.beginPath();ox.moveTo(0,y);ox.lineTo(W,y);ox.stroke();}
    }
  } else if(bgC==='navy'){
    ox.fillStyle='#0a1628'; ox.fillRect(0,0,W,H);
  } else if(bgC==='cream'){
    ox.fillStyle='#f5f0e8'; ox.fillRect(0,0,W,H);
  }

  // — Border —
  if(cfg.borderStyle!=='none'){
    const bw=Math.round(3*scaleFactor);
    const accent=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#00d9ff';
    const isDarkBg = !(bgC==='white'||bgC==='cream');
    if(cfg.borderStyle==='accent'){
      ox.strokeStyle=accent; ox.lineWidth=bw*2;
      ox.strokeRect(bw,bw,W-bw*2,H-bw*2);
    } else if(cfg.borderStyle==='thin'){
      ox.strokeStyle= isDarkBg ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
      ox.lineWidth=Math.max(1,Math.round(scaleFactor));
      ox.strokeRect(1,1,W-2,H-2);
    } else if(cfg.borderStyle==='double'){
      ox.strokeStyle=accent+'88'; ox.lineWidth=Math.max(1,Math.round(scaleFactor));
      ox.strokeRect(Math.round(8*scaleFactor),Math.round(8*scaleFactor),W-Math.round(16*scaleFactor),H-Math.round(16*scaleFactor));
      ox.strokeStyle=accent+'44'; ox.lineWidth=Math.max(1,Math.round(scaleFactor));
      ox.strokeRect(Math.round(14*scaleFactor),Math.round(14*scaleFactor),W-Math.round(28*scaleFactor),H-Math.round(28*scaleFactor));
    }
  }

  // — Molecule render into output canvas —
  // We re-render into a temporary canvas at the output size (minus padding/overlay space)
  const overlayH = (cfg.showTitle||cfg.showFormula) ? Math.round(64*scaleFactor) : 0;
  const legendW = cfg.showLegend && molecule ? Math.round(200*scaleFactor) : 0;
  const scaleBarH = cfg.showScale ? Math.round(36*scaleFactor) : 0;
  const attribH = cfg.showAttrib ? Math.round(28*scaleFactor) : 0;

  const molW = W - pad*2 - legendW;
  const molH = H - pad*2 - overlayH - scaleBarH - attribH;
  const molX = pad;
  const molY = pad + overlayH;

  const isLightBg = bgC==='white'||bgC==='cream'||bgC==='transparent';

  // Render molecule to temporary canvas at molW x molH
  const tmpC=document.createElement('canvas');
  tmpC.width=molW; tmpC.height=molH;
  renderMoleculeToCanvas(tmpC, scaleFactor, isLightBg, {compact:cfg.compact, orthographic:cfg.orthographic, pad, overlayH, scaleBarH, attribH, legendW});
  ox.drawImage(tmpC, molX, molY, molW, molH);

  // — Title / Formula overlay —
  if(cfg.showTitle||cfg.showFormula){
    const isDark = bgC==='white'||bgC==='cream' ? false : true;
    const textCol = isDark ? '#dce8f5' : '#1a2840';
    const accent  = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#00d9ff';
    const fs=Math.round((isJournal?18:22)*scaleFactor);
    if(cfg.showTitle){
      ox.font=`700 ${fs}px ${isJournal?'"Helvetica Neue","Arial",sans-serif':'"DM Sans",sans-serif'}`;
      ox.fillStyle=textCol; ox.textAlign='left'; ox.textBaseline='middle';
      ox.fillText(cfg.titleText, pad, pad + Math.round(20*scaleFactor));
    }
    if(cfg.showFormula && molecule){
      const counts={};
      molecule.atoms.forEach(a=>{const s=a.symbol.charAt(0).toUpperCase()+a.symbol.slice(1).toLowerCase();counts[s]=(counts[s]||0)+1;});
      const ord=['C','H',...Object.keys(counts).filter(e=>e!=='C'&&e!=='H').sort()];
      const formula=ord.filter(e=>counts[e]).map(e=>e+(counts[e]>1?counts[e]:'')).join('');
      const fs2=Math.round(14*scaleFactor);
      ox.font=`400 ${fs2}px "JetBrains Mono",monospace`;
      ox.fillStyle=accent; ox.textAlign='left'; ox.textBaseline='middle';
      ox.fillText(formula, pad, pad + Math.round(45*scaleFactor));
    }
  }

  // — Atom legend —
  if(cfg.showLegend && molecule){
    const isDark = bgC==='white'||bgC==='cream' ? false : true;
    const textCol = isDark ? '#dce8f5' : '#1a2840';
    const dimCol  = isDark ? '#5c7a99' : '#5a7090';
    const panelX = W - legendW - pad + Math.round(8*scaleFactor);
    const panelY = pad + overlayH;
    const panelW = legendW - Math.round(8*scaleFactor);
    const panelH = Math.round(200*scaleFactor);
    // panel bg
    if(isJournal){
      ox.fillStyle = 'rgba(255,255,255,0.98)';
      ox.fillRect(panelX, panelY, panelW, panelH);
      ox.strokeStyle = 'rgba(17,24,39,0.14)';
      ox.lineWidth = Math.max(1, Math.round(scaleFactor));
      ox.strokeRect(panelX, panelY, panelW, panelH);
    } else {
      ox.fillStyle = isDark ? 'rgba(8,12,18,0.8)' : 'rgba(255,255,255,0.85)';
      roundRect(ox, panelX, panelY, panelW, panelH, Math.round(6*scaleFactor));
      ox.fill();
    }
    const counts={};
    molecule.atoms.forEach(a=>{const s=a.symbol.charAt(0).toUpperCase()+a.symbol.slice(1).toLowerCase();counts[s]=(counts[s]||0)+1;});
    const elems=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,8);
    const rowH=Math.round(22*scaleFactor);
    const fs3=Math.round(12*scaleFactor);
    elems.forEach(([sym,cnt],i)=>{
      const el=getElement(sym);
      const ry=panelY+Math.round(12*scaleFactor)+i*rowH;
      // dot
      ox.beginPath();ox.arc(panelX+Math.round(14*scaleFactor),ry+rowH/2,Math.round(5*scaleFactor),0,Math.PI*2);
      ox.fillStyle=el.color; ox.fill();
      // symbol
      ox.font=`500 ${fs3}px "JetBrains Mono",monospace`;
      ox.fillStyle=textCol; ox.textAlign='left'; ox.textBaseline='middle';
      ox.fillText(sym, panelX+Math.round(26*scaleFactor), ry+rowH/2);
      // count
      ox.font=`400 ${fs3}px "JetBrains Mono",monospace`;
      ox.fillStyle=dimCol;
      ox.fillText('×'+cnt, panelX+panelW-Math.round(36*scaleFactor), ry+rowH/2);
    });
  }

  // — Scale bar (aesthetic, shows zoom level) —
  if(cfg.showScale){
    const isDark = bgC==='white'||bgC==='cream' ? false : true;
    const textCol = isDark ? '#5c7a99' : '#9aaabb';
    const barX=pad+Math.round(16*scaleFactor);
    const barY=H-attribH-Math.round(18*scaleFactor);
    const barW=Math.round(80*scaleFactor);
    ox.fillStyle=textCol;
    ox.fillRect(barX, barY, barW, Math.round(2*scaleFactor));
    // end ticks
    ox.fillRect(barX, barY-Math.round(4*scaleFactor), Math.round(2*scaleFactor), Math.round(10*scaleFactor));
    ox.fillRect(barX+barW-Math.round(2*scaleFactor), barY-Math.round(4*scaleFactor), Math.round(2*scaleFactor), Math.round(10*scaleFactor));
    const scaleA = molecule ? (2.0/(molecule.scale*zoom)).toFixed(2) : '—';
    ox.font=`400 ${Math.round(10*scaleFactor)}px "JetBrains Mono",monospace`;
    ox.fillStyle=textCol; ox.textAlign='center'; ox.textBaseline='top';
    ox.fillText(`~${scaleA} Å`, barX+barW/2, barY+Math.round(4*scaleFactor));
  }

  // — Attribution —
  if(cfg.showAttrib){
    const isDark = bgC==='white'||bgC==='cream' ? false : true;
    const dimCol  = isDark ? '#273d57' : '#9aaabb';
    const accent  = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#00d9ff';
    ox.font=`400 ${Math.round(9*scaleFactor)}px "JetBrains Mono",monospace`;
    ox.fillStyle=dimCol; ox.textAlign='right'; ox.textBaseline='bottom';
    ox.fillText('MOGADOCLab · Structure Viewer', W-pad, H-Math.round(6*scaleFactor));
    if(molecule){
      ox.fillStyle=accent+'99';
      ox.textAlign='left';
      const now=new Date();
      ox.fillText(now.toISOString().split('T')[0], pad, H-Math.round(6*scaleFactor));
    }
  }

  return oc;
}

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}

function computeCompactView(canvasDims, pad, overlayH, scaleBarH, attribH, legendW, orthographic){
  if(!molecule||!molecule.atoms.length) return {zoom:1,panX:0,panY:0};
  const W=canvasDims.width, H=canvasDims.height;
  let maxR=0;
  molecule.atoms.forEach(a=>{const r=Math.sqrt(a.x*a.x+a.y*a.y+a.z*a.z);if(r>maxR)maxR=r;});
  if(maxR<0.01) maxR=1;
  const availW=W-pad*2-legendW;
  const availH=H-pad*2-overlayH-scaleBarH-attribH;
  const fitScale=Math.min(availW,availH)*0.38/maxR;
  const baseScale=molecule.scale||60;
  return {zoom:fitScale/baseScale, panX:0, panY:0};
}

function getExportAtomRadius(atom, atomScale, d){
  const el=getElement(atom.symbol);
  if(viewMode==='spacefill') return el.r*(getElementSizeScale(atom.symbol))*90*atomScale*d;
  if(viewMode==='wireframe'||viewMode==='stick') return 8*Math.max(0.7,d);
  if(viewMode==='cartoon') return (el.symbol==='C'?6:4)*atomScale*d;
  return el.r*(getElementSizeScale(atom.symbol))*40*atomScale*d;
}

function measureExportBounds(targetCanvas, zoomGuess, orthographic){
  if(!molecule?.atoms?.length) return null;
  const atomScale=parseFloat(document.getElementById('atomScale').value);
  const W=targetCanvas.width, H=targetCanvas.height;
  const cx=W/2, cy=H/2;
  const scale=(molecule.scale||60) * zoomGuess;
  const M=mat3Mul(mat3RotY(rotY),mat3RotX(rotX));
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(const atom of molecule.atoms){
    const proj=mat3Vec(M,[atom.x,atom.y,atom.z]);
    /* fov / eye now centralised in projectD() */
    const z=proj[2]*scale;
    const d=projectD(z, orthographic);
    const sx=cx + proj[0]*scale*d;
    const sy=cy - proj[1]*scale*d;
    const r=Math.max(4, getExportAtomRadius(atom, atomScale, d));
    minX=Math.min(minX, sx-r);
    maxX=Math.max(maxX, sx+r);
    minY=Math.min(minY, sy-r);
    maxY=Math.max(maxY, sy+r);
  }
  if(!isFinite(minX)||!isFinite(maxX)||!isFinite(minY)||!isFinite(maxY)) return null;
  return {
    minX,maxX,minY,maxY,
    width:Math.max(1,maxX-minX),
    height:Math.max(1,maxY-minY),
    centerX:(minX+maxX)/2,
    centerY:(minY+maxY)/2
  };
}

function computeExportView(targetCanvas, exportCfg={}){
  if(!molecule?.atoms?.length) return {zoom:1,panX:0,panY:0};
  const framing=exportCfg.framing||'balanced';
  const orthographic=!!exportCfg.orthographic;
  if(framing==='current'){
    const liveLogicalW = (canvas?.width||targetCanvas.width) / (window.devicePixelRatio||1);
    const scaleRatio = targetCanvas.width / Math.max(1, liveLogicalW);
    return {zoom:zoom*scaleRatio, panX:panX*scaleRatio, panY:panY*scaleRatio};
  }

  const fill = framing==='tight' ? 0.97 : exportCfg.journal ? 0.92 : 0.88;
  const targetW=Math.max(40,targetCanvas.width);
  const targetH=Math.max(40,targetCanvas.height);
  let guess=1;
  let bounds=null;
  for(let i=0;i<4;i++){
    bounds=measureExportBounds(targetCanvas, guess, orthographic);
    if(!bounds) break;
    const fitX=(targetW*fill)/bounds.width;
    const fitY=(targetH*fill)/bounds.height;
    const factor=Math.min(fitX, fitY);
    guess*=factor;
  }
  bounds=measureExportBounds(targetCanvas, guess, orthographic);
  if(!bounds) return computeCompactView({width:targetW,height:targetH}, 0, 0, 0, 0, 0, orthographic);
  return {
    zoom:guess,
    panX:(targetW/2) - bounds.centerX,
    panY:(targetH/2) - bounds.centerY
  };
}

function renderMoleculeToCanvas(targetCanvas, scaleFactor, isLightBg, exportCfg={}){
  const prevCanvas = canvas;
  const prevCtx    = ctx;
  const prevZoom   = zoom;
  const prevPanX   = panX;
  const prevPanY   = panY;
  const prevDPR    = window.devicePixelRatio;
  const prevOrtho  = window._pubshotOrthographic;

  try {
    const liveLogicalW = prevCanvas.width / prevDPR;
    const scaleRatio   = targetCanvas.width / liveLogicalW;

    canvas           = targetCanvas;
    ctx              = targetCanvas.getContext('2d');
    window._pubDPR   = 1;
    window._pubshotLightBg = !!isLightBg;
    window._pubshotOrthographic = !!exportCfg.orthographic;

    if(exportCfg.compact || (exportCfg.framing && exportCfg.framing!=='current')){
      const fit = computeExportView(targetCanvas, exportCfg);
      zoom = fit.zoom; panX = fit.panX; panY = fit.panY;
    } else {
      zoom = prevZoom * scaleRatio;
      panX = prevPanX * scaleRatio;
      panY = prevPanY * scaleRatio;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    _renderFull();

  } finally {
    window._pubshotLightBg = false;
    window._pubshotOrthographic = prevOrtho;
    canvas           = prevCanvas;
    ctx              = prevCtx;
    zoom             = prevZoom;
    panX             = prevPanX;
    panY             = prevPanY;
    window._pubDPR   = null;
  }
}

function pubshotDownload(){
  if(!molecule)return notify('No structure loaded','error');
  const cfg=getPubShotSettings();
  notify('Rendering publication image…','info');
  setTimeout(()=>{
    const oc=renderPubShot(cfg, 1.0);
    downloadPubShotCanvas(oc, cfg);
  },30);
}

function downloadPubShotCanvas(canvasEl, cfg, customName){
  const mime = cfg.format==='jpg' ? 'image/jpeg' : cfg.format==='webp' ? 'image/webp' : 'image/png';
  const ext  = cfg.format==='jpg' ? 'jpg' : cfg.format==='webp' ? 'webp' : 'png';
  const q    = cfg.format==='png' ? undefined : cfg.quality;
  const baseName=(customName||`${(molecule?.name||'molecule').replace(/\s+/g,'_')}_pub_${cfg.resolution}`);
  canvasEl.toBlob(blob=>{
    if(!blob){ notify('Image export failed','error'); return; }
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=`${baseName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1200);
    notify(`Saved ${cfg.resolution} publication image as .${ext}`,'success');
  }, mime, q);
}

function getQuickPubShotSettings(format='png'){
  const base=getPubShotSettings();
  return {
    ...base,
    format,
    bgOverride: base.bgOverride==='transparent' && format!=='png' ? 'white' : base.bgOverride,
    borderStyle: base.borderStyle||'thin',
    framing: base.framing||'balanced',
    compact: true
  };
}

function pubshotQuickDownload(format='png'){
  if(!molecule) return notify('No structure loaded','error');
  const cfg=getQuickPubShotSettings(format);
  notify(`Rendering quick ${format.toUpperCase()} export…`,'info');
  setTimeout(()=>{
    const oc=renderPubShot(cfg,1.0);
    downloadPubShotCanvas(oc, cfg, `${(molecule?.name||'molecule').replace(/\s+/g,'_')}_quick_${cfg.resolution}`);
  }, 20);
}

function pubshotCopyClipboard(){
  if(!molecule)return notify('No structure loaded','error');
  const cfg=getPubShotSettings();
  notify('Copying to clipboard…','info');
  const oc=renderPubShot(cfg,1.0);
  oc.toBlob(blob=>{
    navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).then(()=>notify('Copied to clipboard!','success')).catch(()=>notify('Clipboard copy failed — try download','error'));
  },'image/png');
}

// ═══════════════════════════════════════════════════════════
// JOURNAL / EXPORT PRESETS
// ═══════════════════════════════════════════════════════════
function applyJournalPreset(){
  const j=document.getElementById('ps-journal');
  if(!j||!j.checked) return;
  document.getElementById('ps-resolution').value='nature';
  document.getElementById('ps-dpi').value='600';
  document.getElementById('ps-bg').value='white';
  document.getElementById('ps-border').value='none';
  document.getElementById('ps-framing').value='tight';
  document.getElementById('ps-padding').value='20';
  document.getElementById('ps-compact').checked=true;
  document.getElementById('ps-ortho').checked=true;
  document.getElementById('ps-title').checked=false;
  document.getElementById('ps-formula').checked=false;
  document.getElementById('ps-legend').checked=false;
  document.getElementById('ps-scale').checked=false;
  document.getElementById('ps-attrib').checked=false;
  document.getElementById('ps-padval').textContent='20px';
}
function applyExportPreset(preset){
  const sets={
    journal:    {bg:'white',border:'none',framing:'tight',padding:20,compact:true,ortho:true,title:false,formula:false,legend:false,scale:false,attrib:false,resolution:'nature',dpi:'600'},
    presentation:{bg:'black',border:'accent',framing:'balanced',padding:40,compact:true,ortho:false,title:true,formula:true,legend:false,scale:false,attrib:true},
    dark:       {bg:'current',border:'accent',framing:'current',padding:24,compact:false,ortho:false,title:true,formula:true,legend:true,scale:true,attrib:true},
    minimal:    {bg:'transparent',border:'none',framing:'tight',padding:8,compact:true,ortho:true,title:false,formula:false,legend:false,scale:false,attrib:false}
  };
  const s=sets[preset]; if(!s) return;
  if(s.resolution) document.getElementById('ps-resolution').value=s.resolution;
  if(s.dpi) document.getElementById('ps-dpi').value=s.dpi;
  document.getElementById('ps-bg').value=s.bg;
  document.getElementById('ps-border').value=s.border;
  document.getElementById('ps-framing').value=s.framing;
  document.getElementById('ps-padding').value=s.padding;
  document.getElementById('ps-padval').textContent=s.padding+'px';
  document.getElementById('ps-compact').checked=s.compact;
  document.getElementById('ps-ortho').checked=s.ortho;
  document.getElementById('ps-title').checked=s.title;
  document.getElementById('ps-formula').checked=s.formula;
  document.getElementById('ps-legend').checked=s.legend;
  document.getElementById('ps-scale').checked=s.scale;
  document.getElementById('ps-attrib').checked=s.attrib;
  document.getElementById('ps-journal').checked=preset==='journal';
  updatePubShotPreview();
}

// ═══════════════════════════════════════════════════════════
