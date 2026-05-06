import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertBody,
  AlertDescription,
  AlertTitle,
  Badge,
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Link,
  Pagination,
  PageToolbar,
  SecondaryTab,
  SecondaryTabs,
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
  TreeView,
  type TreeViewNode,
} from "@platform/ui-kit";

import { ChevronIcon } from "../components/icons";
import {
  ShowcaseRow,
  renderDoNotUseForCard,
  renderPropsApiCard,
  renderReferenceNotesCard,
  renderUsageReviewCard,
} from "../components/docs-cards";

function TabsScrollableExample() {
  return (
    <Tabs defaultValue="usage" size="sm" variant="surface">
      <TabsList scrollable>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="usage">Usage</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="alerts">Alerts</TabsTrigger>
        <TabsTrigger value="owners">Owners</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
      </TabsList>
      <TabsPanel value="overview">Overview stays available as the first peer section in the rail.</TabsPanel>
      <TabsPanel value="usage">Scrollable tabs help long peer-view rails stay usable on mobile without collapsing the labels.</TabsPanel>
      <TabsPanel value="activity">Activity should remain a peer view instead of turning into a second nested navigation system.</TabsPanel>
      <TabsPanel value="alerts">Alerts can stay in the same rail when the page still represents one bounded context.</TabsPanel>
      <TabsPanel value="owners">Owners remains a peer tab when identity and access are still part of the same feature area.</TabsPanel>
      <TabsPanel value="billing">Billing belongs here only when it is one peer view of the same record surface.</TabsPanel>
      <TabsPanel value="security">Security can stay in the same rail if the feature shell and surrounding context remain stable.</TabsPanel>
      <TabsPanel value="integrations">Integrations should still read as one in-place view, not as route-level application navigation.</TabsPanel>
    </Tabs>
  );
}

function PaginationSizeExamples() {
  const [smallPage, setSmallPage] = useState(1);
  const [mediumPage, setMediumPage] = useState(3);
  const [largePage, setLargePage] = useState(12);

  return (
    <>
      <ShowcaseRow label="Small / 2 pages" stacked>
        <Pagination currentPage={smallPage} onPageChange={setSmallPage} size="sm" totalPages={2} />
      </ShowcaseRow>
      <ShowcaseRow label="Medium / 5 pages" stacked>
        <Pagination currentPage={mediumPage} onPageChange={setMediumPage} size="md" totalPages={5} />
      </ShowcaseRow>
      <ShowcaseRow label="Large / 12 pages" stacked>
        <Pagination currentPage={largePage} onPageChange={setLargePage} size="lg" totalPages={12} />
      </ShowcaseRow>
    </>
  );
}

const projectOrganizationTreeItems: TreeViewNode[] = [
  {
    children: [
      {
        children: [
          {
            children: [
              { id: "ea-1", label: "EA-1 (Hudson River Ground Stabilization)" },
              { id: "p4", label: "P4 (Tonnelle Ave Portal)" },
              {
                children: [
                  { id: "gdc", label: "_GDC_" },
                  { id: "cm-panynj", label: "CM @ PANYNJ" },
                  {
                    children: [
                      { id: "role-environmental-manager", label: "Environmental Manager @ Anton Gallas" },
                      { id: "role-field-safety-chelsea", label: "Field Safety Manager @ Chelsea Rinehart" },
                      { id: "role-field-safety-gary", label: "Field Safety Manager @ Gary Baker" },
                      { id: "role-general-superintendent", label: "General Superintendent @ Bob Hamill" },
                      { id: "role-safety-director", label: "Safety Director @ Rachel Enis" },
                    ],
                    defaultExpanded: true,
                    id: "gc-sld",
                    label: "GC @ SLD",
                  },
                  { id: "sub-linde-griffith", label: "Sub @ Linde-Griffith" },
                ],
                defaultExpanded: true,
                id: "p1a",
                label: "P1A (Palisades Tunnel)",
              },
              { id: "p1b", label: "P1B (Manhattan Tunnel)" },
              { id: "p1c", label: "P1C" },
              { id: "p3", label: "P3" },
            ],
            defaultExpanded: true,
            id: "projects",
            label: "_PROJECTS_",
          },
        ],
        defaultExpanded: true,
        id: "general-company",
        label: "General Company @ GDC",
      },
    ],
    defaultExpanded: true,
    id: "root",
    label: "Root",
  },
];

const compactStructureTreeItems: TreeViewNode[] = [
  {
    children: [
      { id: "forms-active", label: "Active forms", meta: "18" },
      { id: "forms-drafts", label: "Drafts", meta: "7" },
      { id: "forms-archive", label: "Archive" },
    ],
    defaultExpanded: true,
    id: "forms",
    label: "Forms",
    meta: "25",
  },
  {
    children: [
      { id: "nav-main", label: "Main navigation" },
      { id: "nav-footer", label: "Footer links" },
    ],
    defaultExpanded: true,
    id: "navigation",
    label: "Navigation",
  },
  {
    children: [
      { id: "reports-daily", label: "Daily report" },
      { id: "reports-monthly", label: "Monthly report", disabled: true, secondaryLabel: "Waiting for template" },
    ],
    id: "reports",
    label: "Reports",
  },
];

function TreeViewControlledExample() {
  const [expandedItemIds, setExpandedItemIds] = useState(["forms", "navigation"]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>("forms-active");

  return (
    <div className="ui-lab-page__tree-controlled-preview">
      <TreeView
        ariaLabel="Controlled Platform Studio structure"
        density="compact"
        expandedItemIds={expandedItemIds}
        items={compactStructureTreeItems}
        onExpandedItemIdsChange={setExpandedItemIds}
        onSelectedItemChange={setSelectedItemId}
        selectedItemId={selectedItemId}
      />
      <div className="ui-lab-page__note-card">
        <span className="ui-lab-page__note-label">Controlled state</span>
        <p className="ui-lab-page__muted">
          Selected: {selectedItemId ?? "none"}. Expanded: {expandedItemIds.length ? expandedItemIds.join(", ") : "none"}.
        </p>
      </div>
    </div>
  );
}

function TreeViewReadOnlyExample() {
  return (
    <div className="ui-lab-page__tree-preview">
      <TreeView
        ariaLabel="Read-only project organization tree"
        items={projectOrganizationTreeItems}
        readOnly
      />
    </div>
  );
}

function TabsControlledExample() {
  const [activeTab, setActiveTab] = useState("alerts");

  return (
    <Tabs defaultValue="alerts" onValueChange={setActiveTab} value={activeTab} variant="line">
      <TabsList scrollable>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="alerts">Alerts</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsPanel value="overview">Overview becomes active when the page or feature decides it should be the initial peer view.</TabsPanel>
      <TabsPanel value="alerts">This example opens on Alerts first, which matches route- or state-driven page entry.</TabsPanel>
      <TabsPanel value="history">History stays controlled by the parent state instead of relying only on local uncontrolled behavior.</TabsPanel>
    </Tabs>
  );
}

export function renderTreeViewDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Tree View</CardTitle>
          <CardDescription>
            Generic hierarchy display for product-owned structures that need nested branch expansion without shell routing policy.
          </CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Folder hierarchy" stacked>
            <div className="ui-lab-page__tree-preview">
              <TreeView
                ariaLabel="Project organization tree"
                defaultSelectedItemId="role-safety-director"
                items={projectOrganizationTreeItems}
              />
            </div>
          </ShowcaseRow>
          <ShowcaseRow label="Controlled compact state" stacked>
            <TreeViewControlledExample />
          </ShowcaseRow>
          <ShowcaseRow label="Read-only snapshot" stacked>
            <TreeViewReadOnlyExample />
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared hierarchy primitive used for expandable structure views.", [
        { name: "items", type: "TreeViewNode[]", notes: "Nested item data with `id`, `label`, optional `children`, `expandable`, loading/error state, `icon`, `meta`, disabled state, and default expansion." },
        { name: "expandedItemIds / defaultExpandedItemIds", type: "string[]", notes: "Controls or seeds branch expansion. Items can also set `defaultExpanded` for local demos." },
        { name: "selectedItemId / defaultSelectedItemId", type: "string | null", notes: "Controls or seeds the selected row without requiring product routing." },
        { name: "loadingLabel", type: "ReactNode", notes: "Overrides the branch loading status copy for host-local terminology or localization." },
        { name: "onExpandedItemIdsChange", type: "(ids) => void", notes: "Lets a host persist expansion state when the surrounding surface owns it." },
        { name: "onItemExpand", type: "(id, item) => void", notes: "Notifies the host when a branch opens so lazy trees can load children without placeholder rows." },
        { name: "onSelectedItemChange", type: "(id, item) => void", notes: "Reports selected item identity and node data for host-owned follow-up behavior." },
        { name: "readOnly", type: "boolean", notes: "Allows branch expansion while suppressing leaf activation, selection callbacks, and selected-row active effect." },
        { name: "density", type: "\"comfortable\" | \"compact\"", notes: "Adjusts row height while preserving the same interaction contract." },
        { name: "showGuides / showIcons", type: "boolean", notes: "Keeps connector lines and branch/leaf affordances configurable for dense structures." },
      ])}

      {renderReferenceNotesCard(
        "Tree View is intentionally lower-level than SidebarNav: it renders generic structures, not app navigation chrome.",
        [
          "Root `role=tree` with visible tree items flattened from nested data.",
          "Branch rows expose plus/minus controls, folder affordance, and `aria-expanded`.",
          "Leaf rows use document affordance by default and may carry secondary copy or compact metadata.",
        ],
        [
          "`TreeViewNode` keeps the public data contract small and serializable around stable ids.",
          "Controlled expansion and selection are available without requiring app route state.",
          "`readOnly` keeps branch expansion available while removing leaf activation and selected styling.",
          "Custom icons remain node-local, so the shared component does not learn product domains.",
        ],
        [
          "Arrow Up/Down moves between visible rows.",
          "Arrow Right expands a closed branch or moves into its first visible child.",
          "Arrow Left collapses an open branch or moves focus to its parent.",
          "Enter and Space select the row and toggle branch expansion.",
        ],
      )}

      {renderUsageReviewCard(
        "Use Tree View for hierarchy browsing where the structure itself is the content.",
        [
          "Organization, project, folder, builder, report, or permission structures where nested relationships matter.",
          "Dense admin or tenant tools that need inline expansion without becoming a full sidebar shell.",
          "Review surfaces where branch/leaf affordances are clearer than accordion sections.",
        ],
        [
          "Keep item ids stable so selection and expansion can be restored by the host.",
          "Use concise labels and secondary labels for detail; keep product actions outside the row until a dedicated pattern exists.",
          "Prefer default folder/document affordances unless the source structure has a more meaningful icon.",
        ],
        [
          "Do not use Tree View as app shell navigation with search, tenant switching, route guards, or sidebar chrome.",
          "Do not encode backend endpoints, permissions policy, or workflow mutations inside the item contract.",
          "Do not copy donor tree libraries or Metronic item APIs into the shared package.",
        ],
      )}

      {renderDoNotUseForCard(
        "The primitive is reusable hierarchy display, not a product shell or workflow engine.",
        [
          "Route-specific sidebar navigation belongs in app shell or `SidebarNav` until a separate contract changes.",
          "Drag-and-drop, remote lazy loading, bulk actions, and mutation flows need separate approval before entering `ui-kit`.",
          "Tenant-aware visibility, auth checks, and backend persistence must stay outside the shared component.",
        ],
      )}
    </div>
  );
}

function SecondaryTabsDefaultExample() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="ui-lab-page__stack">
      <SecondaryTabs>
        <SecondaryTab
          active={activeTab === "overview"}
          badge="12"
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </SecondaryTab>
        <SecondaryTab
          active={activeTab === "signals"}
          badge="4"
          onClick={() => setActiveTab("signals")}
        >
          Signals
        </SecondaryTab>
        <SecondaryTab
          active={activeTab === "rollouts"}
          onClick={() => setActiveTab("rollouts")}
        >
          Rollouts
        </SecondaryTab>
      </SecondaryTabs>
      <div className="ui-lab-page__note-card">
        <span className="ui-lab-page__note-label">{activeTab}</span>
        <p className="ui-lab-page__muted">
          {activeTab === "overview"
            ? "Overview keeps the default subsection summary visible without competing with the main page context."
            : activeTab === "signals"
              ? "Signals can surface secondary review data, counts, and operator-oriented detail inside the same bounded feature area."
              : "Rollouts works as a peer subsection when progress and execution detail still belong to the same feature shell."}
        </p>
      </div>
    </div>
  );
}

function SecondaryTabsDensityExample() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="ui-lab-page__stack">
      <SecondaryTabs>
        <SecondaryTab active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
          Overview
        </SecondaryTab>
        <SecondaryTab active={activeTab === "activity"} onClick={() => setActiveTab("activity")}>
          Activity
        </SecondaryTab>
        <SecondaryTab active={activeTab === "settings"} onClick={() => setActiveTab("settings")}>
          Settings
        </SecondaryTab>
      </SecondaryTabs>
      <div className="ui-lab-page__note-card">
        <span className="ui-lab-page__note-label">{activeTab}</span>
        <p className="ui-lab-page__muted">
          {activeTab === "overview"
            ? "Dense secondary tabs still need a calm supporting content area so switching feels intentional."
            : activeTab === "activity"
              ? "Activity stays a lightweight peer subsection instead of becoming a second route or a heavy timeline shell."
              : "Settings belongs here only while it remains clearly subordinate to the stronger page or feature context."}
        </p>
      </div>
    </div>
  );
}

function PageToolbarDefaultExample() {
  const [lastAction, setLastAction] = useState("none");

  return (
    <div className="ui-lab-page__stack">
      <PageToolbar
        actions={(
          <>
            <Button
              onClick={() => setLastAction("export")}
              size="sm"
              variant="outline"
            >
              Export
            </Button>
            <Button
              onClick={() => setLastAction("create")}
              size="sm"
            >
              Create tenant
            </Button>
          </>
        )}
        description="Review tenant rollout posture, recent issues, and action readiness before opening the denser workbench."
        eyebrow="Control Plane"
        title="Tenants"
      />
      <div className="ui-lab-page__note-card">
        <span className="ui-lab-page__note-label">Route-level role</span>
        <p className="ui-lab-page__muted">
          {lastAction === "export"
            ? "Export is a page-level action: it applies to the current Tenants route, not to one inner card."
            : lastAction === "create"
              ? "Create tenant is a page-level action: it belongs beside the page heading before the denser workbench below."
              : "Page toolbar is the calm top route block: title, short context, and a small set of page-level actions before the heavier content starts."}
        </p>
      </div>
    </div>
  );
}

function PageToolbarCopyFirstExample() {
  const [detailMode, setDetailMode] = useState(false);

  return (
    <div className="ui-lab-page__stack">
      <PageToolbar
        actions={(
          <Button
            onClick={() => setDetailMode((current) => !current)}
            size="sm"
            variant="secondary"
          >
            {detailMode ? "Hide workbench hint" : "Open workbench"}
          </Button>
        )}
        description="Keep the route introduction calm and readable instead of turning the page header into a dashboard hero surface."
        title="Audit Review"
      />
      <div className="ui-lab-page__note-card">
        <span className="ui-lab-page__note-label">What this pattern is</span>
        <p className="ui-lab-page__muted">
          {detailMode
            ? "The toolbar does not become the workbench itself. It only anchors the route and exposes one nearby route action."
            : "This variant is copy-first: the page needs orientation first, and only one quiet route action on the right."}
        </p>
      </div>
    </div>
  );
}

export function renderAccordionDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Single disclosure</CardTitle>
          <CardDescription>Accordion should support calm single-open disclosure before any sidebar-tree API is considered.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default" stacked>
            <Accordion defaultValue="tenant-review">
              <AccordionItem value="tenant-review">
                <AccordionTrigger>Tenant review checklist</AccordionTrigger>
                <AccordionContent>
                  <div className="ui-lab-page__accordion-copy">
                    Confirm region mapping, owner assignment, and rollout notes before activation proceeds.
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="signals">
                <AccordionTrigger>Signals and thresholds</AccordionTrigger>
                <AccordionContent>
                  <div className="ui-lab-page__accordion-copy">
                    Use grouped disclosure when operators need more detail without leaving the current surface.
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variants and multiple mode</CardTitle>
          <CardDescription>Outline and muted variants can change grouping weight without turning the primitive into a full nav system.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Outline" stacked>
            <Accordion defaultValue={["owners", "billing"]} type="multiple" variant="outline">
              <AccordionItem value="owners">
                <AccordionTrigger>Owner channels</AccordionTrigger>
                <AccordionContent>
                  <div className="ui-lab-page__accordion-copy">Slack, email, and escalation paths can stay grouped but independently open.</div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="billing">
                <AccordionTrigger>Billing exposure</AccordionTrigger>
                <AccordionContent>
                  <div className="ui-lab-page__accordion-copy">Outline variant works well where each section should read like its own bounded block.</div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared grouped disclosure primitive used for stacked reveal patterns.", [
        { name: "type", type: "\"single\" | \"multiple\"", notes: "Controls whether one or many items may remain open at a time." },
        { name: "value / defaultValue", type: "string | string[] | null", notes: "Controlled or uncontrolled item state depending on the disclosure mode." },
        { name: "variant", type: "\"default\" | \"outline\" | \"muted\"", notes: "Changes grouping weight without changing the disclosure model." },
        { name: "indicator", type: "\"chevron\" | \"plus\" | \"none\"", notes: "Controls the shared indicator style at the trigger edge." },
        { name: "AccordionItem / Trigger / Content", type: "composition", notes: "Keep grouped disclosure explicit and compositional instead of screen-wrapped." },
      ])}

      {renderReferenceNotesCard(
        "Accordion should stay a grouped disclosure primitive for stacked reveal patterns, not a substitute for app navigation trees.",
        [
          "The stable anatomy is root, items, triggers, and revealed content with one explicit item value per section.",
          "Single and multiple modes change open-state behavior without creating two different primitives.",
          "Indicator style and surface variant remain secondary to the grouped disclosure behavior itself.",
        ],
        [
          "Use accordion when adjacent sections need reveal-in-place behavior with stronger grouping than plain collapsible blocks.",
          "Keep item titles short and the revealed content focused on one bounded cluster of details.",
          "Use the shared primitive for settings, FAQs, review stacks, and other grouped disclosure cases before inventing custom wrappers.",
        ],
        [
          "Triggers need readable text and clear expanded state for assistive technology.",
          "Do not hide large nested navigation systems inside accordion without a separately approved nav-tree contract.",
          "Do not rely only on icon rotation to communicate open or closed state.",
        ],
      )}

      {renderUsageReviewCard(
        "Accordion fits grouped sections that reveal detail in place while preserving one stacked reading flow.",
        [
          "A surface has multiple related sections and users benefit from expanding them within the same scroll context.",
          "Each section contains more detail than should stay visible by default, but the hierarchy remains shallow and readable.",
        ],
        [
          "Use short, parallel trigger labels and bounded content blocks.",
          "Choose single or multiple mode based on whether comparison across sections matters.",
          "Keep accordion generic; route-specific or tree-shaped navigation still belongs outside the primitive.",
        ],
        [
          "Do not treat accordion as a permanent app sidebar or multi-level navigation system.",
          "Do not bury long forms or dense branchy workflows inside accordion content.",
          "Do not stack too many nested accordions before the layout becomes harder to scan than a normal page flow.",
        ],
      )}
    </div>
  );
}

export function renderLinkDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Default and subtle</CardTitle>
          <CardDescription>Link should stay compact, readable, and clearly lighter than a button while still feeling interactive.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default" stacked>
            <div className="ui-lab-page__inline-wrap">
              <Link href="/root/ui-lab">Open workspace overview</Link>
              <Link href="/root/ui-lab" underline="always">
                Review rollout checklist
              </Link>
            </div>
          </ShowcaseRow>
          <ShowcaseRow label="Subtle" stacked>
            <div className="ui-lab-page__inline-wrap">
              <Link href="/root/ui-lab" tone="subtle">
                View archived signal
              </Link>
              <Link href="/root/ui-lab" tone="subtle" underline="none">
                Copy reference path
              </Link>
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inline and external usage</CardTitle>
          <CardDescription>Shared link should cover normal inline body usage and explicit external destinations without turning into a full router abstraction.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Inline copy" stacked>
            <p className="ui-lab-page__muted">
              Review the <Link href="/root/ui-lab">tenant readiness policy</Link> before enabling rollout for the next cohort.
            </p>
          </ShowcaseRow>
          <ShowcaseRow label="External" stacked>
            <div className="ui-lab-page__inline-wrap">
              <Link external href="https://example.com/docs/ui-tokens">
                Open token reference
              </Link>
              <Link external href="https://example.com/guides/operator-checklist" tone="subtle">
                External operator guide
              </Link>
            </div>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the lightweight shared anchor primitive used for inline navigation and external references.", [
        { name: "tone", type: "\"default\" | \"subtle\"", notes: "Controls whether the link reads as primary inline action text or quieter supporting reference text." },
        { name: "underline", type: "\"hover\" | \"always\" | \"none\"", notes: "Keeps underline policy explicit without turning the primitive into a typography system." },
        { name: "external", type: "boolean", notes: "Adds the shared external-link indicator and safe target/rel defaults for outside destinations." },
        { name: "children", type: "ReactNode", notes: "Visible anchor label that should remain concise and scannable in body copy or compact lists." },
        { name: "native anchor props", type: "AnchorHTMLAttributes<HTMLAnchorElement>", notes: "Preserves standard href, target, rel, and accessibility semantics without router coupling." },
      ])}

      {renderReferenceNotesCard(
        "Link should stay a small anchor primitive for inline navigation and references, not a replacement for buttons or route adapters.",
        [
          "The stable anatomy is a single anchor label plus an optional external-destination icon.",
          "Tone and underline policy adjust emphasis, but they do not turn link into a larger action surface.",
          "Router-specific wrappers should sit above this primitive rather than expanding the base API here.",
        ],
        [
          "Use link for inline navigation, reference text, compact lists, and external destinations that remain fundamentally anchor-like.",
          "Keep labels concise enough that the link can be scanned naturally inside surrounding copy.",
          "Use the shared external state instead of inventing ad hoc arrow icons or inconsistent target behavior.",
        ],
        [
          "Links need descriptive text that still makes sense out of surrounding visual context.",
          "Do not rely only on color if underline policy is removed; focus and hover states should remain evident.",
          "External destinations should expose clear target behavior and preserve standard anchor semantics.",
        ],
      )}

      {renderUsageReviewCard(
        "Link fits inline navigation and references where the interaction should read as text-level navigation rather than a discrete button action.",
        [
          "The user is moving to another page, section, or document through a small text-level affordance.",
          "The surface needs a calmer reference action that should not carry button weight.",
        ],
        [
          "Prefer link when the primary semantic is navigation or reference rather than confirmation or mutation.",
          "Use subtle tone for lower-emphasis references instead of inventing muted one-off anchor styles.",
          "Keep external destinations explicit and consistent through the shared external state.",
        ],
        [
          "Do not use link for primary actions that should read as buttons.",
          "Do not overload text links with badge-like density or hidden workflow meaning.",
          "Do not bake routing-library behavior into the primitive before a shared adapter is actually needed.",
        ],
      )}
    </div>
  );
}

export function renderPageToolbarDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Default page header</CardTitle>
          <CardDescription>Page toolbar is the calm route-level header: page title, short orientation copy, and a very small action cluster before denser content begins.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default" stacked>
            <PageToolbarDefaultExample />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Copy-first variant</CardTitle>
          <CardDescription>The same contract should still work when orientation copy matters more than actions and the route needs only one quiet control.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="With one action" stacked>
            <PageToolbarCopyFirstExample />
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the stable route-level heading pattern used before denser page content begins.", [
        { name: "title", type: "string", notes: "Required page-level heading that anchors the route or feature context." },
        { name: "description", type: "string", notes: "Optional supporting copy for short route context, not long-form onboarding or marketing text." },
        { name: "eyebrow", type: "string", notes: "Optional small technical label for route grouping when it adds clarity without competing with the title." },
        { name: "actions", type: "ReactNode", notes: "Optional restrained action area for one or a few page-level actions that belong to the current route." },
        { name: "div props", type: "HTMLAttributes<HTMLDivElement>", notes: "Keeps layout integration lightweight without binding routing or data-loading logic to the pattern." },
      ])}

      {renderReferenceNotesCard(
        "Page toolbar now qualifies as a stable shared pattern because reuse is real, the API remains small, and the contract stays route-level without becoming product-shell chrome.",
        [
          "The anatomy is route copy on the left and an optional action cluster on the right.",
          "Eyebrow stays optional and secondary so the title remains the clear heading anchor.",
          "Actions belong to the current route context and should remain smaller in weight than the page heading itself.",
        ],
        [
          "Use page toolbar for page-level heading and route-level actions only, not for sectional card headers deeper in the page.",
          "Keep description compact and operational rather than turning it into long onboarding copy.",
          "Leave routing, state, and workflow orchestration outside the pattern and feed them through `actions`.",
        ],
        [
          "The title should remain the primary heading for the page and stay meaningful in screen-reader reading order.",
          "Action labels should remain explicit and not rely on spatial placement alone to communicate their purpose.",
          "Avoid multiple competing heading levels at the top of the same route when page toolbar is already present.",
        ],
      )}

      {renderUsageReviewCard(
        "Page toolbar is appropriate for calm route-level context where the user needs one heading block and a small set of nearby page actions before entering denser content.",
        [
          "A route needs an explicit page heading, supporting context, and one or a few route-level actions.",
          "The page is dense enough that top-level structure matters, but not so marketing-heavy that it needs a hero section.",
        ],
        [
          "Keep the toolbar at the top of a route or feature view.",
          "Use it for route-level actions that naturally belong beside the page title.",
          "Keep the action set small so the toolbar remains an orientation surface, not a workflow container.",
        ],
        [
          "Do not use page toolbar inside every card or subsection.",
          "Do not turn it into a dashboard hero with KPI blocks, presets, and filters mixed into the same row.",
          "Do not push page-specific search, bulk actions, or dense table controls into the route toolbar when a local pattern already fits better.",
        ],
      )}
    </div>
  );
}

export function renderBreadcrumbDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Default</CardTitle>
          <CardDescription>Default breadcrumb should stay compact and readable with the current separator style.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Slash" stacked>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/root/ui-lab">UI Lab</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>/</BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/root/ui-lab">Navigation</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>/</BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Truncation</CardTitle>
          <CardDescription>Long navigation paths need a predictable truncation pattern, not a custom shell workaround.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Ellipsis" stacked>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/root/ui-lab">Workspace</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>/</BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbEllipsis />
                </BreadcrumbItem>
                <BreadcrumbSeparator>/</BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/root/ui-lab">Tenant Operations</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>/</BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>Sync Status</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the breadcrumb composition API used by shared hierarchical path context.", [
        { name: "BreadcrumbList", type: "composition", notes: "Ordered wrapper for the breadcrumb path items." },
        { name: "BreadcrumbItem", type: "composition", notes: "Atomic path segment container for a link, page marker, or ellipsis." },
        { name: "BreadcrumbLink / BreadcrumbPage", type: "composition", notes: "Use links for navigable ancestors and page marker for the current terminal item." },
        { name: "BreadcrumbSeparator", type: "composition", notes: "Shared separator slot so path grammar stays consistent across the product." },
        { name: "BreadcrumbEllipsis", type: "composition", notes: "Compact truncation marker for long hierarchical paths." },
      ])}

      {renderReferenceNotesCard(
        "Breadcrumb should document path anatomy and separator behavior as compact navigation context, not as a custom page header system.",
        [
          "The shared structure is breadcrumb container, ordered items, separators, and a terminal current-page item.",
          "Ellipsis exists to preserve the path contract when intermediate hierarchy becomes too long.",
          "Each item should remain lightweight so breadcrumb reads as context instead of navigation chrome.",
        ],
        [
          "Compose paths from links, page markers, separators, and ellipsis rather than inventing bespoke breadcrumb rows.",
          "Keep the separator strategy consistent across the application once chosen.",
          "Treat truncation as part of the shared pattern instead of pushing long-path handling into app shells.",
        ],
        [
          "The current page item should not behave like a normal navigable link.",
          "Breadcrumb should stay short enough that reading the full path is still practical for assistive users.",
          "Do not use breadcrumb as the only way to navigate into a section.",
        ],
      )}

      {renderUsageReviewCard(
        "Breadcrumb should remain a compact path indicator for nested location context, not a replacement for primary navigation.",
        [
          "The page sits inside a deeper hierarchy and users need to understand where they are.",
          "List-to-detail or workspace-to-subsection flows need lightweight path context near the page title.",
        ],
        [
          "Keep labels concise and use the current page as a non-link terminal item.",
          "Use truncation when the path grows long instead of inventing a custom layout.",
          "Treat breadcrumb as context, not as the main way users explore the product.",
        ],
        [
          "Do not duplicate top-level navigation that is already visible elsewhere on the page.",
          "Do not overload breadcrumb with actions, badges, or verbose labels.",
          "Do not force breadcrumb onto flat pages that have no meaningful hierarchy.",
        ],
      )}
    </div>
  );
}

export function renderTabsDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>Surface and line variants should both remain usable across section-driven flows.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Surface" stacked>
            <Tabs defaultValue="stable" variant="surface">
              <TabsList>
                <TabsTrigger value="stable">Stable</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
              </TabsList>
              <TabsPanel value="stable">Surface tabs work well when grouped inside cards and neutral panels.</TabsPanel>
              <TabsPanel value="review">Review can hold provisional material without pushing the user into a second navigation layer.</TabsPanel>
              <TabsPanel value="draft">Draft keeps in-progress content adjacent while the surrounding section structure stays unchanged.</TabsPanel>
            </Tabs>
          </ShowcaseRow>
          <ShowcaseRow label="Line" stacked>
            <Tabs defaultValue="events" variant="line">
              <TabsList>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="changes">Changes</TabsTrigger>
                <TabsTrigger value="actors">Actors</TabsTrigger>
              </TabsList>
              <TabsPanel value="events">Line tabs fit best where the page already provides its own surface.</TabsPanel>
              <TabsPanel value="changes">Changes should stay a peer view of the same record context instead of behaving like a route switch.</TabsPanel>
              <TabsPanel value="actors">Actor-focused panels work when identity detail stays parallel to activity and event views.</TabsPanel>
            </Tabs>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sizes and badges</CardTitle>
          <CardDescription>Tab scale and badge density should remain coherent with navigation rhythm.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="SM" stacked>
            <Tabs defaultValue="stable" size="sm">
              <TabsList>
                <TabsTrigger badge="3" value="stable">
                  Stable
                </TabsTrigger>
                <TabsTrigger badge="1" value="pending">
                  Pending
                </TabsTrigger>
              </TabsList>
              <TabsPanel value="stable">Small tabs support denser toolbars and detail contexts.</TabsPanel>
              <TabsPanel value="pending">Pending stays compact enough for dense contexts while still exposing a quiet review count.</TabsPanel>
            </Tabs>
          </ShowcaseRow>
          <ShowcaseRow label="LG" stacked>
            <Tabs defaultValue="overview" size="lg">
              <TabsList>
                <TabsTrigger badge="18" value="overview">
                  Overview
                </TabsTrigger>
                <TabsTrigger badge="4" value="alerts">
                  Alerts
                </TabsTrigger>
              </TabsList>
              <TabsPanel value="overview">Larger tabs fit section headers and primary contextual switching.</TabsPanel>
              <TabsPanel value="alerts">Alert-heavy panels should remain a peer section, not a second nested navigation system.</TabsPanel>
            </Tabs>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scrollable rail and initial tab</CardTitle>
          <CardDescription>Long tab rails should stay usable on mobile, and pages must be able to open on the right initial tab.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Scrollable tabs" stacked>
            <TabsScrollableExample />
          </ShowcaseRow>
          <ShowcaseRow label="Controlled initial tab" stacked>
            <TabsControlledExample />
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared tab-switching API used across bounded peer views.", [
        { name: "variant", type: "\"surface\" | \"line\"", notes: "Changes the visual weight of the tab rail while preserving the same switching model." },
        { name: "size", type: "\"sm\" | \"md\" | \"lg\"", notes: "Adjusts density for toolbars, cards, and larger section headers." },
        { name: "defaultValue / value", type: "string", notes: "Defines the active tab in uncontrolled or controlled mode." },
        { name: "TabsList.scrollable", type: "boolean", notes: "Keeps long tab rails horizontally scrollable instead of collapsing labels on mobile." },
        { name: "TabsTrigger.badge", type: "ReactNode", notes: "Optional supporting count or marker attached to the trigger label." },
        { name: "TabsList / TabsTrigger / TabsPanel", type: "composition", notes: "Core composition surface for the shared tab contract." },
      ])}

      {renderReferenceNotesCard(
        "Tabs should document list, triggers, and panels as a reusable view-switching contract independent from any one page shell.",
        [
          "The stable anatomy is tab list, tab triggers, and tab panels with one active value at a time.",
          "Variant and size change emphasis and density without changing the core switching model.",
          "Scrollable rails keep long tab sets usable on narrow screens without turning the primitive into a dropdown.",
          "Badges remain supporting metadata attached to triggers, not separate navigation items.",
        ],
        [
          "`variant`, `size`, `defaultValue` or controlled value, optional `TabsList.scrollable`, and trigger `badge` form the primary shared API surface.",
          "Keep triggers and panels compositional so the same tab contract works inside cards and full page sections.",
          "Use one tab family per hierarchy level to avoid inventing screen-owned switching semantics.",
        ],
        [
          "Trigger labels should remain concise and distinct so keyboard and screen-reader navigation stays predictable.",
          "Active state needs clear visual and semantic pairing with the corresponding panel.",
          "Do not render tab sets that lack meaningful panel separation or rely on color alone for active state.",
        ],
      )}

      {renderUsageReviewCard(
        "Tabs fit bounded peer views inside one feature area where switching context should stay in place instead of navigating away.",
        [
          "Several closely related views need to share one page shell and change in place.",
          "A surface needs a compact peer switcher for overview, activity, settings, or similar modes.",
        ],
        [
          "Keep tab labels parallel and short enough to scan quickly.",
          "Choose one variant per hierarchy level so primary and secondary switching do not blur together.",
          "Use badges sparingly to highlight counts without overwhelming the tab label.",
        ],
        [
          "Do not use tabs when the number of views keeps growing beyond quick scanning.",
          "Do not mix unrelated workflows under one tab rail simply to avoid routing.",
          "Do not use the same visual weight for primary and subordinate navigation layers.",
        ],
      )}
    </div>
  );
}

export function renderPaginationDocs(page: number, onPageChange: (pageValue: number) => void) {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Default</CardTitle>
          <CardDescription>Default pagination should expose current page clearly and keep the control width balanced.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Live" stacked>
            <Pagination currentPage={page} onPageChange={onPageChange} totalPages={12} />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Size scale</CardTitle>
          <CardDescription>Pagination should support slightly smaller or larger density without inventing a different page-navigation pattern.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <PaginationSizeExamples />
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared page-stepping API used by paginated list and table surfaces.", [
        { name: "currentPage", type: "number", notes: "The currently active page in the visible result set." },
        { name: "totalPages", type: "number", notes: "Total number of page positions available to the control." },
        { name: "onPageChange", type: "(page: number) => void", notes: "Callback used whenever the active page changes." },
        { name: "size", type: "\"sm\" | \"md\" | \"lg\"", notes: "Adjusts pagination density when the surface needs a slightly smaller or larger control." },
        { name: "siblingCount", type: "number", notes: "Controls how many nearby pages remain visible around the current page." },
        { name: "editableCurrentPage", type: "boolean", notes: "Allows the active page slot to become an inline page-number input on larger result sets." },
        { name: "previousLabel / nextLabel", type: "string", notes: "Accessible labels for the icon-only previous and next controls." },
      ])}

      {renderReferenceNotesCard(
        "Pagination should document the shared page-navigation contract clearly before any product-specific result logic is layered on top.",
        [
          "The stable anatomy is previous control, page range, current page indicator, and next control.",
          "Size should only tune density slightly; it should not alter the compact page grammar.",
          "When page counts are larger, the current page slot can become an inline input without changing the rest of the control.",
        ],
        [
          "`currentPage`, `totalPages`, `onPageChange`, `size`, and `editableCurrentPage` form the main stable API surface.",
          "Keep pagination adjacent to the collection it controls instead of separating it into unrelated toolbars.",
          "Use the same page-stepping grammar across comparable list and table surfaces.",
        ],
        [
          "The current page must stay obvious to both sighted and assistive users.",
          "Previous and next actions need readable labels when iconography alone would be ambiguous.",
          "Do not expose unreachable page actions or hide disabled navigation states unclearly.",
        ],
      )}

      {renderUsageReviewCard(
        "Pagination is appropriate when records must stay page-based for density, query cost, or operator scanning rhythm.",
        [
          "A list or table contains enough records that showing everything at once would harm readability or performance.",
          "Operators need explicit page stepping and a clear sense of where they are in a result set.",
        ],
        [
          "Keep the current page explicit and place pagination close to the collection it controls.",
          "Use sibling counts and labels consistently so the control stays predictable across surfaces.",
          "Pair pagination with visible result context instead of leaving page counts isolated.",
        ],
        [
          "Do not paginate short collections that fit comfortably on one screen.",
          "Do not hide the active page state behind icon-only controls.",
          "Do not swap pagination contracts across similar list surfaces without a clear reason.",
        ],
      )}
    </div>
  );
}

export function renderStepperDocs(activeStep: number, onStepChange: (step: number) => void) {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Horizontal flow</CardTitle>
          <CardDescription>Stepper should express progress and stage switching clearly without becoming a full wizard shell.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Interactive" stacked>
            <Stepper onValueChange={onStepChange} value={activeStep}>
              <StepperNav>
                <StepperItem step={1}>
                  <StepperTrigger>
                    <StepperIndicator />
                    <span className="ui-stepper__copy">
                      <StepperTitle>Workspace</StepperTitle>
                      <StepperDescription>Choose the primary operating scope.</StepperDescription>
                    </span>
                  </StepperTrigger>
                  <StepperSeparator />
                </StepperItem>
                <StepperItem step={2}>
                  <StepperTrigger>
                    <StepperIndicator />
                    <span className="ui-stepper__copy">
                      <StepperTitle>Review</StepperTitle>
                      <StepperDescription>Confirm rollout and tenant details.</StepperDescription>
                    </span>
                  </StepperTrigger>
                  <StepperSeparator />
                </StepperItem>
                <StepperItem step={3}>
                  <StepperTrigger>
                    <StepperIndicator />
                    <span className="ui-stepper__copy">
                      <StepperTitle>Complete</StepperTitle>
                      <StepperDescription>Finalize activation and audit notes.</StepperDescription>
                    </span>
                  </StepperTrigger>
                </StepperItem>
              </StepperNav>

              <StepperPanel step={1}>
                <div className="ui-lab-page__stack">
                  <p className="ui-lab-page__muted">Step one should stay concise and explain the first checkpoint without forcing a dedicated route.</p>
                  <div className="ui-lab-page__inline-wrap">
                    <Badge appearance="soft" variant="brand">Workspace scope</Badge>
                    <Badge appearance="soft" variant="neutral">Ready</Badge>
                  </div>
                </div>
              </StepperPanel>
              <StepperPanel step={2}>
                <div className="ui-lab-page__stack">
                  <p className="ui-lab-page__muted">The active stage panel can hold the next small unit of content while the stepper keeps high-level progress visible.</p>
                  <Alert tone="info">
                    <AlertBody>
                      <AlertTitle>Shared progress contract</AlertTitle>
                      <AlertDescription>Keep step titles short and let the supporting panel carry the explanatory copy.</AlertDescription>
                    </AlertBody>
                  </Alert>
                </div>
              </StepperPanel>
              <StepperPanel step={3}>
                <div className="ui-lab-page__stack">
                  <p className="ui-lab-page__muted">Final step content should still feel like one panel, not a new screen nested inside the stepper.</p>
                  <div className="ui-lab-page__inline-wrap">
                    <Badge appearance="soft" variant="success">Approved</Badge>
                    <Badge appearance="soft" variant="brand">Shared primitive</Badge>
                  </div>
                </div>
              </StepperPanel>
            </Stepper>
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vertical layout</CardTitle>
          <CardDescription>Vertical orientation should stay useful for review checklists and narrower surfaces.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Vertical" stacked>
            <Stepper defaultValue={2} orientation="vertical">
              <StepperNav>
                <StepperItem step={1}>
                  <StepperTrigger>
                    <StepperIndicator />
                    <span className="ui-stepper__copy">
                      <StepperTitle>Scope</StepperTitle>
                      <StepperDescription>Capture the environment and owner context.</StepperDescription>
                    </span>
                  </StepperTrigger>
                  <StepperSeparator />
                </StepperItem>
                <StepperItem step={2}>
                  <StepperTrigger>
                    <StepperIndicator />
                    <span className="ui-stepper__copy">
                      <StepperTitle>Signals</StepperTitle>
                      <StepperDescription>Review incidents, sync age, and rollout readiness.</StepperDescription>
                    </span>
                  </StepperTrigger>
                  <StepperSeparator />
                </StepperItem>
                <StepperItem disabled step={3}>
                  <StepperTrigger>
                    <StepperIndicator />
                    <span className="ui-stepper__copy">
                      <StepperTitle>Finalize</StepperTitle>
                      <StepperDescription>Disabled stages should remain visible but clearly unavailable.</StepperDescription>
                    </span>
                  </StepperTrigger>
                </StepperItem>
              </StepperNav>
            </Stepper>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared multi-step navigation contract used by setup, review, and staged progression surfaces.", [
        { name: "value / defaultValue", type: "number", notes: "Define the active step in controlled or uncontrolled mode." },
        { name: "orientation", type: "\"horizontal\" | \"vertical\"", notes: "Adjusts layout direction while preserving the same step semantics and keyboard model." },
        { name: "StepperNav / StepperItem / StepperTrigger", type: "composition", notes: "Core navigation pieces for building a calm step-by-step flow." },
        { name: "StepperIndicator / StepperTitle / StepperDescription", type: "composition", notes: "Shared label hierarchy for step identity and supporting copy." },
        { name: "StepperSeparator / StepperPanel", type: "composition", notes: "Optional connector and associated content region for linked stage detail." },
      ])}

      {renderReferenceNotesCard(
        "Stepper should document a small multi-step progress contract before any workflow-specific wizard shell gets introduced.",
        [
          "The stable anatomy is stepper root, nav, items, triggers, indicators, labels, and optional panels.",
          "Progress state comes from the active step and the relative position of surrounding items.",
          "Panels remain lightweight companions to the active step, not a second page framework.",
        ],
        [
          "Use concise step titles and let longer explanation live in descriptions or the current panel.",
          "Keep the step count low enough that users can still scan the whole sequence comfortably.",
          "Use vertical orientation when horizontal compression harms readability.",
        ],
        [
          "Triggers must remain keyboard reachable and expose clear active state semantics.",
          "Do not rely only on connector color or indicator fill to communicate completion.",
          "Keep step titles distinct enough that screen readers and keyboard users can differentiate them quickly.",
        ],
      )}

      {renderUsageReviewCard(
        "Stepper works best for bounded multi-stage flows where users benefit from seeing sequence, progress, and the current stage at once.",
        [
          "A setup, review, or submission flow has a small number of ordered stages.",
          "Users need progress context while still staying on one coherent surface.",
        ],
        [
          "Keep the step sequence short and the titles explicit.",
          "Use panels or nearby content to explain the active stage instead of bloating step labels.",
          "Choose one orientation that matches available width and content density.",
        ],
        [
          "Do not use stepper for long navigation trees or unrelated page sections.",
          "Do not turn each step into a full app shell nested inside the component.",
          "Do not introduce many step-specific visual variants before the core contract is proven.",
        ],
      )}
    </div>
  );
}

export function renderCollapsibleDocs() {
  return (
    <div className="ui-lab-page__panel-grid ui-lab-page__panel-grid--wide">
      <Card>
        <CardHeader>
          <CardTitle>Disclosure states</CardTitle>
          <CardDescription>Collapsible should stay calm and useful for optional detail, not for heavy navigation trees or full panel orchestration.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Closed" stacked>
            <Collapsible>
              <CollapsibleTrigger>
                <span className="ui-lab-page__collapsible-trigger-copy">
                  <span className="ui-lab-page__collapsible-trigger-title">Advanced rollout notes</span>
                  <span className="ui-lab-page__collapsible-trigger-description">
                    Keep secondary operational context available without expanding the default surface.
                  </span>
                </span>
                <ChevronIcon className="ui-lab-page__collapsible-trigger-chevron" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ui-lab-page__collapsible-body">
                  <p className="ui-lab-page__muted">
                    Collapsible content should usually stay lightweight enough that hiding it does not remove the primary meaning of the page.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </ShowcaseRow>

          <ShowcaseRow label="Open by default" stacked>
            <Collapsible defaultOpen>
              <CollapsibleTrigger>
                <span className="ui-lab-page__collapsible-trigger-copy">
                  <span className="ui-lab-page__collapsible-trigger-title">Operator review checklist</span>
                  <span className="ui-lab-page__collapsible-trigger-description">
                    Shared disclosure works well for secondary review steps, setup details, and optional guidance.
                  </span>
                </span>
                <ChevronIcon className="ui-lab-page__collapsible-trigger-chevron" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ui-lab-page__collapsible-body ui-lab-page__stack">
                  <Alert tone="info">
                    <AlertBody>
                      <AlertTitle>Keep disclosure secondary</AlertTitle>
                      <AlertDescription>Do not hide required form actions or critical state behind a collapsible section.</AlertDescription>
                    </AlertBody>
                  </Alert>
                  <div className="ui-lab-page__inline-wrap">
                    <Badge appearance="soft" variant="success">
                      Setup complete
                    </Badge>
                    <Badge appearance="soft" variant="brand">
                      Shared contract
                    </Badge>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the shared disclosure primitive used when content may be optionally revealed without becoming a new page shell.", [
        { name: "open / defaultOpen", type: "boolean", notes: "Support controlled and uncontrolled disclosure without forcing route or screen state into the primitive." },
        { name: "onOpenChange", type: "(open: boolean) => void", notes: "Lets screens observe disclosure state while keeping the primitive small." },
        { name: "disabled", type: "boolean", notes: "Prevents interaction while preserving the same disclosure anatomy." },
        { name: "CollapsibleTrigger", type: "button primitive", notes: "Exposes the shared toggle surface with correct `aria-expanded` and `aria-controls` wiring." },
        { name: "CollapsibleContent", type: "HTMLAttributes<HTMLDivElement>", notes: "Holds the disclosed content region without introducing page-specific layout rules." },
      ])}

      {renderReferenceNotesCard(
        "Collapsible should document the smallest shared disclosure contract before any app-owned accordion or sidebar tree is promoted.",
        [
          "The stable anatomy is a root disclosure container, one trigger, and one content region.",
          "The trigger owns the open-close interaction while the content region stays structurally neutral.",
          "Content should remain a secondary layer, not the sole carrier of critical task state.",
        ],
        [
          "Use controlled state only when the page genuinely needs to restore or coordinate disclosure state.",
          "Prefer compact supporting content instead of turning collapsible into a nested card framework.",
          "Keep one disclosure responsibility per collapsible root.",
        ],
        [
          "The trigger must remain a real button with an explicit label and `aria-expanded` state.",
          "Closed content should not be the only place where essential instructions or blocking errors live.",
          "Disclosure should reduce scanning cost, not create keyboard traps or surprise focus jumps.",
        ],
      )}

      {renderUsageReviewCard(
        "Collapsible works best for optional details, setup guidance, or secondary review material that helps the user without redefining the main page flow.",
        [
          "A surface needs extra context, operational notes, or grouped details that do not deserve permanent space.",
          "The user benefits from progressive disclosure but can still complete the main task without constantly opening and closing panels.",
        ],
        [
          "Keep trigger labels explicit so users know what will be revealed.",
          "Use disclosure for secondary content, summaries, or expandable explanation blocks.",
          "Preserve a calm, compact trigger rhythm so repeated collapsibles stay scannable.",
        ],
        [
          "Do not use collapsible as a replacement for routing between major views.",
          "Do not hide mandatory actions or primary validation inside a closed disclosure region.",
          "Do not grow the primitive into a full app-specific sidebar tree before the navigation contract is approved.",
        ],
      )}
    </div>
  );
}


export function renderSecondaryTabsDocs() {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Default</CardTitle>
          <CardDescription>Secondary tabs should stay visibly lighter than primary tabs and work well in bounded page subnavigation.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Default" stacked>
            <SecondaryTabsDefaultExample />
          </ShowcaseRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Badge and density</CardTitle>
          <CardDescription>Optional badges can add light secondary context, but the strip still needs to remain calmer than the main route layer.</CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__showcase-list">
          <ShowcaseRow label="Without badges" stacked>
            <SecondaryTabsDensityExample />
          </ShowcaseRow>
        </CardContent>
      </Card>

      {renderPropsApiCard("Compact reference for the stable secondary-tabs pattern used for subordinate in-page section switching.", [
        { name: "SecondaryTabs.children", type: "ReactNode", notes: "Owns the tablist container without taking route state, data loading, or page-shell concerns." },
        { name: "SecondaryTab.active", type: "boolean", notes: "Marks the currently selected subsection while leaving state management outside the pattern." },
        { name: "SecondaryTab.badge", type: "string", notes: "Adds optional light secondary context when counts or small totals help comparison." },
        { name: "SecondaryTab button props", type: "ButtonHTMLAttributes<HTMLButtonElement>", notes: "Keeps integration lightweight so product code can wire click, aria, and disabled behavior without a new state store." },
      ])}

      {renderReferenceNotesCard(
        "Secondary tabs now qualify as a stable subordinate navigation pattern because the API remains small and the role stays visually and structurally clear.",
        [
          "The anatomy is a tablist wrapper with button-based tab items, optional badges, and one active state at a time.",
          "Secondary tabs should sit beneath a stronger page, route, or feature context rather than replacing the main navigation layer.",
          "Badges stay optional and secondary so the strip does not turn into a KPI rail or status dashboard.",
        ],
        [
          "Keep labels short and parallel so subsection choices remain scannable.",
          "Treat active state as externally controlled and avoid embedding routing or data-loading assumptions in the pattern.",
          "If a surface needs richer panel orchestration, keep that logic outside the stable secondary-tabs contract.",
        ],
        [
          "The tablist should remain keyboard reachable and expose a clear selected state through `aria-selected`.",
          "Badges should not be the only clue differentiating one subsection from another.",
          "Use visible text labels for all tabs rather than relying on icon-only navigation at this hierarchy level.",
        ],
      )}

      {renderUsageReviewCard(
        "Secondary tabs are useful for lightweight subnavigation beneath a stronger page or feature context and now qualify as a stable shared navigation pattern.",
        [
          "A feature already has a clear primary context and needs one lighter subnavigation layer below it.",
          "Peer subsections should switch in place without visually competing with the page's main navigation.",
        ],
        [
          "Keep labels short and clearly subordinate to the primary page structure.",
          "Use secondary tabs only where the relationship between sections stays obvious.",
          "Keep counts and badges optional so the strip remains calm in dense enterprise surfaces.",
        ],
        [
          "Do not use secondary tabs as the first thing users rely on to enter a feature.",
          "Do not mix secondary tabs with equally weighted primary tabs at the same hierarchy level.",
          "Do not overload the strip with rich filters, saved views, or workflow controls that belong in adjacent patterns.",
        ],
      )}
    </div>
  );
}
