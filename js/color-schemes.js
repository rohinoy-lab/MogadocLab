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
  ['cpk','chain','residue','mono'].forEach(s=>{
    const el=document.getElementById('cs-'+s);
    if(el)el.classList.toggle('active',s===scheme);
  });
  render();
  saveAppState();
}
function getAtomDisplayColor(atom){
  if(colorScheme==='chain') return RAINBOW_COLORS[atom.idx%RAINBOW_COLORS.length];
  if(colorScheme==='residue') return CHARGE_COLORS[atom.symbol]||'#aaaaaa';
  if(colorScheme==='mono') return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00d9ff';
  return getElement(atom.symbol).color; // cpk default
}

// ═══════════════════════════════════════════════════════════
