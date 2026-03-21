import { defineConfig } from "vite";

import { createAppConfig } from "../../tooling/vite/create-app-config";

export default defineConfig(
  createAppConfig({
    hostName: "admin.platform.local",
    port: 5173,
  }),
);
