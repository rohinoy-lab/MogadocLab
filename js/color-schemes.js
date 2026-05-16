/* ═══════════════════════════════════════════════════════
   Color Schemes — MogadocLab
   ═══════════════════════════════════════════════════════ */

// FEATURE 2 — COLOR SCHEMES
// ═══════════════════════════════════════════════════════════
let colorScheme='cpk';
const RAINBOW_COLORS=['#00d9ff','#39d353','#f97316','#f59e0b','#ef4444','#a855f7','#ec4899','#06b6d4','#84cc16','#fb923c'];
const CHARGE_COLORS={C:'#909090',H:'#e0e0e0',O:'#ff4444',N:'#4466ff',S:'#ffff30',P:'#ff8800',F:'#90e050',Cl:'#1ff01f',Br:'#a62929',I:'#940094'};

function setColorScheme(scheme){
  colorScheme=scheme;
  _monoColorCache = null; // invalidate so the next render re-reads --accent
  ['cpk','chain','residue','mono'].forEach(s=>{
    const el=document.getElementById('cs-'+s);
    if(el)el.classList.toggle('active',s===scheme);
  });
  render();
  saveAppState();
}
// Monochrome mode previously called getComputedStyle once per atom per
// frame. For large molecules (>1000 atoms) under auto-rotate that's
// thousands of style reads per second. Cache the value; invalidate when
// the scheme or theme changes.
let _monoColorCache = null;
function _readMonoColor(){
  return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00d9ff';
}
function getAtomDisplayColor(atom){
  if(colorScheme==='chain') return RAINBOW_COLORS[atom.idx%RAINBOW_COLORS.length];
  if(colorScheme==='residue') return CHARGE_COLORS[atom.symbol]||'#aaaaaa';
  if(colorScheme==='mono'){
    if(_monoColorCache===null) _monoColorCache = _readMonoColor();
    return _monoColorCache;
  }
  return getElement(atom.symbol).color; // cpk default
}

// ═══════════════════════════════════════════════════════════
