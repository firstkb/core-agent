import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@platform/ui-kit";

export type RulesPanelRuleItem = {
  effectLabel: string;
  id: string;
  summary: string;
};

type RulesPanelLabels = {
  actionsMenu: string;
  addRequirementRule: string;
  addVisibilityRule: string;
  deleteRule: string;
  editRule: string;
  emptyRequirementRules: string;
  emptyVisibilityRules: string;
  noScopeFields: string;
  readonlyText: string;
  requirementRules: string;
  visibilityRules: string;
};

type RulesPanelProps = {
  canEdit: boolean;
  labels: RulesPanelLabels;
  onAddRequirementRule: () => void;
  onAddVisibilityRule: () => void;
  onDeleteRequirementRule: (index: number) => void;
  onDeleteVisibilityRule: (index: number) => void;
  onEditRequirementRule: (index: number) => void;
  onEditVisibilityRule: (index: number) => void;
  requirementRules: ReadonlyArray<RulesPanelRuleItem>;
  ruleFieldsAvailable: boolean;
  showRequirementRules: boolean;
  visibilityRules: ReadonlyArray<RulesPanelRuleItem>;
};

export function RulesPanel({
  canEdit,
  labels,
  onAddRequirementRule,
  onAddVisibilityRule,
  onDeleteRequirementRule,
  onDeleteVisibilityRule,
  onEditRequirementRule,
  onEditVisibilityRule,
  requirementRules,
  ruleFieldsAvailable,
  showRequirementRules,
  visibilityRules,
}: RulesPanelProps) {
  return (
    <div className="tenant-web__platform-studio-inspector-section">
      {!canEdit ? (
        <p className="tenant-web__platform-studio-inline-help">
          {labels.readonlyText}
        </p>
      ) : (
        <div className="tenant-web__platform-studio-builder-stack">
          <RulesListSection
            addLabel={labels.addVisibilityRule}
            emptyText={ruleFieldsAvailable ? labels.emptyVisibilityRules : labels.noScopeFields}
            labels={labels}
            onAddRule={onAddVisibilityRule}
            onDeleteRule={onDeleteVisibilityRule}
            onEditRule={onEditVisibilityRule}
            ruleFieldsAvailable={ruleFieldsAvailable}
            rules={visibilityRules}
            title={labels.visibilityRules}
          />

          {showRequirementRules ? (
            <RulesListSection
              addLabel={labels.addRequirementRule}
              emptyText={ruleFieldsAvailable ? labels.emptyRequirementRules : labels.noScopeFields}
              labels={labels}
              onAddRule={onAddRequirementRule}
              onDeleteRule={onDeleteRequirementRule}
              onEditRule={onEditRequirementRule}
              ruleFieldsAvailable={ruleFieldsAvailable}
              rules={requirementRules}
              title={labels.requirementRules}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function RulesListSection({
  addLabel,
  emptyText,
  labels,
  onAddRule,
  onDeleteRule,
  onEditRule,
  ruleFieldsAvailable,
  rules,
  title,
}: {
  addLabel: string;
  emptyText: string;
  labels: RulesPanelLabels;
  onAddRule: () => void;
  onDeleteRule: (index: number) => void;
  onEditRule: (index: number) => void;
  ruleFieldsAvailable: boolean;
  rules: ReadonlyArray<RulesPanelRuleItem>;
  title: string;
}) {
  return (
    <div className="tenant-web__platform-studio-builder-stack tenant-web__platform-studio-builder-stack--tight">
      <div className="tenant-web__platform-studio-labeled-divider tenant-web__platform-studio-labeled-divider--compact">
        <span>{title}</span>
      </div>
      {rules.length === 0 ? (
        <p className="tenant-web__platform-studio-inline-help">
          {emptyText}
        </p>
      ) : (
        rules.map((rule, ruleIndex) => (
          <RuleRow
            key={rule.id}
            labels={labels}
            onDelete={() => onDeleteRule(ruleIndex)}
            onEdit={() => onEditRule(ruleIndex)}
            rule={rule}
          />
        ))
      )}
      <div className="tenant-web__platform-studio-button-row tenant-web__platform-studio-button-row--compact">
        <Button
          disabled={!ruleFieldsAvailable}
          onClick={onAddRule}
          size="sm"
          variant="secondary"
        >
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

function RuleRow({
  labels,
  onDelete,
  onEdit,
  rule,
}: {
  labels: RulesPanelLabels;
  onDelete: () => void;
  onEdit: () => void;
  rule: RulesPanelRuleItem;
}) {
  return (
    <div className="tenant-web__platform-studio-compact-row">
      <div className="tenant-web__platform-studio-compact-row-main">
        <span className="tenant-web__platform-studio-compact-row-label">
          {rule.effectLabel}
        </span>
        <span className="tenant-web__platform-studio-compact-row-summary">
          {rule.summary}
        </span>
      </div>

      <Menu align="end">
        <MenuTrigger>
          <button
            aria-label={labels.actionsMenu}
            className="tenant-web__platform-studio-menu-trigger tenant-web__platform-studio-menu-trigger--compact"
            type="button"
          >
            <span aria-hidden="true" className="tenant-web__platform-studio-menu-trigger-dots">⋮</span>
          </button>
        </MenuTrigger>
        <MenuContent className="tenant-web__platform-studio-menu">
          <MenuItem onClick={onEdit}>
            {labels.editRule}
          </MenuItem>
          <MenuItem onClick={onDelete} tone="danger">
            {labels.deleteRule}
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  );
}
