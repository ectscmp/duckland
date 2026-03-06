import * as THREE from "https://esm.sh/three@0.162.0";
import { MTLLoader } from "https://esm.sh/three@0.162.0/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "https://esm.sh/three@0.162.0/examples/jsm/loaders/OBJLoader.js";

const MODEL_MTL_PATH = "/models/duck.mtl";
const MODEL_OBJ_PATH = "/models/duck.obj";

const mtlLoader = new MTLLoader();
const objLoader = new OBJLoader();

let templatePromise = null;

function toHex(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  return /^#[0-9A-Fa-f]{6}$/.test(value) ? value : fallback;
}

function asArray(material) {
  if (!material) {
    return [];
  }

  return Array.isArray(material) ? material : [material];
}

function cloneMaterials(mesh) {
  if (!mesh.isMesh || !mesh.material) {
    return;
  }

  if (Array.isArray(mesh.material)) {
    mesh.material = mesh.material.map((material) => material.clone());
    return;
  }

  mesh.material = mesh.material.clone();
}

function normalizeName(value) {
  return String(value || "").toLowerCase();
}

function partColorForMesh(mesh, colors) {
  const meshName = normalizeName(mesh.name);

  if (meshName.includes("head") || meshName.includes("beak")) {
    return toHex(colors.head, "#f0d35f");
  }

  if (meshName.includes("front_right")) {
    return toHex(colors.frontRight, "#d88f3d");
  }

  if (meshName.includes("front_left")) {
    return toHex(colors.frontLeft, "#e9bc4f");
  }

  if (meshName.includes("rear_right")) {
    return toHex(colors.rearRight, "#6f4b1f");
  }

  if (meshName.includes("rear_left")) {
    return toHex(colors.rearLeft, "#9f6f2b");
  }

  return null;
}

function setMaterialColor(material, colorHex) {
  if (!material || !material.color) {
    return;
  }

  material.color.set(colorHex);
}

function applyColorsAndDerpy(root, colors, derpy) {
  root.traverse((node) => {
    if (!node.isMesh) {
      return;
    }

    const colorHex = partColorForMesh(node, colors || {});
    const materials = asArray(node.material);

    for (const material of materials) {
      const materialName = normalizeName(material?.name);

      if (materialName.includes("derpy")) {
        node.visible = Boolean(derpy);
      } else if (materialName.includes("normal_pupil")) {
        node.visible = !derpy;
      }

      if (colorHex) {
        setMaterialColor(material, colorHex);
      }
    }
  });
}

function fitDuckToGround(duckRig, targetSize) {
  duckRig.updateMatrixWorld(true);

  const boundsBefore = new THREE.Box3().setFromObject(duckRig);
  const size = new THREE.Vector3();
  boundsBefore.getSize(size);

  const longest = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / longest;
  duckRig.scale.setScalar(scale);

  duckRig.updateMatrixWorld(true);
  const boundsAfterScale = new THREE.Box3().setFromObject(duckRig);

  const centerX = (boundsAfterScale.min.x + boundsAfterScale.max.x) * 0.5;
  const centerZ = (boundsAfterScale.min.z + boundsAfterScale.max.z) * 0.5;

  duckRig.position.x -= centerX;
  duckRig.position.z -= centerZ;
  duckRig.position.y -= boundsAfterScale.min.y;
}

function collectNamedCenters(root) {
  const bounds = new THREE.Box3();
  const centers = new Map();

  root.traverse((node) => {
    if (!node.isMesh) {
      return;
    }

    const name = normalizeName(node.name);
    if (!name) {
      return;
    }

    bounds.setFromObject(node);
    if (bounds.isEmpty()) {
      return;
    }

    const center = new THREE.Vector3();
    bounds.getCenter(center);
    centers.set(name, center);
  });

  return centers;
}

function averageVectors(items) {
  if (!items.length) {
    return null;
  }

  const sum = new THREE.Vector3();
  for (const item of items) {
    sum.add(item);
  }

  return sum.multiplyScalar(1 / items.length);
}

function applyTiltLeveling(duckRig, centers) {
  const frontRight = centers.get("front_right");
  const rearRight = centers.get("rear_right");
  const frontLeft = centers.get("front_left");
  const rearLeft = centers.get("rear_left");
  const head = centers.get("head");
  const beak = centers.get("beak");

  if (!frontRight || !rearRight || !frontLeft || !rearLeft) {
    return;
  }

  const rightSide = averageVectors([frontRight, rearRight]);
  const leftSide = averageVectors([frontLeft, rearLeft]);
  if (!rightSide || !leftSide) {
    return;
  }

  const worldRight = rightSide.clone().sub(leftSide);
  const lateralDistance = Math.hypot(worldRight.x, worldRight.z);
  if (lateralDistance > 1e-6) {
    const roll = Math.atan2(rightSide.y - leftSide.y, lateralDistance);
    duckRig.rotateZ(-roll);
  }

  duckRig.updateMatrixWorld(true);
  const leveledCenters = collectNamedCenters(duckRig);

  const leveledFrontRight = leveledCenters.get("front_right");
  const leveledFrontLeft = leveledCenters.get("front_left");
  const leveledRearRight = leveledCenters.get("rear_right");
  const leveledRearLeft = leveledCenters.get("rear_left");
  const leveledHead = leveledCenters.get("head");
  const leveledBeak = leveledCenters.get("beak");

  const front = averageVectors(
    [leveledHead, leveledBeak, leveledFrontRight, leveledFrontLeft].filter(Boolean),
  );
  const rear = averageVectors([leveledRearRight, leveledRearLeft].filter(Boolean));

  if (!front || !rear) {
    return;
  }

  const worldFront = front.clone().sub(rear);
  const forwardDistance = Math.hypot(worldFront.x, worldFront.z);
  if (forwardDistance > 1e-6) {
    const pitch = Math.atan2(front.y - rear.y, forwardDistance);
    duckRig.rotateX(pitch);
  }
}

function orientDuckRig(duckRig, duckModel) {
  const centers = collectNamedCenters(duckModel);

  const front = averageVectors(
    [centers.get("head"), centers.get("beak"), centers.get("eyes")].filter(Boolean),
  );
  const rear = averageVectors(
    [centers.get("rear_right"), centers.get("rear_left")].filter(Boolean),
  );
  const right = averageVectors(
    [centers.get("front_right"), centers.get("rear_right")].filter(Boolean),
  );
  const left = averageVectors([centers.get("front_left"), centers.get("rear_left")].filter(Boolean));

  if (!front || !rear || !right || !left) {
    // Fallback for incomplete models.
    duckRig.rotation.x = -Math.PI / 2;
    return;
  }

  const modelRight = right.clone().sub(left).normalize();
  const modelFront = front.clone().sub(rear).normalize();
  let modelUp = new THREE.Vector3().crossVectors(modelRight, modelFront).normalize();

  if (modelUp.lengthSq() < 1e-8) {
    duckRig.rotation.x = -Math.PI / 2;
    return;
  }

  if (modelUp.y < 0) {
    modelUp.multiplyScalar(-1);
  }

  // Re-orthogonalize to ensure a clean basis before conversion.
  const frontOrtho = new THREE.Vector3().crossVectors(modelUp, modelRight).normalize();
  const rightOrtho = new THREE.Vector3().crossVectors(frontOrtho, modelUp).normalize();

  const modelBasis = new THREE.Matrix4().makeBasis(rightOrtho, modelUp, frontOrtho);
  const alignToWorld = modelBasis.clone().invert();
  duckRig.quaternion.setFromRotationMatrix(alignToWorld);

  duckRig.updateMatrixWorld(true);
  const alignedCenters = collectNamedCenters(duckRig);
  applyTiltLeveling(duckRig, alignedCenters);
}

async function loadDuckTemplate() {
  if (templatePromise) {
    return templatePromise;
  }

  templatePromise = mtlLoader
    .loadAsync(MODEL_MTL_PATH)
    .then((materials) => {
      materials.preload();
      objLoader.setMaterials(materials);
      return objLoader.loadAsync(MODEL_OBJ_PATH);
    })
    .catch((error) => {
      templatePromise = null;
      throw error;
    });

  return templatePromise;
}

async function createDuckModel(options) {
  const template = await loadDuckTemplate();
  const duckModel = template.clone(true);

  duckModel.traverse((node) => {
    if (node.isMesh) {
      cloneMaterials(node);
      node.castShadow = false;
      node.receiveShadow = false;
    }
  });

  const duckRig = new THREE.Group();
  duckRig.add(duckModel);

  orientDuckRig(duckRig, duckModel);

  fitDuckToGround(duckRig, 2.1);
  applyColorsAndDerpy(duckRig, options.colors || {}, options.derpy);

  return duckRig;
}

export async function createDuckPreview(container, options = {}) {
  if (!container) {
    return null;
  }

  options.colors = options.colors || {};
  options.derpy = Boolean(options.derpy);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f8fafc");

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 1.15, 3.4);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.innerHTML = "";
  container.append(renderer.domElement);

  const ambient = new THREE.AmbientLight("#ffffff", 0.86);
  const key = new THREE.DirectionalLight("#ffffff", 0.95);
  key.position.set(3, 4, 5);
  const fill = new THREE.DirectionalLight("#ffffff", 0.4);
  fill.position.set(-4, 1.4, -3);
  scene.add(ambient, key, fill);

  const spinPivot = new THREE.Group();
  scene.add(spinPivot);

  const duckRig = await createDuckModel(options);
  spinPivot.add(duckRig);
  spinPivot.rotation.y = 0.68;

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(1.95, 64),
    new THREE.MeshBasicMaterial({ color: "#dbe5ef" }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);

  let width = container.clientWidth || 280;
  let height = container.clientHeight || 220;

  function resize() {
    width = container.clientWidth || 280;
    height = container.clientHeight || 220;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0.76, 0);
  }

  resize();
  window.addEventListener("resize", resize);

  let rafId = 0;
  const speed = typeof options.spinSpeed === "number" ? options.spinSpeed : 0.01;

  function draw() {
    spinPivot.rotation.y += speed;
    renderer.render(scene, camera);
    rafId = window.requestAnimationFrame(draw);
  }

  draw();

  return {
    updateColors(nextColors) {
      options.colors = nextColors || {};
      applyColorsAndDerpy(duckRig, options.colors, options.derpy);
    },
    updateDerpy(derpy) {
      options.derpy = Boolean(derpy);
      applyColorsAndDerpy(duckRig, options.colors, options.derpy);
    },
    dispose() {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }

      window.removeEventListener("resize", resize);

      duckRig.traverse((node) => {
        if (!node.isMesh) {
          return;
        }

        asArray(node.material).forEach((material) => material.dispose());
      });

      ground.geometry.dispose();
      ground.material.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
