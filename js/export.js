/* ═══════════════════════════════════════════════════════
   Export — MogadocLab
   ═══════════════════════════════════════════════════════ */

// EXPORT
// ═══════════════════════════════════════════════════════════
function exportXYZ(){
  if(!molecule)return notify('No structure loaded','error');
  download(formatXYZFromMol(molecule),(molecule.name||'molecule')+'.xyz','text/plain');
}
function exportJSON(){
  if(!molecule)return notify('No structure loaded','error');
  download(formatJSONFromMol(molecule),(molecule.name||'molecule')+'.json','application/json');
}
function download(content,filename,mime){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type:mime}));a.download=filename;a.click();}
function screenshot(){
  if(!molecule)return notify('No structure loaded','error');
  openPubShotModal();
}

// ═══════════════════════════════════════════════════════════
