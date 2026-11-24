const fs=require('node:fs');
for(const file of process.argv.slice(2)) {
  const bytes=fs.readFileSync(file);
  if(bytes.readUInt32LE(0)!==0x46546c67 || bytes.readUInt32LE(4)!==2 || bytes.readUInt32LE(8)!==bytes.length) throw Error('Invalid GLB');
  const jsonSize=bytes.readUInt32LE(12);
  const gltf=JSON.parse(bytes.subarray(20,20+jsonSize).toString());
  const binStart=28+jsonSize;
  let triangles=0;
  for(const mesh of gltf.meshes||[])for(const p of mesh.primitives) {
    if(p.mode!==undefined && p.mode!==4)throw Error('Non-triangle primitive');
    triangles+=gltf.accessors[p.indices??p.attributes.POSITION].count/3;
  }
  console.log(JSON.stringify({file,bytes:bytes.length,triangles,skins:gltf.skins?.length||0,animations:gltf.animations?.length||0,
    morphTargets:(gltf.meshes||[]).flatMap(m=>m.primitives.map(p=>p.targets?.length||0)),
    images:(gltf.images||[]).map(img=>{const v=gltf.bufferViews[img.bufferView],start=binStart+(v.byteOffset||0);return {name:img.name,mimeType:img.mimeType,bytes:v.byteLength,width:img.mimeType==='image/png'?bytes.readUInt32BE(start+16):undefined,height:img.mimeType==='image/png'?bytes.readUInt32BE(start+20):undefined};}),
    positionBounds:gltf.accessors.filter(a=>a.type==='VEC3'&&a.min).map(a=>({min:a.min,max:a.max})),extensions:gltf.extensionsUsed||[]},null,2));
}
