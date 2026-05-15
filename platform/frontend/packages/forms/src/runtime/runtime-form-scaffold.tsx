import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

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
import {
  formatRuntimeGeoPointValue,
} from "./runtime-form-geo-point";
import { resolveRuntimeFormLabels } from "./runtime-form-labels";
import { RuntimeLayoutNode } from "./runtime-form-layout";
import {
  isRuntimeNodeVisible,
} from "./runtime-form-rules";
import { RuntimeSubformNode } from "./runtime-form-subform";
import type {
  RuntimeFormDefinition,
  RuntimeFormContentDefinition,
  RuntimeFormFieldDefinition,
  RuntimeFormNodeDefinition,
  RuntimeFormResolvedLabels,
  RuntimeFormSaveState,
  RuntimeFormScaffoldProps,
  RuntimeFormSectionDefinition,
  RuntimeFormValue,
  RuntimeFormValues,
} from "./runtime-form-types";
import {
  cx,
  findRuntimeFormField,
  getRuntimeLayoutChildNodes,
  isRuntimeFormValueEmpty,
  isRuntimeFormContentNode,
  isRuntimeFormFieldNode,
  isRuntimeFormLayoutNode,
  isRuntimeFormSubformNode,
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

function collectAutoGeoPointFields(
  nodes: ReadonlyArray<RuntimeFormNodeDefinition>,
  values: RuntimeFormValues,
  out: RuntimeFormFieldDefinition[],
) {
  for (const node of nodes) {
    if (!isRuntimeNodeVisible(node, values)) {
      continue;
    }

    if (isRuntimeFormFieldNode(node)) {
      if (node.type === "geo_point" && !node.disabled && isRuntimeFormValueEmpty(values[node.id])) {
        out.push(node);
      }
      continue;
    }

    if (isRuntimeFormLayoutNode(node)) {
      collectAutoGeoPointFields(getRuntimeLayoutChildNodes(node), values, out);
    }
  }
}

function resolveAutoGeoPointFields(definition: RuntimeFormDefinition, values: RuntimeFormValues) {
  const out: RuntimeFormFieldDefinition[] = [];
  for (const section of resolveRuntimeSections(definition)) {
    collectAutoGeoPointFields(resolveRuntimeSectionNodes(section), values, out);
  }
  return out;
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
    ? labels.finishBackInfoStatusTemplate
      .replace("{{finish}}", finishLabel)
      .replace("{{status}}", finalStatus)
    : labels.finishBackInfoActionTemplate.replace("{{finish}}", finishLabel);
  const backCopy = definition.mode === "create"
    ? labels.finishBackInfoCreateBackTemplate.replace("{{back}}", backLabel)
    : labels.finishBackInfoEditBackTemplate.replace("{{back}}", backLabel);

  return `${finishCopy} ${backCopy}`;
}

function lookupOutputValueKey(sourceFieldId: string, outputKey: string) {
  return `${sourceFieldId}::lookup_output::${outputKey}`;
}

function runtimeValueToString(value: RuntimeFormValue | undefined) {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return "";
}

function resolveRuntimeContentValue(
  content: RuntimeFormContentDefinition,
  definition: RuntimeFormDefinition,
  recordId: RuntimeFormScaffoldProps["recordId"],
  values: RuntimeFormValues,
  labels: RuntimeFormResolvedLabels,
) {
  const binding = content.valueBinding;
  if (!binding) {
    return content.value;
  }

  if (binding.kind === "lookup_derived_output") {
    const directValue = runtimeValueToString(values[lookupOutputValueKey(binding.sourceFieldId, binding.outputKey)]);
    if (directValue) {
      return directValue;
    }

    const sourceValue = runtimeValueToString(values[binding.sourceFieldId]);
    const sourceField = findRuntimeFormField(definition, binding.sourceFieldId);
    const optionValue = sourceField?.options?.find((option) => option.value === sourceValue)?.fields?.[binding.outputKey];
    return optionValue?.trim() || content.value || labels.emptyValue;
  }

  if (binding.kind === "root_record_id") {
    if (typeof recordId === "number" && Number.isFinite(recordId)) {
      return String(recordId);
    }
    if (typeof recordId === "string" && recordId.trim()) {
      return recordId.trim();
    }
    return content.value ?? labels.emptyValue;
  }

  return content.value ?? labels.emptyValue;
}

function RuntimeNode({
  activeTabs,
  definition,
  definitionId,
  errors,
  labels,
  loadLookupOptions,
  node,
  onActiveTabChange,
  onFieldChange,
  onChecklistItemChange,
  resolvingGeoPointFieldIds,
  resolveGeoPoint,
  onSubformAdd,
  onSubformDelete,
  onSubformEdit,
  recordId,
  revealChecklistItem,
  revealFieldId,
  revealNodeId,
  revealRequestKey,
  subforms,
  values,
}: {
  activeTabs?: RuntimeFormScaffoldProps["activeTabs"];
  definition: RuntimeFormDefinition;
  definitionId: string;
  errors: RuntimeFormScaffoldProps["errors"];
  labels: ReturnType<typeof resolveRuntimeFormLabels>;
  loadLookupOptions?: RuntimeFormScaffoldProps["loadLookupOptions"];
  node: RuntimeFormNodeDefinition;
  onActiveTabChange?: RuntimeFormScaffoldProps["onActiveTabChange"];
  onFieldChange: RuntimeFormScaffoldProps["onFieldChange"];
  onChecklistItemChange?: RuntimeFormScaffoldProps["onChecklistItemChange"];
  resolvingGeoPointFieldIds: ReadonlySet<string>;
  resolveGeoPoint?: RuntimeFormScaffoldProps["resolveGeoPoint"];
  onSubformAdd?: RuntimeFormScaffoldProps["onSubformAdd"];
  onSubformDelete?: RuntimeFormScaffoldProps["onSubformDelete"];
  onSubformEdit?: RuntimeFormScaffoldProps["onSubformEdit"];
  recordId?: RuntimeFormScaffoldProps["recordId"];
  revealChecklistItem?: RuntimeFormScaffoldProps["revealChecklistItem"];
  revealFieldId?: string;
  revealNodeId?: string;
  revealRequestKey?: number;
  subforms?: RuntimeFormScaffoldProps["subforms"];
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
        isResolvingGeoPoint={resolvingGeoPointFieldIds.has(node.id)}
        labels={labels}
        loadLookupOptions={loadLookupOptions}
        onFieldChange={onFieldChange}
        resolveGeoPoint={resolveGeoPoint}
        value={values[node.id]}
        values={values}
      />
    );
  }

  if (isRuntimeFormContentNode(node)) {
    return (
      <RuntimeContentNode
        content={node}
        labels={labels}
        value={resolveRuntimeContentValue(node, definition, recordId, values, labels)}
      />
    );
  }

  if (isRuntimeFormSubformNode(node)) {
    return (
      <RuntimeSubformNode
        labels={labels}
        checklist={subforms?.[node.schemaScopeId]?.checklist}
        checklistRevealRequest={revealChecklistItem}
        onChecklistItemChange={onChecklistItemChange}
        onAdd={onSubformAdd}
        onDelete={onSubformDelete}
        onEdit={onSubformEdit}
        rows={subforms?.[node.schemaScopeId]?.rows}
        subform={node}
      />
    );
  }

  if (isRuntimeFormLayoutNode(node)) {
    return (
      <RuntimeLayoutNode
        activeTabs={activeTabs}
        layout={node}
        onActiveTabChange={onActiveTabChange}
        revealFieldId={revealFieldId}
        revealNodeId={revealNodeId}
        revealRequestKey={revealRequestKey}
        renderNodes={(nodes, className) => (
          <RuntimeNodeList
            activeTabs={activeTabs}
            className={className}
            definition={definition}
            definitionId={definitionId}
            errors={errors}
            labels={labels}
            loadLookupOptions={loadLookupOptions}
            nodes={nodes}
            onActiveTabChange={onActiveTabChange}
            onFieldChange={onFieldChange}
            onChecklistItemChange={onChecklistItemChange}
            resolvingGeoPointFieldIds={resolvingGeoPointFieldIds}
            resolveGeoPoint={resolveGeoPoint}
            onSubformAdd={onSubformAdd}
            onSubformDelete={onSubformDelete}
            onSubformEdit={onSubformEdit}
            recordId={recordId}
            revealChecklistItem={revealChecklistItem}
            revealFieldId={revealFieldId}
            revealNodeId={revealNodeId}
            revealRequestKey={revealRequestKey}
            subforms={subforms}
            values={values}
          />
        )}
      />
    );
  }

  return null;
}

function RuntimeNodeList({
  activeTabs,
  className,
  definition,
  definitionId,
  errors,
  labels,
  loadLookupOptions,
  nodes,
  onActiveTabChange,
  onFieldChange,
  onChecklistItemChange,
  resolvingGeoPointFieldIds,
  resolveGeoPoint,
  onSubformAdd,
  onSubformDelete,
  onSubformEdit,
  recordId,
  revealChecklistItem,
  revealFieldId,
  revealNodeId,
  revealRequestKey,
  subforms,
  values,
}: {
  activeTabs?: RuntimeFormScaffoldProps["activeTabs"];
  className?: string;
  definition: RuntimeFormDefinition;
  definitionId: string;
  errors: RuntimeFormScaffoldProps["errors"];
  labels: ReturnType<typeof resolveRuntimeFormLabels>;
  loadLookupOptions?: RuntimeFormScaffoldProps["loadLookupOptions"];
  nodes: ReadonlyArray<RuntimeFormNodeDefinition>;
  onActiveTabChange?: RuntimeFormScaffoldProps["onActiveTabChange"];
  onFieldChange: RuntimeFormScaffoldProps["onFieldChange"];
  onChecklistItemChange?: RuntimeFormScaffoldProps["onChecklistItemChange"];
  resolvingGeoPointFieldIds: ReadonlySet<string>;
  resolveGeoPoint?: RuntimeFormScaffoldProps["resolveGeoPoint"];
  onSubformAdd?: RuntimeFormScaffoldProps["onSubformAdd"];
  onSubformDelete?: RuntimeFormScaffoldProps["onSubformDelete"];
  onSubformEdit?: RuntimeFormScaffoldProps["onSubformEdit"];
  recordId?: RuntimeFormScaffoldProps["recordId"];
  revealChecklistItem?: RuntimeFormScaffoldProps["revealChecklistItem"];
  revealFieldId?: string;
  revealNodeId?: string;
  revealRequestKey?: number;
  subforms?: RuntimeFormScaffoldProps["subforms"];
  values: RuntimeFormScaffoldProps["values"];
}) {
  return (
    <div className={cx("platform-runtime-form__node-grid", className)}>
      {nodes.map((node) => (
        <RuntimeNode
          activeTabs={activeTabs}
          definition={definition}
          definitionId={definitionId}
          errors={errors}
          key={node.id}
          labels={labels}
          loadLookupOptions={loadLookupOptions}
          node={node}
          onActiveTabChange={onActiveTabChange}
          onFieldChange={onFieldChange}
          onChecklistItemChange={onChecklistItemChange}
          resolvingGeoPointFieldIds={resolvingGeoPointFieldIds}
          resolveGeoPoint={resolveGeoPoint}
          onSubformAdd={onSubformAdd}
          onSubformDelete={onSubformDelete}
          onSubformEdit={onSubformEdit}
          recordId={recordId}
          revealChecklistItem={revealChecklistItem}
          revealFieldId={revealFieldId}
          revealNodeId={revealNodeId}
          revealRequestKey={revealRequestKey}
          subforms={subforms}
          values={values}
        />
      ))}
    </div>
  );
}

export function RuntimeFormScaffold({
  activeTabs,
  className,
  definition,
  errors = {},
  labels,
  loadLookupOptions,
  onActiveTabChange,
  onBack,
  onFieldChange,
  onChecklistItemChange,
  resolveGeoPoint,
  onFinish,
  onSubformAdd,
  onSubformDelete,
  onSubformEdit,
  recordId,
  revealChecklistItem,
  revealFieldId,
  revealNodeId,
  revealRequestKey,
  saveState = "idle",
  subforms,
  values,
}: RuntimeFormScaffoldProps) {
  const resolvedLabels = resolveRuntimeFormLabels(labels);
  const geoPointAttemptedFieldIdsRef = useRef<Set<string>>(new Set());
  const geoPointSessionRef = useRef(0);
  const latestValuesRef = useRef(values);
  const [resolvingGeoPointFieldIds, setResolvingGeoPointFieldIds] = useState<ReadonlySet<string>>(() => new Set());
  latestValuesRef.current = values;

  useEffect(() => {
    geoPointSessionRef.current += 1;
    geoPointAttemptedFieldIdsRef.current.clear();
    setResolvingGeoPointFieldIds(new Set());
  }, [definition]);

  useEffect(() => {
    if (!resolveGeoPoint) {
      return;
    }

    const autoGeoPointFields = resolveAutoGeoPointFields(definition, values);
    for (const field of autoGeoPointFields) {
      if (geoPointAttemptedFieldIdsRef.current.has(field.id)) {
        continue;
      }

      const session = geoPointSessionRef.current;
      geoPointAttemptedFieldIdsRef.current.add(field.id);
      setResolvingGeoPointFieldIds((current) => {
        const next = new Set(current);
        next.add(field.id);
        return next;
      });

      void resolveGeoPoint(field)
        .then((point) => {
          if (!point || session !== geoPointSessionRef.current) {
            return;
          }
          if (!isRuntimeFormValueEmpty(latestValuesRef.current[field.id])) {
            return;
          }
          onFieldChange(field.id, formatRuntimeGeoPointValue(point), field);
        })
        .finally(() => {
          if (session !== geoPointSessionRef.current) {
            return;
          }
          setResolvingGeoPointFieldIds((current) => {
            const next = new Set(current);
            next.delete(field.id);
            return next;
          });
        });
    }
  }, [definition, onFieldChange, resolveGeoPoint, values]);

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
                  activeTabs={activeTabs}
                  definition={definition}
                  definitionId={definition.id}
                  errors={errors}
                  key={node.id}
                  labels={resolvedLabels}
                  loadLookupOptions={loadLookupOptions}
                  node={node}
                  onActiveTabChange={onActiveTabChange}
                  onFieldChange={onFieldChange}
                  onChecklistItemChange={onChecklistItemChange}
                  resolvingGeoPointFieldIds={resolvingGeoPointFieldIds}
                  resolveGeoPoint={resolveGeoPoint}
                  onSubformAdd={onSubformAdd}
                  onSubformDelete={onSubformDelete}
                  onSubformEdit={onSubformEdit}
                  recordId={recordId}
                  revealChecklistItem={revealChecklistItem}
                  revealFieldId={revealFieldId}
                  revealNodeId={revealNodeId}
                  revealRequestKey={revealRequestKey}
                  subforms={subforms}
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
