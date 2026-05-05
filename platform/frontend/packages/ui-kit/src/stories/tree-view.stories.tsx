import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { TreeView, type TreeViewNode } from "../index";
import { StorySection, StoryStack } from "./story-helpers";

const projectTreeItems: TreeViewNode[] = [
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
                      { id: "environmental-manager", label: "Environmental Manager @ Anton Gallas" },
                      { id: "field-safety-chelsea", label: "Field Safety Manager @ Chelsea Rinehart" },
                      { id: "field-safety-gary", label: "Field Safety Manager @ Gary Baker" },
                      { id: "general-superintendent", label: "General Superintendent @ Bob Hamill" },
                      { id: "safety-director", label: "Safety Director @ Rachel Enis" },
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

const controlledTreeItems: TreeViewNode[] = [
  {
    children: [
      { id: "inspections-open", label: "Open inspections", meta: "12" },
      { id: "inspections-closed", label: "Closed inspections" },
      { id: "inspections-overdue", label: "Overdue", meta: "3" },
    ],
    id: "inspections",
    label: "Inspections",
    meta: "15",
  },
  {
    children: [
      { id: "people-safety", label: "Safety managers" },
      { id: "people-field", label: "Field team" },
    ],
    id: "people",
    label: "People",
  },
  {
    children: [
      { id: "reports-daily", label: "Daily reports" },
      { id: "reports-monthly", disabled: true, label: "Monthly reports", secondaryLabel: "Template pending" },
    ],
    id: "reports",
    label: "Reports",
  },
];

const meta = {
  title: "UI Kit/Tree View",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledTreePreview() {
  const [expandedItemIds, setExpandedItemIds] = useState(["inspections", "people"]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>("inspections-open");

  return (
    <div style={{ display: "grid", gap: "12px", width: "min(100%, 360px)" }}>
      <TreeView
        ariaLabel="Controlled review tree"
        density="compact"
        expandedItemIds={expandedItemIds}
        items={controlledTreeItems}
        onExpandedItemIdsChange={setExpandedItemIds}
        onSelectedItemChange={setSelectedItemId}
        selectedItemId={selectedItemId}
      />
      <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
        Selected: {selectedItemId ?? "none"} | Expanded: {expandedItemIds.join(", ") || "none"}
      </p>
    </div>
  );
}

export const TreeViews: Story = {
  render: () => (
    <StoryStack>
      <StorySection
        description="Default branch and leaf affordances for folder-like structures."
        title="Default hierarchy"
      >
        <div style={{ width: "min(100%, 520px)" }}>
          <TreeView
            ariaLabel="Project organization tree"
            defaultSelectedItemId="safety-director"
            items={projectTreeItems}
          />
        </div>
      </StorySection>

      <StorySection
        description="Hosts can own selected and expanded ids while the component keeps keyboard behavior."
        title="Controlled compact state"
      >
        <ControlledTreePreview />
      </StorySection>

      <StorySection
        description="Read-only mode still allows branch expansion, but leaves do not activate and selected styling is suppressed."
        title="Read-only snapshot"
      >
        <div style={{ width: "min(100%, 520px)" }}>
          <TreeView
            ariaLabel="Read-only project organization tree"
            items={projectTreeItems}
            readOnly
          />
        </div>
      </StorySection>
    </StoryStack>
  ),
};
