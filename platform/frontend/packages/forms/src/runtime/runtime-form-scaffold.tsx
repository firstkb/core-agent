import type { FormEvent } from "react";

import {
  Button,
  FormGrid,
  FormSection,
  FormSectionDescription,
  FormSectionHeader,
  FormShell,
  FormSectionTitle,
  InlineStatus,
} from "@platform/ui-kit";

import { RuntimeField } from "./fields/runtime-field";
import { RuntimeContentNode } from "./runtime-form-content";
import { resolveRuntimeFormLabels } from "./runtime-form-labels";
import { RuntimeLayoutNode } from "./runtime-form-layout";
import {
  isRuntimeNodeVisible,
} from "./runtime-form-rules";
import type {
  RuntimeFormDefinition,
  RuntimeFormNodeDefinition,
  RuntimeFormSaveState,
  RuntimeFormScaffoldProps,
  RuntimeFormSectionDefinition,
} from "./runtime-form-types";
import {
  cx,
  findRuntimeFormField,
  isRuntimeFormContentNode,
  isRuntimeFormFieldNode,
  isRuntimeFormLayoutNode,
  resolveRuntimeSectionNodes,
} from "./runtime-form-utils";

function getSaveStateTone(saveState: RuntimeFormSaveState) {
  if (saveState === "saved") {
    return "success";
  }

  if (saveState === "saving" || saveState === "dirty") {
    return "warning";
  }

  if (saveState === "error") {
    return "danger";
  }

  return "neutral";
}

function resolveRuntimeSections(definition: RuntimeFormDefinition): ReadonlyArray<RuntimeFormSectionDefinition> {
  if (definition.sections.length > 0) {
    return definition.sections;
  }

  return [{
    id: "default",
    nodes: [],
  }];
}

function getPlainLabel(label: unknown, fallback: string) {
  return typeof label === "string" && label.trim() ? label.trim() : fallback;
}

function humanizeStatusValue(value: string | undefined) {
  if (!value?.trim()) {
    return "";
  }

  const normalized = value.trim().replace(/[-_]+/g, " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function resolveFooterInfo(
  definition: RuntimeFormDefinition,
  labels: ReturnType<typeof resolveRuntimeFormLabels>,
) {
  if (labels.finishBackInfo) {
    return labels.finishBackInfo;
  }

  const finishLabel = getPlainLabel(labels.finish, "Finish");
  const backLabel = getPlainLabel(labels.backToList, "Back to list");
  const finalStatus = humanizeStatusValue(definition.workflowStatus?.finalValue);
  const finishCopy = finalStatus
    ? `When you click "${finishLabel}", the form will have the status "${finalStatus}".`
    : `When you click "${finishLabel}", the form will run the configured finish action.`;
  const backCopy = definition.mode === "create"
    ? `If the record has not been created yet, "${backLabel}" will ask before discarding entered data; after creation, it keeps the current status.`
    : `When you click "${backLabel}", the form will keep the current status.`;

  return `${finishCopy} ${backCopy}`;
}

function RuntimeNode({
  definitionId,
  errors,
  labels,
  node,
  onFieldChange,
  revealFieldId,
  revealRequestKey,
  values,
}: {
  definitionId: string;
  errors: RuntimeFormScaffoldProps["errors"];
  labels: ReturnType<typeof resolveRuntimeFormLabels>;
  node: RuntimeFormNodeDefinition;
  onFieldChange: RuntimeFormScaffoldProps["onFieldChange"];
  revealFieldId?: string;
  revealRequestKey?: number;
  values: RuntimeFormScaffoldProps["values"];
}) {
  if (!isRuntimeNodeVisible(node, values)) {
    return null;
  }

  if (isRuntimeFormFieldNode(node)) {
    return (
      <RuntimeField
        definitionId={definitionId}
        errors={errors ?? {}}
        field={node}
        labels={labels}
        onFieldChange={onFieldChange}
        value={values[node.id]}
        values={values}
      />
    );
  }

  if (isRuntimeFormContentNode(node)) {
    return <RuntimeContentNode content={node} />;
  }

  if (isRuntimeFormLayoutNode(node)) {
    return (
      <RuntimeLayoutNode
        layout={node}
        revealFieldId={revealFieldId}
        revealRequestKey={revealRequestKey}
        renderNodes={(nodes, className) => (
          <RuntimeNodeList
            className={className}
            definitionId={definitionId}
            errors={errors}
            labels={labels}
            nodes={nodes}
            onFieldChange={onFieldChange}
            revealFieldId={revealFieldId}
            revealRequestKey={revealRequestKey}
            values={values}
          />
        )}
      />
    );
  }

  return null;
}

function RuntimeNodeList({
  className,
  definitionId,
  errors,
  labels,
  nodes,
  onFieldChange,
  revealFieldId,
  revealRequestKey,
  values,
}: {
  className?: string;
  definitionId: string;
  errors: RuntimeFormScaffoldProps["errors"];
  labels: ReturnType<typeof resolveRuntimeFormLabels>;
  nodes: ReadonlyArray<RuntimeFormNodeDefinition>;
  onFieldChange: RuntimeFormScaffoldProps["onFieldChange"];
  revealFieldId?: string;
  revealRequestKey?: number;
  values: RuntimeFormScaffoldProps["values"];
}) {
  return (
    <div className={cx("platform-runtime-form__node-grid", className)}>
      {nodes.map((node) => (
        <RuntimeNode
          definitionId={definitionId}
          errors={errors}
          key={node.id}
          labels={labels}
          node={node}
          onFieldChange={onFieldChange}
          revealFieldId={revealFieldId}
          revealRequestKey={revealRequestKey}
          values={values}
        />
      ))}
    </div>
  );
}

export function RuntimeFormScaffold({
  className,
  definition,
  errors = {},
  labels,
  onBack,
  onFieldChange,
  onFinish,
  revealFieldId,
  revealRequestKey,
  saveState = "idle",
  values,
}: RuntimeFormScaffoldProps) {
  const resolvedLabels = resolveRuntimeFormLabels(labels);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onFinish();
  }

  const shouldShowSaveState = saveState !== "idle";
  const modeInfo = definition.mode === "create"
    ? resolvedLabels.createModeInfo
    : resolvedLabels.editModeInfo;
  const footerInfo = resolveFooterInfo(definition, resolvedLabels);
  const shouldShowFooterInfo = Boolean(
    definition.workflowStatus?.fieldId && findRuntimeFormField(definition, definition.workflowStatus.fieldId),
  );

  return (
    <FormShell className={cx("platform-runtime-form", className)} onSubmit={handleSubmit}>
      <div className="platform-runtime-form__topbar">
        <div className="platform-runtime-form__topbar-main">
          <Button onClick={onBack} type="button" variant="secondary">
            {resolvedLabels.backToList}
          </Button>
          <div className="platform-runtime-form__mode-note ui-toolbar-notice ui-toolbar-notice--neutral" role="note">
            <span className="ui-toolbar-notice__content platform-runtime-form__note-content">
              <strong className="ui-toolbar-notice__title">{resolvedLabels.onlineFormTitle}</strong>
              <span className="ui-toolbar-notice__detail">{modeInfo}</span>
            </span>
          </div>
        </div>
        {shouldShowSaveState ? (
          <InlineStatus aria-live="polite" size="sm" tone={getSaveStateTone(saveState)}>
            {resolvedLabels.saveStates[saveState]}
          </InlineStatus>
        ) : null}
      </div>

      <div className="platform-runtime-form__sections">
        {resolveRuntimeSections(definition).map((section) => (
          <FormSection className="platform-runtime-form__section" key={section.id}>
            {section.title || section.description ? (
              <FormSectionHeader>
                {section.title ? <FormSectionTitle>{section.title}</FormSectionTitle> : null}
                {section.description ? <FormSectionDescription>{section.description}</FormSectionDescription> : null}
              </FormSectionHeader>
            ) : null}
            <FormGrid className="platform-runtime-form__form-grid" columns={2}>
              {resolveRuntimeSectionNodes(section).map((node) => (
                <RuntimeNode
                  definitionId={definition.id}
                  errors={errors}
                  key={node.id}
                  labels={resolvedLabels}
                  node={node}
                  onFieldChange={onFieldChange}
                  revealFieldId={revealFieldId}
                  revealRequestKey={revealRequestKey}
                  values={values}
                />
              ))}
            </FormGrid>
          </FormSection>
        ))}
      </div>

      {shouldShowFooterInfo ? (
        <div className="platform-runtime-form__footer-note ui-toolbar-notice ui-toolbar-notice--neutral" role="note">
          <span className="ui-toolbar-notice__content platform-runtime-form__note-content">
            <span className="ui-toolbar-notice__detail">{footerInfo}</span>
          </span>
        </div>
      ) : null}

      <div className="platform-runtime-form__footer">
        <Button onClick={onBack} type="button" variant="secondary">
          {resolvedLabels.backToList}
        </Button>
        <Button type="submit" variant="success">
          {resolvedLabels.finish}
        </Button>
      </div>
    </FormShell>
  );
}
