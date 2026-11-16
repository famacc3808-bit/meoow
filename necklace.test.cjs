const test=require('node:test');
const assert=require('node:assert/strict');
test('pendant is solid geometry with real chain links and no image planes',async()=>{
  const {createNecklace}=await import('./necklace.mjs');
  const necklace=createNecklace();
  let meshes=0,links=0;
  const box=new (await import('three')).Box3().setFromObject(necklace);
  assert.ok(box.max.y-box.min.y>.2,'visible physical thickness');
  necklace.traverse(object=>{
    if(!object.isMesh)return;
    meshes++;
    assert.notEqual(object.geometry.type,'PlaneGeometry');
    assert.equal(object.material.map,null,'no photographic surface');
    const positions=object.geometry.attributes.position.array;
    assert.ok([...positions].every(Number.isFinite));
    if(object.geometry.type==='TorusGeometry')links++;
  });
  assert.equal(links,100);assert.ok(meshes>200);
  const crystal=necklace.getObjectByName('faceted-wing-crystal');
  crystal.geometry.computeBoundingBox();
  assert.ok(crystal.geometry.boundingBox.max.z-crystal.geometry.boundingBox.min.z>.2);
  const normals=crystal.geometry.attributes.normal;
  assert.ok(normals.getZ(6)>0,'table facets must face the viewer, not the underside');
  assert.equal(necklace.userData.kind,'procedural-3d-jewellery');
});
