import { readFileSync, writeFileSync, mkdirSync, existsSync, realpathSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import fetch from 'node-fetch';

const UPDATE_DIR = join(homedir(), '.postiz');
const UPDATE_FILE = join(UPDATE_DIR, 'update-check.json');
const CHECK_INTERVAL = 2 * 24 * 60 * 60 * 1000;
const REGISTRY_URL = 'https://registry.npmjs.org/postiz/latest';

const currentVersion: string = require('../package.json').version;

function loadMarker(): { lastCheck: number } | null {
  try {
    if (!existsSync(UPDATE_FILE)) return null;
    const data = JSON.parse(readFileSync(UPDATE_FILE, 'utf-8'));
    if (typeof data.lastCheck !== 'number') return null;
    return data;
  } catch {
    return null;
  }
}

function saveMarker(): void {
  try {
    if (!existsSync(UPDATE_DIR)) {
      mkdirSync(UPDATE_DIR, { recursive: true, mode: 0o700 });
    }
    writeFileSync(UPDATE_FILE, JSON.stringify({ lastCheck: Date.now() }), 'utf-8');
  } catch {
    // ignore
  }
}

type Manager =
  | { kind: 'ephemeral' }
  | { kind: 'auto'; cmd: string; args: string[]; manual: string }
  | { kind: 'local' }
  | { kind: 'unknown' };

function detectManager(): Manager {
  let entry: string;
  try {
    entry = realpathSync(process.argv[1]);
  } catch {
    return { kind: 'unknown' };
  }
  if (entry.includes('/_npx/') || entry.includes('/.bun/install/cache/')) return { kind: 'ephemeral' };
  const packageRoot = dirname(dirname(entry)); // dist/index.js -> package dir
  if (dirname(packageRoot).endsWith('/lib/node_modules'))
    return { kind: 'auto', cmd: 'npm', args: ['install', '-g', 'postiz@latest'], manual: 'npm install -g postiz@latest' };
  if (entry.includes('/pnpm/global/') || entry.includes('/pnpm/store/'))
    return { kind: 'auto', cmd: 'pnpm', args: ['add', '-g', 'postiz@latest'], manual: 'pnpm add -g postiz@latest' };
  if (entry.includes('/yarn/global/'))
    return { kind: 'auto', cmd: 'yarn', args: ['global', 'add', 'postiz@latest'], manual: 'yarn global add postiz@latest' };
  if (entry.includes('/.bun/install/global/'))
    return { kind: 'auto', cmd: 'bun', args: ['add', '-g', 'postiz@latest'], manual: 'bun add -g postiz@latest' };
  // Windows paths use backslashes and match none of the above, landing here as 'unknown'.
  if (entry.includes('/node_modules/')) return { kind: 'local' };
  return { kind: 'unknown' };
}

// Version of the package process.argv[1] resolves to right now (re-resolved so an
// upgrade that replaced symlinks — e.g. pnpm's store links — is picked up).
function installedVersionNow(): string | null {
  try {
    const entry = realpathSync(process.argv[1]);
    return JSON.parse(readFileSync(join(dirname(dirname(entry)), 'package.json'), 'utf-8')).version;
  } catch {
    return null;
  }
}

// Runs the manager's install and returns a verified re-exec target: [execPath, argv0]
// for a spawn that is guaranteed to run the new version, or null if the update can't
// be confirmed. Only ever re-exec a target proven to be `latest`, so a child's own
// check finds nothing newer and recursion is impossible.
function runInstall(manager: { cmd: string; args: string[]; manual: string }, latest: string): string[] | null {
  const { spawnSync } = require('child_process');
  const install = spawnSync(manager.cmd, manager.args, { stdio: ['ignore', 'ignore', 'inherit'], timeout: 120000 });
  if (install.status !== 0) {
    process.stderr.write(`Update failed. Run manually: ${manager.manual}\n`);
    return null;
  }
  if (installedVersionNow() === latest) return [process.execPath, process.argv[1]];
  // Some managers (pnpm) relocate the package and repoint the bin instead of
  // updating in place — fall back to the PATH-resolved bin if it is the new version.
  const bin = spawnSync('postiz', ['--version'], { encoding: 'utf-8', timeout: 10000 });
  if (bin.status === 0 && typeof bin.stdout === 'string' && bin.stdout.trim() === latest) return ['postiz'];
  process.stderr.write(`Update did not apply to this install. Run manually: ${manager.manual}\n`);
  return null;
}

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch(REGISTRY_URL, { signal: controller.signal as any });
      if (!response.ok) return null;
      const data = (await response.json()) as any;
      return typeof data.version === 'string' ? data.version : null;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

function isNewer(latest: string, current: string): boolean {
  const a = latest.split('.');
  const b = current.split('.');
  if (a.length !== 3 || b.length !== 3) return false;
  for (let i = 0; i < 3; i++) {
    if (!/^\d+$/.test(a[i]) || !/^\d+$/.test(b[i])) return false;
    const diff = parseInt(a[i], 10) - parseInt(b[i], 10);
    if (diff > 0) return true;
    if (diff < 0) return false;
  }
  return false;
}

export async function maybeAutoUpdate(argv: string[]): Promise<void> {
  try {
    if (argv.some((a) => ['--version', '-v', '--help', '-h'].includes(a))) return;
    if (argv[0] === 'update') return;
    const marker = loadMarker();
    if (marker && Date.now() - marker.lastCheck < CHECK_INTERVAL) return;
    const manager = detectManager();
    if (manager.kind === 'ephemeral') return;
    // Written before the fetch so concurrent commands can't both start a check.
    saveMarker();
    const latest = await fetchLatestVersion();
    if (!latest || !isNewer(latest, currentVersion)) return;
    // Print recommendations after the command's output so they stay visible.
    if (manager.kind === 'local') {
      process.on('exit', () =>
        process.stderr.write(`A newer postiz version (${latest}) is available. This install is project-local — update it in that project's package.json.\n`)
      );
      return;
    }
    if (manager.kind === 'unknown') {
      process.on('exit', () => process.stderr.write(`A newer postiz version (${latest}) is available.\n`));
      return;
    }
    const { spawnSync } = require('child_process');
    process.stderr.write(`Checking for updates... updating ${currentVersion} -> ${latest}\n`);
    const target = runInstall(manager, latest);
    if (!target) return;
    const r = spawnSync(target[0], [...target.slice(1), ...process.argv.slice(2)], { stdio: 'inherit' });
    if (r.error) return;
    process.exit(r.status ?? 1);
  } catch {
    // never break the user's command
  }
}

export async function updateCommand(): Promise<void> {
  try {
    const manager = detectManager();
    if (manager.kind === 'ephemeral') {
      process.stderr.write('Running via npx — nothing installed to update.\n');
      return;
    }
    const latest = await fetchLatestVersion();
    saveMarker();
    if (!latest) {
      process.stderr.write('Could not reach the npm registry to check for updates.\n');
      return;
    }
    if (!isNewer(latest, currentVersion)) {
      process.stderr.write(`postiz ${currentVersion} is up to date.\n`);
      return;
    }
    if (manager.kind === 'local') {
      process.stderr.write(`A newer postiz version (${latest}) is available, but this is a project-local install — update it in that project's package.json.\n`);
      return;
    }
    if (manager.kind === 'unknown') {
      process.stderr.write(`A newer postiz version (${latest}) is available. Update it with the package manager it was installed with.\n`);
      return;
    }
    process.stderr.write(`Updating ${currentVersion} -> ${latest}\n`);
    if (runInstall(manager, latest)) {
      process.stderr.write(`Updated to postiz ${latest}.\n`);
    }
  } catch {
    // never fail
  }
}
