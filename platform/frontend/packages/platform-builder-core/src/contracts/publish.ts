import { PLATFORM_BUILDER_SCHEMA_VERSION } from "./common";
import type {
  BuilderDraftId,
  BuilderManifestId,
  ValidationReport,
} from "./common";
import type {
  ChildCollectionDefinition,
  EntityDefinition,
  FieldDefinition,
  OptionSetDefinition,
  RelationDefinition,
  SemanticRoleBinding,
} from "./model";
import type { NavigationNode } from "./navigation";
import type { PolicySet } from "./policy";
import type { ViewDefinition } from "./view";
import type { WorkflowDefinition } from "./workflow";

export type BuilderRegistryBundle = {
  childCollections: ChildCollectionDefinition[];
  entities: EntityDefinition[];
  fields: FieldDefinition[];
  navigationNodes: NavigationNode[];
  optionSets: OptionSetDefinition[];
  policies: PolicySet[];
  relations: RelationDefinition[];
  semanticRoles: SemanticRoleBinding[];
  views: ViewDefinition[];
  workflows: WorkflowDefinition[];
};

export type DraftSnapshot = BuilderRegistryBundle & {
  draftId: BuilderDraftId;
  lastValidationReport?: ValidationReport;
  schemaVersion: typeof PLATFORM_BUILDER_SCHEMA_VERSION;
  snapshotKind: "draft";
  updatedAt: string;
};

export type PublishedManifest = BuilderRegistryBundle & {
  manifestId: BuilderManifestId;
  publishedAt: string;
  schemaVersion: typeof PLATFORM_BUILDER_SCHEMA_VERSION;
  snapshotKind: "published";
  version: number;
};
