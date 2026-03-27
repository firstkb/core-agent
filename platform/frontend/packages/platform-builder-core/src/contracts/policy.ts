import type {
  BuilderId,
  BuilderFieldId,
  BuilderJsonPrimitive,
  BuilderPolicyId,
  FieldAccessLevel,
  FilterOperator,
} from "./common";

export type FieldPolicy = {
  access: FieldAccessLevel;
  fieldId: BuilderFieldId;
};

export type ActionPolicy = {
  actionKey: string;
  allowed: boolean;
};

export type RecordFilterRule = {
  fieldKey: string;
  operator: FilterOperator;
  value: BuilderJsonPrimitive | BuilderJsonPrimitive[];
};

export const VISIBILITY_POLICY_MODES = [
  "allow-matched",
  "deny-matched",
] as const;

export type VisibilityPolicyMode = (typeof VISIBILITY_POLICY_MODES)[number];

export type VisibilityRecipientAssignments = {
  companyIds?: BuilderId[];
  contactIds?: BuilderId[];
  jobTypeIds?: BuilderId[];
};

export type VisibilityPolicy = {
  assignments?: VisibilityRecipientAssignments;
};

export type PageVisibilityPolicy = VisibilityPolicy & {
  mode: VisibilityPolicyMode;
};

export type VisibilitySubjectContext = {
  companyIds?: BuilderId[];
  contactIds?: BuilderId[];
  jobTypeIds?: BuilderId[];
};

export type PolicySet = {
  actionPolicies?: ActionPolicy[];
  description?: string;
  fieldPolicies?: FieldPolicy[];
  id: BuilderPolicyId;
  key: string;
  name: string;
  recordFilters?: RecordFilterRule[];
  roleKeys: string[];
  visibility?: VisibilityPolicy | PageVisibilityPolicy;
};
