import * as THREE from 'three';

const lanes = [-3.1, 0, 3.1];
const groundY = 0.85;
const state = {
  running: false,
  paused: false,
  over: false,
  lane: 1,
  targetX: 0,
  score: 0,
  best: Number(localStorage.getItem('void-runner-best') || 0),
  coins: Number(localStorage.getItem('void-runner-coins') || 0),
  combo: 1,
  comboTimer: 0,
  shield: 0,
  speed: 17,
  spawnTimer: 0,
  coinTimer: 0,
  islandTimer: 0,
  elapsed: 0,
  jumpVelocity: 0,
  sliding: false,
  slideTimer: 0,
  landedTimer: 0,
};

const ui = {
  score: document.querySelector('#score'),
  best: document.querySelector('#best'),
  coins: document.querySelector('#coins'),
  combo: document.querySelector('#combo'),
  shield: document.querySelector('#shield'),
  center: document.querySelector('#center-panel'),
  eyebrow: document.querySelector('#eyebrow'),
  title: document.querySelector('#message-title'),
  copy: document.querySelector('#message-copy'),
  start: document.querySelector('#startBtn'),
  pause: document.querySelector('#pauseBtn'),
  restart: document.querySelector('#restartBtn'),
  left: document.querySelector('#leftBtn'),
  right: document.querySelector('#rightBtn'),
  jump: document.querySelector('#jumpBtn'),
  slide: document.querySelector('#slideBtn'),
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050714);
scene.fog = new THREE.Fog(0x050714, 22, 110);

const camera = new THREE.PerspectiveCamera(64, window.innerWidth / window.innerHeight, 0.1, 220);
camera.position.set(0, 6.3, 10.6);
camera.lookAt(0, 1.9, -18);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);

const clock = new THREE.Clock();
const obstacles = [];
const pickups = [];
const particles = [];
const islands = [];

const materials = {
  bridge: new THREE.MeshStandardMaterial({ color: 0x6f8cff, roughness: 0.42, metalness: 0.1 }),
  bridgeEdge: new THREE.MeshStandardMaterial({ color: 0xdbeafe, emissive: 0x365cff, emissiveIntensity: 0.9 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xd8a376, roughness: 0.55 }),
  suit: new THREE.MeshStandardMaterial({ color: 0x161b2e, roughness: 0.42, metalness: 0.18 }),
  armor: new THREE.MeshStandardMaterial({ color: 0x8fd3ff, emissive: 0x2563eb, emissiveIntensity: 0.8 }),
  boot: new THREE.MeshStandardMaterial({ color: 0x070a13, roughness: 0.35, metalness: 0.22 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x201018, roughness: 0.58 }),
  danger: new THREE.MeshStandardMaterial({ color: 0xff4266, emissive: 0xc9153a, emissiveIntensity: 1.5 }),
  amber: new THREE.MeshStandardMaterial({ color: 0xffcf5a, emissive: 0xf59e0b, emissiveIntensity: 1.6, metalness: 0.45 }),
  shield: new THREE.MeshStandardMaterial({ color: 0x62f59a, emissive: 0x10b981, emissiveIntensity: 1.7 }),
  rock: new THREE.MeshStandardMaterial({ color: 0x232744, roughness: 0.82 }),
  moon: new THREE.MeshStandardMaterial({ color: 0xbfd8ff, emissive: 0x5f86ff, emissiveIntensity: 1.7, roughness: 0.72 }),
};

scene.add(new THREE.HemisphereLight(0xa9c9ff, 0x101222, 2.1));
const moonLight = new THREE.DirectionalLight(0xbdd7ff, 3.2);
moonLight.position.set(-7, 15, -18);
moonLight.castShadow = true;
scene.add(moonLight);

const amberLight = new THREE.PointLight(0xffcf5a, 7, 32);
amberLight.position.set(4, 3, -10);
scene.add(amberLight);

function createMoon() {
  const group = new THREE.Group();
  const moon = new THREE.Mesh(new THREE.SphereGeometry(8.5, 64, 64), materials.moon);
  moon.position.set(0, 18, -95);
  group.add(moon);

  for (let i = 0; i < 18; i += 1) {
    const crater = new THREE.Mesh(
      new THREE.CircleGeometry(0.25 + Math.random() * 0.9, 24),
      new THREE.MeshBasicMaterial({ color: 0x6e8ed9, transparent: true, opacity: 0.32 }),
    );
    crater.position.set((Math.random() - 0.5) * 9, 18 + (Math.random() - 0.5) * 9, -86.4);
    crater.rotation.x = 0;
    group.add(crater);
  }
  scene.add(group);
  return group;
}

function createStars() {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  for (let i = 0; i < 700; i += 1) {
    vertices.push((Math.random() - 0.5) * 180, Math.random() * 70 + 5, -Math.random() * 150 - 20);
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const stars = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0xdbeafe, size: 0.09, transparent: true, opacity: 0.86 }),
  );
  scene.add(stars);
  return stars;
}

const moon = createMoon();
const stars = createStars();

const bridge = new THREE.Group();
scene.add(bridge);
for (let i = 0; i < 22; i += 1) {
  const slab = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.34, 7.2), materials.bridge);
  slab.position.set(0, 0, -i * 7.2);
  slab.receiveShadow = true;
  bridge.add(slab);

  const leftEdge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 7.2), materials.bridgeEdge);
  leftEdge.position.set(-4.95, 0.27, -i * 7.2);
  bridge.add(leftEdge);

  const rightEdge = leftEdge.clone();
  rightEdge.position.x = 4.95;
  bridge.add(rightEdge);
}

function spawnIsland(z = -80) {
  const group = new THREE.Group();
  const side = Math.random() > 0.5 ? 1 : -1;
  group.position.set(side * (10 + Math.random() * 12), -3 - Math.random() * 2, z);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.8, 0.6, 7), materials.rock);
  top.castShadow = true;
  group.add(top);
  const spike = new THREE.Mesh(new THREE.ConeGeometry(3.2, 7 + Math.random() * 5, 7), materials.rock);
  spike.position.y = -3.8;
  spike.rotation.y = Math.random();
  group.add(spike);
  scene.add(group);
  islands.push({ mesh: group });
}

for (let i = 0; i < 8; i += 1) spawnIsland(-20 - i * 18);

function limb(name, geometry, material, position) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.position.set(...position);
  return mesh;
}

function createRunner() {
  const group = new THREE.Group();
  const torso = limb('torso', new THREE.CapsuleGeometry(0.42, 0.86, 8, 16), materials.suit, [0, 1.18, 0]);
  torso.rotation.x = -0.1;
  group.add(torso);

  const chest = limb('chest', new THREE.BoxGeometry(0.72, 0.22, 0.18), materials.armor, [0, 1.34, 0.33]);
  group.add(chest);

  const head = limb('head', new THREE.SphereGeometry(0.28, 24, 24), materials.skin, [0, 1.9, 0]);
  group.add(head);

  const hair = limb('hair', new THREE.SphereGeometry(0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), materials.hair, [0, 2.02, -0.02]);
  group.add(hair);

  const backpack = limb('backpack', new THREE.BoxGeometry(0.44, 0.62, 0.22), materials.boot, [0, 1.22, -0.36]);
  group.add(backpack);

  const armGeo = new THREE.CapsuleGeometry(0.08, 0.62, 6, 12);
  const legGeo = new THREE.CapsuleGeometry(0.1, 0.74, 6, 12);
  const leftArm = limb('leftArm', armGeo, materials.skin, [-0.48, 1.22, 0.08]);
  const rightArm = limb('rightArm', armGeo, materials.skin, [0.48, 1.22, 0.08]);
  const leftLeg = limb('leftLeg', legGeo, materials.boot, [-0.24, 0.42, 0.03]);
  const rightLeg = limb('rightLeg', legGeo, materials.boot, [0.24, 0.42, 0.03]);
  group.add(leftArm, rightArm, leftLeg, rightLeg);
  group.userData = { leftArm, rightArm, leftLeg, rightLeg, torso };
  group.position.set(0, groundY, 1.2);
  scene.add(group);
  return group;
}

const runner = createRunner();

function formatScore(value) {
  return Math.floor(value).toString().padStart(6, '0');
}

function updateUi() {
  ui.score.textContent = formatScore(state.score);
  ui.best.textContent = formatScore(state.best);
  ui.coins.textContent = String(state.coins).padStart(3, '0');
  ui.combo.textContent = `x${state.combo}`;
  ui.shield.textContent = String(state.shield);
}

function setMessage(eyebrow, title, copy, button = 'Start Run') {
  ui.eyebrow.textContent = eyebrow;
  ui.title.textContent = title;
  ui.copy.textContent = copy;
  ui.start.textContent = button;
  ui.center.classList.remove('hidden');
}

function hideMessage() {
  ui.center.classList.add('hidden');
}

function clearRunObjects() {
  [...obstacles, ...pickups, ...particles].forEach((item) => scene.remove(item.mesh));
  obstacles.length = 0;
  pickups.length = 0;
  particles.length = 0;
}

function startRun() {
  clearRunObjects();
  Object.assign(state, {
    running: true,
    paused: false,
    over: false,
    lane: 1,
    targetX: 0,
    score: 0,
    combo: 1,
    comboTimer: 0,
    shield: 0,
    speed: 17,
    spawnTimer: 0.3,
    coinTimer: 0.6,
    islandTimer: 1,
    elapsed: 0,
    jumpVelocity: 0,
    sliding: false,
    slideTimer: 0,
    landedTimer: 0,
  });
  runner.position.set(0, groundY, 1.2);
  runner.rotation.set(0, 0, 0);
  ui.pause.textContent = 'Pause';
  hideMessage();
  updateUi();
}

function gameOver() {
  state.running = false;
  state.over = true;
  state.best = Math.max(state.best, Math.floor(state.score));
  localStorage.setItem('void-runner-best', String(state.best));
  localStorage.setItem('void-runner-coins', String(state.coins));
  updateUi();
  setMessage('Run ended', 'The bridge claimed you', `Score ${formatScore(state.score)} with a x${state.combo} combo. Restart and chase the moon bridge again.`, 'Run Again');
}

function togglePause() {
  if (!state.running || state.over) return;
  state.paused = !state.paused;
  ui.pause.textContent = state.paused ? 'Resume' : 'Pause';
  if (state.paused) setMessage('Paused', 'Moon bridge frozen', 'Resume when you are ready to continue the parkour line.', 'Resume');
  else hideMessage();
}

function move(direction) {
  if (!state.running || state.paused) return;
  state.lane = THREE.MathUtils.clamp(state.lane + direction, 0, lanes.length - 1);
  state.targetX = lanes[state.lane];
}

function jump() {
  if (!state.running || state.paused || runner.position.y > groundY + 0.05 || state.sliding) return;
  state.jumpVelocity = 11.5;
  state.landedTimer = 0;
}

function slide() {
  if (!state.running || state.paused || runner.position.y > groundY + 0.05) return;
  state.sliding = true;
  state.slideTimer = 0.58;
}

function addCombo(points) {
  state.combo = Math.min(9, state.combo + 1);
  state.comboTimer = 3;
  state.score += points * state.combo;
}

function spawnObstacle() {
  const type = ['hurdle', 'gate', 'pillar', 'gap'][Math.floor(Math.random() * 4)];
  const lane = Math.floor(Math.random() * lanes.length);
  const group = new THREE.Group();
  let radius = 0.9;
  let rule = 'dodge';

  if (type === 'hurdle') {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.58, 0.7), materials.danger);
    bar.position.y = 0.3;
    group.add(bar);
    rule = 'jump';
  }

  if (type === 'gate') {
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 0.55), materials.danger);
    top.position.y = 1.55;
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.7, 0.55), materials.danger);
    left.position.set(-0.95, 0.85, 0);
    const right = left.clone();
    right.position.x = 0.95;
    group.add(top, left, right);
    radius = 1.08;
    rule = 'slide';
  }

  if (type === 'pillar') {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 2.3, 7), materials.danger);
    pillar.position.y = 1.15;
    group.add(pillar);
    rule = 'dodge';
  }

  if (type === 'gap') {
    const marker = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 2.2), materials.danger);
    marker.position.y = 0.08;
    group.add(marker);
    radius = 1.18;
    rule = 'jump';
  }

  group.position.set(lanes[lane], 0.08, -78);
  group.traverse((child) => {
    if (child.isMesh) child.castShadow = true;
  });
  scene.add(group);
  obstacles.push({ mesh: group, type, rule, radius, scored: false });
}

function spawnPickup(type = Math.random() > 0.84 ? 'shield' : 'coin') {
  const lane = Math.floor(Math.random() * lanes.length);
  const mesh = new THREE.Mesh(
    type === 'shield' ? new THREE.OctahedronGeometry(0.45, 0) : new THREE.TorusGeometry(0.42, 0.1, 12, 30),
    type === 'shield' ? materials.shield : materials.amber,
  );
  mesh.position.set(lanes[lane], type === 'shield' ? 1.55 : 1.25 + Math.random() * 1.25, -82);
  scene.add(mesh);
  pickups.push({ mesh, type, radius: 0.8 });
}

function burst(position, color) {
  for (let i = 0; i < 16; i += 1) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true }),
    );
    mesh.position.copy(position);
    scene.add(mesh);
    particles.push({
      mesh,
      life: 0.6,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 4.5, (Math.random() - 0.5) * 8),
    });
  }
}

function runnerClearance(rule) {
  if (rule === 'jump') return runner.position.y > groundY + 1.05;
  if (rule === 'slide') return state.sliding;
  return false;
}

function updateRunner(delta) {
  runner.position.x += (state.targetX - runner.position.x) * Math.min(1, delta * 13);
  state.jumpVelocity -= 28 * delta;
  runner.position.y += state.jumpVelocity * delta;
  if (runner.position.y <= groundY) {
    if (state.jumpVelocity < -5) state.landedTimer = 0.18;
    runner.position.y = groundY;
    state.jumpVelocity = 0;
  }

  if (state.slideTimer > 0) state.slideTimer -= delta;
  else state.sliding = false;
  if (state.landedTimer > 0) state.landedTimer -= delta;

  const runCycle = state.elapsed * 12;
  const { leftArm, rightArm, leftLeg, rightLeg, torso } = runner.userData;
  const stride = Math.sin(runCycle) * (state.sliding ? 0.25 : 0.9);
  leftArm.rotation.x = stride;
  rightArm.rotation.x = -stride;
  leftLeg.rotation.x = -stride;
  rightLeg.rotation.x = stride;
  runner.rotation.z += ((state.targetX - runner.position.x) * -0.035 - runner.rotation.z) * delta * 8;
  torso.scale.y += ((state.sliding ? 0.58 : 1) - torso.scale.y) * delta * 14;
  torso.rotation.x = state.sliding ? Math.PI / 2.8 : -0.12;
}

function updateRun(delta) {
  state.elapsed += delta;
  state.speed = Math.min(47, state.speed + delta * 0.52);
  state.score += delta * state.speed * (7 + state.combo);
  state.spawnTimer -= delta;
  state.coinTimer -= delta;
  state.islandTimer -= delta;
  state.comboTimer -= delta;
  if (state.comboTimer <= 0) state.combo = 1;

  if (state.spawnTimer <= 0) {
    spawnObstacle();
    state.spawnTimer = Math.max(0.62, 1.16 - state.elapsed * 0.011);
  }
  if (state.coinTimer <= 0) {
    spawnPickup();
    state.coinTimer = 0.55 + Math.random() * 0.65;
  }
  if (state.islandTimer <= 0) {
    spawnIsland(-95);
    state.islandTimer = 1.7;
  }

  updateRunner(delta);
  bridge.children.forEach((mesh) => {
    mesh.position.z += state.speed * delta;
    if (mesh.position.z > 9) mesh.position.z -= 158.4;
  });
  moon.rotation.y += delta * 0.025;
  stars.rotation.y += delta * 0.003;
}

function updateMovingCollection(collection, delta, onNear, onMiss) {
  for (let i = collection.length - 1; i >= 0; i -= 1) {
    const item = collection[i];
    item.mesh.position.z += state.speed * delta;
    item.mesh.rotation.y += delta * 2;
    const distance = item.mesh.position.distanceTo(runner.position);
    if (distance < item.radius) {
      onNear(item);
      scene.remove(item.mesh);
      collection.splice(i, 1);
      continue;
    }
    if (item.mesh.position.z > 8) {
      onMiss?.(item);
      scene.remove(item.mesh);
      collection.splice(i, 1);
    }
  }
}

function updateWorldObjects(delta) {
  updateMovingCollection(obstacles, delta, (item) => {
    if (runnerClearance(item.rule)) {
      addCombo(160);
      burst(item.mesh.position, 0xffcf5a);
      return;
    }
    if (state.shield > 0) {
      state.shield -= 1;
      state.combo = 1;
      burst(item.mesh.position, 0x62f59a);
      return;
    }
    burst(item.mesh.position, 0xff4266);
    gameOver();
  }, (item) => {
    if (!item.scored) addCombo(90);
  });

  updateMovingCollection(pickups, delta, (item) => {
    if (item.type === 'shield') {
      state.shield = Math.min(3, state.shield + 1);
      burst(item.mesh.position, 0x62f59a);
    } else {
      state.coins += 1;
      addCombo(120);
      burst(item.mesh.position, 0xffcf5a);
    }
  });

  for (let i = islands.length - 1; i >= 0; i -= 1) {
    const island = islands[i];
    island.mesh.position.z += state.speed * delta * 0.62;
    island.mesh.rotation.y += delta * 0.12;
    if (island.mesh.position.z > 18) {
      scene.remove(island.mesh);
      islands.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const particle = particles[i];
    particle.life -= delta;
    particle.mesh.position.addScaledVector(particle.velocity, delta);
    particle.mesh.material.opacity = Math.max(0, particle.life);
    if (particle.life <= 0) {
      scene.remove(particle.mesh);
      particles.splice(i, 1);
    }
  }
}

function tick() {
  requestAnimationFrame(tick);
  const delta = Math.min(clock.getDelta(), 0.035);
  if (state.running && !state.paused) {
    updateRun(delta);
    updateWorldObjects(delta);
    camera.position.x += (runner.position.x * 0.26 - camera.position.x) * delta * 4;
    camera.position.y += (6.25 + Math.sin(state.elapsed * 10) * 0.12 - camera.position.y) * delta * 3;
    camera.lookAt(runner.position.x * 0.18, 2.1, -17);
    updateUi();
  } else {
    runner.rotation.y += delta * 0.22;
    moon.rotation.y += delta * 0.01;
  }
  renderer.render(scene, camera);
}

window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'a', 'A'].includes(event.key)) move(-1);
  if (['ArrowRight', 'd', 'D'].includes(event.key)) move(1);
  if (['ArrowUp', 'w', 'W'].includes(event.key)) jump();
  if (['ArrowDown', 's', 'S'].includes(event.key)) slide();
  if (event.key === ' ') togglePause();
  if (['r', 'R'].includes(event.key)) startRun();
});

ui.left.addEventListener('click', () => move(-1));
ui.right.addEventListener('click', () => move(1));
ui.jump.addEventListener('click', jump);
ui.slide.addEventListener('click', slide);
ui.start.addEventListener('click', () => (state.paused ? togglePause() : startRun()));
ui.pause.addEventListener('click', togglePause);
ui.restart.addEventListener('click', startRun);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

updateUi();
tick();
