import { CONFIG } from './config.js';

/* Builds, from the ACTS list, everything the DOM needs:
 *   • one text layer per act (hero or specimen variant)
 *   • snap-checkpoint markers (2 per act) at the right scroll offsets
 *   • the work-index thumbnails in the footer section
 * Returns the array of layer elements (index-aligned with scene.objects). */

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

export function buildLayers(acts, stage) {
  const layers = acts.map((act, i) => {
    const layer = el('div', `layer layer--${act.side} layer--${act.variant === 'hero' ? 'hero' : 'specimen'}`);
    layer.style.opacity = i === 0 ? '1' : '0';
    layer.setAttribute('data-act', String(i));

    const top = el('div', 'layer__top');
    const bottom = el('div', 'layer__bottom');

    if (act.variant === 'hero') {
      top.appendChild(el('div', 'eyebrow eyebrow--rule', `<span class="rule"></span><span>${act.eyebrow}</span>`));
      top.appendChild(el('h1', 'display', act.title));
      bottom.appendChild(el('p', 'lede', act.description));
      bottom.appendChild(el('div', 'scrollcue', `<span class="scrollcue__line"></span>Scroll to enter`));
    } else {
      top.appendChild(el('span', 'eyebrow', act.eyebrow));
      top.appendChild(el('h2', 'title', act.title));
      bottom.appendChild(el('p', 'lede', act.description));
      bottom.appendChild(el('div', 'meta', act.meta));
    }

    layer.appendChild(top);
    layer.appendChild(bottom);
    stage.appendChild(layer);
    return layer;
  });
  return layers;
}

// Snap markers: 2 per act (zoomed-out + zoomed-in), positioned as a fraction
// of the scrollable range so CSS scroll-snap settles onto each checkpoint.
export function buildSnapMarkers(acts, work) {
  const N = acts.length;
  const seqVh = N * CONFIG.actVh; // total #work height in vh
  const range = seqVh - 100; // scrollable vh (sticky stage is 100vh)
  const frac = [];
  for (let i = 0; i < N; i++) {
    frac.push((i + CONFIG.snapOut) / N);
    frac.push((i + CONFIG.snapIn) / N);
  }
  frac.forEach((f) => {
    const m = el('div', 'snap');
    m.style.top = `${(f * range).toFixed(2)}vh`;
    work.appendChild(m);
  });
  work.style.height = `${seqVh}vh`;
}
