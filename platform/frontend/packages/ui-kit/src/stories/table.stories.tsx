import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableHead,
  TableHeaderCell,
  TableMetaCell,
  TableRow,
} from "../index";

const meta = {
  title: "UI Kit/Table",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const BasicTable: Story = {
  render: () => (
    <div style={{ overflowX: "auto", width: "100%" }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell scope="col">
              <TableColumnHeader direction="asc" onSortToggle={() => {}} title="Form" />
            </TableHeaderCell>
            <TableHeaderCell scope="col">Status</TableHeaderCell>
            <TableHeaderCell scope="col">Owner</TableHeaderCell>
            <TableHeaderCell scope="col">Updated</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[
            {
              caption: "18 fields",
              description: "Safety checklist",
              owner: "Operations",
              status: "Active",
              tone: "success" as const,
              updated: "Today",
            },
            {
              caption: "9 fields",
              description: "Equipment inspection",
              owner: "Maintenance",
              status: "Draft",
              tone: "warning" as const,
              updated: "Yesterday",
            },
            {
              caption: "22 fields",
              description: "Incident report",
              owner: "Safety",
              status: "Ready",
              tone: "brand" as const,
              updated: "Apr 24",
            },
          ].map((row) => (
            <TableRow key={row.description}>
              <TableCell>
                <TableMetaCell
                  caption={row.caption}
                  description={row.description}
                  eyebrow="Platform Studio"
                  title={row.description}
                />
              </TableCell>
              <TableCell>
                <Badge variant={row.tone}>{row.status}</Badge>
              </TableCell>
              <TableCell>{row.owner}</TableCell>
              <TableCell>{row.updated}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};
