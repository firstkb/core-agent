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
