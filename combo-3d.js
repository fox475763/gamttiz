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
renderer.toneMappingExposure = .82;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0xe8e3dc, 1);
renderer.domElement.className = 'combo-3d-canvas';
renderer.domElement.setAttribute('aria-hidden', 'true');
tray.append(renderer.domElement);

const environmentGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = environmentGenerator.fromScene(new RoomEnvironment(), .05).texture;
scene.environmentIntensity = .32;
environmentGenerator.dispose();

scene.add(new THREE.HemisphereLight(0xfff4e9, 0x665550, .66));
const key = new THREE.DirectionalLight(0xffebd8, 2.15);
key.position.set(-.12, .23, .18);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = key.shadow.camera.bottom = -.14;
key.shadow.camera.right = key.shadow.camera.top = .14;
key.shadow.camera.near = .01;
key.shadow.camera.far = .6;
key.shadow.bias = -.00003;
key.shadow.normalBias = .00012;
key.shadow.radius = 3;
scene.add(key);
const fill = new THREE.DirectionalLight(0xe3edff, .42);
fill.position.set(.14, .10, .07);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffe1c6, .7);
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
shadow.position.set(.008, -.0018, -.006);
scene.add(shadow);

// One material for the holder only. The character illustrations keep their original colors.
const finishSize = 1024;
let finishSeed = 20261102;
function randomFinish() {
  finishSeed = (1664525 * finishSeed + 1013904223) >>> 0;
  return finishSeed / 4294967296;
}
const finishCanvas = document.createElement('canvas');
finishCanvas.width = finishCanvas.height = finishSize;
const finishContext = finishCanvas.getContext('2d');
const finishPixels = finishContext.createImageData(finishSize, finishSize);
for (let p = 0; p < finishPixels.data.length; p += 4) {
  const variation = Math.round((randomFinish() - .5) * 5);
  finishPixels.data[p] = 188 + variation;
  finishPixels.data[p + 1] = 42 + variation;
  finishPixels.data[p + 2] = 39 + variation;
  finishPixels.data[p + 3] = 255;
}
finishContext.putImageData(finishPixels, 0, 0);
const heightCanvas = document.createElement('canvas');
heightCanvas.width = heightCanvas.height = finishSize;
const heightContext = heightCanvas.getContext('2d');
heightContext.fillStyle = '#808080';
heightContext.fillRect(0, 0, finishSize, finishSize);
for (let i = 0; i < 185; i++) {
  const x = randomFinish() * finishSize;
  const y = randomFinish() * finishSize;
  const length = 4 + randomFinish() ** 3 * 65;
  const angle = -.2 + randomFinish() * .4;
  const width = .3 + randomFinish() * 1.1;
  finishContext.strokeStyle = randomFinish() > .5 ? 'rgba(255,211,184,.11)' : 'rgba(62,8,12,.08)';
  finishContext.lineWidth = width;
  finishContext.beginPath();
  finishContext.moveTo(x, y);
  finishContext.lineTo(x + length * Math.cos(angle), y + length * Math.sin(angle));
  finishContext.stroke();
  heightContext.strokeStyle = 'rgba(230,230,230,.23)';
  heightContext.lineWidth = width;
  heightContext.beginPath();
  heightContext.moveTo(x, y);
  heightContext.lineTo(x + length * Math.cos(angle), y + length * Math.sin(angle));
  heightContext.stroke();
}
const finishColor = new THREE.CanvasTexture(finishCanvas);
finishColor.colorSpace = THREE.SRGBColorSpace;
const finishHeight = new THREE.CanvasTexture(heightCanvas);
for (const texture of [finishColor, finishHeight]) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
}
const holderMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  map: finishColor,
  bumpMap: finishHeight,
  bumpScale: .000045,
  roughness: .48,
  metalness: 0,
  clearcoat: .16,
  clearcoatRoughness: .48,
  envMapIntensity: .45
});

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

function createPng(indices) {
  const originalRatio = renderer.getPixelRatio();
  const originalAspect = camera.aspect;
  renderer.setPixelRatio(1);
  renderer.setSize(1200, 1200, false);
  camera.aspect = 1;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = 1080;
  exportCanvas.height = 1920;
  const ctx = exportCanvas.getContext('2d');
  const background = ctx.createLinearGradient(0, 0, 1080, 1920);
  background.addColorStop(0, '#fffaf0');
  background.addColorStop(1, '#ffe9bf');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = '#ffb511';
  ctx.fillRect(0, 0, 1080, 20);
  ctx.fillStyle = '#bd2d27';
  ctx.font = '700 55px GamttizEN,sans-serif';
  ctx.fillText('GAMTTIZ', 68, 110);
  ctx.fillStyle = '#a83d2e';
  ctx.font = '700 22px GamttizEN,sans-serif';
  ctx.fillText('French Fry Lovers', 70, 146);
  ctx.textAlign = 'right';
  ctx.fillText(indices.length + ' / 5 FRIENDS', 1012, 112);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#33241c';
  ctx.font = '800 66px "Wanted Sans Variable",sans-serif';
  ctx.fillText('나만의 감띠 홀더', 68, 246);
  ctx.fillStyle = '#b32d29';
  ctx.font = '700 25px GamttizEN,sans-serif';
  ctx.fillText('MY GAMTTIZ HOLDER', 70, 292);
  ctx.fillStyle = '#f8e9ca';
  ctx.beginPath();
  ctx.roundRect(48, 340, 984, 1050, 38);
  ctx.fill();
  ctx.drawImage(renderer.domElement, 50, 350, 980, 980);
  camera.aspect = originalAspect;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(originalRatio);
  resize();
  ctx.fillStyle = '#b62924';
  ctx.font = '800 27px GamttizEN,sans-serif';
  ctx.fillText('INSIDE MY HOLDER', 70, 1470);
  ctx.fillStyle = '#33241c';
  ctx.font = '800 42px "Wanted Sans Variable",sans-serif';
  const labels = indices.map(index => products[index].name);
  labels.forEach((label, i) => {
    const column = i % 2;
    const row = Math.floor(i / 2);
    const x = 70 + column * 485;
    const y = 1545 + row * 78;
    ctx.fillStyle = '#ffb511';
    ctx.beginPath();ctx.arc(x + 21, y - 12, 21, 0, Math.PI * 2);ctx.fill();
    ctx.fillStyle = '#a72a23';ctx.font = '800 21px GamttizEN,sans-serif';
    ctx.textAlign = 'center';ctx.fillText(String(i + 1).padStart(2, '0'), x + 21, y - 5);ctx.textAlign = 'left';
    ctx.fillStyle = '#33241c';ctx.font = '700 33px "Wanted Sans Variable",sans-serif';
    ctx.fillText(label, x + 58, y, 400);
  });
  ctx.fillStyle = '#9b6549';ctx.font = '500 22px "Wanted Sans Variable",sans-serif';
  ctx.fillText('좋아하는 감띠를 담아 만든 나만의 조합', 70, 1843);
  ctx.textAlign = 'right';ctx.fillStyle = '#b62924';ctx.font = '700 22px GamttizEN,sans-serif';
  ctx.fillText('@gamttiz_official', 1010, 1843);ctx.textAlign = 'left';
  const image = exportCanvas.toDataURL('image/png');
  const binary = atob(image.slice(image.indexOf(',') + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'image/png' });
  const url = URL.createObjectURL(blob);
  return { image, url, blob };
}

function savePng(indices) {
  const { image, url } = createPng(indices);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gamttiz-my-holder.png';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return image;
}

function sharePng(indices) {
  const { image, url, blob } = createPng(indices);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  const file = new File([blob], 'gamttiz-my-holder.png', { type: 'image/png' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    return { image, promise: navigator.share({ files: [file], title: '나만의 감띠 홀더', text: '내가 고른 감띠 친구들을 만나보세요!' }) };
  }
  return { image, promise: null };
}

window.gamttiz3d = { get ready() { return ready; }, setFriends, savePng, sharePng };
document.addEventListener('gamttiz-picks-changed', event => setFriends(event.detail));
const loader = new GLTFLoader();
loader.load('assets/holder-fbx.glb', gltf => {
  gltf.scene.traverse(object => {
    if (!object.isMesh) return;
    object.material?.dispose();
    object.material = holderMaterial;
    object.castShadow = true;
    object.receiveShadow = true;
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

