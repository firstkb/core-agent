import type { ReactNode, SVGProps } from "react";

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Collapsible, CollapsibleContent, CollapsibleTrigger } from "@platform/ui-kit";

import type { UiLabLeafMeta, UiLabSectionIcon } from "../model/leaf-meta";
import {
  ChevronIcon,
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

export function SidebarCandidateRow({
  active = false,
  children,
  className = "",
}: {
  active?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`ui-lab-page__sidebar-candidate-row${active ? " ui-lab-page__sidebar-candidate-row--active" : ""}${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>
  );
}

export function SidebarCandidateNav({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`ui-lab-page__sidebar-candidate${compact ? " ui-lab-page__sidebar-candidate--compact" : ""}`}>
      <SidebarCandidateRow active className="ui-lab-page__sidebar-candidate-row--root">
        <span className="ui-lab-page__sidebar-candidate-row-copy">
          <DashboardGridIcon className="ui-lab-page__sidebar-candidate-icon" />
          <span>Dashboards</span>
        </span>
      </SidebarCandidateRow>

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="ui-lab-page__sidebar-candidate-row ui-lab-page__sidebar-candidate-row--root">
          <span className="ui-lab-page__sidebar-candidate-row-copy">
            <ProfileCircleIcon className="ui-lab-page__sidebar-candidate-icon" />
            <span>Public Profile</span>
          </span>
          <ChevronIcon className="ui-lab-page__sidebar-candidate-caret" />
        </CollapsibleTrigger>
        <CollapsibleContent className="ui-lab-page__sidebar-candidate-branch">
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="ui-lab-page__sidebar-candidate-row ui-lab-page__sidebar-candidate-row--nested">
              <span className="ui-lab-page__sidebar-candidate-row-copy">
                <span>Profiles</span>
              </span>
              <ChevronIcon className="ui-lab-page__sidebar-candidate-caret" />
            </CollapsibleTrigger>
            <CollapsibleContent className="ui-lab-page__sidebar-candidate-sub-branch">
              <SidebarCandidateRow active className="ui-lab-page__sidebar-candidate-row--leaf">
                <span className="ui-lab-page__sidebar-candidate-row-copy">
                  <span>Default</span>
                </span>
              </SidebarCandidateRow>
              <SidebarCandidateRow className="ui-lab-page__sidebar-candidate-row--leaf">
                <span className="ui-lab-page__sidebar-candidate-row-copy">
                  <span>Creator</span>
                </span>
              </SidebarCandidateRow>
              <SidebarCandidateRow className="ui-lab-page__sidebar-candidate-row--leaf">
                <span className="ui-lab-page__sidebar-candidate-row-copy">
                  <span>Company</span>
                </span>
              </SidebarCandidateRow>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger className="ui-lab-page__sidebar-candidate-row ui-lab-page__sidebar-candidate-row--nested">
              <span className="ui-lab-page__sidebar-candidate-row-copy">
                <span>Projects</span>
              </span>
              <ChevronIcon className="ui-lab-page__sidebar-candidate-caret" />
            </CollapsibleTrigger>
            <CollapsibleContent className="ui-lab-page__sidebar-candidate-sub-branch">
              <SidebarCandidateRow className="ui-lab-page__sidebar-candidate-row--leaf">
                <span className="ui-lab-page__sidebar-candidate-row-copy">
                  <span>2 Columns</span>
                </span>
              </SidebarCandidateRow>
              <SidebarCandidateRow className="ui-lab-page__sidebar-candidate-row--leaf">
                <span className="ui-lab-page__sidebar-candidate-row-copy">
                  <span>3 Columns</span>
                </span>
              </SidebarCandidateRow>
            </CollapsibleContent>
          </Collapsible>

          <SidebarCandidateRow className="ui-lab-page__sidebar-candidate-row--nested">
            <span className="ui-lab-page__sidebar-candidate-row-copy">
              <span>Works</span>
            </span>
          </SidebarCandidateRow>
          <SidebarCandidateRow className="ui-lab-page__sidebar-candidate-row--nested">
            <span className="ui-lab-page__sidebar-candidate-row-copy">
              <span>Teams</span>
            </span>
          </SidebarCandidateRow>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible>
        <CollapsibleTrigger className="ui-lab-page__sidebar-candidate-row ui-lab-page__sidebar-candidate-row--root">
          <span className="ui-lab-page__sidebar-candidate-row-copy">
            <WalletCardIcon className="ui-lab-page__sidebar-candidate-icon" />
            <span>My Account</span>
          </span>
          <ChevronIcon className="ui-lab-page__sidebar-candidate-caret" />
        </CollapsibleTrigger>
        <CollapsibleContent className="ui-lab-page__sidebar-candidate-branch">
          <SidebarCandidateRow className="ui-lab-page__sidebar-candidate-row--nested">
            <span className="ui-lab-page__sidebar-candidate-row-copy">
              <span>Account</span>
            </span>
          </SidebarCandidateRow>
          <SidebarCandidateRow className="ui-lab-page__sidebar-candidate-row--nested">
            <span className="ui-lab-page__sidebar-candidate-row-copy">
              <span>Billing</span>
            </span>
          </SidebarCandidateRow>
          <SidebarCandidateRow className="ui-lab-page__sidebar-candidate-row--nested">
            <span className="ui-lab-page__sidebar-candidate-row-copy">
              <span>Notifications</span>
            </span>
          </SidebarCandidateRow>
          <SidebarCandidateRow className="ui-lab-page__sidebar-candidate-row--nested">
            <span className="ui-lab-page__sidebar-candidate-row-copy">
              <ShieldKeyIcon className="ui-lab-page__sidebar-candidate-icon ui-lab-page__sidebar-candidate-icon--inline" />
              <span>Security</span>
            </span>
          </SidebarCandidateRow>
        </CollapsibleContent>
      </Collapsible>
    </div>
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
