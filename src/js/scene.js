import * as THREE from 'three';
import { CONFIG } from './config.js';
import { clamp, lerp, smooth } from './util.js';
import { createLoader, loadModel } from './loader.js';

const MODEL_RADIUS = 1.9; // GLB models are auto-scaled to roughly this radius

/* -----------------------------------------------------------------------------
 * Geometry generators. Each returns a Float32Array of point positions.
 * Add a new `kind` here and you can reference it from specimens.js immediately.
 * -------------------------------------------------------------------------- */
const GA = Math.PI * (1 + Math.sqrt(5)); // golden angle

function buildPositions(kind, count, sy = 1, sz = 1) {
  const pts = [];
  if (kind === 'sphere' || kind === 'oval') {
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const phi = Math.acos(1 - 2 * t);
      const theta = GA * i;
      let r = 1.7 + Math.sin(theta * 3) * Math.cos(phi * 5) * 0.34 + (Math.random() - 0.5) * 0.2;
      if (Math.random() < 0.12) r += Math.random() * 1.3; // wisps
      const sp = Math.sin(phi);
      pts.push(r * sp * Math.cos(theta), r * Math.cos(phi) * sy, r * sp * Math.sin(theta) * sz);
    }
  } else if (kind === 'knot') {
    for (let i = 0; i < count; i++) {
      const u = (i / count) * Math.PI * 2;
      const rr = 2 + Math.cos(3 * u);
      let x = rr * Math.cos(2 * u);
      let y = rr * Math.sin(2 * u);
      let z = -Math.sin(3 * u) * 1.6;
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(2 * Math.random() - 1);
      const rad = Math.random() * 0.34;
      x += rad * Math.sin(b) * Math.cos(a);
      y += rad * Math.sin(b) * Math.sin(a);
      z += rad * Math.cos(b);
      pts.push(x * 0.62, y * 0.62, z * 0.62);
    }
  } else {
    // 'lattice' — sparse voxel cube (MRI-scan feel)
    const n = count > 3000 ? 20 : 15;
    const span = 1.6;
    const m = (g) => (g / (n - 1) * 2 - 1) * span + (Math.random() - 0.5) * 0.05;
    for (let gx = 0; gx < n; gx++)
      for (let gy = 0; gy < n; gy++)
        for (let gz = 0; gz < n; gz++) {
          if (Math.random() > 0.5) continue;
          pts.push(m(gx), m(gy), m(gz));
        }
  }
  return new Float32Array(pts);
}

function colorize(pos, baseHex, edgeHex) {
  const N = pos.length / 3;
  const col = new Float32Array(N * 3);
  const base = new THREE.Color(baseHex);
  const edge = new THREE.Color(edgeHex);
  let maxR = 0.1;
  for (let i = 0; i < N; i++) {
    const r = Math.hypot(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    if (r > maxR) maxR = r;
  }
  for (let i = 0; i < N; i++) {
    const r = Math.hypot(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]) / maxR;
    const c = base.clone().lerp(edge, Math.min(1, r));
    const dim = 0.55 + Math.random() * 0.45;
    col[i * 3] = c.r * dim;
    col[i * 3 + 1] = c.g * dim;
    col[i * 3 + 2] = c.b * dim;
  }
  return col;
}

/* -----------------------------------------------------------------------------
 * SpecimenScene — owns the renderer, camera, all N point-cloud objects, the
 * dust field, fog, and the generated camera-dolly keyframes.
 * -------------------------------------------------------------------------- */
export class SpecimenScene {
  constructor(canvas, acts) {
    this.acts = acts;
    this.N = acts.length;
    this.isMobile = window.matchMedia(CONFIG.mobileQuery).matches;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, this.isMobile ? CONFIG.maxDprMobile : CONFIG.maxDprDesktop)
    );
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(CONFIG.bgClear, CONFIG.fogDensity);

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 0, CONFIG.zoomOutZ);

    // Renderer tone-mapping so lit GLB materials read filmic, not flat.
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this._buildLights();
    this._buildObjects();
    this._buildDust();
    this._buildCameraKeyframes();
    this.loader = createLoader(this.renderer); // shared GLTF loader (Draco/KTX2/Meshopt)
    this.resize();
  }

  // Single warm key + cool rim + low ambient — the "one light" art direction.
  // These only affect GLB meshes; the additive point clouds ignore lighting.
  _buildLights() {
    const key = new THREE.SpotLight(0xffe6c4, 90, 40, Math.PI * 0.34, 0.45, 1.1);
    key.position.set(3.5, 5, 4.5);
    this.scene.add(key, key.target);
    const rim = new THREE.DirectionalLight(0x8fa6c8, 2.2);
    rim.position.set(-4, 1.5, -3.5);
    this.scene.add(rim);
    this.scene.add(new THREE.AmbientLight(0x3a4252, 1.3));
  }

  _pointCount() {
    return this.isMobile ? CONFIG.pointsMobile : CONFIG.pointsDesktop;
  }

  _buildObjects() {
    this.objects = this.acts.map((act) => {
      // Every act gets a cheap procedural point cloud — it paints instantly and
      // serves as a placeholder/fallback while (or if) a GLB model loads.
      const pos = buildPositions(act.kind ?? 'sphere', this._pointCount(), act.sy ?? 1, act.sz ?? 1);
      const col = colorize(pos, act.base, act.edge);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const mat = new THREE.PointsMaterial({
        size: this.isMobile ? 0.024 : 0.019,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const points = new THREE.Points(geo, mat);
      const group = new THREE.Group();
      group.add(points);
      group.visible = false;
      this.scene.add(group);
      return {
        group,
        mat,
        points,
        rot: { x: 0, y: 0 },
        url: act.model || null,
        state: act.model ? 'pending' : 'none', // pending|loading|ready|error|none
        model: null,
        modelMats: []
      };
    });
  }

  // Lazily fetch a GLB the first time its act comes near; swap the point-cloud
  // placeholder for the real model once ready.
  _ensureLoaded(i) {
    const o = this.objects[i];
    if (!o.url || o.state !== 'pending') return;
    o.state = 'loading';
    this._setStatus(`Loading specimen ${i} …`);
    loadModel(this.loader, o.url, MODEL_RADIUS, (frac) =>
      this._setStatus(`Loading specimen ${i} — ${Math.round(frac * 100)}%`)
    )
      .then(({ holder, mats }) => {
        o.model = holder;
        o.modelMats = mats;
        o.group.add(holder);
        o.points.visible = false;
        o.state = 'ready';
        this._setStatus('');
        if (this.onModelReady) this.onModelReady();
      })
      .catch((err) => {
        console.warn(`Model failed (${o.url}) — keeping point-cloud placeholder.`, err);
        o.state = 'error';
        this._setStatus('');
      });
  }

  _setStatus(text) {
    const el = document.getElementById('loader');
    if (!el) return;
    el.textContent = text;
    el.style.opacity = text ? '1' : '0';
  }

  _buildDust() {
    const DN = this.isMobile ? CONFIG.dustMobile : CONFIG.dustDesktop;
    const dp = new Float32Array(DN * 3);
    for (let i = 0; i < DN; i++) {
      dp[i * 3] = (Math.random() - 0.5) * 14;
      dp[i * 3 + 1] = (Math.random() - 0.5) * 9;
      dp[i * 3 + 2] = (Math.random() - 0.5) * 8 - 3;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.012,
      color: 0x6b6f7a,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    this.scene.add(new THREE.Points(geo, mat));
  }

  // Two camera keyframes per act (zoom-out, then zoom-in) → smooth dolly.
  _buildCameraKeyframes() {
    const K = [];
    for (let i = 0; i < this.N; i++) {
      K.push([(i + CONFIG.snapOut) / this.N, CONFIG.zoomOutZ]);
      K.push([(i + CONFIG.snapIn) / this.N, CONFIG.zoomInZ]);
    }
    this._camK = K;
  }

  camZ(p) {
    const K = this._camK;
    const n = K.length;
    if (p <= K[0][0]) return K[0][1];
    if (p >= K[n - 1][0]) return K[n - 1][1];
    for (let i = 0; i < n - 1; i++) {
      if (p >= K[i][0] && p <= K[i + 1][0]) {
        const f = smooth(0, 1, (p - K[i][0]) / (K[i + 1][0] - K[i][0]));
        return lerp(K[i][1], K[i + 1][1], f);
      }
    }
    return K[n - 1][1];
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  // p = sequence progress 0..1; time = elapsed seconds; layers = DOM text layers.
  update(p, time, layers) {
    const N = this.N;
    const tail = 1 - smooth(0.965, 1.0, p);

    for (let i = 0; i < N; i++) {
      const t = clamp(p * N - i, 0, 1);
      const enter = i === 0 ? 1 : smooth(0, 0.18, t);
      const exit = i === N - 1 ? 1 : 1 - smooth(0.82, 1.0, t);
      const op = enter * exit * tail;

      const o = this.objects[i];
      o.group.visible = op > 0.02;
      o.group.scale.setScalar(lerp(0.85, 1.0, smooth(0, 0.22, t)));
      o.group.rotation.y = o.rot.y + time * CONFIG.idleSpin;
      o.group.rotation.x = o.rot.x;

      // Lazy-load this act's GLB when it comes within ~1.4 acts of centre.
      if (o.state === 'pending' && Math.abs(p * N - i) < 1.4) this._ensureLoaded(i);

      // Drive opacity on whichever representation is live (model or placeholder).
      if (o.state === 'ready') {
        for (let m = 0; m < o.modelMats.length; m++) o.modelMats[m].opacity = op;
        if (o.model) o.model.visible = op > 0.02;
      } else {
        o.mat.opacity = op * 0.92;
      }

      const layer = layers[i];
      if (layer) {
        const enterTxt = i === 0 ? 1 : smooth(0, 0.1, t);
        const fadeOut = 1 - smooth(0.4, 0.6, t);
        layer.style.opacity = (enterTxt * fadeOut * tail).toFixed(3);
        layer.style.transform = `translateY(${((1 - fadeOut) * -14).toFixed(1)}px)`;
      }
    }

    this.camera.position.set(0, 0, this.camZ(p));
    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
  }

  // Static single-frame render for reduced-motion / no animation.
  renderStill() {
    const o = this.objects[0];
    o.group.visible = true;
    o.group.scale.setScalar(0.95);
    o.group.rotation.set(0.1, 0.6, 0);
    if (o.url) this._ensureLoaded(0); // still load the real model if there is one
    if (o.state === 'ready') {
      for (let m = 0; m < o.modelMats.length; m++) o.modelMats[m].opacity = 1;
    } else {
      o.mat.opacity = 0.5;
    }
    this.camera.position.set(0, 0, CONFIG.zoomOutZ + 0.6);
    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
  }
}
