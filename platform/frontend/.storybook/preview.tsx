import type { Preview } from "@storybook/react-vite";
import React from "react";

import "@platform/design-tokens/styles.css";
import "@platform/ui-kit/styles.css";

const preview: Preview = {
  decorators: [
    (Story) => (
      <main
        style={{
          boxSizing: "border-box",
          minHeight: "100vh",
          padding: "32px",
          width: "min(1040px, 100vw)",
        }}
      >
        <Story />
      </main>
    ),
  ],
  parameters: {
    backgrounds: {
      default: "VSM light",
      values: [
        { name: "VSM light", value: "#f8fafc" },
        { name: "VSM canvas", value: "#eef2f7" },
        { name: "Dark review", value: "#111827" },
      ],
    },
    layout: "fullscreen",
  },
};

export default preview;
