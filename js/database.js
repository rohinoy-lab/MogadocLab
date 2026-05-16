/* ═══════════════════════════════════════════════════════
   Database — MogadocLab
   ═══════════════════════════════════════════════════════ */

// DEMO MOLECULES (Quick Load)
// ═══════════════════════════════════════════════════════════
const DEMO_MOLECULES = {
  caffeine: `24\nCaffeine C8H10N4O2\nC   3.2460   0.7010   0.0000\nC   1.9540   1.4240   0.0000\nC   0.6920   0.6420   0.0000\nN   0.7820  -0.7480   0.0000\nC   2.0780  -1.0930   0.0000\nN   3.1220  -0.1310   0.0000\nN   1.8200   2.7620   0.0000\nC   0.4620   3.0420   0.0000\nN  -0.3170   1.9320   0.0000\nO   4.3410   1.2240   0.0000\nO   2.4140  -2.2280   0.0000\nC   2.8980   3.7460   0.0000\nC  -0.1730  -1.7180   0.0000\nC   4.4810  -0.5250   0.0000\nH   0.0760   4.0270   0.0000\nH  -1.3530   1.8730   0.0000\nH   2.5400   4.7510   0.0000\nH   3.5240   3.6600   0.9000\nH   3.5240   3.6600  -0.9000\nH  -1.1850  -1.3480   0.0000\nH   0.0130  -2.5250   0.8890\nH   0.0130  -2.5250  -0.8890\nH   5.0780   0.3620   0.0000\nH   4.8390  -1.3260   0.0000`,
  water: `3\nWater H2O\nO   0.0000   0.0000   0.1173\nH   0.0000   0.7572  -0.4692\nH   0.0000  -0.7572  -0.4692`,
  benzene: `12\nBenzene C6H6\nC   1.2124   0.7000   0.0000\nC   1.2124  -0.7000   0.0000\nC   0.0000  -1.4000   0.0000\nC  -1.2124  -0.7000   0.0000\nC  -1.2124   0.7000   0.0000\nC   0.0000   1.4000   0.0000\nH   2.1560   1.2450   0.0000\nH   2.1560  -1.2450   0.0000\nH   0.0000  -2.4900   0.0000\nH  -2.1560  -1.2450   0.0000\nH  -2.1560   1.2450   0.0000\nH   0.0000   2.4900   0.0000`,
  ethanol: `9\nEthanol C2H5OH\nC  -0.7526   0.0205  -0.2080\nC   0.7526   0.0276   0.0473\nO   1.2424  -0.0022   1.3828\nH  -1.1699   0.9075   0.2792\nH  -1.1723  -0.8593   0.2954\nH  -1.0463   0.0128  -1.2617\nH   1.1699   0.9149  -0.4414\nH   1.1549  -0.8494  -0.4639\nH   2.1966   0.0008   1.4494`,
  aspirin: `21\nAspirin C9H8O4\nC   0.0000   1.4030   0.0000\nC   1.2135   0.7015   0.0000\nC   1.2135  -0.7015   0.0000\nC   0.0000  -1.4030   0.0000\nC  -1.2135  -0.7015   0.0000\nC  -1.2135   0.7015   0.0000\nC   2.4753   1.4200   0.0000\nO   2.4406   2.6490   0.0000\nO   3.5988   0.8380   0.0000\nO  -1.2050  -1.3910   1.2100\nC  -1.2050  -2.5980   1.5900\nO  -1.2050  -3.5000   0.7900\nC  -1.2050  -2.8480   3.0800\nH   0.0000   2.4930   0.0000\nH   2.1580  -1.2450   0.0000\nH   0.0000  -2.4930   0.0000\nH  -2.1580   1.2450   0.0000\nH   3.4000   2.8600   0.0000\nH  -2.0940  -2.4430   3.5630\nH  -0.3160  -2.4430   3.5630\nH  -1.2050  -3.9340   3.2110`,
  glucose: `24\nGlucose C6H12O6\nC   0.5170   1.4250   0.4890\nC  -0.2060   0.1140   0.1620\nC   0.6870  -1.0900   0.5420\nC   2.1290  -0.8230   0.0930\nC   2.7730   0.4640   0.6040\nO   1.8960   1.5490   0.2350\nC  -1.5860   0.0270   0.8160\nO   0.2350  -2.3100  -0.0530\nO   2.8670  -1.9550   0.5040\nO   4.0510   0.6240   0.0130\nO  -2.3770  -0.9700   0.1640\nH   0.0820   2.2700  -0.0680\nH  -0.3200   0.0540  -0.9310\nH   0.6780  -1.1980   1.6350\nH   2.1170  -0.7360  -1.0010\nH   2.8690   0.3640   1.6960\nH   0.4800   1.5010   1.5840\nH  -1.4960  -0.2730   1.8620\nH  -2.0810   1.0000   0.7670\nH  -0.7020  -2.3280   0.1540\nH   3.7910  -1.7430   0.3200\nH   4.5480  -0.1680   0.2760\nH  -3.2680  -0.9440   0.5230\nH  -2.4840  -0.6480  -0.7370`,
  alanine: `13\nAlanine C3H7NO2\nN  -0.9660   0.4930   1.2110\nC   0.0000   0.0000   0.2240\nC   1.4200   0.4310   0.6080\nO   1.7700   1.1310   1.5480\nO   2.2610  -0.0950  -0.2750\nC  -0.3620   0.5970  -1.1350\nH  -0.6670   0.0680   2.0770\nH  -0.9120   1.5010   1.3250\nH   0.0460  -1.0960   0.1720\nH   3.1460   0.2280  -0.0360\nH   0.3570   0.2640  -1.8960\nH  -1.3520   0.2510  -1.4470\nH  -0.3770   1.6850  -1.0770`
};

function loadDemo(name) {
  const xyzText = DEMO_MOLECULES[name];
  if (!xyzText) return notify(`Demo molecule "${name}" not found`, 'error');
  try {
    const mol = parseXYZ(xyzText, {source: 'Built-in demo', format: 'xyz', inputName: name + '.xyz', confidence: 'reference geometry'});
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    loadMolecule(displayName, mol);
  } catch (err) {
    notify('Failed to load demo: ' + err.message, 'error');
  }
}

function loadDemoTrajectory() {
  // Generate a water molecule vibration trajectory (20 frames)
  // Symmetric stretch + bend mode animation
  const nFrames = 20;
  const xyzParts = [];
  for (let f = 0; f < nFrames; f++) {
    const t = f / nFrames * 2 * Math.PI;
    // O-H bond length oscillation (0.96 ± 0.08 Å)
    const stretch = 0.08 * Math.sin(t);
    const bondLen = 0.96 + stretch;
    // H-O-H angle oscillation (104.5 ± 8°)
    const angleDeg = 104.5 + 8 * Math.sin(t * 2);
    const angleRad = angleDeg * Math.PI / 180;
    const halfAngle = angleRad / 2;
    // Oxygen at origin
    const ox = 0, oy = 0, oz = 0;
    // H1 and H2 symmetric about y-axis
    const h1x = bondLen * Math.sin(halfAngle);
    const h1y = bondLen * Math.cos(halfAngle);
    const h2x = -bondLen * Math.sin(halfAngle);
    const h2y = bondLen * Math.cos(halfAngle);
    // Small z-oscillation for 3D effect
    const zw = 0.05 * Math.sin(t * 3);
    xyzParts.push(`3\nWater vibration frame ${f+1} — angle=${angleDeg.toFixed(1)} bondLen=${bondLen.toFixed(3)}\nO   ${ox.toFixed(4)}   ${oy.toFixed(4)}   ${oz.toFixed(4)}\nH   ${h1x.toFixed(4)}   ${h1y.toFixed(4)}   ${zw.toFixed(4)}\nH   ${h2x.toFixed(4)}   ${h2y.toFixed(4)}   ${(-zw).toFixed(4)}`);
  }
  const multiXyz = xyzParts.join('\n');
  try {
    const frames = parseMultiFrameXYZ(multiXyz, {source: 'Built-in demo trajectory', format: 'xyz', inputName: 'water_vibration.xyz'});
    if (frames.length > 1) {
      loadTrajectory('Water Vibration', frames);
    }
  } catch (err) {
    notify('Failed to load demo trajectory: ' + err.message, 'error');
  }
}



function setDbResults(html){
  const el=document.getElementById('dbResults');
  if(el) el.innerHTML=html;
}

function getDatabaseCatalog(){
  return {
    mogadoc:{label:'MOGADOC', category:'Gas-phase / structural', home:'https://www.uni-ulm.de/nawi/chemieinformationssysteme/mogadoc/', search:_=>`https://www.uni-ulm.de/nawi/chemieinformationssysteme/mogadoc/login-nur-fuer-uni-ulm/`, placeholder:'(login at the MOGADOC site, then query there)', load3d:false, examples:'gas-phase microwave · electron diffraction · structural docs', loginNote:'Requires Uni-Ulm login. Open MOGADOC, search there, then drop the downloaded structure file here.'},
    pubchem:{label:'PubChem', category:'Chemical & molecular', home:'https://pubchem.ncbi.nlm.nih.gov/', search:q=>`https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(q)}`, placeholder:'aspirin, glucose, caffeine, CID…', load3d:true, examples:'aspirin · glucose · caffeine · CID 2244'},
    chembl:{label:'ChEMBL', category:'Chemical & molecular', home:'https://www.ebi.ac.uk/chembl/', search:q=>`https://www.ebi.ac.uk/chembl/g/#search_results/all/query=${encodeURIComponent(q)}`, placeholder:'bioactive molecule, CHEMBL ID, target…', examples:'CHEMBL25 · imatinib · EGFR inhibitor'},
    chemspider:{label:'ChemSpider', category:'Chemical & molecular', home:'https://www.chemspider.com/', search:q=>`https://www.chemspider.com/Search.aspx?q=${encodeURIComponent(q)}`, placeholder:'compound name, InChIKey, formula…', examples:'benzaldehyde · C7H6O · InChIKey'},
    zinc:{label:'ZINC', category:'Chemical & molecular', home:'https://zinc.docking.org/', search:q=>`https://zinc.docking.org/substances/search/?q=${encodeURIComponent(q)}`, placeholder:'ligand, vendor code, SMILES…', examples:'ZINC00000001 · ligand name · SMILES'},
    rcsb:{label:'Protein Data Bank', category:'Structural / 3D', home:'https://www.rcsb.org/', search:q=>`https://www.rcsb.org/search?query=${encodeURIComponent(q)}`, placeholder:'PDB ID, protein, ligand, structure title…', load3d:true, examples:'1CRN · hemoglobin · kinase ligand'},
    csd:{label:'Cambridge Structural Database', category:'Structural / 3D', home:'https://www.ccdc.cam.ac.uk/structures/', search:q=>`https://www.ccdc.cam.ac.uk/structures/Search?text=${encodeURIComponent(q)}`, placeholder:'refcode, crystal structure, ligand…', examples:'ABEBUF · crystal refcode · ligand'},
    materialsproject:{label:'Materials Project', category:'Quantum / materials', home:'https://next-gen.materialsproject.org/', search:q=>`https://next-gen.materialsproject.org/materials?formula=${encodeURIComponent(q)}`, placeholder:'formula, composition, material ID…', examples:'SiO2 · mp-149 · perovskite'},
    nomad:{label:'NOMAD', category:'Quantum / materials', home:'https://nomad-lab.eu/prod/rae/gui/search', search:q=>`https://nomad-lab.eu/prod/rae/gui/search?query=${encodeURIComponent(q)}`, placeholder:'formula, workflow, material, property…', examples:'GaN · band gap · workflow'}
  };
}
function getSelectedDatabase(){
  return document.querySelector('#dbChipRow .db-chip.active')?.dataset.db || 'pubchem';
}
function getDatabaseQuery(){
  const q=(document.getElementById('dbSearchInput')?.value || molecule?.name || '').trim();
  return q;
}
function dbEsc(s){return String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]||m));}
function openExternal(url){window.open(url,'_blank','noopener,noreferrer');}
function selectDatabase(db){
  document.querySelectorAll('#dbChipRow .db-chip').forEach(chip=>{
    chip.classList.toggle('active', chip.dataset.db===db);
  });
  updateDatabaseUI();
}
function toggleDatabasePanel(ev){
  if(ev){ ev.preventDefault(); ev.stopPropagation(); }
  const sec=document.getElementById('searchSection');
  const sb=document.getElementById('sidebar');
  if(!sec || !sb) return;
  const btn=document.getElementById('dbExpandBtn');
  if(sec.classList.contains('search-expanded')){
    sec.classList.remove('search-expanded');
    sb.classList.remove('expanded','super-expanded');
    if(btn) btn.textContent = '⤢ Expand';
  } else {
    sec.classList.add('search-expanded');
    sb.classList.add('expanded');
    sb.classList.remove('super-expanded');
    if(btn) btn.textContent = '⤡ Compact';
  }
  panX = 0; panY = 0;
  setTimeout(resizeCanvas, 280);
  saveAppState();
}
function updateDatabaseUI(){
  const db=getSelectedDatabase();
  const meta=getDatabaseCatalog()[db] || getDatabaseCatalog().pubchem;
  const input=document.getElementById('dbSearchInput');
  const hint=document.getElementById('dbSearchHint');
  const examples=document.getElementById('dbSearchExamples');
  if(input) input.placeholder=meta.placeholder;
  if(hint) hint.textContent =
    meta.loginNote ? meta.loginNote :
    meta.load3d   ? `${meta.label} supports direct in-viewer loading from this panel.`
                  : `${meta.label} uses a tuned search handoff from this panel.`;
  if(examples) examples.textContent = `Examples: ${meta.examples || 'aspirin · glucose · caffeine · CID 2244'}`;
  const loadBtn=document.getElementById('dbLoad3dBtn');
  if(loadBtn){
    loadBtn.disabled=!meta.load3d;
    loadBtn.style.opacity=meta.load3d?'1':'0.45';
    loadBtn.textContent = meta.load3d ? (db==='rcsb' ? 'Load structure' : 'Load 3D') : 'Load unavailable';
    loadBtn.title=meta.load3d ? `Load from ${meta.label} into viewer` : `${meta.label} does not provide direct in-viewer import here`;
  }
  document.querySelectorAll('#dbChipRow .db-chip').forEach(chip=>{
    chip.classList.toggle('active', chip.dataset.db===db);
  });
}
function openDatabaseHomepage(db){
  const meta=getDatabaseCatalog()[db] || getDatabaseCatalog().pubchem;
  openExternal(meta.home);
}
function openSelectedDatabaseHomepage(){ openDatabaseHomepage(getSelectedDatabase()); }
function getDatabaseSearchUrl(db,q){
  const meta=getDatabaseCatalog()[db] || getDatabaseCatalog().pubchem;
  return meta.search(q);
}
function searchInDatabase(db){
  const q=getDatabaseQuery();
  if(!q)return notify('Enter a database query','error');
  openExternal(getDatabaseSearchUrl(db,q));
}
function openSelectedDatabaseSearch(){ searchInDatabase(getSelectedDatabase()); }
function handleDatabaseSearch(){
  const db=getSelectedDatabase();
  if(db==='pubchem') return searchPubChem();
  if(db==='rcsb') return searchPDB();
  if(db==='mogadoc') return openExternal(getDatabaseSearchUrl(db,''));
  return openSelectedDatabaseSearch();
}
function loadSelectedDatabaseIntoViewer(){
  const db=getSelectedDatabase();
  if(db==='pubchem') return searchPubChem();
  if(db==='rcsb') return searchPDB();
  notify('Direct 3D import is currently supported for PubChem and Protein Data Bank only','info');
}
async function searchPubChem() {
  const q=getDatabaseQuery();
  if(!q)return notify('Enter a compound name','error');
  const prog=document.getElementById('searchProgress'), fill=document.getElementById('searchFill');
  prog.style.display='block'; fill.style.width='20%';
  try {
    const cidRes=await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(q)}/cids/JSON`);
    if(!cidRes.ok)throw new Error('Compound not found in PubChem');
    const cidData=await cidRes.json();
    const cid=cidData.IdentifierList.CID[0];
    fill.style.width='50%';
    const xyzRes=await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/JSON?record_type=3d`);
    fill.style.width='80%';
    if(xyzRes.ok){
      const xyzData=await xyzRes.json();
      const atoms3d=xyzData.PC_Compounds?.[0]?.coords?.[0]?.conformers?.[0];
      const atomsList=xyzData.PC_Compounds?.[0]?.atoms;
      const bonds3d=xyzData.PC_Compounds?.[0]?.bonds;
      if(atoms3d&&atomsList){
        const EN={1:'H',2:'He',3:'Li',4:'Be',5:'B',6:'C',7:'N',8:'O',9:'F',10:'Ne',11:'Na',12:'Mg',13:'Al',14:'Si',15:'P',16:'S',17:'Cl',18:'Ar',19:'K',20:'Ca',26:'Fe',27:'Co',28:'Ni',29:'Cu',30:'Zn',35:'Br',53:'I',79:'Au',78:'Pt'};
        const xs=atoms3d.x,ys=atoms3d.y,zs=atoms3d.z||xs.map(()=>0);
        const atoms=atomsList.element.map((en,i)=>({symbol:EN[en]||'C',x:xs[i],y:ys[i],z:zs[i],idx:i}));
        let bonds=[];
        if(bonds3d){const a1=bonds3d.aid1,a2=bonds3d.aid2,ord=bonds3d.order||[];for(let i=0;i<a1.length;i++)bonds.push({a:a1[i]-1,b:a2[i]-1,order:ord[i]||1});}
        if(!bonds.length)bonds=autoDetectBonds(atoms);
        fill.style.width='100%';
        setTimeout(()=>{prog.style.display='none';fill.style.width='0%';},500);
        loadMolecule(q.charAt(0).toUpperCase()+q.slice(1),{atoms,bonds});return;
      }
    }
    throw new Error('No 3D conformer available in PubChem');
  } catch(err){prog.style.display='none';fill.style.width='0%';notify(err.message,'error');}
}
async function searchPDB(){
  const q=getDatabaseQuery();
  if(!q)return notify('Enter a PDB ID or structure keyword','error');
  const prog=document.getElementById('searchProgress'), fill=document.getElementById('searchFill');
  prog.style.display='block'; fill.style.width='18%';
  try{
    let pdbId='';
    if(/^[A-Za-z0-9]{4}$/.test(q.trim())){
      pdbId=q.trim().toUpperCase();
      fill.style.width='45%';
    }else{
      const pdbQuery={query:{type:'terminal',service:'text',parameters:{attribute:'rcsb_entry_container_identifiers.entry_id',operator:'exact_match',value:q.toUpperCase()}},return_type:'entry',request_options:{pager:{start:0,rows:1}}};
      let pdbRes=await fetch('https://search.rcsb.org/rcsbsearch/v2/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pdbQuery)});
      if(!pdbRes.ok){
        const fallback={query:{type:'terminal',service:'text',parameters:{attribute:'struct.title',operator:'contains_phrase',value:q}},return_type:'entry',request_options:{pager:{start:0,rows:1}}};
        pdbRes=await fetch('https://search.rcsb.org/rcsbsearch/v2/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fallback)});
      }
      const data=await pdbRes.json();
      pdbId=data?.result_set?.[0]?.identifier || '';
      fill.style.width='55%';
    }
    if(!pdbId) throw new Error('No Protein Data Bank structure matched that query');
    const pdbFile=await fetch(`https://files.rcsb.org/download/${encodeURIComponent(pdbId)}.pdb`);
    if(!pdbFile.ok) throw new Error('PDB file download failed');
    fill.style.width='90%';
    const pdbText=await pdbFile.text();
    const parsed=parsePDB(pdbText);
    if(!parsed?.atoms?.length) throw new Error('Could not parse the PDB structure');
    fill.style.width='100%';
    setTimeout(()=>{prog.style.display='none';fill.style.width='0%';},500);
    loadMolecule(pdbId, parsed);
  }catch(err){prog.style.display='none';fill.style.width='0%';notify(err.message,'error');}
}
async function searchResearchDatabases(){
  const q=getDatabaseQuery();
  if(!q)return notify('Enter a compound, target, ligand, structure, or formula keyword','error');
  setDbResults('Inspecting MOGADOC plus Chemical &amp; Molecular, Structural / 3D, and Quantum / Materials sources…');
  const sections=[];
  const addSection=(title,badge,body,links)=>sections.push(`<div class="db-result-item"><div class="db-result-top"><div><div class="db-result-title">${title}</div><div>${body}</div></div><span class="db-badge">${badge}</span></div><div class="db-result-links">${links}</div></div>`);
  addSection(`MOGADOC lookup for ${dbEsc(q)}`,'Gas-phase · Ulm',
    'Ulm University MOGADOC database — gas-phase structure data (microwave, electron diffraction, IR/Raman). Login required.',
    `<a class="db-link" href="${getDatabaseSearchUrl('mogadoc',q)}" target="_blank" rel="noopener noreferrer">Open MOGADOC login</a><a class="db-link" href="https://www.uni-ulm.de/nawi/chemieinformationssysteme/mogadoc/" target="_blank" rel="noopener noreferrer">About MOGADOC</a>`);
  try{
    const cidRes=await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(q)}/cids/JSON`);
    if(cidRes.ok){
      const cidData=await cidRes.json();
      const cid=cidData?.IdentifierList?.CID?.[0];
      if(cid){
        let formula='';
        try{
          const propRes=await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`);
          if(propRes.ok){
            const props=(await propRes.json())?.PropertyTable?.Properties?.[0]||{};
            formula=[props.IUPACName, props.MolecularFormula, props.MolecularWeight?`MW ${Number(props.MolecularWeight).toFixed(2)}`:''].filter(Boolean).map(dbEsc).join(' · ');
          }
        }catch(_){ }
        addSection(`PubChem match for ${dbEsc(q)}`,'Chemical & molecular',formula || `CID ${cid}`,
          `<a class="db-link" href="https://pubchem.ncbi.nlm.nih.gov/compound/${cid}" target="_blank" rel="noopener noreferrer">Open record</a><a class="db-link" href="javascript:selectDatabase('pubchem');searchPubChem()">Load 3D</a><a class="db-link" href="${getDatabaseSearchUrl('pubchem',q)}" target="_blank" rel="noopener noreferrer">More results</a>`);
      }
    }
  }catch(_){ }
  try{
    const chemblRes=await fetch(`https://www.ebi.ac.uk/chembl/api/data/molecule/search.json?q=${encodeURIComponent(q)}`);
    if(chemblRes.ok){
      const data=await chemblRes.json();
      const hit=data?.molecules?.[0];
      if(hit){
        const chemblId=hit.molecule_chembl_id||'ChEMBL';
        const pref=hit.pref_name || hit.molecule_synonyms?.[0]?.molecule_synonym || q;
        const info=[hit.molecule_properties?.full_molformula, chemblId].filter(Boolean).map(dbEsc).join(' · ');
        addSection(dbEsc(pref),'Chemical & molecular',info,
          `<a class="db-link" href="https://www.ebi.ac.uk/chembl/explore/compound/${encodeURIComponent(chemblId)}" target="_blank" rel="noopener noreferrer">Open record</a><a class="db-link" href="${getDatabaseSearchUrl('chembl',q)}" target="_blank" rel="noopener noreferrer">More results</a>`);
      }
    }
  }catch(_){ }
  addSection(`ChemSpider search for ${dbEsc(q)}`,'Chemical & molecular','Royal Society of Chemistry index for names, identifiers, and linked sources.',
    `<a class="db-link" href="${getDatabaseSearchUrl('chemspider',q)}" target="_blank" rel="noopener noreferrer">Open ChemSpider</a>`);
  addSection(`ZINC search for ${dbEsc(q)}`,'Chemical & molecular','Purchasable ligands and virtual screening libraries.',
    `<a class="db-link" href="${getDatabaseSearchUrl('zinc',q)}" target="_blank" rel="noopener noreferrer">Open ZINC</a>`);
  try{
    const pdbQuery={query:{type:'terminal',service:'text',parameters:{attribute:'struct.title',operator:'contains_phrase',value:q}},return_type:'entry',request_options:{pager:{start:0,rows:1}}};
    const pdbRes=await fetch('https://search.rcsb.org/rcsbsearch/v2/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pdbQuery)});
    if(pdbRes.ok){
      const data=await pdbRes.json();
      const hit=data?.result_set?.[0];
      if(hit?.identifier){
        const id=hit.identifier;
        addSection(`Protein Data Bank match for ${dbEsc(q)}`,'Structural / 3D',`${dbEsc(id)} · macromolecular or ligand-associated structure`,
          `<a class="db-link" href="https://www.rcsb.org/structure/${encodeURIComponent(id)}" target="_blank" rel="noopener noreferrer">Open structure</a><a class="db-link" href="javascript:selectDatabase('rcsb');document.getElementById('dbSearchInput').value='${dbEsc(id)}';searchPDB()">Load into viewer</a><a class="db-link" href="${getDatabaseSearchUrl('rcsb',q)}" target="_blank" rel="noopener noreferrer">More results</a>`);
      }
    }
  }catch(_){ }
  addSection(`Cambridge Structural Database search for ${dbEsc(q)}`,'Structural / 3D','Small-molecule and crystal-structure exploration.',
    `<a class="db-link" href="${getDatabaseSearchUrl('csd',q)}" target="_blank" rel="noopener noreferrer">Open CSD</a>`);
  addSection(`Materials Project search for ${dbEsc(q)}`,'Quantum / materials','Computed materials and molecules by composition, chemistry, and property.',
    `<a class="db-link" href="${getDatabaseSearchUrl('materialsproject',q)}" target="_blank" rel="noopener noreferrer">Open Materials Project</a><a class="db-link" href="https://next-gen.materialsproject.org/molecules" target="_blank" rel="noopener noreferrer">Molecules Explorer</a>`);
  addSection(`NOMAD search for ${dbEsc(q)}`,'Quantum / materials','FAIR materials-science repository and archive.',
    `<a class="db-link" href="${getDatabaseSearchUrl('nomad',q)}" target="_blank" rel="noopener noreferrer">Open NOMAD</a>`);
  setDbResults(sections.join(''));
  notify('Database coverage updated across all major categories','success');
}

function computeProjectedBounds(width, height, localZoom, localPanX, localPanY, orthographic){
  if(!molecule||!molecule.atoms?.length)return null;
  const W=width, H=height;
  const cx=W/2, cy=H/2;
  const scale=molecule.scale*localZoom;
  const M=mat3Mul(mat3RotY(rotY),mat3RotX(rotX));
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  const atomScale=parseFloat(document.getElementById('atomScale').value||'1');
  molecule.atoms.forEach(a=>{
    const p=mat3Vec(M,[a.x,a.y,a.z]);
    const z=p[2]*scale;
    const d=projectD(z, orthographic);
    let baseR; const el=getElement(a.symbol);
    if(viewMode==='spacefill') baseR=el.r*(getElementSizeScale(a.symbol))*90*atomScale*d;
    else if(viewMode==='wireframe'||viewMode==='stick') baseR=0;
    else if(viewMode==='cartoon') baseR=(el.symbol==='C'?6:4)*atomScale*d;
    else baseR=el.r*(getElementSizeScale(a.symbol))*40*atomScale*d;
    const sx=cx + p[0]*scale*d + localPanX;
    const sy=cy - p[1]*scale*d + localPanY;
    minX=Math.min(minX,sx-baseR); maxX=Math.max(maxX,sx+baseR);
    minY=Math.min(minY,sy-baseR); maxY=Math.max(maxY,sy+baseR);
  });
  return {minX,maxX,minY,maxY,width:maxX-minX,height:maxY-minY,cx:(minX+maxX)/2,cy:(minY+maxY)/2};
}
function computeCompactView(targetCanvas, pad, overlayH, scaleBarH, attribH, legendW, orthographic){
  const exportW=targetCanvas.width, exportH=targetCanvas.height;
  const rect={
    x:pad,
    y:pad+overlayH,
    w:Math.max(80,exportW-pad*2-legendW),
    h:Math.max(80,exportH-pad*2-overlayH-scaleBarH-attribH)
  };
  if(!molecule||!molecule.atoms?.length) return {zoom:Math.max(0.05, zoom||1), panX:0, panY:0, rect};

  let z=Math.max(0.08, zoom||1);
  let px=0, py=0;
  const fitSlack=0.90;

  for(let i=0;i<10;i++){
    let b=computeProjectedBounds(exportW, exportH, z, 0, 0, orthographic);
    if(!b || !isFinite(b.width) || !isFinite(b.height) || b.width<=0 || b.height<=0) break;
    const fit=Math.min(rect.w/Math.max(1,b.width), rect.h/Math.max(1,b.height));
    z*=Math.max(0.08, fit*fitSlack);
    b=computeProjectedBounds(exportW, exportH, z, 0, 0, orthographic);
    if(!b) break;
    px=(rect.x + rect.w/2) - b.cx;
    py=(rect.y + rect.h/2) - b.cy;
    b=computeProjectedBounds(exportW, exportH, z, px, py, orthographic);
    if(!b) break;
    const overflowX=Math.max(0, rect.x-b.minX, b.maxX-(rect.x+rect.w));
    const overflowY=Math.max(0, rect.y-b.minY, b.maxY-(rect.y+rect.h));
    if(overflowX<0.75 && overflowY<0.75) break;
    const rescue=Math.min(rect.w/Math.max(1,b.width), rect.h/Math.max(1,b.height))*0.985;
    z*=Math.max(0.08, rescue);
  }

  let finalBounds=computeProjectedBounds(exportW, exportH, z, px, py, orthographic);
  if(finalBounds){
    px += (rect.x + rect.w/2) - finalBounds.cx;
    py += (rect.y + rect.h/2) - finalBounds.cy;
    finalBounds=computeProjectedBounds(exportW, exportH, z, px, py, orthographic);
    if(finalBounds){
      const rescue=Math.min(rect.w/Math.max(1,finalBounds.width), rect.h/Math.max(1,finalBounds.height))*0.975;
      if(rescue<1){
        z*=Math.max(0.08, rescue);
        finalBounds=computeProjectedBounds(exportW, exportH, z, 0, 0, orthographic);
        if(finalBounds){
          px=(rect.x + rect.w/2) - finalBounds.cx;
          py=(rect.y + rect.h/2) - finalBounds.cy;
        }
      }
    }
  }

  return {zoom:z, panX:px, panY:py, rect};
}
function applyExportPreset(preset){
  const set=(id,val,prop='value')=>{const el=document.getElementById(id); if(!el)return; el[prop]=val;};
  if(preset==='journal'){
    set('ps-resolution','nature'); set('ps-dpi','600'); set('ps-format','png'); set('ps-bg','white'); set('ps-border','none');
    set('ps-padding','20'); document.getElementById('ps-padval').textContent='20px';
    document.getElementById('ps-title').checked=true; document.getElementById('ps-formula').checked=true; document.getElementById('ps-legend').checked=false;
    document.getElementById('ps-scale').checked=true; document.getElementById('ps-attrib').checked=false; document.getElementById('ps-compact').checked=true;
    document.getElementById('ps-ortho').checked=true; document.getElementById('ps-journal').checked=true;
  }else if(preset==='presentation'){
    set('ps-resolution','2x'); set('ps-dpi','300'); set('ps-format','png'); set('ps-bg','current'); set('ps-border','thin'); set('ps-padding','24');
    document.getElementById('ps-padval').textContent='24px';
    document.getElementById('ps-title').checked=true; document.getElementById('ps-formula').checked=true; document.getElementById('ps-legend').checked=true;
    document.getElementById('ps-scale').checked=true; document.getElementById('ps-attrib').checked=false; document.getElementById('ps-compact').checked=true; document.getElementById('ps-ortho').checked=false; document.getElementById('ps-journal').checked=false;
  }else if(preset==='dark'){
    set('ps-resolution','4x'); set('ps-dpi','300'); set('ps-format','png'); set('ps-bg','black'); set('ps-border','accent'); set('ps-padding','28');
    document.getElementById('ps-padval').textContent='28px';
    document.getElementById('ps-title').checked=true; document.getElementById('ps-formula').checked=true; document.getElementById('ps-legend').checked=true;
    document.getElementById('ps-scale').checked=true; document.getElementById('ps-attrib').checked=false; document.getElementById('ps-compact').checked=true; document.getElementById('ps-ortho').checked=false; document.getElementById('ps-journal').checked=false;
  }else if(preset==='minimal'){
    set('ps-resolution','sq'); set('ps-dpi','600'); set('ps-format','png'); set('ps-bg','transparent'); set('ps-border','none'); set('ps-padding','8');
    document.getElementById('ps-padval').textContent='8px';
    document.getElementById('ps-title').checked=false; document.getElementById('ps-formula').checked=false; document.getElementById('ps-legend').checked=false;
    document.getElementById('ps-scale').checked=false; document.getElementById('ps-attrib').checked=false; document.getElementById('ps-compact').checked=true; document.getElementById('ps-ortho').checked=true; document.getElementById('ps-journal').checked=false;
  }
  updatePubShotPreview();
}
function applyJournalPreset(){
  const chk=document.getElementById('ps-journal');
  if(chk?.checked) applyExportPreset('journal');
}
function projectForSvg(atom, W, H, exportState, orthographic){
  const M=mat3Mul(mat3RotY(rotY),mat3RotX(rotX));
  const _dpr=1;
  const scale=molecule.scale*exportState.zoom*_dpr;
  const p=mat3Vec(M,[atom.x,atom.y,atom.z]);
  const z=p[2]*scale;
  const d=projectD(z, orthographic);
  return {sx:W/2 + p[0]*scale*d + exportState.panX, sy:H/2 - p[1]*scale*d + exportState.panY, d, z, p};
}
function getSvgAtomRadius(atom, projectedPoint, atomScale){
  const el=getElement(atom.symbol);
  if(viewMode==='spacefill') return el.r*(getElementSizeScale(atom.symbol))*90*atomScale*projectedPoint.d;
  if(viewMode==='wireframe'||viewMode==='stick') return 0;
  if(viewMode==='cartoon') return (el.symbol==='C'?6:4)*atomScale*projectedPoint.d;
  return el.r*(getElementSizeScale(atom.symbol))*40*atomScale*projectedPoint.d;
}
function computeSvgGeometryBounds(exportState,cfg,W,H){
  if(!molecule?.atoms?.length) return null;
  const atomScale=parseFloat(document.getElementById('atomScale').value||'1');
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  molecule.bonds.forEach(bond=>{
    const ai=molecule.atoms[bond.a], aj=molecule.atoms[bond.b];
    if(!ai||!aj) return;
    const pi=projectForSvg(ai,W,H,exportState,cfg.orthographic), pj=projectForSvg(aj,W,H,exportState,cfg.orthographic);
    const dx=pj.sx-pi.sx, dy=pj.sy-pi.sy, len=Math.hypot(dx,dy)||1;
    const nx=-dy/len, ny=dx/len;
    const bw=Math.max(1,parseFloat(document.getElementById('bondWidth').value||'2'));
    const spread=(bond.order||1)>=3 ? 5 : (bond.order||1)===2 ? 3 : 0;
    const pad=bw/2 + spread;
    [pi,pj].forEach(pt=>{
      minX=Math.min(minX, pt.sx-pad-nx*spread, pt.sx-pad+nx*spread);
      maxX=Math.max(maxX, pt.sx+pad-nx*spread, pt.sx+pad+nx*spread);
      minY=Math.min(minY, pt.sy-pad-ny*spread, pt.sy-pad+ny*spread);
      maxY=Math.max(maxY, pt.sy+pad-ny*spread, pt.sy+pad+ny*spread);
    });
  });
  molecule.atoms.forEach(atom=>{
    const p=projectForSvg(atom,W,H,exportState,cfg.orthographic);
    const r=getSvgAtomRadius(atom,p,atomScale);
    minX=Math.min(minX,p.sx-r); maxX=Math.max(maxX,p.sx+r);
    minY=Math.min(minY,p.sy-r); maxY=Math.max(maxY,p.sy+r);
  });
  if(!isFinite(minX)||!isFinite(maxX)||!isFinite(minY)||!isFinite(maxY)) return null;
  return {minX,maxX,minY,maxY,width:maxX-minX,height:maxY-minY,cx:(minX+maxX)/2,cy:(minY+maxY)/2};
}

function buildPublicationSvg(cfg){
  if(!molecule)return '';
  const dims=getOutputDims(cfg.resolution);
  const W=dims.w, H=dims.h, pad=cfg.padding;
  const overlayH=(cfg.showTitle||cfg.showFormula)?64:0;
  const legendW=0;
  const scaleBarH=cfg.showScale?36:0;
  const attribH=cfg.showAttrib?28:0;
  let exportState = cfg.compact ? computeCompactView({width:W,height:H}, pad, overlayH, scaleBarH, attribH, legendW, cfg.orthographic) : {zoom:zoom, panX:panX, panY:panY, rect:{x:pad,y:pad+overlayH,w:W-pad*2-legendW,h:H-pad*2-overlayH-scaleBarH-attribH}};
  const targetRect=exportState.rect || {x:pad,y:pad+overlayH,w:W-pad*2-legendW,h:H-pad*2-overlayH-scaleBarH-attribH};
  let preciseBounds=computeSvgGeometryBounds(exportState,cfg,W,H);
  if(preciseBounds && preciseBounds.width>0 && preciseBounds.height>0){
    const fit=Math.min(targetRect.w/Math.max(1,preciseBounds.width), targetRect.h/Math.max(1,preciseBounds.height))*0.965;
    if(isFinite(fit) && fit>0 && Math.abs(1-fit)>0.015){
      exportState={...exportState, zoom:Math.max(0.02, exportState.zoom*fit)};
      preciseBounds=computeSvgGeometryBounds(exportState,cfg,W,H);
    }
    if(preciseBounds){
      exportState={...exportState, panX:exportState.panX + (targetRect.x+targetRect.w/2 - preciseBounds.cx), panY:exportState.panY + (targetRect.y+targetRect.h/2 - preciseBounds.cy)};
      preciseBounds=computeSvgGeometryBounds(exportState,cfg,W,H);
      if(preciseBounds){
        const rescue=Math.min(targetRect.w/Math.max(1,preciseBounds.width), targetRect.h/Math.max(1,preciseBounds.height))*0.985;
        if(isFinite(rescue) && rescue>0 && rescue<1){
          exportState={...exportState, zoom:Math.max(0.02, exportState.zoom*rescue)};
          preciseBounds=computeSvgGeometryBounds(exportState,cfg,W,H);
          if(preciseBounds){
            exportState={...exportState, panX:exportState.panX + (targetRect.x+targetRect.w/2 - preciseBounds.cx), panY:exportState.panY + (targetRect.y+targetRect.h/2 - preciseBounds.cy)};
          }
        }
      }
    }
  }
  const bg = cfg.bgOverride==='transparent' ? 'none' : (cfg.bgOverride==='cream' ? '#f5f0e8' : cfg.bgOverride==='black' ? '#000000' : '#ffffff');
  const counts={}; molecule.atoms.forEach(a=>{const s=a.symbol.charAt(0).toUpperCase()+a.symbol.slice(1).toLowerCase(); counts[s]=(counts[s]||0)+1;});
  const ord=['C','H',...Object.keys(counts).filter(e=>e!=='C'&&e!=='H').sort()];
  const formula=ord.filter(e=>counts[e]).map(e=>e+(counts[e]>1?counts[e]:'')).join('');
  const M=mat3Mul(mat3RotY(rotY),mat3RotX(rotX));
  molecule.atoms.forEach(a=>{a.__svgp=mat3Vec(M,[a.x,a.y,a.z]);});
  const sortedAtoms=[...molecule.atoms].sort((a,b)=>a.__svgp[2]-b.__svgp[2]);
  const lines=[];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">`);
  lines.push(`<rect width="100%" height="100%" fill="${bg}"${bg==='none'?' opacity="0"':''}/>`);
  if(cfg.showTitle) lines.push(`<text x="${pad}" y="${pad+24}" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#1a2840">${dbEsc(cfg.titleText)}</text>`);
  if(cfg.showFormula) lines.push(`<text x="${pad}" y="${pad+50}" font-family="monospace" font-size="14" fill="#0ea5e9">${dbEsc(formula)}</text>`);
  const atomScale=parseFloat(document.getElementById('atomScale').value||'1');
  molecule.bonds.forEach(bond=>{
    const ai=molecule.atoms[bond.a], aj=molecule.atoms[bond.b]; if(!ai||!aj) return;
    const pi=projectForSvg(ai,W,H,exportState,cfg.orthographic), pj=projectForSvg(aj,W,H,exportState,cfg.orthographic);
    const dx=pj.sx-pi.sx, dy=pj.sy-pi.sy, len=Math.hypot(dx,dy); if(len<0.5)return;
    const nx=-dy/len, ny=dx/len; const bw=Math.max(1,parseFloat(document.getElementById('bondWidth').value||'2'));
    const col='#5c6f89';
    const draw=(ox,oy, sw, dash='')=>lines.push(`<line x1="${(pi.sx+ox).toFixed(2)}" y1="${(pi.sy+oy).toFixed(2)}" x2="${(pj.sx+ox).toFixed(2)}" y2="${(pj.sy+oy).toFixed(2)}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"${dash?` stroke-dasharray="${dash}"`:''}/>`);
    if((bond.order||1)===2){ draw(-nx*3,-ny*3,bw); draw(nx*3,ny*3,bw); }
    else if((bond.order||1)>=3){ draw(0,0,bw); draw(-nx*5,-ny*5,bw*0.8); draw(nx*5,ny*5,bw*0.8); }
    else draw(0,0,bw);
  });
  sortedAtoms.forEach(a=>{
    const p=projectForSvg(a,W,H,exportState,cfg.orthographic);
    const el=getElement(a.symbol);
    let r=getSvgAtomRadius(a,p,atomScale);
    if(r<=0.5) return;
    lines.push(`<circle cx="${p.sx.toFixed(2)}" cy="${p.sy.toFixed(2)}" r="${r.toFixed(2)}" fill="${getAtomDisplayColor(a)}" stroke="rgba(0,0,0,0.18)" stroke-width="0.6"/>`);
  });
  if(cfg.showScale){
    const barX=pad+16, barY=H-attribH-18, barW=80;
    lines.push(`<rect x="${barX}" y="${barY}" width="${barW}" height="2" fill="#8aa0bc"/>`);
    lines.push(`<rect x="${barX}" y="${barY-4}" width="2" height="10" fill="#8aa0bc"/>`);
    lines.push(`<rect x="${barX+barW-2}" y="${barY-4}" width="2" height="10" fill="#8aa0bc"/>`);
  }
  lines.push(`</svg>`);
  return lines.join('');
}
function exportSVG(){
  if(!molecule)return notify('No structure loaded','error');
  const cfg=getPubShotSettings();
  const svg=buildPublicationSvg(cfg);
  download(svg,`${(molecule?.name||'molecule').replace(/\s+/g,'_')}_pub.svg`,'image/svg+xml');
  notify('Saved vector SVG export','success');
}
function copySVGToClipboard(){
  if(!molecule)return notify('No structure loaded','error');
  const svg=buildPublicationSvg(getPubShotSettings());
  navigator.clipboard.writeText(svg).then(()=>notify('SVG copied to clipboard','success')).catch(()=>notify('Clipboard copy failed','error'));
}

// (Demo molecules defined earlier with DEMO_MOLECULES + loadDemo)

// ═══════════════════════════════════════════════════════════
