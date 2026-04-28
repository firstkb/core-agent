import type { StorybookConfig } from "@storybook/react-vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const configDir = dirname(fileURLToPath(import.meta.url));
const uiKitNodeModulesDir = resolve(configDir, "../packages/ui-kit/node_modules");

const config: StorybookConfig = {
  stories: [
    "../packages/ui-kit/src/**/*.stories.@(ts|tsx)",
    "../packages/collection-table/src/**/*.stories.@(ts|tsx)",
  ],
  addons: [],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  typescript: {
    reactDocgen: false,
  },
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    resolve: {
      ...viteConfig.resolve,
      alias: {
        ...(viteConfig.resolve?.alias as Record<string, string> | undefined),
        "@platform/design-tokens/styles.css": resolve(configDir, "../packages/design-tokens/src/index.css"),
        "@platform/ui-kit/styles.css": resolve(configDir, "../packages/ui-kit/src/styles.css"),
        react: resolve(uiKitNodeModulesDir, "react"),
        "react-dom": resolve(uiKitNodeModulesDir, "react-dom"),
      },
    },
  }),
};

export default config;
