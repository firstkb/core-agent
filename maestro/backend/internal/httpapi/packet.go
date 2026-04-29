package httpapi

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"firstkb.dev/maestro/backend/internal/store"
)

func (s *Server) handleGenerateTaskPacket(w http.ResponseWriter, r *http.Request) {
	var input store.TaskPacketGenerateInput
	if !decodeJSON(w, r, &input) {
		return
	}
	if input.TaskID == "" {
		writeStoreError(w, fmt.Errorf("%w: task_id is required", store.ErrInvalidInput))
		return
	}

	task, err := s.store.GetTask(r.Context(), input.TaskID)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	work, err := s.store.GetWork(r.Context(), task.WorkID)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	stages, err := s.store.ListStages(r.Context(), task.ID)
	if err != nil {
		writeStoreError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, buildTaskPacket(work, task, stages, input))
}

func (s *Server) handleLaunchTaskPacket(w http.ResponseWriter, r *http.Request) {
	var input store.AgentLaunchInput
	if !decodeJSON(w, r, &input) {
		return
	}
	if input.TaskID == "" {
		writeStoreError(w, fmt.Errorf("%w: task_id is required", store.ErrInvalidInput))
		return
	}

	task, err := s.store.GetTask(r.Context(), input.TaskID)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	work, err := s.store.GetWork(r.Context(), task.WorkID)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	stages, err := s.store.ListStages(r.Context(), task.ID)
	if err != nil {
		writeStoreError(w, err)
		return
	}

	packetInput := store.TaskPacketGenerateInput{
		TaskID:    input.TaskID,
		StageID:   input.StageID,
		AgentRole: input.AgentRole,
	}
	packet := buildTaskPacket(work, task, stages, packetInput)
	if packet.StageID == "" {
		writeStoreError(w, fmt.Errorf("%w: launch requires a stage", store.ErrInvalidInput))
		return
	}
	if input.Start && packet.RouteTier == "high_risk" {
		writeStoreError(w, fmt.Errorf("%w: high-risk launch requires approval before start", store.ErrApprovalRequired))
		return
	}

	actor := actorFromRequest(r)
	attempt, err := s.store.CreateAttempt(r.Context(), store.AttemptInput{
		TaskID:    task.ID,
		StageID:   packet.StageID,
		AgentRole: packet.AgentRole,
	}, actor, "Agent launch attempt created")
	if err != nil {
		writeStoreError(w, err)
		return
	}

	checkpoint := strings.TrimSpace(input.CurrentCheckpoint)
	if checkpoint == "" {
		checkpoint = "packet-ready"
	}
	run, err := s.store.CreateAgentRun(r.Context(), store.AgentRunInput{
		WorkID:            &task.WorkID,
		TaskID:            &task.ID,
		StageID:           &packet.StageID,
		AttemptID:         &attempt.ID,
		AgentRole:         packet.AgentRole,
		Status:            "queued",
		CurrentCheckpoint: checkpoint,
		Metadata: map[string]any{
			"source":             "cockpit",
			"launch_packet":      packet,
			"recommended_skills": packet.RecommendedSkills,
		},
	}, actor, "Agent launch queued from task packet")
	if err != nil {
		writeStoreError(w, err)
		return
	}
	if input.Start {
		run, err = s.store.StartAgentRun(r.Context(), run.ID, actor, "Agent launch started from task packet")
		if err != nil {
			writeStoreError(w, err)
			return
		}
	}

	nextActions := []string{"open agent run", "start agent run", "submit attempt handoff"}
	if input.Start {
		nextActions = []string{"checkpoint agent run", "submit attempt handoff"}
	}
	writeJSON(w, http.StatusOK, store.AgentLaunch{
		Packet:             packet,
		Attempt:            attempt,
		AgentRun:           run,
		NextAllowedActions: nextActions,
	})
}

func (s *Server) handleGetAgentRunHandoff(w http.ResponseWriter, r *http.Request) {
	run, err := s.store.GetAgentRun(r.Context(), r.PathValue("id"))
	if err != nil {
		writeStoreError(w, err)
		return
	}
	handoff, err := s.agentHandoff(r.Context(), run)
	writeResult(w, handoff, err)
}

func (s *Server) handleClaimAgentRun(w http.ResponseWriter, r *http.Request) {
	input := decodeCommand(w, r)
	if input == nil {
		return
	}

	run, err := s.store.GetAgentRun(r.Context(), r.PathValue("id"))
	if err != nil {
		writeStoreError(w, err)
		return
	}
	switch run.Status {
	case "", "queued":
		handoff, err := s.agentHandoff(r.Context(), run)
		if err != nil {
			writeStoreError(w, err)
			return
		}
		if handoff.Packet != nil && handoff.Packet.RouteTier == "high_risk" {
			writeStoreError(w, fmt.Errorf("%w: high-risk agent run requires approval before claim", store.ErrApprovalRequired))
			return
		}
		reason := input.Reason
		if strings.TrimSpace(reason) == "" {
			reason = "Agent run claimed"
		}
		run, err = s.store.StartAgentRun(r.Context(), run.ID, input.Actor, reason)
		if err != nil {
			writeStoreError(w, err)
			return
		}
	case "running":
	default:
		writeStoreError(w, fmt.Errorf("%w: only queued or running agent runs can be claimed", store.ErrInvalidInput))
		return
	}

	handoff, err := s.agentHandoff(r.Context(), run)
	writeResult(w, handoff, err)
}

func buildTaskPacket(work store.Work, task store.Task, stages []store.Stage, input store.TaskPacketGenerateInput) store.TaskPacket {
	stage := selectPacketStage(stages, input.StageID)
	agentRole := strings.TrimSpace(input.AgentRole)
	if agentRole == "" && stage != nil {
		agentRole = stage.AgentRole
	}
	if agentRole == "" {
		agentRole = task.AgentRole
	}
	if agentRole == "" {
		agentRole = "mason"
	}
	capability := capabilityForRole(agentRole)

	goal := strings.TrimSpace(task.Description)
	if goal == "" {
		goal = task.Title
	}
	stageName := "task"
	stageID := ""
	if stage != nil {
		stageName = stage.Name
		stageID = stage.ID
	}
	allowedScope := compactStrings([]string{
		task.Title,
		fmt.Sprintf("Stack scope: %s", valueOrDash(task.StackScope)),
		fmt.Sprintf("Stage: %s", stageName),
	})
	outOfScope := []string{
		"Unrelated product behavior",
		"Production release or deployment unless explicitly approved",
		"Secrets, credentials, and local private data",
	}
	requiredReads := compactStrings([]string{
		"AGENTS.md",
		capability.SourceContract,
		"maestro/docs/security-permissions-contract.md",
		task.ArtifactPath,
	})
	requiredChecks := []string{
		"Run the narrow checks relevant to the changed surface",
		"Attach or summarize evidence before handoff",
	}
	if capability.BrowserAccess == "yes" || capability.BrowserAccess == "if assigned" {
		requiredChecks = append(requiredChecks, "Capture browser or visual notes when UI behavior is affected")
	}
	if task.RiskLevel == "high" || work.Type == "high_risk" {
		requiredChecks = append(requiredChecks, "Stop before high-risk implementation until approval is recorded")
	}
	expectedHandoff := compactStrings([]string{
		capability.NextHandoff,
		"Files changed",
		"Commands run",
		"Evidence attached or skipped with reason",
		"Residual risks",
	})

	packet := store.TaskPacket{
		SchemaVersion:     1,
		WorkID:            task.WorkID,
		TaskID:            task.ID,
		StageID:           stageID,
		AgentRole:         capability.Role,
		AgentDisplayName:  capability.DisplayName,
		RouteTier:         routeTier(work, task),
		RiskLevel:         task.RiskLevel,
		Title:             task.Title,
		Goal:              goal,
		AllowedScope:      allowedScope,
		OutOfScope:        outOfScope,
		RequiredReads:     requiredReads,
		RequiredChecks:    requiredChecks,
		ExpectedHandoff:   expectedHandoff,
		RecommendedSkills: capability.RecommendedSkills,
		ApprovalTriggers:  capability.ApprovalTriggers,
		Capability:        capability,
	}
	packet.PacketMarkdown = renderTaskPacketMarkdown(packet)
	return packet
}

func (s *Server) agentHandoff(ctx context.Context, run store.AgentRun) (store.AgentHandoff, error) {
	var attempt *store.Attempt
	if run.AttemptID != nil && *run.AttemptID != "" {
		value, err := s.store.GetAttempt(ctx, *run.AttemptID)
		if err != nil {
			return store.AgentHandoff{}, err
		}
		attempt = &value
	}

	packet, err := packetFromMetadata(run.Metadata)
	if err != nil {
		return store.AgentHandoff{}, err
	}
	if packet == nil && run.TaskID != nil && *run.TaskID != "" {
		value, err := s.rebuildTaskPacketForRun(ctx, run)
		if err != nil {
			return store.AgentHandoff{}, err
		}
		packet = &value
	}

	return store.AgentHandoff{
		AgentRun:           run,
		Attempt:            attempt,
		Packet:             packet,
		NextAllowedActions: agentHandoffActions(run, attempt, packet),
	}, nil
}

func (s *Server) rebuildTaskPacketForRun(ctx context.Context, run store.AgentRun) (store.TaskPacket, error) {
	task, err := s.store.GetTask(ctx, *run.TaskID)
	if err != nil {
		return store.TaskPacket{}, err
	}
	work, err := s.store.GetWork(ctx, task.WorkID)
	if err != nil {
		return store.TaskPacket{}, err
	}
	stages, err := s.store.ListStages(ctx, task.ID)
	if err != nil {
		return store.TaskPacket{}, err
	}
	input := store.TaskPacketGenerateInput{
		TaskID:    task.ID,
		AgentRole: run.AgentRole,
	}
	if run.StageID != nil {
		input.StageID = *run.StageID
	}
	return buildTaskPacket(work, task, stages, input), nil
}

func packetFromMetadata(metadata any) (*store.TaskPacket, error) {
	values, ok := metadata.(map[string]any)
	if !ok || values == nil {
		return nil, nil
	}
	raw, ok := values["launch_packet"]
	if !ok || raw == nil {
		return nil, nil
	}
	data, err := json.Marshal(raw)
	if err != nil {
		return nil, err
	}
	var packet store.TaskPacket
	if err := json.Unmarshal(data, &packet); err != nil {
		return nil, fmt.Errorf("%w: invalid launch packet metadata", store.ErrInvalidInput)
	}
	return &packet, nil
}

func agentHandoffActions(run store.AgentRun, attempt *store.Attempt, packet *store.TaskPacket) []string {
	var actions []string
	switch run.Status {
	case "queued":
		actions = append(actions, "claim agent run")
	case "running":
		actions = append(actions, "checkpoint agent run")
	case "pause_requested":
		actions = append(actions, "pause at checkpoint")
	case "cancel_requested":
		actions = append(actions, "cancel at checkpoint")
	}
	if packet != nil {
		actions = append(actions, "follow packet required reads/checks")
	}
	if attempt != nil {
		actions = append(actions, "submit attempt handoff")
	} else {
		actions = append(actions, "create or link attempt before handoff")
	}
	return actions
}

func selectPacketStage(stages []store.Stage, stageID string) *store.Stage {
	for i := range stages {
		if stageID != "" && stages[i].ID == stageID {
			return &stages[i]
		}
	}
	if stageID != "" {
		return nil
	}
	if len(stages) == 0 {
		return nil
	}
	return &stages[0]
}

func capabilityForRole(role string) store.AgentCapability {
	for _, capability := range store.AgentCapabilities() {
		if capability.Role == role {
			return capability
		}
	}
	return store.AgentCapability{
		Role:              role,
		DisplayName:       strings.Title(role),
		Type:              "custom",
		Purpose:           "Custom role selected by owner or Maestro.",
		WritesCode:        "scoped",
		WritesArtifacts:   "assigned attempt",
		BrowserAccess:     "if assigned",
		ReleaseAccess:     "no",
		HighRiskAccess:    "approval only",
		DefaultStages:     []string{},
		RecommendedSkills: []string{},
		ApprovalTriggers:  []string{"auth", "tenant", "migration", "secrets", "release"},
		FormalChainRole:   true,
		SourceContract:    "maestro/docs/agent-roles.md",
		NextHandoff:       "bounded attempt handoff",
	}
}

func routeTier(work store.Work, task store.Task) string {
	if task.RiskLevel == "high" || work.RiskLevel == "high" || work.Type == "high_risk" {
		return "high_risk"
	}
	switch work.Type {
	case "feature":
		return "feature"
	case "module":
		return "module_sized_work"
	default:
		return "task"
	}
}

func renderTaskPacketMarkdown(packet store.TaskPacket) string {
	return strings.Join([]string{
		"---",
		"doc_status: generated",
		"doc_type: maestro_task_packet",
		"schema_version: 1",
		"---",
		"",
		fmt.Sprintf("# Task: %s", packet.Title),
		"",
		"## Identity",
		fmt.Sprintf("- Work: %s", packet.WorkID),
		fmt.Sprintf("- Task: %s", packet.TaskID),
		fmt.Sprintf("- Stage: %s", valueOrDash(packet.StageID)),
		fmt.Sprintf("- Assigned Role: %s", packet.AgentDisplayName),
		fmt.Sprintf("- Route Tier: %s", packet.RouteTier),
		fmt.Sprintf("- Risk Level: %s", packet.RiskLevel),
		"",
		"## Goal",
		packet.Goal,
		"",
		"## Recommended Skills",
		bulletList(packet.RecommendedSkills),
		"",
		"## Allowed Scope",
		bulletList(packet.AllowedScope),
		"",
		"## Out Of Scope",
		bulletList(packet.OutOfScope),
		"",
		"## Required Reads",
		bulletList(packet.RequiredReads),
		"",
		"## Required Checks",
		bulletList(packet.RequiredChecks),
		"",
		"## Expected Handoff",
		bulletList(packet.ExpectedHandoff),
		"",
	}, "\n")
}

func bulletList(items []string) string {
	if len(items) == 0 {
		return "- none"
	}
	var out []string
	for _, item := range compactStrings(items) {
		out = append(out, fmt.Sprintf("- %s", item))
	}
	if len(out) == 0 {
		return "- none"
	}
	return strings.Join(out, "\n")
}

func compactStrings(items []string) []string {
	var out []string
	for _, item := range items {
		trimmed := strings.TrimSpace(item)
		if trimmed != "" && trimmed != "-" {
			out = append(out, trimmed)
		}
	}
	return out
}

func valueOrDash(value string) string {
	if strings.TrimSpace(value) == "" {
		return "-"
	}
	return value
}
