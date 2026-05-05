import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// --- GAME CONFIGURATION ---
const SCENE_COLOR = 0x050505;
const GRID_COLOR = 0xff00ff;

// --- CORE ENGINE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(SCENE_COLOR);
scene.fog = new THREE.FogExp2(SCENE_COLOR, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// --- PHYSICS SETUP ---
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00ffff, 2, 100);
pointLight.position.set(0, 5, 5);
scene.add(pointLight);

// --- THE GRID (FLOOR) ---
const gridHelper = new THREE.GridHelper(200, 50, GRID_COLOR, 0x444444);
scene.add(gridHelper);

const groundBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// --- THE PLAYER ---
const playerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const playerMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x00ffff, 
  emissive: 0x00ffff, 
  emissiveIntensity: 2 
});
const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(playerMesh);

const playerBody = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Sphere(0.5),
  position: new CANNON.Vec3(0, 5, 0),
});
world.addBody(playerBody);

// --- INPUT HANDLING ---
const keys = { left: false, right: false };
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
});

// --- GAME STATE ---
let score = 0;
let speed = 0.2;
const speedMultiplier = 0.0005; // Difficulty increases over time

// --- ANIMATION LOOP ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // Update Game Logic
  speed += speedMultiplier;
  score += Math.floor(speed * 10);
  
  const scoreElement = document.getElementById('score');
  if (scoreElement) scoreElement.innerText = `SCORE: ${score.toString().padStart(6, '0')}`;

  // Update Physics
  world.fixedStep();

  // Apply Movement (Physics)
  if (keys.left) playerBody.velocity.x = -7;
  else if (keys.right) playerBody.velocity.x = 7;
  else playerBody.velocity.x *= 0.9;

  // Sync Mesh with Physics Body
  playerMesh.position.copy(playerBody.position);
  playerMesh.quaternion.copy(playerBody.quaternion);

  // Advanced Infinite Scroll (Reactive to Speed)
  gridHelper.position.z += speed;
  if (gridHelper.position.z > 4) gridHelper.position.z = 0;

  // Camera Shake Effect (Based on Speed)
  camera.position.y = 2 + Math.sin(Date.now() * 0.01) * (speed * 0.05);

  renderer.render(scene, camera);
}

animate();

// Handle Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log('Void-Runner Engine Initialized 🚀');
