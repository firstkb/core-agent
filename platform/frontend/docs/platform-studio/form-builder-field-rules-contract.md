# Form Builder Field Rules Contract

Status: exact detail reference
Historical status: active
Date: 2026-04-08
Last audited: 2026-04-25
Read rule: Open only after the active Form Builder module docs, and only when exact payload/settings/history detail is needed.
Canonical active docs:

- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## Purpose

This document locks the accepted conditional rule model for Platform Studio Form Builder V2.

It covers simple authored UI rules such as:

- show or hide fields
- make a field required or optional

It does not cover:

- notifications
- side effects
- multi-step workflows
- cross-record automations

## Source Provenance

This contract stays grounded in the three original analysis inputs:

- `EXTDB`
  - long-running product behavior where field visibility and requiredness depend on business context
- `smartapp`
  - current runtime need for conditional field presentation inside form flows
- `ezform`
  - builder-shell expectation that authored behavior should live in explicit UI schema, not in loose ad hoc markers

Related future boundary:

- `taxonomy-and-naming.md` keeps `Action Builder` as the future home for larger side effects and workflow-style actions

## Accepted V2 Position

Simple conditional rules belong in `Form Builder`.

They should be authored from the inspector on the current field or container node.

They should not be modeled as:

- base field types
- field presets
- page filters
- Action Builder workflows

## Inspector Placement

The selected field or container inspector should contain a dedicated section:

- `Rules`

Inside it:

- `Visibility rules`
- `Requirement rules`

Node behavior:

- field nodes show both `Visibility rules` and `Requirement rules`
- container nodes show `Visibility rules`
- container nodes do not expose `Requirement rules`

## Scope Boundary

Rules must work only inside the current form scope.

Accepted scope rule:

- root fields may depend only on root fields
- subform fields may depend only on fields from the same subform row
- cross-scope dependencies are not accepted

Examples of not-accepted scope crossings:

- root field depending on a child subform field
- one subform row depending on a different subform row
- one subform depending on a sibling subform

## Recommended Persisted Shape

```ts
type RuleOperator =
  | "eq"
  | "neq"
  | "in"
  | "not_in"
  | "is_empty"
  | "not_empty"
  | "gt"
  | "gte"
  | "lt"
  | "lte";

interface RuleCondition {
  id: string;
  fieldId: string;
  operator: RuleOperator;
  value?: string | number | boolean;
  values?: Array<string | number | boolean>;
}

interface VisibilityRule {
  id: string;
  when: {
    all: RuleCondition[];
  };
  effect: "show" | "hide";
}

interface RequirementRule {
  id: string;
  when: {
    all: RuleCondition[];
  };
  effect: "required" | "optional";
}

interface NodeRules {
  visibilityRules?: VisibilityRule[];
  requirementRules?: RequirementRule[];
}
```

Recommended storage rule:

- conditional rules belong on the current node inside `uiSchema`
- they do not mutate the base `ModelFieldDefinition`

## Authoring Rules

- rule conditions compare a same-scope field to literal values
- field-to-field comparison is not accepted in the first contract
- nested `or` groups are not accepted in the first contract
- empty checks must omit literal values
- `in` and `not_in` must use `values`

## Runtime Rules

Visibility rules:

- may be applied to field nodes
- may be applied to container nodes
- affect UI presentation only

Requirement rules:

- apply to field nodes only
- affect runtime validation and required-state behavior in the current scope
- do not rewrite the base model field as globally required

## Locked Decisions

- simple conditional field logic belongs in Form Builder
- larger side effects stay out of this contract
- same-scope dependency is mandatory
- `Rules` is a dedicated inspector section, not an inline ad hoc setting

## Companion Docs

- `form-builder-v2-field-contract.md`
- `form-builder-schema-scope-contract.md`
- `form-builder-slice-1-inspector-and-view-schema.md`
