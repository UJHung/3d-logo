import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/RenderPass.js";
import {
  Brush,
  Evaluator,
  ADDITION,
} from "https://cdn.jsdelivr.net/npm/three-bvh-csg@0.0.17/build/index.module.js";

const CONFIG = {
  ROTATION_SPEED: {
    NORMAL: 0.002,
    HOVER: 0.012,
    EASING: 0.05,
  },
  FLICKER: {
    AMPLITUDE: 0.3,
    SPEED: 0.003,
    BASE_INTENSITY: 5,
  },
  CAMERA: {
    FOV_DESKTOP: 60,
    FOV_MOBILE: 70,
  },
  WIREFRAME: {
    OPACITY_DESKTOP: 0.5,
    OPACITY_MOBILE: 0.5,
    EMISSIVE_INTENSITY_DESKTOP: 0.2,
    EMISSIVE_INTENSITY_MOBILE: 0.2,
  },
  STARS: {
    SMALL_SIZE_DESKTOP: 2,
    SMALL_SIZE_MOBILE: 4,
    BIG_SIZE_DESKTOP: 70,
    BIG_SIZE_MOBILE: 100,
  },
  FLASH: {
    DURATION: 0.5,
    INTENSITY: 30,
  },
};

const canvas = document.querySelector("#canvas");
if (!canvas) {
  console.error("Canvas element not found");
  throw new Error(
    "Failed to initialize: Canvas element #canvas not found in DOM"
  );
}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });

  // Check WebGL support
  const gl = renderer.getContext();
  if (!gl) {
    throw new Error("WebGL not supported in this browser");
  }

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
} catch (error) {
  console.error("Failed to initialize WebGL renderer:", error);
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: #0a077e; color: white; text-align: center; padding: 20px;">
      <div>
        <h3>WebGL Error</h3>
        <p>Your browser does not support WebGL or it is disabled.</p>
        <p style="font-size: 14px; opacity: 0.8;">Please try updating your browser or enabling WebGL in settings.</p>
      </div>
    </div>
  `;
  throw error;
}

const scene = new THREE.Scene();

const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
const fov = isMobile ? CONFIG.CAMERA.FOV_MOBILE : CONFIG.CAMERA.FOV_DESKTOP;

const camera = new THREE.PerspectiveCamera(
  fov,
  window.innerWidth / window.innerHeight,
  0.1,
  400
);
camera.position.z = isMobile
  ? CONFIG.CAMERA.FOV_MOBILE
  : CONFIG.CAMERA.FOV_DESKTOP;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.minPolarAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 2;

const rotatingGroup = new THREE.Group();
scene.add(rotatingGroup);

// set background color
scene.background = new THREE.Color(0x0a077e);

// lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// create capsule geometries to form "M" shape
const capsuleConfigs = [
  { radius: 3, length: 16, rotation: -30, position: [-12, 0.75, 0] },
  { radius: 3, length: 14, rotation: 30, position: [-4, 0.75, 0] },
  { radius: 3, length: 14, rotation: -30, position: [4, 0.75, 0] },
  { radius: 3, length: 16, rotation: 30, position: [12, 0.75, 0] },
];

const capsules = capsuleConfigs.map((config) => {
  const geometry = new THREE.CapsuleGeometry(
    config.radius,
    config.length,
    1,
    6
  );
  const capsule = new Brush(geometry);
  capsule.rotation.z = config.rotation * (Math.PI / 180);
  capsule.position.set(...config.position);
  capsule.updateMatrixWorld();
  return capsule;
});

const evaluator = new Evaluator();
let result = capsules.reduce((acc, capsule) =>
  evaluator.evaluate(acc, capsule, ADDITION)
);

// material setting with mobile optimization
const material = new THREE.MeshStandardMaterial({
  color: 0x4484ee,
  wireframe: true,
  opacity: isMobile
    ? CONFIG.WIREFRAME.OPACITY_MOBILE
    : CONFIG.WIREFRAME.OPACITY_DESKTOP,
  transparent: true,
  metalness: 0,
  roughness: 1,
  emissive: 0x4484ee,
  emissiveIntensity: isMobile
    ? CONFIG.WIREFRAME.EMISSIVE_INTENSITY_MOBILE
    : CONFIG.WIREFRAME.EMISSIVE_INTENSITY_DESKTOP,
});
result.material = material;

rotatingGroup.add(result);

// star texture creation
function createStarTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, "rgba(90, 211, 240, 1)");
  gradient.addColorStop(0.2, "rgba(90, 211, 240, 0.8)");
  gradient.addColorStop(0.5, "rgba(90, 211, 240, 0.3)");
  gradient.addColorStop(1, "rgba(90, 211, 240, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

// generate star positions from CSG geometry vertices
const positions = result.geometry.attributes.position;
const starPositions = [];

const uniqueVertices = new Map();
for (let i = 0; i < positions.count; i++) {
  const x = positions.getX(i);
  const y = positions.getY(i);
  const z = positions.getZ(i);

  const key = `${x.toFixed(0)},${y.toFixed(0)},${z.toFixed(0)}`;

  if (!uniqueVertices.has(key)) {
    uniqueVertices.set(key, [x, y, z]);
    starPositions.push(x, y, z);
  }
}

// create star geometry and add custom attributes for twinkling
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starPositions, 3)
);

// custom attributes for twinkling effect
const starCount = starPositions.length / 3;
const twinkleSpeed = new Float32Array(starCount);
const twinkleOffset = new Float32Array(starCount);

for (let i = 0; i < starCount; i++) {
  twinkleSpeed[i] = 0.25 + Math.random() * 2;
  twinkleOffset[i] = Math.random() * Math.PI * 2;
}

starGeometry.setAttribute(
  "twinkleSpeed",
  new THREE.BufferAttribute(twinkleSpeed, 1)
);
starGeometry.setAttribute(
  "twinkleOffset",
  new THREE.BufferAttribute(twinkleOffset, 1)
);

const starTexture = createStarTexture();
const smallStarSize = isMobile
  ? CONFIG.STARS.SMALL_SIZE_MOBILE
  : CONFIG.STARS.SMALL_SIZE_DESKTOP;
const starMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    starTexture: { value: starTexture },
    baseColor: { value: new THREE.Color(0xffffff) },
    starSizeMultiplier: { value: smallStarSize },
  },
  vertexShader: `
    attribute float twinkleSpeed;
    attribute float twinkleOffset;
    varying float vAlpha;
    uniform float time;
    uniform float starSizeMultiplier;
    
    void main() {
      vAlpha = 0.1 + 0.9 * (sin(time * twinkleSpeed + twinkleOffset) * 0.5 + 0.5);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = starSizeMultiplier * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform sampler2D starTexture;
    uniform vec3 baseColor;
    varying float vAlpha;
    
    void main() {
      vec4 texColor = texture2D(starTexture, gl_PointCoord);
      gl_FragColor = vec4(baseColor * 1.5, texColor.a * vAlpha);
    }
  `,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const stars = new THREE.Points(starGeometry, starMaterial);
rotatingGroup.add(stars);

// create glowing stars (big stars) with point lights
const sphereConfigs = [
  { color: 0x5ad3f0, position: [-8, 7, 0] },
  { color: 0x6db3ef, position: [8, 7, 0] },
  { color: 0x4484ee, position: [16, -6, 0] },
  { color: 0x5d9aed, position: [-16, -6, 0] },
];

function createColoredStarTexture(color) {
  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;

  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
  gradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, 0.8)`);
  gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.3)`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

const bigStarSize = isMobile
  ? CONFIG.STARS.BIG_SIZE_MOBILE
  : CONFIG.STARS.BIG_SIZE_DESKTOP;

const glowingStars = sphereConfigs.map((config) => {
  const bigStarGeometry = new THREE.BufferGeometry();
  bigStarGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(config.position, 3)
  );

  const bigStarTexture = createColoredStarTexture(config.color);
  const bigStarMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      starTexture: { value: bigStarTexture },
      baseColor: { value: new THREE.Color(config.color) },
      twinkleAmplitude: { value: 0.1 },
      twinkleSpeed: { value: 1.5 },
      starSize: { value: bigStarSize },
    },
    vertexShader: `
      varying float vAlpha;
      uniform float time;
      uniform float twinkleAmplitude;
      uniform float twinkleSpeed;
      uniform float starSize;
      
      void main() {
        float minAlpha = 1.0 - twinkleAmplitude;
        vAlpha = minAlpha + twinkleAmplitude * sin(time * twinkleSpeed);
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = starSize;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D starTexture;
      uniform vec3 baseColor;
      varying float vAlpha;
      
      void main() {
        vec4 texColor = texture2D(starTexture, gl_PointCoord);
        gl_FragColor = vec4(baseColor * 2.0, texColor.a * vAlpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const bigStar = new THREE.Points(bigStarGeometry, bigStarMaterial);
  rotatingGroup.add(bigStar);

  const pointLight = new THREE.PointLight(config.color, 5, 20);
  pointLight.position.set(...config.position);
  rotatingGroup.add(pointLight);

  return { star: bigStar, light: pointLight, material: bigStarMaterial };
});

// flash effect state
let flashStartTime = null;
let isFlashing = false;

// trigger flash effect on big stars
function triggerFlash() {
  flashStartTime = performance.now();
  isFlashing = true;
}

// hover action
let isHovering = false;
// setup raycaster to detect mouse hover
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

raycaster.params.Points.threshold = 0.1;

if (isMobile) {
  // mobile: use touch events
  canvas.addEventListener("touchstart", (event) => {
    const touch = event.touches[0];
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(result, false);

    isHovering = intersects.length > 0;

    // trigger flash on touch
    triggerFlash();
  });

  canvas.addEventListener("touchend", () => {
    isHovering = false;
  });
} else {
  // desktop: use mouse hover
  canvas.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(result, false);

    isHovering = intersects.length > 0;
  });

  // click event to trigger flash
  canvas.addEventListener("click", () => {
    triggerFlash();
  });
}

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// update star twinkling effect
function updateStarTwinkling(deltaTime) {
  starMaterial.uniforms.time.value += deltaTime;

  glowingStars.forEach(({ material }) => {
    material.uniforms.time.value += deltaTime;
  });
}

// update rotation animation
let currentRotationSpeed = CONFIG.ROTATION_SPEED.NORMAL;

function updateRotation() {
  const targetSpeed = isHovering
    ? CONFIG.ROTATION_SPEED.HOVER
    : CONFIG.ROTATION_SPEED.NORMAL;

  currentRotationSpeed +=
    (targetSpeed - currentRotationSpeed) * CONFIG.ROTATION_SPEED.EASING;

  rotatingGroup.rotation.y += currentRotationSpeed;
}

const flickerAmplitude = CONFIG.FLICKER.AMPLITUDE;
const flickerSpeed = CONFIG.FLICKER.SPEED;
let baseFlickerTime = 0;

// update flicker effect
function updateFlickerEffect(deltaTime) {
  baseFlickerTime += deltaTime;
  return (
    1.0 -
    flickerAmplitude +
    flickerAmplitude * Math.sin(baseFlickerTime * flickerSpeed * 1000)
  );
}

// update flash effect
function updateFlashEffect() {
  let flashMultiplier = 1.0;

  if (isFlashing) {
    const elapsed = (performance.now() - flashStartTime) / 1000;
    if (elapsed < CONFIG.FLASH.DURATION) {
      const progress = elapsed / CONFIG.FLASH.DURATION;
      flashMultiplier = 1.0 + (CONFIG.FLASH.INTENSITY - 1.0) * (1.0 - progress);

      const sizeMultiplier = 1.0 + 0.5 * (1.0 - progress);
      glowingStars.forEach(({ material }) => {
        material.uniforms.starSize.value = bigStarSize * sizeMultiplier;
      });
    } else {
      isFlashing = false;
      flashMultiplier = 1.0;
      glowingStars.forEach(({ material }) => {
        material.uniforms.starSize.value = bigStarSize;
      });
    }
  }

  return flashMultiplier;
}

// update all animations
function updateAnimations(deltaTime) {
  updateStarTwinkling(deltaTime);
  updateRotation();

  // update flicker and flash effects on glowing stars
  const flicker = updateFlickerEffect(deltaTime);
  const flashMultiplier = updateFlashEffect();

  glowingStars.forEach(({ light }) => {
    light.intensity = 5 * flicker * flashMultiplier;
  });
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();

  controls.update();
  updateAnimations(deltaTime);
  composer.render();
}

animate();

// cleanup resources
function dispose() {
  starGeometry.dispose();
  result.geometry.dispose();

  // cleanup materials and textures
  starMaterial.dispose();
  material.dispose();
  glowingStars.forEach(({ material }) => material.dispose());

  starTexture.dispose();
  glowingStars.forEach(({ star }) => {
    star.material.uniforms.starTexture.value.dispose();
  });

  // cleanup renderer and composer
  renderer.dispose();
  composer.dispose();
}

// cleanup resources on page unload
window.addEventListener("beforeunload", dispose);
