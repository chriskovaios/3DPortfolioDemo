/* =============================================================================
 *  specimens.js  —  THE ONE FILE YOU EDIT TO CHANGE THE PORTFOLIO
 * =============================================================================
 *
 *  The number of projects is fully customizable: add or remove entries in the
 *  SPECIMENS array below and EVERYTHING regenerates automatically —
 *    • the 3D objects in the scene
 *    • the total scroll length
 *    • the snap checkpoints (one zoomed-out + one zoomed-in per specimen)
 *    • the camera dolly keyframes
 *    • the text layers (eyebrow / title / description / meta)
 *
 *  You do not need to touch any other file to add a 4th, 5th, … Nth project.
 *
 *  ---------------------------------------------------------------------------
 *  Each entry:
 *    code        short specimen code shown as the eyebrow number (e.g. "01")
 *    eyebrow     small uppercase label above the title
 *    title       HTML allowed (use <em> for the italic accent word)
 *    description one-line study description
 *    meta        process tags + year, shown small under the description
 *    side        'left' | 'right'  — which edge the text anchors to
 *    image       optional path to a render shown in the work index (assets/renders/…)
 *
 *    kind        geometry generator: 'sphere' | 'oval' | 'knot' | 'lattice'
 *    base/edge   point colors (hex). base = core, edge = outer shell.
 *    sy, sz      optional axis scale for sphere/oval (stretch the form)
 *
 *    model       OPTIONAL path to a .glb/.gltf file (e.g. 'assets/models/mask.glb').
 *                When set, the model is lazy-loaded as the act nears centre and
 *                replaces the procedural point cloud. The `kind`/base/edge above
 *                still act as an instant placeholder while it downloads (and as a
 *                fallback if the load fails), so always keep them set.
 *                Models are auto-centred and auto-scaled to fit the frame.
 *
 *  The HERO entry (first, variant:'hero') is the opening shot. Keep exactly one.
 * ========================================================================== */

// export const HERO = {
//   variant: 'hero',
//   eyebrow: 'Abstract & Character — Blender',
//   title: 'Form, studied<br>in the <em>dark</em>.',
//   description:
//     'A working archive of abstract objects and characters, rendered as quiet specimens under a single light.',
//   side: 'left',
//   kind: 'sphere',
//   base: 0xe7cba1,
//   edge: 0xb9c0cc,
//   sy: 1.12,
//   sz: 1.0
// };

export const HERO = {
  variant: 'hero',
  eyebrow: 'Abstract & Character — Blender',
  title: 'Form, studied<br>in the <em>dark</em>.',
  description:
    'A working archive of abstract objects and characters.',
  side: 'left',
  code: '02', title: 'Anhelo<br><em>Reka</em>', side: 'left',
  kind: 'oval', base: 0xe7cba1, edge: 0xaeb6c4,   // keep these
  model: 'assets/models/Angel Fortified.glb'                  // ← your model
};

export const SPECIMENS = [
  {
    code: '01',
    eyebrow: '01 — Specimen',
    title: 'Fortified <em>Angel</em>',
    description:
      'A fortified angel - ready for war or peace, for retribution or forgiveness.',
    meta: 'Sculpt · Retopo · Lookdev — 2025',
    side: 'right',
    kind: 'oval',
    base: 0xe7cba1,
    edge: 0xaeb6c4,
    sy: 1.28,
    sz: 0.72,
    model: 'assets/models/Angel Fortified.glb'
  },
  {
    code: '02',
    eyebrow: '02 — Specimen',
    title: 'Xeno <em>Hand</em>',
    description:
      'Five fingers pushed just past the human — proportion made strange, kept as evidence.',
    meta: 'Sculpt · Retopo · Lookdev — 2025',
    side: 'right',
    kind: 'oval',
    base: 0xe7cba1,
    edge: 0xaeb6c4,
    sy: 1.28,
    sz: 0.72,
    model: 'assets/models/Alien Hand.glb'
  },
  {
    code: '03',
    eyebrow: '03 — Specimen',
    title: 'Deathly <em>Hollows</em>',
    description:
      'A triangle, a circle, a line — three marks stacked into one sign and held in the dark.',
    meta: 'Concept · Modeling · Materials — 2024',
    side: 'left',
    kind: 'lattice',
    base: 0xaec2d6,
    edge: 0x8fb0c8,
    sy: 1.28,
    sz: 0.72,
    model: 'assets/models/Deathly Hollows.glb'
  },
  {
    code: '04',
    eyebrow: '04 — Specimen',
    title: 'Old Monster, <em>Hand</em>',
    description:
      'A gnarled claw kept under glass — knuckles like knots, nails like old iron.',
    meta: 'Sculpt · Displacement · Lookdev — 2025',
    side: 'right',
    kind: 'knot',
    base: 0xe8c49a,
    edge: 0xd9a066,
    sy: 1.28,
    sz: 0.72,
    model: 'assets/models/OldMonsterHand.glb'
  },
  {
    code: '05',
    eyebrow: '05 — Specimen',
    title: 'Serpetine <em></em>',
    description:
      'One continuous body folding through itself — motion caught the instant before it slides.',
    meta: 'Modeling · Curves · Materials — 2026',
    side: 'left',
    kind: 'knot',
    base: 0xe7cba1,
    edge: 0xb9c0cc,
    sy: 1.28,
    sz: 0.72,
    model: 'assets/models/Serpetine.glb'
  },
  {
    code: '06',
    eyebrow: '06 — Specimen',
    title: 'Theological <em>Vigilism</em>',
    description:
      'An object caught in the act of watching — devotion abstracted into pure attention.',
    meta: 'Concept · Sculpt · Lookdev — 2026',
    side: 'right',
    kind: 'sphere',
    base: 0xaec2d6,
    edge: 0xaeb6c4,
    sy: 1.28,
    sz: 0.72,
    model: 'assets/models/Theological vigilism.glb'
  },
  {
    code: '07',
    eyebrow: '07 — Specimen',
    title: 'Veined <em>Hand</em>',
    description:
      'Anatomy turned nearly inside-out — the map of pressure that runs beneath the skin.',
    meta: 'Sculpt · Anatomy · Materials — 2025',
    side: 'left',
    kind: 'oval',
    base: 0xe8c49a,
    edge: 0xd9a066,
    sy: 1.3,
    sz: 0.7,
    model: 'assets/models/VeinsHand.glb'
  },
  {
    code: '08',
    eyebrow: '08 — Specimen',
    title: 'Virgil, <em>Framed</em>',
    description:
      'A guide held at the threshold — portrait and object, and never quite either.',
    meta: 'Modeling · Retopo · Lookdev — 2024',
    side: 'right',
    kind: 'lattice',
    base: 0xe7cba1,
    edge: 0xaeb6c4,
    sy: 1.28,
    sz: 0.72,
    model: 'assets/models/Virgil Frame.glb'
  },
  {
    code: '09',
    eyebrow: '09 — Specimen',
    title: 'Wrinkled <em>Hand</em>',
    description:
      'Time recorded in creases — a study of age as surface, shadow and slow collapse.',
    meta: 'Sculpt · Displacement · Lookdev — 2025',
    side: 'left',
    kind: 'oval',
    base: 0xe7cba1,
    edge: 0xb9c0cc,
    sy: 1.22,
    sz: 0.74,
    model: 'assets/models/Wrinkled Hand.glb'
  }
  // → Add the next specimen here. The sequence, snap points and camera all extend.
];

/* The ordered list of "acts" the experience plays through. Do not edit —
   derived from HERO + SPECIMENS so the count stays in one place. */
export const ACTS = [HERO, ...SPECIMENS];
