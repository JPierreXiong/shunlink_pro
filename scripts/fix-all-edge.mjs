#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TARGET_DIR = './src/app';
const EDGE_RUNTIME_REGEX = /^export const runtime\s*=\s*['"]edge['"];\r?\n?/m;

function isTargetFile(file) {
  return file === 'page.tsx' || file === 'route.ts';
}

function fixFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const next = content.replace(EDGE_RUNTIME_REGEX, '');

  if (next !== content) {
    writeFileSync(filePath, next, 'utf8');
    return true;
  }

  return false;
}

function walk(dir) {
  const files = readdirSync(dir);
  let changed = 0;

  for (const file of files) {
    const filePath = join(dir, file);

    if (statSync(filePath).isDirectory()) {
      changed += walk(filePath);
      continue;
    }

    if (!isTargetFile(file)) continue;

    if (fixFile(filePath)) {
      changed += 1;
      console.log(`[fix-all-edge] removed edge runtime: ${filePath}`);
    }
  }

  return changed;
}

console.log('[fix-all-edge] start');
const total = walk(TARGET_DIR);
console.log(`[fix-all-edge] done, changed=${total}`);
