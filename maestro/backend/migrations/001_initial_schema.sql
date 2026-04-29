CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION maestro_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  root_path text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  root_path text NOT NULL DEFAULT '',
  remote_url text NOT NULL DEFAULT '',
  default_branch text NOT NULL DEFAULT 'develop',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid REFERENCES repositories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  type text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  artifact_shape text NOT NULL DEFAULT 'none',
  risk_level text NOT NULL DEFAULT 'low',
  priority text NOT NULL DEFAULT 'normal',
  owner text NOT NULL DEFAULT 'owner',
  branch text NOT NULL DEFAULT '',
  pr_url text NOT NULL DEFAULT '',
  artifact_root text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (type IN ('direct', 'task', 'feature', 'module_sized_work', 'high_risk')),
  CHECK (status IN ('draft', 'ready', 'awaiting_approval', 'in_progress', 'awaiting_review', 'blocked', 'done', 'cancelled')),
  CHECK (artifact_shape IN ('none', 'lightweight', 'staged_task', 'feature_work', 'full')),
  CHECK (risk_level IN ('low', 'medium', 'high')),
  CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

CREATE TABLE IF NOT EXISTS features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid NOT NULL REFERENCES work(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  sequence integer NOT NULL DEFAULT 0,
  priority text NOT NULL DEFAULT 'normal',
  artifact_path text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('draft', 'ready', 'in_progress', 'blocked', 'done', 'cancelled')),
  CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid NOT NULL REFERENCES work(id) ON DELETE CASCADE,
  feature_id uuid REFERENCES features(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  lane text NOT NULL DEFAULT '',
  stack_scope text NOT NULL DEFAULT '',
  risk_level text NOT NULL DEFAULT 'low',
  priority text NOT NULL DEFAULT 'normal',
  assignee_type text NOT NULL DEFAULT 'agent',
  agent_role text NOT NULL DEFAULT '',
  branch text NOT NULL DEFAULT '',
  pr_url text NOT NULL DEFAULT '',
  ci_status text NOT NULL DEFAULT '',
  visual_status text NOT NULL DEFAULT '',
  artifact_path text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('draft', 'ready', 'blocked', 'awaiting_approval', 'in_progress', 'awaiting_review', 'revise_requested', 'verified', 'done', 'cancelled')),
  CHECK (risk_level IN ('low', 'medium', 'high')),
  CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

CREATE TABLE IF NOT EXISTS task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type text NOT NULL DEFAULT 'blocks',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (task_id <> dependency_task_id),
  UNIQUE (task_id, dependency_task_id)
);

CREATE TABLE IF NOT EXISTS stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  sequence integer NOT NULL DEFAULT 0,
  agent_role text NOT NULL DEFAULT '',
  checkpoint_policy text NOT NULL DEFAULT '',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (name IN ('planning', 'research', 'brief_audit', 'implementation', 'verification', 'review', 'release', 'closeout', 'memory_audit')),
  CHECK (status IN ('pending', 'ready', 'in_progress', 'pause_requested', 'paused', 'resume_requested', 'awaiting_review', 'accepted', 'revise_requested', 'cancel_requested', 'failed', 'cancelled', 'stale')),
  UNIQUE (task_id, name, sequence)
);

CREATE TABLE IF NOT EXISTS agent_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  can_write_code boolean NOT NULL DEFAULT false,
  allowed_stages_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid REFERENCES work(id) ON DELETE SET NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  stage_id uuid REFERENCES stages(id) ON DELETE SET NULL,
  attempt_id uuid,
  agent_role text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  current_checkpoint text NOT NULL DEFAULT '',
  last_heartbeat_at timestamptz,
  pause_requested_at timestamptz,
  cancel_requested_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  CHECK (status IN ('queued', 'running', 'pause_requested', 'pausing_at_checkpoint', 'paused', 'resume_requested', 'resuming', 'cancel_requested', 'cancelling_at_checkpoint', 'cancelled', 'failed', 'completed', 'stale'))
);

CREATE TABLE IF NOT EXISTS attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  attempt_no integer NOT NULL DEFAULT 1,
  agent_role text NOT NULL DEFAULT '',
  agent_run_id uuid REFERENCES agent_runs(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'created',
  summary text NOT NULL DEFAULT '',
  handoff_path text NOT NULL DEFAULT '',
  readme_path text NOT NULL DEFAULT '',
  files_changed_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  commands_run_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  CHECK (status IN ('created', 'running', 'pause_requested', 'paused', 'resume_requested', 'submitted', 'accepted', 'rejected', 'cancel_requested', 'failed', 'cancelled', 'stale')),
  UNIQUE (stage_id, attempt_no)
);

ALTER TABLE agent_runs
  ADD CONSTRAINT agent_runs_attempt_id_fkey
  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid REFERENCES work(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES stages(id) ON DELETE CASCADE,
  attempt_id uuid REFERENCES attempts(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  uri text NOT NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (type IN ('command', 'test', 'browser', 'visual', 'storybook', 'ci', 'review', 'approval', 'release', 'note', 'artifact')),
  CHECK (
    ((work_id IS NOT NULL)::integer +
     (task_id IS NOT NULL)::integer +
     (stage_id IS NOT NULL)::integer +
     (attempt_id IS NOT NULL)::integer) >= 1
  )
);

CREATE TABLE IF NOT EXISTS approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid REFERENCES work(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  approval_type text NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  requested_by text NOT NULL DEFAULT '',
  approved_by text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  CHECK (approval_type IN ('brief', 'execution', 'high_risk_implementation', 'security', 'migration', 'release', 'memory_update')),
  CHECK (status IN ('requested', 'approved', 'rejected', 'cancelled', 'expired')),
  CHECK (work_id IS NOT NULL OR task_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS run_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid REFERENCES work(id) ON DELETE SET NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  stage_id uuid REFERENCES stages(id) ON DELETE SET NULL,
  attempt_id uuid REFERENCES attempts(id) ON DELETE SET NULL,
  actor_type text NOT NULL,
  actor_id text NOT NULL,
  command text NOT NULL,
  previous_state_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  next_state_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid REFERENCES work(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES stages(id) ON DELETE CASCADE,
  body text NOT NULL,
  author_type text NOT NULL DEFAULT 'owner',
  author_id text NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (work_id IS NOT NULL OR task_id IS NOT NULL OR stage_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS external_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid REFERENCES work(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES stages(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (work_id IS NOT NULL OR task_id IS NOT NULL OR stage_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_repositories_workspace_id ON repositories(workspace_id);
CREATE INDEX IF NOT EXISTS idx_work_repository_status ON work(repository_id, status);
CREATE INDEX IF NOT EXISTS idx_features_work_id ON features(work_id);
CREATE INDEX IF NOT EXISTS idx_tasks_work_status ON tasks(work_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_feature_id ON tasks(feature_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_stages_task_status ON stages(task_id, status);
CREATE INDEX IF NOT EXISTS idx_attempts_stage_id ON attempts(stage_id);
CREATE INDEX IF NOT EXISTS idx_evidence_attempt_id ON evidence(attempt_id);
CREATE INDEX IF NOT EXISTS idx_approvals_task_status ON approvals(task_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_stage_status ON agent_runs(stage_id, status);
CREATE INDEX IF NOT EXISTS idx_run_events_work_created ON run_events(work_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_run_events_task_created ON run_events(task_id, created_at DESC);

DROP TRIGGER IF EXISTS set_workspaces_updated_at ON workspaces;
CREATE TRIGGER set_workspaces_updated_at
BEFORE UPDATE ON workspaces
FOR EACH ROW EXECUTE FUNCTION maestro_set_updated_at();

DROP TRIGGER IF EXISTS set_repositories_updated_at ON repositories;
CREATE TRIGGER set_repositories_updated_at
BEFORE UPDATE ON repositories
FOR EACH ROW EXECUTE FUNCTION maestro_set_updated_at();

DROP TRIGGER IF EXISTS set_work_updated_at ON work;
CREATE TRIGGER set_work_updated_at
BEFORE UPDATE ON work
FOR EACH ROW EXECUTE FUNCTION maestro_set_updated_at();

DROP TRIGGER IF EXISTS set_features_updated_at ON features;
CREATE TRIGGER set_features_updated_at
BEFORE UPDATE ON features
FOR EACH ROW EXECUTE FUNCTION maestro_set_updated_at();

DROP TRIGGER IF EXISTS set_tasks_updated_at ON tasks;
CREATE TRIGGER set_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION maestro_set_updated_at();

DROP TRIGGER IF EXISTS set_stages_updated_at ON stages;
CREATE TRIGGER set_stages_updated_at
BEFORE UPDATE ON stages
FOR EACH ROW EXECUTE FUNCTION maestro_set_updated_at();

DROP TRIGGER IF EXISTS set_agent_roles_updated_at ON agent_roles;
CREATE TRIGGER set_agent_roles_updated_at
BEFORE UPDATE ON agent_roles
FOR EACH ROW EXECUTE FUNCTION maestro_set_updated_at();
