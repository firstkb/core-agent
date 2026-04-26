/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";

import {
  Alert,
  AlertBody,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
  AvatarIndicator,
  AvatarStatus,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardHeaderBody,
  CardTitle,
  CardToolbar,
  Checkbox,
  Code,
  CollectionEmptyState,
  EmptyState,
  Field,
  FieldHint,
  FieldLabel,
  FilterChip,
  GuidedEmptyState,
  Input,
  InfoCircleIcon,
  InlineStatus,
  Rating,
  ScrollArea,
  SearchEmptyState,
  Separator,
  StatusDot,
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableColumnVisibility,
  TableHead,
  TableHeaderCell,
  TableLoadingState,
  TableMetaCell,
  TablePaginationBar,
  TableRow,
  TableSortButton,
  WarningTriangleIcon,
  type TableColumnVisibilityItem,
  type TableSortDirection,
} from "@platform/ui-kit";

import {
  avatarDemoUsers,
  badgeAppearances,
  badgeSizes,
  badgeVariants,
  demoRows,
  getAvatarPresenceBadgeVariant,
  getStatusTone,
} from "../model/leaf-meta";
import { ShowcaseRow, renderPropsApiCard, renderReferenceNotesCard, renderUsageReviewCard } from "../components/docs-cards";

type TableHeaderSortField = "lastSync" | "signals" | "tenant";

const tableColumnHeaderPreviewRows = [
  {
    id: "nova",
    lastSyncMinutes: 180,
    lastSyncLabel: "3h ago",
    signalLabel: "Paused",
    signalRank: 2,
    signalVariant: "neutral" as const,
    slug: "nova.platform.localhost",
    tenant: "Nova Retail",
  },
  {
    id: "aurora",
    lastSyncMinutes: 12,
    lastSyncLabel: "12m ago",
    signalLabel: "Review",
    signalRank: 3,
    signalVariant: "warning" as const,
    slug: "demo.platform.localhost",
    tenant: "Aurora Commerce",
  },
  {
    id: "cinder",
    lastSyncMinutes: 39,
    lastSyncLabel: "39m ago",
    signalLabel: "Healthy",
    signalRank: 1,
    signalVariant: "success" as const,
    slug: "ops.platform.localhost",
    tenant: "Cinder Labs",
  },
] as const;

const tablePaginationPreviewRows = [
  { id: "aurora", note: "3 regions · synced 12m ago", plan: "Enterprise", status: "Healthy" },
  { id: "cinder", note: "1 region · synced 39m ago", plan: "Growth", status: "Trial" },
  { id: "nova", note: "2 regions · synced 3h ago", plan: "Starter", status: "Paused" },
  { id: "atlas", note: "5 regions · synced 8m ago", plan: "Enterprise", status: "Healthy" },
  { id: "meridian", note: "2 regions · synced 27m ago", plan: "Growth", status: "Trial" },
  { id: "solstice", note: "4 regions · synced 56m ago", plan: "Enterprise", status: "Healthy" },
  { id: "ember", note: "1 region · synced 2h ago", plan: "Starter", status: "Paused" },
  { id: "harbor", note: "3 regions · synced 18m ago", plan: "Growth", status: "Healthy" },
  { id: "orbit", note: "2 regions · synced 44m ago", plan: "Growth", status: "Trial" },
  { id: "quartz", note: "6 regions · synced 9m ago", plan: "Enterprise", status: "Healthy" },
  { id: "ridge", note: "1 region · synced 81m ago", plan: "Starter", status: "Paused" },
  { id: "summit", note: "4 regions · synced 23m ago", plan: "Enterprise", status: "Healthy" },
  { id: "tundra", note: "2 regions · synced 61m ago", plan: "Growth", status: "Trial" },
  { id: "vector", note: "3 regions · synced 31m ago", plan: "Growth", status: "Healthy" },
  { id: "willow", note: "1 region · synced 95m ago", plan: "Starter", status: "Paused" },
] as const;

const tableColumnVisibilityPreviewColumns: TableColumnVisibilityItem[] = [
  { checked: true, count: "Always visible", id: "tenant", label: "Tenant" },
  { checked: true, count: "12 values", id: "plan", label: "Plan" },
  { checked: true, count: "5 states", id: "status", label: "Status" },
  { checked: false, count: "8 regions", id: "region", label: "Region" },
  { checked: false, count: "4 owners", id: "owner", label: "Owner" },
  { checked: true, count: "Required", disabled: true, id: "lastSync", label: "Last sync" },
  { checked: false, count: "14 windows", id: "maintenance", label: "Maintenance" },
  { checked: false, count: 0, id: "incidents", label: "Open incidents" },
  { checked: false, count: "3 policies", id: "sla", label: "SLA policy" },
  { checked: false, count: "7 tags", id: "segment", label: "Segment" },
  { checked: false, count: "2 currencies", id: "billing", label: "Billing" },
  { checked: false, count: "Optional", id: "notes", label: "Notes" },
];

function getDefaultHeaderSortDirection(
  field: TableHeaderSortField,
): Exclude<TableSortDirection, null> {
  return field === "tenant" ? "asc" : "desc";
}

function getHeaderSortLabel(field: TableHeaderSortField) {
  switch (field) {
    case "lastSync":
      return "Last sync";
    case "signals":
      return "Signals";
    case "tenant":
    default:
      return "Tenant";
  }
}

function TableSelectionPreview() {
  const visibleRowIds = demoRows.map((row) => row.id);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([visibleRowIds[0] ?? ""]);
  const allVisibleSelected =
    visibleRowIds.length > 0 &&
    visibleRowIds.every((rowId) => selectedRowIds.includes(rowId));
  const partiallyVisibleSelected =
    selectedRowIds.length > 0 && !allVisibleSelected;

  return (
    <div className="ui-lab-page__stack">
      <div className="ui-lab-page__inline-wrap">
        <Badge appearance="soft" variant="brand">
          Selected rows: {selectedRowIds.length}
        </Badge>
        <Badge appearance="soft" variant="info">
          Composed from Checkbox + Table
        </Badge>
      </div>

      <div className="ui-lab-page__table-card">
        <Table density="compact">
          <TableHead>
            <TableRow>
              <TableHeaderCell className="ui-lab-page__table-selection-cell">
                <Checkbox
                  aria-label="Select all visible rows"
                  checked={allVisibleSelected}
                  indeterminate={partiallyVisibleSelected}
                  onChange={(event) => {
                    setSelectedRowIds(event.target.checked ? [...visibleRowIds] : []);
                  }}
                />
              </TableHeaderCell>
              <TableHeaderCell>Tenant</TableHeaderCell>
              <TableHeaderCell>Plan</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {demoRows.map((row) => {
              const isSelected = selectedRowIds.includes(row.id);

              return (
                <TableRow
                  className={isSelected ? "ui-lab-page__table-row--selected" : undefined}
                  key={`selection-${row.id}`}
                >
                  <TableCell className="ui-lab-page__table-selection-cell">
                    <Checkbox
                      aria-label={`Select ${row.id.replace("tenant-", "")}`}
                      checked={isSelected}
                      onChange={(event) => {
                        setSelectedRowIds((currentRowIds) =>
                          event.target.checked
                            ? currentRowIds.includes(row.id)
                              ? currentRowIds
                              : [...currentRowIds, row.id]
                            : currentRowIds.filter((rowId) => rowId !== row.id),
                        );
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TableMetaCell description={row.note} title={row.id.replace("tenant-", "")} />
                  </TableCell>
                  <TableCell>{row.plan}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusTone(row.status)}>{row.status}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TableColumnHeaderSortPreview() {
  const [sortField, setSortField] = useState<TableHeaderSortField | null>(null);
  const [sortDirection, setSortDirection] = useState<TableSortDirection>(null);

  const sortedRows =
    !sortField || !sortDirection
      ? [...tableColumnHeaderPreviewRows]
      : [...tableColumnHeaderPreviewRows].sort((left, right) => {
          let result = 0;

          switch (sortField) {
            case "tenant":
              result = left.tenant.localeCompare(right.tenant);
              break;
            case "signals":
              result = left.signalRank - right.signalRank;
              break;
            case "lastSync":
            default:
              result = left.lastSyncMinutes - right.lastSyncMinutes;
              break;
          }

          return sortDirection === "asc" ? result : -result;
        });

  function toggleSort(field: TableHeaderSortField) {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection(getDefaultHeaderSortDirection(field));
      return;
    }

    setSortDirection((currentDirection) =>
      currentDirection === "asc" ? "desc" : "asc",
    );
  }

  return (
    <div className="ui-lab-page__stack">
      <div className="ui-lab-page__inline-wrap">
        {sortField ? (
          <>
            <Badge appearance="soft" variant="brand">
              Sorted by {getHeaderSortLabel(sortField)}
            </Badge>
            <Badge appearance="soft" variant="info">
              {sortDirection === "asc" ? "Ascending" : "Descending"}
            </Badge>
          </>
        ) : (
          <>
            <Badge appearance="soft" variant="neutral">
              No active sort
            </Badge>
            <Badge appearance="soft" variant="info">
              Click a header to sort
            </Badge>
          </>
        )}
      </div>

      <div className="ui-lab-page__table-card">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>
                <TableColumnHeader
                  description="Workspace identity"
                  direction={sortField === "tenant" ? sortDirection : null}
                  icon={<InfoCircleIcon className="ui-lab-page__header-icon" />}
                  onSortToggle={() => toggleSort("tenant")}
                  title="Tenant"
                />
              </TableHeaderCell>
              <TableHeaderCell>
                <TableColumnHeader
                  description="Newest first"
                  direction={sortField === "lastSync" ? sortDirection : null}
                  onSortToggle={() => toggleSort("lastSync")}
                  title="Last sync"
                />
              </TableHeaderCell>
              <TableHeaderCell>
                <TableColumnHeader
                  description="Most critical first"
                  direction={sortField === "signals" ? sortDirection : null}
                  onSortToggle={() => toggleSort("signals")}
                  title="Signals"
                />
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <TableMetaCell description={row.slug} title={row.tenant} />
                </TableCell>
                <TableCell>{row.lastSyncLabel}</TableCell>
                <TableCell>
                  <Badge appearance="soft" variant={row.signalVariant}>
                    {row.signalLabel}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function renderAvatarDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Sizes and fallback</CardTitle>
          <CardDescription>Avatar should stay compact, legible, and donor-like without becoming a profile-screen surface.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Sizes">
            <Avatar size="xs">
              <AvatarFallback tone="brand">AL</AvatarFallback>
            </Avatar>
            <Avatar size="sm">
              <AvatarFallback tone="brand">AL</AvatarFallback>
            </Avatar>
            <Avatar size="md">
              <AvatarFallback tone="brand">AL</AvatarFallback>
            </Avatar>
            <Avatar size="lg">
              <AvatarFallback tone="brand">AL</AvatarFallback>
            </Avatar>
            <Avatar size="xl">
              <AvatarFallback tone="brand">AL</AvatarFallback>
            </Avatar>
          </ShowcaseRow>
          <ShowcaseRow label="Fallback tones">
            <Avatar>
              <AvatarFallback tone="neutral">AL</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback tone="brand">MK</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback tone="success">PR</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback tone="warning">JT</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback tone="danger">NS</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback tone="info">EK</AvatarFallback>
            </Avatar>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Image and presence</CardTitle>
          <CardDescription>Status should remain a compact supporting signal, not a replacement for readable identity text.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Presence">
            {avatarDemoUsers.slice(0, 4).map((user) => (
              <Avatar key={user.id} size="lg">
                {user.src ? <AvatarImage alt={user.name} src={user.src} /> : null}
                <AvatarFallback tone={user.tone}>{user.fallback}</AvatarFallback>
                {user.status ? (
                  <AvatarIndicator>
                    <AvatarStatus tone={user.status} />
                  </AvatarIndicator>
                ) : null}
              </Avatar>
            ))}
          </ShowcaseRow>
          <ShowcaseRow label="Fallback only">
            <Avatar size="lg">
              <AvatarFallback tone="warning">PR</AvatarFallback>
              <AvatarIndicator>
                <AvatarStatus tone="busy" />
              </AvatarIndicator>
            </Avatar>
            <Avatar size="lg">
              <AvatarFallback tone="info">NS</AvatarFallback>
            </Avatar>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Group and identity rows</CardTitle>
          <CardDescription>Identity presentation should be composed from avatar, text, and supporting status badges instead of a fixed profile card API.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Group" stacked>
            <AvatarGroup
              items={avatarDemoUsers.map((user) => ({
                alt: user.name,
                fallback: user.fallback,
                id: user.id,
                src: user.src,
                status: user.status,
                tone: user.tone,
              }))}
              max={4}
              size="md"
            />
          </ShowcaseRow>
          <ShowcaseRow label="Identity line" stacked>
            <div className="ui-lab-page__stack">
              {avatarDemoUsers.slice(0, 3).map((user) => (
                <div className="ui-lab-page__identity-row" key={user.id}>
                  <Avatar size="md">
                    {user.src ? <AvatarImage alt={user.name} src={user.src} /> : null}
                    <AvatarFallback tone={user.tone}>{user.fallback}</AvatarFallback>
                    {user.status ? (
                      <AvatarIndicator>
                        <AvatarStatus tone={user.status} />
                      </AvatarIndicator>
                    ) : null}
                  </Avatar>
                  <div className="ui-lab-page__identity-copy">
                    <span className="ui-lab-page__identity-title">{user.name}</span>
                    <span className="ui-lab-page__identity-description">{user.role}</span>
                  </div>
                  <Badge appearance="soft" variant={getAvatarPresenceBadgeVariant(user.status)}>
                    {user.status ?? "tracked"}
                  </Badge>
                </div>
              ))}
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact shared reference for avatar, status, and avatar-group before any product-specific profile presentation is layered on top.", [
        { name: "size", type: "\"xs\" | \"sm\" | \"md\" | \"lg\" | \"xl\"", notes: "Keeps avatar density consistent across menus, tables, cards, and activity surfaces." },
        { name: "src / alt", type: "image props", notes: "Use `AvatarImage` when an image exists and keep `alt` meaningful for assistive technology." },
        { name: "tone", type: "\"neutral\" | \"brand\" | \"success\" | \"warning\" | \"danger\" | \"info\"", notes: "Fallback tone provides a lightweight background system when only initials are available." },
        { name: "status", type: "\"online\" | \"offline\" | \"busy\" | \"away\"", notes: "Presence is optional and should stay a small secondary signal." },
        { name: "items / max", type: "AvatarGroup item list", notes: "Avatar group composes the same primitive repeatedly and collapses overflow into a compact `+N` summary." },
      ])}

      {renderReferenceNotesCard(
        "Avatar should stay a lightweight identity primitive rather than a profile surface or a layout-heavy media object.",
        [
          "The base family is root, image, fallback, optional status indicator, and optional avatar group.",
          "Identity rows should usually be composed from avatar plus nearby text instead of baking name and role into the primitive.",
          "Avatar group exists to express participation or collaborators without introducing a separate contributor card contract.",
        ],
        [
          "Use `AvatarFallback` even when an image is expected so the contract degrades cleanly.",
          "Prefer `AvatarGroup` for compact presence clusters and keep richer contributor layouts outside the primitive layer.",
          "Treat identity text, role labels, and badges as compositional neighbors rather than props on the avatar itself.",
        ],
        [
          "Image avatars still need meaningful `alt` text unless the surrounding text fully names the same person and the image is decorative.",
          "Presence indicators should reinforce identity context but not be the only readable state marker.",
          "Avoid oversized avatar-driven layouts that collapse reading order or bury the actual label text.",
        ],
      )}

      {renderUsageReviewCard(
        "Avatar works best as a compact identity cue for people, operators, and contributor clusters.",
        [
          "A surface needs quick identity recognition in a small space such as a menu, row, card header, or activity item.",
          "A compact group of people or operators needs to be shown without introducing a full people-list component.",
        ],
        [
          "Keep avatar paired with readable text when the person or operator identity matters.",
          "Use group overflow summarization instead of letting avatar clusters expand unpredictably.",
          "Reserve presence dots for real presence or availability semantics, not decorative color accents.",
        ],
        [
          "Do not turn avatar into a profile header system with biography, actions, and layout rules.",
          "Do not rely on avatar color or presence dot as the only state explanation.",
          "Do not introduce one-off profile cards when a simple avatar-plus-text composition will do.",
        ],
      )}
    </div>
  );
}

export function renderBadgeDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Appearances</CardTitle>
          <CardDescription>Badge appearance should stay predictable across soft status labels and stronger alerts.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          {badgeAppearances.map((appearance) => (
            <ShowcaseRow key={appearance} label={appearance[0].toUpperCase() + appearance.slice(1)}>
              {badgeVariants.map((variant) => (
                <Badge appearance={appearance} key={`${appearance}-${variant}`} variant={variant}>
                  {variant}
                </Badge>
              ))}
            </ShowcaseRow>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sizes</CardTitle>
          <CardDescription>Size choices should remain legible in filters, inline status chips, and table cells.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          {badgeSizes.map((size) => (
            <ShowcaseRow key={size} label={size.toUpperCase()}>
              <Badge size={size} variant="brand">
                Brand
              </Badge>
              <Badge appearance="outline" size={size} variant="neutral">
                Neutral
              </Badge>
              <Badge appearance="solid" size={size} variant="success">
                Success
              </Badge>
            </ShowcaseRow>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dot usage</CardTitle>
          <CardDescription>Dot badges work well for status summaries and compact health indicators.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Health">
            <Badge dot variant="success">
              Healthy
            </Badge>
            <Badge dot variant="warning">
              Review
            </Badge>
            <Badge dot variant="danger">
              Degraded
            </Badge>
          </ShowcaseRow>
          <ShowcaseRow label="Context">
            <Badge appearance="outline" dot variant="brand">
              Workspace
            </Badge>
            <Badge appearance="soft" dot variant="info">
              Syncing
            </Badge>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared badge API used across tables, cards, filters, and status clusters.", [
        { name: "variant", type: "\"brand\" | \"neutral\" | \"success\" | \"warning\" | \"danger\" | \"info\"", notes: "Controls the semantic tone used by the badge across shared surfaces." },
        { name: "appearance", type: "\"soft\" | \"outline\" | \"solid\"", notes: "Changes emphasis level while keeping the same compact badge contract." },
        { name: "size", type: "\"sm\" | \"md\" | \"lg\"", notes: "Adjusts density for compact filters, inline cells, and larger summary clusters." },
        { name: "dot", type: "boolean", notes: "Adds a leading status marker for compact health and state indicators." },
        { name: "children", type: "ReactNode", notes: "Badge label content should stay short enough to read as supporting metadata." },
      ])}

      {renderReferenceNotesCard(
        "Badge should document its compact status and context role before any app-specific tagging patterns get layered on top.",
        [
          "The shared structure is a short label with optional tone and optional leading dot indicator.",
          "Appearance changes emphasis while keeping the badge compact and easily scannable.",
          "Size changes density without changing the badge's role as supporting metadata.",
        ],
        [
          "`variant`, `appearance`, `size`, and `dot` are the primary stable badge controls.",
          "Choose one tone mapping system and reuse it consistently across tables, cards, and filters.",
          "Keep badge content short enough to read as a supporting label, not a sentence.",
        ],
        [
          "Badges need textual meaning; tone alone should never carry the state.",
          "Interactive badge behavior should not be implied unless separate button or link semantics are introduced.",
          "Avoid abbreviations that become cryptic when read out of surrounding context.",
        ],
      )}

      {renderUsageReviewCard(
        "Badge works best as a compact status, scope, or count label that reinforces surrounding content without becoming the primary message.",
        [
          "Rows, cards, or filters need short status or category chips that can be scanned quickly.",
          "A surface needs compact tone-led emphasis for health, state, or scope.",
        ],
        [
          "Keep badge text short and pick tones consistently across similar states.",
          "Match badge size to the density of the surrounding surface.",
          "Use dot and soft appearances when the surrounding content should stay dominant.",
        ],
        [
          "Do not put sentence-length messaging inside badges.",
          "Do not combine too many tones in one cluster if the user only needs one primary signal.",
          "Do not treat badges as buttons unless the interaction contract is explicit.",
        ],
      )}
    </div>
  );
}

export function renderStatusDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Dot scale</CardTitle>
          <CardDescription>Pure status dot should stay extremely small and useful as a supporting marker inside dense rows and identity lines.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Tones">
            <StatusDot aria-label="Neutral" tone="neutral" />
            <StatusDot aria-label="Brand" tone="brand" />
            <StatusDot aria-label="Success" tone="success" />
            <StatusDot aria-label="Warning" tone="warning" />
            <StatusDot aria-label="Danger" tone="danger" />
            <StatusDot aria-label="Info" tone="info" />
          </ShowcaseRow>
          <ShowcaseRow label="Sizes">
            <StatusDot aria-label="Small success" size="sm" tone="success" />
            <StatusDot aria-label="Medium warning" size="md" tone="warning" />
            <StatusDot aria-label="Large danger" size="lg" tone="danger" />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inline usage</CardTitle>
          <CardDescription>Inline status should cover the calm middle ground between a decorative presence dot and a fuller badge.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Status row" stacked>
            <div className="ui-lab-page__stack">
              <InlineStatus tone="success">Healthy</InlineStatus>
              <InlineStatus tone="warning">Needs review</InlineStatus>
              <InlineStatus tone="danger">Escalated</InlineStatus>
            </div>
          </ShowcaseRow>
          <ShowcaseRow label="Composed" stacked>
            <div className="ui-lab-page__stack">
              <div className="ui-lab-page__identity-row">
                <Avatar size="md">
                  <AvatarFallback tone="brand">AL</AvatarFallback>
                </Avatar>
                <div className="ui-lab-page__identity-copy">
                  <span className="ui-lab-page__identity-title">Aurora workspace</span>
                  <span className="ui-lab-page__identity-description">Operator-owned tenant coordination</span>
                </div>
                <InlineStatus tone="success">Live sync</InlineStatus>
              </div>
              <div className="ui-lab-page__scroll-item">
                <TableMetaCell description="enterprise · 12m ago · 2 active signals" title="aurora" />
                <InlineStatus tone="warning">Review</InlineStatus>
              </div>
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared status-marker family used between pure dots and fuller status badges.", [
        { name: "tone", type: "\"neutral\" | \"brand\" | \"success\" | \"warning\" | \"danger\" | \"info\"", notes: "Keeps status color semantics aligned with the existing badge and feedback token system." },
        { name: "size", type: "\"sm\" | \"md\" | \"lg\"", notes: "Supports tighter table cells, normal inline metadata, and slightly louder row status without new variants." },
        { name: "StatusDot", type: "component", notes: "Use when the surface needs only a compact visual marker and already exposes readable text nearby." },
        { name: "InlineStatus", type: "component", notes: "Adds the same dot language to a short inline label for compact rows and supporting metadata." },
        { name: "native span props", type: "HTMLAttributes<HTMLSpanElement>", notes: "Keeps the family lightweight and composition-friendly instead of inventing a complex status API." },
      ])}

      {renderReferenceNotesCard(
        "Inline status should stay a compact supporting state family between decorative presence indicators and fuller status badges.",
        [
          "The stable family is a standalone dot plus a dot-with-label inline wrapper.",
          "Tone maps to the same semantic color system already used by badge and feedback primitives.",
          "This family exists to keep short state markers calm when a full badge would feel too heavy.",
        ],
        [
          "Use `StatusDot` only when nearby text or context already explains the state clearly.",
          "Use `InlineStatus` for short supporting labels in rows, identity lines, and compact metadata stacks.",
          "Prefer badge instead when the status needs stronger emphasis or chip-like framing.",
        ],
        [
          "A standalone dot must not be the only accessible status explanation unless it is given a clear label.",
          "Do not let tiny status markers replace meaningful row text or state descriptions.",
          "Keep labels short enough that inline status remains a supporting signal rather than a sentence.",
        ],
      )}

      {renderUsageReviewCard(
        "Inline status fits calm, compact state communication where badge would feel too heavy and a pure presence dot would be too ambiguous.",
        [
          "A table row, identity line, or compact metadata block needs a short state marker.",
          "The state should remain visible, but supporting content must stay visually dominant.",
        ],
        [
          "Choose inline status for short labels like live sync, degraded, or review when chip framing is unnecessary.",
          "Keep status tones aligned with the same semantic mapping used in badge and alerts.",
          "Use the dot-only form sparingly and only with nearby readable context.",
        ],
        [
          "Do not use this family for prominent workflow actions or callouts that should be badges or alerts.",
          "Do not overload one row with many different status markers if one primary signal is enough.",
          "Do not treat the dot as a decorative accent unrelated to real state semantics.",
        ],
      )}
    </div>
  );
}

export function renderRatingDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Sizes and value display</CardTitle>
          <CardDescription>Rating should stay compact enough for dense reviews while still allowing clear numeric reinforcement when needed.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Sizes">
            <Rating defaultValue={3} size="sm" />
            <Rating defaultValue={4} size="md" />
            <Rating defaultValue={5} size="lg" />
          </ShowcaseRow>
          <ShowcaseRow label="Show value" stacked>
            <div className="ui-lab-page__stack">
              <Rating defaultValue={4} showValue />
              <Rating readOnly showValue value={4.5} />
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interactive versus read-only</CardTitle>
          <CardDescription>Interactive scoring and read-only score display should share the same star language without becoming a review-card pattern.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Interactive" stacked>
            <Field>
              <FieldLabel id="ui-lab-rating-interactive-label">Quality score</FieldLabel>
              <Rating aria-labelledby="ui-lab-rating-interactive-label" defaultValue={3} />
              <FieldHint>Interactive mode supports quick operator scoring without creating a separate score form shell.</FieldHint>
            </Field>
          </ShowcaseRow>
          <ShowcaseRow label="Read only" stacked>
            <div className="ui-lab-page__stack">
              <Rating readOnly showValue value={3.7} />
              <Rating disabled value={2} />
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared star-rating primitive used by review and quality signals.", [
        { name: "value / defaultValue / onValueChange", type: "number / callback", notes: "Supports controlled or uncontrolled scoring with the same star contract." },
        { name: "max", type: "number", notes: "Defines the star count when a surface needs something other than the default five-step scale." },
        { name: "size", type: "\"sm\" | \"md\" | \"lg\"", notes: "Adjusts density for inline review rows, cards, and detail summaries." },
        { name: "readOnly / disabled", type: "boolean", notes: "Separates passive score display from selectable rating input." },
        { name: "showValue", type: "boolean", notes: "Adds a numeric companion when the surrounding surface benefits from exact value reinforcement." },
      ])}

      {renderReferenceNotesCard(
        "Rating should stay a lightweight score primitive rather than a review widget or a card template.",
        [
          "The stable anatomy is a row of stars with optional numeric value displayed beside the scale.",
          "Interactive mode uses the same star visuals as read-only mode so scoring and display stay aligned.",
          "Partial fill is allowed for read-only decimal display without forcing surfaces into a separate analytics or review contract.",
        ],
        [
          "Use rating when a compact star-based value is already familiar enough for the operator or user.",
          "Keep surrounding labels and review copy outside the primitive so the star control remains generic.",
          "Use `showValue` when exact precision matters more than the rough star shape alone.",
        ],
        [
          "Rating still needs a readable label or nearby text that explains what is being rated.",
          "Do not rely on star color or fill level as the only explanation of quality meaning.",
          "Avoid using rating where numeric scales, tags, or explicit statuses would communicate more clearly.",
        ],
      )}

      {renderUsageReviewCard(
        "Rating works best for compact opinion, quality, or review signals where a star scale is already an expected mental model.",
        [
          "A surface needs a quick score input or a compact score summary.",
          "The surrounding content can explain what the score represents without turning the primitive into a review template.",
        ],
        [
          "Keep rating paired with clear nearby text so the meaning of the score is explicit.",
          "Use read-only mode for summaries and interactive mode only where the user is genuinely expected to score something.",
          "Prefer the default five-step contract before adding custom scoring scales.",
        ],
        [
          "Do not use rating for generic approval state or health state where badges or explicit statuses communicate better.",
          "Do not bury essential workflow decisions behind stars alone.",
          "Do not turn the primitive into a full review card with metadata, avatars, and threaded comments.",
        ],
      )}
    </div>
  );
}

export function renderTableDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Density</CardTitle>
          <CardDescription>Comfortable and compact modes should preserve hierarchy, stay grid-friendly, and expand to the width available to each surface.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Density grid" stacked>
            <div className="ui-lab-page__table-demo-grid">
              {([
                { density: "comfortable" as const, id: "comfortable", label: "Comfortable" },
                { density: "compact" as const, id: "compact", label: "Compact" },
              ]).map((mode) => (
                <div className="ui-lab-page__table-demo-panel" key={mode.id}>
                  <span className="ui-lab-page__table-demo-label">{mode.label}</span>
                  <div className="ui-lab-page__table-card">
                    <Table density={mode.density}>
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>Tenant</TableHeaderCell>
                          <TableHeaderCell>Plan</TableHeaderCell>
                          <TableHeaderCell>Status</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {demoRows.map((row) => (
                          <TableRow key={`${mode.id}-${row.id}`}>
                            <TableCell>
                              <TableMetaCell description={row.note} title={row.id.replace("tenant-", "")} />
                            </TableCell>
                            <TableCell>{row.plan}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusTone(row.status)}>{row.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checkbox selection</CardTitle>
          <CardDescription>Checkbox selection should stay explicit, with select-all and per-row state owned by the surface rather than by the base table primitive.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Select all and one-by-one" stacked>
            <TableSelectionPreview />
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the table composition surface and its most important shared companion primitives.", [
        { name: "Table.density", type: "\"comfortable\" | \"compact\"", notes: "Sets row density for the whole table while keeping headers and cells in the same contract." },
        { name: "TableSortButton.direction", type: "\"asc\" | \"desc\" | null", notes: "Expresses column sort affordance without requiring a screen-owned sort header implementation." },
        { name: "TableMetaCell.title", type: "ReactNode", notes: "Primary row identity line; should stay concise and scan-friendly." },
        { name: "TableMetaCell.description / caption", type: "ReactNode", notes: "Optional secondary and tertiary text layers for row context without ad-hoc stacked markup." },
        { name: "native table props", type: "TableHTMLAttributes<HTMLTableElement>", notes: "Use standard semantic table structure and attributes instead of div-based collection shells." },
      ])}

      {renderReferenceNotesCard(
        "Table should document its core structure as composition of rows, cells, headers, meta cells, and sort affordance rather than as one rigid screen layout.",
        [
          "The stable anatomy is table, head, body, row, header cell, cell, and optional meta-cell hierarchy inside a cell.",
          "Density is part of the shared table contract and should not depend on screen-specific CSS forks.",
          "Sort affordance stays separate so column headers can opt in only where comparison really matters.",
        ],
        [
          "`density` is the main shared table-level control, while `TableSortButton` and `TableMetaCell` stay compositional.",
          "Use table primitives to assemble row structure instead of adding screen-specific wrapper markup around every record.",
          "Compose checkbox selection from `Checkbox` plus app-owned selected row ids instead of expecting a separate built-in selection runtime.",
          "Keep special row states and broader selection behavior in app or higher-level patterns unless they stabilize across multiple surfaces.",
        ],
        [
          "Headers must remain explicit so column meaning is clear to both visual and assistive scanning.",
          "Do not hide essential row meaning inside decorative layout fragments that break semantic table reading.",
          "Keep sorting and status information understandable without relying only on icon direction or color.",
        ],
      )}

      {renderUsageReviewCard(
        "Table belongs to dense comparable records where column scanning, sorting, and row-level status matter more than narrative reading.",
        [
          "Users need to compare multiple records across shared attributes and statuses.",
          "A surface benefits from density controls, stable headers, and reusable row hierarchy.",
        ],
        [
          "Use clear column labels and keep density choices deliberate.",
          "Preserve primary-secondary row hierarchy through meta cells instead of ad-hoc stacked text.",
          "Add checkbox selection only when the surface has a real bulk or review action that justifies it.",
          "Expose sort affordance only where the column meaning stays obvious.",
        ],
        [
          "Do not use table for content that is mostly prose, forms, or long freeform descriptions.",
          "Do not add select-all checkboxes when the page has no meaningful bulk action or multi-row workflow.",
          "Do not overload each row with too many actions or custom cell layouts.",
          "Do not introduce one-off row structures that break the shared scanning rhythm.",
        ],
      )}
    </div>
  );
}

export function renderTableColumnHeaderDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Sortable header composition</CardTitle>
          <CardDescription>Richer header rows should stay inside the shared table layer instead of growing a separate grid runtime, and sortable headers should visibly reorder rows when clicked.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Interactive sort" stacked>
            <TableColumnHeaderSortPreview />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Static header composition</CardTitle>
          <CardDescription>Not every richer header needs sorting. Static title plus description should remain a first-class option.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Static" stacked>
            <div className="ui-lab-page__table-card">
              <Table density="compact">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>
                      <TableColumnHeader
                        description="Primary operator"
                        icon={<InfoCircleIcon className="ui-lab-page__header-icon" />}
                        title="Owner"
                      />
                    </TableHeaderCell>
                    <TableHeaderCell>
                      <TableColumnHeader description="Region count" title="Regions" />
                    </TableHeaderCell>
                    <TableHeaderCell>
                      <TableColumnHeader description="Plan tier" title="Plan" />
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <TableMetaCell description="ops@platform.local" title="Mika Kent" />
                    </TableCell>
                    <TableCell>3</TableCell>
                    <TableCell>Enterprise</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the richer header helper that sits above raw `th` content inside the shared table layer.", [
        { name: "title", type: "ReactNode", notes: "Primary header label that should remain concise and scan-friendly." },
        { name: "description", type: "ReactNode", notes: "Optional secondary line for brief column guidance or sort context." },
        { name: "icon", type: "ReactNode", notes: "Optional supporting icon for quiet column context, not for decorative overload." },
        { name: "direction", type: "\"asc\" | \"desc\" | null", notes: "Current sort direction when the header exposes the shared sort affordance." },
        { name: "onSortToggle", type: "(event) => void", notes: "When provided, the helper renders through the shared sort button instead of static text; the caller still owns sort state and row reordering." },
      ])}

      {renderReferenceNotesCard(
        "Table column header should stay a small richer helper inside the approved table primitive layer, not a data-grid system.",
        [
          "The stable anatomy is main label row plus optional supporting description and optional leading icon.",
          "Sorting remains opt-in through the existing shared sort affordance instead of forcing every header to become interactive.",
          "The helper shows sort state, but the surrounding surface still owns the actual field selection and row order.",
          "The helper belongs inside `th` composition and should remain table-semantic.",
        ],
        [
          "Use `TableColumnHeader` when a column needs a little more structure than plain text but still belongs to the shared table grammar.",
          "Keep icons and descriptions quiet so the table header row remains scannable.",
          "Use `onSortToggle` only when the column genuinely participates in shared sort behavior.",
          "Wire sortable demos and product surfaces to visible state changes so the affordance never looks inert.",
        ],
        [
          "Interactive column headers need clear button semantics and readable sort state beyond icon direction alone.",
          "Descriptions should stay brief so header scanning remains fast for both visual and assistive users.",
          "Do not bury essential meaning in icon-only headers or multi-line decorative content.",
        ],
      )}

      {renderUsageReviewCard(
        "Table column header is useful when a shared table needs richer column context without inventing a separate grid abstraction.",
        [
          "A table column needs a short subtitle, sort hint, or quiet icon alongside the label.",
          "The shared table layer should offer a richer header option without turning into a vendor-shaped data grid.",
        ],
        [
          "Keep header copy short and consistent with the rest of the table row rhythm.",
          "Use the same sort affordance as the rest of the shared table primitives.",
          "Reserve richer headers for columns where the added context genuinely improves scanning.",
        ],
        [
          "Do not turn header cells into menus, filter bars, or complex app-owned controls.",
          "Do not overload every column with icons and subtitles until the header row becomes noisy.",
          "Do not couple the primitive to TanStack-style column objects or product-specific grid state.",
        ],
      )}
    </div>
  );
}

export function renderTablePaginationBarDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Pagination rhythm</CardTitle>
          <CardDescription>Pagination bar should reuse the shared pagination language, keeping page navigation on the left and total entries context on the right.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Interactive" stacked>
            <TablePaginationBarPreview />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dense table fit</CardTitle>
          <CardDescription>Under a table, pagination should stay on the left while rows-per-page and a total entries count sit on the right on desktop, then collapse to pagination plus entries count on mobile.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Compact table" stacked>
            <TablePaginationBarTablePreview />
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared table pagination helper that sits above the base table primitive but below app-owned data-grid logic.", [
        { name: "currentPage / totalPages", type: "number", notes: "Defines the current one-based page and the total available page count." },
        { name: "pageSize / pageSizeOptions", type: "number / number[]", notes: "Controls optional rows-per-page display when the surface allows page-size switching." },
        { name: "totalItems", type: "number", notes: "Used to derive the compact total-entries summary shown opposite the page navigation." },
        { name: "onPageChange", type: "(page: number) => void", notes: "Required interaction callback delegated into the shared pagination control." },
        { name: "onPageSizeChange", type: "(pageSize: number) => void", notes: "Optional callback for surfaces that expose rows-per-page selection." },
        { name: "editableCurrentPage", type: "boolean", notes: "Keeps the active page slot aligned with the shared pagination contract when inline page entry should stay available." },
      ])}

      {renderReferenceNotesCard(
        "Table pagination bar should stay a small table-owned helper built from the shared pagination primitive, not a generic route footer or a full data-grid runtime.",
        [
          "The stable anatomy is shared page navigation on the left plus total entries context and optional page-size control on the right.",
          "The helper assumes one-based page semantics so product surfaces do not need to leak internal zero-based indexing into the UI contract.",
          "Total entries summary belongs here because it reinforces collection size without turning the helper into a full toolbar.",
        ],
        [
          "Use this helper directly under tables or dense collection surfaces that need classic page navigation.",
          "Reuse the approved shared pagination grammar instead of inventing a second table-only page-stepper.",
          "Keep page-size switching optional so small surfaces can stay lighter when the extra control is unnecessary.",
          "Prefer this helper over app-local pagination footers when the same table rhythm repeats across screens.",
        ],
        [
          "Do not turn the helper into a filter bar, export row, or bulk-action shell.",
          "Do not couple it directly to a vendor grid runtime or column object model.",
          "Do not use page-only pagination when the surface is actually infinite-scroll or load-more driven.",
        ],
      )}

      {renderUsageReviewCard(
        "Table pagination bar works best when a reusable table or collection needs classic page stepping and optional rows-per-page control.",
        [
          "The dataset is large enough that paging is clearer than one long scroll surface.",
          "Operators need quick awareness of current result range and page position.",
        ],
        [
          "Keep the helper visually close to the table it controls.",
          "Use the same rows-per-page and page-step rhythm across comparable admin surfaces.",
          "Keep copy neutral and table-specific instead of embedding workflow language.",
        ],
        [
          "Do not use this helper as a generic page footer outside a table or collection context.",
          "Do not add donor grid features such as density toggles or filter chips into the helper itself.",
          "Do not duplicate pagination logic in each screen once the shared helper fits the need.",
        ],
      )}
    </div>
  );
}

export function renderTableColumnVisibilityDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Column toggle contract</CardTitle>
          <CardDescription>Column visibility now acts as a shared table helper for modest personalization, using one trigger, one popover, and caller-owned checkbox state across real surfaces.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Popover" stacked>
            <TableColumnVisibilityPreview />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Table fit</CardTitle>
          <CardDescription>The helper stays above the stable base table contract, but its toolbar placement and long-list scroll behavior now match multiple real table surfaces.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Why shared" stacked>
            <Alert tone="info">
              <AlertBody>
                <AlertTitle>Stable shared helper</AlertTitle>
                <AlertDescription>
                  The trigger, popover, checkbox list, and caller-owned state pattern are now aligned across both the tenant workbench and audit log table surfaces.
                </AlertDescription>
              </AlertBody>
            </Alert>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared table column-visibility helper.", [
        { name: "columns", type: "Array<{ id, label, checked, disabled?, count? }>", notes: "Supplies the visible state and display metadata for each configurable column." },
        { name: "triggerLabel", type: "ReactNode", notes: "Lets surfaces rename the trigger without reimplementing the helper shell." },
        { name: "label", type: "ReactNode", notes: "Small header label inside the popover content and the accessible name source for the dialog." },
        { name: "onColumnChange", type: "(id: string, checked: boolean) => void", notes: "Required interaction callback while table state ownership remains outside the helper." },
        { name: "emptyLabel", type: "ReactNode", notes: "Fallback content when no configurable columns are available." },
      ])}

      {renderReferenceNotesCard(
        "Table column visibility is a small shared helper for modest table personalization, not a full data-grid preference runtime.",
        [
          "The current anatomy is trigger button, popover container, and checkbox list with optional counts.",
          "Column state remains external so the helper does not turn into a table runtime or state store.",
          "Longer column lists must scroll inside the popover rather than growing past the viewport.",
          "Optional counts are useful for context, but they should remain secondary metadata rather than a second status system.",
        ],
        [
          "Use this helper only where users truly benefit from choosing visible columns.",
          "Keep the helper outside the base table primitive so tables without personalization stay lighter.",
          "Keep the same trigger, popover, and checkbox rhythm across comparable operator tables instead of forking a second column-settings pattern.",
        ],
        [
          "Do not assume every admin table needs column personalization.",
          "Do not couple the helper to one table library's column object shape.",
          "Do not add filter logic, sort controls, or saved views into the same popover until reuse proves the grouping is correct.",
        ],
      )}

      {renderUsageReviewCard(
        "Table column visibility is useful when dense operator tables need modest personalization without escalating into a full grid preferences runtime.",
        [
          "A table has enough optional columns that operators benefit from hiding a few.",
          "The product wants light per-surface column personalization without a full data-grid runtime.",
        ],
        [
          "Keep table state management outside the helper so the API stays generic.",
          "Use simple labels and quiet counts rather than mini analytics inside the popover.",
          "Keep one or two anchor columns required when the table would become ambiguous without them.",
        ],
        [
          "Do not use it as a dumping ground for every table preference.",
          "Do not let column personalization outrank the core readability of the default table layout.",
          "Do not widen the helper toward saved views, pinning, or grid-vendor semantics unless a separate shared contract is actually needed.",
        ],
      )}
    </div>
  );
}

export function renderCardDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>Card should stay neutral by default, with only a restrained accent option for higher-emphasis panels.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default and accent" stacked>
            <div className="ui-lab-page__card-demo-grid">
              <Card>
                <CardHeader>
                  <CardTitle>Tenant overview</CardTitle>
                  <CardDescription>Default card works for most documentation, settings, and summary panels.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="ui-lab-page__card-footnote">Keep the base card calm so denser surfaces can layer content without adding visual noise.</p>
                </CardContent>
              </Card>

              <Card variant="accent">
                <CardHeader>
                  <CardTitle>Review attention</CardTitle>
                  <CardDescription>Accent should stay useful for elevated notice without becoming a new screen layout.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="ui-lab-page__card-footnote">Accent belongs to rare emphasis cases, not to every card in a dashboard grid.</p>
                </CardContent>
              </Card>
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Header and toolbar</CardTitle>
          <CardDescription>Header body and toolbar should cover the majority of reusable panel headers without screen-owned wrappers.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Header toolbar patterns" stacked>
            <div className="ui-lab-page__card-demo-grid">
              <Card>
                <CardHeader>
                  <CardToolbar>
                    <CardHeaderBody>
                      <CardTitle>Operations summary</CardTitle>
                      <CardDescription>Toolbar actions stay adjacent to the header without changing the panel contract.</CardDescription>
                    </CardHeaderBody>
                    <Button size="sm" variant="outline">
                      Export
                    </Button>
                  </CardToolbar>
                </CardHeader>
                <CardContent>
                  <p className="ui-lab-page__card-footnote">Use toolbar only when the card owns one restrained panel-level action.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardToolbar>
                    <CardHeaderBody>
                      <CardTitle>Drift review queue</CardTitle>
                      <CardDescription>Two quiet actions are acceptable when both clearly belong to the same bounded panel.</CardDescription>
                    </CardHeaderBody>
                    <div className="ui-lab-page__card-toolbar-actions">
                      <Badge appearance="soft" variant="brand">
                        12 items
                      </Badge>
                      <Button size="sm" variant="outline">
                        Refresh
                      </Button>
                    </div>
                  </CardToolbar>
                </CardHeader>
                <CardContent>
                  <p className="ui-lab-page__card-footnote">Keep toolbar actions calm; heavier multi-action clusters should move up to page-level toolbars.</p>
                </CardContent>
              </Card>
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content and footer</CardTitle>
          <CardDescription>Content should stay roomy enough for data, while footer remains reserved for summary context or restrained actions.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Footer" stacked>
            <Card>
              <CardHeader>
                <CardTitle>Rollout note</CardTitle>
                <CardDescription>Footer works well for concise follow-up context or one clear action.</CardDescription>
              </CardHeader>
              <CardContent className="ui-lab-page__stack">
                <p className="ui-lab-page__card-footnote">Supporting copy should breathe inside the content region instead of collapsing into the header.</p>
                <div className="ui-lab-page__inline-wrap">
                  <Badge appearance="soft" variant="warning">Review</Badge>
                  <Badge appearance="soft" variant="brand">Queued</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <p className="ui-lab-page__card-footnote">Updated 12 minutes ago</p>
                <Button size="sm" variant="outline">
                  View detail
                </Button>
              </CardFooter>
            </Card>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared panel composition surface used by documentation, lists, settings, and detail panels.", [
        { name: "variant", type: "\"default\" | \"accent\"", notes: "Controls panel emphasis while preserving the same core card anatomy." },
        { name: "CardHeader / CardContent / CardFooter", type: "composition", notes: "Shared top, middle, and bottom regions for most reusable panel layouts." },
        { name: "CardHeaderBody / CardToolbar", type: "composition", notes: "Optional header helpers for title-description copy plus restrained header actions." },
        { name: "CardTitle / CardDescription", type: "composition", notes: "Use shared title and description slots instead of ad-hoc panel typography." },
      ])}

      {renderReferenceNotesCard(
        "Card should document the reusable panel anatomy clearly so product surfaces can compose panels without inventing screen-specific chrome.",
        [
          "The stable anatomy is card container, optional header, content, optional footer, and optional toolbar inside the header.",
          "Title and description belong to the shared card language so panels read consistently across the product.",
          "Accent is a restrained emphasis option, not a separate card family.",
        ],
        [
          "`variant` is the only core visual fork; layout should come from composition rather than extra card props.",
          "Use `CardHeaderBody` and `CardToolbar` when header actions are truly tied to the panel itself.",
          "Keep data-specific orchestration outside the card primitive and compose it through content instead.",
        ],
        [
          "Title and description should stay meaningful when read in sequence by assistive technology.",
          "Do not bury essential actions or status meaning only inside decorative card styling.",
          "Keep heading levels appropriate to the surrounding page structure when cards appear in larger layouts.",
        ],
      )}

      {renderUsageReviewCard(
        "Card is appropriate for bounded panel content that benefits from a shared surface, spacing rhythm, and optional header or footer structure.",
        [
          "A surface needs a reusable container for a compact unit of related content, controls, or status.",
          "The panel may need a header, optional supporting description, and occasionally one restrained toolbar action.",
        ],
        [
          "Use the calm default card as the baseline for most panels.",
          "Reserve accent for limited emphasis instead of making every card visually loud.",
          "Keep footer usage deliberate and lightweight.",
        ],
        [
          "Do not turn card into a page-shell replacement or a catch-all layout primitive.",
          "Do not add many one-off card variants when composition solves the need more cleanly.",
          "Do not overload the header with action clusters that belong in page-level toolbars.",
        ],
      )}
    </div>
  );
}

function FilterChipSingleSelectExample() {
  const filters = [
    { id: "all", label: "All tenants", count: 184 },
    { id: "healthy", label: "Healthy", count: 132 },
    { id: "review", label: "Review", count: 12 },
    { id: "warnings", label: "Warnings", count: 40 },
  ] as const;
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]["id"]>("healthy");
  const selectedFilter = filters.find((filter) => filter.id === activeFilter) ?? filters[0];

  return (
    <div className="ui-lab-page__stack">
      <div className="ui-lab-page__inline-wrap">
        {filters.map((filter) => (
          <FilterChip
            active={filter.id === activeFilter}
            count={filter.count}
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </FilterChip>
        ))}
      </div>

      <div className="ui-lab-page__note-card">
        <span className="ui-lab-page__note-label">Collection result</span>
        <p className="ui-lab-page__card-footnote">
          Showing the <strong>{selectedFilter.label}</strong> slice inside the same tenant list. Filter chips narrow one local collection; they do not switch the page to another peer view like tabs.
        </p>
      </div>
    </div>
  );
}

function FilterChipCollectionExample() {
  const filters = [
    { id: "active", label: "Active", count: 24 },
    { id: "trial", label: "Trial", count: 8 },
    { id: "suspended", label: "Suspended", count: 3 },
    { id: "escalated", label: "Escalated", count: 2 },
  ] as const;
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]["id"]>("active");
  const selectedFilter = filters.find((filter) => filter.id === activeFilter) ?? filters[0];

  return (
    <div className="ui-lab-page__stack">
      <div className="ui-lab-page__inline-wrap">
        {filters.map((filter) => (
          <FilterChip
            active={filter.id === activeFilter}
            count={filter.count}
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </FilterChip>
        ))}
      </div>

      <div className="ui-lab-page__note-card">
        <span className="ui-lab-page__note-label">Current scope</span>
        <p className="ui-lab-page__card-footnote">
          The list stays on the same page and keeps the same structure. Only the current collection scope changes to <strong>{selectedFilter.label}</strong>.
        </p>
      </div>
    </div>
  );
}

export function renderFilterChipDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Default and active</CardTitle>
          <CardDescription>Filter chip should stay compact, pressed-state driven, and clearly scoped to local collection filtering rather than peer-view navigation.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Local filter row" stacked>
            <FilterChipSingleSelectExample />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bounded filter sets</CardTitle>
          <CardDescription>The pattern should work best for a small number of mutually comparable filter choices, not for dense tag clouds or route navigation.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Collection filters" stacked>
            <FilterChipCollectionExample />
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the stable pressed-state chip used for local collection filters and bounded control rows.", [
        { name: "active", type: "boolean", notes: "Applies the pressed-state styling and syncs `aria-pressed` for the current choice." },
        { name: "count", type: "number", notes: "Optional small count for local filter context when item totals help scanning." },
        { name: "children", type: "ReactNode", notes: "Visible short filter label that should remain compact and scannable." },
        { name: "native button props", type: "ButtonHTMLAttributes<HTMLButtonElement>", notes: "Preserves standard button semantics without embedding any filter-state model in the component." },
      ])}

      {renderReferenceNotesCard(
        "Filter chip now qualifies as a stable shared control because reuse already exists across multiple collection surfaces and the API remains intentionally small.",
        [
          "The anatomy is a short pressed-state button label with optional trailing count.",
          "The chip communicates local selection state without introducing its own filter model, query logic, or workflow semantics.",
          "Counts stay secondary and optional so the control can work both with and without numeric context.",
        ],
        [
          "Use filter chip for short local collection choices, quick state toggles, and scoped refinement rows.",
          "Use secondary tabs when the surface is changing peer content views; use filter chips when the same collection stays in place and only its scope changes.",
          "Keep labels short and comparable so a row of chips remains easy to scan.",
          "Let product code own the actual filter state and pass only active state into the primitive.",
        ],
        [
          "Expose clear button semantics and keep the visible label meaningful without relying on count alone.",
          "Pressed state should remain evident in both color and shape so the active filter is understandable without subtle hover memory.",
          "Do not overload one chip row with too many items or long labels that collapse scanning and keyboard flow.",
        ],
      )}

      {renderUsageReviewCard(
        "Filter chip is appropriate for small, local filter sets where each option behaves like a pressed-state control rather than a page-level navigation item.",
        [
          "A surface needs quick local filter toggles with a small number of comparable choices.",
          "The user benefits from seeing the current filter state inline instead of opening a larger rail or drawer.",
        ],
        [
          "Keep filter-chip usage bounded to local collection controls or compact state switching.",
          "Show nearby result context so users can tell the row is filtering the current collection, not navigating to a different view.",
          "Pair counts with chips only when they materially help prioritization.",
          "Prefer filter chips over custom status-button rows when the interaction is still fundamentally local filtering.",
        ],
        [
          "Do not use filter chips as top-level route navigation.",
          "Do not turn them into removable tag tokens or multi-line badges.",
          "Do not push complex query, grouping, or persistence behavior into the primitive API.",
        ],
      )}
    </div>
  );
}

export function renderSeparatorDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Orientation</CardTitle>
          <CardDescription>Separator should stay quiet and structural, with the same visual weight across horizontal and vertical usage.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Horizontal" stacked>
            <div className="ui-lab-page__separator-preview">
              <p className="ui-lab-page__muted">Tenant readiness metrics and supporting notes can share one surface without collapsing into a single paragraph.</p>
              <Separator />
              <p className="ui-lab-page__muted">Use the divider when separation helps reading rhythm, not as a decorative line between every small fragment.</p>
            </div>
          </ShowcaseRow>

          <ShowcaseRow label="Vertical">
            <div className="ui-lab-page__separator-inline">
              <Badge appearance="soft" variant="brand">
                Workspace
              </Badge>
              <Separator orientation="vertical" />
              <Badge appearance="soft" variant="success">
                Healthy
              </Badge>
              <Separator orientation="vertical" />
              <Badge appearance="soft" variant="warning">
                Review
              </Badge>
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Composition</CardTitle>
          <CardDescription>Separator should support calm grouping inside cards and dense detail blocks without becoming a layout system.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Panel" stacked>
            <Card>
              <CardHeader>
                <CardTitle>Release summary</CardTitle>
                <CardDescription>One divider can help break metadata from next-step guidance in dense but still reusable content.</CardDescription>
              </CardHeader>
              <CardContent className="ui-lab-page__stack">
                <div className="ui-lab-page__inline-wrap">
                  <Badge appearance="soft" variant="neutral">Region set</Badge>
                  <Badge appearance="soft" variant="brand">Queue ready</Badge>
                </div>
                <Separator />
                <p className="ui-lab-page__muted">
                  Avoid overusing separators. They work best when they clarify group boundaries that spacing alone does not make obvious.
                </p>
              </CardContent>
            </Card>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the low-risk structural divider used across cards, menus, toolbars, and dense content stacks.", [
        { name: "orientation", type: "\"horizontal\" | \"vertical\"", notes: "Changes the axis of the divider without changing its visual role or weight." },
        { name: "decorative", type: "boolean", notes: "Keeps purely visual separators out of the accessibility tree by default." },
        { name: "className / native div props", type: "HTMLAttributes<HTMLDivElement>", notes: "Allow small layout adjustments without turning separator into a styled content block." },
      ])}

      {renderReferenceNotesCard(
        "Separator should stay one of the lightest structural primitives in the shared kit so grouping remains possible without page-specific layout utilities.",
        [
          "The stable anatomy is only a visual divider with horizontal or vertical orientation.",
          "Separator should complement spacing, not replace it as the primary layout tool.",
          "The primitive remains content-agnostic and should not carry labels, titles, or workflow meaning.",
        ],
        [
          "Use divider lines when group boundaries need a slightly stronger cue than spacing alone provides.",
          "Prefer a single separator between meaningful groups instead of repeated lines between every element.",
          "Keep the same neutral visual weight across cards, lists, and navigation-adjacent surfaces.",
        ],
        [
          "Decorative separators should stay hidden from assistive technology.",
          "Non-decorative separators should be rare and only used when the structural meaning is genuinely useful.",
          "Do not rely on separator lines alone to communicate hierarchy if headings or spacing are required.",
        ],
      )}

      {renderUsageReviewCard(
        "Separator works best as a quiet grouping aid between meaningful clusters of content, controls, or metadata.",
        [
          "A dense card, stack, or toolbar needs a subtle divider between distinct groups.",
          "Vertical separation helps distinguish adjacent inline metadata without inventing a new wrapper component.",
        ],
        [
          "Use separators sparingly and keep their visual weight calm.",
          "Choose the orientation that matches the surrounding layout rhythm.",
          "Let spacing remain the first tool and separator the second tool.",
        ],
        [
          "Do not draw lines between every list item or chip just because the primitive exists.",
          "Do not add labels or custom semantics to the primitive itself.",
          "Do not use separator as a workaround for weak content grouping or missing headings.",
        ],
      )}
    </div>
  );
}


export function renderTableStatesDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Loading</CardTitle>
          <CardDescription>Table loading should preserve toolbar and row expectations, not collapse into a generic spinner.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default" stacked>
            <TableLoadingState columns={4} rows={4} />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empty</CardTitle>
          <CardDescription>When no rows match, the table contract still needs structured guidance and current filter context.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="No rows" stacked>
            <CollectionEmptyState
              description="Try broadening the active filters or clearing the date range to surface matching rows."
              highlights={[
                { id: "status", label: "Status", tone: "warning", value: "2 active filters" },
                { id: "range", label: "Range", tone: "brand", value: "Last 30 days" },
              ]}
              title="No table rows match"
            />
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderUsageReviewCard(
        "Table states should preserve the table contract during loading or empty conditions so users do not lose structure and filter context.",
        [
          "A table surface needs loading and empty handling without collapsing into unrelated generic placeholders.",
          "The user still benefits from seeing row rhythm, current filters, or collection framing while no rows are available.",
        ],
        [
          "Use row-shaped skeletons for loading so density and column expectations remain intact.",
          "Keep current filter or range context visible in empty states when it affects the result.",
          "Treat table states as part of the table contract, not as a separate one-off screen.",
        ],
        [
          "Do not replace structured table loading with a lone spinner that removes layout context.",
          "Do not drop active filter hints when they explain why no rows are visible.",
          "Do not introduce a different empty pattern per table unless the workflow truly differs.",
        ],
      )}
    </div>
  );
}

export function renderEmptyStatesDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Base and collection</CardTitle>
          <CardDescription>Base and collection variants now cover the stable reusable no-data scenarios when surfaces need different amounts of context.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Base" stacked>
            <EmptyState
              description="Use the base empty state when the screen only needs a title, a short explanation, and one clear action."
              title="Base empty state"
            />
          </ShowcaseRow>
          <ShowcaseRow label="Collection" stacked>
            <CollectionEmptyState
              description="Collection empty states work better when filters or scope still need to stay visible."
              highlights={[
                { id: "scope", label: "Scope", tone: "brand", value: "Workspace" },
                { id: "filters", label: "Filters", tone: "warning", value: "3 active" },
              ]}
              title="Collection empty state"
            />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search and guided</CardTitle>
          <CardDescription>More specific empty states belong in the shared layer only when their structure remains generic.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Search" stacked>
            <SearchEmptyState
              query="tenant rollout"
              suggestions={["tenants", "signals", "billing", "sync status"]}
              title="No search results"
            />
          </ShowcaseRow>
          <ShowcaseRow label="Guided" stacked>
            <GuidedEmptyState
              description="Guided empty states are useful when the next step requires more than one instruction."
              steps={[
                { id: "connect", title: "Connect the source", description: "Attach the data source or provider first." },
                { id: "map", title: "Review the mapping", description: "Confirm which records should appear." },
                { id: "launch", title: "Run the first sync", description: "Trigger the first job to populate the view." },
              ]}
              title="Guided empty state"
            />
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the reusable empty-state family, including the approved collection variant for short contextual highlights.", [
        { name: "EmptyState.title / description", type: "ReactNode", notes: "Base empty state keeps the core message short and structurally neutral." },
        { name: "EmptyState.actions", type: "ReactNode", notes: "Optional next step stays small and reusable instead of becoming a page-specific CTA rail." },
        { name: "SearchEmptyState.query / suggestions", type: "string / string[]", notes: "Adds search context and lightweight recovery hints without changing the base empty-state grammar." },
        { name: "GuidedEmptyState.steps", type: "Array<{ id, title, description }>", notes: "Supports repeatable setup guidance when one short sentence is not enough." },
        { name: "CollectionEmptyState.highlights", type: "Array<{ id, label, value, tone }>", notes: "Adds short collection context when filters, scope, or current status still matter to understanding the empty result." },
      ])}

      {renderReferenceNotesCard(
        "The empty-state family is now approved across base, search, guided, and collection variants when the collection highlight strip stays short and contextual.",
        [
          "The stable empty-state family centers on title, description, optional actions, and optional recovery-specific context.",
          "Search and guided variants extend the same absence contract rather than inventing a different visual language.",
          "CollectionEmptyState extends the same family with compact highlight items for scope, filters, or other collection context that still matters at empty time.",
        ],
        [
          "Use the base empty state first, then add search or guided structure only when the absence really needs more context.",
          "Keep actions and suggestions generic enough to repeat across many surfaces.",
          "Keep highlight items short, comparable, and few in number so the collection variant stays explanatory rather than turning into a mini dashboard.",
        ],
        [
          "Titles should explain absence directly and remain understandable without decorative treatment.",
          "Do not rely on highlight color or suggestion chips alone to explain why the surface is empty.",
          "Guided steps should stay short and sequential so the recovery path remains readable for assistive technology.",
        ],
      )}

      {renderUsageReviewCard(
        "Empty states should explain absence clearly and preserve the right amount of next-step guidance without turning into a custom product screen.",
        [
          "A reusable surface has no data yet or no results match the current scope.",
          "Users need concise explanation and, when helpful, one clear next step.",
        ],
        [
          "Match the empty pattern to the amount of context the user still needs, from base to collection to guided.",
          "Keep titles direct and use supplemental highlights only when they genuinely clarify the absence.",
          "Use guided empty states sparingly for repeatable multi-step onboarding or setup paths.",
        ],
        [
          "Do not write empty states like marketing hero sections.",
          "Do not hide active filter context when it explains why the surface is empty.",
          "Do not create a unique empty-state structure for every page if a shared pattern already fits.",
        ],
      )}
    </div>
  );
}


export function TablePaginationBarPreview() {
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(4);
  const totalItems = 184;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <TablePaginationBar
      currentPage={Math.min(currentPage, totalPages)}
      editableCurrentPage
      onPageChange={setCurrentPage}
      onPageSizeChange={(nextPageSize) => {
        setPageSize(nextPageSize);
        setCurrentPage(1);
      }}
      pageSize={pageSize}
      totalItems={totalItems}
      totalPages={totalPages}
    />
  );
}

function TablePaginationBarTablePreview() {
  const [pageSize, setPageSize] = useState(3);
  const [currentPage, setCurrentPage] = useState(2);
  const totalItems = tablePaginationPreviewRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const visibleRows = tablePaginationPreviewRows.slice(startIndex, startIndex + pageSize);

  return (
    <div className="ui-lab-page__table-card ui-lab-page__stack">
      <Table density="compact">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Tenant</TableHeaderCell>
            <TableHeaderCell>Plan</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleRows.map((row) => (
            <TableRow key={`pagination-bar-${row.id}`}>
              <TableCell>
                <TableMetaCell description={row.note} title={row.id} />
              </TableCell>
              <TableCell>{row.plan}</TableCell>
              <TableCell>
                <Badge appearance="soft" variant={getStatusTone(row.status)}>
                  {row.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePaginationBar
        currentPage={safeCurrentPage}
        editableCurrentPage
        onPageChange={setCurrentPage}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setCurrentPage(1);
        }}
        pageSize={pageSize}
        pageSizeOptions={[3, 5, 10]}
        totalItems={totalItems}
        totalPages={totalPages}
      />
    </div>
  );
}

export function TableColumnVisibilityPreview() {
  const [columns, setColumns] = useState<TableColumnVisibilityItem[]>(tableColumnVisibilityPreviewColumns);

  const visibleCount = columns.filter((column) => column.checked).length;

  return (
    <div className="ui-lab-page__stack">
      <div className="ui-lab-page__inline-wrap">
        <TableColumnVisibility
          columns={columns}
          label="Toggle columns"
          onColumnChange={(id, checked) => {
            setColumns((current) =>
              current.map((column) => (column.id === id ? { ...column, checked } : column)),
            );
          }}
        />
        <Badge appearance="soft" variant="brand">
          Visible columns: {visibleCount}
        </Badge>
      </div>
      <div className="ui-lab-page__inline-wrap">
        {columns.map((column) => (
          <Badge
            appearance={column.checked ? "soft" : "outline"}
            key={column.id}
            variant={column.checked ? "success" : "neutral"}
          >
            {column.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
