import { describe, expect, it } from 'vitest';
import type { Approval, Evidence, Stage, Task } from '../api/types';
import { boardColumnForStatus, filterTasks, groupTasks, riskTone, statusTone, taskGateSignal } from './viewModel';

const task = (partial: Partial<Task>): Task => ({
  id: 'task-1',
  work_id: 'work-1',
  title: 'Build cockpit table',
  description: 'Wire the table view',
  status: 'ready',
  lane: 'ready',
  stack_scope: 'frontend',
  risk_level: 'low',
  priority: 'normal',
  assignee_type: 'agent',
  agent_role: 'mason',
  branch: '',
  pr_url: '',
  ci_status: '',
  visual_status: '',
  artifact_path: '',
  created_at: '2026-04-29T00:00:00Z',
  updated_at: '2026-04-29T00:00:00Z',
  ...partial
});

const stage = (partial: Partial<Stage>): Stage => ({
  id: 'stage-1',
  task_id: 'task-1',
  name: 'implementation',
  status: 'ready',
  sequence: 1,
  agent_role: 'mason',
  checkpoint_policy: 'before-tests',
  created_at: '2026-04-29T00:00:00Z',
  updated_at: '2026-04-29T00:00:00Z',
  ...partial
});

const approval = (partial: Partial<Approval>): Approval => ({
  id: 'approval-1',
  task_id: 'task-1',
  approval_type: 'execution',
  status: 'requested',
  requested_by: 'maestro',
  approved_by: '',
  reason: '',
  created_at: '2026-04-29T00:00:00Z',
  ...partial
});

const evidence = (partial: Partial<Evidence>): Evidence => ({
  id: 'evidence-1',
  task_id: 'task-1',
  type: 'test',
  title: 'Test output',
  uri: 'artifact://current/test.log',
  metadata_json: {},
  created_at: '2026-04-29T00:00:00Z',
  ...partial
});

describe('viewModel', () => {
  it('maps lifecycle statuses to board columns', () => {
    expect(boardColumnForStatus('draft')).toBe('ready');
    expect(boardColumnForStatus('revise_requested')).toBe('awaiting_review');
    expect(boardColumnForStatus('cancelled')).toBe('blocked');
  });

  it('groups tasks by operational board state', () => {
    const groups = groupTasks([task({ status: 'in_progress' }), task({ id: 'task-2', status: 'done' })]);
    expect(groups.in_progress).toHaveLength(1);
    expect(groups.done).toHaveLength(1);
  });

  it('filters by text and board status', () => {
    const tasks = [task({}), task({ id: 'task-2', title: 'Backend API', description: 'Trace handlers', status: 'blocked' })];
    expect(filterTasks(tasks, 'table', 'all')).toHaveLength(1);
    expect(filterTasks(tasks, '', 'blocked')).toHaveLength(1);
  });

  it('keeps tone mapping compact', () => {
    expect(statusTone('blocked')).toBe('error');
    expect(statusTone('approved')).toBe('success');
    expect(riskTone('medium')).toBe('warning');
  });

  it('prefers approval gate over stage gate', () => {
    const signal = taskGateSignal(task({}), [stage({ status: 'ready' })], [], [approval({})], []);
    expect(signal.currentGate).toBe('Approval: execution');
    expect(signal.nextAllowedActions).toContain('Approve or reject request');
  });

  it('surfaces missing visual evidence for frontend tasks', () => {
    const signal = taskGateSignal(task({ visual_status: '' }), [stage({ status: 'in_progress' })], [evidence({})], [], []);
    expect(signal.currentGate).toBe('Running: implementation');
    expect(signal.missingEvidence).toContain('Visual pass');
  });
});
