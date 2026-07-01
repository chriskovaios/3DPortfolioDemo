import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/libs';

/* A GLTFLoader pre-wired for the three compression formats you'll actually use
 * to get a 10–15 MB Blender export down to a web-sane size:
 *   • Draco   — mesh geometry compression
 *   • Meshopt — alternative geometry + animation compression
 *   • KTX2    — GPU texture compression (Basis), the biggest single win
 * Decoders are loaded lazily from the pinned CDN only if a model needs them. */
export function createLoader(renderer) {
  const loader = new GLTFLoader();

  const draco = new DRACOLoader();
  draco.setDecoderPath(`${CDN}/draco/`);
  loader.setDRACOLoader(draco);

  const ktx2 = new KTX2Loader();
  ktx2.setTranscoderPath(`${CDN}/basis/`);
  ktx2.detectSupport(renderer);
  loader.setKTX2Loader(ktx2);

  loader.setMeshoptDecoder(MeshoptDecoder);
  return loader;
}

// Load a GLB/GLTF, recentre + scale it to a target radius, and return the
// fitted holder group plus the list of its materials (for opacity fades).
export function loadModel(loader, url, targetRadius, onProgress) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene || gltf.scenes[0];
        const box = new THREE.Box3().setFromObject(model);
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        model.position.sub(sphere.center); // recentre on origin
        const holder = new THREE.Group();
        holder.add(model);
        holder.scale.setScalar(targetRadius / (sphere.radius || 1));

        const mats = [];
        model.traverse((o) => {
          if (!o.isMesh) return;
          o.castShadow = o.receiveShadow = false;
          const list = Array.isArray(o.material) ? o.material : [o.material];
          list.forEach((m) => {
            if (m) {
              m.transparent = true;
              mats.push(m);
            }
          });
        });
        resolve({ holder, mats, animations: gltf.animations || [] });
      },
      (ev) => {
        if (onProgress && ev.lengthComputable) onProgress(ev.loaded / ev.total);
      },
      reject
    );
  });
}
