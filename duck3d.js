import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const stage = document.querySelector('#stage');
const svg = stage.querySelector('svg');
const roles = document.querySelector('#roles');
const modes = document.querySelector('#modes');
const status = document.createElement('small');
status.setAttribute('role', 'status');
status.style.cssText = 'position:absolute;top:8px;left:8px;right:8px;z-index:2;pointer-events:none';
stage.style.position = 'relative';
stage.append(status);

async function start() {
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0, 0);
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  stage.append(renderer.domElement);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(35, 1, .01, 100);
  scene.add(new T.HemisphereLight(0xffffff, 0xa59583, 2));
  const light = new T.DirectionalLight(0xfff5e8, 2.5);
  light.position.set(-3, 6, 5);
  scene.add(light);
  const root = new T.Group();
  scene.add(root);
  const rotate = document.createElement('button');
  rotate.style.cssText = 'position:absolute;bottom:8px;right:8px;z-index:2;padding:8px;font-size:13px';
  rotate.hidden = true;
  stage.append(rotate);
  const local = document.createElement('button');
  local.textContent = '局部變形：開';
  local.style.cssText = 'position:absolute;bottom:8px;left:8px;z-index:2;padding:8px;font-size:13px';
  local.hidden = true;
  stage.append(local);
  let model, loading, failed = false, active = false, rotating = false, localEnabled = true;
  let yaw = 0, mode = 0, lastTime = 0, deformation = 0, dirty = false;
  let turtleWrapper;
  const duck = new T.Group(); root.add(duck);
  const sphere = new T.SphereGeometry(1,32,24);
  function ball(color,x,y,z,a,b,c) {
    const mesh=new T.Mesh(sphere,new T.MeshPhysicalMaterial({color,roughness:.32,clearcoat:.35}));
    mesh.position.set(x,y,z);mesh.scale.set(a,b,c);duck.add(mesh);return mesh;
  }
  ball(0xffc83f,0,.83,0,1.05,.73,.83);ball(0xffd65b,0,1.83,.14,.83,.79,.76);
  ball(0xf4b532,-.94,.86,.05,.25,.48,.45);ball(0xf4b532,.94,.86,.05,.25,.48,.45);
  ball(0xff9635,0,1.55,.83,.43,.17,.27);ball(0xff9635,-.44,.19,.36,.36,.15,.43);ball(0xff9635,.44,.19,.36,.36,.15,.43);
  ball(0xffcc45,0,.94,-.83,.36,.34,.45);
  const eyes=[];
  for(const x of [-.31,.31]) {eyes.push(ball(0x382b29,x,1.95,.79,.085,.13,.06));ball(0xffffff,x-.02,2,.84,.025,.03,.018);}
  for(const x of [-.51,.51])ball(0xf69b91,x,1.7,.71,.13,.075,.035);
  const isTurtle=()=>roles.children[1].classList.contains('active');
  const held = new Map(), surfaces = [];
  const target = new T.Vector3(1, 1, 1);
  const ray = new T.Raycaster(), pointer = new T.Vector2();
  const anchor = new T.Vector3(), normal = new T.Vector3(), drag = new T.Vector3();
  const plane = new T.Plane(), contactWorld = new T.Vector3();
  const names = ['捏捏', '擠壓', '撫摸', '拉扯', '搔癢', '戳戳'];
  function reset() {
    const ids = [...held.keys()];
    held.clear();
    for (const id of ids) if (stage.hasPointerCapture(id)) stage.releasePointerCapture(id);
    target.set(1, 1, 1); drag.set(0, 0, 0);
    rotating = false;
    rotate.textContent = '🔄 旋轉角色';
    rotate.classList.remove('active');
    rotate.setAttribute('aria-pressed', 'false');
  }
  function layout() {
    renderer.setSize(stage.clientWidth, stage.clientHeight, false);
    camera.aspect = stage.clientWidth / stage.clientHeight;
    // Fit a sphere enclosing the normalized model, including narrow phone screens.
    const halfFov = Math.min(T.MathUtils.degToRad(camera.fov / 2), Math.atan(Math.tan(T.MathUtils.degToRad(camera.fov / 2)) * camera.aspect));
    const distance = 1.65 / Math.sin(halfFov);
    camera.position.set(0, 1.45 + distance * .12, distance);
    camera.lookAt(0, 1.25, 0);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(layout).observe(stage); layout();
  function show() {
    active = roles.children[0].classList.contains('active') || (!!model && isTurtle());
    duck.visible = roles.children[0].classList.contains('active');
    if (turtleWrapper) turtleWrapper.visible = isTurtle();
    renderer.domElement.hidden = !active;
    rotate.hidden = !active; local.hidden = !active || !isTurtle();
    svg.querySelector('#pet').style.visibility = active ? 'hidden' : 'visible';
    svg.querySelector('ellipse').style.visibility = active ? 'hidden' : 'visible';
    svg.style.cssText = 'position:relative;z-index:1;pointer-events:none';
  }
  async function load() {
    if (model || loading || failed) return;
    status.textContent = '海龜 3D 載入中…';
    loading = new GLTFLoader().loadAsync('./assets/models/turtle.glb', e => {
      if (roles.children[1].classList.contains('active')) status.textContent = e.total ? `海龜 3D 載入中 ${Math.round(e.loaded / e.total * 100)}%` : `海龜 3D 已載入 ${(e.loaded / 1048576).toFixed(1)} MB`;
    });
    try {
      const gltf = await loading;
      model = gltf.scene;
      const box = new T.Box3().setFromObject(model);
      const size = box.getSize(new T.Vector3()), center = box.getCenter(new T.Vector3());
      if (!Number.isFinite(size.length()) || size.length() === 0) throw new Error('模型尺寸無效');
      const scale = 2.6 / Math.max(size.x, size.y, size.z);
      const wrapper = new T.Group(); turtleWrapper = wrapper;
      wrapper.add(model); wrapper.scale.setScalar(scale);
      model.position.sub(new T.Vector3(center.x, box.min.y, center.z));
      root.add(wrapper); root.updateMatrixWorld(true);
      model.traverse(mesh => {
        if (!mesh.isMesh) return;
        mesh.geometry = mesh.geometry.clone();
        const position = mesh.geometry.attributes.position;
        const base = new Float32Array(position.array);
        const world = new Float32Array(position.count * 3);
        const v = new T.Vector3();
        for (let i = 0; i < position.count; i++) {
          v.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
          world.set(v.toArray(), i * 3);
        }
        mesh.frustumCulled = false;
        surfaces.push({ mesh, position, base, world, inverse: mesh.matrixWorld.clone().invert() });
      });
      status.textContent = roles.children[1].classList.contains('active') ? '海龜 3D · 局部變形試作' : '';
    } catch (error) {
      failed = true;
      status.textContent = roles.children[1].classList.contains('active') ? '海龜 3D 載入失敗，使用 2D。重新整理可重試。' : '';
      console.warn('海龜模型載入失敗', error);
    }
    show();
  }
  roles.addEventListener('click', () => {
    reset(); window.squish2d.reset(); root.scale.setScalar(1); root.rotation.set(0,0,0); yaw = 0;
    status.textContent = '';
    if (roles.children[1].classList.contains('active')) {
      if (model) status.textContent = '海龜 3D · 局部變形試作';
      else if (failed) status.textContent = '海龜 3D 載入失敗，使用 2D。重新整理可重試。';
      else load();
    }
    show();
  });
  modes.addEventListener('click', () => {
    reset(); mode = [...modes.children].findIndex(b => b.classList.contains('active'));
  });
  rotate.onclick = () => {
    const next = !rotating; reset(); rotating = next;
    rotate.textContent = rotating ? '✓ 拖曳旋轉' : '🔄 旋轉角色';
    rotate.classList.toggle('active', rotating);
    rotate.setAttribute('aria-pressed', String(rotating));
  };
  local.onclick = () => {
    reset(); localEnabled = !localEnabled;
    local.textContent = `局部變形：${localEnabled ? '開' : '關'}`;
    local.setAttribute('aria-pressed', String(localEnabled));
  };
  local.setAttribute('aria-pressed', 'true');
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  function cast(e) {
    const b = stage.getBoundingClientRect();
    pointer.set((e.clientX - b.left) / b.width * 2 - 1, 1 - (e.clientY - b.top) / b.height * 2);
    ray.setFromCamera(pointer, camera);
  }
  stage.addEventListener('pointerdown', e => {
    if (!active) return;
    e.stopImmediatePropagation();
    if (e.target.closest('button') || e.button !== 0 || held.size >= 2) return;
    cast(e);
    root.updateMatrixWorld(true);
    const hit = ray.intersectObject(isTurtle() ? model : duck, true)[0];
    if (!hit) return;
    stage.setPointerCapture(e.pointerId);
    held.set(e.pointerId, { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY });
    if (held.size === 1 && !rotating) {
      contactWorld.copy(hit.point);
      // Deformation coordinates exclude the interactive root transform.
      anchor.copy(root.worldToLocal(hit.point.clone()));
      normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
      normal.applyAxisAngle(new T.Vector3(0, 1, 0), -yaw);
      plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new T.Vector3()), contactWorld);
      window.squish2d.react();
      document.querySelector('#msg').textContent = `${isTurtle() ? '海龜' : '鴨董'}：${names[mode]}～`;
      if (!localEnabled || !isTurtle()) target.set(...[[.8,1.13,1.1],[1.2,.7,1.2],[1.02,.98,1.02],[1.1,1.1,1],[1.04,.96,1.03],[1.08,.88,1.08]][mode]);
    }
  }, true);
  stage.addEventListener('pointermove', e => {
    if (!active) return;
    e.stopImmediatePropagation();
    const p = held.get(e.pointerId); if (!p) return;
    if (rotating) yaw += (e.clientX - p.x) * .012;
    p.x = e.clientX; p.y = e.clientY;
    if (rotating) return;
    if (held.size === 2) {
      const [a,b] = [...held.values()];
      const ratio = T.MathUtils.clamp(Math.hypot(a.x-b.x,a.y-b.y) / Math.max(20,Math.hypot(a.startX-b.startX,a.startY-b.startY)), .65, 1.35);
      target.set(ratio, 1+(1-ratio)*.5, ratio);
    } else if (mode === 3) {
      cast(e);
      const point = ray.ray.intersectPlane(plane, new T.Vector3());
      if (point) { drag.copy(point.sub(contactWorld)).applyAxisAngle(new T.Vector3(0,1,0), -yaw); drag.clampLength(0,.65); }
    }
  }, true);
  function release(e) {
    if (!active) return;
    e.stopImmediatePropagation();
    // End the gesture on either finger release to avoid discontinuous pinch anchors.
    if (held.has(e.pointerId)) {
      const wasRotating = rotating; reset(); rotating = wasRotating;
      rotate.textContent = rotating ? '✓ 拖曳旋轉' : '🔄 旋轉角色';
      rotate.classList.toggle('active', rotating);
      rotate.setAttribute('aria-pressed', String(rotating));
    }
  }
  for (const name of ['pointerup','pointercancel','lostpointercapture']) stage.addEventListener(name,release,true);
  const v = new T.Vector3(), desired = new T.Vector3(), delta = new T.Vector3();
  function deform(t, alpha) {
    const engaged = active && isTurtle() && held.size === 1 && !rotating && localEnabled;
    deformation += ((engaged ? 1 : 0) - deformation) * alpha;
    if (deformation < .001 && !engaged) deformation = 0;
    dirty = false;
    for (const s of surfaces) {
      let changed = false;
      for (let i = 0; i < s.position.count; i++) {
        const k = i*3;
        v.fromArray(s.world,k); delta.copy(v).sub(anchor);
        const q = Math.max(0,1-delta.length()/.85), weight=q*q*(3-2*q)*deformation;
        desired.copy(v);
        if (weight) {
          if (mode===0) desired.addScaledVector(delta,-.3*weight);
          if (mode===1) { desired.x+=delta.x*.3*weight;desired.y-=delta.y*.4*weight;desired.z+=delta.z*.3*weight; }
          if (mode===2) desired.x+=Math.sin(t/170)*.045*weight;
          if (mode===3) desired.addScaledVector(drag,weight);
          if (mode===4) desired.addScaledVector(normal,Math.sin(t/45)*.06*weight);
          if (mode===5) desired.addScaledVector(normal,-.2*weight);
        }
        desired.applyMatrix4(s.inverse);
        for (let c=0;c<3;c++) {
          const goal = deformation ? desired.getComponent(c) : s.base[k+c];
          const old = s.position.array[k+c];
          const next = Math.abs(goal-old)<.00001 ? goal : old+(goal-old)*alpha;
          if (old!==next) { s.position.array[k+c]=next;changed=true; }
        }
      }
      if (changed) { s.position.needsUpdate=true; dirty=true; }
    }
  }
  function frame(t) {
    requestAnimationFrame(frame);
    const dt=Math.min((t-lastTime)/1000,.05);lastTime=t;
    const alpha=1-Math.exp(-16*dt);
    // Restore deformation even while hidden; keep the cached model clean on next selection.
    if (surfaces.length && ((active && isTurtle() && held.size && !rotating) || deformation || dirty)) deform(t,alpha);
    if (!active) return;
    root.scale.lerp(target,alpha);root.rotation.y=yaw;
    duck.position.y=Math.sin(t/650)*.025;
    duck.rotation.z=held.size&&!rotating&&mode===4?Math.sin(t/40)*.055:0;
    for(const eye of eyes)eye.scale.y=held.size&&!rotating&&(mode===2||mode===4)?.025:.13;
    renderer.render(scene,camera);
  }
  reset();show();requestAnimationFrame(frame);
  window.addEventListener('pagehide',()=>{
    reset();
    scene.traverse(o=>{o.geometry?.dispose();for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m){for(const value of Object.values(m))if(value?.isTexture)value.dispose();m.dispose();}});
    renderer.dispose();
  }, {once:true});
}
start().catch(error=>{status.textContent='3D 無法啟動，使用 2D 角色。';console.warn('3D 初始化失敗',error);});
