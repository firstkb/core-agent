import type {
  BuilderActionBindingId,
  BuilderEntityId,
  BuilderJsonValue,
  BuilderWorkflowId,
  BuilderWorkflowStatusId,
  BuilderWorkflowTransitionId,
  WorkflowEvent,
} from "./common";

export type WorkflowStatusDefinition = {
  colorToken?: string;
  id: BuilderWorkflowStatusId;
  isInitial?: boolean;
  key: string;
  label: string;
};

export type WorkflowActionBinding = {
  config?: Record<string, BuilderJsonValue>;
  event: WorkflowEvent;
  handlerKey: string;
  id: BuilderActionBindingId;
};

export type WorkflowTransitionDefinition = {
  actionBindingIds?: BuilderActionBindingId[];
  fromStatusId: BuilderWorkflowStatusId;
  id: BuilderWorkflowTransitionId;
  key: string;
  label: string;
  toStatusId: BuilderWorkflowStatusId;
};

export type WorkflowDefinition = {
  actionBindings?: WorkflowActionBinding[];
  entityId: BuilderEntityId;
  id: BuilderWorkflowId;
  key: string;
  name: string;
  statuses: WorkflowStatusDefinition[];
  transitions: WorkflowTransitionDefinition[];
};
