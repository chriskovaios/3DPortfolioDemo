/* Global tuning — pacing, camera distances, atmosphere, interaction feel.
   Safe to tweak; none of these depend on the number of projects. */

export const CONFIG = {
  // ── Scroll pacing ─────────────────────────────────────────────
  // Viewport-heights of scroll allotted to EACH act. Total sequence
  // height = ACTS.length * ACT_VH (vh). Larger = slower, more cinematic.
  actVh: 130,

  // Fraction (0..1) within each act's scroll band where the two snap
  // checkpoints sit: zoomed-out (intro, text visible) and zoomed-in (fills frame).
  snapOut: 0.24,
  snapIn: 0.76,

  // ── Camera dolly ──────────────────────────────────────────────
  zoomOutZ: 6.8, // camera distance at the "out" checkpoint
  zoomInZ: 4.4, // camera distance at the "in" checkpoint

  // ── Atmosphere ────────────────────────────────────────────────
  fogDensity: 0.13,
  bgClear: 0x06070a,

  // ── Particle counts (auto-reduced on mobile) ──────────────────
  pointsDesktop: 5200,
  pointsMobile: 2400,
  dustDesktop: 1200,
  dustMobile: 600,

  // ── Interaction ───────────────────────────────────────────────
  dragSpeed: 0.006, // radians per pixel dragged
  keySpeed: 1.7, // radians per second for WASD
  pitchClamp: 1.3, // max up/down tilt (radians)
  idleSpin: 0.02, // gentle ambient yaw per second
  parallax: 0.0, // set >0 to re-enable cursor parallax (0 = locked, snap-friendly)

  // ── Device caps ───────────────────────────────────────────────
  maxDprDesktop: 1.6,
  maxDprMobile: 1.4,
  mobileQuery: '(max-width: 768px)'
};
