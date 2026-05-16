/* ═══════════════════════════════════════════════════════
   Renderer — MogadocLab
   ═══════════════════════════════════════════════════════ */

// RENDER  (full implementation below in PATCH RENDER block)
// ═══════════════════════════════════════════════════════════
let animFrame=null, lastTime=0;
function render() { _renderFull(); }

function animate(ts) {
  if(!autoRotate)return;
  const dt=Math.min((ts-lastTime)/1000,0.1);
  lastTime=ts;

  // Easing: smoothly ramp velocity toward target
  if(rotEasing){
    rotTargetVel=rotSpeedVal;
    rotEaseVel+=(rotTargetVel-rotEaseVel)*Math.min(1,dt*4);
  } else {
    rotEaseVel=rotSpeedVal;
  }
  const v=rotEaseVel*dt;

  switch(rotMode){
    case 'y':
      rotY+=v; break;
    case 'x':
      rotX+=v; break;
    case 'z':
      // Z-axis: combined rotX+rotY shift that mimics roll
      rotY+=v*0.7; rotX+=v*0.3; break;
    case 'rock':
      // Oscillate left-right (sine wave)
      rotRockPhase+=v*2.5;
      rotY=Math.sin(rotRockPhase)*0.9; break;
    case 'tumble':
      // All 3 axes at different rates — complex motion
      rotY+=v*1.0;
      rotX+=v*0.37;
      break;
    case 'tilt':
      // Rotate around a tilted axis defined by rotTiltAngle
      const c0=Math.cos(rotTiltAngle), s0=Math.sin(rotTiltAngle);
      rotY+=v*c0;
      rotX+=v*s0;
      break;
  }

  render();
  animFrame=requestAnimationFrame(animate);
}

// ═══════════════════════════════════════════════════════════
