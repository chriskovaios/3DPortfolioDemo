import { ACTS } from '../data/specimens.js';
import { CONFIG } from './config.js';
import { clamp } from './util.js';
import { SpecimenScene } from './scene.js';
import { Controls } from './controls.js';
import { buildLayers, buildSnapMarkers } from './dom.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('scene');
const work = document.getElementById('work');
const stage = document.getElementById('stage');
const overlay = document.getElementById('drag');
const body = document.body;

// Build text layers + snap checkpoints from the ACTS list (count is data-driven).
const layers = buildLayers(ACTS, stage);
buildSnapMarkers(ACTS, work);

const scene = new SpecimenScene(canvas, ACTS);

if (reduced) {
  // Accessible static path: no animation loop, no scroll-snap. Lay the acts
  // out as readable stacked blocks; render one still frame of the scene.
  body.classList.add('is-reduced');
  document.documentElement.style.scrollSnapType = 'none';
  scene.renderStill();
  scene.onModelReady = () => scene.renderStill();
  window.addEventListener('resize', () => {
    scene.resize();
    scene.renderStill();
  });
} else {
  body.classList.add('is-motion');
  const controls = new Controls(overlay, scene.objects);
  let raf = null;
  let last = null;

  const progress = () => {
    const rect = work.getBoundingClientRect();
    const max = rect.height - window.innerHeight;
    return max > 0 ? clamp(-rect.top / max, 0, 1) : 0;
  };

  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const time = now / 1000;
    const delta = last == null ? 0 : Math.min(0.05, time - last);
    last = time;

    const p = progress();
    const act = clamp(Math.floor(p * ACTS.length), 0, ACTS.length - 1);
    controls.tick(delta, act);
    scene.update(p, time, layers);
  };

  const start = () => {
    if (!raf) {
      last = null;
      raf = requestAnimationFrame(frame);
    }
  };
  const stop = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
  };

  window.addEventListener('resize', () => scene.resize());
  // Pause the loop when the tab is hidden (battery / GPU friendly).
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
}
