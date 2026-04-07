import {
  parsePublishedManifest,
  type PublishedManifest,
  type ViewDefinition,
} from "@platform/platform-studio-core";

type StoredPublishedManifestRecord = {
  id: string;
  manifest: PublishedManifest;
  publishedAt: string;
};

export const publishedManifestStorageKey =
  "tenant.published-runtime.manifests";

const publishedManifestWatchedStorageKeys = new Set<string>([
  publishedManifestStorageKey,
]);

const incidentIntakeFormView = {
  channel: "web",
  description: "Published runtime form placeholder for reporting a new incident.",
  entityId: "entity.incident",
  id: "view.incident.intake",
  key: "incident.intake",
  nodes: [
    {
      id: "viewnode.incident.intake.root",
      kind: "section",
      slots: {
        body: [
          "viewnode.incident.intake.intro",
          "viewnode.incident.intake.title",
          "viewnode.incident.intake.occurred-on",
          "viewnode.incident.intake.status",
          "viewnode.incident.intake.owner",
          "viewnode.incident.intake.site",
        ],
      },
      title: "Incident intake",
    },
    {
      id: "viewnode.incident.intake.intro",
      kind: "text",
      text: "Collect the first-pass metadata needed to open an incident record.",
    },
    {
      fieldId: "field.incident.title",
      id: "viewnode.incident.intake.title",
      kind: "field",
      widgetKey: "text-input",
    },
    {
      fieldId: "field.incident.occurred-on",
      id: "viewnode.incident.intake.occurred-on",
      kind: "field",
      widgetKey: "date-input",
    },
    {
      fieldId: "field.incident.status",
      id: "viewnode.incident.intake.status",
      kind: "field",
      widgetKey: "status-select",
    },
    {
      fieldId: "field.incident.owner",
      id: "viewnode.incident.intake.owner",
      kind: "field",
      widgetKey: "text-input",
    },
    {
      fieldId: "field.incident.site",
      id: "viewnode.incident.intake.site",
      kind: "field",
      widgetKey: "entity-select",
    },
  ],
  rootNodeId: "viewnode.incident.intake.root",
  title: "Incident Intake",
  type: "form",
} satisfies ViewDefinition;

const seededPublishedManifestSource = {
  childCollections: [
    {
      childEntityId: "entity.corrective-action",
      id: "collection.incident.actions",
      key: "incident.actions",
      label: "Corrective actions",
      parentEntityId: "entity.incident",
      relationId: "relation.corrective-action.incident",
    },
  ],
  entities: [
    {
      description: "Workspace incidents captured from tenant operations.",
      id: "entity.incident",
      key: "incident",
      name: "Incident",
      pluralName: "Incidents",
    },
    {
      description: "Follow-up work attached to an incident record.",
      id: "entity.corrective-action",
      key: "corrective_action",
      name: "Corrective Action",
      pluralName: "Corrective Actions",
    },
    {
      description: "Facility reference data used by operational records.",
      id: "entity.site",
      key: "site",
      name: "Site",
      pluralName: "Sites",
    },
  ],
  fields: [
    {
      dataType: "string",
      description: "Primary incident title.",
      entityId: "entity.incident",
      id: "field.incident.title",
      key: "title",
      label: "Title",
      required: true,
    },
    {
      dataType: "enum",
      description: "Current incident workflow state.",
      entityId: "entity.incident",
      id: "field.incident.status",
      key: "status",
      label: "Status",
      optionSetId: "optionset.incident.status",
      required: true,
    },
    {
      dataType: "date",
      description: "Date when the incident was observed.",
      entityId: "entity.incident",
      id: "field.incident.occurred-on",
      key: "occurred_on",
      label: "Occurred on",
    },
    {
      dataType: "string",
      description: "Named owner responsible for follow-up.",
      entityId: "entity.incident",
      id: "field.incident.owner",
      key: "owner",
      label: "Owner",
    },
    {
      dataType: "relation",
      description: "Linked operating site.",
      entityId: "entity.incident",
      id: "field.incident.site",
      key: "site",
      label: "Site",
      relationId: "relation.incident.site",
      required: true,
    },
    {
      dataType: "string",
      description: "Short corrective action summary.",
      entityId: "entity.corrective-action",
      id: "field.corrective-action.summary",
      key: "summary",
      label: "Summary",
      required: true,
    },
    {
      dataType: "date",
      description: "Expected completion date.",
      entityId: "entity.corrective-action",
      id: "field.corrective-action.due-date",
      key: "due_date",
      label: "Due date",
    },
    {
      dataType: "relation",
      description: "Owning incident.",
      entityId: "entity.corrective-action",
      id: "field.corrective-action.incident",
      key: "incident",
      label: "Incident",
      relationId: "relation.corrective-action.incident",
      required: true,
    },
    {
      dataType: "boolean",
      description: "Flag for completion.",
      entityId: "entity.corrective-action",
      id: "field.corrective-action.completed",
      key: "completed",
      label: "Completed",
    },
    {
      dataType: "string",
      description: "Reference site name.",
      entityId: "entity.site",
      id: "field.site.name",
      key: "name",
      label: "Name",
      required: true,
    },
    {
      dataType: "enum",
      description: "Operating region for the site.",
      entityId: "entity.site",
      id: "field.site.region",
      key: "region",
      label: "Region",
      optionSetId: "optionset.site.region",
    },
    {
      dataType: "boolean",
      description: "Whether the site is active.",
      entityId: "entity.site",
      id: "field.site.active",
      key: "is_active",
      label: "Active",
      required: true,
    },
  ],
  manifestId: "manifest.northwind-published-runtime",
  navigationNodes: [
    {
      icon: "layers",
      id: "nav.group.operations",
      label: "Operations",
      order: 0,
      type: "group",
    },
    {
      channels: ["web"],
      icon: "document-list",
      id: "nav.item.incidents",
      label: "Incidents",
      order: 1,
      parentId: "nav.group.operations",
      routeKey: "incidents",
      target: {
        kind: "view",
        viewId: "view.incident.list",
      },
      type: "item",
      visibilityPolicyId: "policy.runtime.admin",
    },
    {
      channels: ["web"],
      icon: "building-office",
      id: "nav.item.sites",
      label: "Sites",
      order: 2,
      parentId: "nav.group.operations",
      routeKey: "sites",
      target: {
        kind: "view",
        viewId: "view.site.list",
      },
      type: "item",
      visibilityPolicyId: "policy.runtime.admin",
    },
    {
      channels: ["web"],
      icon: "document-list",
      id: "nav.item.incident.detail",
      label: "Incident record",
      order: 3,
      parentId: "nav.group.operations",
      routeKey: "incident-record",
      target: {
        kind: "view",
        viewId: "view.incident.detail",
      },
      type: "item",
      visibilityPolicyId: "policy.runtime.admin",
    },
    {
      channels: ["web"],
      icon: "spark",
      id: "nav.item.incident.intake",
      label: "Report incident",
      order: 4,
      parentId: "nav.group.operations",
      routeKey: "report-incident",
      target: {
        kind: "view",
        viewId: incidentIntakeFormView.id,
      },
      type: "item",
      visibilityPolicyId: "policy.runtime.admin",
    },
    {
      icon: "dashboard-grid",
      id: "nav.group.workspace",
      label: "Workspace",
      order: 5,
      type: "group",
    },
    {
      channels: ["web"],
      icon: "dashboard-grid",
      id: "nav.item.workspace.dashboard",
      label: "Workspace dashboard",
      order: 6,
      parentId: "nav.group.workspace",
      routeKey: "workspace-dashboard",
      target: {
        kind: "system-module",
        moduleKey: "dashboard",
      },
      type: "item",
    },
    {
      channels: ["web"],
      icon: "document-list",
      id: "nav.item.workspace.handbook",
      label: "Operations handbook",
      order: 7,
      parentId: "nav.group.workspace",
      routeKey: "ops-handbook",
      target: {
        kind: "external-link",
        url: "https://example.com/ops-handbook",
      },
      type: "item",
    },
  ],
  optionSets: [
    {
      description: "Incident lifecycle values.",
      id: "optionset.incident.status",
      key: "incident.status",
      name: "Incident status",
      options: [
        {
          label: "New",
          value: "new",
        },
        {
          label: "In review",
          value: "in_review",
        },
        {
          label: "Closed",
          value: "closed",
        },
      ],
    },
    {
      description: "Available tenant operating regions.",
      id: "optionset.site.region",
      key: "site.region",
      name: "Site region",
      options: [
        {
          label: "North",
          value: "north",
        },
        {
          label: "South",
          value: "south",
        },
        {
          label: "West",
          value: "west",
        },
      ],
    },
  ],
  policies: [
    {
      actionPolicies: [
        {
          actionKey: "runtime.manage",
          allowed: true,
        },
      ],
      description: "Tenant runtime administration policy for the demo tenant.",
      fieldPolicies: [
        {
          access: "editable",
          fieldId: "field.incident.title",
        },
        {
          access: "editable",
          fieldId: "field.incident.status",
        },
      ],
      id: "policy.runtime.admin",
      key: "runtime.admin",
      name: "Runtime admin",
      roleKeys: ["tenant.admin"],
      visibility: {
        assignments: {
          contactIds: [
            "contact.demo-user-1",
            "contact.maya-northwind-example",
          ],
        },
        mode: "allow-matched",
      },
    },
  ],
  publishedAt: "2026-03-26T15:00:00.000Z",
  relations: [
    {
      id: "relation.corrective-action.incident",
      key: "corrective_action.incident",
      kind: "many-to-one",
      label: "Corrective action -> incident",
      sourceEntityId: "entity.corrective-action",
      sourceFieldId: "field.corrective-action.incident",
      targetEntityId: "entity.incident",
    },
    {
      id: "relation.incident.site",
      key: "incident.site",
      kind: "many-to-one",
      label: "Incident -> site",
      sourceEntityId: "entity.incident",
      sourceFieldId: "field.incident.site",
      targetEntityId: "entity.site",
    },
  ],
  schemaVersion: 1,
  semanticRoles: [
    {
      entityId: "entity.incident",
      fieldId: "field.incident.title",
      id: "rolebinding.incident.title",
      role: "title",
    },
    {
      entityId: "entity.incident",
      fieldId: "field.incident.status",
      id: "rolebinding.incident.status",
      role: "status",
    },
    {
      entityId: "entity.incident",
      fieldId: "field.incident.owner",
      id: "rolebinding.incident.owner",
      role: "owner",
    },
    {
      entityId: "entity.incident",
      fieldId: "field.incident.occurred-on",
      id: "rolebinding.incident.date",
      role: "date",
    },
    {
      entityId: "entity.site",
      fieldId: "field.site.name",
      id: "rolebinding.site.location",
      role: "location",
    },
  ],
  snapshotKind: "published",
  version: 1,
  views: [
    {
      channel: "web",
      description: "Operational incident list for tenant teams.",
      entityId: "entity.incident",
      id: "view.incident.list",
      isDefault: true,
      key: "incident.list",
      nodes: [
        {
          id: "viewnode.incident.list.root",
          kind: "section",
          slots: {
            body: [
              "viewnode.incident.list.intro",
              "viewnode.incident.list.title",
              "viewnode.incident.list.status",
              "viewnode.incident.list.site",
            ],
          },
          title: "Incident queue",
        },
        {
          id: "viewnode.incident.list.intro",
          kind: "text",
          text: "Review incidents that still need triage, ownership, or follow-up.",
        },
        {
          fieldId: "field.incident.title",
          id: "viewnode.incident.list.title",
          kind: "field",
          widgetKey: "text-cell",
        },
        {
          fieldId: "field.incident.status",
          id: "viewnode.incident.list.status",
          kind: "field",
          widgetKey: "status-pill",
        },
        {
          fieldId: "field.incident.site",
          id: "viewnode.incident.list.site",
          kind: "field",
          widgetKey: "entity-link",
        },
      ],
      rootNodeId: "viewnode.incident.list.root",
      title: "Incident queue",
      type: "list",
    },
    {
      channel: "web",
      description: "Read-only incident detail summary placeholder.",
      entityId: "entity.incident",
      id: "view.incident.detail",
      key: "incident.detail",
      nodes: [
        {
          id: "viewnode.incident.detail.root",
          kind: "section",
          slots: {
            body: [
              "viewnode.incident.detail.title",
              "viewnode.incident.detail.status",
              "viewnode.incident.detail.owner",
              "viewnode.incident.detail.actions",
            ],
          },
          title: "Incident detail",
        },
        {
          fieldId: "field.incident.title",
          id: "viewnode.incident.detail.title",
          kind: "field",
          widgetKey: "text-detail",
        },
        {
          fieldId: "field.incident.status",
          id: "viewnode.incident.detail.status",
          kind: "field",
          widgetKey: "status-pill",
        },
        {
          fieldId: "field.incident.owner",
          id: "viewnode.incident.detail.owner",
          kind: "field",
          widgetKey: "text-detail",
        },
        {
          collectionId: "collection.incident.actions",
          id: "viewnode.incident.detail.actions",
          kind: "collection",
          presentation: "table",
        },
      ],
      rootNodeId: "viewnode.incident.detail.root",
      title: "Incident detail",
      type: "detail",
    },
    {
      channel: "web",
      description: "Site list placeholder for published runtime validation.",
      entityId: "entity.site",
      id: "view.site.list",
      key: "site.list",
      nodes: [
        {
          id: "viewnode.site.list.root",
          kind: "section",
          slots: {
            body: [
              "viewnode.site.list.name",
              "viewnode.site.list.region",
              "viewnode.site.list.active",
            ],
          },
          title: "Sites",
        },
        {
          fieldId: "field.site.name",
          id: "viewnode.site.list.name",
          kind: "field",
          widgetKey: "text-cell",
        },
        {
          fieldId: "field.site.region",
          id: "viewnode.site.list.region",
          kind: "field",
          widgetKey: "badge",
        },
        {
          fieldId: "field.site.active",
          id: "viewnode.site.list.active",
          kind: "field",
          widgetKey: "boolean-pill",
        },
      ],
      rootNodeId: "viewnode.site.list.root",
      title: "Sites",
      type: "list",
    },
    incidentIntakeFormView,
  ],
  workflows: [],
} satisfies PublishedManifest;

let seededPublishedManifestCache: PublishedManifest | null = null;

function loadSeededPublishedManifest() {
  if (!seededPublishedManifestCache) {
    seededPublishedManifestCache = parsePublishedManifest(
      seededPublishedManifestSource,
    );
  }

  return seededPublishedManifestCache;
}

function parseStoredPublishedManifestRecord(
  value: unknown,
): StoredPublishedManifestRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const recordId = typeof candidate.id === "string" ? candidate.id.trim() : "";
  const publishedAt =
    typeof candidate.publishedAt === "string"
      ? candidate.publishedAt.trim()
      : "";

  if (
    !recordId
    || !publishedAt
    || !Number.isFinite(Date.parse(publishedAt))
  ) {
    return null;
  }

  try {
    return {
      id: recordId,
      manifest: parsePublishedManifest(candidate.manifest),
      publishedAt,
    };
  } catch {
    return null;
  }
}

function sortStoredPublishedManifestRecords(
  records: readonly StoredPublishedManifestRecord[],
) {
  return [...records].sort((left, right) => {
    const versionDelta = right.manifest.version - left.manifest.version;

    if (versionDelta !== 0) {
      return versionDelta;
    }

    const publishedAtDelta = Date.parse(right.publishedAt) - Date.parse(left.publishedAt);

    if (publishedAtDelta !== 0) {
      return publishedAtDelta;
    }

    return right.id.localeCompare(left.id);
  });
}

function parseStoredPublishedManifestRecordsValue(rawValue: string | null) {
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return sortStoredPublishedManifestRecords(
      parsedValue.flatMap((entry) => {
        const normalizedRecord = parseStoredPublishedManifestRecord(entry);

        return normalizedRecord ? [normalizedRecord] : [];
      }),
    );
  } catch {
    return [];
  }
}

function readPublishedManifestStorageValue(storageKey: string) {
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function readStoredPublishedManifestRecords() {
  if (typeof window === "undefined") {
    return [];
  }

  return parseStoredPublishedManifestRecordsValue(
    readPublishedManifestStorageValue(publishedManifestStorageKey),
  );
}

export function readPublishedManifest(): PublishedManifest {
  const [latestStoredManifest] = readStoredPublishedManifestRecords();

  return latestStoredManifest?.manifest ?? loadSeededPublishedManifest();
}

export function getPublishedManifestSourceRevision() {
  const manifest = readPublishedManifest();

  return `${manifest.manifestId}@${manifest.version}`;
}

export function subscribeToPublishedManifestSource(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && !publishedManifestWatchedStorageKeys.has(event.key)) {
      return;
    }

    listener();
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
  };
}

export function loadPublishedManifest(): Promise<PublishedManifest> {
  return Promise.resolve(readPublishedManifest());
}
