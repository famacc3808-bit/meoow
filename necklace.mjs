import * as THREE from 'three';

// Coordinates follow the photographed pendant: left-facing head, raised right tail.
export function createNecklace() {
  const root = new THREE.Group();
  root.name = 'volumetric-necklace';
  const silver = new THREE.MeshStandardMaterial({color:0xe5ded0, metalness:1, roughness:.19});
  const crystal = new THREE.MeshPhysicalMaterial({color:0xb6c8cf, metalness:0, roughness:.035, transmission:.92, thickness:.24, ior:2.1, clearcoat:1, flatShading:true});
  const pave = new THREE.MeshPhysicalMaterial({color:0xffffff, metalness:.25, roughness:.09, clearcoat:1, flatShading:true});
  const dark = new THREE.MeshStandardMaterial({color:0x141519, metalness:.4, roughness:.17});
  const pendant = new THREE.Group();
  pendant.name = 'swan-pendant';
  pendant.position.set(0,-.63,0);
  root.add(pendant);
  function mesh(geometry, material, parent=pendant) {
    const object=new THREE.Mesh(geometry,material);
    object.castShadow=true; object.receiveShadow=true; parent.add(object); return object;
  }
  const points = coordinates => coordinates.map(([x,y,z=0])=>new THREE.Vector3(x,y,z));
  function curve(coordinates) {return new THREE.CatmullRomCurve3(points(coordinates));}
  function wire(path,radius,material=silver,parent=pendant) {
    return mesh(new THREE.TubeGeometry(path,100,radius,10,false),material,parent);
  }
  const outline=curve([[-.35,.17],[-.68,.01],[-.83,-.2],[-.7,-.4],[-.32,-.52],[.15,-.53],[.48,-.4],[.69,-.08],[.83,.39],[.57,.28],[.16,.1],[-.35,-.14],[-.61,-.29],[-.47,-.4]]);
  wire(outline,.075);
  const neck=curve([[-.7,-.24],[-.68,-.02],[-.42,.17],[-.19,.33],[-.18,.52],[-.36,.64],[-.58,.61],[-.65,.5]]);
  wire(neck,.067);
  const head=mesh(new THREE.SphereGeometry(1,32,20),silver);
  head.position.set(-.49,.575,.005);head.scale.set(.16,.088,.075);
  const beakShape=new THREE.Shape();beakShape.moveTo(-.6,.55);beakShape.lineTo(-.78,.43);beakShape.lineTo(-.64,.62);beakShape.closePath();
  const beak=mesh(new THREE.ExtrudeGeometry(beakShape,{depth:.055,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:3,steps:1}),silver);beak.position.z=-.025;
  const eye=mesh(new THREE.SphereGeometry(.018,16,12),dark);eye.position.set(-.535,.603,.075);
  // A real closed faceted solid, not a transparent image or a single planar face.
  const boundary=[[-.54,-.3],[-.22,-.12],[.56,.24],[.45,-.23],[.2,-.41],[-.19,-.43]];
  function gemstone(polygon) {
    const center=polygon.reduce((a,p)=>[a[0]+p[0]/polygon.length,a[1]+p[1]/polygon.length],[0,0]);
    const vertices=[];
    const ring=(scale,z)=>polygon.map(([x,y])=>[center[0]+(x-center[0])*scale,center[1]+(y-center[1])*scale,z]);
    const girdle=ring(1,.015), table=ring(.54,.17), bottom=[center[0],center[1],-.07];
    const triangle=(a,b,c)=>vertices.push(...a,...c,...b);
    for(let i=0;i<polygon.length;i++) {
      const j=(i+1)%polygon.length;
      triangle(girdle[i],girdle[j],table[i]);triangle(girdle[j],table[j],table[i]);
      triangle(table[i],table[j],[center[0],center[1],.17]);
      triangle(girdle[j],girdle[i],bottom);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
    return geometry;
  }
  const stone=mesh(gemstone(boundary),crystal);stone.name='faceted-wing-crystal';
  wire(curve([[-.61,-.31],[-.22,-.1],[.19,.1],[.67,.32]]),.035);
  wire(curve([[-.66,-.39],[-.19,-.55],[.26,-.56],[.56,-.38],[.73,.09]]),.028);
  function scatter(path,count,radius) {
    for(let i=0;i<count;i++) {
      const p=path.getPointAt((i+.5)/count);
      const setting=mesh(new THREE.CylinderGeometry(radius*1.13,radius*.9,.035,12),silver);
      setting.rotation.x=Math.PI/2;setting.position.copy(p);setting.position.z=.051;
      const gem=mesh(new THREE.OctahedronGeometry(radius,0),pave);gem.position.copy(p);gem.position.z=.084;gem.rotation.z=i*1.71;gem.scale.z=.65;
    }
  }
  scatter(outline,43,.045);scatter(neck,23,.039);
  for(const [x,y] of [[-.46,-.32],[.12,-.39],[.48,-.12],[.5,.16]]) {
    const prong=mesh(new THREE.SphereGeometry(.033,12,8),silver);prong.position.set(x,y,.1);
  }
  const linkGeometry=new THREE.TorusGeometry(.044,.012,8,16);
  function chain(coordinates,count) {
    const path=curve(coordinates);
    for(let i=0;i<count;i++) {
      const t=i/(count-1),position=path.getPointAt(t),tangent=path.getTangentAt(t);
      const link=mesh(linkGeometry,silver,root);link.position.copy(position);
      link.rotation.z=-Math.atan2(tangent.x,tangent.y);link.rotation.y=i%2?1.03:0;
      link.scale.set(.8,1.35,1);link.position.z+=.06;
    }
  }
  chain([[-.49,-.02,.02],[-.79,.65,.02],[-1.06,1.36,.02],[-1.21,1.95,.02]],48);
  chain([[.8,-.24,.02],[1.04,.49,.02],[1.25,1.26,.02],[1.47,1.95,.02]],52);
  root.rotation.x=-Math.PI/2;
  root.position.set(0,.13,-.15);
  root.userData.kind='procedural-3d-jewellery';
  return root;
}
