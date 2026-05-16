/* ═══════════════════════════════════════════════════════
   Measurements — MogadocLab
   ═══════════════════════════════════════════════════════ */

// FEATURE 1 — MEASUREMENT MODE (bond length · angle · dihedral)
// ═══════════════════════════════════════════════════════════
let measureMode=null, measureAtoms=[];
const MEASURE_NEEDS={distance:2,angle:3,dihedral:4};
const MEASURE_LABELS={distance:'BOND LENGTH',angle:'BOND ANGLE',dihedral:'DIHEDRAL ANGLE'};

function startMeasure(mode){
  measureMode=mode; measureAtoms=[];
  document.getElementById('btnMeasureDist').classList.toggle('active',mode==='distance');
  document.getElementById('btnMeasureAngle').classList.toggle('active',mode==='angle');
  document.getElementById('btnMeasureDihed').classList.toggle('active',mode==='dihedral');
  document.getElementById('btnMeasureClear').style.display='inline-flex';
  updateMeasurePanel();
  updateBondAssignHint?.();
  notify(`${MEASURE_LABELS[mode]}: click ${MEASURE_NEEDS[mode]} atoms`,'info');
}
function stopMeasure(){
  measureMode=null; measureAtoms=[];
  ['btnMeasureDist','btnMeasureAngle','btnMeasureDihed'].forEach(id=>document.getElementById(id).classList.remove('active'));
  document.getElementById('btnMeasureClear').style.display='none';
  document.getElementById('measurePanel').classList.remove('visible');
  updateBondAssignHint?.();
  render();
}
function updateMeasurePanel(){
  if(!measureMode)return;
  const needed=MEASURE_NEEDS[measureMode];
  document.getElementById('measurePanel').classList.add('visible');
  document.getElementById('measureTitle').textContent=MEASURE_LABELS[measureMode];
  if(measureAtoms.length<needed){
    const names=measureAtoms.map(i=>molecule.atoms[i].symbol+(i+1)).join(' → ');
    document.getElementById('measureAtoms').textContent=names?names+' → ?':'Click atoms to select';
    document.getElementById('measureResult').textContent='';
    document.getElementById('measureHint').textContent=`${measureAtoms.length} / ${needed} atoms selected · Esc to cancel`;
  } else {
    const atoms=measureAtoms.map(i=>molecule.atoms[i]);
    document.getElementById('measureAtoms').textContent=measureAtoms.map(i=>molecule.atoms[i].symbol+(i+1)).join(' → ');
    let result='';
    if(measureMode==='distance') result=calcDistance(atoms[0],atoms[1]).toFixed(3)+' Å';
    else if(measureMode==='angle') result=calcAngle(atoms[0],atoms[1],atoms[2]).toFixed(2)+'°';
    else if(measureMode==='dihedral') result=calcDihedral(atoms[0],atoms[1],atoms[2],atoms[3]).toFixed(2)+'°';
    document.getElementById('measureResult').textContent=result;
    document.getElementById('measureHint').textContent='Click any atom to start a new measurement';
  }
}
function calcDistance(a,b){return Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2+(a.z-b.z)**2);}
function calcAngle(a,b,c){
  const v1=[a.x-b.x,a.y-b.y,a.z-b.z],v2=[c.x-b.x,c.y-b.y,c.z-b.z];
  const dot=v1[0]*v2[0]+v1[1]*v2[1]+v1[2]*v2[2];
  const m1=Math.sqrt(v1[0]**2+v1[1]**2+v1[2]**2),m2=Math.sqrt(v2[0]**2+v2[1]**2+v2[2]**2);
  return Math.acos(Math.max(-1,Math.min(1,dot/(m1*m2))))*180/Math.PI;
}
function calcDihedral(a,b,c,d){
  const b1=[b.x-a.x,b.y-a.y,b.z-a.z],b2=[c.x-b.x,c.y-b.y,c.z-b.z],b3=[d.x-c.x,d.y-c.y,d.z-c.z];
  const cross=(u,v)=>[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  const dot=(u,v)=>u[0]*v[0]+u[1]*v[1]+u[2]*v[2];
  const n1=cross(b1,b2),n2=cross(b2,b3),m=cross(n1,b2);
  return Math.atan2(dot(m,n2)/Math.sqrt(dot(b2,b2)),dot(n1,n2))*180/Math.PI;
}
canvas.addEventListener('click',e=>{
  if(!measureMode||!molecule)return;
  const rect=canvas.getBoundingClientRect(),mx=(e.clientX-rect.left)*devicePixelRatio,my=(e.clientY-rect.top)*devicePixelRatio;
  let hit=null,minD=Infinity;
  molecule.atoms.forEach(a=>{
    if(a._screenX===undefined)return;
    const dx=mx-a._screenX,dy=my-a._screenY,d=Math.sqrt(dx*dx+dy*dy);
    if(d<(a._screenR||12)+8&&d<minD){minD=d;hit=a;}
  });
  if(!hit)return;
  const needed=MEASURE_NEEDS[measureMode];
  if(measureAtoms.length>=needed)measureAtoms=[];
  if(measureAtoms.length>0&&measureAtoms[measureAtoms.length-1]===hit.idx)return;
  measureAtoms.push(hit.idx);
  updateMeasurePanel();
  updateBondAssignHint?.();
  render();
});

// ═══════════════════════════════════════════════════════════
