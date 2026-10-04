import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve(import.meta.dirname, '..', 'dist', 'images');
const unusedOriginals = [
  'products',
  'american-made.png',
  'family-pic.jpg',
  'finn-approved.png',
  'hero-boards.png',
  'primary-logo-main.png',
  'tab-logo.png'
];

await Promise.all(unusedOriginals.map(path => rm(resolve(output, path), { force: true, recursive: true })));
