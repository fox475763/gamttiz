import * as THREE from 'three';
import { GLTFLoader } from './assets/vendor/three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from './assets/vendor/three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from './assets/vendor/three/addons/RoomEnvironment.js';

const tray = document.querySelector('#tray');
const status = document.querySelector('#holder-viewer-status');
const reset = document.querySelector('#holder-viewer-reset');
const fallback = document.querySelector('#combo-static');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, .005, 2);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .95;
renderer.setClearColor(0xffffff, 0);
renderer.domElement.className = 'combo-3d-canvas';
renderer.domElement.setAttribute('aria-hidden', 'true');
tray.append(renderer.domElement);

const environmentGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = environmentGenerator.fromScene(new RoomEnvironment(), .05).texture;
scene.environmentIntensity = .55;
environmentGenerator.dispose();

scene.add(new THREE.HemisphereLight(0xfffaf2, 0x8e7870, 1.2));
const key = new THREE.DirectionalLight(0xfff5e8, 1.0);
key.position.set(-.09, .17, .15);
scene.add(key);
const fill = new THREE.DirectionalLight(0xe4eeff, .5);
fill.position.set(.12, .08, .05);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffe2c9, .4);
rim.position.set(.08, .13, -.12);
scene.add(rim);

const shadowCanvas = document.createElement('canvas');
shadowCanvas.width = shadowCanvas.height = 256;
const shadowContext = shadowCanvas.getContext('2d');
const shadowFade = shadowContext.createRadialGradient(128, 128, 12, 128, 128, 128);
shadowFade.addColorStop(0, 'rgba(69,35,28,.36)');
shadowFade.addColorStop(.5, 'rgba(69,35,28,.18)');
shadowFade.addColorStop(1, 'rgba(69,35,28,0)');
shadowContext.fillStyle = shadowFade;
shadowContext.fillRect(0, 0, 256, 256);
const shadow = new THREE.Mesh(
  new THREE.PlaneGeometry(.14, .105),
  new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false, toneMapped: false })
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = -.0018;
scene.add(shadow);

const grainCanvas = document.createElement('canvas');
grainCanvas.width = grainCanvas.height = 256;
const grainContext = grainCanvas.getContext('2d');
const grainPixels = grainContext.createImageData(256, 256);
let grainSeed = 20261030;
for (let pixel = 0; pixel < grainPixels.data.length; pixel += 4) {
  grainSeed = (1664525 * grainSeed + 1013904223) >>> 0;
  const shade = 112 + (grainSeed % 34);
  grainPixels.data[pixel] = grainPixels.data[pixel + 1] = grainPixels.data[pixel + 2] = shade;
  grainPixels.data[pixel + 3] = 255;
}
grainContext.putImageData(grainPixels, 0, 0);
const plasticGrain = new THREE.CanvasTexture(grainCanvas);
plasticGrain.wrapS = plasticGrain.wrapT = THREE.RepeatWrapping;
plasticGrain.repeat.set(8, 8);

const holder = new THREE.Group();
scene.add(holder);
const friends = new THREE.Group();
holder.add(friends);
const textureLoader = new THREE.TextureLoader();
const textureCache = new Map();
let ready = false;
let currentPicks = [];
let loadSerial = 0;

function textureFor(index) {
  if (!textureCache.has(index)) {
    textureCache.set(index, new Promise((resolve, reject) => {
      textureLoader.load(`assets/illustrations-3d/friend-${String(index + 1).padStart(2, '0')}.png`, texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        resolve(texture);
      }, undefined, reject);
    }));
  }
  return textureCache.get(index);
}

function resize() {
  const width = tray.clientWidth;
  const height = tray.clientHeight;
  if (!width || !height) return;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
new ResizeObserver(resize).observe(tray);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .08;
controls.enablePan = false;
controls.enableZoom = false;
controls.minPolarAngle = .42;
controls.maxPolarAngle = 2.05;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
controls.autoRotate = !reducedMotion.matches;
controls.autoRotateSpeed = .45;
reducedMotion.addEventListener('change', event => { controls.autoRotate = !event.matches; });
controls.target.set(0, .044, 0);
camera.position.set(0, .072, .205);
controls.update();
controls.saveState();
renderer.domElement.addEventListener('pointerdown', () => { controls.autoRotate = false; });
reset.addEventListener('click', () => { controls.reset(); controls.autoRotate = !reducedMotion.matches; });

function layout(count, index) {
  // The fry cutouts sit inside the holder cavity, behind the real front wall.
  const spread = count === 1 ? 0 : count === 2 ? .025 : count === 3 ? .018 : count === 4 ? .014 : .011;
  return { x: (index - (count - 1) / 2) * spread, z: .015 };
}

async function setFriends(indices) {
  currentPicks = [...indices];
  if (!ready) return;
  const serial = ++loadSerial;
  const textures = await Promise.all(indices.map(textureFor));
  if (serial !== loadSerial) return;
  for (const child of [...friends.children]) {
    friends.remove(child);
    child.geometry?.dispose();
    child.material?.dispose();
  }
  textures.forEach((texture, i) => {
    const image = texture.image;
    const aspect = (image.naturalWidth || image.width) / (image.naturalHeight || image.height);
    const height = indices.length <= 2 ? .054 : .047;
    const width = height * aspect;
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: .08, side: THREE.DoubleSide, depthWrite: true });
    const face = new THREE.Mesh(geometry, material);
    const place = layout(indices.length, i);
    face.position.set(place.x, .031 + height / 2, place.z);
    face.rotation.y = (i - (indices.length - 1) / 2) * -.04;
    friends.add(face);
  });
}

function savePng(indices) {
  const originalRatio = renderer.getPixelRatio();
  const originalAspect = camera.aspect;
  renderer.setPixelRatio(1);
  renderer.setSize(1200, 1200, false);
  camera.aspect = 1;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = 1200;
  exportCanvas.height = 1450;
  const ctx = exportCanvas.getContext('2d');
  const background = ctx.createLinearGradient(0, 0, 1200, 1450);
  background.addColorStop(0, '#fffaf0');
  background.addColorStop(1, '#ffe9bf');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1200, 1450);
  ctx.fillStyle = '#bd2d27';
  ctx.font = '700 39px GamttizEN,sans-serif';
  ctx.fillText('GAMTTIZ / MY HOLDER', 72, 100);
  ctx.font = '600 24px GamttizEN,sans-serif';
  ctx.fillText(indices.length + ' / 5 FRIENDS', 900, 100);
  ctx.fillStyle = '#f8e9ca';
  ctx.beginPath();
  ctx.roundRect(50, 145, 1100, 1120, 34);
  ctx.fill();
  ctx.drawImage(renderer.domElement, 70, 180, 1060, 1060);
  camera.aspect = originalAspect;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(originalRatio);
  resize();
  ctx.fillStyle = '#8d3928';
  ctx.font = '700 23px "Wanted Sans Variable",sans-serif';
  ctx.fillText('나의 감띠 친구들', 72, 1322);
  ctx.font = '500 22px "Wanted Sans Variable",sans-serif';
  ctx.fillText(indices.map(index => products[index].name).join('  ·  '), 72, 1372, 1050);
  ctx.fillStyle = '#b62924';
  ctx.font = '700 19px GamttizEN,sans-serif';
  ctx.fillText('FRENCH FRY LOVERS', 72, 1420);
  const link = document.createElement('a');
  const image = exportCanvas.toDataURL('image/png');
  const binary = atob(image.slice(image.indexOf(',') + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
  link.href = url;
  link.download = 'gamttiz-my-holder.png';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return image;
}

window.gamttiz3d = { get ready() { return ready; }, setFriends, savePng };
document.addEventListener('gamttiz-picks-changed', event => setFriends(event.detail));
const loader = new GLTFLoader();
loader.load('assets/holder-fbx.glb', gltf => {
  gltf.scene.traverse(object => {
    if (!object.isMesh) return;
    const material = object.material;
    if (material) {
      material.color?.set('#c91f29');
      material.roughness = .42;
      if ('clearcoat' in material) { material.clearcoat = .08; material.clearcoatRoughness = .7; }
      material.bumpMap = plasticGrain;
      material.bumpScale = .000035;
      material.needsUpdate = true;
    }
  });
  holder.add(gltf.scene);
  ready = true;
  tray.classList.add('is-3d-ready');
  fallback?.setAttribute('aria-hidden', 'true');
  status.textContent = '홀더를 마우스나 손가락으로 돌려보세요. 감띠도 함께 움직여요.';
  setFriends(window.gamttizComboPicked?.() || currentPicks);
  resize();
}, undefined, error => {
  console.error(error);
  status.textContent = '3D 화면을 불러오지 못했어요. 원래 조합 화면을 이용해 주세요.';
});

let previous = 0;
let visible = true;
new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; }).observe(tray);
function animate(time) {
  requestAnimationFrame(animate);
  if (!visible) { previous = time; return; }
  const delta = previous ? (time - previous) / 1000 : 0;
  previous = time;
  controls.update(Math.min(delta, .05));
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);
