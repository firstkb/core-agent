import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_API_URL = 'http://127.0.0.1:8787';

export async function main(argv, options = {}) {
  const result = await run(argv, options);
  const stdout = options.stdout ?? process.stdout;
  stdout.write(`${JSON.stringify(result.body, null, 2)}\n`);
  if (!result.body.ok) {
    process.exitCode = result.exitCode || 1;
  }
  return result.body;
}

export async function run(argv, options = {}) {
  const parsed = parseArgs(argv);
  if (parsed.help || parsed.positionals.length === 0) {
    return ok('help', { usage: usageText() });
  }

  const [group, action, idOrSubcommand, maybeSubcommand] = parsed.positionals;
  const apiURL = normalizeURL(parsed.flags.apiUrl ?? process.env.MAESTRO_API_URL ?? DEFAULT_API_URL);
  const fetcher = options.fetch ?? fetch;
  const cwd = options.cwd ?? process.cwd();

  try {
    const command = await buildCommand({ group, action, idOrSubcommand, maybeSubcommand, flags: parsed.flags, apiURL, cwd });
    const response = await send(fetcher, command);
    if (!response.ok) {
      return {
        exitCode: 1,
        body: {
          ok: false,
          command: command.name,
          request: command.request,
          error: response.error
        }
      };
    }
    return {
      exitCode: 0,
      body: {
        ok: true,
        command: command.name,
        request: command.request,
        writes: command.writes ?? [],
        state: response.body,
        next_allowed_actions: command.nextAllowedActions ?? []
      }
    };
  } catch (error) {
    return {
      exitCode: 1,
      body: {
        ok: false,
        command: `${group ?? ''} ${action ?? ''}`.trim(),
        error: normalizeError(error)
      }
    };
  }
}

async function buildCommand({ group, action, idOrSubcommand, maybeSubcommand, flags, apiURL, cwd }) {
  switch (group) {
    case 'work':
      return buildWork(action, idOrSubcommand, flags, apiURL, cwd);
    case 'task':
      return buildTask(action, idOrSubcommand, flags, apiURL, cwd);
    case 'stage':
      return buildStage(action, idOrSubcommand, flags, apiURL, cwd);
    case 'attempt':
      return buildAttempt(action, idOrSubcommand, flags, apiURL, cwd);
    case 'evidence':
      return buildEvidence(action, flags, apiURL, cwd);
    case 'approval':
      return buildApproval(action, idOrSubcommand, flags, apiURL, cwd);
    case 'agent-run':
      return buildAgentRun(action, idOrSubcommand, maybeSubcommand, flags, apiURL, cwd);
    case 'run-events':
      return buildRunEvents(action, flags, apiURL);
    default:
      throw cliError('unknown_command', `Unknown command group: ${group}`);
  }
}

async function buildWork(action, id, flags, apiURL, cwd) {
  switch (action) {
    case 'list':
      return getCommand('work list', apiURL, '/api/work', filterQuery({
        status: flags.status,
        type: flags.type,
        riskLevel: flags.riskLevel ?? flags.risk,
        owner: flags.owner
      }));
    case 'get':
      requireValue(id, 'work id');
      return getCommand('work get', apiURL, `/api/work/${encodeURIComponent(id)}`);
    case 'create':
      return postCommand('work create', apiURL, '/api/work', await payloadFromFlags(flags, cwd, ['title']));
    case 'update':
      requireValue(id, 'work id');
      return postCommand('work update', apiURL, `/api/work/${encodeURIComponent(id)}/update`, {
        changes: await payloadFromFlags(flags, cwd),
        reason: flags.reason ?? '',
        actor: actorFromFlags(flags)
      });
    default:
      throw cliError('unknown_command', `Unknown work command: ${action}`);
  }
}

async function buildTask(action, id, flags, apiURL, cwd) {
  switch (action) {
    case 'list':
      return getCommand('task list', apiURL, '/api/tasks', filterQuery({
        workId: flags.work,
        featureId: flags.feature,
        status: flags.status,
        lane: flags.lane,
        riskLevel: flags.riskLevel ?? flags.risk
      }));
    case 'get':
      requireValue(id, 'task id');
      return getCommand('task get', apiURL, `/api/tasks/${encodeURIComponent(id)}`);
    case 'create':
      return postCommand('task create', apiURL, '/api/tasks', await payloadFromFlags(flags, cwd, ['workId', 'title']));
    case 'update':
      requireValue(id, 'task id');
      return postCommand('task update', apiURL, `/api/tasks/${encodeURIComponent(id)}/update`, {
        changes: await payloadFromFlags(flags, cwd),
        reason: flags.reason ?? '',
        actor: actorFromFlags(flags)
      });
    default:
      throw cliError('unknown_command', `Unknown task command: ${action}`);
  }
}

async function buildStage(action, id, flags, apiURL, cwd) {
  switch (action) {
    case 'list':
      requireValue(flags.task, '--task');
      return getCommand('stage list', apiURL, `/api/tasks/${encodeURIComponent(flags.task)}/stages`);
    case 'create':
      requireValue(flags.task, '--task');
      return postCommand('stage create', apiURL, `/api/tasks/${encodeURIComponent(flags.task)}/stages`, await payloadFromFlags(flags, cwd, ['name']));
    case 'start':
    case 'pause':
    case 'resume':
    case 'cancel':
      requireValue(id, 'stage id');
      return postCommand(`stage ${action}`, apiURL, `/api/stages/${encodeURIComponent(id)}/${action}`, commandPayload(flags));
    case 'review':
      requireValue(id, 'stage id');
      requireValue(flags.decision, '--decision');
      return postCommand('stage review', apiURL, `/api/stages/${encodeURIComponent(id)}/review`, {
        decision: flags.decision,
        reason: flags.reason ?? '',
        actor: actorFromFlags(flags)
      });
    case 'submit-handoff':
      requireValue(id, 'attempt id');
      return buildAttempt('submit', id, flags, apiURL, cwd);
    default:
      throw cliError('unknown_command', `Unknown stage command: ${action}`);
  }
}

async function buildAttempt(action, id, flags, apiURL, cwd) {
  switch (action) {
    case 'create':
      requireValue(flags.task, '--task');
      requireValue(flags.stage, '--stage');
      return postCommand('attempt create', apiURL, `/api/tasks/${encodeURIComponent(flags.task)}/attempts`, {
        stage_id: flags.stage,
        agent_role: flags.agentRole ?? flags.role ?? ''
      });
    case 'get':
      requireValue(id, 'attempt id');
      return getCommand('attempt get', apiURL, `/api/attempts/${encodeURIComponent(id)}`);
    case 'submit': {
      requireValue(id, 'attempt id');
      const changes = await attemptSubmitChanges(flags, cwd);
      return postCommand('attempt submit', apiURL, `/api/attempts/${encodeURIComponent(id)}/submit`, {
        changes,
        reason: flags.reason ?? '',
        actor: actorFromFlags(flags)
      });
    }
    default:
      throw cliError('unknown_command', `Unknown attempt command: ${action}`);
  }
}

async function buildEvidence(action, flags, apiURL, cwd) {
  if (action !== 'attach') {
    throw cliError('unknown_command', `Unknown evidence command: ${action}`);
  }
  const target = evidenceTarget(flags);
  const payload = await evidencePayload(flags, cwd);
  return postCommand('evidence attach', apiURL, target.path, payload, target.writes);
}

async function buildApproval(action, id, flags, apiURL) {
  switch (action) {
    case 'request': {
      requireValue(flags.task, '--task');
      requireValue(flags.type, '--type');
      return postCommand('approval request', apiURL, `/api/tasks/${encodeURIComponent(flags.task)}/approvals`, {
        approval_type: flags.type,
        requested_by: flags.requestedBy ?? 'maestro',
        reason: flags.reason ?? ''
      });
    }
    case 'decide':
      requireValue(id, 'approval id');
      requireValue(flags.decision, '--decision');
      return postCommand('approval decide', apiURL, `/api/approvals/${encodeURIComponent(id)}/decide`, {
        decision: flags.decision,
        decided_by: flags.decidedBy ?? 'owner',
        reason: flags.reason ?? ''
      });
    default:
      throw cliError('unknown_command', `Unknown approval command: ${action}`);
  }
}

async function buildAgentRun(action, id, maybeSubcommand, flags, apiURL, cwd) {
  switch (action) {
    case 'list':
      return getCommand('agent-run list', apiURL, '/api/agent-runs', filterQuery({
        workId: flags.work ?? flags.workId,
        taskId: flags.task ?? flags.taskId,
        stageId: flags.stage ?? flags.stageId,
        status: flags.status,
        agentRole: flags.agentRole ?? flags.role
      }));
    case 'create':
      return postCommand('agent-run create', apiURL, '/api/agent-runs', await payloadFromFlags(flags, cwd, ['agentRole']));
    case 'get':
      requireValue(id, 'agent-run id');
      return getCommand('agent-run get', apiURL, `/api/agent-runs/${encodeURIComponent(id)}`);
    case 'start':
    case 'pause':
    case 'resume':
    case 'cancel':
      requireValue(id, 'agent-run id');
      return postCommand(`agent-run ${action}`, apiURL, `/api/agent-runs/${encodeURIComponent(id)}/${action}`, commandPayload(flags));
    case 'checkpoint':
    case 'heartbeat':
      requireValue(id, 'agent-run id');
      return postCommand(`agent-run ${action}`, apiURL, `/api/agent-runs/${encodeURIComponent(id)}/${action}`, {
        changes: {
          checkpoint: flags.checkpoint ?? '',
          metadata_json: flags.metadata ? JSON.parse(flags.metadata) : undefined
        },
        reason: flags.reason ?? '',
        actor: actorFromFlags(flags)
      });
    default:
      throw cliError('unknown_command', `Unknown agent-run command: ${action ?? maybeSubcommand}`);
  }
}

function buildRunEvents(action, flags, apiURL) {
  switch (action) {
    case 'list':
      return getCommand('run-events list', apiURL, '/api/run-events', filterQuery({
        workId: flags.work ?? flags.workId,
        taskId: flags.task ?? flags.taskId,
        stageId: flags.stage ?? flags.stageId,
        attemptId: flags.attempt ?? flags.attemptId,
        limit: flags.limit
      }));
    default:
      throw cliError('unknown_command', `Unknown run-events command: ${action}`);
  }
}

function getCommand(name, apiURL, pathName, query = {}) {
  const url = new URL(pathName, apiURL);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return {
    name,
    request: { method: 'GET', path: `${url.pathname}${url.search}` },
    url
  };
}

function postCommand(name, apiURL, pathName, body, writes = []) {
  const url = new URL(pathName, apiURL);
  return {
    name,
    request: { method: 'POST', path: url.pathname },
    url,
    body,
    writes
  };
}

async function send(fetcher, command) {
  const init = {
    method: command.request.method,
    headers: { Accept: 'application/json' }
  };
  if (command.body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(command.body);
  }

  let response;
  try {
    response = await fetcher(command.url, init);
  } catch (error) {
    return { ok: false, error: normalizeError(error, 'network_error') };
  }

  const text = await response.text();
  let body = {};
  if (text.trim() !== '') {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }

  if (!response.ok) {
    return {
      ok: false,
      error: {
        code: body?.error?.code ?? `http_${response.status}`,
        message: body?.error?.message ?? response.statusText,
        status: response.status
      }
    };
  }

  return { ok: true, body };
}

async function payloadFromFlags(flags, cwd, required = []) {
  let payload = {};
  if (flags.from) {
    payload = await readJSON(resolvePath(cwd, flags.from));
  }
  for (const [flag, field] of Object.entries(fieldMap())) {
    if (flags[flag] !== undefined) {
      payload[field] = flags[flag];
    }
  }
  if (flags.metadata !== undefined) {
    payload.metadata_json = JSON.parse(flags.metadata);
  }
  for (const field of required) {
    const jsonField = fieldMap()[field] ?? field;
    if (!payload[jsonField]) {
      throw cliError('missing_argument', `Missing required field: ${field}`);
    }
  }
  return payload;
}

async function evidencePayload(flags, cwd) {
  const payload = await payloadFromFlags(flags, cwd);
  delete payload.work_id;
  delete payload.task_id;
  delete payload.stage_id;
  delete payload.attempt_id;
  if (flags.file) {
    const filePath = resolvePath(cwd, flags.file);
    payload.file = {
      name: flags.name ?? path.basename(filePath),
      content: await readFile(filePath, 'utf8'),
      encoding: 'text'
    };
    if (!payload.title) {
      payload.title = payload.file.name;
    }
  }
  if (!payload.uri && !payload.file) {
    throw cliError('missing_argument', 'Evidence requires --uri or --file');
  }
  if (!payload.type) {
    payload.type = payload.file ? 'artifact' : 'note';
  }
  return payload;
}

async function attemptSubmitChanges(flags, cwd) {
  const changes = await payloadFromFlags(flags, cwd);
  if (flags.handoff) {
    const filePath = resolvePath(cwd, flags.handoff);
    const content = await readFile(filePath, 'utf8');
    parseJSONContent(content, filePath);
    changes.handoff_file = {
      name: path.basename(filePath),
      content,
      encoding: 'text'
    };
  }
  if (flags.readme) {
    const filePath = resolvePath(cwd, flags.readme);
    changes.readme_file = {
      name: path.basename(filePath),
      content: await readFile(filePath, 'utf8'),
      encoding: 'text'
    };
  }
  if (!changes.summary) {
    changes.summary = flags.summary ?? '';
  }
  return changes;
}

function evidenceTarget(flags) {
  const count = [flags.work, flags.task, flags.attempt].filter(Boolean).length;
  if (count !== 1) {
    throw cliError('missing_argument', 'Evidence attach requires exactly one of --work, --task, or --attempt');
  }
  if (flags.work) {
    return { path: `/api/work/${encodeURIComponent(flags.work)}/evidence`, writes: [] };
  }
  if (flags.task) {
    return { path: `/api/tasks/${encodeURIComponent(flags.task)}/evidence`, writes: [] };
  }
  return { path: `/api/attempts/${encodeURIComponent(flags.attempt)}/evidence`, writes: [] };
}

function commandPayload(flags) {
  return {
    command: flags.command ?? '',
    reason: flags.reason ?? '',
    actor: actorFromFlags(flags)
  };
}

function actorFromFlags(flags) {
  return {
    type: flags.actorType ?? 'maestro',
    id: flags.actorId ?? flags.actor ?? 'maestro'
  };
}

function parseArgs(argv) {
  const flags = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--help' || token === '-h') {
      return { help: true, flags, positionals };
    }
    if (token.startsWith('--')) {
      const eq = token.indexOf('=');
      const rawKey = token.slice(2, eq === -1 ? undefined : eq);
      const key = camelCase(rawKey);
      if (eq !== -1) {
        flags[key] = token.slice(eq + 1);
        continue;
      }
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        flags[key] = true;
        continue;
      }
      flags[key] = next;
      i += 1;
      continue;
    }
    positionals.push(token);
  }
  return { help: false, flags, positionals };
}

function fieldMap() {
  return {
    work: 'work_id',
    workId: 'work_id',
    task: 'task_id',
    taskId: 'task_id',
    stage: 'stage_id',
    stageId: 'stage_id',
    attempt: 'attempt_id',
    attemptId: 'attempt_id',
    feature: 'feature_id',
    featureId: 'feature_id',
    agentRole: 'agent_role',
    role: 'agent_role',
    artifactShape: 'artifact_shape',
    riskLevel: 'risk_level',
    stackScope: 'stack_scope',
    assigneeType: 'assignee_type',
    prUrl: 'pr_url',
    ciStatus: 'ci_status',
    visualStatus: 'visual_status',
    artifactPath: 'artifact_path',
    artifactRoot: 'artifact_root',
    currentCheckpoint: 'current_checkpoint',
    title: 'title',
    description: 'description',
    type: 'type',
    status: 'status',
    priority: 'priority',
    owner: 'owner',
    branch: 'branch',
    lane: 'lane',
    name: 'name',
    sequence: 'sequence',
    checkpointPolicy: 'checkpoint_policy',
    summary: 'summary',
    handoffPath: 'handoff_path',
    readmePath: 'readme_path',
    uri: 'uri',
    requestedBy: 'requested_by',
    decidedBy: 'decided_by',
    approvalType: 'approval_type'
  };
}

function filterQuery(query) {
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== ''));
}

async function readJSON(filePath) {
  const raw = await readFile(filePath, 'utf8');
  return parseJSONContent(raw, filePath);
}

function parseJSONContent(raw, label) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw cliError('invalid_json_file', `${label} is not valid JSON: ${error.message}`);
  }
}

function resolvePath(cwd, input) {
  return path.isAbsolute(input) ? input : path.resolve(cwd, input);
}

function normalizeURL(raw) {
  const value = String(raw || '').trim().replace(/\/+$/, '');
  return value === '' ? DEFAULT_API_URL : value;
}

function requireValue(value, label) {
  if (value === undefined || value === '') {
    throw cliError('missing_argument', `Missing ${label}`);
  }
}

function camelCase(value) {
  return value.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
}

function ok(command, state) {
  return {
    exitCode: 0,
    body: { ok: true, command, state, writes: [], next_allowed_actions: [] }
  };
}

function cliError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeError(error, fallbackCode = 'cli_error') {
  return {
    code: error?.code ?? fallbackCode,
    message: error instanceof Error ? error.message : String(error)
  };
}

function usageText() {
  return `maestroctl <group> <command> [args]

Groups:
  work       list|get|create|update
  task       list|get|create|update
  stage      list|create|start|pause|resume|cancel|review|submit-handoff
  attempt    create|get|submit
  evidence   attach
  approval   request|decide
  agent-run  list|create|get|start|pause|resume|cancel|checkpoint|heartbeat
  run-events list

Global:
  --api-url <url>  Defaults to MAESTRO_API_URL or ${DEFAULT_API_URL}
  --from <file>    Read JSON payload from file
`;
}
