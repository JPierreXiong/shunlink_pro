#!/usr/bin/env node

import { existsSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const TARGET_DIRS = ['.next', '.cfbuild'];
const MAX_CLEAN_RETRIES = 6;
const RETRY_DELAY_MS = 1200;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function tryRemoveDir(dirPath) {
  if (!existsSync(dirPath)) return true;

  try {
    rmSync(dirPath, { recursive: true, force: true, maxRetries: 2, retryDelay: 100 });
    return true;
  } catch {
    return false;
  }
}

async function cleanBuildDirs() {
  for (const dir of TARGET_DIRS) {
    const abs = resolve(process.cwd(), dir);
    let removed = false;

    for (let i = 1; i <= MAX_CLEAN_RETRIES; i++) {
      removed = tryRemoveDir(abs);
      if (removed) {
        console.log(`[cf-build] cleaned ${dir} (attempt ${i})`);
        break;
      }

      console.warn(`[cf-build] ${dir} is busy, retry ${i}/${MAX_CLEAN_RETRIES}...`);
      await sleep(RETRY_DELAY_MS);
    }

    if (!removed) {
      throw new Error(
        `[cf-build] failed to clean ${dir}. Please close dev server/Explorer tabs and retry.`
      );
    }
  }
}

function runCmd(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  await cleanBuildDirs();
  runCmd('opennextjs-cloudflare', ['build']);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

