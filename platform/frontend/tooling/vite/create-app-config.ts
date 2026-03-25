import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { searchForWorkspaceRoot } from "vite";
import type { Plugin, UserConfigFnObject, ViteDevServer } from "vite";

type AppHostConfig = {
  appId: string;
  hostName: string;
  packageJsonPath: string | URL;
  port: number;
};

type AppBuildMetadata = {
  appId: string;
  buildId: string;
  buildTimestamp: string;
  env: string;
  version: string;
};

function normalizeEnvKeyPrefix(appId: string) {
  return appId
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function resolvePackageVersion(packageJsonPath: string | URL) {
  const packageJsonFile = typeof packageJsonPath === "string"
    ? resolve(packageJsonPath)
    : packageJsonPath;
  const packageJson = JSON.parse(readFileSync(packageJsonFile, "utf8")) as {
    version?: unknown;
  };

  if (typeof packageJson.version !== "string" || !packageJson.version.trim()) {
    throw new Error(`Unable to resolve version from ${String(packageJsonPath)}.`);
  }

  return packageJson.version;
}

function normalizeEnvLabel(value: string) {
  const normalizedValue = value.trim().toUpperCase();

  switch (normalizedValue) {
    case "DEVELOPMENT":
    case "DEV":
      return "DEV";
    case "PRODUCTION":
    case "PROD":
      return "PROD";
    case "STAGING":
    case "STAGE":
      return "STAGE";
    case "TEST":
    case "TESTING":
      return "TEST";
    case "QUALITY_ASSURANCE":
    case "QA":
      return "QA";
    case "LOCAL":
      return "LOCAL";
    case "PREVIEW":
      return "PREVIEW";
    case "DEMO":
      return "DEMO";
    default:
      return normalizedValue;
  }
}

function resolveBuildMetadata(appId: string, packageJsonPath: string | URL, mode: string) {
  const envKeyPrefix = normalizeEnvKeyPrefix(appId);
  const buildTimestamp = new Date().toISOString();
  const version = resolvePackageVersion(packageJsonPath);
  const buildId = process.env[`${envKeyPrefix}_BUILD_ID`]
    || process.env.APP_BUILD_ID
    || buildTimestamp;
  const env = normalizeEnvLabel(
    process.env[`${envKeyPrefix}_APP_ENV`]
      || process.env[`${envKeyPrefix}_ENV`]
      || process.env.APP_ENV
      || (mode === "production" ? "PROD" : mode.toUpperCase()),
  );

  return {
    appId,
    buildId,
    buildTimestamp,
    env,
    version,
  } satisfies AppBuildMetadata;
}

function createVersionMetadataPlugin(metadata: AppBuildMetadata) {
  const versionJson = JSON.stringify(metadata, null, 2);

  const plugin: Plugin = {
    name: "platform-app-version-metadata",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const requestPath = req.url?.split("?")[0];
        if (requestPath !== "/version.json") {
          next();
          return;
        }

        res.statusCode = 200;
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(versionJson);
      });
    },
    generateBundle(_options, _bundle, _isWrite) {
      this.emitFile({
        fileName: "version.json",
        source: versionJson,
        type: "asset",
      });
    },
  };

  return plugin;
}

export function createAppConfig({
  appId,
  hostName,
  packageJsonPath,
  port,
}: AppHostConfig): UserConfigFnObject {
  return ({ mode }) => {
    const metadata = resolveBuildMetadata(appId, packageJsonPath, mode);

    return {
      define: {
        __APP_BUILD_ID__: JSON.stringify(metadata.buildId),
        __APP_ENV__: JSON.stringify(metadata.env),
        __APP_VERSION__: JSON.stringify(metadata.version),
        __BUILD_TIMESTAMP__: JSON.stringify(metadata.buildTimestamp),
      },
      plugins: [react(), createVersionMetadataPlugin(metadata)],
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
  };
}
