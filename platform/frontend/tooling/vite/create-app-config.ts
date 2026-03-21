import react from "@vitejs/plugin-react";
import { searchForWorkspaceRoot } from "vite";
import type { UserConfig } from "vite";

type AppHostConfig = {
  hostName: string;
  port: number;
};

export function createAppConfig({ hostName, port }: AppHostConfig): UserConfig {
  return {
    plugins: [react()],
    server: {
      host: true,
      port,
      strictPort: true,
      allowedHosts: [hostName],
      fs: {
        allow: [searchForWorkspaceRoot(process.cwd())],
      },
    },
    preview: {
      host: true,
      port,
      strictPort: true,
      allowedHosts: [hostName],
    },
  };
}
