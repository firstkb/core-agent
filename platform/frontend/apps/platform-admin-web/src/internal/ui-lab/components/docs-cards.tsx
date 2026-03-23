import type { ReactNode, SVGProps } from "react";

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, SidebarNav, type SidebarNavItem } from "@platform/ui-kit";

import type { UiLabLeafMeta, UiLabSectionIcon } from "../model/leaf-meta";
import {
  DashboardGridIcon,
  DataDisplayIcon,
  FormIcon,
  FoundationsIcon,
  InventoryIcon,
  LayersIcon,
  NavigationIcon,
  ProfileCircleIcon,
  ShieldKeyIcon,
  StatesIcon,
  WalletCardIcon,
} from "./icons";

export function renderSectionIcon(icon: UiLabSectionIcon, props: SVGProps<SVGSVGElement>) {
  switch (icon) {
    case "form-controls":
      return <FormIcon {...props} />;
    case "overlay-contracts":
      return <LayersIcon {...props} />;
    case "navigation-primitives":
      return <NavigationIcon {...props} />;
    case "data-display":
      return <DataDisplayIcon {...props} />;
    case "states":
      return <StatesIcon {...props} />;
    case "inventory":
      return <InventoryIcon {...props} />;
    case "foundations":
    default:
      return <FoundationsIcon {...props} />;
  }
}

export function getContentSummary(activeItem: UiLabLeafMeta) {
  return `Review variants, states, and usage guidance for ${activeItem.label}.`;
}

export function ShowcaseRow({
  children,
  label,
  stacked = false,
}: {
  children: ReactNode;
  label: string;
  stacked?: boolean;
}) {
  return (
    <div className="ui-lab-page__showcase-row">
      <div className="ui-lab-page__showcase-row-label">{label}</div>
      <div
        className={`ui-lab-page__showcase-surface${stacked ? " ui-lab-page__showcase-surface--stack" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

const sidebarPreviewItems: SidebarNavItem[] = [
  {
    icon: <DashboardGridIcon />,
    id: "dashboards",
    label: "Dashboards",
  },
  {
    children: [
      {
        children: [
          { id: "profiles-default", label: "Default" },
          { id: "profiles-creator", label: "Creator" },
          { id: "profiles-company", label: "Company" },
          {
            children: [
              { id: "profiles-feeds", label: "Feeds" },
              { id: "profiles-gamer", label: "Gamer" },
              { id: "profiles-modal", label: "Modal" },
              { id: "profiles-plain", label: "Plain" },
            ],
            collapsedLabel: "More 4",
            id: "profiles-more",
            expandedLabel: "Less",
            label: "More",
          },
        ],
        defaultOpen: true,
        id: "profiles",
        label: "Profiles",
      },
      {
        children: [
          { id: "projects-2-columns", label: "2 Columns" },
          { id: "projects-3-columns", label: "3 Columns" },
        ],
        id: "projects",
        label: "Projects",
      },
      { id: "works", label: "Works", meta: 2 },
      { id: "teams", label: "Teams", meta: "New" },
    ],
    defaultOpen: true,
    icon: <ProfileCircleIcon />,
    id: "public-profile",
    label: "Public Profile",
  },
  {
    children: [
      { id: "account", label: "Account" },
      { id: "billing", label: "Billing" },
      { id: "notifications", label: "Notifications", meta: 6 },
      {
        icon: <ShieldKeyIcon />,
        id: "security",
        label: "Security",
      },
    ],
    icon: <WalletCardIcon />,
    id: "my-account",
    label: "My Account",
  },
];

export function SidebarPreviewNav({ compact = false }: { compact?: boolean }) {
  return (
    <SidebarNav
      className="ui-lab-page__sidebar-preview"
      compact={compact}
      defaultActiveItemId="profiles-default"
      defaultOpenItemIds={["public-profile", "profiles"]}
      items={sidebarPreviewItems}
    />
  );
}

export function renderUsageReviewCard(
  description: string,
  whenToUse: string[],
  doItems: string[],
  avoidItems: string[],
) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage review</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="ui-lab-page__review-grid">
          <div className="ui-lab-page__note-card">
            <span className="ui-lab-page__note-label">When to use</span>
            <ul className="ui-lab-page__review-list">
              {whenToUse.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="ui-lab-page__note-card">
            <span className="ui-lab-page__note-label">Do</span>
            <ul className="ui-lab-page__review-list">
              {doItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="ui-lab-page__note-card">
            <span className="ui-lab-page__note-label">Avoid</span>
            <ul className="ui-lab-page__review-list">
              {avoidItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function renderDoNotUseForCard(
  description: string,
  items: string[],
) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Do not use for</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="ui-lab-page__note-card ui-lab-page__note-card--caution">
          <span className="ui-lab-page__note-label ui-lab-page__note-label--caution">High-risk misuse</span>
          <ul className="ui-lab-page__review-list ui-lab-page__review-list--caution">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export function renderReferenceNotesCard(
  description: string,
  anatomy: string[],
  props: string[],
  accessibility: string[],
) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reference notes</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="ui-lab-page__review-grid">
          <div className="ui-lab-page__note-card">
            <span className="ui-lab-page__note-label">Anatomy</span>
            <ul className="ui-lab-page__review-list">
              {anatomy.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="ui-lab-page__note-card">
            <span className="ui-lab-page__note-label">Props</span>
            <ul className="ui-lab-page__review-list">
              {props.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="ui-lab-page__note-card">
            <span className="ui-lab-page__note-label">Accessibility</span>
            <ul className="ui-lab-page__review-list">
              {accessibility.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type PropsApiEntry = {
  name: string;
  type: string;
  notes: string;
};

export function renderPropsApiCard(
  description: string,
  entries: readonly PropsApiEntry[],
) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Props API</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="ui-lab-page__props-list">
          {entries.map((entry) => (
            <div className="ui-lab-page__props-row" key={entry.name}>
              <div className="ui-lab-page__props-head">
                <code className="ui-lab-page__props-name">{entry.name}</code>
                <span className="ui-lab-page__props-type">{entry.type}</span>
              </div>
              <p className="ui-lab-page__props-notes">{entry.notes}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function renderComingSoonPanel(activeItem: UiLabLeafMeta) {
  return (
    <div className="ui-lab-page__panel-grid">
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            {activeItem.label} already has a reserved slot in the lab roadmap, but the final docs surface is intentionally not locked yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="ui-lab-page__stack">
          <div className="ui-lab-page__inline-wrap">
            <Badge appearance="soft" variant="warning">
              Coming
            </Badge>
            <Badge appearance="soft" variant="brand">
              Roadmap slot
            </Badge>
          </div>
          <p className="ui-lab-page__muted">
            This page stays clean on purpose until the component or pattern is ready for a proper donor-first pass, docs examples,
            and approval review.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What will land here</CardTitle>
          <CardDescription>
            The menu is meant to show the full picture early, even when some leaves are still waiting for extraction or approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="ui-lab-page__review-grid">
            <div className="ui-lab-page__note-card">
              <span className="ui-lab-page__note-label">Planned outcome</span>
              <ul className="ui-lab-page__review-list">
                <li>Dedicated preview examples for the reserved surface.</li>
                <li>Usage review and reference notes once the contract is real enough.</li>
                <li>Promotion decision only after donor fit and package boundary remain clear.</li>
              </ul>
            </div>
            <div className="ui-lab-page__note-card">
              <span className="ui-lab-page__note-label">Boundary rule</span>
              <ul className="ui-lab-page__review-list">
                <li>We do not invent a final component API before the donor and product need are both clear.</li>
                <li>We do not move page-specific composition into `ui-kit` just to fill the slot faster.</li>
                <li>Roadmap visibility comes first, approval comes later.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


export function renderInventoryPatternNotes(title: string, summary: string) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage review</CardTitle>
        <CardDescription>{summary}</CardDescription>
      </CardHeader>
      <CardContent className="ui-lab-page__showcase-list">
        <ShowcaseRow label="Status" stacked>
          <div className="ui-lab-page__inline-wrap">
            <Badge appearance="soft" variant="warning">
              Provisional
            </Badge>
            <Badge appearance="soft" variant="neutral">
              Inventory only
            </Badge>
          </div>
        </ShowcaseRow>
        <div className="ui-lab-page__review-grid">
          <div className="ui-lab-page__note-card">
            <span className="ui-lab-page__note-label">When to use</span>
            <ul className="ui-lab-page__review-list">
              <li>{title} is acceptable only where the same pattern is likely to repeat across multiple surfaces.</li>
              <li>Use this review surface to judge whether the visual density and behavior feel reusable outside one page.</li>
            </ul>
          </div>
          <div className="ui-lab-page__note-card">
            <span className="ui-lab-page__note-label">Do</span>
            <ul className="ui-lab-page__review-list">
              <li>Validate reuse, interaction semantics, and API shape before promoting anything into stable shared inventory.</li>
              <li>Keep these patterns isolated in `UI Lab` until at least one more surface confirms the same contract.</li>
            </ul>
          </div>
          <div className="ui-lab-page__note-card">
            <span className="ui-lab-page__note-label">Avoid</span>
            <ul className="ui-lab-page__review-list">
              <li>Do not treat this as stable ui-kit inventory until reuse, behavior, and API are explicitly confirmed.</li>
              <li>Do not move app-shaped layout decisions into `ui-kit` just because the preview looks acceptable in isolation.</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
