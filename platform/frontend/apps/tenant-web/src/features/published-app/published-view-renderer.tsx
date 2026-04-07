import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@platform/ui-kit";
import type {
  ChildCollectionDefinition,
  ModelFieldDefinition,
  PublishedManifest,
  ResolvedViewNavigationTarget,
} from "@platform/platform-studio-core";

type PublishedViewRendererProps = {
  manifest: PublishedManifest;
  resolvedTarget: ResolvedViewNavigationTarget;
};

type RuntimeFieldBinding = {
  field: ModelFieldDefinition | null;
  fieldId: string;
  required: boolean;
  widgetKey: string;
};

type RuntimeCollectionBinding = {
  collection: ChildCollectionDefinition | null;
  collectionId: string;
  presentation: "stack" | "table";
};

function getFieldBindings(
  manifest: PublishedManifest,
  resolvedTarget: ResolvedViewNavigationTarget,
): RuntimeFieldBinding[] {
  const seenFieldIds = new Set<string>();
  const bindings: RuntimeFieldBinding[] = [];

  for (const node of resolvedTarget.view.nodes) {
    if (node.kind !== "field" || seenFieldIds.has(node.fieldId)) {
      continue;
    }

    seenFieldIds.add(node.fieldId);
    const field = manifest.fields.find((candidate) => candidate.id === node.fieldId) ?? null;

    bindings.push({
      field,
      fieldId: node.fieldId,
      required: field?.required ?? false,
      widgetKey: node.widgetKey,
    });
  }

  return bindings;
}

function getCollectionBindings(
  manifest: PublishedManifest,
  resolvedTarget: ResolvedViewNavigationTarget,
): RuntimeCollectionBinding[] {
  const bindings: RuntimeCollectionBinding[] = [];

  for (const node of resolvedTarget.view.nodes) {
    if (node.kind !== "collection") {
      continue;
    }

    bindings.push({
      collection: manifest.childCollections.find((candidate) => candidate.id === node.collectionId) ?? null,
      collectionId: node.collectionId,
      presentation: node.presentation ?? "stack",
    });
  }

  return bindings;
}

function getTextBlocks(resolvedTarget: ResolvedViewNavigationTarget): string[] {
  return resolvedTarget.view.nodes
    .filter((node) => node.kind === "text")
    .map((node) => node.text);
}

function getSectionLabels(resolvedTarget: ResolvedViewNavigationTarget): string[] {
  return resolvedTarget.view.nodes.flatMap((node) => {
    if (node.kind === "section" && node.title) {
      return [node.title];
    }

    if (node.kind === "group" && node.label) {
      return [node.label];
    }

    if (node.kind === "tab") {
      return [node.label];
    }

    return [];
  });
}

function getEntityName(manifest: PublishedManifest, entityId: string) {
  return manifest.entities.find((entity) => entity.id === entityId)?.name ?? entityId;
}

function renderFieldBindings(
  bindings: RuntimeFieldBinding[],
  emptyCopy: string,
) {
  if (bindings.length === 0) {
    return <p className="tenant-published-app__section-copy">{emptyCopy}</p>;
  }

  return (
    <div className="tenant-published-app__list">
      {bindings.map((binding) => (
        <div className="tenant-published-app__list-row" key={binding.fieldId}>
          <div className="tenant-published-app__list-copy">
            <p className="tenant-published-app__list-title">{binding.field?.label ?? binding.fieldId}</p>
            <p className="tenant-published-app__list-meta">
              {binding.field?.description ?? "Published field metadata is available, but record data wiring is deferred."}
            </p>
          </div>

          <div className="tenant-published-app__tag-row">
            <Badge appearance="soft" size="sm" variant="neutral">
              {binding.field?.dataType ?? "unknown"}
            </Badge>
            <Badge appearance="soft" size="sm" variant="info">
              {binding.widgetKey}
            </Badge>
            {binding.required ? (
              <Badge appearance="soft" size="sm" variant="warning">
                required
              </Badge>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderRuntimeMetadata(
  entityName: string,
  resolvedTarget: ResolvedViewNavigationTarget,
  sectionLabels: string[],
  textBlocks: string[],
  collectionBindings: RuntimeCollectionBinding[],
) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Runtime metadata</CardTitle>
        <CardDescription>The route target already resolved through the published manifest helper stack.</CardDescription>
      </CardHeader>
      <CardContent className="tenant-published-app__stack">
        <p className="tenant-published-app__section-copy">Entity: {entityName}</p>
        <p className="tenant-published-app__section-copy">Route key: {resolvedTarget.route.routeKey}</p>
        <p className="tenant-published-app__section-copy">Root node: {resolvedTarget.view.rootNodeId}</p>
        <p className="tenant-published-app__section-copy">Layout nodes: {resolvedTarget.view.nodes.length}</p>

        {sectionLabels.length > 0 ? (
          <div className="tenant-published-app__stack">
            <p className="tenant-published-app__section-title">Sections</p>
            <div className="tenant-published-app__tag-row">
              {sectionLabels.map((label) => (
                <Badge appearance="soft" key={label} size="sm" variant="brand">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {collectionBindings.length > 0 ? (
          <div className="tenant-published-app__stack">
            <p className="tenant-published-app__section-title">Child collections</p>
            <div className="tenant-published-app__list">
              {collectionBindings.map((binding) => (
                <div className="tenant-published-app__list-row" key={binding.collectionId}>
                  <div className="tenant-published-app__list-copy">
                    <p className="tenant-published-app__list-title">{binding.collection?.label ?? binding.collectionId}</p>
                    <p className="tenant-published-app__list-meta">
                      {binding.collection
                        ? `${binding.collection.childEntityId} related to ${binding.collection.parentEntityId}.`
                        : "Collection metadata was referenced by the view, but the definition is missing."}
                    </p>
                  </div>

                  <Badge appearance="soft" size="sm" variant="neutral">
                    {binding.presentation}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {textBlocks.length > 0 ? (
          <div className="tenant-published-app__stack">
            <p className="tenant-published-app__section-title">Published copy blocks</p>
            {textBlocks.map((text) => (
              <p className="tenant-published-app__section-copy" key={text}>
                {text}
              </p>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function renderListView(
  entityName: string,
  fieldBindings: RuntimeFieldBinding[],
  resolvedTarget: ResolvedViewNavigationTarget,
  sectionLabels: string[],
  textBlocks: string[],
  collectionBindings: RuntimeCollectionBinding[],
) {
  return (
    <div className="tenant-published-app__detail-grid">
      <Card>
        <CardHeader>
          <CardTitle>List placeholder</CardTitle>
          <CardDescription>Published list routes can already resolve entity metadata without depending on an authoring surface.</CardDescription>
        </CardHeader>
        <CardContent className="tenant-published-app__stack">
          <p className="tenant-published-app__section-copy">This placeholder reserves the list surface while live data queries and row actions remain out of scope.</p>
          {renderFieldBindings(
            fieldBindings,
            `No explicit list field nodes were authored for ${entityName}, so the runtime is showing the published copy blocks instead.`,
          )}
        </CardContent>
      </Card>

      {renderRuntimeMetadata(entityName, resolvedTarget, sectionLabels, textBlocks, collectionBindings)}
    </div>
  );
}

function renderDetailView(
  entityName: string,
  fieldBindings: RuntimeFieldBinding[],
  resolvedTarget: ResolvedViewNavigationTarget,
  sectionLabels: string[],
  textBlocks: string[],
  collectionBindings: RuntimeCollectionBinding[],
) {
  return (
    <div className="tenant-published-app__detail-grid">
      <Card>
        <CardHeader>
          <CardTitle>Detail placeholder</CardTitle>
          <CardDescription>The runtime can present a record detail contract from the published view definition.</CardDescription>
        </CardHeader>
        <CardContent className="tenant-published-app__stack">
          <p className="tenant-published-app__section-copy">Entity detail loading is intentionally replaced with a read-only metadata summary for this MVP.</p>
          {renderFieldBindings(
            fieldBindings,
            `No detail fields were defined for ${entityName} in the published manifest.`,
          )}
        </CardContent>
      </Card>

      {renderRuntimeMetadata(entityName, resolvedTarget, sectionLabels, textBlocks, collectionBindings)}
    </div>
  );
}

function renderFormView(
  entityName: string,
  fieldBindings: RuntimeFieldBinding[],
  resolvedTarget: ResolvedViewNavigationTarget,
  sectionLabels: string[],
  textBlocks: string[],
  collectionBindings: RuntimeCollectionBinding[],
) {
  return (
    <div className="tenant-published-app__detail-grid">
      <Card>
        <CardHeader>
          <CardTitle>Form placeholder</CardTitle>
          <CardDescription>The runtime is reading published field metadata and reserving the submission surface for a later milestone.</CardDescription>
        </CardHeader>
        <CardContent className="tenant-published-app__stack">
          {renderFieldBindings(
            fieldBindings,
            `No form fields were defined for ${entityName} in the published manifest.`,
          )}

          <div className="tenant-published-app__action-row">
            <Button disabled variant="secondary">Save draft</Button>
            <Button disabled variant="outline">Submit</Button>
          </div>

          <p className="tenant-published-app__section-copy">Form actions stay disabled until the published runtime gains record persistence and workflow handoff.</p>
        </CardContent>
      </Card>

      {renderRuntimeMetadata(entityName, resolvedTarget, sectionLabels, textBlocks, collectionBindings)}
    </div>
  );
}

export function PublishedViewRenderer({
  manifest,
  resolvedTarget,
}: PublishedViewRendererProps) {
  const entityName = getEntityName(manifest, resolvedTarget.view.entityId);
  const fieldBindings = getFieldBindings(manifest, resolvedTarget);
  const sectionLabels = getSectionLabels(resolvedTarget);
  const textBlocks = getTextBlocks(resolvedTarget);
  const collectionBindings = getCollectionBindings(manifest, resolvedTarget);

  switch (resolvedTarget.view.type) {
    case "list":
      return renderListView(
        entityName,
        fieldBindings,
        resolvedTarget,
        sectionLabels,
        textBlocks,
        collectionBindings,
      );
    case "detail":
      return renderDetailView(
        entityName,
        fieldBindings,
        resolvedTarget,
        sectionLabels,
        textBlocks,
        collectionBindings,
      );
    case "form":
      return renderFormView(
        entityName,
        fieldBindings,
        resolvedTarget,
        sectionLabels,
        textBlocks,
        collectionBindings,
      );
    default:
      return (
        <Card>
          <CardHeader>
            <CardTitle>Unsupported published view type</CardTitle>
            <CardDescription>This MVP only renders published list, detail, and form targets.</CardDescription>
          </CardHeader>
          <CardContent className="tenant-published-app__stack">
            <p className="tenant-published-app__section-copy">View type: {resolvedTarget.view.type}</p>
            <p className="tenant-published-app__section-copy">Route key: {resolvedTarget.route.routeKey}</p>
          </CardContent>
        </Card>
      );
  }
}
