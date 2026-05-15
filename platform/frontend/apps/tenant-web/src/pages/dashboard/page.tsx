import { useEffect, useMemo, useRef, useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartBarIcon,
  FormIcon,
  RoutePathIcon,
  ShieldKeyIcon,
  SlidersIcon,
  WarningTriangleIcon,
} from "@platform/ui-kit";
import { getDemoTenant, tenantStatusToBadgeVariant } from "@platform/tenant-core";

type DashboardMetricId = "audit-score" | "negative-hazards" | "corrective-actions" | "inspection-completion";
type DashboardMetricTone = "brand" | "success" | "warning" | "danger" | "info" | "neutral";

type DashboardMetricDefinition = {
  aggregation: string;
  delta: string;
  direction: "higher-better" | "lower-better";
  id: DashboardMetricId;
  label: string;
  latest: string;
  sourceView: string;
  threshold: string;
  tone: DashboardMetricTone;
  trend: string;
  unit: string;
};

type DashboardMetricThresholds = {
  targetNumberGood: number;
  targetNumberWatch: number;
};

type DashboardMonthlySeries = {
  average: string;
  max: number;
  speed: string;
  target: number;
  values: Array<number | null>;
};

type DashboardDriver = {
  count: number;
  label: string;
  tone: "risk" | "warning" | "good";
};

type DashboardPerformer = {
  average: string;
  delta: string;
  label: string;
  trend: string;
  values: number[];
};

type DashboardSignal = {
  form: string;
  id: string;
  meta: string;
  status: "Open" | "Assigned" | "Reviewed";
  text: string;
  tone: DashboardMetricTone;
};

type DashboardEChartsOption = Record<string, unknown>;
type EChartsCallbackParam = {
  name?: string;
  value?: unknown;
};

type DashboardEChartsInstance = {
  dispose: () => void;
  resize: () => void;
  setOption: (option: DashboardEChartsOption, notMerge?: boolean) => void;
};

let dashboardEChartsRegistered = false;

const tenant = getDemoTenant("northwind");

export const tenantDashboardSectionIds = {
  activity: "tenant-dashboard-activity",
  modules: "tenant-dashboard-modules",
  queue: "tenant-dashboard-sync-queue",
} as const;

const dashboardMonths = ["May.25", "Jun.25", "Jul.25", "Aug.25", "Sep.25", "Oct.25", "Nov.25", "Dec.25", "Jan.26", "Feb.26", "Mar.26", "Apr.26"];

const dashboardMetrics: DashboardMetricDefinition[] = [
  {
    aggregation: "Average score",
    delta: "-14.44 pts",
    direction: "higher-better",
    id: "audit-score",
    label: "Audit Score",
    latest: "88",
    sourceView: "Safety Audit / Monthly Score",
    threshold: "Target 80+",
    tone: "warning",
    trend: "-18.6%",
    unit: "score",
  },
  {
    aggregation: "Record count",
    delta: "+12.39",
    direction: "lower-better",
    id: "negative-hazards",
    label: "Negative Hazards",
    latest: "29",
    sourceView: "Hazard Report / Negative Findings",
    threshold: "Target under 10",
    tone: "danger",
    trend: "+147.7%",
    unit: "hazards",
  },
  {
    aggregation: "Open overdue",
    delta: "+5.1",
    direction: "lower-better",
    id: "corrective-actions",
    label: "Overdue Actions",
    latest: "16",
    sourceView: "Corrective Action / Open Items",
    threshold: "Target under 6",
    tone: "warning",
    trend: "+64.0%",
    unit: "items",
  },
  {
    aggregation: "Completed ratio",
    delta: "+2.2 pts",
    direction: "higher-better",
    id: "inspection-completion",
    label: "Inspection Completion",
    latest: "94%",
    sourceView: "Inspection Checklist / Submitted",
    threshold: "Target 90%+",
    tone: "success",
    trend: "+2.2%",
    unit: "completion",
  },
];

const monthlySeriesByMetric: Record<DashboardMetricId, DashboardMonthlySeries> = {
  "audit-score": {
    average: "70.4",
    max: 100,
    speed: "-1.31/month",
    target: 80,
    values: [75, 100, 89, 49, 69, 62, 73, 42, 85, 31, 85, 88],
  },
  "negative-hazards": {
    average: "14.6",
    max: 35,
    speed: "+1.13/month",
    target: 10,
    values: [1, null, 6, 30, 12, 11, 16, 22, 12, 6, 23, 29],
  },
  "corrective-actions": {
    average: "8.5",
    max: 20,
    speed: "+0.47/month",
    target: 6,
    values: [4, 5, 3, 8, 6, 7, 9, 12, 10, 8, 14, 16],
  },
  "inspection-completion": {
    average: "87.6%",
    max: 100,
    speed: "+0.2/month",
    target: 90,
    values: [92, 95, 91, 76, 84, 88, 89, 72, 93, 86, 91, 94],
  },
};

const builderBindings = [
  {
    description: "Safety Audit and Hazard Report views feed this dashboard.",
    icon: <FormIcon />,
    id: "forms",
    label: "Bound to Forms",
  },
  {
    description: "Operations Dashboard is exposed as a locked navigation target.",
    icon: <RoutePathIcon />,
    id: "navigation",
    label: "Visible through Navigation",
  },
  {
    description: "Aggregates use the same user scope as source Form Views.",
    icon: <ShieldKeyIcon />,
    id: "access",
    label: "Filtered by Access Scope",
  },
];

const dashboardDrivers: DashboardDriver[] = [
  { count: 42, label: "Housekeeping", tone: "risk" },
  { count: 34, label: "Missing PPE", tone: "risk" },
  { count: 27, label: "Access control", tone: "warning" },
  { count: 18, label: "Equipment inspection", tone: "warning" },
  { count: 9, label: "Good catch closed", tone: "good" },
];

const dashboardPerformers: DashboardPerformer[] = [
  {
    average: "57.2",
    delta: "+11.39",
    label: "P1B Manhattan Tunnel",
    trend: "+22.1%",
    values: [0, 100, 81, 45, 50, 42, 47, 35, 73, 40, 84, 80],
  },
  {
    average: "55.0",
    delta: "0",
    label: "P3 Systems Yard",
    trend: "0%",
    values: [55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55],
  },
  {
    average: "57.3",
    delta: "+80.35",
    label: "P4 Tonnelle Ave Portal",
    trend: "+598.3%",
    values: [17, 100, 0, 0, 29, 100, 0, 92, 100, 96, 98, 100],
  },
];

const dashboardSignals: DashboardSignal[] = [
  {
    form: "Hazard Report",
    id: "HZ-1048",
    meta: "P1B Manhattan Tunnel - Apr.26",
    status: "Open",
    text: "Repeated negative hazard cluster in access control and PPE.",
    tone: "danger",
  },
  {
    form: "Safety Audit",
    id: "AU-773",
    meta: "P4 Tonnelle Ave Portal - Apr.26",
    status: "Reviewed",
    text: "Audit score recovered after three corrective actions closed.",
    tone: "success",
  },
  {
    form: "Corrective Action",
    id: "CA-321",
    meta: "Operations dashboard - filtered scope",
    status: "Assigned",
    text: "Overdue actions rising faster than submission activity.",
    tone: "warning",
  },
];

const activityDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const activityHours = Array.from({ length: 24 }, (_, hour) => hour);
const activityHeatmap = activityDays.map((day, dayIndex) => ({
  day,
  values: activityHours.map((hour) => {
    const workdayBoost = dayIndex < 5 && hour >= 6 && hour <= 18 ? 1 : 0;
    const peakBoost = dayIndex >= 2 && dayIndex <= 4 && (hour === 10 || hour === 14 || hour === 17) ? 2 : 0;
    const sparseNight = hour < 5 || hour > 21 ? -1 : 0;
    return Math.max(0, ((dayIndex * 3 + hour * 2) % 4) + workdayBoost + peakBoost + sparseNight - 1);
  }),
}));

function getMetricById(metricId: DashboardMetricId) {
  return dashboardMetrics.find((metric) => metric.id === metricId) ?? dashboardMetrics[0];
}

function getCellState(metric: DashboardMetricDefinition & DashboardMetricThresholds, value: number | null) {
  if (value === null) {
    return "empty";
  }

  if (metric.direction === "higher-better") {
    if (value >= metric.targetNumberGood) {
      return "good";
    }

    if (value >= metric.targetNumberWatch) {
      return "watch";
    }

    return "risk";
  }

  if (value <= metric.targetNumberGood) {
    return "good";
  }

  if (value <= metric.targetNumberWatch) {
    return "watch";
  }

  return "risk";
}

function getMetricThresholds(metric: DashboardMetricDefinition): DashboardMetricThresholds {
  return metric.direction === "higher-better"
    ? { targetNumberGood: metric.id === "inspection-completion" ? 90 : 80, targetNumberWatch: metric.id === "inspection-completion" ? 82 : 65 }
    : { targetNumberGood: metric.id === "corrective-actions" ? 6 : 10, targetNumberWatch: metric.id === "corrective-actions" ? 10 : 18 };
}

function buildSparklinePath(values: number[]) {
  const width = 150;
  const height = 46;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);

  return values
    .map((value, index) => {
      const x = (width / (values.length - 1)) * index;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function getMetricColor(metric: DashboardMetricDefinition) {
  if (metric.tone === "danger") {
    return "#ef4444";
  }

  if (metric.tone === "warning") {
    return "#f59e0b";
  }

  if (metric.tone === "success") {
    return "#16a34a";
  }

  return "#2563eb";
}

function getCellColor(state: ReturnType<typeof getCellState>) {
  if (state === "good") {
    return "#2f8f46";
  }

  if (state === "watch") {
    return "#d97706";
  }

  if (state === "risk") {
    return "#ef4444";
  }

  return "#94a3b8";
}

function getFirstCallbackParam(params: unknown): EChartsCallbackParam {
  const candidate = Array.isArray(params) ? params[0] : params;

  if (candidate && typeof candidate === "object") {
    return candidate as EChartsCallbackParam;
  }

  return {};
}

function getHeatmapTuple(value: unknown): [number, number, number] {
  if (!Array.isArray(value)) {
    return [0, 0, 0];
  }

  const [hour, dayIndex, count] = value;

  return [
    typeof hour === "number" ? hour : 0,
    typeof dayIndex === "number" ? dayIndex : 0,
    typeof count === "number" ? count : 0,
  ];
}

function createMetricTrendOption(
  metric: DashboardMetricDefinition & DashboardMetricThresholds,
  series: DashboardMonthlySeries,
): DashboardEChartsOption {
  const color = getMetricColor(metric);

  return {
    animationDuration: 650,
    grid: {
      bottom: 42,
      left: 44,
      right: 18,
      top: 26,
    },
    tooltip: {
      axisPointer: {
        lineStyle: {
          color: "rgba(100, 116, 139, 0.36)",
        },
        type: "line",
      },
      borderColor: "rgba(148, 163, 184, 0.28)",
      borderWidth: 1,
      confine: true,
      formatter: (params: unknown) => {
        const point = getFirstCallbackParam(params);
        const value = typeof point.value === "object" && point.value !== null ? String(point.value) : point.value;
        return `${point.name}<br/><strong>${metric.label}: ${value ?? "No data"}</strong><br/>${metric.sourceView}`;
      },
      padding: [10, 12],
      trigger: "axis",
    },
    xAxis: {
      axisLabel: {
        color: "#64748b",
        fontSize: 11,
      },
      axisLine: {
        lineStyle: {
          color: "rgba(100, 116, 139, 0.35)",
        },
      },
      axisTick: {
        show: false,
      },
      boundaryGap: false,
      data: dashboardMonths,
      type: "category",
    },
    yAxis: {
      axisLabel: {
        color: "#64748b",
        fontSize: 11,
      },
      max: series.max,
      min: 0,
      splitLine: {
        lineStyle: {
          color: "rgba(148, 163, 184, 0.22)",
        },
      },
      type: "value",
    },
    series: [
      {
        areaStyle: {
          color: {
            colorStops: [
              { color: `${color}33`, offset: 0 },
              { color: `${color}08`, offset: 1 },
            ],
            type: "linear",
            x: 0,
            x2: 0,
            y: 0,
            y2: 1,
          },
        },
        data: series.values.map((value) => (
          value === null
            ? null
            : {
                itemStyle: {
                  borderColor: getCellColor(getCellState(metric, value)),
                  borderWidth: 3,
                  color: "#ffffff",
                },
                label: {
                  show: true,
                },
                value,
              }
        )),
        emphasis: {
          focus: "series",
        },
        label: {
          color: "#1f2937",
          distance: 10,
          fontSize: 12,
          fontWeight: 700,
          formatter: "{c}",
          show: true,
        },
        lineStyle: {
          color,
          width: 5,
        },
        markLine: {
          data: [
            {
              label: {
                color: "#dc2626",
                formatter: "Target",
              },
              lineStyle: {
                color: "#ef4444",
                dashOffset: 4,
                type: "dashed",
                width: 3,
              },
              name: "Target",
              yAxis: series.target,
            },
          ],
          symbol: "none",
        },
        name: metric.label,
        showSymbol: true,
        smooth: true,
        symbol: "circle",
        symbolSize: 11,
        type: "line",
      },
    ],
  };
}

function createActivityHeatmapOption(): DashboardEChartsOption {
  return (
    {
      animationDuration: 500,
      grid: {
        bottom: 42,
        left: 48,
        right: 18,
        top: 12,
      },
      tooltip: {
        borderColor: "rgba(148, 163, 184, 0.28)",
        confine: true,
        formatter: (params: EChartsCallbackParam) => {
          const [hour, dayIndex, value] = getHeatmapTuple(params.value);
          return `${activityDays[dayIndex]} ${String(hour).padStart(2, "0")}:00<br/><strong>${value} events</strong>`;
        },
        trigger: "item",
      },
      visualMap: {
        bottom: 0,
        calculable: false,
        inRange: {
          color: ["#eef2f7", "#dbeafe", "#bfdbfe", "#93c5fd", "#4f7bd9"],
        },
        left: "center",
        max: 4,
        min: 0,
        orient: "horizontal",
        textStyle: {
          color: "#64748b",
          fontSize: 11,
        },
      },
      xAxis: {
        axisLabel: {
          color: "#64748b",
          fontSize: 11,
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        data: activityHours.map((hour) => String(hour).padStart(2, "0")),
        splitArea: {
          show: true,
        },
        type: "category",
      },
      yAxis: {
        axisLabel: {
          color: "#64748b",
          fontSize: 12,
          fontWeight: 700,
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        data: activityDays,
        inverse: true,
        splitArea: {
          show: true,
        },
        type: "category",
      },
      series: [
        {
          data: activityHeatmap.flatMap((row, dayIndex) => row.values.map((value, hour) => [hour, dayIndex, value])),
          emphasis: {
            itemStyle: {
              borderColor: "#1d4ed8",
              borderWidth: 1,
              shadowBlur: 6,
              shadowColor: "rgba(37, 99, 235, 0.24)",
            },
          },
          itemStyle: {
            borderColor: "#ffffff",
            borderRadius: 5,
            borderWidth: 2,
          },
          label: {
            color: "#1f2937",
            formatter: ({ value }: EChartsCallbackParam) => {
              const [, , count] = getHeatmapTuple(value);
              return count > 2 ? String(count) : "";
            },
            fontSize: 11,
            fontWeight: 700,
            show: true,
          },
          name: "Employee activity",
          type: "heatmap",
        },
      ],
    }
  );
}

async function loadDashboardECharts() {
  const [echartsCore, charts, components, renderers] = await Promise.all([
    import("echarts/core"),
    import("echarts/charts"),
    import("echarts/components"),
    import("echarts/renderers"),
  ]);

  if (!dashboardEChartsRegistered) {
    echartsCore.use([
      renderers.CanvasRenderer,
      components.GridComponent,
      charts.HeatmapChart,
      components.LegendComponent,
      charts.LineChart,
      components.MarkLineComponent,
      components.TooltipComponent,
      components.VisualMapComponent,
    ]);
    dashboardEChartsRegistered = true;
  }

  return echartsCore;
}

function EChartsCanvas({
  ariaLabel,
  className,
  option,
}: {
  ariaLabel: string;
  className: string;
  option: DashboardEChartsOption;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<DashboardEChartsInstance | null>(null);
  const latestOptionRef = useRef(option);

  useEffect(() => {
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;

    async function mountChart() {
      if (!containerRef.current) {
        return;
      }

      const echartsCore = await loadDashboardECharts();

      if (disposed || !containerRef.current) {
        return;
      }

      const chart = echartsCore.init(containerRef.current, undefined, { renderer: "canvas" });
      chartRef.current = chart;
      chart.setOption(latestOptionRef.current, true);

      resizeObserver = new ResizeObserver(() => chart.resize());
      resizeObserver.observe(containerRef.current);
    }

    void mountChart();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    latestOptionRef.current = option;
    chartRef.current?.setOption(option, true);
  }, [option]);

  return <div aria-label={ariaLabel} className={className} ref={containerRef} role="img" />;
}

function PerformerSparkline({ performer }: { performer: DashboardPerformer }) {
  return (
    <svg aria-hidden="true" className="tenant-web__dashboard-sparkline" viewBox="0 0 150 46">
      <path className="tenant-web__dashboard-sparkline-baseline" d="M 0 30 L 150 30" />
      <path className="tenant-web__dashboard-sparkline-line" d={buildSparklinePath(performer.values)} />
    </svg>
  );
}

export function TenantDashboardPage() {
  const [activeMetricId, setActiveMetricId] = useState<DashboardMetricId>("audit-score");
  const activeMetric = getMetricById(activeMetricId);
  const activeSeries = monthlySeriesByMetric[activeMetric.id];
  const activeMetricWithThresholds = useMemo(
    () => ({ ...activeMetric, ...getMetricThresholds(activeMetric) }),
    [activeMetric],
  );
  const metricsWithThresholds = useMemo(
    () => dashboardMetrics.map((metric) => ({ ...metric, ...getMetricThresholds(metric) })),
    [],
  );
  const activeTrendOption = useMemo(
    () => createMetricTrendOption(activeMetricWithThresholds, activeSeries),
    [activeMetricWithThresholds, activeSeries],
  );
  const activityHeatmapOption = useMemo(() => createActivityHeatmapOption(), []);

  return (
    <div className="tenant-web__dashboard-shell">
      <section className="tenant-web__dashboard-hero">
        <div className="tenant-web__dashboard-hero-main">
          <div className="tenant-web__dashboard-hero-tags">
            <Badge size="sm" variant="brand">Operations Dashboard</Badge>
            <Badge appearance="soft" size="sm" variant={tenantStatusToBadgeVariant(tenant.status)}>
              {tenant.status}
            </Badge>
            <Badge appearance="outline" size="sm" variant="neutral">
              {tenant.name}
            </Badge>
          </div>

          <div className="tenant-web__dashboard-hero-copy">
            <h2 className="tenant-web__dashboard-hero-title">Safety Intelligence</h2>
            <p className="tenant-web__dashboard-hero-description">
              A form-powered dashboard mockup that connects safety audits, hazards, corrective actions, and inspection
              activity into one operator view.
            </p>
          </div>
        </div>

        <div className="tenant-web__dashboard-builder-panel" aria-label="Future dashboard builder bindings">
          {builderBindings.map((binding) => (
            <div className="tenant-web__dashboard-binding" key={binding.id}>
              <span className="tenant-web__dashboard-binding-icon" aria-hidden="true">
                {binding.icon}
              </span>
              <span>
                <strong>{binding.label}</strong>
                <span>{binding.description}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="tenant-web__dashboard-controls" aria-label="Dashboard filters">
        <div className="tenant-web__dashboard-control-group">
          <span>Period</span>
          <div className="tenant-web__dashboard-segment">
            <button type="button">30d</button>
            <button className="is-active" type="button">12m</button>
            <button type="button">YTD</button>
          </div>
        </div>
        <div className="tenant-web__dashboard-control-group">
          <span>Scope</span>
          <div className="tenant-web__dashboard-segment">
            <button className="is-active" type="button">My access</button>
            <button type="button">Project</button>
            <button type="button">Company</button>
          </div>
        </div>
        <div className="tenant-web__dashboard-refresh-note">
          <SlidersIcon />
          Mock provider: dashboard widgets read typed Form View bindings.
        </div>
      </section>

      <section className="tenant-web__dashboard-metric-grid" aria-label="Safety KPI summary">
        {dashboardMetrics.map((metric) => (
          <button
            className={`tenant-web__dashboard-metric-card ${activeMetricId === metric.id ? "is-active" : ""}`}
            key={metric.id}
            onClick={() => setActiveMetricId(metric.id)}
            type="button"
          >
            <span className="tenant-web__dashboard-metric-card-header">
              <span>
                <span className="tenant-web__dashboard-metric-label">{metric.label}</span>
                <span className="tenant-web__dashboard-metric-source">{metric.sourceView}</span>
              </span>
              <Badge appearance="soft" size="sm" variant={metric.tone}>
                {metric.trend}
              </Badge>
            </span>
            <span className="tenant-web__dashboard-metric-card-body">
              <strong>{metric.latest}</strong>
              <span>{metric.aggregation}</span>
            </span>
            <span className="tenant-web__dashboard-metric-card-footer">
              <span>{metric.threshold}</span>
              <span>{metric.delta}</span>
            </span>
          </button>
        ))}
      </section>

      <section className="tenant-web__dashboard-section-grid tenant-web__dashboard-section-grid--lead" id={tenantDashboardSectionIds.modules}>
        <Card className="tenant-web__dashboard-card tenant-web__dashboard-card--chart">
          <CardHeader>
            <div className="tenant-web__dashboard-card-heading">
              <span className="tenant-web__dashboard-card-icon" aria-hidden="true">
                <ChartBarIcon />
              </span>
              <div>
                <CardTitle>{activeMetric.label} trend</CardTitle>
                <CardDescription>
                  Average {activeSeries.average} - delta {activeMetric.delta} - speed {activeSeries.speed}
                </CardDescription>
              </div>
            </div>
            <div className="tenant-web__dashboard-chart-actions" role="group" aria-label="KPI selector">
              {dashboardMetrics.slice(0, 2).map((metric) => (
                <Button
                  key={metric.id}
                  onClick={() => setActiveMetricId(metric.id)}
                  size="sm"
                  variant={activeMetricId === metric.id ? "primary" : "outline"}
                >
                  {metric.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <EChartsCanvas
              ariaLabel={`${activeMetric.label} ECharts trend`}
              className="tenant-web__dashboard-chart"
              option={activeTrendOption}
            />
          </CardContent>
        </Card>

        <Card className="tenant-web__dashboard-card">
          <CardHeader>
            <div className="tenant-web__dashboard-card-heading">
              <span className="tenant-web__dashboard-card-icon tenant-web__dashboard-card-icon--warning" aria-hidden="true">
                <WarningTriangleIcon />
              </span>
              <div>
                <CardTitle>Risk drivers</CardTitle>
                <CardDescription>Grouped from category fields across bound Form Views.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="tenant-web__dashboard-driver-list">
            {dashboardDrivers.map((driver) => (
              <div className="tenant-web__dashboard-driver" key={driver.label}>
                <div className="tenant-web__dashboard-driver-label">
                  <span>{driver.label}</span>
                  <strong>{driver.count}</strong>
                </div>
                <div className="tenant-web__dashboard-driver-track">
                  <span
                    className={`tenant-web__dashboard-driver-bar tenant-web__dashboard-driver-bar--${driver.tone}`}
                    style={{ width: `${Math.max(12, (driver.count / 42) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="tenant-web__dashboard-card tenant-web__dashboard-matrix" aria-label="KPI health matrix">
        <div className="tenant-web__dashboard-matrix-header">
          <div>
            <h3>KPI health matrix</h3>
            <p>Monthly scoring keeps the old dashboard logic, but separates target, missing data, and direction.</p>
          </div>
          <div className="tenant-web__dashboard-matrix-legend">
            <span><i className="is-good" /> On target</span>
            <span><i className="is-watch" /> Watch</span>
            <span><i className="is-risk" /> Risk</span>
          </div>
        </div>
        <div className="tenant-web__dashboard-matrix-scroll">
          <table>
            <thead>
              <tr>
                <th>KPI</th>
                {dashboardMonths.map((month) => (
                  <th key={month}>{month}</th>
                ))}
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {metricsWithThresholds.map((metric) => (
                <tr key={metric.id}>
                  <th>
                    <span>{metric.label}</span>
                    <small>{metric.sourceView}</small>
                  </th>
                  {monthlySeriesByMetric[metric.id].values.map((value, index) => (
                    <td className={`is-${getCellState(metric, value)}`} key={`${metric.id}-${dashboardMonths[index]}`}>
                      {value ?? "-"}
                    </td>
                  ))}
                  <td className={metric.trend.startsWith("+") && metric.direction === "lower-better" ? "is-risk-text" : "is-trend-text"}>
                    {metric.trend}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="tenant-web__dashboard-section-grid" id={tenantDashboardSectionIds.activity}>
        <Card className="tenant-web__dashboard-card">
          <CardHeader>
            <div>
              <CardTitle>Top low performance</CardTitle>
              <CardDescription>Rolling 12-month performers by project access scope.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="tenant-web__dashboard-performer-list">
            {dashboardPerformers.map((performer) => (
              <div className="tenant-web__dashboard-performer" key={performer.label}>
                <div>
                  <strong>{performer.label}</strong>
                  <span>Average {performer.average} - Trend {performer.trend}</span>
                </div>
                <PerformerSparkline performer={performer} />
                <Badge appearance="soft" size="sm" variant={performer.trend.startsWith("+") ? "success" : "neutral"}>
                  {performer.delta}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="tenant-web__dashboard-card">
          <CardHeader>
            <div>
              <CardTitle>Recent signals</CardTitle>
              <CardDescription>Records that explain the current chart movement.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="tenant-web__dashboard-signal-list">
            {dashboardSignals.map((signal) => (
              <article className="tenant-web__dashboard-signal" key={signal.id}>
                <div>
                  <Badge appearance="soft" size="sm" variant={signal.tone}>
                    {signal.status}
                  </Badge>
                  <strong>{signal.id}</strong>
                </div>
                <p>{signal.text}</p>
                <span>{signal.form} - {signal.meta}</span>
              </article>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="tenant-web__dashboard-card tenant-web__dashboard-activity" id={tenantDashboardSectionIds.queue}>
        <div className="tenant-web__dashboard-activity-header">
          <div>
            <h3>Employee activity - last month</h3>
            <p>Submission density by day and hour, ready to bind to form create/update events.</p>
          </div>
          <Badge appearance="soft" size="sm" variant="info">
            428 events
          </Badge>
        </div>
        <div className="tenant-web__dashboard-heatmap-scroll">
          <EChartsCanvas
            ariaLabel="Employee activity ECharts heatmap"
            className="tenant-web__dashboard-heatmap-chart"
            option={activityHeatmapOption}
          />
        </div>
      </section>
    </div>
  );
}
