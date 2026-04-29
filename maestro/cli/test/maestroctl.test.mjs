import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { run } from '../src/maestroctl.mjs';

test('work create posts JSON payload from file', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'maestroctl-'));
  const payloadPath = path.join(dir, 'work.json');
  await writeFile(payloadPath, JSON.stringify({ title: 'Build cockpit', type: 'task' }));

  const calls = [];
  const result = await run(['--api-url', 'http://maestro.local', 'work', 'create', '--from', payloadPath], {
    fetch: fakeFetch(calls, { id: 'work-1' })
  });

  assert.equal(result.body.ok, true);
  assert.equal(result.body.command, 'work create');
  assert.equal(calls[0].url.pathname, '/api/work');
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].init.body), { title: 'Build cockpit', type: 'task' });
});

test('stage start posts command envelope', async () => {
  const calls = [];
  const result = await run(['--api-url', 'http://maestro.local', 'stage', 'start', 'stage-1', '--reason', 'Ready'], {
    fetch: fakeFetch(calls, { id: 'stage-1', status: 'in_progress' })
  });

  assert.equal(result.body.ok, true);
  assert.equal(calls[0].url.pathname, '/api/stages/stage-1/start');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    command: '',
    reason: 'Ready',
    actor: { type: 'maestro', id: 'maestro' }
  });
});

test('evidence attach reads file payload', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'maestroctl-'));
  const evidencePath = path.join(dir, 'go-test.log');
  await writeFile(evidencePath, 'ok');

  const calls = [];
  const result = await run([
    '--api-url',
    'http://maestro.local',
    'evidence',
    'attach',
    '--task',
    'task-1',
    '--file',
    evidencePath,
    '--type',
    'test'
  ], {
    fetch: fakeFetch(calls, { id: 'evidence-1' })
  });

  assert.equal(result.body.ok, true);
  assert.equal(calls[0].url.pathname, '/api/tasks/task-1/evidence');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.type, 'test');
  assert.equal(body.task_id, undefined);
  assert.equal(body.file.name, 'go-test.log');
  assert.equal(body.file.content, 'ok');
});

test('attempt submit sends handoff and readme files', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'maestroctl-'));
  const handoffPath = path.join(dir, 'handoff.json');
  const readmePath = path.join(dir, 'README.md');
  await writeFile(handoffPath, '{}');
  await writeFile(readmePath, 'done');

  const calls = [];
  const result = await run([
    '--api-url',
    'http://maestro.local',
    'stage',
    'submit-handoff',
    'attempt-1',
    '--handoff',
    handoffPath,
    '--readme',
    readmePath,
    '--summary',
    'done'
  ], {
    fetch: fakeFetch(calls, { id: 'attempt-1', status: 'submitted' })
  });

  assert.equal(result.body.ok, true);
  assert.equal(calls[0].url.pathname, '/api/attempts/attempt-1/submit');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.changes.summary, 'done');
  assert.equal(body.changes.handoff_file.content, '{}');
  assert.equal(body.changes.readme_file.content, 'done');
});

test('run-events list maps filters to query params', async () => {
  const calls = [];
  const result = await run([
    '--api-url',
    'http://maestro.local',
    'run-events',
    'list',
    '--task-id',
    'task-1',
    '--stage',
    'stage-1',
    '--limit',
    '25'
  ], {
    fetch: fakeFetch(calls, [{ id: 'event-1', command: 'agent_run.start' }])
  });

  assert.equal(result.body.ok, true);
  assert.equal(result.body.command, 'run-events list');
  assert.equal(calls[0].url.pathname, '/api/run-events');
  assert.equal(calls[0].url.searchParams.get('taskId'), 'task-1');
  assert.equal(calls[0].url.searchParams.get('stageId'), 'stage-1');
  assert.equal(calls[0].url.searchParams.get('limit'), '25');
});

test('agent-run list accepts id-suffixed filter flags', async () => {
  const calls = [];
  const result = await run([
    '--api-url',
    'http://maestro.local',
    'agent-run',
    'list',
    '--task-id',
    'task-1',
    '--stage-id',
    'stage-1',
    '--role',
    'mason'
  ], {
    fetch: fakeFetch(calls, [])
  });

  assert.equal(result.body.ok, true);
  assert.equal(calls[0].url.pathname, '/api/agent-runs');
  assert.equal(calls[0].url.searchParams.get('taskId'), 'task-1');
  assert.equal(calls[0].url.searchParams.get('stageId'), 'stage-1');
  assert.equal(calls[0].url.searchParams.get('agentRole'), 'mason');
});

test('API errors become stable JSON errors', async () => {
  const result = await run(['--api-url', 'http://maestro.local', 'stage', 'start', 'stage-1'], {
    fetch: async () => new Response(JSON.stringify({
      error: { code: 'approval_required', message: 'Approval required.' }
    }), { status: 409, statusText: 'Conflict' })
  });

  assert.equal(result.exitCode, 1);
  assert.equal(result.body.ok, false);
  assert.equal(result.body.error.code, 'approval_required');
});

test('attempt submit rejects invalid handoff JSON', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'maestroctl-'));
  const handoffPath = path.join(dir, 'handoff.json');
  await writeFile(handoffPath, '{bad');

  const result = await run(['attempt', 'submit', 'attempt-1', '--handoff', handoffPath], {
    fetch: fakeFetch([], { id: 'attempt-1' })
  });

  assert.equal(result.exitCode, 1);
  assert.equal(result.body.error.code, 'invalid_json_file');
});

function fakeFetch(calls, responseBody) {
  return async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };
}
