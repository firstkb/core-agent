import { RuleConditionEditor } from "./rule-condition-editor";
import { RuleEditorDialog } from "./rule-editor-dialog";
import {
  type WorkspaceDialogEditorState,
  type WorkspaceDialogTranslate,
} from "./workspace-dialog-types";
import {
  type FormBuilderRequirementRule,
  type FormBuilderRuleCondition,
  type FormBuilderVisibilityRule,
} from "../forms-builder-state";
import { type FormsPlaceholderField } from "../forms-placeholder-data";

export type WorkspaceRuleDialogsProps = {
  canEditSettings: boolean;
  closeRequirementRuleEditor: () => void;
  closeVisibilityRuleEditor: () => void;
  deleteRequirementRuleEditor: () => void;
  deleteVisibilityRuleEditor: () => void;
  onRequirementRuleConditionChange: (condition: FormBuilderRuleCondition) => void;
  onRequirementRuleEffectChange: (effect: FormBuilderRequirementRule["effect"]) => void;
  onSaveRequirementRuleEditor: () => void;
  onSaveVisibilityRuleEditor: () => void;
  onVisibilityRuleConditionChange: (condition: FormBuilderRuleCondition) => void;
  onVisibilityRuleEffectChange: (effect: FormBuilderVisibilityRule["effect"]) => void;
  requirementRuleEditor: WorkspaceDialogEditorState<FormBuilderRequirementRule>;
  selectedNodeRuleFields: ReadonlyArray<FormsPlaceholderField>;
  t: WorkspaceDialogTranslate;
  visibilityRuleEditor: WorkspaceDialogEditorState<FormBuilderVisibilityRule>;
};

export function WorkspaceRuleDialogs({
  canEditSettings,
  closeRequirementRuleEditor,
  closeVisibilityRuleEditor,
  deleteRequirementRuleEditor,
  deleteVisibilityRuleEditor,
  onRequirementRuleConditionChange,
  onRequirementRuleEffectChange,
  onSaveRequirementRuleEditor,
  onSaveVisibilityRuleEditor,
  onVisibilityRuleConditionChange,
  onVisibilityRuleEffectChange,
  requirementRuleEditor,
  selectedNodeRuleFields,
  t,
  visibilityRuleEditor,
}: WorkspaceRuleDialogsProps) {
  return (
    <>
      <RuleEditorDialog
        canDelete={Boolean(visibilityRuleEditor && visibilityRuleEditor.index !== null)}
        canEdit={canEditSettings}
        canSave={Boolean(visibilityRuleEditor && visibilityRuleEditor.draft.when.all.length > 0)}
        cancelLabel={t("tenant.platformStudio.forms.cancelDelete")}
        deleteLabel={t("tenant.platformStudio.forms.builder.filter.deleteFilter")}
        description={t("tenant.platformStudio.forms.builder.rule.rulesDescription")}
        effectLabel={t("tenant.platformStudio.forms.builder.rule.effectLabel")}
        effectOptions={[
          { label: t("tenant.platformStudio.forms.builder.rule.effect.show"), value: "show" },
          { label: t("tenant.platformStudio.forms.builder.rule.effect.hide"), value: "hide" },
        ]}
        effectSelectId="tenant-platform-studio-visibility-rule-effect"
        effectValue={visibilityRuleEditor?.draft.effect ?? "show"}
        onOpenChange={(open) => {
          if (!open) {
            closeVisibilityRuleEditor();
          }
        }}
        open={Boolean(visibilityRuleEditor)}
        onCancel={closeVisibilityRuleEditor}
        onDelete={deleteVisibilityRuleEditor}
        onEffectChange={onVisibilityRuleEffectChange}
        onSave={onSaveVisibilityRuleEditor}
        saveLabel={t("tenant.platformStudio.forms.builder.saveAction")}
        title={
          visibilityRuleEditor?.index === null
            ? t("tenant.platformStudio.forms.builder.rule.addVisibilityRule")
            : t("tenant.platformStudio.forms.builder.rule.editVisibilityRule")
        }
      >
        {visibilityRuleEditor?.draft.when.all[0] ? (
          <RuleConditionEditor
            allowRemove={false}
            condition={visibilityRuleEditor.draft.when.all[0]}
            disabled={!canEditSettings}
            fields={selectedNodeRuleFields}
            idPrefix={`tenant-platform-studio-visibility-rule-editor-${visibilityRuleEditor.draft.id}`}
            onChange={onVisibilityRuleConditionChange}
            onRemove={() => undefined}
            t={t}
          />
        ) : null}
      </RuleEditorDialog>

      <RuleEditorDialog
        canDelete={Boolean(requirementRuleEditor && requirementRuleEditor.index !== null)}
        canEdit={canEditSettings}
        canSave={Boolean(requirementRuleEditor && requirementRuleEditor.draft.when.all.length > 0)}
        cancelLabel={t("tenant.platformStudio.forms.cancelDelete")}
        deleteLabel={t("tenant.platformStudio.forms.builder.filter.deleteFilter")}
        description={t("tenant.platformStudio.forms.builder.rule.rulesDescription")}
        effectLabel={t("tenant.platformStudio.forms.builder.rule.effectLabel")}
        effectOptions={[
          { label: t("tenant.platformStudio.forms.builder.rule.effect.required"), value: "required" },
          { label: t("tenant.platformStudio.forms.builder.rule.effect.optional"), value: "optional" },
        ]}
        effectSelectId="tenant-platform-studio-requirement-rule-effect"
        effectValue={requirementRuleEditor?.draft.effect ?? "required"}
        onOpenChange={(open) => {
          if (!open) {
            closeRequirementRuleEditor();
          }
        }}
        open={Boolean(requirementRuleEditor)}
        onCancel={closeRequirementRuleEditor}
        onDelete={deleteRequirementRuleEditor}
        onEffectChange={onRequirementRuleEffectChange}
        onSave={onSaveRequirementRuleEditor}
        saveLabel={t("tenant.platformStudio.forms.builder.saveAction")}
        title={
          requirementRuleEditor?.index === null
            ? t("tenant.platformStudio.forms.builder.rule.addRequirementRule")
            : t("tenant.platformStudio.forms.builder.rule.editRequirementRule")
        }
      >
        {requirementRuleEditor?.draft.when.all[0] ? (
          <RuleConditionEditor
            allowRemove={false}
            condition={requirementRuleEditor.draft.when.all[0]}
            disabled={!canEditSettings}
            fields={selectedNodeRuleFields}
            idPrefix={`tenant-platform-studio-requirement-rule-editor-${requirementRuleEditor.draft.id}`}
            onChange={onRequirementRuleConditionChange}
            onRemove={() => undefined}
            t={t}
          />
        ) : null}
      </RuleEditorDialog>
    </>
  );
}
