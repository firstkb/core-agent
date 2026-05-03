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

function RuntimeNode({
  definitionId,
  errors,
  labels,
  node,
  onFieldChange,
  values,
}: {
  definitionId: string;
  errors: RuntimeFormScaffoldProps["errors"];
  labels: ReturnType<typeof resolveRuntimeFormLabels>;
  node: RuntimeFormNodeDefinition;
  onFieldChange: RuntimeFormScaffoldProps["onFieldChange"];
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
        renderNodes={(nodes, className) => (
          <RuntimeNodeList
            className={className}
            definitionId={definitionId}
            errors={errors}
            labels={labels}
            nodes={nodes}
            onFieldChange={onFieldChange}
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
  values,
}: {
  className?: string;
  definitionId: string;
  errors: RuntimeFormScaffoldProps["errors"];
  labels: ReturnType<typeof resolveRuntimeFormLabels>;
  nodes: ReadonlyArray<RuntimeFormNodeDefinition>;
  onFieldChange: RuntimeFormScaffoldProps["onFieldChange"];
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
  saveState = "idle",
  values,
}: RuntimeFormScaffoldProps) {
  const resolvedLabels = resolveRuntimeFormLabels(labels);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onFinish();
  }

  const shouldShowSaveState = saveState !== "idle";

  return (
    <FormShell className={cx("platform-runtime-form", className)} onSubmit={handleSubmit}>
      <div className="platform-runtime-form__topbar">
        <Button onClick={onBack} type="button" variant="secondary">
          {resolvedLabels.backToList}
        </Button>
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
                  values={values}
                />
              ))}
            </FormGrid>
          </FormSection>
        ))}
      </div>

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
