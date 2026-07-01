/* Tiny math helpers shared across modules. */

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const lerp = (a, b, t) => a + (b - a) * t;

// Smoothstep with edge clamping.
export const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
