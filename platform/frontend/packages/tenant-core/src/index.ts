type TenantPlan = "Starter" | "Growth" | "Enterprise";
type TenantStatus = "active" | "trial" | "paused";

type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  members: number;
  regions: string[];
  status: TenantStatus;
  lastSyncLabel: string;
};

type TenantMetric = {
  label: string;
  value: string;
  tone: "brand" | "success" | "warning" | "neutral";
};

const demoTenants: TenantSummary[] = [
  {
    id: "tenant-northwind",
    name: "Northwind Commerce",
    slug: "northwind",
    plan: "Enterprise",
    members: 148,
    regions: ["us-east-1", "eu-central-1"],
    status: "active",
    lastSyncLabel: "2 minutes ago",
  },
  {
    id: "tenant-stellaris",
    name: "Stellaris Health",
    slug: "stellaris",
    plan: "Growth",
    members: 62,
    regions: ["us-east-1"],
    status: "trial",
    lastSyncLabel: "11 minutes ago",
  },
  {
    id: "tenant-riverbank",
    name: "Riverbank Logistics",
    slug: "riverbank",
    plan: "Starter",
    members: 24,
    regions: ["ap-southeast-1"],
    status: "paused",
    lastSyncLabel: "1 hour ago",
  },
];

function listDemoTenants() {
  return demoTenants;
}

function getDemoTenant(slug = "northwind") {
  return demoTenants.find((tenant) => tenant.slug === slug) ?? demoTenants[0];
}

function summarizeTenantPortfolio(tenants: TenantSummary[] = demoTenants) {
  const active = tenants.filter((tenant) => tenant.status === "active").length;
  const trial = tenants.filter((tenant) => tenant.status === "trial").length;
  const totalMembers = tenants.reduce((sum, tenant) => sum + tenant.members, 0);

  return {
    totalTenants: tenants.length,
    activeTenants: active,
    trialTenants: trial,
    totalMembers,
  };
}

function getTenantMetrics(tenant: TenantSummary): TenantMetric[] {
  return [
    {
      label: "Plan",
      value: tenant.plan,
      tone: tenant.plan === "Enterprise" ? "brand" : tenant.plan === "Growth" ? "success" : "neutral",
    },
    {
      label: "Members",
      value: String(tenant.members),
      tone: "neutral",
    },
    {
      label: "Regions",
      value: String(tenant.regions.length),
      tone: "brand",
    },
    {
      label: "Sync",
      value: tenant.lastSyncLabel,
      tone: tenant.status === "paused" ? "warning" : "success",
    },
  ];
}

function tenantStatusToBadgeVariant(status: TenantStatus): TenantMetric["tone"] {
  if (status === "active") return "success";
  if (status === "trial") return "warning";
  return "neutral";
}

export {
  getDemoTenant,
  getTenantMetrics,
  listDemoTenants,
  summarizeTenantPortfolio,
  tenantStatusToBadgeVariant,
};

export type { TenantMetric, TenantPlan, TenantStatus, TenantSummary };
