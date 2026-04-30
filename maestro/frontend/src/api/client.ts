import type {
  AgentCapability,
  AgentLaunch,
  AgentLaunchInput,
  AgentRun,
  AgentRunCheckpointInput,
  AgentRunInput,
  ArtifactReadResult,
  Approval,
  Attempt,
  AttemptInput,
  AttemptSubmitInput,
  CockpitState,
  Evidence,
  EvidenceAttachmentInput,
  Health,
  RunEventEntry,
  RunEventFilters,
  Stage,
  StageInput,
  Task,
  TaskDetail,
  TaskInput,
  TaskPacket,
  TaskPacketGenerateInput,
  Work,
  WorkInput
} from './types';

const defaultBaseURL = '';

export class MaestroAPIError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'MaestroAPIError';
    this.status = status;
    this.code = code;
  }
}

export class MaestroAPI {
  private readonly baseURL: string;

  constructor(baseURL = apiBaseURL()) {
    this.baseURL = baseURL.replace(/\/+$/, '');
  }

  async health(): Promise<Health> {
    return this.get('/api/health');
  }

  async listWork(): Promise<Work[]> {
    return this.getList('/api/work');
  }

  async createWork(input: WorkInput): Promise<Work> {
    return this.post('/api/work', input);
  }

  async listTasks(): Promise<Task[]> {
    return this.getList('/api/tasks');
  }

  async createTask(input: TaskInput): Promise<Task> {
    return this.post('/api/tasks', input);
  }

  async listStages(taskID: string): Promise<Stage[]> {
    return this.getList(`/api/tasks/${encodeURIComponent(taskID)}/stages`);
  }

  async createStage(taskID: string, input: StageInput): Promise<Stage> {
    return this.post(`/api/tasks/${encodeURIComponent(taskID)}/stages`, input);
  }

  async listAttempts(taskID: string): Promise<Attempt[]> {
    return this.getList(`/api/tasks/${encodeURIComponent(taskID)}/attempts`);
  }

  async createAttempt(taskID: string, input: AttemptInput): Promise<Attempt> {
    return this.post(`/api/tasks/${encodeURIComponent(taskID)}/attempts`, input);
  }

  async submitAttempt(attemptID: string, input: AttemptSubmitInput): Promise<Attempt> {
    return this.post(`/api/attempts/${encodeURIComponent(attemptID)}/submit`, {
      changes: input,
      actor: cockpitActor(),
      reason: `Attempt submitted from Cockpit: ${input.summary}`
    });
  }

  async listTaskEvidence(taskID: string): Promise<Evidence[]> {
    return this.getList(`/api/tasks/${encodeURIComponent(taskID)}/evidence`);
  }

  async listTaskApprovals(taskID: string): Promise<Approval[]> {
    return this.getList(`/api/tasks/${encodeURIComponent(taskID)}/approvals`);
  }

  async listAgents(): Promise<string[]> {
    return this.getList('/api/agents');
  }

  async listAgentCapabilities(): Promise<AgentCapability[]> {
    return this.getList('/api/agent-capabilities');
  }

  async generateTaskPacket(input: TaskPacketGenerateInput): Promise<TaskPacket> {
    return this.post('/api/task-packets/generate', input);
  }

  async launchTaskPacket(input: AgentLaunchInput): Promise<AgentLaunch> {
    return this.post('/api/task-packets/launch', input);
  }

  async readArtifact(uri: string): Promise<ArtifactReadResult> {
    return this.get(`/api/artifacts/read?uri=${encodeURIComponent(uri)}`);
  }

  async listAgentRuns(taskID?: string): Promise<AgentRun[]> {
    const query = taskID ? `?taskId=${encodeURIComponent(taskID)}` : '';
    return this.getList(`/api/agent-runs${query}`);
  }

  async listRunEvents(filters: RunEventFilters = {}): Promise<RunEventEntry[]> {
    const params = new URLSearchParams();
    if (filters.workID) {
      params.set('workId', filters.workID);
    }
    if (filters.taskID) {
      params.set('taskId', filters.taskID);
    }
    if (filters.stageID) {
      params.set('stageId', filters.stageID);
    }
    if (filters.attemptID) {
      params.set('attemptId', filters.attemptID);
    }
    if (filters.limit) {
      params.set('limit', String(filters.limit));
    }
    const query = params.toString();
    return this.getList(`/api/run-events${query ? `?${query}` : ''}`);
  }

  async createAgentRun(input: AgentRunInput): Promise<AgentRun> {
    return this.post('/api/agent-runs', input);
  }

  async startAgentRun(runID: string): Promise<AgentRun> {
    return this.agentRunCommand(runID, 'start', 'Started from Cockpit');
  }

  async pauseAgentRun(runID: string): Promise<AgentRun> {
    return this.agentRunCommand(runID, 'pause', 'Pause requested from Cockpit');
  }

  async resumeAgentRun(runID: string): Promise<AgentRun> {
    return this.agentRunCommand(runID, 'resume', 'Resume requested from Cockpit');
  }

  async cancelAgentRun(runID: string): Promise<AgentRun> {
    return this.agentRunCommand(runID, 'cancel', 'Cancel requested from Cockpit');
  }

  async checkpointAgentRun(runID: string, input: AgentRunCheckpointInput): Promise<AgentRun> {
    return this.post(`/api/agent-runs/${encodeURIComponent(runID)}/checkpoint`, {
      changes: input,
      actor: cockpitActor(),
      reason: `Checkpoint ${input.checkpoint} from Cockpit`
    });
  }

  async startStage(stageID: string): Promise<Stage> {
    return this.stageCommand(stageID, 'start', 'Started from Cockpit');
  }

  async pauseStage(stageID: string): Promise<Stage> {
    return this.stageCommand(stageID, 'pause', 'Pause requested from Cockpit');
  }

  async resumeStage(stageID: string): Promise<Stage> {
    return this.stageCommand(stageID, 'resume', 'Resume requested from Cockpit');
  }

  async cancelStage(stageID: string): Promise<Stage> {
    return this.stageCommand(stageID, 'cancel', 'Cancelled from Cockpit');
  }

  async reviewStage(stageID: string, decision: 'accept' | 'revise' | 'block' | 'cancel'): Promise<Stage> {
    return this.post(`/api/stages/${encodeURIComponent(stageID)}/review`, {
      decision,
      reason: `Stage review ${decision} from Cockpit`,
      actor: cockpitActor()
    });
  }

  async decideApproval(approvalID: string, decision: 'approved' | 'rejected'): Promise<Approval> {
    return this.post(`/api/approvals/${encodeURIComponent(approvalID)}/decide`, {
      decision,
      decided_by: 'owner',
      reason: `Approval ${decision} from Cockpit`
    });
  }

  async attachTaskEvidence(taskID: string, input: EvidenceAttachmentInput): Promise<Evidence> {
    return this.post(`/api/tasks/${encodeURIComponent(taskID)}/evidence`, input);
  }

  async loadCockpit(): Promise<CockpitState> {
    const [health, work, tasks, agentCapabilities, agentRuns, runEvents] = await Promise.all([
      this.health().catch(() => null),
      this.listWork(),
      this.listTasks(),
      this.listAgentCapabilities(),
      this.listAgentRuns(),
      this.listRunEvents({ limit: 100 })
    ]);
    const approvals = (
      await Promise.all(tasks.map((task) => this.listTaskApprovals(task.id).catch(() => [])))
    ).flat();
    return { health, work, tasks, approvals, agentCapabilities, agentRuns, runEvents };
  }

  async loadTaskDetail(taskID: string): Promise<TaskDetail> {
    const [stages, attempts, evidence, approvals, agentRuns, runEvents] = await Promise.all([
      this.listStages(taskID),
      this.listAttempts(taskID),
      this.listTaskEvidence(taskID),
      this.listTaskApprovals(taskID),
      this.listAgentRuns(taskID),
      this.listRunEvents({ taskID, limit: 100 })
    ]);
    return { stages, attempts, evidence, approvals, agentRuns, runEvents };
  }

  private async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      headers: { Accept: 'application/json' }
    });
    return this.parseResponse<T>(response);
  }

  private async getList<T>(path: string): Promise<T[]> {
    const result = await this.get<T[] | null>(path);
    return result ?? [];
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    return this.parseResponse<T>(response);
  }

  private stageCommand(stageID: string, action: 'start' | 'pause' | 'resume' | 'cancel', reason: string): Promise<Stage> {
    return this.post(`/api/stages/${encodeURIComponent(stageID)}/${action}`, {
      command: action,
      reason,
      actor: cockpitActor()
    });
  }

  private agentRunCommand(runID: string, action: 'start' | 'pause' | 'resume' | 'cancel', reason: string): Promise<AgentRun> {
    return this.post(`/api/agent-runs/${encodeURIComponent(runID)}/${action}`, {
      command: action,
      reason,
      actor: cockpitActor()
    });
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const text = await response.text();
    const body = text ? parseJSON(text) : {};
    if (!response.ok) {
      const error = body as { error?: { code?: string; message?: string } };
      throw new MaestroAPIError(
        error.error?.message ?? response.statusText,
        response.status,
        error.error?.code ?? `http_${response.status}`
      );
    }
    return body as T;
  }
}

export function apiBaseURL(): string {
  return import.meta.env.VITE_MAESTRO_API_URL || defaultBaseURL;
}

function parseJSON(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

function cockpitActor() {
  return {
    type: 'cockpit',
    id: 'maestro-cockpit'
  };
}
