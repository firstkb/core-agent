#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const maestroRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(maestroRoot, '..');
const backendDir = path.join(maestroRoot, 'backend');
const cliPath = path.join(maestroRoot, 'cli', 'bin', 'maestroctl');
const defaultEnvFile = path.join(maestroRoot, 'env', 'local.env');

const knownTables = [
  'external_links',
  'comments',
  'run_events',
  'approvals',
  'evidence',
  'attempts',
  'agent_runs',
  'agent_roles',
  'stages',
  'task_dependencies',
  'tasks',
  'features',
  'work',
  'repositories',
  'workspaces',
  'schema_migrations'
];

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  const envFile = path.resolve(process.cwd(), args.env ?? process.env.MAESTRO_ENV_FILE ?? defaultEnvFile);
  const fileEnv = existsSync(envFile) ? await readEnvFile(envFile) : {};
  const env = { ...fileEnv, ...process.env };

  const databaseURL = env.MAESTRO_SMOKE_DATABASE_URL || env.MAESTRO_DATABASE_URL;
  if (!databaseURL) {
    throw new Error(`MAESTRO_SMOKE_DATABASE_URL is required. Add it to ${path.relative(repoRoot, envFile)} or export it.`);
  }

  const httpAddr = env.MAESTRO_SMOKE_HTTP_ADDR || '127.0.0.1:18787';
  const apiURL = normalizeURL(env.MAESTRO_SMOKE_API_URL || httpAddrToURL(httpAddr));
  const artifactRoot = resolveMaestroPath(env.MAESTRO_SMOKE_ARTIFACT_ROOT || 'artifacts/smoke');
  const resetDatabase = truthy(env.MAESTRO_SMOKE_RESET_DATABASE);
  const resetArtifacts = env.MAESTRO_SMOKE_RESET_ARTIFACTS === undefined || truthy(env.MAESTRO_SMOKE_RESET_ARTIFACTS);
  const tempDir = await mkTempDir();

  let api = null;
  try {
    log('env', existsSync(envFile) ? path.relative(repoRoot, envFile) : 'process environment only');
    log('database', redactDatabaseURL(databaseURL));
    log('api', apiURL);
    log('artifacts', path.relative(repoRoot, artifactRoot));

    await ensureCleanDatabase(databaseURL, resetDatabase);
    await prepareArtifactRoot(artifactRoot, resetArtifacts);
    await runMigrations({ databaseURL, artifactRoot });

    api = await startAPI({ databaseURL, artifactRoot, httpAddr, apiURL });
    const result = await runVerticalFlow({ apiURL, databaseURL, artifactRoot, tempDir });

    await stopAPI(api);
    api = await startAPI({ databaseURL, artifactRoot, httpAddr, apiURL });
    await verifyPersistence({ apiURL, result });

    const runEventCount = await countRunEvents(databaseURL, result);
    if (runEventCount < 8) {
      throw new Error(`Expected at least 8 run_events for smoke flow, found ${runEventCount}.`);
    }

    process.stdout.write(`${JSON.stringify({
      ok: true,
      work_id: result.work.id,
      task_id: result.task.id,
      stage_id: result.stage.id,
      attempt_id: result.attempt.id,
      agent_run_id: result.agentRun.id,
      evidence_uri: result.evidence.uri,
      handoff_uri: result.submittedAttempt.handoff_path,
      readme_uri: result.submittedAttempt.readme_path,
      run_event_count: runEventCount,
      api_url: apiURL,
      artifact_root: artifactRoot
    }, null, 2)}\n`);
  } finally {
    if (api) {
      await stopAPI(api);
    }
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function ensureCleanDatabase(databaseURL, resetDatabase) {
  const tables = await listExistingMaestroTables(databaseURL);
  if (tables.length === 0) {
    log('database check', 'clean');
    return;
  }

  if (!resetDatabase) {
    throw new Error(
      `Smoke database already has Maestro tables: ${tables.join(', ')}. ` +
      'Use a disposable database or set MAESTRO_SMOKE_RESET_DATABASE=true.'
    );
  }

  log('database reset', `dropping ${tables.length} known Maestro tables`);
  const dropSQL = `
DROP TABLE IF EXISTS ${knownTables.map(quoteIdent).join(', ')} CASCADE;
DROP FUNCTION IF EXISTS maestro_set_updated_at() CASCADE;`;
  await psql(databaseURL, dropSQL);
}

async function listExistingMaestroTables(databaseURL) {
  const values = knownTables.map((table) => `'${table.replaceAll("'", "''")}'`).join(', ');
  const sql = `
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = ANY (ARRAY[${values}])
ORDER BY tablename;`;
  const out = await psql(databaseURL, sql);
  return out.split('\n').map((line) => line.trim()).filter(Boolean);
}

async function prepareArtifactRoot(artifactRoot, resetArtifacts) {
  if (resetArtifacts) {
    assertSafeArtifactRoot(artifactRoot);
    await rm(artifactRoot, { recursive: true, force: true });
  }
  await mkdir(artifactRoot, { recursive: true });
}

async function runMigrations({ databaseURL, artifactRoot }) {
  log('migrate', 'go run ./cmd/migrate');
  await exec('go', ['run', './cmd/migrate'], {
    cwd: backendDir,
    env: backendEnv({ databaseURL, artifactRoot, httpAddr: '127.0.0.1:0' })
  });
}

async function startAPI({ databaseURL, artifactRoot, httpAddr, apiURL }) {
  log('api start', httpAddr);
  const child = spawn('go', ['run', './cmd/api'], {
    cwd: backendDir,
    env: backendEnv({ databaseURL, artifactRoot, httpAddr }),
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const logs = [];
  const capture = (chunk) => {
    logs.push(String(chunk));
    if (logs.length > 80) {
      logs.shift();
    }
  };
  child.stdout.on('data', capture);
  child.stderr.on('data', capture);

  let exitCode = null;
  const closed = new Promise((resolve) => {
    child.once('close', (code, signal) => {
      exitCode = code ?? signal ?? 0;
      resolve(exitCode);
    });
  });

  await waitForReady(apiURL, child, logs);
  return { child, closed, logs, get exitCode() { return exitCode; } };
}

async function stopAPI(api) {
  if (!api || api.exitCode !== null) {
    return;
  }

  try {
    if (process.platform === 'win32') {
      api.child.kill('SIGTERM');
    } else {
      process.kill(-api.child.pid, 'SIGTERM');
    }
  } catch {
    api.child.kill('SIGTERM');
  }

  const stopped = await Promise.race([
    api.closed.then(() => true),
    sleep(5000).then(() => false)
  ]);
  if (!stopped) {
    try {
      if (process.platform === 'win32') {
        api.child.kill('SIGKILL');
      } else {
        process.kill(-api.child.pid, 'SIGKILL');
      }
    } catch {
      api.child.kill('SIGKILL');
    }
    await api.closed;
  }
}

async function waitForReady(apiURL, child, logs) {
  const readyURL = new URL('/readyz', apiURL);
  for (let i = 0; i < 120; i += 1) {
    if (child.exitCode !== null) {
      throw new Error(`API exited before ready. Logs:\n${logs.join('')}`);
    }
    try {
      const response = await fetch(readyURL);
      if (response.ok) {
        return;
      }
    } catch {
      // Retry until timeout.
    }
    await sleep(500);
  }
  throw new Error(`API did not become ready. Logs:\n${logs.join('')}`);
}

async function runVerticalFlow({ apiURL, databaseURL, artifactRoot, tempDir }) {
  const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');

  const workFile = await writeJSON(tempDir, 'work.json', {
    title: `Smoke vertical flow ${stamp}`,
    description: 'Local integration smoke for Maestro API and maestroctl.',
    type: 'task',
    status: 'ready',
    artifact_shape: 'staged_task',
    risk_level: 'low',
    priority: 'normal',
    owner: 'owner'
  });
  const work = await maestro(apiURL, ['work', 'create', '--from', workFile]);

  const taskFile = await writeJSON(tempDir, 'task.json', {
    work_id: work.id,
    title: 'Smoke implementation task',
    description: 'Create evidence, approval, attempt, and close the stage.',
    status: 'ready',
    lane: 'ready',
    stack_scope: 'full-stack',
    risk_level: 'low',
    priority: 'normal',
    assignee_type: 'agent',
    agent_role: 'mason'
  });
  const task = await maestro(apiURL, ['task', 'create', '--from', taskFile]);

  const stageFile = await writeJSON(tempDir, 'stage.json', {
    name: 'implementation',
    status: 'ready',
    sequence: 1,
    agent_role: 'mason',
    checkpoint_policy: 'before-tests'
  });
  const stage = await maestro(apiURL, ['stage', 'create', '--task', task.id, '--from', stageFile]);

  const agentRunFile = await writeJSON(tempDir, 'agent-run.json', {
    work_id: work.id,
    task_id: task.id,
    stage_id: stage.id,
    agent_role: 'mason',
    metadata_json: { source: 'smoke-local' }
  });
  const agentRun = await maestro(apiURL, ['agent-run', 'create', '--from', agentRunFile]);
  await maestro(apiURL, ['agent-run', 'start', agentRun.id, '--reason', 'Smoke run started']);

  const startedStage = await maestro(apiURL, ['stage', 'start', stage.id, '--reason', 'Smoke stage start']);
  if (startedStage.status !== 'in_progress') {
    throw new Error(`Expected stage to be in_progress, got ${startedStage.status}.`);
  }

  const attempt = await maestro(apiURL, ['attempt', 'create', '--task', task.id, '--stage', stage.id, '--agent-role', 'mason']);

  const evidenceFile = path.join(tempDir, 'go-test.log');
  await writeFile(evidenceFile, 'ok: smoke evidence\n', 'utf8');
  const evidence = await maestro(apiURL, [
    'evidence',
    'attach',
    '--task',
    task.id,
    '--file',
    evidenceFile,
    '--type',
    'test',
    '--title',
    'Smoke evidence'
  ]);

  const approval = await maestro(apiURL, [
    'approval',
    'request',
    '--task',
    task.id,
    '--type',
    'execution',
    '--reason',
    'Smoke approval gate'
  ]);
  const decidedApproval = await maestro(apiURL, [
    'approval',
    'decide',
    approval.id,
    '--decision',
    'approved',
    '--reason',
    'Smoke approval accepted'
  ]);
  if (decidedApproval.status !== 'approved') {
    throw new Error(`Expected approval to be approved, got ${decidedApproval.status}.`);
  }

  const handoffFile = await writeJSON(tempDir, 'handoff.json', {
    result: 'complete',
    summary: 'Smoke vertical flow completed.',
    evidence: [evidence.uri]
  });
  const readmeFile = path.join(tempDir, 'README.md');
  await writeFile(readmeFile, '# Smoke Attempt\n\nThe local vertical flow completed.\n', 'utf8');
  const submittedAttempt = await maestro(apiURL, [
    'attempt',
    'submit',
    attempt.id,
    '--handoff',
    handoffFile,
    '--readme',
    readmeFile,
    '--summary',
    'Smoke handoff submitted'
  ]);
  if (submittedAttempt.status !== 'submitted') {
    throw new Error(`Expected attempt to be submitted, got ${submittedAttempt.status}.`);
  }

  await maestro(apiURL, [
    'agent-run',
    'checkpoint',
    agentRun.id,
    '--checkpoint',
    'before-review',
    '--metadata',
    '{"source":"smoke-local"}',
    '--reason',
    'Smoke reached review checkpoint'
  ]);

  const reviewedStage = await maestro(apiURL, [
    'stage',
    'review',
    stage.id,
    '--decision',
    'accept',
    '--reason',
    'Smoke evidence accepted'
  ]);
  if (reviewedStage.status !== 'accepted') {
    throw new Error(`Expected stage to be accepted, got ${reviewedStage.status}.`);
  }

  const taskDoneFile = await writeJSON(tempDir, 'task-done.json', { status: 'done' });
  const doneTask = await maestro(apiURL, [
    'task',
    'update',
    task.id,
    '--from',
    taskDoneFile,
    '--reason',
    'Smoke flow closed'
  ]);
  if (doneTask.status !== 'done') {
    throw new Error(`Expected task to be done, got ${doneTask.status}.`);
  }

  await assertArtifactExists(artifactRoot, evidence.uri);
  await assertArtifactExists(artifactRoot, submittedAttempt.handoff_path);
  await assertArtifactExists(artifactRoot, submittedAttempt.readme_path);

  const evidenceRows = await fetchJSON(new URL(`/api/tasks/${task.id}/evidence`, apiURL));
  if (!Array.isArray(evidenceRows) || evidenceRows.length < 1) {
    throw new Error('Expected task evidence to be listable after attachment.');
  }

  const runEvents = await maestro(apiURL, ['run-events', 'list', '--task-id', task.id, '--limit', '50']);
  if (!Array.isArray(runEvents) || !runEvents.some((event) => event.command === 'agent_run.checkpoint')) {
    throw new Error('Expected maestroctl run-events list to include the agent_run.checkpoint event.');
  }

  const migrated = await psql(databaseURL, `SELECT COUNT(*) FROM schema_migrations WHERE version = '001_initial_schema';`);
  if (Number(migrated.trim()) !== 1) {
    throw new Error('Expected migration 001_initial_schema to be recorded.');
  }

  return {
    work,
    task: doneTask,
    stage: reviewedStage,
    attempt,
    submittedAttempt,
    evidence,
    approval: decidedApproval,
    agentRun,
    runEvents
  };
}

async function verifyPersistence({ apiURL, result }) {
  log('restart check', 'verifying persisted state');
  const task = await maestro(apiURL, ['task', 'get', result.task.id]);
  if (task.status !== 'done') {
    throw new Error(`Persistence check failed: task status is ${task.status}.`);
  }

  const stages = await maestro(apiURL, ['stage', 'list', '--task', result.task.id]);
  if (!Array.isArray(stages) || !stages.some((stage) => stage.id === result.stage.id && stage.status === 'accepted')) {
    throw new Error('Persistence check failed: accepted stage not found.');
  }

  const agentRun = await maestro(apiURL, ['agent-run', 'get', result.agentRun.id]);
  if (agentRun.current_checkpoint !== 'before-review') {
    throw new Error(`Persistence check failed: agent checkpoint is ${agentRun.current_checkpoint}.`);
  }

  const runEvents = await maestro(apiURL, ['run-events', 'list', '--task-id', result.task.id, '--limit', '50']);
  if (!Array.isArray(runEvents) || !runEvents.some((event) => event.command?.startsWith('stage.review.'))) {
    throw new Error('Persistence check failed: stage.review event not found.');
  }
}

async function countRunEvents(databaseURL, result) {
  const sql = `
SELECT COUNT(*)
FROM run_events
WHERE work_id = ${uuidLiteral(result.work.id)}
   OR task_id = ${uuidLiteral(result.task.id)}
   OR stage_id = ${uuidLiteral(result.stage.id)}
   OR attempt_id = ${uuidLiteral(result.attempt.id)};`;
  const out = await psql(databaseURL, sql);
  return Number(out.trim());
}

async function maestro(apiURL, args) {
  const output = await exec(process.execPath, [cliPath, ...args, '--api-url', apiURL], {
    cwd: maestroRoot,
    env: process.env
  });
  let body;
  try {
    body = JSON.parse(output.stdout);
  } catch (error) {
    throw new Error(`maestroctl returned non-JSON output for ${args.join(' ')}: ${error.message}\n${output.stdout}`);
  }
  if (!body.ok) {
    throw new Error(`maestroctl failed for ${args.join(' ')}: ${JSON.stringify(body.error)}`);
  }
  return body.state;
}

async function psql(databaseURL, sql) {
  const output = await exec('psql', [databaseURL, '-X', '-v', 'ON_ERROR_STOP=1', '-At', '-c', sql], {
    cwd: repoRoot,
    env: { ...process.env, PGCONNECT_TIMEOUT: process.env.PGCONNECT_TIMEOUT || '5' }
  });
  return output.stdout.trim();
}

async function exec(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.once('error', reject);
    child.once('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      const error = new Error(`${command} exited with code ${code}\n${stderr || stdout}`);
      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
    });
  });
}

function backendEnv({ databaseURL, artifactRoot, httpAddr }) {
  return {
    ...process.env,
    MAESTRO_DATABASE_URL: databaseURL,
    MAESTRO_ARTIFACT_ROOT: artifactRoot,
    MAESTRO_HTTP_ADDR: httpAddr,
    MAESTRO_MIGRATIONS_DIR: path.join(backendDir, 'migrations'),
    MAESTRO_RUN_MIGRATIONS: 'false'
  };
}

async function readEnvFile(filePath) {
  const raw = await readFile(filePath, 'utf8');
  const env = {};
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
    const value = trimmed.slice(index + 1).trim();
    env[key] = unquote(value);
  }
  return env;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--help' || token === '-h') {
      args.help = true;
      continue;
    }
    if (token === '--env') {
      args.env = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function usage() {
  return `Usage: node maestro/scripts/smoke-local.mjs [--env maestro/env/local.env]

Runs the local Maestro vertical flow against PostgreSQL, the Go API, and maestroctl.

Required env:
  MAESTRO_SMOKE_DATABASE_URL or MAESTRO_DATABASE_URL

Optional env:
  MAESTRO_SMOKE_HTTP_ADDR=127.0.0.1:18787
  MAESTRO_SMOKE_ARTIFACT_ROOT=artifacts/smoke
  MAESTRO_SMOKE_RESET_DATABASE=false
  MAESTRO_SMOKE_RESET_ARTIFACTS=true`;
}

async function writeJSON(dir, name, body) {
  const filePath = path.join(dir, name);
  await writeFile(filePath, `${JSON.stringify(body, null, 2)}\n`, 'utf8');
  return filePath;
}

async function mkTempDir() {
  return await fsMkTemp(path.join(os.tmpdir(), 'maestro-smoke-'));
}

async function fsMkTemp(prefix) {
  const { mkdtemp } = await import('node:fs/promises');
  return await mkdtemp(prefix);
}

async function fetchJSON(url) {
  const response = await fetch(url);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status} ${text}`);
  }
  return text.trim() ? JSON.parse(text) : {};
}

async function assertArtifactExists(artifactRoot, uri) {
  const filePath = artifactURIToPath(artifactRoot, uri);
  await access(filePath);
}

function artifactURIToPath(artifactRoot, uri) {
  const prefix = 'artifact://current/';
  if (!uri || !uri.startsWith(prefix)) {
    throw new Error(`Unsupported artifact URI: ${uri}`);
  }
  return path.join(artifactRoot, uri.slice(prefix.length));
}

function resolveMaestroPath(value) {
  if (path.isAbsolute(value)) {
    return path.resolve(value);
  }
  return path.resolve(maestroRoot, value);
}

function assertSafeArtifactRoot(artifactRoot) {
  const artifactsRoot = path.join(maestroRoot, 'artifacts');
  const relative = path.relative(artifactsRoot, artifactRoot);
  const isInsideMaestroArtifacts = relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
  const isInsideTemp = artifactRoot.startsWith(path.resolve(os.tmpdir()) + path.sep);
  if (!isInsideMaestroArtifacts && !isInsideTemp) {
    throw new Error(`Refusing to reset artifact root outside maestro/artifacts or tmp: ${artifactRoot}`);
  }
}

function quoteIdent(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function uuidLiteral(value) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`Expected UUID, got: ${value}`);
  }
  return `'${value}'::uuid`;
}

function httpAddrToURL(addr) {
  if (addr.startsWith(':')) {
    return `http://127.0.0.1${addr}`;
  }
  if (addr.startsWith('0.0.0.0:')) {
    return `http://127.0.0.1:${addr.split(':').at(-1)}`;
  }
  return `http://${addr}`;
}

function normalizeURL(raw) {
  return String(raw).replace(/\/+$/, '');
}

function truthy(value) {
  return ['1', 'true', 'yes', 'y', 'on'].includes(String(value || '').trim().toLowerCase());
}

function unquote(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function redactDatabaseURL(raw) {
  try {
    const url = new URL(raw);
    if (url.password) {
      url.password = '***';
    }
    return url.toString();
  } catch {
    return '<invalid database url>';
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function log(label, value) {
  process.stderr.write(`[maestro-smoke] ${label}: ${value}\n`);
}

main().catch((error) => {
  process.stderr.write(`[maestro-smoke] failed: ${error.stack || error.message}\n`);
  process.exitCode = 1;
});
