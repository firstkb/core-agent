import type { AgentRun, Approval, Evidence, Stage, Task, Work } from '../api/types';

export type StatusTone = 'default' | 'info' | 'success' | 'warning' | 'error';

export type Metric = {
  label: string;
  value: number;
  tone: StatusTone;
  badge: string;
};

export type GateSignal = {
  currentGate: string;
  missingEvidence: string[];
  nextAllowedActions: string[];
  tone: StatusTone;
};

export const boardColumns = [
  { key: 'ready', label: 'Ready' },
  { key: 'in_progress', label: 'Running' },
  { key: 'awaiting_review', label: 'Review' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'done', label: 'Done' }
] as const;

export function statusTone(status: string): StatusTone {
  if (['done', 'verified', 'accepted', 'approved', 'completed'].includes(status)) {
    return 'success';
  }
  if (['in_progress', 'running', 'ready', 'resume_requested'].includes(status)) {
    return 'info';
  }
  if (['awaiting_review', 'awaiting_approval', 'requested', 'pause_requested', 'paused'].includes(status)) {
    return 'warning';
  }
  if (['blocked', 'failed', 'rejected', 'cancelled', 'stale', 'cancel_requested'].includes(status)) {
    return 'error';
  }
  return 'default';
}

export function riskTone(risk: string): StatusTone {
  if (risk === 'high') {
    return 'error';
  }
  if (risk === 'medium') {
    return 'warning';
  }
  if (risk === 'low') {
    return 'success';
  }
  return 'default';
}

export function metrics(tasks: Task[], approvals: Approval[], agentRuns: AgentRun[]): Metric[] {
  return [
    { label: 'Tasks', value: tasks.length, tone: 'info', badge: 'total' },
    { label: 'Running', value: tasks.filter((task) => task.status === 'in_progress').length, tone: 'info', badge: 'active' },
    { label: 'Blocked', value: tasks.filter((task) => task.status === 'blocked').length, tone: 'error', badge: 'risk' },
    {
      label: 'Approvals',
      value: approvals.filter((approval) => approval.status === 'requested').length,
      tone: 'warning',
      badge: 'queue'
    },
    {
      label: 'Agent Runs',
      value: agentRuns.filter((run) => run.status === 'running').length,
      tone: 'success',
      badge: 'active'
    }
  ];
}

export function groupTasks(tasks: Task[]): Record<string, Task[]> {
  const groups = Object.fromEntries(boardColumns.map((column) => [column.key, [] as Task[]]));
  for (const task of tasks) {
    const key = boardColumnForStatus(task.status);
    groups[key].push(task);
  }
  return groups;
}

export function boardColumnForStatus(status: string): string {
  if (status === 'draft') {
    return 'ready';
  }
  if (status === 'revise_requested' || status === 'awaiting_review' || status === 'verified') {
    return 'awaiting_review';
  }
  if (status === 'cancelled') {
    return 'blocked';
  }
  if (boardColumns.some((column) => column.key === status)) {
    return status;
  }
  return 'ready';
}

export function filterTasks(tasks: Task[], query: string, status: string): Task[] {
  const normalized = query.trim().toLowerCase();
  return tasks.filter((task) => {
    if (status !== 'all' && boardColumnForStatus(task.status) !== status && task.status !== status) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return [task.title, task.description, task.agent_role, task.stack_scope, task.lane]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalized));
  });
}

export function workTitle(work: Work[], task: Task): string {
  return work.find((item) => item.id === task.work_id)?.title ?? 'Current work';
}

export function stageProgress(stages: Stage[]): string {
  if (stages.length === 0) {
    return '0/0';
  }
  const complete = stages.filter((stage) => ['accepted', 'cancelled'].includes(stage.status)).length;
  return `${complete}/${stages.length}`;
}

export function latestEvidence(evidence: Evidence[]): Evidence | null {
  return [...evidence].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
}

export function taskGateSignal(
  task: Task,
  stages: Stage[],
  evidence: Evidence[],
  approvals: Approval[],
  agentRuns: AgentRun[]
): GateSignal {
  const requestedApproval = approvals.find((approval) => approval.status === 'requested');
  const currentStage =
    stages.find((stage) => ['in_progress', 'pause_requested', 'paused', 'resume_requested', 'awaiting_review'].includes(stage.status)) ??
    stages.find((stage) => ['ready', 'pending', 'revise_requested'].includes(stage.status)) ??
    stages.find((stage) => stage.status !== 'accepted' && stage.status !== 'cancelled');
  const currentRun = agentRuns.find((run) =>
    ['running', 'pause_requested', 'pausing_at_checkpoint', 'paused', 'resume_requested'].includes(run.status)
  );
  const missingEvidence = missingEvidenceFor(task, evidence);

  if (requestedApproval) {
    return {
      currentGate: `Approval: ${requestedApproval.approval_type}`,
      missingEvidence,
      nextAllowedActions: ['Approve or reject request'],
      tone: 'warning'
    };
  }

  if (currentRun?.status === 'paused' || currentRun?.status === 'pause_requested') {
    return {
      currentGate: `Agent run ${currentRun.status}`,
      missingEvidence,
      nextAllowedActions: ['Resume agent run or inspect handoff'],
      tone: 'warning'
    };
  }

  if (currentStage) {
    return stageGateSignal(currentStage, missingEvidence);
  }

  if (task.status === 'done') {
    return {
      currentGate: 'Closed',
      missingEvidence,
      nextAllowedActions: missingEvidence.length > 0 ? ['Attach missing evidence if closeout needs it'] : ['No action required'],
      tone: 'success'
    };
  }

  return {
    currentGate: 'No active stage',
    missingEvidence,
    nextAllowedActions: ['Create or inspect stage plan'],
    tone: 'default'
  };
}

export function shortID(id: string): string {
  return id.slice(0, 8);
}

export function formatDate(value?: string): string {
  if (!value) {
    return '-';
  }
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function stageGateSignal(stage: Stage, missingEvidence: string[]): GateSignal {
  if (stage.status === 'ready' || stage.status === 'pending') {
    return {
      currentGate: `Ready: ${stage.name}`,
      missingEvidence,
      nextAllowedActions: [`Start ${stage.name}`],
      tone: 'info'
    };
  }
  if (stage.status === 'in_progress') {
    return {
      currentGate: `Running: ${stage.name}`,
      missingEvidence,
      nextAllowedActions: missingEvidence.length > 0 ? ['Attach evidence', 'Pause or review stage'] : ['Review stage'],
      tone: 'info'
    };
  }
  if (stage.status === 'paused') {
    return {
      currentGate: `Paused: ${stage.name}`,
      missingEvidence,
      nextAllowedActions: [`Resume ${stage.name}`],
      tone: 'warning'
    };
  }
  if (stage.status === 'revise_requested') {
    return {
      currentGate: `Revise: ${stage.name}`,
      missingEvidence,
      nextAllowedActions: ['Start revision attempt'],
      tone: 'warning'
    };
  }
  if (stage.status === 'awaiting_review') {
    return {
      currentGate: `Review: ${stage.name}`,
      missingEvidence,
      nextAllowedActions: ['Accept, revise, or block stage'],
      tone: 'warning'
    };
  }
  return {
    currentGate: `${stage.status}: ${stage.name}`,
    missingEvidence,
    nextAllowedActions: ['Inspect stage state'],
    tone: statusTone(stage.status)
  };
}

function missingEvidenceFor(task: Task, evidence: Evidence[]): string[] {
  const missing: string[] = [];
  if (evidence.length === 0) {
    missing.push('Evidence');
  }
  const needsVisual =
    task.stack_scope.toLowerCase().includes('frontend') ||
    task.stack_scope.toLowerCase().includes('ui') ||
    task.lane.toLowerCase().includes('ui');
  if (needsVisual && !['passed', 'ok', 'verified'].includes(task.visual_status.toLowerCase())) {
    missing.push('Visual pass');
  }
  return missing;
}
