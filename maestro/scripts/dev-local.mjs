#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const maestroRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(maestroRoot, '..');
const backendDir = path.join(maestroRoot, 'backend');
const frontendDir = path.join(maestroRoot, 'frontend');
const defaultEnvFile = path.join(maestroRoot, 'env', 'dev.env');

const managedProcesses = [];
let shuttingDown = false;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  process.once('SIGINT', () => {
    void shutdown(0);
  });
  process.once('SIGTERM', () => {
    void shutdown(0);
  });

  const envFile = path.resolve(process.cwd(), args.env ?? process.env.MAESTRO_ENV_FILE ?? defaultEnvFile);
  const fileEnv = existsSync(envFile) ? await readEnvFile(envFile) : {};
  const env = { ...fileEnv, ...process.env };

  const databaseURL = env.MAESTRO_DATABASE_URL || 'postgres://postgres@localhost:5432/maestro_local?sslmode=disable';
  const httpAddr = env.MAESTRO_HTTP_ADDR || '127.0.0.1:8787';
  const apiURL = normalizeURL(env.MAESTRO_API_URL || httpAddrToURL(httpAddr));
  const artifactRoot = resolveMaestroPath(env.MAESTRO_ARTIFACT_ROOT || 'artifacts/current');
  const frontendHost = env.MAESTRO_FRONTEND_HOST || '127.0.0.1';
  const frontendPort = env.MAESTRO_FRONTEND_PORT || '8788';
  const frontendURL = `http://${frontendHost}:${frontendPort}`;
  const ports = [
    { label: 'api', port: portFromURL(apiURL) },
    { label: 'frontend', port: Number(frontendPort) }
  ];

  log('env', existsSync(envFile) ? path.relative(repoRoot, envFile) : 'process environment/defaults');
  log('database', redactDatabaseURL(databaseURL));
  log('artifacts', path.relative(repoRoot, artifactRoot));

  if (!args.noKillPorts) {
    await ensurePortsFree(ports);
  }

  await mkdir(artifactRoot, { recursive: true });

  if (!args.skipMigrate) {
    log('migrate', 'go run ./cmd/migrate');
    await runOnce('migrate', 'go', ['run', './cmd/migrate'], {
      cwd: backendDir,
      env: backendEnv({ env, databaseURL, artifactRoot, httpAddr: '127.0.0.1:0' })
    });
  }

  const api = startManaged('api', 'go', ['run', './cmd/api'], {
    cwd: backendDir,
    env: backendEnv({ env, databaseURL, artifactRoot, httpAddr })
  });
  await waitForReady(new URL('/readyz', apiURL), api, 'api');

  const frontend = startManaged('frontend', 'pnpm', ['exec', 'vite', '--host', frontendHost, '--port', frontendPort, '--strictPort'], {
    cwd: frontendDir,
    env: frontendEnv(env, apiURL)
  });
  await waitForReady(frontendURL, frontend, 'frontend');

  process.stdout.write(`\nMaestro Cockpit is running:\n`);
  process.stdout.write(`  API:      ${apiURL}\n`);
  process.stdout.write(`  Cockpit:  ${frontendURL}\n`);
  process.stdout.write(`  DB:       ${redactDatabaseURL(databaseURL)}\n`);
  process.stdout.write(`\nPress Ctrl+C to stop both processes.\n\n`);

  const firstExit = await Promise.race(managedProcesses.map((item) => item.closed.then((exit) => ({ ...item, exit }))));
  if (!shuttingDown) {
    throw new Error(`${firstExit.name} exited unexpectedly with ${firstExit.exit}.`);
  }
}

function startManaged(name, command, args, options) {
  log(name, `${command} ${args.join(' ')}`);
  const child = spawn(command, args, {
    ...options,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  pipeWithPrefix(child.stdout, name, process.stdout);
  pipeWithPrefix(child.stderr, name, process.stderr);

  let exit = null;
  const closed = new Promise((resolve) => {
    child.once('close', (code, signal) => {
      exit = code ?? signal ?? 0;
      resolve(exit);
    });
  });

  const item = {
    child,
    closed,
    name,
    get exit() {
      return exit;
    }
  };
  managedProcesses.push(item);
  return item;
}

async function runOnce(name, command, args, options) {
  const child = spawn(command, args, {
    ...options,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let logs = '';
  child.stdout.on('data', (chunk) => {
    logs += String(chunk);
    process.stdout.write(`[${name}] ${chunk}`);
  });
  child.stderr.on('data', (chunk) => {
    logs += String(chunk);
    process.stderr.write(`[${name}] ${chunk}`);
  });
  const code = await new Promise((resolve) => {
    child.once('close', (exitCode, signal) => resolve(exitCode ?? signal ?? 0));
  });
  if (code !== 0) {
    throw new Error(`${name} failed with ${code}.\n${logs}`);
  }
}

async function waitForReady(url, processItem, label) {
  const readyURL = typeof url === 'string' ? url : url.toString();
  for (let i = 0; i < 120; i += 1) {
    if (processItem.exit !== null) {
      throw new Error(`${label} exited before ready with ${processItem.exit}.`);
    }
    try {
      const response = await fetch(readyURL);
      if (response.ok) {
        log(`${label} ready`, readyURL);
        return;
      }
    } catch {
      // Retry until timeout.
    }
    await sleep(500);
  }
  throw new Error(`${label} did not become ready at ${readyURL}.`);
}

async function ensurePortsFree(targets) {
  const seen = new Set();
  for (const target of targets) {
    if (!Number.isInteger(target.port) || target.port <= 0) {
      throw new Error(`Invalid ${target.label} port: ${target.port}`);
    }
    if (seen.has(target.port)) {
      continue;
    }
    seen.add(target.port);

    const pids = await listeningPIDs(target.port);
    if (pids.length === 0) {
      log('port free', `${target.label} :${target.port}`);
      continue;
    }

    log('port busy', `${target.label} :${target.port} pid=${pids.join(',')}`);
    await terminatePIDs(pids, target);
    await waitForPortFree(target);
  }
}

async function listeningPIDs(port) {
  const result = await runCapture('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t']);
  if (result.code === 1 && result.stdout.trim() === '') {
    return [];
  }
  if (result.code !== 0) {
    throw new Error(`Could not inspect port ${port} with lsof.\n${result.stderr || result.stdout}`);
  }
  return [...new Set(result.stdout.split(/\s+/).map((item) => Number(item)).filter((pid) => Number.isInteger(pid) && pid > 0))]
    .filter((pid) => pid !== process.pid);
}

async function runCapture(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.once('error', (error) => {
      if (error.code === 'ENOENT') {
        reject(new Error(`${command} is required to free busy ports automatically.`));
      } else {
        reject(error);
      }
    });
    child.once('close', (code, signal) => {
      resolve({ code: code ?? signal ?? 0, stdout, stderr });
    });
  });
}

async function terminatePIDs(pids, target) {
  for (const pid of pids) {
    log('terminate', `${target.label} :${target.port} pid=${pid}`);
    killPID(pid, 'SIGTERM');
  }

  const terminated = await waitForPIDsToExit(pids, 5000);
  if (terminated) {
    return;
  }

  const remaining = pids.filter(pidExists);
  for (const pid of remaining) {
    log('kill', `${target.label} :${target.port} pid=${pid}`);
    killPID(pid, 'SIGKILL');
  }
  await waitForPIDsToExit(remaining, 5000);
}

async function waitForPIDsToExit(pids, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (pids.every((pid) => !pidExists(pid))) {
      return true;
    }
    await sleep(250);
  }
  return pids.every((pid) => !pidExists(pid));
}

async function waitForPortFree(target) {
  for (let i = 0; i < 40; i += 1) {
    const pids = await listeningPIDs(target.port);
    if (pids.length === 0) {
      log('port free', `${target.label} :${target.port}`);
      return;
    }
    await sleep(250);
  }
  throw new Error(`${target.label} port ${target.port} is still busy after stopping existing services.`);
}

function killPID(pid, signal) {
  try {
    process.kill(pid, signal);
  } catch (error) {
    if (error.code !== 'ESRCH') {
      throw error;
    }
  }
}

function pidExists(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code !== 'ESRCH';
  }
}

async function shutdown(code) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  for (const item of [...managedProcesses].reverse()) {
    await stopManaged(item);
  }
  process.exit(code);
}

async function stopManaged(item) {
  if (!item || item.exit !== null) {
    return;
  }
  log('stop', item.name);
  try {
    if (process.platform === 'win32') {
      item.child.kill('SIGTERM');
    } else {
      process.kill(-item.child.pid, 'SIGTERM');
    }
  } catch {
    item.child.kill('SIGTERM');
  }

  const stopped = await Promise.race([item.closed.then(() => true), sleep(5000).then(() => false)]);
  if (!stopped) {
    try {
      if (process.platform === 'win32') {
        item.child.kill('SIGKILL');
      } else {
        process.kill(-item.child.pid, 'SIGKILL');
      }
    } catch {
      item.child.kill('SIGKILL');
    }
    await item.closed;
  }
}

function pipeWithPrefix(stream, label, output) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += String(chunk);
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.length > 0) {
        output.write(`[${label}] ${line}\n`);
      }
    }
  });
  stream.on('end', () => {
    if (buffer.length > 0) {
      output.write(`[${label}] ${buffer}\n`);
      buffer = '';
    }
  });
}

function backendEnv({ env, databaseURL, artifactRoot, httpAddr }) {
  return {
    ...withToolchainPath(env),
    MAESTRO_DATABASE_URL: databaseURL,
    MAESTRO_ARTIFACT_ROOT: artifactRoot,
    MAESTRO_HTTP_ADDR: httpAddr,
    MAESTRO_MIGRATIONS_DIR: env.MAESTRO_MIGRATIONS_DIR || 'migrations',
    MAESTRO_RUN_MIGRATIONS: 'false'
  };
}

function frontendEnv(env, apiURL) {
  return {
    ...withToolchainPath(env),
    VITE_MAESTRO_API_URL: env.VITE_MAESTRO_API_URL || '',
    VITE_MAESTRO_API_PROXY_TARGET: apiURL
  };
}

function withToolchainPath(env) {
  const next = { ...env };
  const homebrewBin = '/opt/homebrew/bin';
  if (existsSync(homebrewBin)) {
    const current = next.PATH || process.env.PATH || '';
    const parts = current.split(path.delimiter).filter(Boolean);
    if (parts[0] !== homebrewBin) {
      next.PATH = [homebrewBin, ...parts.filter((part) => part !== homebrewBin)].join(path.delimiter);
    }
  }
  return next;
}

async function readEnvFile(file) {
  const out = {};
  const raw = await readFile(file, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const index = trimmed.indexOf('=');
    if (index === -1) {
      continue;
    }
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--skip-migrate') {
      args.skipMigrate = true;
    } else if (arg === '--no-kill-ports') {
      args.noKillPorts = true;
    } else if (arg === '--env') {
      args.env = argv[++i];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function resolveMaestroPath(value) {
  return path.isAbsolute(value) ? value : path.resolve(maestroRoot, value);
}

function httpAddrToURL(addr) {
  return `http://${addr}`;
}

function normalizeURL(value) {
  return value.replace(/\/+$/, '');
}

function portFromURL(value) {
  const url = new URL(value);
  if (url.port) {
    return Number(url.port);
  }
  return url.protocol === 'https:' ? 443 : 80;
}

function redactDatabaseURL(value) {
  try {
    const url = new URL(value);
    if (url.password) {
      url.password = '***';
    }
    return url.toString();
  } catch {
    return value;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(label, value) {
  process.stdout.write(`[maestro-dev] ${label}: ${value}\n`);
}

function usage() {
  return `Usage: node maestro/scripts/dev-local.mjs [--env maestro/env/dev.env] [--skip-migrate] [--no-kill-ports]

Starts the local Maestro Cockpit stack:
  - frees API/frontend ports by stopping existing listeners
  - runs migrations against MAESTRO_DATABASE_URL
  - starts the Go API
  - starts the Vite/MUI frontend

Default env file:
  maestro/env/dev.env`;
}

main().catch(async (error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  await shutdown(1);
});
