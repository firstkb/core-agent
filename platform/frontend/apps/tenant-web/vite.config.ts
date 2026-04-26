import { defineConfig } from "vite";

import { createAppConfig } from "../../tooling/vite/create-app-config";

export default defineConfig(
  createAppConfig({
    appId: "tenant-web",
    hostName: "demo.platform.localhost",
    packageJsonPath: new URL("./package.json", import.meta.url),
    port: 5174,
  }),
);
