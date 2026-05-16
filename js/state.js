/* ═══════════════════════════════════════════════════════
   State — MogadocLab
   ═══════════════════════════════════════════════════════ */

// STATE
// ═══════════════════════════════════════════════════════════
let molecule=null, viewMode='ballstick', autoRotate=false, showLabels=false, showInfo=false;
let rotX=0.4, rotY=0, zoom=1, panX=0, panY=0, rotSpeedVal=0.3, lightingMode='standard';
// ── Trajectory / multi-frame state ─────────────────────────
let trajectoryFrames=[], trajCurrentFrame=0, trajPlaying=false, trajPlayTimer=null;
let trajFPS=5, trajLoop=true, trajBounce=false, trajDirection=1;
let trajName='', trajGlobalScale=null;
// ── Rotation state ──────────────────────────────────────────
let rotAxisX=0, rotAxisY=1, rotAxisZ=0;   // current rotation axis (unit-ish)
// Bond display
let showHBonds=true, showIonicBonds=true, showVdwBonds=false;
let bondStyleMode='smart'; // 'smart'|'uniform'|'gradient'
let rotMode='y';                           // 'y'|'x'|'z'|'xyz'|'rock'|'tumble'
let rotTiltAngle=0;                        // for tilted-axis mode (radians)
let rotRockPhase=0;                        // accumulator for rock/oscillate
let rotEasing=true;                        // smooth start/stop
let rotEaseVel=0;                          // current eased angular velocity
let rotTargetVel=0;                        // target angular velocity for easing
let canvas=document.getElementById('molCanvas'); let ctx=canvas.getContext('2d');
let lastImportMeta={source:'Awaiting import',format:'—',confidence:'—'};
function renderImportDetails(meta){
  const el=document.getElementById('importDetails');
  if(!el) return;
  if(!meta){ el.textContent='Awaiting structure import'; return; }
  const fmt=(meta.format||'unknown').toUpperCase();
  const src=meta.source||'Unknown source';
  const name=meta.inputName||'Untitled';
  const conf=meta.confidence||'parsed';
  const extra=[];
  if(meta.coordinateMode) extra.push('coords: '+meta.coordinateMode);
  if(meta.units) extra.push('units: '+meta.units);
  el.innerHTML=`<strong>${src}</strong> · ${fmt}\nFile: ${name}\nStatus: ${conf}${extra.length?' · '+extra.join(' · '):''}`;
}

let _resizeTimer=null;
function resizeCanvasDebounced(){clearTimeout(_resizeTimer);_resizeTimer=setTimeout(resizeCanvas,60);}
function resizeCanvas() {
  const a=document.getElementById('canvasArea');
  canvas.width=a.clientWidth*devicePixelRatio; canvas.height=a.clientHeight*devicePixelRatio;
  canvas.style.width=a.clientWidth+'px'; canvas.style.height=a.clientHeight+'px'; render();
}
window.addEventListener('resize',resizeCanvasDebounced);

// ═══════════════════════════════════════════════════════════
