import * as THREE from 'three';
import { createNecklace } from './necklace.mjs';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const host=document.getElementById('scene-wrap');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let renderer,scene,camera,lid,inspectionPivot,frame,start=0,from=0,to=0,current=0;
let insideGlow,wrapping,ribbonMaterials,ambientGeo,ambientMat,burstGeo,burstMat,burstVel=[],twinkles=[];
const ambientCount=65,burstCount=85,ambientInit=[];

function draw(){renderer.render(scene,camera);}

function pose(){
 const release=THREE.MathUtils.smoothstep(current,0,.48);
 lid.rotation.x=-THREE.MathUtils.smoothstep(current,.16,1)*1.87;
 if(wrapping){
  wrapping.visible=release<1;
  wrapping.position.set(-release*1.5,release*.5,release*.12);
  wrapping.rotation.z=release*.22;
  for(const material of ribbonMaterials)material.opacity=1-release;
 }
 const narrow=camera.aspect<1;
 const distance=narrow?1.24:1.05+current*.11;
 camera.position.set(1.5*(1-current*.45), (10.2-current*.8)*distance, (12.8-current*2.5)*distance);
 camera.lookAt(0,.58+current*1.32,0);
 if(inspectionPivot)inspectionPivot.position.y=current*.22;
 if(insideGlow)insideGlow.intensity=current*3.8;
}

function tick(time){
 const t=Math.min(1,(time-start)/1400);
 current=from+(to-from)*(1-Math.pow(1-t,3));
 pose();
 if(t<1)frame=requestAnimationFrame(tick);
}

function makeSparkleTexture(){
 const c=document.createElement('canvas');c.width=64;c.height=64;
 const ctx=c.getContext('2d');
 const g=ctx.createRadialGradient(32,32,0,32,32,30);
 g.addColorStop(0,'rgba(255,255,255,1)');
 g.addColorStop(.18,'rgba(255,238,195,.95)');
 g.addColorStop(.48,'rgba(255,195,120,.35)');
 g.addColorStop(1,'rgba(255,180,100,0)');
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(32,32,30,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=1.6;
 ctx.beginPath();ctx.moveTo(32,6);ctx.lineTo(32,58);ctx.moveTo(6,32);ctx.lineTo(58,32);ctx.stroke();
 return new THREE.CanvasTexture(c);
}

function inscription(text,width,height,colour,font){
 const canvas=document.createElement('canvas');
 canvas.width=width;canvas.height=height;
 const context=canvas.getContext('2d');
 context.fillStyle=colour;
 context.font=font;
 context.textAlign='center';
 context.textBaseline='middle';
 context.fillText(text,width/2,height/2);
 const texture=new THREE.CanvasTexture(canvas);
 texture.colorSpace=THREE.SRGBColorSpace;
 return texture;
}

function triggerBurst(){
 if(!burstGeo||reduced.matches)return;
 const bPos=burstGeo.attributes.position.array;
 for(let i=0;i<burstCount;i++){
  bPos[i*3]=(Math.random()-.5)*1.4;
  bPos[i*3+1]=.2+Math.random()*.25;
  bPos[i*3+2]=(Math.random()-.5)*1.4;
  const ang=Math.random()*Math.PI*2;
  const spd=.015+Math.random()*.035;
  burstVel[i]={vx:Math.cos(ang)*spd,vy:.035+Math.random()*.055,vz:Math.sin(ang)*spd,life:1,decay:.007+Math.random()*.011};
 }
 burstGeo.attributes.position.needsUpdate=true;
 burstMat.opacity=1;
}

window.giftScene={
 setTurn(degrees){
  if(!inspectionPivot)return;
  inspectionPivot.rotation.y=degrees*Math.PI/180;
  if(reduced.matches)draw();
 },
 setOpen(open){
  if(!renderer||!lid)return;
  cancelAnimationFrame(frame);
  from=current;to=open?1:0;
  if(open)triggerBurst();
  if(reduced.matches){
   current=to;pose();draw();
  }else{
   start=performance.now();
   frame=requestAnimationFrame(tick);
  }
 }
};

try{
 renderer=new THREE.WebGLRenderer({canvas:document.getElementById('scene'),alpha:true,antialias:true});renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(32,1,.1,100);camera.position.set(1.5,10.2,12.8);camera.lookAt(0,.85,0);
 scene.add(new THREE.HemisphereLight(0xfff8f0,0x605860,1.4));const key=new THREE.DirectionalLight(0xffffff,2.4);key.position.set(-6,8,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.top=7;key.shadow.camera.bottom=-7;key.shadow.normalBias=.025;scene.add(key);
 const fill=new THREE.DirectionalLight(0xfff5ea,1.1);fill.position.set(6,4,-4);scene.add(fill);
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
 const shadowContext=shadowCanvas.getContext('2d');
 const shadowGradient=shadowContext.createRadialGradient(64,64,14,64,64,64);
 shadowGradient.addColorStop(0,'rgba(0,0,0,.55)');
 shadowGradient.addColorStop(.55,'rgba(0,0,0,.26)');
 shadowGradient.addColorStop(1,'rgba(0,0,0,0)');
 shadowContext.fillStyle=shadowGradient;shadowContext.fillRect(0,0,128,128);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(8.8,7.6),new THREE.MeshBasicMaterial({
  map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false
 }));
 floor.rotation.x=-Math.PI/2;floor.position.set(0,-.51,.08);floor.renderOrder=-1;scene.add(floor);

 const grainCanvas=document.createElement('canvas');grainCanvas.width=512;grainCanvas.height=512;
 const grainContext=grainCanvas.getContext('2d');const grainPixels=grainContext.createImageData(512,512);
 for(let y=0;y<512;y++){
  for(let x=0;x<512;x++){
   const i=(y*512+x)*4;
   const d1=Math.sin((x+y)*.85)*.5+.5,d2=Math.sin((x-y)*.85)*.5+.5;
   const hatch=d1*d2;
   const n1=Math.sin(x*1.7+y*2.1)*Math.cos(x*2.3-y*1.4),n2=Math.sin(x*5.1-y*3.7);
   const noise=(n1+n2*.5)*14;
   const v=Math.min(255,Math.max(160,Math.round(210+hatch*38+noise)));
   grainPixels.data[i]=v;grainPixels.data[i+1]=v;grainPixels.data[i+2]=v;grainPixels.data[i+3]=255;
  }
 }
 grainContext.putImageData(grainPixels,0,0);
 const paperGrain=new THREE.CanvasTexture(grainCanvas);paperGrain.wrapS=paperGrain.wrapT=THREE.RepeatWrapping;paperGrain.repeat.set(12,12);paperGrain.anisotropy=renderer.capabilities.getMaxAnisotropy();

 const outer=new THREE.MeshStandardMaterial({color:0xf4f4f4,roughness:.72,metalness:.04,map:paperGrain,bumpMap:paperGrain,bumpScale:.045});
 const velvet=new THREE.MeshPhysicalMaterial({color:0x172740,roughness:.94,bumpMap:paperGrain,bumpScale:.009,sheen:1,sheenColor:0x677da2,sheenRoughness:.85});
 const piping=new THREE.MeshStandardMaterial({color:0x293d5b,roughness:.96});
 const trim=new THREE.MeshStandardMaterial({color:0xe6e6e6,metalness:.25,roughness:.38});
 const group=new THREE.Group();group.rotation.y=-.18;scene.add(group);

 insideGlow=new THREE.PointLight(0xffeed6,0,8,1.8);insideGlow.position.set(0,.35,0);group.add(insideGlow);

 function part(w,h,d,r,mat,x,y,z,parent=group){const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,4,r),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 part(5.15,.3,4.45,.13,outer,0,-.33,0);
 part(4.82,.19,4.12,.09,piping,0,-.075,0);
 part(4.68,.25,3.98,.115,velvet,0,-.08,0);
 for(const x of [-2.48,2.48])part(.25,.75,4.4,.08,outer,x,.02,0);
 for(const z of [-2.1,2.1])part(4.85,.75,.25,.08,outer,0,.02,z);
 for(const x of [-2.48,2.48])part(.255,.035,4.25,.014,trim,x,.4,0);
 for(const z of [-2.1,2.1])part(4.9,.035,.255,.014,trim,0,.4,z);

 lid=new THREE.Group();lid.position.set(0,.47,-2.14);group.add(lid);
 part(5.2,.37,4.48,.16,outer,0,.19,2.14,lid);part(4.76,.1,4.02,.12,velvet,0,-.025,2.14,lid);

 const labelCanvas=document.createElement('canvas');labelCanvas.width=1536;labelCanvas.height=320;
 const ctx=labelCanvas.getContext('2d');ctx.fillStyle='#141416';ctx.font='176px Arial';ctx.textBaseline='alphabetic';
 const word='PANDORA',spacing=12;const widths=[...word].map(char=>ctx.measureText(char).width);const total=widths.reduce((a,b)=>a+b,0)+spacing*(word.length-1);let pen=(1536-total)/2;
 for(let i=0;i<word.length;i++){ctx.fillText(word[i],pen,265);if(i===4){const center=pen+widths[i]/2;ctx.beginPath();ctx.moveTo(center-23,127);ctx.lineTo(center-34,81);ctx.lineTo(center-11,106);ctx.lineTo(center,67);ctx.lineTo(center+11,106);ctx.lineTo(center+34,81);ctx.lineTo(center+23,127);ctx.closePath();ctx.fill();}pen+=widths[i]+spacing;}
 const labelTex=new THREE.CanvasTexture(labelCanvas);labelTex.colorSpace=THREE.SRGBColorSpace;labelTex.anisotropy=renderer.capabilities.getMaxAnisotropy();
 const label=new THREE.Mesh(new THREE.PlaneGeometry(4.6,.96),new THREE.MeshBasicMaterial({map:labelTex,transparent:true,depthWrite:false,toneMapped:false}));
 label.rotation.x=-Math.PI/2;label.position.set(0,.381,3.68);lid.add(label);

 const dedication=new THREE.Mesh(new THREE.PlaneGeometry(3,.46),new THREE.MeshBasicMaterial({
  map:inscription('Для тебя · 18 декабря',1024,160,'#e8d2b0','67px Georgia'),
  transparent:true,depthWrite:false,toneMapped:false
 }));
 dedication.rotation.x=Math.PI/2;dedication.position.set(0,-.08,3.43);lid.add(dedication);

 wrapping=new THREE.Group();group.add(wrapping);
 const satin=new THREE.MeshPhysicalMaterial({
  color:0x802437,roughness:.39,sheen:.8,sheenColor:0xbb6574,
  side:THREE.DoubleSide,transparent:true,depthWrite:false
 });
 const card=new THREE.MeshStandardMaterial({color:0xf0ddbb,roughness:.88,transparent:true,depthWrite:false});
 const tagInk=new THREE.MeshBasicMaterial({
  map:inscription('Милане',512,256,'#562831','93px Georgia'),
  transparent:true,depthWrite:false,toneMapped:false
 });
 ribbonMaterials=[satin,card,tagInk];
 const wrapPart=(w,h,d,r,mat,x,y,z,parent=wrapping)=>{
  const mesh=part(w,h,d,r,mat,x,y,z,parent);mesh.castShadow=false;return mesh;
 };
 wrapPart(5.23,.05,.52,.022,satin,0,.87,-.83);
 wrapPart(5.16,.04,.52,.018,satin,0,-.48,-.83);
 for(const x of [-2.6,2.6])wrapPart(.058,1.35,.52,.025,satin,x,.2,-.83);
 wrapPart(.39,.19,.42,.085,satin,-1.22,.98,-.83);

 for(const side of [-1,1]){
  const point=(x,y,z)=>new THREE.Vector3(-1.22+side*x,y,-.83+z);
  const loop=new THREE.CubicBezierCurve3(point(.08,.95,0),point(1.3,1.86,0),point(1.48,.93,.12),point(.09,1.05,.08));
  const vertices=[],indices=[];
  for(let i=0;i<=24;i++){
   const t=i/24,p=loop.getPoint(t),half=.10+.11*Math.sin(t*Math.PI);
   vertices.push(p.x,p.y,p.z-half,p.x,p.y,p.z+half);
   if(i<24){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  wrapping.add(new THREE.Mesh(geometry,satin));
 }

 const giftTag=new THREE.Group();giftTag.position.set(-.83,.89,-.15);giftTag.rotation.y=-.27;wrapping.add(giftTag);
 wrapPart(1.11,.045,.55,.021,card,0,0,0,giftTag);
 const tagLabel=new THREE.Mesh(new THREE.PlaneGeometry(1.03,.51),tagInk);
 tagLabel.rotation.x=-Math.PI/2;tagLabel.position.y=.024;giftTag.add(tagLabel);
 const cordCurve=new THREE.QuadraticBezierCurve3(
  new THREE.Vector3(-1.22,1,-.83),new THREE.Vector3(-1.46,1.03,-.4),new THREE.Vector3(-1.28,.92,-.15)
 );
 wrapping.add(new THREE.Mesh(new THREE.TubeGeometry(cordCurve,16,.023,6,false),satin));

 const pmrem=new THREE.PMREMGenerator(renderer);const studio=new RoomEnvironment();const environment=pmrem.fromScene(studio,.04);scene.environment=environment.texture;scene.environmentIntensity=.65;renderer.toneMappingExposure=.85;studio.dispose();pmrem.dispose();

 const jewellery=createNecklace();inspectionPivot=new THREE.Group();inspectionPivot.add(jewellery);group.add(inspectionPivot);

 const sparkleTex=makeSparkleTexture();
 ambientGeo=new THREE.BufferGeometry();
 const ambientPos=new Float32Array(ambientCount*3);
 for(let i=0;i<ambientCount;i++){
  const x=(Math.random()-.5)*14,y=Math.random()*8-1,z=(Math.random()-.5)*12;
  ambientPos[i*3]=x;ambientPos[i*3+1]=y;ambientPos[i*3+2]=z;
  ambientInit.push({x,y,z,speed:.3+Math.random()*.7,phase:Math.random()*Math.PI*2});
 }
 ambientGeo.setAttribute('position',new THREE.BufferAttribute(ambientPos,3));
 ambientMat=new THREE.PointsMaterial({size:.32,map:sparkleTex,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false});
 scene.add(new THREE.Points(ambientGeo,ambientMat));

 burstGeo=new THREE.BufferGeometry();
 const burstPos=new Float32Array(burstCount*3);
 for(let i=0;i<burstCount;i++){burstPos[i*3]=0;burstPos[i*3+1]=-100;burstPos[i*3+2]=0;burstVel.push({vx:0,vy:0,vz:0,life:0,decay:.01});}
 burstGeo.setAttribute('position',new THREE.BufferAttribute(burstPos,3));
 burstMat=new THREE.PointsMaterial({size:.42,map:sparkleTex,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
 group.add(new THREE.Points(burstGeo,burstMat));

 const twinkleSpots=[[-.5,.58,.08],[.08,-.22,.14],[.55,.22,.09],[.72,-.06,.08]];
 for(let i=0;i<twinkleSpots.length;i++){
  const spriteMat=new THREE.SpriteMaterial({map:sparkleTex,transparent:true,opacity:0,blending:THREE.AdditiveBlending});
  const sprite=new THREE.Sprite(spriteMat);
  sprite.position.set(twinkleSpots[i][0],twinkleSpots[i][1]-.63,twinkleSpots[i][2]);
  sprite.scale.set(.001,.001,1);
  inspectionPivot.add(sprite);
  twinkles.push(sprite);
 }

 document.getElementById('open').disabled=false;document.getElementById('gift').disabled=false;document.getElementById('hint').textContent='Нажми на кнопку или на коробочку';draw();

 function loop(time){
  if(!reduced.matches){
   const pos=ambientGeo.attributes.position.array;
   for(let i=0;i<ambientCount;i++){
    const p=ambientInit[i];
    pos[i*3+1]=p.y+Math.sin(time*.001*p.speed+p.phase)*.35;
    pos[i*3]=p.x+Math.cos(time*.0007*p.speed+p.phase)*.2;
   }
   ambientGeo.attributes.position.needsUpdate=true;

   if(burstMat.opacity>.01){
    let active=false;
    const bPos=burstGeo.attributes.position.array;
    for(let i=0;i<burstCount;i++){
     const v=burstVel[i];
     if(v.life>0){
      active=true;
      bPos[i*3]+=v.vx;bPos[i*3+1]+=v.vy;bPos[i*3+2]+=v.vz;
      v.vy-=.0008;v.life-=v.decay;
      if(v.life<=0)bPos[i*3+1]=-100;
     }
    }
    burstGeo.attributes.position.needsUpdate=true;
    burstMat.opacity=Math.max(0,burstMat.opacity-.008);
    if(!active)burstMat.opacity=0;
   }

   for(let i=0;i<twinkles.length;i++){
    const s=twinkles[i];
    const val=Math.sin(time*.0035+i*1.6);
    const sc=Math.max(0,(.32+.18*val)*current);
    s.scale.set(sc,sc,1);
    s.material.opacity=Math.max(0,(.7+.3*val)*current);
   }

   draw();
  }
  requestAnimationFrame(loop);
 }
 requestAnimationFrame(loop);

 function resize(){
  const {width,height}=host.getBoundingClientRect();
  if(!width||!height)return;
  const pixelBudget=Math.sqrt(3_000_000/(width*height));
  const ratio=Math.min(Math.max(window.devicePixelRatio||1,1.5),2.5,pixelBudget);
  renderer.setDrawingBufferSize(width,height,ratio);
  camera.aspect=width/height;
  camera.updateProjectionMatrix();
  pose();
  draw();
 }
 new ResizeObserver(resize).observe(host);
 window.addEventListener('resize',resize);
 resize();
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();throwFallback();});
}catch(e){console.error('Не удалось создать 3D-сцену',e);throwFallback();}
function throwFallback(){host.classList.add('fallback');document.getElementById('hint').textContent='3D недоступно на этом устройстве. Можно открыть подарок без анимации.';document.getElementById('open').disabled=false;document.getElementById('gift').disabled=false;}
