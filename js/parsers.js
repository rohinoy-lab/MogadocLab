/* ═══════════════════════════════════════════════════════
   Parsers — MogadocLab
   ═══════════════════════════════════════════════════════ */

// PARSERS
// ═══════════════════════════════════════════════════════════
const BOHR_TO_ANG = 0.529177210903;
const ATOMIC_NUMBER_TO_SYMBOL = Object.fromEntries(Object.entries(ELEMENTS_DEFAULT).map(([sym,val])=>[String(val.z),sym]));
const SUPPORTED_IMPORTERS = {
  xyz:'XYZ cartesian coordinates',
  mol:'MDL MOL / SDF',
  mol2:'Tripos MOL2',
  json:'JSON atom-bond schema',
  pdb:'PDB / biomolecular cartesian coordinates',
  gaussian:'Gaussian / GaussView input-output',
  orca:'ORCA input-output',
  vasp:'VASP POSCAR / CONTCAR',
  qe:'Quantum ESPRESSO',
  cp2k:'CP2K',
  nwchem:'NWChem',
  cube:'Gaussian cube',
  cif:'Crystallographic CIF',
  xsf:'XCrySDen XSF'
};

function normalizeSymbol(sym){
  if(sym===undefined||sym===null) return 'C';
  let s=String(sym).trim();
  if(!s) return 'C';
  s=s.replace(/^[0-9]+/,'').replace(/[^A-Za-z]/g,'');
  if(!s) return 'C';
  s=s.charAt(0).toUpperCase()+s.slice(1).toLowerCase();
  if(ELEMENTS_DEFAULT[s]) return s;
  if(s.length>1){
    const short=s.charAt(0).toUpperCase()+s.charAt(1).toLowerCase();
    if(ELEMENTS_DEFAULT[short]) return short;
    const one=s.charAt(0).toUpperCase();
    if(ELEMENTS_DEFAULT[one]) return one;
  }
  return s;
}
function symbolFromAtomicNumber(z){ return ATOMIC_NUMBER_TO_SYMBOL[String(parseInt(z)||0)] || 'C'; }
function makeAtom(symbol,x,y,z,idx,extra={}){ return {symbol:normalizeSymbol(symbol),x:+x,y:+y,z:+z,idx,...extra}; }
const IMPORT_COVALENT_RADII = {
  H:0.31, He:0.28, Li:1.28, Be:0.96, B:0.84, C:0.76, N:0.71, O:0.66, F:0.57, Ne:0.58,
  Na:1.66, Mg:1.41, Al:1.21, Si:1.11, P:1.07, S:1.05, Cl:1.02, Ar:1.06,
  K:2.03, Ca:1.76, Sc:1.70, Ti:1.60, V:1.53, Cr:1.39, Mn:1.39, Fe:1.32, Co:1.26,
  Ni:1.24, Cu:1.32, Zn:1.22, Ga:1.22, Ge:1.20, As:1.19, Se:1.20, Br:1.20, Kr:1.16,
  Rb:2.20, Sr:1.95, Y:1.90, Zr:1.75, Nb:1.64, Mo:1.54, Tc:1.47, Ru:1.46, Rh:1.42,
  Pd:1.39, Ag:1.45, Cd:1.44, In:1.42, Sn:1.39, Sb:1.39, Te:1.38, I:1.39, Xe:1.40,
  Cs:2.44, Ba:2.15, La:2.07, Ce:2.04, Pr:2.03, Nd:2.01, Sm:1.98, Eu:1.98, Gd:1.96,
  Tb:1.94, Dy:1.92, Ho:1.92, Er:1.89, Tm:1.90, Yb:1.87, Lu:1.87,
  Hf:1.75, Ta:1.70, W:1.62, Re:1.51, Os:1.44, Ir:1.41, Pt:1.36, Au:1.36, Hg:1.32,
  Tl:1.45, Pb:1.46, Bi:1.48, Po:1.40, At:1.50,
  default:1.20
};
function getImportCovalentRadius(symbol){
  return IMPORT_COVALENT_RADII[normalizeSymbol(symbol)] || IMPORT_COVALENT_RADII.default;
}
const EXPECTED_NEIGHBOR_RANGES = {
  H:[1,1], F:[1,1], Cl:[1,1], Br:[1,1], I:[1,1],
  O:[1,3], N:[1,4], C:[1,4], P:[1,6], S:[1,6],
  B:[1,4], Si:[1,4], default:[0,8]
};
const METAL_SYMBOLS = new Set(['Li','Be','Na','Mg','Al','K','Ca','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn','Ga','Rb','Sr','Y','Zr','Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn','Cs','Ba','La','Ce','Pr','Nd','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu','Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg','Tl','Pb','Bi']);
const ALKALI_METALS = new Set(['Li','Na','K','Rb','Cs']);
const ALKALINE_EARTH_METALS = new Set(['Be','Mg','Ca','Sr','Ba']);
const HALOGEN_SYMBOLS = new Set(['F','Cl','Br','I']);
const COORDINATION_DONORS = new Set(['O','N','S','P','F','Cl','Br','I']);
function computeFormulaFromAtoms(atoms){
  const counts={};
  (atoms||[]).forEach(a=>{
    const s=normalizeSymbol(a.symbol);
    counts[s]=(counts[s]||0)+1;
  });
  const ord=['C','H',...Object.keys(counts).filter(e=>e!=='C'&&e!=='H').sort()];
  return ord.filter(e=>counts[e]).map(e=>e+(counts[e]>1?counts[e]:'')).join('') || '—';
}
function parseXYZAtomLine(line, idx){
  const parts=String(line||'').trim().split(/\s+/).filter(Boolean);
  if(parts.length<4) return null;
  const tail=parts.slice(-3).map(Number);
  if(tail.every(Number.isFinite)){
    if(parts.length>=5 && /^\d+$/.test(parts[0]) && /[A-Za-z]/.test(parts[1]||'')){
      return makeAtom(parts[1], tail[0], tail[1], tail[2], idx);
    }
    const lead=parts[0];
    if(/[A-Za-z]/.test(lead) || /^\d+$/.test(lead)){
      const symbol=/^\d+$/.test(lead) ? symbolFromAtomicNumber(lead) : lead;
      return makeAtom(symbol, tail[0], tail[1], tail[2], idx);
    }
  }
  return null;
}
function summarizeBonding(atoms,bonds,mode='inferred'){
  const degree=Array((atoms||[]).length).fill(0);
  const typeCounts={};
  (bonds||[]).forEach(b=>{
    if(!b) return;
    degree[b.a]=(degree[b.a]||0)+1;
    degree[b.b]=(degree[b.b]||0)+1;
    const type=b.type||'covalent';
    typeCounts[type]=(typeCounts[type]||0)+1;
  });
  const flagged=[];
  let metalCenters=0;
  atoms.forEach((atom, idx)=>{
    const sym=normalizeSymbol(atom.symbol);
    const d=degree[idx]||0;
    if(METAL_SYMBOLS.has(sym)) metalCenters++;
    const [min,max]=EXPECTED_NEIGHBOR_RANGES[sym] || EXPECTED_NEIGHBOR_RANGES.default;
    if(d<min || d>max){
      flagged.push({idx,symbol:sym,degree:d,expected:`${min}-${max}`});
    }
  });
  const flaggedPreview=flagged.slice(0,5).map(item=>`${item.symbol}${item.idx+1} (${item.degree}; exp ${item.expected})`);
  const warnings=[];
  if(mode==='inferred') warnings.push('Bond network inferred from interatomic distances.');
  if(metalCenters) warnings.push('Metal-containing structures may require manual bond review.');
  if(flagged.length) warnings.push(`Unusual coordination detected for ${flagged.length} atom${flagged.length!==1?'s':''}.`);
  let confidence='explicit bonding';
  if(mode==='inferred') confidence = flagged.length > Math.max(2, atoms.length*0.08) ? 'geometry-derived bonding; review recommended' : 'geometry-derived bonding';
  return {
    mode,
    confidence,
    degree,
    typeCounts,
    flaggedCount: flagged.length,
    flaggedPreview,
    metalCenters,
    warnings,
    formula: computeFormulaFromAtoms(atoms)
  };
}
function buildBondTypeSummary(typeCounts){
  const labels={
    covalent:'covalent',
    aromatic:'aromatic',
    metallic:'coordination',
    ionic:'ionic',
    hydrogen:'hydrogen',
    vdw:'vdW'
  };
  return Object.entries(typeCounts||{})
    .sort((a,b)=>b[1]-a[1])
    .map(([type,count])=>`${count} ${labels[type]||type}`)
    .join(' · ');
}
function autoDetectBonds(atoms){
  const bonds=[];
  const seen=new Set();
  for(let i=0;i<(atoms||[]).length;i++){
    const ai=atoms[i];
    if(!ai) continue;
    const ri=getImportCovalentRadius(ai.symbol);
    for(let j=i+1;j<(atoms||[]).length;j++){
      const aj=atoms[j];
      if(!aj) continue;
      const dx=(ai.x-aj.x), dy=(ai.y-aj.y), dz=(ai.z-aj.z);
      const dist=Math.sqrt(dx*dx+dy*dy+dz*dz);
      if(!isFinite(dist) || dist<0.1) continue;
      const rj=getImportCovalentRadius(aj.symbol);
      const maxDist=Math.max(0.6,(ri+rj)*1.24 + 0.18);
      const minDist=Math.max(0.35,Math.min(ri,rj)*0.45);
        if(dist>=minDist && dist<=maxDist){
          const key=`${i}-${j}`;
          if(!seen.has(key)){
            seen.add(key);
            bonds.push({a:i,b:j,order:1,type:'covalent',inferred:true,inferenceKind:'distance',inferenceNote:'detected from interatomic distance'});
          }
        }
      }
  }
  const maxNeighbors={H:1,F:1,Cl:1,Br:1,I:1,O:3,N:4,C:4,P:6,S:6,default:6};
  const degree=Array((atoms||[]).length).fill(0);
  const sorted=bonds.sort((u,v)=>{
    const au=atoms[u.a], bu=atoms[u.b], av=atoms[v.a], bv=atoms[v.b];
    const du=(au.x-bu.x)**2 + (au.y-bu.y)**2 + (au.z-bu.z)**2;
    const dv=(av.x-bv.x)**2 + (av.y-bv.y)**2 + (av.z-bv.z)**2;
    return du-dv;
  });
  const pruned=[];
  for(const b of sorted){
    const sa=normalizeSymbol(atoms[b.a]?.symbol);
    const sb=normalizeSymbol(atoms[b.b]?.symbol);
    const ma=maxNeighbors[sa] ?? maxNeighbors.default;
    const mb=maxNeighbors[sb] ?? maxNeighbors.default;
    if(degree[b.a] >= ma || degree[b.b] >= mb) continue;
    degree[b.a]++; degree[b.b]++;
    pruned.push(b);
  }
  return pruned;
}
function getBondLengthForAtoms(atoms, bond){
  const a=atoms[bond.a], b=atoms[bond.b];
  if(!a||!b) return Infinity;
  return Math.hypot(a.x-b.x, a.y-b.y, a.z-b.z);
}
function buildAdjacencyMap(atoms, bonds){
  const adj=Array((atoms||[]).length).fill(0).map(()=>[]);
  (bonds||[]).forEach((bond, idx)=>{
    if(!bond) return;
    adj[bond.a]?.push({idx:bond.b,bondIndex:idx});
    adj[bond.b]?.push({idx:bond.a,bondIndex:idx});
  });
  return adj;
}
function canonicalizeCycle(nodes){
  const vals=[...nodes];
  const n=vals.length;
  const rots=[];
  for(let i=0;i<n;i++){
    rots.push(vals.slice(i).concat(vals.slice(0,i)));
  }
  const rev=[...vals].reverse();
  for(let i=0;i<n;i++){
    rots.push(rev.slice(i).concat(rev.slice(0,i)));
  }
  return rots
    .map(r=>r.join('-'))
    .sort()[0];
}
function findSimpleCyclesOfSize(atoms, bonds, size){
  const adj=buildAdjacencyMap(atoms,bonds);
  const found=new Map();
  function dfs(start, current, path, visited){
    if(path.length===size){
      if(adj[current].some(n=>n.idx===start)){
        const key=canonicalizeCycle(path);
        if(!found.has(key)) found.set(key, [...path]);
      }
      return;
    }
    for(const next of adj[current]){
      if(next.idx<start) continue;
      if(visited.has(next.idx)) continue;
      visited.add(next.idx);
      path.push(next.idx);
      dfs(start, next.idx, path, visited);
      path.pop();
      visited.delete(next.idx);
    }
  }
  for(let start=0; start<(atoms||[]).length; start++){
    dfs(start, start, [start], new Set([start]));
  }
  return [...found.values()];
}
function markAromaticRings(atoms, bonds){
  const cycles=findSimpleCyclesOfSize(atoms, bonds, 6);
  if(!cycles.length) return {bonds, aromaticRings:0};
  const bondMap=new Map();
  bonds.forEach((bond, idx)=>{
    const key=bond.a<bond.b?`${bond.a}-${bond.b}`:`${bond.b}-${bond.a}`;
    bondMap.set(key, idx);
  });
  let aromaticRings=0;
  cycles.forEach(cycle=>{
    const syms=cycle.map(i=>normalizeSymbol(atoms[i].symbol));
    const allowed=syms.every(sym=>['C','N','O','S','P'].includes(sym));
    if(!allowed) return;
    const cycleBondIdx=[];
    let totalLen=0;
    for(let i=0;i<cycle.length;i++){
      const a=cycle[i], b=cycle[(i+1)%cycle.length];
      const key=a<b?`${a}-${b}`:`${b}-${a}`;
      const bondIdx=bondMap.get(key);
      if(bondIdx===undefined) return;
      cycleBondIdx.push(bondIdx);
      totalLen+=getBondLengthForAtoms(atoms,bonds[bondIdx]);
    }
    const avgLen=totalLen/cycleBondIdx.length;
    if(avgLen<1.32 || avgLen>1.47) return;
    const maxDeviation=Math.max(...cycleBondIdx.map(idx=>Math.abs(getBondLengthForAtoms(atoms,bonds[idx])-avgLen)));
    if(maxDeviation>0.085) return;
    cycleBondIdx.forEach(idx=>{
      bonds[idx].order=1.5;
      bonds[idx].type='aromatic';
      bonds[idx].inferenceKind='aromatic';
      bonds[idx].inferenceNote='assigned as aromatic from ring geometry';
    });
    aromaticRings++;
  });
  return {bonds, aromaticRings};
}
function promoteMultipleBonds(atoms, bonds){
  const valenceTarget={C:4,N:3,O:2,P:3,S:2,default:4};
  const valenceScore=Array((atoms||[]).length).fill(0);
  bonds.forEach(b=>{
    valenceScore[b.a]+=Number(b.order)||1;
    valenceScore[b.b]+=Number(b.order)||1;
  });
  let promoted=0;
  bonds
    .map((bond, idx)=>({bond, idx, len:getBondLengthForAtoms(atoms,bond)}))
    .sort((u,v)=>u.len-v.len)
    .forEach(({bond, len})=>{
      if(bond.type!=='covalent' || bond.order!==1) return;
      const sa=normalizeSymbol(atoms[bond.a].symbol);
      const sb=normalizeSymbol(atoms[bond.b].symbol);
      const pair=[sa,sb].sort().join('-');
      const targetA=valenceTarget[sa] ?? valenceTarget.default;
      const targetB=valenceTarget[sb] ?? valenceTarget.default;
      const roomA=valenceScore[bond.a] < targetA;
      const roomB=valenceScore[bond.b] < targetB;
      if(!roomA || !roomB) return;
      let promoteTo=0;
      if((pair==='C-O' || pair==='N-O') && len<1.30) promoteTo=2;
      else if(pair==='C-N' && len<1.27) promoteTo=2;
      else if(pair==='C-C' && len<1.38) promoteTo=2;
      else if(pair==='C-C' && len<1.24 && valenceScore[bond.a] <= targetA-2 && valenceScore[bond.b] <= targetB-2) promoteTo=3;
      else if(pair==='C-N' && len<1.18 && valenceScore[bond.a] <= targetA-2 && valenceScore[bond.b] <= targetB-2) promoteTo=3;
      if(!promoteTo) return;
      const increment=promoteTo-1;
      if(valenceScore[bond.a]+increment>targetA || valenceScore[bond.b]+increment>targetB) return;
      bond.order=promoteTo;
      bond.inferenceKind = promoteTo>=3 ? 'triple' : 'multiple';
      bond.inferenceNote = `promoted to ${promoteTo===2?'double':'triple'} bond from short geometry`;
      valenceScore[bond.a]+=increment;
      valenceScore[bond.b]+=increment;
      promoted++;
    });
  return {bonds, promoted};
}
function classifyInferredBondTypes(atoms, bonds){
  let typed=0;
  (bonds||[]).forEach(bond=>{
    if(!bond || !bond.inferred) return;
    if(bond.type==='aromatic' || (bond.order||1) > 1) return;
    const a=atoms[bond.a], b=atoms[bond.b];
    if(!a || !b) return;
    const sa=normalizeSymbol(a.symbol);
    const sb=normalizeSymbol(b.symbol);
    const len=getBondLengthForAtoms(atoms, bond);
    const oneIsMetal=METAL_SYMBOLS.has(sa) || METAL_SYMBOLS.has(sb);
    if(!oneIsMetal) return;
    const metalSym=METAL_SYMBOLS.has(sa) ? sa : sb;
    const otherSym=metalSym===sa ? sb : sa;
    if(!COORDINATION_DONORS.has(otherSym)) return;
    const covalentCutoff=(getImportCovalentRadius(sa)+getImportCovalentRadius(sb))*1.02;
    const shouldBeIonic=
      ALKALI_METALS.has(metalSym) ||
      ALKALINE_EARTH_METALS.has(metalSym) ||
      (HALOGEN_SYMBOLS.has(otherSym) && len>covalentCutoff*0.95) ||
      len>covalentCutoff+0.18;
    bond.type=shouldBeIonic ? 'ionic' : 'metallic';
    bond.inferenceKind = shouldBeIonic ? 'ionic-contact' : 'coordination';
    bond.inferenceNote = shouldBeIonic
      ? 'classified as ionic contact from metal-ligand geometry'
      : 'classified as coordination bond from metal-ligand geometry';
    typed++;
  });
  return {bonds, typed};
}
function deriveBondingConfidence(summary, refinement, hasExplicitBonds){
  if(hasExplicitBonds){
    return {
      score:97,
      confidence:'explicit bonding',
      reviewLevel:'trusted'
    };
  }
  let score=84;
  score-=Math.min(32, (summary.flaggedCount||0)*4);
  score-=Math.min(12, (summary.metalCenters||0)*2);
  score-=Math.min(8, (refinement.promotedBonds||0)*1.5);
  score+=Math.min(6, (refinement.aromaticRings||0)*2);
  score=Math.max(18, Math.min(96, Math.round(score)));
  let confidence='geometry-derived bonding';
  let reviewLevel='review';
  if(score>=88){ confidence='high-confidence geometry-derived bonding'; reviewLevel='strong'; }
  else if(score>=72){ confidence='geometry-derived bonding'; reviewLevel='review'; }
  else if(score>=56){ confidence='geometry-derived bonding; review recommended'; reviewLevel='caution'; }
  else { confidence='geometry-derived bonding; manual review advised'; reviewLevel='manual'; }
  return {score, confidence, reviewLevel};
}
function refineInferredBonds(atoms, bonds){
  const working=(bonds||[]).map(b=>({...b}));
  const aromatic=markAromaticRings(atoms, working);
  const promoted=promoteMultipleBonds(atoms, aromatic.bonds);
  const typed=classifyInferredBondTypes(atoms, promoted.bonds);
  return {
    bonds:typed.bonds,
    aromaticRings:aromatic.aromaticRings,
    promotedBonds:promoted.promoted,
    typedBonds:typed.typed
  };
}
function finalizeMolecule(atoms,bonds=[],meta={}){
  const cleanAtoms=[];
  for(let i=0;i<(atoms||[]).length;i++){
    const a=atoms[i];
    if(!a||!isFinite(a.x)||!isFinite(a.y)||!isFinite(a.z)) continue;
    cleanAtoms.push({...a,symbol:normalizeSymbol(a.symbol),idx:cleanAtoms.length});
  }
  const cleanBonds=(bonds||[])
    .filter(b=>b&&Number.isInteger(b.a)&&Number.isInteger(b.b)&&b.a!==b.b&&b.a>=0&&b.b>=0&&b.a<cleanAtoms.length&&b.b<cleanAtoms.length)
    .map(b=>({a:b.a,b:b.b,order:(b.order===1.5?1.5:(parseFloat(b.order)||1)),type:b.type||'covalent',inferred:false,inferenceKind:'explicit',inferenceNote:'read from source connectivity record'}));
  const hasExplicitBonds=cleanBonds.length>0;
  const inferredBase=hasExplicitBonds?null:autoDetectBonds(cleanAtoms);
  const refinement=hasExplicitBonds?{bonds:cleanBonds, aromaticRings:0, promotedBonds:0, typedBonds:0}:refineInferredBonds(cleanAtoms, inferredBase);
  const finalBonds=refinement.bonds;
  const bondingSummary=summarizeBonding(cleanAtoms, finalBonds, hasExplicitBonds?'explicit':'inferred');
  const confidenceSummary=deriveBondingConfidence(bondingSummary, refinement, hasExplicitBonds);
  if(!hasExplicitBonds && refinement.aromaticRings) bondingSummary.warnings.push(`Detected ${refinement.aromaticRings} aromatic ring${refinement.aromaticRings!==1?'s':''} from geometry.`);
  if(!hasExplicitBonds && refinement.promotedBonds) bondingSummary.warnings.push(`Promoted ${refinement.promotedBonds} short bond${refinement.promotedBonds!==1?'s':''} to higher order.`);
  if(!hasExplicitBonds && refinement.typedBonds) bondingSummary.warnings.push(`Classified ${refinement.typedBonds} metal-contact bond${refinement.typedBonds!==1?'s':''} from geometry.`);
  return {
    atoms:cleanAtoms,
    bonds:finalBonds,
    meta:{
      source:'unknown',
      format:'unknown',
      confidence:confidenceSummary.confidence,
      qualityScore:confidenceSummary.score,
      reviewLevel:confidenceSummary.reviewLevel,
      bondingSource:hasExplicitBonds?'explicit connectivity record':'distance-based inference',
      bondingTypes:buildBondTypeSummary(bondingSummary.typeCounts),
      atomCount:cleanAtoms.length,
      bondCount:finalBonds.length,
      formula:bondingSummary.formula,
      flaggedAtoms:bondingSummary.flaggedCount,
      flaggedPreview:bondingSummary.flaggedPreview,
      bondTypeCounts:bondingSummary.typeCounts,
      aromaticRings:refinement.aromaticRings,
      promotedBonds:refinement.promotedBonds,
      typedBonds:refinement.typedBonds,
      warnings:bondingSummary.warnings,
      ...meta
    }
  };
}
function parseXYZ(text, meta={}) {
  const lines=text.trim().split(/\r?\n/), n=parseInt((lines[0]||'').trim()), atoms=[];
  if(!Number.isFinite(n)) throw new Error('Invalid XYZ header');
  for(let i=2;i<2+n&&i<lines.length;i++){
    const atom=parseXYZAtomLine(lines[i], atoms.length);
    if(atom) atoms.push(atom);
  }
  return finalizeMolecule(atoms,[],{format:'xyz',source:'XYZ',...meta});
}

function parseMultiFrameXYZ(text, meta={}) {
  const lines = String(text||'').split(/\r?\n/);
  const frames = [];
  let baseFrame = null;
  let bondTemplate = null;
  let sharedMeta = null;
  let i = 0;
  while (i < lines.length) {
    const nLine = (lines[i] || '').trim();
    if (!nLine) { i++; continue; }
    const n = parseInt(nLine);
    if (!Number.isFinite(n) || n <= 0) { i++; continue; }
    if (i + 1 + n >= lines.length && frames.length > 0) break;
    const comment = (lines[i + 1] || '').trim();
    const atoms = [];
    for (let j = i + 2; j < i + 2 + n && j < lines.length; j++) {
      const atom = parseXYZAtomLine(lines[j], atoms.length);
      if (atom) atoms.push(atom);
    }
    if (atoms.length === n) {
      if (!baseFrame) {
        baseFrame = finalizeMolecule(atoms, [], {
          format: 'xyz', source: 'Multi-frame XYZ',
          frameIndex: 0, comment, ...meta
        });
        bondTemplate = (baseFrame.bonds || []).map(b=>({...b}));
        sharedMeta = {...(baseFrame.meta||{})};
        frames.push(baseFrame);
      } else {
        frames.push({
          atoms,
          bonds: bondTemplate.map(b=>({...b})),
          meta: {
            ...sharedMeta,
            ...meta,
            format: 'xyz',
            source: 'Multi-frame XYZ',
            frameIndex: frames.length,
            comment
          }
        });
      }
    } else if (frames.length === 0 && atoms.length > 0) {
      break;
    }
    i += 2 + n;
  }
  return frames;
}

function countXYZFrames(text) {
  const lines = String(text||'').split(/\r?\n/);
  let count = 0, i = 0;
  while (i < lines.length) {
    const n = parseInt((lines[i] || '').trim());
    if (!Number.isFinite(n) || n <= 0) { i++; continue; }
    let atomsFound = 0;
    for(let j=i+2;j<i+2+n&&j<lines.length;j++){
      if(parseXYZAtomLine(lines[j], atomsFound)) atomsFound++;
    }
    if(atomsFound===n) count++;
    i += 2 + n;
  }
  return count;
}
function parseMOL(text, meta={}) {
  const lines=text.split(/\r?\n/), c=(lines[3]||'').trim().split(/\s+/);
  const nA=parseInt(c[0])||0, nB=parseInt(c[1])||0, atoms=[], bonds=[];
  for(let i=4;i<4+nA;i++){
    const p=(lines[i]||'').trim().split(/\s+/);
    if(p.length>=4) atoms.push(makeAtom(p[3],p[0],p[1],p[2],atoms.length));
  }
  for(let i=4+nA;i<4+nA+nB;i++){
    const p=(lines[i]||'').trim().split(/\s+/);
    if(p.length>=3) bonds.push({a:(parseInt(p[0])||1)-1,b:(parseInt(p[1])||1)-1,order:parseFloat(p[2])||1});
  }
  return finalizeMolecule(atoms,bonds,{format:'mol',source:'MDL MOL/SDF',...meta});
}
function parseMOL2(text, meta={}) {
  const lines=text.split(/\r?\n/), atoms=[], bonds=[];
  let sec='';
  for(const line of lines){
    const t=line.trim();
    if(t.startsWith('@<TRIPOS>')){ sec=t.slice(9); continue; }
    if(sec==='ATOM'){
      const p=t.split(/\s+/);
      if(p.length>=6){
        const sym=normalizeSymbol(p[5].split('.')[0]||p[1].replace(/[0-9]/g,''));
        atoms.push(makeAtom(sym,p[2],p[3],p[4],atoms.length));
      }
    } else if(sec==='BOND'){
      const p=t.split(/\s+/);
      if(p.length>=4){
        const btype=p[3];
        let order=1, type='covalent';
        if(btype==='ar'||btype==='1.5'){order=1.5;type='aromatic';}
        else if(btype==='am'){order=1;type='amide';}
        else if(btype==='du'||btype==='un'){type='vdw';}
        else if(btype==='hb'){type='hydrogen';}
        else order=parseFloat(btype)||1;
        bonds.push({a:parseInt(p[1])-1,b:parseInt(p[2])-1,order,type});
      }
    }
  }
  return finalizeMolecule(atoms,bonds,{format:'mol2',source:'Tripos MOL2',...meta});
}
function parseJSON(text, meta={}) {
  const d=JSON.parse(text);
  if(d.atoms){
    const atoms=d.atoms.map((a,i)=>makeAtom(a.symbol||a.element||a.atomicSymbol||symbolFromAtomicNumber(a.atomicNumber),a.x??(a.coords?.[0]??0),a.y??(a.coords?.[1]??0),a.z??(a.coords?.[2]??0),i,a));
    const bonds=(d.bonds||[]).map(b=>({a:b[0]??b.a,b:b[1]??b.b,order:b[2]??b.order??1,type:b.type||'covalent'}));
    return finalizeMolecule(atoms,bonds,{format:'json',source:'JSON schema',...meta});
  }
  if(d.nodes&&d.edges){
    const atoms=d.nodes.map((n,i)=>makeAtom(n.label||n.element||symbolFromAtomicNumber(n.atomicNumber),n.x||0,n.y||0,n.z||0,i,n));
    const bonds=(d.edges||[]).map(e=>({a:e.source??e.from,b:e.target??e.to,order:e.weight??e.order??1,type:e.type||'covalent'}));
    return finalizeMolecule(atoms,bonds,{format:'json',source:'Graph JSON schema',...meta});
  }
  throw new Error('Unsupported JSON schema');
}
function parsePDB(text, meta={}) {
  const atoms=[], bonds=[];
  for(const line of text.split(/\r?\n/)){
    if(line.startsWith('ATOM')||line.startsWith('HETATM')){
      let sym=(line.slice(76,78).trim()||line.slice(12,16).trim().replace(/[^A-Za-z]/g,''));
      atoms.push(makeAtom(sym,line.slice(30,38),line.slice(38,46),line.slice(46,54),atoms.length,{residue:line.slice(17,20).trim(),chain:line.slice(21,22).trim()}));
    } else if(line.startsWith('CONECT')){
      const p=line.trim().split(/\s+/).slice(1).map(v=>parseInt(v)-1).filter(v=>Number.isInteger(v));
      const a=p[0];
      for(let i=1;i<p.length;i++) if(a<p[i]) bonds.push({a,b:p[i],order:1,type:'covalent'});
    }
  }
  return finalizeMolecule(atoms,bonds,{format:'pdb',source:'Protein Data Bank',...meta});
}
function parseGaussian(text, meta={}){
  const lines=text.split(/\r?\n/);
  let block=[];
  for(let i=0;i<lines.length;i++){
    if(/Standard orientation:|Input orientation:|Z-Matrix orientation:/i.test(lines[i])){
      let j=i+5, tmp=[];
      while(j<lines.length && !/^\s*-+/.test(lines[j])){
        const p=lines[j].trim().split(/\s+/);
        if(p.length>=6 && /^\d+$/.test(p[1])) tmp.push(makeAtom(symbolFromAtomicNumber(p[1]),p[3],p[4],p[5],tmp.length));
        j++;
      }
      if(tmp.length) block=tmp;
    }
  }
  if(!block.length){
    const gjf=[];
    for(const line of lines){
      const m=line.match(/^\s*([A-Z][a-z]?)\s+(-?\d*\.?\d+(?:[Ee][+-]?\d+)?)\s+(-?\d*\.?\d+(?:[Ee][+-]?\d+)?)\s+(-?\d*\.?\d+(?:[Ee][+-]?\d+)?)/);
      if(m) gjf.push(makeAtom(m[1],m[2],m[3],m[4],gjf.length));
    }
    if(gjf.length) block=gjf;
  }
  if(!block.length) throw new Error('No Gaussian cartesian coordinates detected');
  return finalizeMolecule(block,[],{format:'gaussian',source:'Gaussian / GaussView',...meta});
}
function parseOrca(text, meta={}){
  const lines=text.split(/\r?\n/);
  let best=[];
  for(let i=0;i<lines.length;i++){
    if(/CARTESIAN COORDINATES \(ANGSTROEM\)/i.test(lines[i])){
      const tmp=[]; let j=i+2;
      while(j<lines.length && lines[j].trim() && !/^[-*]/.test(lines[j].trim())){
        const p=lines[j].trim().split(/\s+/);
        if(p.length>=4 && /^[A-Za-z]/.test(p[0])) tmp.push(makeAtom(p[0],p[1],p[2],p[3],tmp.length));
        j++;
      }
      if(tmp.length) best=tmp;
    }
    if(/CARTESIAN COORDINATES \(A\.U\.\)/i.test(lines[i])){
      const tmp=[]; let j=i+2;
      while(j<lines.length && lines[j].trim() && !/^[-*]/.test(lines[j].trim())){
        const p=lines[j].trim().split(/\s+/);
        if(p.length>=8 && /^[A-Za-z]/.test(p[0])) tmp.push(makeAtom(p[0],(+p[5])*BOHR_TO_ANG,(+p[6])*BOHR_TO_ANG,(+p[7])*BOHR_TO_ANG,tmp.length));
        j++;
      }
      if(tmp.length) best=tmp;
    }
  }
  if(!best.length){
    const xyz=[];
    let inBlock=false;
    for(const line of lines){
      if(/^\s*\*\s*xyz/i.test(line)){ inBlock=true; continue; }
      if(inBlock && /^\s*\*/.test(line)) break;
      if(inBlock){
        const p=line.trim().split(/\s+/);
        if(p.length>=4) xyz.push(makeAtom(p[0],p[1],p[2],p[3],xyz.length));
      }
    }
    if(xyz.length) best=xyz;
  }
  if(!best.length) throw new Error('No ORCA coordinates detected');
  return finalizeMolecule(best,[],{format:'orca',source:'ORCA',...meta});
}
function parseVASP(text, meta={}){
  const lines=text.split(/\r?\n/).map(l=>l.trim()).filter((l,i)=>!(i>0 && !l && i<8));
  if(lines.length<8) throw new Error('VASP POSCAR/CONTCAR is too short');
  const scale=parseFloat(lines[1])||1;
  const lattice=[2,3,4].map(i=>lines[i].split(/\s+/).slice(0,3).map(Number).map(v=>v*scale));
  let idx=5;
  let symbols=lines[idx].split(/\s+/).map(normalizeSymbol);
  let countsLine=lines[idx+1].split(/\s+/).map(v=>parseInt(v));
  if(countsLine.some(v=>!Number.isInteger(v))){
    symbols = symbols.map((_,i)=>symbolFromAtomicNumber(i+1));
    countsLine = lines[idx].split(/\s+/).map(v=>parseInt(v));
    idx=4;
  }
  idx += 2;
  if(/^selective/i.test(lines[idx])) idx += 1;
  const coordMode=(lines[idx]||'direct').toLowerCase();
  idx += 1;
  const atoms=[];
  const fracToCart=(f)=>({x:f[0]*lattice[0][0]+f[1]*lattice[1][0]+f[2]*lattice[2][0],y:f[0]*lattice[0][1]+f[1]*lattice[1][1]+f[2]*lattice[2][1],z:f[0]*lattice[0][2]+f[1]*lattice[1][2]+f[2]*lattice[2][2]});
  let sidx=0;
  for(let s=0;s<symbols.length;s++){
    const count=countsLine[s]||0;
    for(let c=0;c<count;c++,idx++,sidx++){
      const p=(lines[idx]||'').split(/\s+/);
      if(p.length<3) continue;
      let x=+p[0],y=+p[1],z=+p[2];
      if(coordMode.startsWith('d')){ const cart=fracToCart([x,y,z]); x=cart.x; y=cart.y; z=cart.z; }
      atoms.push(makeAtom(symbols[s]||'C',x,y,z,atoms.length));
    }
  }
  return finalizeMolecule(atoms,[],{format:'vasp',source:'VASP POSCAR/CONTCAR',lattice,coordinateMode:coordMode,...meta});
}
function parseQE(text, meta={}){
  const lines=text.split(/\r?\n/);
  const atoms=[];
  let mode='angstrom';
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    const m=line.match(/ATOMIC_POSITIONS\s*\(?\s*([A-Za-z]+)?\s*\)?/i);
    if(m){
      mode=(m[1]||'angstrom').toLowerCase();
      let j=i+1;
      while(j<lines.length){
        const t=lines[j].trim();
        if(!t || /^(ATOMIC_|CELL_|K_POINTS|OCCUPATIONS|CONSTRAINTS|HUBBARD|SOLVENTS)\b/i.test(t)) break;
        const p=t.split(/\s+/);
        if(p.length>=4 && /^[A-Za-z]/.test(p[0])){
          let x=+p[1],y=+p[2],z=+p[3];
          if(mode==='bohr'||mode==='au') { x*=BOHR_TO_ANG; y*=BOHR_TO_ANG; z*=BOHR_TO_ANG; }
          atoms.push(makeAtom(p[0],x,y,z,atoms.length));
        }
        j++;
      }
    }
    if(/site n\.\s+atom\s+positions/i.test(line)){
      let j=i+1, tmp=[];
      while(j<lines.length){
        const p=lines[j].trim().split(/\s+/);
        if(p.length>=7 && /^\d+$/.test(p[0])) tmp.push(makeAtom(p[1],p[4],p[5],p[6],tmp.length));
        else if(tmp.length) break;
        j++;
      }
      if(tmp.length) return finalizeMolecule(tmp,[],{format:'qe',source:'Quantum ESPRESSO',...meta});
    }
  }
  if(!atoms.length) throw new Error('No Quantum ESPRESSO coordinates detected');
  return finalizeMolecule(atoms,[],{format:'qe',source:'Quantum ESPRESSO',coordinateMode:mode,...meta});
}
function parseCP2K(text, meta={}){
  const lines=text.split(/\r?\n/);
  let best=[];
  for(let i=0;i<lines.length;i++){
    if(/^\s*&COORD/i.test(lines[i])){
      const tmp=[]; let j=i+1;
      while(j<lines.length && !/^\s*&END\s+COORD/i.test(lines[j])){
        const p=lines[j].trim().split(/\s+/);
        if(p.length>=4 && /^[A-Za-z]/.test(p[0])) tmp.push(makeAtom(p[0],p[1],p[2],p[3],tmp.length));
        j++;
      }
      if(tmp.length) best=tmp;
    }
    if(/ATOMIC COORDINATES IN angstrom/i.test(lines[i])){
      const tmp=[]; let j=i+2;
      while(j<lines.length){
        const p=lines[j].trim().split(/\s+/);
        if(p.length>=7 && /^\d+$/.test(p[0])) tmp.push(makeAtom(p[2],p[4],p[5],p[6],tmp.length));
        else if(tmp.length) break;
        j++;
      }
      if(tmp.length) best=tmp;
    }
  }
  if(!best.length) throw new Error('No CP2K coordinates detected');
  return finalizeMolecule(best,[],{format:'cp2k',source:'CP2K',...meta});
}
function parseNWChem(text, meta={}){
  const lines=text.split(/\r?\n/);
  let best=[];
  for(let i=0;i<lines.length;i++){
    if(/Output coordinates in angstroms/i.test(lines[i])){
      const tmp=[]; let j=i+4;
      while(j<lines.length){
        const p=lines[j].trim().split(/\s+/);
        if(p.length>=6 && /^\d+$/.test(p[0])) tmp.push(makeAtom(p[1],p[3],p[4],p[5],tmp.length));
        else if(tmp.length) break;
        j++;
      }
      if(tmp.length) best=tmp;
    }
  }
  if(!best.length){
    const tmp=[]; let inGeom=false;
    for(const line of lines){
      if(/^\s*geometry\b/i.test(line)){ inGeom=true; continue; }
      if(inGeom && /^\s*end\s*$/i.test(line)) break;
      if(inGeom){
        const p=line.trim().split(/\s+/);
        if(p.length>=4 && /^[A-Za-z]/.test(p[0])) tmp.push(makeAtom(p[0],p[1],p[2],p[3],tmp.length));
      }
    }
    if(tmp.length) best=tmp;
  }
  if(!best.length) throw new Error('No NWChem coordinates detected');
  return finalizeMolecule(best,[],{format:'nwchem',source:'NWChem',...meta});
}
function parseCube(text, meta={}){
  const lines=text.split(/\r?\n/).filter(Boolean);
  if(lines.length<6) throw new Error('Cube file too short');
  const head=lines[2].trim().split(/\s+/);
  const nAtoms=Math.abs(parseInt(head[0])||0);
  const atoms=[];
  for(let i=6;i<6+nAtoms && i<lines.length;i++){
    const p=lines[i].trim().split(/\s+/);
    if(p.length>=5) atoms.push(makeAtom(symbolFromAtomicNumber(p[0]),(+p[2])*BOHR_TO_ANG,(+p[3])*BOHR_TO_ANG,(+p[4])*BOHR_TO_ANG,atoms.length));
  }
  return finalizeMolecule(atoms,[],{format:'cube',source:'Gaussian cube',units:'bohr->angstrom',...meta});
}
function fracToCartFromCell(a,b,c,alpha,beta,gamma,fx,fy,fz){
  const ar=alpha*Math.PI/180, br=beta*Math.PI/180, gr=gamma*Math.PI/180;
  const ax=a, ay=0, az=0;
  const bx=b*Math.cos(gr), by=b*Math.sin(gr), bz=0;
  const cx=c*Math.cos(br);
  const cy=c*(Math.cos(ar)-Math.cos(br)*Math.cos(gr))/Math.sin(gr);
  const cz=Math.sqrt(Math.max(0,c*c-cx*cx-cy*cy));
  return {x:fx*ax+fy*bx+fz*cx,y:fx*ay+fy*by+fz*cy,z:fx*az+fy*bz+fz*cz};
}
function parseCIF(text, meta={}){
  const lines=text.split(/\r?\n/);
  const cell={a:null,b:null,c:null,alpha:90,beta:90,gamma:90};
  for(const line of lines){
    const m=line.match(/^_(cell_length_a|cell_length_b|cell_length_c|cell_angle_alpha|cell_angle_beta|cell_angle_gamma)\s+([^\s#]+)/i);
    if(m){
      const val=parseFloat(String(m[2]).replace(/\(.+?\)/,''));
      const key=m[1].replace('cell_','').replace('length_','').replace('angle_','');
      cell[key]=val;
    }
  }
  const loopIdx=lines.findIndex((line,i)=>/^\s*loop_/i.test(line) && lines.slice(i,i+20).some(l=>/_atom_site_/i.test(l)));
  if(loopIdx<0) throw new Error('No atom_site loop found in CIF');
  let i=loopIdx+1, headers=[];
  while(i<lines.length && /^\s*_atom_site_/i.test(lines[i].trim())){ headers.push(lines[i].trim()); i++; }
  const idxSym=headers.findIndex(h=>/_atom_site_type_symbol|_atom_site_label/i.test(h));
  const idxX=headers.findIndex(h=>/_atom_site_cartn_x/i.test(h));
  const idxY=headers.findIndex(h=>/_atom_site_cartn_y/i.test(h));
  const idxZ=headers.findIndex(h=>/_atom_site_cartn_z/i.test(h));
  const idxFx=headers.findIndex(h=>/_atom_site_fract_x/i.test(h));
  const idxFy=headers.findIndex(h=>/_atom_site_fract_y/i.test(h));
  const idxFz=headers.findIndex(h=>/_atom_site_fract_z/i.test(h));
  const atoms=[];
  while(i<lines.length){
    const t=lines[i].trim();
    if(!t || /^loop_/i.test(t) || /^data_/i.test(t) || /^_/.test(t)) break;
    const p=t.match(/'[^']*'|"[^"]*"|\S+/g) || [];
    if(p.length>=headers.length){
      const sym=normalizeSymbol((p[idxSym]||'C').replace(/^['"]|['"]$/g,''));
      if(idxX>=0 && idxY>=0 && idxZ>=0){
        atoms.push(makeAtom(sym,parseFloat(p[idxX]),parseFloat(p[idxY]),parseFloat(p[idxZ]),atoms.length));
      } else if(idxFx>=0 && idxFy>=0 && idxFz>=0 && cell.a && cell.b && cell.c){
        const cart=fracToCartFromCell(cell.a,cell.b,cell.c,cell.alpha,cell.beta,cell.gamma,parseFloat(p[idxFx]),parseFloat(p[idxFy]),parseFloat(p[idxFz]));
        atoms.push(makeAtom(sym,cart.x,cart.y,cart.z,atoms.length));
      }
    }
    i++;
  }
  if(!atoms.length) throw new Error('CIF atom loop found, but no usable Cartesian/fractional coordinates parsed');
  return finalizeMolecule(atoms,[],{format:'cif',source:'Crystallographic CIF',cell,...meta});
}
function parseXSF(text, meta={}){
  const lines=text.split(/\r?\n/);
  const idx=lines.findIndex(l=>/^\s*PRIMCOORD/i.test(l));
  if(idx<0) throw new Error('No PRIMCOORD block found in XSF');
  const counts=(lines[idx+1]||'').trim().split(/\s+/);
  const n=parseInt(counts[0])||0;
  const atoms=[];
  for(let i=idx+2;i<idx+2+n && i<lines.length;i++){
    const p=lines[i].trim().split(/\s+/);
    if(p.length>=4){
      const sym=/^\d+$/.test(p[0]) ? symbolFromAtomicNumber(p[0]) : p[0];
      atoms.push(makeAtom(sym,p[1],p[2],p[3],atoms.length));
    }
  }
  return finalizeMolecule(atoms,[],{format:'xsf',source:'XCrySDen XSF',...meta});
}
function detectFormat(name,text) {
  const ext=(name.split('.').pop()||'').toLowerCase();
  const first=(text.split(/\r?\n/)[0]||'').trim();
  if(['xyz'].includes(ext)) return 'xyz';
  if(['mol2'].includes(ext)) return 'mol2';
  if(['mol','sdf'].includes(ext)) return 'mol';
  if(['json'].includes(ext)) return 'json';
  if(['pdb','ent'].includes(ext)) return 'pdb';
  if(['cube','cub'].includes(ext)) return 'cube';
  if(['cif'].includes(ext)) return 'cif';
  if(['xsf'].includes(ext)) return 'xsf';
  if(['vasp','poscar','contcar'].includes(ext) || /^poscar|^contcar/i.test(name)) return 'vasp';
  if(['gjf','com'].includes(ext)) return 'gaussian';
  if(['nw','nwout'].includes(ext)) return 'nwchem';
  if(['coord'].includes(ext)) return 'cp2k';
  if(['out','log','inp','in'].includes(ext)){
    if(/Entering Gaussian System|Standard orientation:|Z-Matrix orientation:/i.test(text)) return 'gaussian';
    if(/\*\s*O\s*R\s*C\s*A\s*\*|CARTESIAN COORDINATES \(ANGSTROEM\)/i.test(text)) return 'orca';
    if(/ATOMIC_POSITIONS|site n\.\s+atom\s+positions/i.test(text)) return 'qe';
    if(/MODULE QUICKSTEP|&COORD/i.test(text)) return 'cp2k';
    if(/Northwest Computational Chemistry Package|Output coordinates in angstroms/i.test(text)) return 'nwchem';
  }
  if(text.includes('@<TRIPOS>ATOM')) return 'mol2';
  if(/^(ATOM|HETATM)/m.test(text)) return 'pdb';
  if(/^\s*\d+\s*$/.test(first)) return 'xyz';
  if(/^\s*loop_/im.test(text) && /_atom_site_/i.test(text)) return 'cif';
  if(/\bPRIMCOORD\b/i.test(text)) return 'xsf';
  if(/\bATOMIC_POSITIONS\b/i.test(text) || /site n\.\s+atom\s+positions/i.test(text)) return 'qe';
  if(/Entering Gaussian System|Standard orientation:|Z-Matrix orientation:|^\s*[A-Z][a-z]?\s+-?\d/.test(text)) return 'gaussian';
  if(/\*\s*xyz\b|CARTESIAN COORDINATES \(ANGSTROEM\)/i.test(text)) return 'orca';
  if(/&COORD|ATOMIC COORDINATES IN angstrom/i.test(text)) return 'cp2k';
  if(/Output coordinates in angstroms|^\s*geometry\b/im.test(text)) return 'nwchem';
  try{ JSON.parse(text); return 'json'; }catch(e){}
  return 'xyz';
}
function parseMolecule(name,text) {
  const fmt=detectFormat(name,text);
  const meta={inputName:name,importedAt:new Date().toISOString(),format:fmt};
  try{
    switch(fmt){
      case 'xyz': return parseXYZ(text,meta);
      case 'mol': return parseMOL(text,meta);
      case 'mol2': return parseMOL2(text,meta);
      case 'json': return parseJSON(text,meta);
      case 'pdb': return parsePDB(text,meta);
      case 'gaussian': return parseGaussian(text,meta);
      case 'orca': return parseOrca(text,meta);
      case 'vasp': return parseVASP(text,meta);
      case 'qe': return parseQE(text,meta);
      case 'cp2k': return parseCP2K(text,meta);
      case 'nwchem': return parseNWChem(text,meta);
      case 'cube': return parseCube(text,meta);
      case 'cif': return parseCIF(text,meta);
      case 'xsf': return parseXSF(text,meta);
      default: return parseXYZ(text,meta);
    }
  } catch(e){
    throw new Error(`Parse error (${fmt}): ${e.message}`);
  }
}
// ═══════════════════════════════════════════════════════════
