/* ═══════════════════════════════════════════════════════
   Pro Patches — MogadocLab
   ═══════════════════════════════════════════════════════ */

(function(){
  const SUPPORTED_EXTENSIONS = new Set(['xyz','mol','mol2','json','sdf','pdb','ent','out','log','gjf','com','inp','in','cube','cub','cif','xsf','vasp','poscar','contcar','coord','nw','nwout']);
  const NET_TIMEOUT_MS = 12000;
  function esc(v){ return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function niceError(err){
    const msg = (err && err.message ? err.message : String(err || 'Unknown error')).trim();
    if(/AbortError/i.test(msg)) return 'The request timed out. The database may be slow or blocking cross-origin requests.';
    if(/Failed to fetch|NetworkError|Load failed/i.test(msg)) return navigator.onLine===false ? 'You appear to be offline. Database search needs an internet connection.' : 'Network request failed. Some public databases block local-file requests or may be temporarily unavailable.';
    return msg || 'Unexpected error';
  }
  function sanitizeFilename(name, fallback){
    const base = String(name || fallback || 'molecule')
      .replace(/[\\/:*?"<>|]+/g,' ')
      .replace(/\s+/g,' ')
      .trim()
      .slice(0,120);
    return base || (fallback || 'molecule');
  }
  function stripExtension(name){ return String(name||'').replace(/\.[^.]+$/,''); }
  function currentQuery(){
    const el = document.getElementById('dbSearchInput') || document.getElementById('pubchemInput');
    return (el && typeof el.value === 'string' ? el.value : '').trim();
  }
  function withProgress(start){
    const prog=document.getElementById('searchProgress');
    const fill=document.getElementById('searchFill');
    if(prog) prog.style.display='block';
    if(fill) fill.style.width=(start || 14) + '%';
    return {
      set(v){ if(fill) fill.style.width=v+'%'; },
      done(){ if(fill) fill.style.width='100%'; setTimeout(()=>{ if(prog) prog.style.display='none'; if(fill) fill.style.width='0%'; }, 500); },
      fail(){ if(prog) prog.style.display='none'; if(fill) fill.style.width='0%'; }
    };
  }
  async function fetchWithTimeout(url, options, timeout){
    const controller = new AbortController();
    const t = setTimeout(()=>controller.abort(new DOMException('Timeout','AbortError')), timeout || NET_TIMEOUT_MS);
    try {
      return await fetch(url, {...(options||{}), signal: controller.signal});
    } finally {
      clearTimeout(t);
    }
  }
  async function fetchJson(url, options, timeout){
    const res = await fetchWithTimeout(url, options, timeout);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  async function readTextFile(file){
    return new Promise((resolve,reject)=>{
      const reader = new FileReader();
      reader.onerror = ()=> reject(new Error('File could not be read'));
      reader.onload = e => resolve(String(e.target?.result ?? ''));
      reader.readAsText(file);
    });
  }
  async function importStructureFile(file){
    if(!file) return;
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(ext && !SUPPORTED_EXTENSIONS.has(ext)){
      notify(`Unsupported file type: .${ext}. Use XYZ, MOL, MOL2, JSON, SDF, PDB, CIF, CUBE, XSF, or supported QM outputs.`,'error');
      return;
    }
    if(file.size > 20 * 1024 * 1024){
      notify('That file is too large for a safe in-browser parse. Keep it under 20 MB or trim the structure/output first.','error');
      return;
    }
    try{
      notify(`Importing ${file.name}…`,'info');
      const text = await readTextFile(file);
      const title = sanitizeFilename(stripExtension(file.name), 'Imported Molecule');
      loadStructureText(file.name, text, { displayName: title });
    }catch(err){
      notify('Import failed: ' + niceError(err), 'error');
    }
  }
  function dbName(q){ return q ? q.charAt(0).toUpperCase()+q.slice(1) : 'Imported Molecule'; }
  function mapAtomicNumberToSymbol(z){
    const EN={1:'H',2:'He',3:'Li',4:'Be',5:'B',6:'C',7:'N',8:'O',9:'F',10:'Ne',11:'Na',12:'Mg',13:'Al',14:'Si',15:'P',16:'S',17:'Cl',18:'Ar',19:'K',20:'Ca',21:'Sc',22:'Ti',23:'V',24:'Cr',25:'Mn',26:'Fe',27:'Co',28:'Ni',29:'Cu',30:'Zn',31:'Ga',32:'Ge',33:'As',34:'Se',35:'Br',36:'Kr',47:'Ag',53:'I',78:'Pt',79:'Au'};
    return EN[z] || 'C';
  }
  function parsePubChemCompound(compound, dimensionality){
    const conformer = compound?.coords?.[0]?.conformers?.[0];
    const atomsList = compound?.atoms;
    const bonds3d = compound?.bonds;
    if(!conformer || !atomsList?.element?.length) return null;
    const xs = conformer.x || [];
    const ys = conformer.y || [];
    const zs = conformer.z || xs.map(()=>0);
    const atoms = atomsList.element.map((en,i)=>({
      symbol: mapAtomicNumberToSymbol(en),
      x: Number(xs[i] ?? 0),
      y: Number(ys[i] ?? 0),
      z: Number(zs[i] ?? 0),
      idx: i
    }));
    let bonds=[];
    if(bonds3d?.aid1?.length && bonds3d?.aid2?.length){
      const ord=bonds3d.order||[];
      for(let i=0;i<bonds3d.aid1.length;i++) bonds.push({a:bonds3d.aid1[i]-1,b:bonds3d.aid2[i]-1,order:ord[i]||1,type:'covalent'});
    }
    if(!bonds.length) bonds = autoDetectBonds(atoms);
    return {atoms,bonds, meta:{source:'PubChem', format: dimensionality, confidence: dimensionality==='2d' ? '2D coordinates used as planar fallback' : '3D conformer'}};
  }
  async function robustSearchPubChem(){
    const q=currentQuery();
    if(!q) return notify('Enter a compound name, synonym, formula, or CID','error');
    const prog=withProgress(14);
    try{
      const cidData = await fetchJson(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(q)}/cids/JSON`);
      const cid = cidData?.IdentifierList?.CID?.[0];
      if(!cid) throw new Error('Compound not found in PubChem');
      prog.set(42);
      for(const recordType of ['3d','2d']){
        try{
          const data = await fetchJson(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/JSON?record_type=${recordType}`);
          const compound = data?.PC_Compounds?.[0];
          const mol = parsePubChemCompound(compound, recordType);
          if(mol?.atoms?.length){
            prog.done();
            loadMolecule(dbName(q), mol);
            if(recordType==='2d') notify('Loaded planar coordinates from PubChem because a 3D conformer was unavailable','info');
            return;
          }
        }catch(_){ }
      }
      throw new Error('No usable coordinates were available from PubChem');
    }catch(err){ prog.fail(); notify(niceError(err),'error'); }
  }
  async function robustSearchPDB(){
    const q=currentQuery();
    if(!q) return notify('Enter a PDB ID or structure keyword','error');
    const prog=withProgress(12);
    try{
      let pdbId='';
      if(/^[A-Za-z0-9]{4}$/.test(q.trim())){
        pdbId=q.trim().toUpperCase();
        prog.set(38);
      }else{
        const bodyA={query:{type:'terminal',service:'text',parameters:{attribute:'rcsb_entry_container_identifiers.entry_id',operator:'exact_match',value:q.toUpperCase()}},return_type:'entry',request_options:{pager:{start:0,rows:1}}};
        const bodyB={query:{type:'terminal',service:'text',parameters:{attribute:'struct.title',operator:'contains_phrase',value:q}},return_type:'entry',request_options:{pager:{start:0,rows:1}}};
        let data;
        try{ data = await fetchJson('https://search.rcsb.org/rcsbsearch/v2/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(bodyA)}); }catch(_){ data=null; }
        pdbId = data?.result_set?.[0]?.identifier || '';
        if(!pdbId){
          data = await fetchJson('https://search.rcsb.org/rcsbsearch/v2/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(bodyB)});
          pdbId = data?.result_set?.[0]?.identifier || '';
        }
        prog.set(54);
      }
      if(!pdbId) throw new Error('No Protein Data Bank structure matched that query');
      const pdbFile = await fetchWithTimeout(`https://files.rcsb.org/download/${encodeURIComponent(pdbId)}.pdb`);
      if(!pdbFile.ok) throw new Error('PDB file download failed');
      prog.set(86);
      const pdbText = await pdbFile.text();
      const parsed = parsePDB(pdbText, {source:'Protein Data Bank', format:'pdb', inputName:`${pdbId}.pdb`, confidence:'downloaded from RCSB'});
      if(!parsed?.atoms?.length) throw new Error('Could not parse the PDB structure');
      prog.done();
      loadMolecule(pdbId, parsed);
    }catch(err){ prog.fail(); notify(niceError(err),'error'); }
  }
  async function robustSearchResearchDatabases(){
    const q=currentQuery();
    if(!q) return notify('Enter a compound, target, ligand, structure, or formula keyword','error');
    if(typeof setDbResults === 'function') setDbResults('Inspecting MOGADOC plus Chemical &amp; Molecular, Structural / 3D, and Quantum / Materials sources…');
    const sections=[];
    const add=(title,badge,body,links)=>sections.push(`<div class="db-result-item"><div class="db-result-top"><div><div class="db-result-title">${title}</div><div>${body}</div></div><span class="db-badge">${badge}</span></div><div class="db-result-links">${links}</div></div>`);

    add(`MOGADOC lookup for ${esc(q)}`,'Gas-phase · Ulm',
      'Ulm University MOGADOC database — gas-phase structure data (microwave, electron diffraction, IR/Raman). Login required.',
      `<a class="db-link" href="${getDatabaseSearchUrl('mogadoc',q)}" target="_blank" rel="noopener noreferrer">Open MOGADOC login</a><a class="db-link" href="https://www.uni-ulm.de/nawi/chemieinformationssysteme/mogadoc/" target="_blank" rel="noopener noreferrer">About MOGADOC</a>`);

    const tasks = [
      (async()=>{
        try{
          const cidData = await fetchJson(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(q)}/cids/JSON`);
          const cid = cidData?.IdentifierList?.CID?.[0];
          if(!cid) return;
          let info = `CID ${cid}`;
          try{
            const props = await fetchJson(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`);
            const p = props?.PropertyTable?.Properties?.[0] || {};
            info = [p.IUPACName, p.MolecularFormula, p.MolecularWeight ? `MW ${Number(p.MolecularWeight).toFixed(2)}` : `CID ${cid}`].filter(Boolean).map(esc).join(' · ');
          }catch(_){ }
          add(`PubChem match for ${esc(q)}`,'Chemical &amp; molecular',info,
            `<a class="db-link" href="https://pubchem.ncbi.nlm.nih.gov/compound/${cid}" target="_blank" rel="noopener noreferrer">Open record</a><a class="db-link" href="javascript:selectDatabase('pubchem');searchPubChem()">Load coordinates</a><a class="db-link" href="${getDatabaseSearchUrl('pubchem',q)}" target="_blank" rel="noopener noreferrer">More results</a>`);
        }catch(_){ }
      })(),
      (async()=>{
        try{
          const data = await fetchJson(`https://www.ebi.ac.uk/chembl/api/data/molecule/search.json?q=${encodeURIComponent(q)}`);
          const hit = data?.molecules?.[0];
          if(!hit) return;
          const chemblId = hit.molecule_chembl_id || 'ChEMBL';
          const pref = esc(hit.pref_name || hit.molecule_synonyms?.[0]?.molecule_synonym || q);
          const info = [hit.molecule_properties?.full_molformula, chemblId].filter(Boolean).map(esc).join(' · ');
          add(pref,'Chemical &amp; molecular', info || esc(chemblId),
            `<a class="db-link" href="https://www.ebi.ac.uk/chembl/explore/compound/${encodeURIComponent(chemblId)}" target="_blank" rel="noopener noreferrer">Open record</a><a class="db-link" href="${getDatabaseSearchUrl('chembl',q)}" target="_blank" rel="noopener noreferrer">More results</a>`);
        }catch(_){ }
      })(),
      (async()=>{
        try{
          const body={query:{type:'terminal',service:'text',parameters:{attribute:'struct.title',operator:'contains_phrase',value:q}},return_type:'entry',request_options:{pager:{start:0,rows:1}}};
          const data = await fetchJson('https://search.rcsb.org/rcsbsearch/v2/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
          const hit = data?.result_set?.[0];
          if(!hit?.identifier) return;
          add(`RCSB structure ${esc(hit.identifier)}`,'Structural / 3D', esc(q),
            `<a class="db-link" href="https://www.rcsb.org/structure/${encodeURIComponent(hit.identifier)}" target="_blank" rel="noopener noreferrer">Open record</a><a class="db-link" href="javascript:selectDatabase('rcsb');searchPDB()">Load PDB</a><a class="db-link" href="${getDatabaseSearchUrl('rcsb',q)}" target="_blank" rel="noopener noreferrer">More results</a>`);
        }catch(_){ }
      })()
    ];
    await Promise.allSettled(tasks);
    add('Materials Project','Quantum / materials', esc(q), `<a class="db-link" href="${getDatabaseSearchUrl('materialsproject',q)}" target="_blank" rel="noopener noreferrer">Open search</a>`);
    add('NOMAD','Quantum / materials', esc(q), `<a class="db-link" href="${getDatabaseSearchUrl('nomad',q)}" target="_blank" rel="noopener noreferrer">Open search</a>`);
    add('ZINC / ChemSpider / CSD','Additional resources', esc(q), `<a class="db-link" href="${getDatabaseSearchUrl('zinc',q)}" target="_blank" rel="noopener noreferrer">ZINC</a><a class="db-link" href="${getDatabaseSearchUrl('chemspider',q)}" target="_blank" rel="noopener noreferrer">ChemSpider</a><a class="db-link" href="${getDatabaseSearchUrl('csd',q)}" target="_blank" rel="noopener noreferrer">CSD</a>`);
    const html = sections.length ? sections.join('') : 'No quick matches were returned. Try a more specific identifier, formula, ligand code, or exact structure name.';
    if(typeof setDbResults === 'function') setDbResults(html);
  }
  function modalOpen(){
    return ['drawModal','colorEditorModal','pubshotModal'].some(id=>{
      const el=document.getElementById(id);
      return !!(el && getComputedStyle(el).display !== 'none');
    });
  }
  function isEditableTarget(t){
    if(!t) return false;
    if(t.isContentEditable) return true;
    return !!(t.closest && t.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]'));
  }
  function patchDynamicText(){
    const emptySub=document.querySelector('#emptyState .empty-sub');
    if(emptySub) emptySub.textContent='Drop a structure file, sketch a molecule, paste raw output, or query a scientific database.';
  }
  const originalRenderImportDetails = window.renderImportDetails;
  window.renderImportDetails = function(meta){
    const el=document.getElementById('importDetails');
    if(!el) return;
    if(!meta){ el.textContent='Awaiting structure import'; return; }
    const fmt=esc((meta.format||'unknown').toUpperCase());
    const src=esc(meta.source||'Unknown source');
    const name=esc(meta.inputName||'Untitled');
    const conf=esc(meta.confidence||'parsed');
    const extra=[];
    if(Number.isFinite(meta.qualityScore)) extra.push(`score: ${meta.qualityScore}/100`);
    if(meta.reviewLevel) extra.push('review: '+esc(meta.reviewLevel));
    if(meta.coordinateMode) extra.push('coords: '+esc(meta.coordinateMode));
    if(meta.units) extra.push('units: '+esc(meta.units));
    if(meta.bondingSource) extra.push('bonding: '+esc(meta.bondingSource));
    if(meta.bondingTypes) extra.push('types: '+esc(meta.bondingTypes));
    if(meta.formula) extra.push('formula: '+esc(meta.formula));
    if(Number.isFinite(meta.atomCount)) extra.push(`atoms: ${meta.atomCount}`);
    if(Number.isFinite(meta.bondCount)) extra.push(`bonds: ${meta.bondCount}`);
    if(meta.aromaticRings) extra.push(`aromatic rings: ${meta.aromaticRings}`);
    if(meta.promotedBonds) extra.push(`promoted bonds: ${meta.promotedBonds}`);
    if(meta.typedBonds) extra.push(`classified contacts: ${meta.typedBonds}`);
    if(meta.flaggedAtoms) extra.push(`review: ${meta.flaggedAtoms} coordination flag${meta.flaggedAtoms!==1?'s':''}`);
    const warnings=(meta.warnings||[]).slice(0,2).map(esc);
    el.innerHTML=`<strong>${src}</strong> · ${fmt}\nFile: ${name}\nStatus: ${conf}${extra.length ? ' · ' + extra.join(' · ') : ''}${warnings.length?`\nNotes: ${warnings.join(' ')}`:''}`;
  };
  window.updateCanvasInfo = function(){
    const box=document.getElementById('canvasInfo');
    if(!box) return;
    if(!window.molecule || !molecule?.atoms?.length){ box.classList.remove('visible'); return; }
    const counts={};
    molecule.atoms.forEach(a=>counts[a.symbol]=(counts[a.symbol]||0)+1);
    const bg = document.getElementById('canvasArea')?.getAttribute('data-bg') || 'grid';
    const scheme = esc(window.colorScheme || 'cpk');
    const importNotes = [
      esc((window.lastImportMeta?.source)||'Unknown'),
      esc(String((window.lastImportMeta?.format)||'—').toUpperCase()),
      esc((window.lastImportMeta?.bondingSource)||'bonding unknown'),
      Number.isFinite(window.lastImportMeta?.qualityScore) ? `score ${window.lastImportMeta.qualityScore}/100` : ''
    ].filter(Boolean).join(' · ');
    const refinementBits = [
      window.lastImportMeta?.aromaticRings ? `${window.lastImportMeta.aromaticRings} aromatic ring${window.lastImportMeta.aromaticRings!==1?'s':''}` : '',
      window.lastImportMeta?.promotedBonds ? `${window.lastImportMeta.promotedBonds} promoted bond${window.lastImportMeta.promotedBonds!==1?'s':''}` : '',
      window.lastImportMeta?.typedBonds ? `${window.lastImportMeta.typedBonds} classified contact${window.lastImportMeta.typedBonds!==1?'s':''}` : '',
      window.lastImportMeta?.bondingTypes ? window.lastImportMeta.bondingTypes : ''
    ].filter(Boolean).join(' · ');
    const reviewNote = window.lastImportMeta?.flaggedAtoms ? `<br>Review: ${window.lastImportMeta.flaggedAtoms} flagged coordination site${window.lastImportMeta.flaggedAtoms!==1?'s':''}` : '';
    const refineNote = refinementBits ? `<br>Refinement: ${refinementBits}` : '';
    box.innerHTML = `<div class="canvas-info-title">${esc(molecule.name || 'Molecule')}</div>`+
      `<div class="canvas-info-grid">`+
        `<div class="canvas-info-chip"><strong>Atoms</strong><span>${molecule.atoms.length}</span></div>`+
        `<div class="canvas-info-chip"><strong>Bonds</strong><span>${molecule.bonds.length}</span></div>`+
        `<div class="canvas-info-chip"><strong>Mode</strong><span>${esc(window.viewMode || '')}</span></div>`+
        `<div class="canvas-info-chip"><strong>Palette</strong><span>${scheme}</span></div>`+
      `</div>`+
      `<div class="canvas-info-foot">Elements: ${esc(Object.keys(counts).join(', '))}<br>Scene: ${esc(bg)} background · ${(window._pubshotOrthographic ? 'orthographic' : 'perspective')} camera<br>Import: ${importNotes}${reviewNote}${refineNote}</div>`;
    box.classList.toggle('visible', !!window.showInfo);
  };
  window.download = function(content, filename, mime){
    const blob = new Blob([content], {type: mime || 'application/octet-stream'});
    const url = URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=sanitizeFilename(filename, 'download');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1200);
  };
  window.handleFileLoad = function(evt){
    const file = evt?.target?.files?.[0];
    if(!file) return;
    importStructureFile(file).finally(()=>{ if(evt?.target) evt.target.value=''; });
  };
  window.getDatabaseQuery = currentQuery;
  window.searchPubChem = robustSearchPubChem;
  window.searchPDB = robustSearchPDB;
  window.searchResearchDatabases = robustSearchResearchDatabases;
  const originalOpenExternal = window.openExternal;
  window.openExternal = function(url){
    const win = window.open(url,'_blank','noopener,noreferrer');
    if(!win) notify('The popup was blocked by the browser. Allow popups for external database links.','info');
    return win;
  };

  document.addEventListener('keydown', function(e){
    const hotkeys = [' ','Spacebar','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','A','s','S','p','P','l','L','i','I','r','R','Escape'];
    if(modalOpen() || isEditableTarget(e.target)){
      if(hotkeys.includes(e.key)){
        e.stopImmediatePropagation();
      }
    }
  }, true);

  function attachDropInterceptors(){
    [['fileDrop', true], ['canvasArea', false]].forEach(([id, decorate])=>{
      const el=document.getElementById(id);
      if(!el || el.dataset.proDropBound==='1') return;
      el.dataset.proDropBound='1';
      el.addEventListener('dragover', e=>{
        e.preventDefault();
        e.stopImmediatePropagation();
        if(decorate) el.classList.add('drag-over');
      }, true);
      el.addEventListener('dragleave', e=>{
        if(decorate) el.classList.remove('drag-over');
      }, true);
      el.addEventListener('drop', e=>{
        e.preventDefault();
        e.stopImmediatePropagation();
        if(decorate) el.classList.remove('drag-over');
        const file=e.dataTransfer?.files?.[0];
        if(file) importStructureFile(file);
      }, true);
    });
  }

  window.addEventListener('error', function(e){
    const msg = niceError(e.error || e.message);
    if(msg && !/Script error\.?/i.test(msg)) notify(msg, 'error');
  });
  window.addEventListener('unhandledrejection', function(e){
    const msg = niceError(e.reason);
    if(msg) notify(msg, 'error');
  });

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ()=>{ patchDynamicText(); attachDropInterceptors(); });
  } else {
    patchDynamicText();
    attachDropInterceptors();
  }
})();
