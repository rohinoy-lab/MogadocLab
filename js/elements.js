/* ═══════════════════════════════════════════════════════
   Elements — MogadocLab
   ═══════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════
// ELEMENTS
// ═══════════════════════════════════════════════════════════
// ── All 118 elements: CPK-standard colors, van-der-Waals radii (Å), atomic mass ──
const ELEMENTS_DEFAULT = {
  H:{color:'#ffffff',r:0.31,mass:1.008,name:'Hydrogen',z:1,cat:'nonmetal'},
  He:{color:'#d9ffff',r:0.28,mass:4.003,name:'Helium',z:2,cat:'noble'},
  Li:{color:'#cc80ff',r:1.28,mass:6.941,name:'Lithium',z:3,cat:'alkali'},
  Be:{color:'#c2ff00',r:0.96,mass:9.012,name:'Beryllium',z:4,cat:'alkaline'},
  B:{color:'#ffb5b5',r:0.84,mass:10.811,name:'Boron',z:5,cat:'metalloid'},
  C:{color:'#909090',r:0.77,mass:12.011,name:'Carbon',z:6,cat:'nonmetal'},
  N:{color:'#3050f8',r:0.75,mass:14.007,name:'Nitrogen',z:7,cat:'nonmetal'},
  O:{color:'#ff2020',r:0.73,mass:15.999,name:'Oxygen',z:8,cat:'nonmetal'},
  F:{color:'#90e050',r:0.71,mass:18.998,name:'Fluorine',z:9,cat:'halogen'},
  Ne:{color:'#b3e3f5',r:0.58,mass:20.18,name:'Neon',z:10,cat:'noble'},
  Na:{color:'#ab5cf2',r:1.66,mass:22.990,name:'Sodium',z:11,cat:'alkali'},
  Mg:{color:'#8aff00',r:1.41,mass:24.305,name:'Magnesium',z:12,cat:'alkaline'},
  Al:{color:'#bfa6a6',r:1.21,mass:26.982,name:'Aluminum',z:13,cat:'post-transition'},
  Si:{color:'#f0c8a0',r:1.11,mass:28.086,name:'Silicon',z:14,cat:'metalloid'},
  P:{color:'#ff8000',r:1.07,mass:30.974,name:'Phosphorus',z:15,cat:'nonmetal'},
  S:{color:'#ffff30',r:1.05,mass:32.065,name:'Sulfur',z:16,cat:'nonmetal'},
  Cl:{color:'#1ff01f',r:1.02,mass:35.453,name:'Chlorine',z:17,cat:'halogen'},
  Ar:{color:'#80d1e3',r:0.97,mass:39.948,name:'Argon',z:18,cat:'noble'},
  K:{color:'#8f40d4',r:2.03,mass:39.098,name:'Potassium',z:19,cat:'alkali'},
  Ca:{color:'#3dff00',r:1.74,mass:40.078,name:'Calcium',z:20,cat:'alkaline'},
  Sc:{color:'#e6e6e6',r:1.44,mass:44.956,name:'Scandium',z:21,cat:'transition'},
  Ti:{color:'#bfc2c7',r:1.36,mass:47.867,name:'Titanium',z:22,cat:'transition'},
  V:{color:'#a6a6ab',r:1.25,mass:50.942,name:'Vanadium',z:23,cat:'transition'},
  Cr:{color:'#8a99c7',r:1.27,mass:51.996,name:'Chromium',z:24,cat:'transition'},
  Mn:{color:'#9c7ac7',r:1.39,mass:54.938,name:'Manganese',z:25,cat:'transition'},
  Fe:{color:'#e06633',r:1.25,mass:55.845,name:'Iron',z:26,cat:'transition'},
  Co:{color:'#f090a0',r:1.26,mass:58.933,name:'Cobalt',z:27,cat:'transition'},
  Ni:{color:'#50d050',r:1.21,mass:58.693,name:'Nickel',z:28,cat:'transition'},
  Cu:{color:'#c88033',r:1.38,mass:63.546,name:'Copper',z:29,cat:'transition'},
  Zn:{color:'#7d80b0',r:1.22,mass:65.380,name:'Zinc',z:30,cat:'transition'},
  Ga:{color:'#c28f8f',r:1.22,mass:69.723,name:'Gallium',z:31,cat:'post-transition'},
  Ge:{color:'#668f8f',r:1.20,mass:72.630,name:'Germanium',z:32,cat:'metalloid'},
  As:{color:'#bd80e3',r:1.19,mass:74.922,name:'Arsenic',z:33,cat:'metalloid'},
  Se:{color:'#ffa100',r:1.20,mass:78.971,name:'Selenium',z:34,cat:'nonmetal'},
  Br:{color:'#a62929',r:1.20,mass:79.904,name:'Bromine',z:35,cat:'halogen'},
  Kr:{color:'#5cb8d1',r:1.16,mass:83.798,name:'Krypton',z:36,cat:'noble'},
  Rb:{color:'#702eb0',r:2.16,mass:85.468,name:'Rubidium',z:37,cat:'alkali'},
  Sr:{color:'#00ff00',r:1.91,mass:87.620,name:'Strontium',z:38,cat:'alkaline'},
  Y:{color:'#94ffff',r:1.62,mass:88.906,name:'Yttrium',z:39,cat:'transition'},
  Zr:{color:'#94e0e0',r:1.48,mass:91.224,name:'Zirconium',z:40,cat:'transition'},
  Nb:{color:'#73c2c9',r:1.37,mass:92.906,name:'Niobium',z:41,cat:'transition'},
  Mo:{color:'#54b5b5',r:1.45,mass:95.960,name:'Molybdenum',z:42,cat:'transition'},
  Tc:{color:'#3b9e9e',r:1.56,mass:98.000,name:'Technetium',z:43,cat:'transition'},
  Ru:{color:'#248f8f',r:1.26,mass:101.07,name:'Ruthenium',z:44,cat:'transition'},
  Rh:{color:'#0a7d8c',r:1.35,mass:102.91,name:'Rhodium',z:45,cat:'transition'},
  Pd:{color:'#006985',r:1.31,mass:106.42,name:'Palladium',z:46,cat:'transition'},
  Ag:{color:'#c0c0c0',r:1.53,mass:107.87,name:'Silver',z:47,cat:'transition'},
  Cd:{color:'#ffd98f',r:1.48,mass:112.41,name:'Cadmium',z:48,cat:'transition'},
  In:{color:'#a67573',r:1.44,mass:114.82,name:'Indium',z:49,cat:'post-transition'},
  Sn:{color:'#668080',r:1.41,mass:118.71,name:'Tin',z:50,cat:'post-transition'},
  Sb:{color:'#9e63b5',r:1.38,mass:121.76,name:'Antimony',z:51,cat:'metalloid'},
  Te:{color:'#d47a00',r:1.35,mass:127.60,name:'Tellurium',z:52,cat:'metalloid'},
  I:{color:'#940094',r:1.33,mass:126.90,name:'Iodine',z:53,cat:'halogen'},
  Xe:{color:'#429eb0',r:1.31,mass:131.29,name:'Xenon',z:54,cat:'noble'},
  Cs:{color:'#57178f',r:2.35,mass:132.91,name:'Cesium',z:55,cat:'alkali'},
  Ba:{color:'#00c900',r:1.98,mass:137.33,name:'Barium',z:56,cat:'alkaline'},
  La:{color:'#70d4ff',r:1.69,mass:138.91,name:'Lanthanum',z:57,cat:'lanthanide'},
  Ce:{color:'#ffffc7',r:1.65,mass:140.12,name:'Cerium',z:58,cat:'lanthanide'},
  Pr:{color:'#d9ffc7',r:1.65,mass:140.91,name:'Praseodymium',z:59,cat:'lanthanide'},
  Nd:{color:'#c7ffc7',r:1.64,mass:144.24,name:'Neodymium',z:60,cat:'lanthanide'},
  Pm:{color:'#a3ffc7',r:1.63,mass:145.00,name:'Promethium',z:61,cat:'lanthanide'},
  Sm:{color:'#8fffc7',r:1.62,mass:150.36,name:'Samarium',z:62,cat:'lanthanide'},
  Eu:{color:'#61ffc7',r:1.85,mass:151.96,name:'Europium',z:63,cat:'lanthanide'},
  Gd:{color:'#45ffc7',r:1.61,mass:157.25,name:'Gadolinium',z:64,cat:'lanthanide'},
  Tb:{color:'#30ffc7',r:1.59,mass:158.93,name:'Terbium',z:65,cat:'lanthanide'},
  Dy:{color:'#1fffc7',r:1.59,mass:162.50,name:'Dysprosium',z:66,cat:'lanthanide'},
  Ho:{color:'#00ff9c',r:1.58,mass:164.93,name:'Holmium',z:67,cat:'lanthanide'},
  Er:{color:'#00e675',r:1.57,mass:167.26,name:'Erbium',z:68,cat:'lanthanide'},
  Tm:{color:'#00d452',r:1.56,mass:168.93,name:'Thulium',z:69,cat:'lanthanide'},
  Yb:{color:'#00bf38',r:1.74,mass:173.04,name:'Ytterbium',z:70,cat:'lanthanide'},
  Lu:{color:'#00ab24',r:1.56,mass:174.97,name:'Lutetium',z:71,cat:'lanthanide'},
  Hf:{color:'#4dc2ff',r:1.50,mass:178.49,name:'Hafnium',z:72,cat:'transition'},
  Ta:{color:'#4da6ff',r:1.38,mass:180.95,name:'Tantalum',z:73,cat:'transition'},
  W:{color:'#2194d6',r:1.46,mass:183.84,name:'Tungsten',z:74,cat:'transition'},
  Re:{color:'#267dab',r:1.59,mass:186.21,name:'Rhenium',z:75,cat:'transition'},
  Os:{color:'#266696',r:1.28,mass:190.23,name:'Osmium',z:76,cat:'transition'},
  Ir:{color:'#175487',r:1.37,mass:192.22,name:'Iridium',z:77,cat:'transition'},
  Pt:{color:'#d0d0e0',r:1.28,mass:195.08,name:'Platinum',z:78,cat:'transition'},
  Au:{color:'#ffd123',r:1.44,mass:196.97,name:'Gold',z:79,cat:'transition'},
  Hg:{color:'#b8b8d0',r:1.49,mass:200.59,name:'Mercury',z:80,cat:'transition'},
  Tl:{color:'#a6544d',r:1.48,mass:204.38,name:'Thallium',z:81,cat:'post-transition'},
  Pb:{color:'#575961',r:1.47,mass:207.20,name:'Lead',z:82,cat:'post-transition'},
  Bi:{color:'#9e4fb5',r:1.46,mass:208.98,name:'Bismuth',z:83,cat:'post-transition'},
  Po:{color:'#ab5c00',r:1.40,mass:209.00,name:'Polonium',z:84,cat:'post-transition'},
  At:{color:'#754f45',r:1.50,mass:210.00,name:'Astatine',z:85,cat:'halogen'},
  Rn:{color:'#428296',r:1.50,mass:222.00,name:'Radon',z:86,cat:'noble'},
  Fr:{color:'#420066',r:2.60,mass:223.00,name:'Francium',z:87,cat:'alkali'},
  Ra:{color:'#007d00',r:2.21,mass:226.00,name:'Radium',z:88,cat:'alkaline'},
  Ac:{color:'#70abfa',r:2.15,mass:227.00,name:'Actinium',z:89,cat:'actinide'},
  Th:{color:'#00baff',r:2.06,mass:232.04,name:'Thorium',z:90,cat:'actinide'},
  Pa:{color:'#00a1ff',r:2.00,mass:231.04,name:'Protactinium',z:91,cat:'actinide'},
  U:{color:'#008fff',r:1.96,mass:238.03,name:'Uranium',z:92,cat:'actinide'},
  Np:{color:'#0080ff',r:1.90,mass:237.00,name:'Neptunium',z:93,cat:'actinide'},
  Pu:{color:'#006bff',r:1.87,mass:244.00,name:'Plutonium',z:94,cat:'actinide'},
  Am:{color:'#545cf2',r:1.80,mass:243.00,name:'Americium',z:95,cat:'actinide'},
  Cm:{color:'#785ce3',r:1.69,mass:247.00,name:'Curium',z:96,cat:'actinide'},
  Bk:{color:'#8a4fe3',r:1.68,mass:247.00,name:'Berkelium',z:97,cat:'actinide'},
  Cf:{color:'#a136d4',r:1.68,mass:251.00,name:'Californium',z:98,cat:'actinide'},
  Es:{color:'#b31fd4',r:1.65,mass:252.00,name:'Einsteinium',z:99,cat:'actinide'},
  Fm:{color:'#b31fba',r:1.67,mass:257.00,name:'Fermium',z:100,cat:'actinide'},
  Md:{color:'#b30da6',r:1.73,mass:258.00,name:'Mendelevium',z:101,cat:'actinide'},
  No:{color:'#bd0d87',r:1.76,mass:259.00,name:'Nobelium',z:102,cat:'actinide'},
  Lr:{color:'#c70066',r:1.61,mass:266.00,name:'Lawrencium',z:103,cat:'actinide'},
  Rf:{color:'#cc0059',r:1.57,mass:267.00,name:'Rutherfordium',z:104,cat:'transition'},
  Db:{color:'#d1004f',r:1.49,mass:268.00,name:'Dubnium',z:105,cat:'transition'},
  Sg:{color:'#d90045',r:1.43,mass:269.00,name:'Seaborgium',z:106,cat:'transition'},
  Bh:{color:'#e00038',r:1.41,mass:270.00,name:'Bohrium',z:107,cat:'transition'},
  Hs:{color:'#e6002e',r:1.34,mass:277.00,name:'Hassium',z:108,cat:'transition'},
  Mt:{color:'#eb0026',r:1.29,mass:278.00,name:'Meitnerium',z:109,cat:'transition'},
  Ds:{color:'#f00020',r:1.28,mass:281.00,name:'Darmstadtium',z:110,cat:'transition'},
  Rg:{color:'#f50019',r:1.21,mass:282.00,name:'Roentgenium',z:111,cat:'transition'},
  Cn:{color:'#fa000f',r:1.22,mass:285.00,name:'Copernicium',z:112,cat:'transition'},
  Nh:{color:'#ff0005',r:1.36,mass:286.00,name:'Nihonium',z:113,cat:'post-transition'},
  Fl:{color:'#ff2200',r:1.43,mass:289.00,name:'Flerovium',z:114,cat:'post-transition'},
  Mc:{color:'#ff3300',r:1.62,mass:290.00,name:'Moscovium',z:115,cat:'post-transition'},
  Lv:{color:'#ff4400',r:1.75,mass:293.00,name:'Livermorium',z:116,cat:'post-transition'},
  Ts:{color:'#ff5500',r:1.65,mass:294.00,name:'Tennessine',z:117,cat:'halogen'},
  Og:{color:'#ff6600',r:1.57,mass:294.00,name:'Oganesson',z:118,cat:'noble'},
};

// Live element colors (user can customize; deep-cloned from defaults)
let ELEMENTS = JSON.parse(JSON.stringify(ELEMENTS_DEFAULT));

// Saved color presets
const COLOR_PRESETS = {
  cpk: null, // filled at runtime from defaults
  neon: {H:'#00ffff',He:'#ff00ff',Li:'#ff0055',Be:'#aaff00',B:'#ff6600',C:'#00ff99',N:'#00aaff',O:'#ff3366',F:'#ccff00',Ne:'#ff99ff',Na:'#ff44cc',Mg:'#44ff88',Al:'#ffcc00',Si:'#ff8844',P:'#aaff33',S:'#ffff00',Cl:'#44ffcc',Ar:'#cc44ff',K:'#ff00cc',Ca:'#00ff44'},
  pastel: {H:'#ffe8e8',He:'#e8f8ff',Li:'#e8d8ff',Be:'#f0ffe8',B:'#ffe8f0',C:'#e0e0e0',N:'#d8e8ff',O:'#ffe8e8',F:'#e8ffe8',Ne:'#d8f4ff',Na:'#e8d8f8',Mg:'#e8ffe8',Al:'#f8e8e8',Si:'#fff4e0',P:'#ffe8d8',S:'#fffff0',Cl:'#e8ffe8',Ar:'#d8f0f8',K:'#eee0f8',Ca:'#e8fff0'},
  grayscale: null,
};

function getElement(sym) {
  const s=sym.charAt(0).toUpperCase()+sym.slice(1).toLowerCase();
  return ELEMENTS[s]||{color:'#ff69b4',r:0.8,mass:1,name:sym,z:0,cat:'unknown'};
}

// ── Atom Color Customizer ────────────────────────────────────
let colorEditorFilter = '';
function openColorEditor() {
  buildColorEditorList();
  document.getElementById('colorEditorModal').style.display='flex';
}
function closeColorEditor() {
  document.getElementById('colorEditorModal').style.display='none';
}
function buildColorEditorList() {
  const filter = colorEditorFilter.toLowerCase();
  const container = document.getElementById('ceList');
  const entries = Object.entries(ELEMENTS)
    .filter(([sym,el]) =>
      !filter ||
      sym.toLowerCase().includes(filter) ||
      el.name.toLowerCase().includes(filter) ||
      (el.cat||'').toLowerCase().includes(filter)
    )
    .sort((a,b)=>a[1].z-b[1].z);
  container.innerHTML = entries.map(([sym,el])=>`
    <div class="ce-row" id="ce-row-${sym}">
      <div class="ce-dot" id="ce-dot-${sym}" style="background:${el.color};box-shadow:0 0 6px ${el.color}44;"></div>
      <span class="ce-sym">${sym}</span>
      <span class="ce-name">${el.name}</span>
      <span class="ce-cat ce-cat-${(el.cat||'').replace(/[^a-z]/g,'')}">${el.cat||''}</span>
      <input type="color" class="ce-colorpick" value="${el.color.length===7?el.color:rgbToHex(el.color)}" onchange="setElementColor('${sym}',this.value)" title="Pick color for ${el.name}">
      <input type="text" class="ce-colortext" value="${el.color}" maxlength="9" onchange="setElementColor('${sym}',this.value)" title="Hex color" spellcheck="false">
      <button class="ce-reset-btn" onclick="resetElementColor('${sym}')" title="Reset to CPK default">↺</button>
    </div>
  `).join('');
}
function setElementColor(sym, hex) {
  hex = hex.trim();
  if(!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  ELEMENTS[sym].color = hex;
  const dot = document.getElementById('ce-dot-'+sym);
  if(dot){ dot.style.background=hex; dot.style.boxShadow=`0 0 6px ${hex}44`; }
  const txt = document.querySelector(`#ce-row-${sym} .ce-colortext`);
  if(txt) txt.value=hex;
  const pick = document.querySelector(`#ce-row-${sym} .ce-colorpick`);
  if(pick) pick.value=hex;
  render(); updateLegend();
}
function resetElementColor(sym) {
  if(!ELEMENTS_DEFAULT[sym]) return;
  setElementColor(sym, ELEMENTS_DEFAULT[sym].color);
}
function resetAllColors() {
  Object.keys(ELEMENTS_DEFAULT).forEach(sym=>{
    ELEMENTS[sym].color = ELEMENTS_DEFAULT[sym].color;
  });
  buildColorEditorList();
  render(); updateLegend();
  notify('All colors reset to CPK defaults','success');
}
function applyColorPreset(preset) {
  if(preset==='cpk'||!COLOR_PRESETS[preset]) { resetAllColors(); return; }
  if(preset==='grayscale'){
    Object.keys(ELEMENTS).forEach(sym=>{
      const def=ELEMENTS_DEFAULT[sym];
      const gray=rgbToGray(def.color);
      ELEMENTS[sym].color=gray;
    });
  } else {
    const map=COLOR_PRESETS[preset]||{};
    Object.keys(map).forEach(sym=>{ if(ELEMENTS[sym]) ELEMENTS[sym].color=map[sym]; });
  }
  buildColorEditorList(); render(); updateLegend();
  notify(`Applied ${preset} preset`,'info');
}
function rgbToGray(hex){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  const v=Math.round(0.299*r+0.587*g+0.114*b);
  return '#'+v.toString(16).padStart(2,'0').repeat(3);
}
function rgbToHex(c){
  if(c.startsWith('#')&&c.length===7) return c;
  if(c.startsWith('#')&&c.length===4) return '#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3];
  return '#909090';
}
function exportElementColors(){
  const out={};
  Object.entries(ELEMENTS).forEach(([sym,el])=>out[sym]=el.color);
  const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download='element_colors.json'; a.click();
  notify('Colors exported','success');
}
function importElementColors(e){
  const f=e.target.files[0]; if(!f) return;
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      const map=JSON.parse(ev.target.result);
      let count=0;
      Object.entries(map).forEach(([sym,hex])=>{
        if(ELEMENTS[sym]&&/^#[0-9a-fA-F]{6}$/i.test(hex)){ELEMENTS[sym].color=hex;count++;}
      });
      buildColorEditorList(); render(); updateLegend();
      notify(`Imported ${count} colors`,'success');
    }catch(err){notify('Invalid JSON color file','error');}
  };
  reader.readAsText(f);
  e.target.value='';
}

// ═══════════════════════════════════════════════════════════
