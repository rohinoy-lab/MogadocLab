/* ═══════════════════════════════════════════════════════
   Trajectory — MogadocLab
   ═══════════════════════════════════════════════════════ */

// TRAJECTORY / MULTI-FRAME PLAYBACK
// ═══════════════════════════════════════════════════════════
function updateTrajectoryControlsUI() {
  const btn = document.getElementById('btnTrajectory');
  const btnPrev = document.getElementById('btnTrajPrev');
  const btnNext = document.getElementById('btnTrajNext');
  const btnGif = document.getElementById('btnTrajGif');
  const status = document.getElementById('trajToolbarStatus');
  const player = document.getElementById('trajectoryPlayer');
  const meta = document.getElementById('trajMeta');
  const active = trajectoryFrames.length > 1;
  if (btn) {
    btn.style.display = active ? 'inline-flex' : 'none';
    btn.classList.toggle('active', !!player?.classList.contains('visible'));
  }
  if (btnPrev) btnPrev.style.display = active ? 'inline-flex' : 'none';
  if (btnNext) btnNext.style.display = active ? 'inline-flex' : 'none';
  if (btnGif) btnGif.style.display = active ? 'inline-flex' : 'none';
  if (status) {
    status.style.display = active ? 'inline-flex' : 'none';
    status.textContent = active ? `Frame ${trajCurrentFrame + 1} / ${trajectoryFrames.length}` : 'Frame 1 / 1';
  }
  if (meta) {
    meta.textContent = active
      ? `${trajName || 'Trajectory'} · ${trajectoryFrames.length} frames`
      : 'No trajectory loaded';
  }
}

function loadTrajectory(name, frames) {
  if (!frames || frames.length === 0) return notify('No frames found', 'error');
  trajStop();
  trajectoryFrames = frames;
  trajCurrentFrame = 0;
  trajName = name;
  trajDirection = 1;
  panX = 0;
  panY = 0;
  zoom = 1;
  if (typeof resetSelectionState === 'function') resetSelectionState();
  // Compute a unified scale from all frames so zooming stays consistent
  let globalMaxR = 0;
  frames.forEach(f => {
    let cx=0,cy=0,cz=0;
    f.atoms.forEach(a=>{cx+=a.x;cy+=a.y;cz+=a.z;});
    cx/=f.atoms.length;cy/=f.atoms.length;cz/=f.atoms.length;
    f.atoms.forEach(a=>{a.x-=cx;a.y-=cy;a.z-=cz;});
    let maxR=0;
    f.atoms.forEach(a=>{const r=Math.sqrt(a.x*a.x+a.y*a.y+a.z*a.z);if(r>maxR)maxR=r;});
    if(maxR>globalMaxR) globalMaxR=maxR;
  });
  const minCanvasDim=Math.min(canvas?.clientWidth||800, canvas?.clientHeight||600);
  trajGlobalScale = globalMaxR>0 ? (minCanvasDim*0.32)/globalMaxR : 60;
  frames.forEach(f => { f.scale = trajGlobalScale; f.name = name; });
  // Load first frame
  trajGoToFrame(0);
  showTrajectoryPlayer();
  if(document.getElementById('editorPanel') && !document.getElementById('editorPanel').classList.contains('hidden')){
    try{ loadEditorFromMolecule(); }catch(_){}
  }
  saveAppState?.();
  notify(`Loaded trajectory "${name}" — ${frames.length} frames, ${frames[0].atoms.length} atoms/frame`, 'success');
}

function trajGoToFrame(idx) {
  if (!trajectoryFrames.length) return;
  idx = Math.max(0, Math.min(idx, trajectoryFrames.length - 1));
  trajCurrentFrame = idx;
  const frame = trajectoryFrames[idx];
  frame.scale = trajGlobalScale || frame.scale;
  frame.name = trajName;
  molecule = frame;
  lastImportMeta = {...(frame.meta||{}), source: frame.meta?.source||'Multi-frame XYZ',
    format:'xyz', frameInfo: `Frame ${idx+1} / ${trajectoryFrames.length}`,
    comment: frame.meta?.comment || ''};
  document.getElementById('emptyState').style.display = 'none';
  const mb = document.getElementById('moleculeName');
  mb.textContent = `${trajName} [${idx+1}/${trajectoryFrames.length}]`;
  mb.classList.add('loaded');
  updateStats(); updateLegend(); updateCanvasInfo(); render();
  renderImportDetails(lastImportMeta);
  // Update player UI
  const slider = document.getElementById('trajSlider');
  if (slider) { slider.max = trajectoryFrames.length - 1; slider.value = idx; }
  const counter = document.getElementById('trajFrameCount');
  if (counter) counter.textContent = `${idx+1} / ${trajectoryFrames.length}`;
  const comment = document.getElementById('trajComment');
  if (comment) comment.textContent = frame.meta?.comment || '';
  updateTrajectoryControlsUI();
}

function trajNext() {
  if (!trajectoryFrames.length) return;
  if (trajBounce) {
    const next = trajCurrentFrame + trajDirection;
    if (next >= trajectoryFrames.length) { trajDirection = -1; }
    else if (next < 0) { trajDirection = 1; }
    trajGoToFrame(trajCurrentFrame + trajDirection);
  } else {
    let next = trajCurrentFrame + 1;
    if (next >= trajectoryFrames.length) {
      if (trajLoop) next = 0; else { trajStop(); return; }
    }
    trajGoToFrame(next);
  }
}

function trajPrev() {
  if (!trajectoryFrames.length) return;
  let prev = trajCurrentFrame - 1;
  if (prev < 0) prev = trajLoop ? trajectoryFrames.length - 1 : 0;
  trajGoToFrame(prev);
}

function trajPlay() {
  if (!trajectoryFrames.length) return;
  if (trajPlaying) return;
  trajPlaying = true;
  trajDirection = 1;
  const btn = document.getElementById('trajPlayBtn');
  if (btn) { btn.textContent = '⏸ Pause'; btn.title = 'Pause'; }
  trajPlayTimer = setInterval(() => trajNext(), 1000 / trajFPS);
}

function trajPause() {
  trajPlaying = false;
  if (trajPlayTimer) { clearInterval(trajPlayTimer); trajPlayTimer = null; }
  const btn = document.getElementById('trajPlayBtn');
  if (btn) { btn.textContent = '▶ Play'; btn.title = 'Play'; }
}

function trajTogglePlay() {
  if (trajPlaying) trajPause(); else trajPlay();
}

function trajStop() {
  trajPause();
  const player = document.getElementById('trajectoryPlayer');
  if (player) player.classList.remove('visible');
  updateTrajectoryControlsUI();
}

function trajSetSpeed(fps) {
  trajFPS = Math.max(1, Math.min(60, parseInt(fps) || 5));
  const lbl = document.getElementById('trajSpeedLabel');
  if (lbl) lbl.textContent = trajFPS + ' fps';
  if (trajPlaying) {
    clearInterval(trajPlayTimer);
    trajPlayTimer = setInterval(() => trajNext(), 1000 / trajFPS);
  }
}

function trajToggleLoop() {
  trajLoop = !trajLoop;
  const btn = document.getElementById('trajLoopBtn');
  if (btn) btn.classList.toggle('active', trajLoop);
}

function trajToggleBounce() {
  trajBounce = !trajBounce;
  const btn = document.getElementById('trajBounceBtn');
  if (btn) btn.classList.toggle('active', trajBounce);
  if (trajBounce) trajDirection = 1;
}

function showTrajectoryPlayer() {
  const player = document.getElementById('trajectoryPlayer');
  if (!player) return;
  player.classList.add('visible');
  const slider = document.getElementById('trajSlider');
  if (slider) { slider.max = trajectoryFrames.length - 1; slider.value = 0; }
  const counter = document.getElementById('trajFrameCount');
  if (counter) counter.textContent = `1 / ${trajectoryFrames.length}`;
  const spdSlider = document.getElementById('trajSpeedSlider');
  if (spdSlider) spdSlider.value = trajFPS;
  const lbl = document.getElementById('trajSpeedLabel');
  if (lbl) lbl.textContent = trajFPS + ' fps';
  updateTrajectoryControlsUI();
}

function clearTrajectory() {
  trajStop();
  trajectoryFrames = [];
  trajCurrentFrame = 0;
  trajGlobalScale = null;
  trajName = '';
  const slider = document.getElementById('trajSlider');
  if (slider) { slider.max = 1; slider.value = 0; }
  const counter = document.getElementById('trajFrameCount');
  if (counter) counter.textContent = '1 / 1';
  const comment = document.getElementById('trajComment');
  if (comment) comment.textContent = '';
  updateTrajectoryControlsUI();
}

// ── Trajectory Export: GIF ──────────────────────────────────
// Lightweight GIF encoder (LZW-based, no external dependency)
function GIFEncoder(width, height) {
  const pages = [];
  const delays = [];
  let transparent = null;
  let repeat = 0;

  function addFrame(imageData, delay=100) {
    const pixels = imageData.data;
    // Build color table from frame (max 256 colors via median-cut quantization)
    const {indexed, palette} = quantizeFrame(pixels, width, height);
    pages.push({indexed, palette, delay: Math.round(delay/10)});
  }

  function quantizeFrame(pixels, w, h) {
    // Simple popularity quantization: pick top 255 colors + 1 transparent
    const colorMap = new Map();
    const n = w * h;
    for (let i = 0; i < n; i++) {
      const r = pixels[i*4], g = pixels[i*4+1], b = pixels[i*4+2];
      // Reduce to 5-bit per channel for grouping
      const key = ((r>>3)<<10) | ((g>>3)<<5) | (b>>3);
      const entry = colorMap.get(key);
      if (entry) { entry.count++; entry.r+=r; entry.g+=g; entry.b+=b; }
      else colorMap.set(key, {count:1, r, g, b});
    }
    const sorted = [...colorMap.values()].sort((a,b) => b.count - a.count).slice(0, 256);
    const palette = new Uint8Array(256 * 3);
    sorted.forEach((c, i) => {
      palette[i*3]   = Math.round(c.r / c.count);
      palette[i*3+1] = Math.round(c.g / c.count);
      palette[i*3+2] = Math.round(c.b / c.count);
    });
    // Map pixels to palette indices
    const indexed = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const r = pixels[i*4], g = pixels[i*4+1], b = pixels[i*4+2];
      let bestIdx = 0, bestDist = Infinity;
      const len = Math.min(sorted.length, 256);
      for (let j = 0; j < len; j++) {
        const dr = r - palette[j*3], dg = g - palette[j*3+1], db = b - palette[j*3+2];
        const d = dr*dr + dg*dg + db*db;
        if (d < bestDist) { bestDist = d; bestIdx = j; }
      }
      indexed[i] = bestIdx;
    }
    return {indexed, palette};
  }

  function lzwEncode(indexed, colorDepth) {
    const clearCode = 1 << colorDepth;
    const eoiCode = clearCode + 1;
    let codeSize = colorDepth + 1;
    let nextCode = eoiCode + 1;
    const maxCode = 4095;
    const table = new Map();
    const output = [];
    let buffer = 0, bufBits = 0;

    function emit(code) {
      buffer |= (code << bufBits);
      bufBits += codeSize;
      while (bufBits >= 8) {
        output.push(buffer & 0xFF);
        buffer >>= 8;
        bufBits -= 8;
      }
    }

    // Initialize table
    for (let i = 0; i < clearCode; i++) table.set(String(i), i);
    emit(clearCode);

    let prefix = String(indexed[0]);
    for (let i = 1; i < indexed.length; i++) {
      const c = String(indexed[i]);
      const key = prefix + ',' + c;
      if (table.has(key)) {
        prefix = key;
      } else {
        emit(table.get(prefix));
        if (nextCode <= maxCode) {
          table.set(key, nextCode++);
          if (nextCode > (1 << codeSize) && codeSize < 12) codeSize++;
        } else {
          emit(clearCode);
          table.clear();
          for (let j = 0; j < clearCode; j++) table.set(String(j), j);
          nextCode = eoiCode + 1;
          codeSize = colorDepth + 1;
        }
        prefix = c;
      }
    }
    emit(table.get(prefix));
    emit(eoiCode);
    if (bufBits > 0) output.push(buffer & 0xFF);
    return new Uint8Array(output);
  }

  function toBlob() {
    const buf = [];
    // GIF Header
    buf.push(0x47,0x49,0x46,0x38,0x39,0x61); // GIF89a
    // Logical Screen Descriptor
    buf.push(width&0xFF,(width>>8)&0xFF, height&0xFF,(height>>8)&0xFF);
    buf.push(0x70, 0x00, 0x00); // no GCT, 8-bit color depth, bg=0, aspect=0
    // Netscape extension for looping
    buf.push(0x21,0xFF,0x0B);
    const ns = 'NETSCAPE2.0';
    for(let i=0;i<ns.length;i++) buf.push(ns.charCodeAt(i));
    buf.push(0x03, 0x01, repeat&0xFF, (repeat>>8)&0xFF, 0x00);

    for (const page of pages) {
      const {indexed, palette, delay} = page;
      const palSize = 256;
      const colorDepth = 8;
      // Graphic Control Extension
      buf.push(0x21,0xF9,0x04, 0x00, delay&0xFF,(delay>>8)&0xFF, 0x00, 0x00);
      // Image Descriptor with local color table
      buf.push(0x2C, 0,0,0,0, width&0xFF,(width>>8)&0xFF, height&0xFF,(height>>8)&0xFF);
      buf.push(0x87); // local color table, 256 entries
      // Local Color Table
      for(let i=0;i<palSize*3;i++) buf.push(palette[i]);
      // LZW data
      const minCode = colorDepth;
      buf.push(minCode);
      const lzw = lzwEncode(indexed, minCode);
      // Sub-blocks
      let offset=0;
      while(offset<lzw.length){
        const chunk = Math.min(255, lzw.length-offset);
        buf.push(chunk);
        for(let i=0;i<chunk;i++) buf.push(lzw[offset+i]);
        offset+=chunk;
      }
      buf.push(0x00); // block terminator
    }
    buf.push(0x3B); // Trailer
    return new Blob([new Uint8Array(buf)], {type:'image/gif'});
  }

  return {addFrame, toBlob};
}

async function exportTrajectoryGIF() {
  if (trajectoryFrames.length < 2) return notify('Need multi-frame trajectory for GIF export', 'error');
  const modal = document.getElementById('trajExportModal');
  // Pre-fill frame range
  const endEl = document.getElementById('gifEndFrame');
  if (endEl) endEl.value = trajectoryFrames.length;
  const startEl = document.getElementById('gifStartFrame');
  if (startEl) startEl.value = 1;
  const fpsEl = document.getElementById('gifFps');
  if (fpsEl) fpsEl.value = trajFPS;
  const progBar = document.getElementById('trajExportProgress');
  if (progBar) progBar.style.width = '0%';
  const progLabel = document.getElementById('trajExportLabel');
  if (progLabel) progLabel.textContent = '';
  if (modal) modal.style.display = 'flex';
}

async function doExportGIF() {
  if (trajectoryFrames.length < 2) return;
  const modal = document.getElementById('trajExportModal');
  const progBar = document.getElementById('trajExportProgress');
  const progLabel = document.getElementById('trajExportLabel');
  const gifWidth = parseInt(document.getElementById('gifWidth')?.value) || 600;
  const gifHeight = parseInt(document.getElementById('gifHeight')?.value) || 450;
  const gifFps = parseInt(document.getElementById('gifFps')?.value) || trajFPS;
  const startFrame = parseInt(document.getElementById('gifStartFrame')?.value) || 1;
  const endFrame = parseInt(document.getElementById('gifEndFrame')?.value) || trajectoryFrames.length;
  const frameStep = parseInt(document.getElementById('gifFrameStep')?.value) || 1;
  const delay = Math.round(1000 / gifFps);

  // Create offscreen canvas
  const offCanvas = document.createElement('canvas');
  offCanvas.width = gifWidth; offCanvas.height = gifHeight;
  const offCtx = offCanvas.getContext('2d');

  const encoder = GIFEncoder(gifWidth, gifHeight);
  const savedMol = molecule;
  const savedFrame = trajCurrentFrame;

  const framesToRender = [];
  for (let i = startFrame - 1; i < endFrame && i < trajectoryFrames.length; i += frameStep) {
    framesToRender.push(i);
  }

  if (progBar) { progBar.style.width = '0%'; }
  if (progLabel) progLabel.textContent = `Rendering frame 0 / ${framesToRender.length}...`;

  for (let fi = 0; fi < framesToRender.length; fi++) {
    const idx = framesToRender[fi];
    const frame = trajectoryFrames[idx];
    frame.scale = trajGlobalScale || frame.scale;
    molecule = frame;
    // Render to offscreen canvas
    renderToCanvas(offCtx, gifWidth, gifHeight);
    const imageData = offCtx.getImageData(0, 0, gifWidth, gifHeight);
    encoder.addFrame(imageData, delay);
    if (progBar) progBar.style.width = ((fi+1)/framesToRender.length*100) + '%';
    if (progLabel) progLabel.textContent = `Rendering frame ${fi+1} / ${framesToRender.length}...`;
    // Yield to UI
    await new Promise(r => setTimeout(r, 0));
  }

  // Restore state
  molecule = savedMol;
  trajGoToFrame(savedFrame);

  if (progLabel) progLabel.textContent = 'Encoding GIF...';
  await new Promise(r => setTimeout(r, 10));

  const blob = encoder.toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${trajName||'trajectory'}_animation.gif`;
  a.click();
  URL.revokeObjectURL(url);

  if (modal) modal.style.display = 'none';
  notify(`GIF exported — ${framesToRender.length} frames, ${(blob.size/1024).toFixed(0)} KB`, 'success');
}

function renderToCanvas(ctx, w, h) {
  // Render current molecule state to a given canvas context at given dimensions
  const _dpr = 1; // for export, no DPR scaling
  window._pubDPR = _dpr;
  const origCanvas = canvas;
  const origCtx = window._ctx || ctx;
  // Temporarily swap canvas reference
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = w; tmpCanvas.height = h;
  const tmpCtx = tmpCanvas.getContext('2d');
  const savedCanvasRef = canvas;
  // We need to render using the existing render pipeline
  // Draw background
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0a0e1a';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  if (!molecule || !molecule.atoms.length) { delete window._pubDPR; return; }

  const cx = w/2, cy = h/2, scale = molecule.scale * zoom * _dpr;
  const M = mat3Mul(mat3RotY(rotY), mat3RotX(rotX));
  molecule.atoms.forEach(a => { a._proj = mat3Vec(M, [a.x, a.y, a.z]); });
  let maxZ = 0;
  molecule.atoms.forEach(a => { if(Math.abs(a._proj[2])>maxZ) maxZ = Math.abs(a._proj[2]); });

  const atomScale = parseFloat(document.getElementById('atomScale')?.value || 1);
  const bWidth = parseFloat(document.getElementById('bondWidth')?.value || 2) * _dpr;
  const fog = parseFloat(document.getElementById('depthFog')?.value || 0.3);
  const glow = parseFloat(document.getElementById('glowAmt')?.value || 0.4);
  const sorted = [...molecule.atoms].sort((a,b) => a._proj[2] - b._proj[2]);

  // Draw bonds
  molecule.bonds.forEach(bond => {
    const a1 = molecule.atoms[bond.a], a2 = molecule.atoms[bond.b];
    if (!a1?._proj || !a2?._proj) return;
    const x1 = cx + (a1._proj[0] + panX) * scale;
    const y1 = cy + (a1._proj[1] + panY) * scale;
    const x2 = cx + (a2._proj[0] + panX) * scale;
    const y2 = cy + (a2._proj[1] + panY) * scale;
    const avgZ = (a1._proj[2] + a2._proj[2]) / 2;
    const fogF = maxZ > 0 ? 1 - fog * (avgZ / maxZ) * 0.5 : 1;
    ctx.globalAlpha = Math.max(0.15, fogF);
    const el1 = getElement(a1.symbol), el2 = getElement(a2.symbol);
    const mx = (x1+x2)/2, my = (y1+y2)/2;
    ctx.lineWidth = bWidth * (bond.order >= 2 ? 0.7 : 1);
    ctx.strokeStyle = el1.color; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(mx,my); ctx.stroke();
    ctx.strokeStyle = el2.color; ctx.beginPath(); ctx.moveTo(mx,my); ctx.lineTo(x2,y2); ctx.stroke();
    if (bond.order >= 2) {
      const dx=y2-y1, dy=x1-x2, len=Math.sqrt(dx*dx+dy*dy)||1;
      const off = 2.5 * _dpr;
      const ox=dx/len*off, oy=dy/len*off;
      ctx.strokeStyle = el1.color; ctx.beginPath(); ctx.moveTo(x1+ox,y1+oy); ctx.lineTo(mx+ox,my+oy); ctx.stroke();
      ctx.strokeStyle = el2.color; ctx.beginPath(); ctx.moveTo(mx+ox,my+oy); ctx.lineTo(x2+ox,y2+oy); ctx.stroke();
    }
  });

  // Draw atoms
  sorted.forEach(a => {
    const el = getElement(a.symbol);
    const sx = cx + (a._proj[0] + panX) * scale;
    const sy = cy + (a._proj[1] + panY) * scale;
    const fogF = maxZ > 0 ? 1 - fog * (a._proj[2] / maxZ) * 0.5 : 1;
    const r = (el.r || 1) * (typeof getElementSizeScale==='function' ? getElementSizeScale(a.symbol) : 1) * atomScale * scale * 0.015;
    ctx.globalAlpha = Math.max(0.2, fogF);
    if (glow > 0) {
      ctx.shadowColor = el.color; ctx.shadowBlur = r * glow * 2;
    }
    ctx.fillStyle = el.color;
    ctx.beginPath(); ctx.arc(sx, sy, Math.max(1.5, r), 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
  });
  ctx.globalAlpha = 1;
  delete window._pubDPR;
}

function exportTrajectoryFramePNG() {
  if (!molecule) return notify('No structure loaded', 'error');
  const offCanvas = document.createElement('canvas');
  const w = parseInt(document.getElementById('gifWidth')?.value) || canvas.width;
  const h = parseInt(document.getElementById('gifHeight')?.value) || canvas.height;
  offCanvas.width = w; offCanvas.height = h;
  const offCtx = offCanvas.getContext('2d');
  renderToCanvas(offCtx, w, h);
  offCanvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trajName||molecule?.name||'molecule'}_frame${trajCurrentFrame+1}.png`;
    a.click();
    URL.revokeObjectURL(url);
    notify('PNG frame exported', 'success');
  }, 'image/png');
}

function closeTrajExportModal() {
  const modal = document.getElementById('trajExportModal');
  if (modal) modal.style.display = 'none';
}

function updateGifFrameRange() {
  const el = document.getElementById('gifEndFrame');
  if (el && !el._userSet) el.value = trajectoryFrames.length;
}

// ═══════════════════════════════════════════════════════════
