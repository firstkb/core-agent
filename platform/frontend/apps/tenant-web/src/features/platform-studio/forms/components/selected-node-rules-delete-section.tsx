import { type useTranslation } from "@platform/i18n";

import {
  RulesPanel,
  type RulesPanelRuleItem,
} from "./rules-panel";
import { SelectionDeleteAction } from "./selection-delete-action";

type Translate = ReturnType<typeof useTranslation>["t"];

type SelectedNodeRulesDeleteSectionProps = {
  canEditSettings: boolean;
  canRemoveItems: boolean;
  onAddRequirementRule: () => void;
  onAddVisibilityRule: () => void;
  onDeleteNode: () => void;
  onDeleteRequirementRule: (index: number) => void;
  onDeleteVisibilityRule: (index: number) => void;
  onEditRequirementRule: (index: number) => void;
  onEditVisibilityRule: (index: number) => void;
  readonlyText: string;
  requirementRules: ReadonlyArray<RulesPanelRuleItem>;
  ruleFieldsAvailable: boolean;
  selectedNodeSupportsRules: boolean;
  showRequirementRules: boolean;
  t: Translate;
  visibilityRules: ReadonlyArray<RulesPanelRuleItem>;
};

export function SelectedNodeRulesDeleteSection({
  canEditSettings,
  canRemoveItems,
  onAddRequirementRule,
  onAddVisibilityRule,
  onDeleteNode,
  onDeleteRequirementRule,
  onDeleteVisibilityRule,
  onEditRequirementRule,
  onEditVisibilityRule,
  readonlyText,
  requirementRules,
  ruleFieldsAvailable,
  selectedNodeSupportsRules,
  showRequirementRules,
  t,
  visibilityRules,
}: SelectedNodeRulesDeleteSectionProps) {
  return (
    <>
      {selectedNodeSupportsRules ? (
        <RulesPanel
          canEdit={canEditSettings}
          labels={{
            actionsMenu: t("tenant.platformStudio.forms.builder.rule.actionsMenu"),
            addRequirementRule: t("tenant.platformStudio.forms.builder.rule.addRequirementRule"),
            addVisibilityRule: t("tenant.platformStudio.forms.builder.rule.addVisibilityRule"),
            deleteRule: t("tenant.platformStudio.forms.builder.filter.deleteFilter"),
            editRule: t("tenant.platformStudio.forms.builder.filter.editFilter"),
            emptyRequirementRules: t("tenant.platformStudio.forms.builder.rule.emptyRequirementRules"),
            emptyVisibilityRules: t("tenant.platformStudio.forms.builder.rule.emptyVisibilityRules"),
            noScopeFields: t("tenant.platformStudio.forms.builder.rule.noScopeFields"),
            readonlyText,
            requirementRules: t("tenant.platformStudio.forms.builder.rule.requirementRules"),
            visibilityRules: t("tenant.platformStudio.forms.builder.rule.visibilityRules"),
          }}
          onAddRequirementRule={onAddRequirementRule}
          onAddVisibilityRule={onAddVisibilityRule}
          onDeleteRequirementRule={onDeleteRequirementRule}
          onDeleteVisibilityRule={onDeleteVisibilityRule}
          onEditRequirementRule={onEditRequirementRule}
          onEditVisibilityRule={onEditVisibilityRule}
          requirementRules={requirementRules}
          ruleFieldsAvailable={ruleFieldsAvailable}
          showRequirementRules={showRequirementRules}
          visibilityRules={visibilityRules}
        />
      ) : null}

      {canRemoveItems ? (
        <SelectionDeleteAction
          label={t("tenant.platformStudio.forms.builder.deleteNode")}
          onDelete={onDeleteNode}
        />
      ) : null}
    </>
  );
}
