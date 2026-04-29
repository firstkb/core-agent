package store

import (
	"errors"
	"time"
)

var (
	ErrNotFound         = errors.New("not found")
	ErrApprovalRequired = errors.New("approval required")
	ErrInvalidInput     = errors.New("invalid input")
)

type Actor struct {
	Type string `json:"type"`
	ID   string `json:"id"`
}

type Work struct {
	ID            string    `json:"id"`
	RepositoryID  *string   `json:"repository_id,omitempty"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	Type          string    `json:"type"`
	Status        string    `json:"status"`
	ArtifactShape string    `json:"artifact_shape"`
	RiskLevel     string    `json:"risk_level"`
	Priority      string    `json:"priority"`
	Owner         string    `json:"owner"`
	Branch        string    `json:"branch"`
	PRURL         string    `json:"pr_url"`
	ArtifactRoot  string    `json:"artifact_root"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type WorkInput struct {
	RepositoryID  *string `json:"repository_id"`
	Title         string  `json:"title"`
	Description   string  `json:"description"`
	Type          string  `json:"type"`
	Status        string  `json:"status"`
	ArtifactShape string  `json:"artifact_shape"`
	RiskLevel     string  `json:"risk_level"`
	Priority      string  `json:"priority"`
	Owner         string  `json:"owner"`
	Branch        string  `json:"branch"`
	PRURL         string  `json:"pr_url"`
	ArtifactRoot  string  `json:"artifact_root"`
}

type WorkPatch struct {
	Title         *string `json:"title"`
	Description   *string `json:"description"`
	Type          *string `json:"type"`
	Status        *string `json:"status"`
	ArtifactShape *string `json:"artifact_shape"`
	RiskLevel     *string `json:"risk_level"`
	Priority      *string `json:"priority"`
	Owner         *string `json:"owner"`
	Branch        *string `json:"branch"`
	PRURL         *string `json:"pr_url"`
	ArtifactRoot  *string `json:"artifact_root"`
}

type WorkFilters struct {
	Status    string
	Type      string
	RiskLevel string
	Owner     string
}

type Task struct {
	ID           string    `json:"id"`
	WorkID       string    `json:"work_id"`
	FeatureID    *string   `json:"feature_id,omitempty"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	Status       string    `json:"status"`
	Lane         string    `json:"lane"`
	StackScope   string    `json:"stack_scope"`
	RiskLevel    string    `json:"risk_level"`
	Priority     string    `json:"priority"`
	AssigneeType string    `json:"assignee_type"`
	AgentRole    string    `json:"agent_role"`
	Branch       string    `json:"branch"`
	PRURL        string    `json:"pr_url"`
	CIStatus     string    `json:"ci_status"`
	VisualStatus string    `json:"visual_status"`
	ArtifactPath string    `json:"artifact_path"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type TaskInput struct {
	WorkID       string  `json:"work_id"`
	FeatureID    *string `json:"feature_id"`
	Title        string  `json:"title"`
	Description  string  `json:"description"`
	Status       string  `json:"status"`
	Lane         string  `json:"lane"`
	StackScope   string  `json:"stack_scope"`
	RiskLevel    string  `json:"risk_level"`
	Priority     string  `json:"priority"`
	AssigneeType string  `json:"assignee_type"`
	AgentRole    string  `json:"agent_role"`
	Branch       string  `json:"branch"`
	PRURL        string  `json:"pr_url"`
	CIStatus     string  `json:"ci_status"`
	VisualStatus string  `json:"visual_status"`
	ArtifactPath string  `json:"artifact_path"`
}

type TaskPatch struct {
	Title        *string `json:"title"`
	Description  *string `json:"description"`
	Status       *string `json:"status"`
	Lane         *string `json:"lane"`
	StackScope   *string `json:"stack_scope"`
	RiskLevel    *string `json:"risk_level"`
	Priority     *string `json:"priority"`
	AssigneeType *string `json:"assignee_type"`
	AgentRole    *string `json:"agent_role"`
	Branch       *string `json:"branch"`
	PRURL        *string `json:"pr_url"`
	CIStatus     *string `json:"ci_status"`
	VisualStatus *string `json:"visual_status"`
	ArtifactPath *string `json:"artifact_path"`
}

type TaskFilters struct {
	WorkID    string
	FeatureID string
	Status    string
	Lane      string
	RiskLevel string
}

type Stage struct {
	ID               string     `json:"id"`
	TaskID           string     `json:"task_id"`
	Name             string     `json:"name"`
	Status           string     `json:"status"`
	Sequence         int        `json:"sequence"`
	AgentRole        string     `json:"agent_role"`
	CheckpointPolicy string     `json:"checkpoint_policy"`
	StartedAt        *time.Time `json:"started_at,omitempty"`
	CompletedAt      *time.Time `json:"completed_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

type StageInput struct {
	TaskID           string `json:"task_id"`
	Name             string `json:"name"`
	Status           string `json:"status"`
	Sequence         int    `json:"sequence"`
	AgentRole        string `json:"agent_role"`
	CheckpointPolicy string `json:"checkpoint_policy"`
}

type Attempt struct {
	ID           string     `json:"id"`
	TaskID       string     `json:"task_id"`
	StageID      string     `json:"stage_id"`
	AttemptNo    int        `json:"attempt_no"`
	AgentRole    string     `json:"agent_role"`
	AgentRunID   *string    `json:"agent_run_id,omitempty"`
	Status       string     `json:"status"`
	Summary      string     `json:"summary"`
	HandoffPath  string     `json:"handoff_path"`
	ReadmePath   string     `json:"readme_path"`
	FilesChanged any        `json:"files_changed_json"`
	CommandsRun  any        `json:"commands_run_json"`
	Evidence     any        `json:"evidence_json"`
	CreatedAt    time.Time  `json:"created_at"`
	SubmittedAt  *time.Time `json:"submitted_at,omitempty"`
}

type AttemptInput struct {
	TaskID    string `json:"task_id"`
	StageID   string `json:"stage_id"`
	AgentRole string `json:"agent_role"`
}

type AttemptSubmitInput struct {
	Summary      string `json:"summary"`
	HandoffPath  string `json:"handoff_path"`
	ReadmePath   string `json:"readme_path"`
	FilesChanged any    `json:"files_changed_json"`
	CommandsRun  any    `json:"commands_run_json"`
	Evidence     any    `json:"evidence_json"`
}

type Evidence struct {
	ID        string    `json:"id"`
	WorkID    *string   `json:"work_id,omitempty"`
	TaskID    *string   `json:"task_id,omitempty"`
	StageID   *string   `json:"stage_id,omitempty"`
	AttemptID *string   `json:"attempt_id,omitempty"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	URI       string    `json:"uri"`
	Metadata  any       `json:"metadata_json"`
	CreatedAt time.Time `json:"created_at"`
}

type EvidenceInput struct {
	WorkID    *string `json:"work_id"`
	TaskID    *string `json:"task_id"`
	StageID   *string `json:"stage_id"`
	AttemptID *string `json:"attempt_id"`
	Type      string  `json:"type"`
	Title     string  `json:"title"`
	URI       string  `json:"uri"`
	Metadata  any     `json:"metadata_json"`
}

type Approval struct {
	ID           string     `json:"id"`
	WorkID       *string    `json:"work_id,omitempty"`
	TaskID       *string    `json:"task_id,omitempty"`
	ApprovalType string     `json:"approval_type"`
	Status       string     `json:"status"`
	RequestedBy  string     `json:"requested_by"`
	ApprovedBy   string     `json:"approved_by"`
	Reason       string     `json:"reason"`
	CreatedAt    time.Time  `json:"created_at"`
	DecidedAt    *time.Time `json:"decided_at,omitempty"`
}

type ApprovalInput struct {
	WorkID       *string `json:"work_id"`
	TaskID       *string `json:"task_id"`
	ApprovalType string  `json:"approval_type"`
	RequestedBy  string  `json:"requested_by"`
	Reason       string  `json:"reason"`
}

type ApprovalDecision struct {
	Decision  string `json:"decision"`
	DecidedBy string `json:"decided_by"`
	Reason    string `json:"reason"`
}

type AgentRun struct {
	ID                string     `json:"id"`
	WorkID            *string    `json:"work_id,omitempty"`
	TaskID            *string    `json:"task_id,omitempty"`
	StageID           *string    `json:"stage_id,omitempty"`
	AttemptID         *string    `json:"attempt_id,omitempty"`
	AgentRole         string     `json:"agent_role"`
	Status            string     `json:"status"`
	CurrentCheckpoint string     `json:"current_checkpoint"`
	LastHeartbeatAt   *time.Time `json:"last_heartbeat_at,omitempty"`
	PauseRequestedAt  *time.Time `json:"pause_requested_at,omitempty"`
	CancelRequestedAt *time.Time `json:"cancel_requested_at,omitempty"`
	StartedAt         *time.Time `json:"started_at,omitempty"`
	CompletedAt       *time.Time `json:"completed_at,omitempty"`
	Metadata          any        `json:"metadata_json"`
}

type AgentRunInput struct {
	WorkID            *string `json:"work_id"`
	TaskID            *string `json:"task_id"`
	StageID           *string `json:"stage_id"`
	AttemptID         *string `json:"attempt_id"`
	AgentRole         string  `json:"agent_role"`
	Status            string  `json:"status"`
	CurrentCheckpoint string  `json:"current_checkpoint"`
	Metadata          any     `json:"metadata_json"`
}

type AgentRunFilters struct {
	WorkID    string
	TaskID    string
	StageID   string
	Status    string
	AgentRole string
}

type AgentRunCheckpointInput struct {
	Checkpoint string `json:"checkpoint"`
	Metadata   any    `json:"metadata_json"`
}

type AgentCapability struct {
	Role              string   `json:"role"`
	DisplayName       string   `json:"display_name"`
	Type              string   `json:"type"`
	Purpose           string   `json:"purpose"`
	WritesCode        string   `json:"writes_code"`
	WritesArtifacts   string   `json:"writes_artifacts"`
	BrowserAccess     string   `json:"browser_access"`
	ReleaseAccess     string   `json:"release_access"`
	HighRiskAccess    string   `json:"high_risk_access"`
	DefaultStages     []string `json:"default_stages"`
	RecommendedSkills []string `json:"recommended_skills"`
	ApprovalTriggers  []string `json:"approval_triggers"`
	FormalChainRole   bool     `json:"formal_chain_role"`
	IndependentHelper bool     `json:"independent_helper"`
	SourceContract    string   `json:"source_contract"`
	NextHandoff       string   `json:"next_handoff"`
}

type TaskPacketGenerateInput struct {
	TaskID    string `json:"task_id"`
	StageID   string `json:"stage_id"`
	AgentRole string `json:"agent_role"`
}

type AgentLaunchInput struct {
	TaskID            string `json:"task_id"`
	StageID           string `json:"stage_id"`
	AgentRole         string `json:"agent_role"`
	CurrentCheckpoint string `json:"current_checkpoint"`
	Start             bool   `json:"start"`
}

type AgentLaunch struct {
	Packet             TaskPacket `json:"packet"`
	Attempt            Attempt    `json:"attempt"`
	AgentRun           AgentRun   `json:"agent_run"`
	NextAllowedActions []string   `json:"next_allowed_actions"`
}

type AgentHandoff struct {
	AgentRun           AgentRun    `json:"agent_run"`
	Attempt            *Attempt    `json:"attempt,omitempty"`
	Packet             *TaskPacket `json:"packet,omitempty"`
	NextAllowedActions []string    `json:"next_allowed_actions"`
}

type TaskPacket struct {
	SchemaVersion     int             `json:"schema_version"`
	WorkID            string          `json:"work_id"`
	TaskID            string          `json:"task_id"`
	StageID           string          `json:"stage_id"`
	AgentRole         string          `json:"agent_role"`
	AgentDisplayName  string          `json:"agent_display_name"`
	RouteTier         string          `json:"route_tier"`
	RiskLevel         string          `json:"risk_level"`
	Title             string          `json:"title"`
	Goal              string          `json:"goal"`
	AllowedScope      []string        `json:"allowed_scope"`
	OutOfScope        []string        `json:"out_of_scope"`
	RequiredReads     []string        `json:"required_reads"`
	RequiredChecks    []string        `json:"required_checks"`
	ExpectedHandoff   []string        `json:"expected_handoff"`
	RecommendedSkills []string        `json:"recommended_skills"`
	ApprovalTriggers  []string        `json:"approval_triggers"`
	Capability        AgentCapability `json:"capability"`
	PacketMarkdown    string          `json:"packet_markdown"`
}

type RunEventEntry struct {
	ID            string    `json:"id"`
	WorkID        *string   `json:"work_id,omitempty"`
	TaskID        *string   `json:"task_id,omitempty"`
	StageID       *string   `json:"stage_id,omitempty"`
	AttemptID     *string   `json:"attempt_id,omitempty"`
	ActorType     string    `json:"actor_type"`
	ActorID       string    `json:"actor_id"`
	Command       string    `json:"command"`
	PreviousState any       `json:"previous_state_json"`
	NextState     any       `json:"next_state_json"`
	Reason        string    `json:"reason"`
	CreatedAt     time.Time `json:"created_at"`
}

type RunEventFilters struct {
	WorkID    string
	TaskID    string
	StageID   string
	AttemptID string
	Limit     int
}
