/* ═══════════════════════════════════════════════════════
   Math3D — MogadocLab
   ═══════════════════════════════════════════════════════ */

// 3D MATH
// ═══════════════════════════════════════════════════════════
function mat3RotX(a){const c=Math.cos(a),s=Math.sin(a);return[[1,0,0],[0,c,-s],[0,s,c]];}
function mat3RotY(a){const c=Math.cos(a),s=Math.sin(a);return[[c,0,s],[0,1,0],[-s,0,c]];}
function mat3Mul(A,B){return A.map((row,i)=>B[0].map((_,j)=>row.reduce((sum,_,k)=>sum+A[i][k]*B[k][j],0)));}
function mat3Vec(M,v){return M.map(row=>row[0]*v[0]+row[1]*v[1]+row[2]*v[2]);}
function project(atom,cx,cy,scale){
  const p=atom._proj,fov=500,z=p[2]*scale;
  let d;
  if(window._pubshotOrthographic){
    d=1;
  } else {
    // Soft perspective: denominator never drops below `fov`, so atoms in
    // front of the camera plane cap smoothly at d=1 instead of exploding
    // or flipping sign. Back atoms still shrink monotonically. No jumpy
    // size artefacts during rotation, no clamping discontinuity.
    d = fov / Math.max(fov, fov + z + 400);
  }
  return{sx:cx+p[0]*scale*d+panX,sy:cy-p[1]*scale*d+panY,d,z};
}
function hexAlpha(hex,alpha){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return`rgba(${r},${g},${b},${alpha})`;}
function getLightParams(){
  switch(lightingMode){
    case'soft':    return{ambient:0.5,diffuse:0.5,specPow:4,specAmt:0.2};
    case'dramatic':return{ambient:0.1,diffuse:0.9,specPow:20,specAmt:0.7};
    case'flat':    return{ambient:0.9,diffuse:0.1,specPow:1,specAmt:0.0};
    default:       return{ambient:0.25,diffuse:0.75,specPow:8,specAmt:0.4};
  }
}
function shadedColor(hexColor,z,maxZ,d){
  const{ambient,diffuse,specPow,specAmt}=getLightParams();
  const r=parseInt(hexColor.slice(1,3),16)/255,g=parseInt(hexColor.slice(3,5),16)/255,b=parseInt(hexColor.slice(5,7),16)/255;
  const luma=0.2126*r+0.7152*g+0.0722*b;
  const nz=maxZ>0?(z+maxZ)/(2*maxZ):0.5;
  // Cap shading darkening for bright atoms so white H / pale He / Be don't
  // swing from white to dark gray across the depth axis.
  const minLight = luma>0.85 ? 0.85 : luma>0.6 ? 0.65 : 0;
  const light=Math.max(minLight, ambient+diffuse*nz);
  const spec=specAmt*Math.pow(Math.max(0,nz),specPow);
  return`rgba(${Math.round(Math.min(1,r*light+spec)*255)},${Math.round(Math.min(1,g*light+spec)*255)},${Math.round(Math.min(1,b*light+spec)*255)},${d})`;
}

// ═══════════════════════════════════════════════════════════
