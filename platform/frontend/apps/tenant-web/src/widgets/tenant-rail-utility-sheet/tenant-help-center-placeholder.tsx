import {
  Button,
  DocumentListIcon,
  HelpCircleIcon,
  SearchIcon,
  ShieldKeyIcon,
  SparkIcon,
} from "@platform/ui-kit";

import "./tenant-help-center-placeholder.css";

type TenantHelpCenterPlaceholderProps = {
  onOpenDashboard: () => void;
};

const helpCenterTopics = [
  {
    description: "Step-by-step operating guides for tenant workflows and daily tasks.",
    icon: <DocumentListIcon />,
    label: "Guides",
  },
  {
    description: "Workspace setup, access rules, and builder configuration notes.",
    icon: <ShieldKeyIcon />,
    label: "Configuration help",
  },
  {
    description: "Release notes, support contacts, and escalation paths for live teams.",
    icon: <SparkIcon />,
    label: "Support updates",
  },
];

export function TenantHelpCenterPlaceholder({
  onOpenDashboard,
}: TenantHelpCenterPlaceholderProps) {
  return (
    <section className="tenant-web__help-center-placeholder" aria-labelledby="tenant-help-center-title">
      <div className="tenant-web__help-center-hero">
        <span className="tenant-web__help-center-hero-icon" aria-hidden="true">
          <HelpCircleIcon />
        </span>
        <div className="tenant-web__help-center-hero-copy">
          <p className="tenant-web__help-center-kicker">Coming soon</p>
          <h3 id="tenant-help-center-title">Help Center is being prepared</h3>
          <p>
            This space will collect product guides, configuration help, support
            contacts, and release notes for the tenant workspace.
          </p>
        </div>
      </div>

      <div className="tenant-web__help-center-search" aria-disabled="true">
        <SearchIcon />
        <span>Search help articles</span>
        <strong>Later</strong>
      </div>

      <div className="tenant-web__help-center-topic-grid" aria-label="Planned Help Center sections">
        {helpCenterTopics.map((topic) => (
          <article className="tenant-web__help-center-topic" key={topic.label}>
            <span className="tenant-web__help-center-topic-icon" aria-hidden="true">
              {topic.icon}
            </span>
            <div>
              <h4>{topic.label}</h4>
              <p>{topic.description}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="tenant-web__help-center-footer">
        <div>
          <strong>Current fallback</strong>
          <span>Use the dashboard while the Help Center content is not published.</span>
        </div>
        <Button
          className="tenant-web__help-center-dashboard-button"
          onClick={onOpenDashboard}
          variant="outline"
        >
          Open dashboard
        </Button>
      </div>
    </section>
  );
}
