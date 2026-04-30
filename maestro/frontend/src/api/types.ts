export type Work = {
  id: string;
  repository_id?: string;
  title: string;
  description: string;
  type: string;
  status: string;
  artifact_shape: string;
  risk_level: string;
  priority: string;
  owner: string;
  branch: string;
  pr_url: string;
  artifact_root: string;
  created_at: string;
  updated_at: string;
};

export type WorkInput = {
  title: string;
  description?: string;
  type?: string;
  status?: string;
  artifact_shape?: string;
  risk_level?: string;
  priority?: string;
  owner?: string;
  branch?: string;
  pr_url?: string;
  artifact_root?: string;
};

export type Task = {
  id: string;
  work_id: string;
  feature_id?: string;
  title: string;
  description: string;
  status: string;
  lane: string;
  stack_scope: string;
  risk_level: string;
  priority: string;
  assignee_type: string;
  agent_role: string;
  branch: string;
  pr_url: string;
  ci_status: string;
  visual_status: string;
  artifact_path: string;
  created_at: string;
  updated_at: string;
};

export type TaskInput = {
  work_id: string;
  feature_id?: string;
  title: string;
  description?: string;
  status?: string;
  lane?: string;
  stack_scope?: string;
  risk_level?: string;
  priority?: string;
  assignee_type?: string;
  agent_role?: string;
  branch?: string;
  pr_url?: string;
  ci_status?: string;
  visual_status?: string;
  artifact_path?: string;
};

export type Stage = {
  id: string;
  task_id: string;
  name: string;
  status: string;
  sequence: number;
  agent_role: string;
  checkpoint_policy: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
};

export type StageInput = {
  name: string;
  status?: string;
  sequence?: number;
  agent_role?: string;
  checkpoint_policy?: string;
};

export type Attempt = {
  id: string;
  task_id: string;
  stage_id: string;
  attempt_no: number;
  agent_role: string;
  agent_run_id?: string;
  status: string;
  summary: string;
  handoff_path: string;
  readme_path: string;
  files_changed_json: unknown;
  commands_run_json: unknown;
  evidence_json: unknown;
  created_at: string;
  submitted_at?: string;
};

export type AttemptInput = {
  stage_id: string;
  agent_role?: string;
};

export type AttemptSubmitInput = {
  summary: string;
  handoff_path?: string;
  readme_path?: string;
  files_changed_json?: unknown;
  commands_run_json?: unknown;
  evidence_json?: unknown;
  handoff_file?: {
    name: string;
    content: string;
    encoding: 'text' | 'base64';
  };
  readme_file?: {
    name: string;
    content: string;
    encoding: 'text' | 'base64';
  };
};

export type Evidence = {
  id: string;
  work_id?: string;
  task_id?: string;
  stage_id?: string;
  attempt_id?: string;
  type: string;
  title: string;
  uri: string;
  metadata_json: unknown;
  created_at: string;
};

export type EvidenceAttachmentInput = {
  type: string;
  title: string;
  uri?: string;
  metadata_json?: unknown;
  file?: {
    name: string;
    content: string;
    encoding: 'text' | 'base64';
  };
};

export type ArtifactReadResult = {
  uri: string;
  rel_path: string;
  content_type: string;
  encoding: 'text' | 'base64';
  content: string;
  size: number;
};

export type Approval = {
  id: string;
  work_id?: string;
  task_id?: string;
  approval_type: string;
  status: string;
  requested_by: string;
  approved_by: string;
  reason: string;
  created_at: string;
  decided_at?: string;
};

export type AgentRun = {
  id: string;
  work_id?: string;
  task_id?: string;
  stage_id?: string;
  attempt_id?: string;
  agent_role: string;
  status: string;
  current_checkpoint: string;
  last_heartbeat_at?: string;
  pause_requested_at?: string;
  cancel_requested_at?: string;
  started_at?: string;
  completed_at?: string;
  metadata_json: unknown;
};

export type AgentRunInput = {
  work_id?: string;
  task_id?: string;
  stage_id?: string;
  attempt_id?: string;
  agent_role: string;
  status?: string;
  current_checkpoint?: string;
  metadata_json?: unknown;
};

export type AgentRunCheckpointInput = {
  checkpoint: string;
  metadata_json?: unknown;
};

export type AgentCapability = {
  role: string;
  display_name: string;
  type: string;
  purpose: string;
  writes_code: string;
  writes_artifacts: string;
  browser_access: string;
  release_access: string;
  high_risk_access: string;
  default_stages: string[];
  recommended_skills: string[];
  approval_triggers: string[];
  formal_chain_role: boolean;
  independent_helper: boolean;
  source_contract: string;
  next_handoff: string;
};

export type TaskPacketGenerateInput = {
  task_id: string;
  stage_id?: string;
  agent_role?: string;
};

export type AgentLaunchInput = {
  task_id: string;
  stage_id?: string;
  agent_role?: string;
  current_checkpoint?: string;
  start?: boolean;
};

export type AgentLaunch = {
  packet: TaskPacket;
  attempt: Attempt;
  agent_run: AgentRun;
  next_allowed_actions: string[];
};

export type TaskPacket = {
  schema_version: number;
  work_id: string;
  task_id: string;
  stage_id: string;
  agent_role: string;
  agent_display_name: string;
  route_tier: string;
  risk_level: string;
  title: string;
  goal: string;
  allowed_scope: string[];
  out_of_scope: string[];
  required_reads: string[];
  required_checks: string[];
  expected_handoff: string[];
  recommended_skills: string[];
  approval_triggers: string[];
  capability: AgentCapability;
  packet_markdown: string;
};

export type RunEventEntry = {
  id: string;
  work_id?: string;
  task_id?: string;
  stage_id?: string;
  attempt_id?: string;
  actor_type: string;
  actor_id: string;
  command: string;
  previous_state_json: unknown;
  next_state_json: unknown;
  reason: string;
  created_at: string;
};

export type RunEventFilters = {
  workID?: string;
  taskID?: string;
  stageID?: string;
  attemptID?: string;
  limit?: number;
};

export type Health = {
  ok: boolean;
  service: string;
  artifact_root: string;
};

export type TaskDetail = {
  stages: Stage[];
  attempts: Attempt[];
  evidence: Evidence[];
  approvals: Approval[];
  agentRuns: AgentRun[];
  runEvents: RunEventEntry[];
};

export type CockpitState = {
  health: Health | null;
  work: Work[];
  tasks: Task[];
  approvals: Approval[];
  agentCapabilities: AgentCapability[];
  agentRuns: AgentRun[];
  runEvents: RunEventEntry[];
};
