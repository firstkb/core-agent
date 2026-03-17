#!/usr/bin/env node

import { runRenderRuntimes } from "../src/commands/render-runtimes.mjs";
import { runValidateArtifacts } from "../src/commands/validate-artifacts.mjs";
import { runValidateInput } from "../src/commands/validate-input.mjs";
import { runValidateModule } from "../src/commands/validate-module.mjs";
import { runResolvePaths } from "../src/commands/resolve-paths.mjs";

function parseArgs(argv) {
  const positional = [];
  const options = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = argv[i + 1];

    if (!next || next.startsWith("--")) {
      options[key] = true;
      continue;
    }

    options[key] = next;
    i += 1;
  }

  return { positional, options };
}

function printHuman(result) {
  const stream = result.ok ? process.stdout : process.stderr;
  const marker = result.ok ? "PASS" : "FAIL";
  stream.write(`${marker} ${result.command}${result.target ? `:${result.target}` : ""}\n`);

  if (result.context) {
    const entries = Object.entries(result.context)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => `${key}=${value}`);

    if (entries.length > 0) {
      stream.write(`${entries.join(" ")}\n`);
    }
  }

  for (const [name, value] of Object.entries(result.checks || {})) {
    stream.write(`- ${name}: ${value ? "ok" : "fail"}\n`);
  }

  if (result.paths) {
    for (const [name, value] of Object.entries(result.paths)) {
      stream.write(`- ${name}: ${value}\n`);
    }
  }

  if (Array.isArray(result.files)) {
    for (const value of result.files) {
      stream.write(`- file: ${value}\n`);
    }
  }

  for (const error of result.errors || []) {
    stream.write(`  error: ${error}\n`);
  }
}

const commands = {
  "validate-input": { handler: runValidateInput, requiresTarget: true },
  "resolve-paths": { handler: runResolvePaths, requiresTarget: true },
  "validate-artifacts": { handler: runValidateArtifacts, requiresTarget: true },
  "validate-module": { handler: runValidateModule, requiresTarget: true },
  "render-runtimes": { handler: runRenderRuntimes, requiresTarget: false }
};

async function main() {
  const { positional, options } = parseArgs(process.argv.slice(2));
  const [command, maybeTarget] = positional;

  if (!command) {
    console.error("Usage: node .agent-cli/bin/agent-stack.mjs <command> [target] [options]");
    process.exit(2);
  }

  const commandDefinition = commands[command];

  if (!commandDefinition) {
    console.error(`Unsupported command: ${command}`);
    process.exit(2);
  }

  if (commandDefinition.requiresTarget && !maybeTarget) {
    console.error(`Usage: node .agent-cli/bin/agent-stack.mjs ${command} <target> [options]`);
    process.exit(2);
  }

  const target = commandDefinition.requiresTarget ? maybeTarget : undefined;

  try {
    const result = await commandDefinition.handler({ target, options });
    const output = { command, target, ...result };

    if (options.json) {
      process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    } else {
      printHuman(output);
    }

    process.exit(output.ok ? 0 : 1);
  } catch (error) {
    console.error(`Command failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

await main();
