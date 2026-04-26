import { defineConfig } from "vite";

import { createAppConfig } from "../../tooling/vite/create-app-config";

export default defineConfig(
  createAppConfig({
    appId: "platform-admin-web",
    hostName: "admin.platform.localhost",
    packageJsonPath: new URL("./package.json", import.meta.url),
    port: 5173,
  }),
);
