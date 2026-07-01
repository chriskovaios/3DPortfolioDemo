import { CONFIG } from './config.js';
import { clamp } from './util.js';

/* Pointer-drag + WASD rotation. Rotates whichever act is currently centre-stage,
 * writing into each object's persistent rot {x,y} so a pose is remembered when
 * you scroll away and back. */
export class Controls {
  constructor(overlay, objects) {
    this.overlay = overlay;
    this.objects = objects;
    this.activeAct = 0;
    this.keys = new Set();
    this._dragging = false;
    this._lx = 0;
    this._ly = 0;
    this._bind();
  }

  _bind() {
    this.overlay.addEventListener('pointerdown', this._down);
    window.addEventListener('pointermove', this._move);
    window.addEventListener('pointerup', this._up);
    window.addEventListener('pointercancel', this._up);
    window.addEventListener('keydown', this._key);
    window.addEventListener('keyup', this._keyUp);
  }

  dispose() {
    this.overlay.removeEventListener('pointerdown', this._down);
    window.removeEventListener('pointermove', this._move);
    window.removeEventListener('pointerup', this._up);
    window.removeEventListener('pointercancel', this._up);
    window.removeEventListener('keydown', this._key);
    window.removeEventListener('keyup', this._keyUp);
  }

  _down = (e) => {
    this._dragging = true;
    this._lx = e.clientX;
    this._ly = e.clientY;
    this.overlay.style.cursor = 'grabbing';
  };

  _move = (e) => {
    if (!this._dragging) return;
    const dx = e.clientX - this._lx;
    const dy = e.clientY - this._ly;
    this._lx = e.clientX;
    this._ly = e.clientY;
    const rot = this.objects[this.activeAct].rot;
    rot.y += dx * CONFIG.dragSpeed;
    rot.x = clamp(rot.x + dy * CONFIG.dragSpeed, -CONFIG.pitchClamp, CONFIG.pitchClamp);
  };

  _up = () => {
    this._dragging = false;
    this.overlay.style.cursor = 'grab';
  };

  _key = (e) => {
    const k = e.key.toLowerCase();
    if ('wasd'.includes(k)) this.keys.add(k);
  };

  _keyUp = (e) => {
    this.keys.delete(e.key.toLowerCase());
  };

  // Called each frame with delta seconds and the current active act index.
  tick(delta, activeAct) {
    this.activeAct = activeAct;
    if (!this.keys.size) return;
    const rot = this.objects[activeAct].rot;
    const step = CONFIG.keySpeed * delta;
    if (this.keys.has('a')) rot.y -= step;
    if (this.keys.has('d')) rot.y += step;
    if (this.keys.has('w')) rot.x -= step;
    if (this.keys.has('s')) rot.x += step;
    rot.x = clamp(rot.x, -CONFIG.pitchClamp, CONFIG.pitchClamp);
  }
}
