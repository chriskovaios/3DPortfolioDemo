#!/usr/bin/env node
// Zero-dependency model compressor.
// Optimizes every .glb in raw/ into assets/models/ using @gltf-transform/cli
// (fetched on demand via npx — nothing to install). Runs the geometry passes
// (Draco/Meshopt, weld, simplify, prune, …); a 10-15 MB Blender export
// typically drops to a few MB. See assets/models/README.txt.
//
// Textures are left uncompressed by default because KTX2 needs the external
// KTX-Software `ktx` binary. To also compress textures, pass a format:
//   npm run compress-models -- ktx2   (best VRAM; needs KTX-Software installed)
//   npm run compress-models -- webp   (smallest download; no system install)
// or set TEXTURE_COMPRESS=ktx2. Valid: ktx2 | webp | avif | auto | false.
//
// Usage: npm run compress-models

import { spawnSync } from 'node:child_process';
import { readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const rawDir = resolve(root, 'raw');
const outDir = resolve(root, 'assets/models');

// Texture compression: CLI arg > env > default (off). false = geometry only.
const texture = process.argv[2] || process.env.TEXTURE_COMPRESS || 'false';

let files;
try {
  files = readdirSync(rawDir).filter((f) => f.toLowerCase().endsWith('.glb'));
} catch {
  console.error(`No raw folder found at ${rawDir}`);
  console.error('Create it and drop your raw .glb exports there, then re-run.');
  process.exit(1);
}

if (files.length === 0) {
  console.log(`No .glb files in ${rawDir} — nothing to compress.`);
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });

console.log(
  `Compressing ${files.length} model(s)  |  geometry: meshopt  |  textures: ${texture}`
);

// Quote every path so filenames with spaces survive the shell. shell:true is
// required both to resolve `npx` (npx.cmd on Windows) and to parse the quotes.
const q = (s) => `"${s}"`;
let failed = 0;

for (const file of files) {
  const input = join(rawDir, file);
  const output = join(outDir, file);
  console.log(`\n→ ${file}`);

  const cmd =
    `npx @gltf-transform/cli optimize ${q(input)} ${q(output)}` +
    ` --texture-compress ${texture}`;
  const result = spawnSync(cmd, { stdio: 'inherit', shell: true });

  if (result.error || result.status !== 0) {
    failed++;
    console.error(`✗ Failed to compress ${file}`);
  }
}

console.log(
  `\nDone: ${files.length - failed}/${files.length} compressed into ${outDir}`
);
process.exit(failed > 0 ? 1 : 0);
