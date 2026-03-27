#!/usr/bin/env node

import { existsSync, rmSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';

const TARGET_DIRS = ['.next', '.open-next'];
const MAX_CLEAN_RETRIES = 6;
const RETRY_DELAY_MS = 1200;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function tryRemoveDir(dirPath) {
  if (!existsSync(dirPath)) return true;
  try {
    rmSync(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
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

function runCmd(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...opts.env },
  });
  if (result.status !== 0 && !opts.ignoreError) {
    process.exit(result.status ?? 1);
  }
  return result.status;
}

/**
 * Windows workaround: After OpenNext runs its internal next build,
 * the .next/server/ directory files may not be readable due to Windows
 * filesystem timing. We patch by copying known manifests from a
 * pre-built .next-prebuild/ snapshot.
 */
function patchServerManifests(prebuildDir) {
  const cwd = process.cwd();
  const srcServer = join(prebuildDir, 'server');
  const destServer = join(cwd, '.next', 'server');

  if (!existsSync(srcServer)) {
    console.warn('[cf-build] No prebuild server dir found, skipping patch.');
    return;
  }

  const manifests = readdirSync(srcServer).filter(f => f.endsWith('.json'));
  let patched = 0;

  for (const file of manifests) {
    const dest = join(destServer, file);
    if (!existsSync(dest)) {
      copyFileSync(join(srcServer, file), dest);
      console.log(`[cf-build] patched missing: server/${file}`);
      patched++;
    }
  }

  if (patched === 0) {
    console.log('[cf-build] All manifests already present, no patch needed.');
  }
}

async function main() {
  const cwd = process.cwd();
  const prebuildDir = join(cwd, '.next-prebuild');

  await cleanBuildDirs();

  // Also clean stale prebuild snapshot
  if (existsSync(prebuildDir)) {
    rmSync(prebuildDir, { recursive: true, force: true });
  }

  // Step 1: Run next build with DOCKER=true so next.config outputs 'standalone'
  // DISABLE_NFT=true skips outputFileTracing to avoid Windows ENOENT on .nft.json files
  console.log('[cf-build] Step 1: next build (pre-run for manifest snapshot)...');
  runCmd('pnpm', ['next', 'build'], { env: { DOCKER: 'true', DISABLE_NFT: 'true' } });

  // Step 2: snapshot the server manifests
  console.log('[cf-build] Step 2: snapshotting server manifests...');
  mkdirSync(join(prebuildDir, 'server'), { recursive: true });
  const srcServer = join(cwd, '.next', 'server');
  const manifests = readdirSync(srcServer).filter(f => f.endsWith('.json'));
  for (const file of manifests) {
    copyFileSync(join(srcServer, file), join(prebuildDir, 'server', file));
  }
  // Also snapshot required-server-files.json from .next root
  const rsf = join(cwd, '.next', 'required-server-files.json');
  if (existsSync(rsf)) {
    copyFileSync(rsf, join(prebuildDir, 'required-server-files.json'));
  }
  console.log(`[cf-build] snapshotted ${manifests.length} manifests.`);

  // Step 3: Run OpenNext build (it will re-run next build internally)
  // Pass DOCKER=true so next.config.mjs sets output:'standalone' (required by OpenNext)
  console.log('[cf-build] Step 3: opennextjs-cloudflare build...');
  let status = runCmd('opennextjs-cloudflare', ['build'], { ignoreError: true, env: { DOCKER: 'true', DISABLE_NFT: 'true' } });

  if (status !== 0) {
    console.warn('[cf-build] OpenNext build failed, attempting manifest patch and retry...');
    patchServerManifests(prebuildDir);

    // Also patch required-server-files.json at .next root
    const rsfDest = join(cwd, '.next', 'required-server-files.json');
    const rsfSrc = join(prebuildDir, 'required-server-files.json');
    if (!existsSync(rsfDest) && existsSync(rsfSrc)) {
      copyFileSync(rsfSrc, rsfDest);
      console.log('[cf-build] patched required-server-files.json');
    }

    // Also patch into .open-next/.next/server/ if that path exists
    const openNextServer = join(cwd, '.open-next', '.next', 'server');
    if (existsSync(openNextServer)) {
      const manifests2 = readdirSync(join(prebuildDir, 'server'));
      for (const file of manifests2) {
        const dest = join(openNextServer, file);
        if (!existsSync(dest)) {
          copyFileSync(join(prebuildDir, 'server', file), dest);
          console.log(`[cf-build] patched .open-next: server/${file}`);
        }
      }
    }

    console.log('[cf-build] Retrying opennextjs-cloudflare build...');
    runCmd('opennextjs-cloudflare', ['build']);
  }

  console.log('[cf-build] Build complete!');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
