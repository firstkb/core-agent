#!/usr/bin/env node

import { runFeatureCommand } from "../src/commands/feature.mjs";
import { runModuleCommand } from "../src/commands/module.mjs";
import { runRenderRuntimesCommand } from "../src/commands/render-runtimes.mjs";
import { runStageCommand } from "../src/commands/stage.mjs";
import { CliError } from "../src/lib/errors.mjs";

const TOP_LEVEL_USAGE = `Usage: node .agent-cli/bin/agent-stack.mjs <module|feature|stage> <subcommand> [options]
       node .agent-cli/bin/agent-stack.mjs render-runtimes [--check] [--json]

Scope help:
  node .agent-cli/bin/agent-stack.mjs module --help
  node .agent-cli/bin/agent-stack.mjs feature --help
  node .agent-cli/bin/agent-stack.mjs stage --help`;

const HELP_TEXT = {
  renderRuntimes: `Usage: node .agent-cli/bin/agent-stack.mjs render-runtimes [--check] [--json]

Renders generated runtime adapters from .agent-code source-of-truth files.
Use --check to verify adapters are already in sync without writing changes.`,
  module: `Usage: node .agent-cli/bin/agent-stack.mjs module <subcommand> [options]

Subcommands:
  init                       --module <module_id> [--artifacts-root <root>] [--json]
  submit-for-brief-approval  --module <module_id> [--artifacts-root <root>] [--json]
  return-to-discussion       --module <module_id> [--artifacts-root <root>] [--json]
  record-owner-approval      --module <module_id> --approval <brief|execution> [--artifacts-root <root>] [--json]
  freeze-brief               --module <module_id> [--artifacts-root <root>] [--json]
  prepare-execution          --module <module_id> [--artifacts-root <root>] [--json]`,
  feature: `Usage: node .agent-cli/bin/agent-stack.mjs feature <subcommand> [options]

Subcommands:
  seed            --module <module_id> --feature <feature_id> [--artifacts-root <root>] [--json]
  set-next-stage  --module <module_id> --feature <feature_id> --stage <stage_id> [--artifacts-root <root>] [--json]`,
  stage: `Usage: node .agent-cli/bin/agent-stack.mjs stage <subcommand> [options]

Subcommands:
  start           --module <module_id> --feature <feature_id> --stage <stage_id> --agent <agent_id> [--artifacts-root <root>] [--json]
  submit-handoff  --module <module_id> --feature <feature_id> --stage <stage_id> --from <handoff.json> --readme <README.md> [--artifacts-root <root>] [--json]
  review          --module <module_id> --feature <feature_id> --stage <stage_id> --attempt <attempt_id> --decision <accept|revise> --reason "<reason>" [--next-stage <stage_id> | --complete] [--artifacts-root <root>] [--json]`
};

const SUBCOMMAND_HELP = {
  module: {
    init: `Usage: node .agent-cli/bin/agent-stack.mjs module init --module <module_id> [--artifacts-root <root>] [--json]

Creates the module root and module status.json in phase discussion.
This command does not create brief.md content.`,
    "submit-for-brief-approval": `Usage: node .agent-cli/bin/agent-stack.mjs module submit-for-brief-approval --module <module_id> [--artifacts-root <root>] [--json]

Moves the module from discussion to awaiting_owner_brief_approval after brief.md exists and is non-empty.`,
    "return-to-discussion": `Usage: node .agent-cli/bin/agent-stack.mjs module return-to-discussion --module <module_id> [--artifacts-root <root>] [--json]

Moves the module from awaiting_owner_brief_approval back to discussion.`,
    "record-owner-approval": `Usage: node .agent-cli/bin/agent-stack.mjs module record-owner-approval --module <module_id> --approval <brief|execution> [--artifacts-root <root>] [--json]

Records the requested owner approval without mutating Markdown artifacts.`,
    "freeze-brief": `Usage: node .agent-cli/bin/agent-stack.mjs module freeze-brief --module <module_id> [--artifacts-root <root>] [--json]

Marks brief.md as approved and frozen after owner brief approval is already recorded.`,
    "prepare-execution": `Usage: node .agent-cli/bin/agent-stack.mjs module prepare-execution --module <module_id> [--artifacts-root <root>] [--json]

Moves the module to awaiting_owner_execution_approval after at least one feature exists and each feature has README.md plus status.json.`
  },
  feature: {
    seed: `Usage: node .agent-cli/bin/agent-stack.mjs feature seed --module <module_id> --feature <feature_id> [--artifacts-root <root>] [--json]

Creates the feature root and feature status.json while leaving feature README.md to the AI author.`,
    "set-next-stage": `Usage: node .agent-cli/bin/agent-stack.mjs feature set-next-stage --module <module_id> --feature <feature_id> --stage <stage_id> [--artifacts-root <root>] [--json]

Sets the next planned stage for a seeded or ready_for_stage feature.`
  },
  stage: {
    start: `Usage: node .agent-cli/bin/agent-stack.mjs stage start --module <module_id> --feature <feature_id> --stage <stage_id> --agent <agent_id> [--artifacts-root <root>] [--json]

Allocates the next attempt directory and marks the feature stage as in progress.`,
    "submit-handoff": `Usage: node .agent-cli/bin/agent-stack.mjs stage submit-handoff --module <module_id> --feature <feature_id> --stage <stage_id> --from <handoff.json> --readme <README.md> [--artifacts-root <root>] [--json]

Copies the AI-authored handoff.json and attempt README.md into the active attempt and moves the feature to awaiting_review.`,
    review: `Usage: node .agent-cli/bin/agent-stack.mjs stage review --module <module_id> --feature <feature_id> --stage <stage_id> --attempt <attempt_id> --decision <accept|revise> --reason "<reason>" [--next-stage <stage_id> | --complete] [--artifacts-root <root>] [--json]

Appends the orchestrator decision block to the attempt README.md and updates feature/module state.`
  }
};

function printHelp(text) {
  process.stdout.write(`${text}\n`);
}

function parseArgs(argv) {
  const positional = [];
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      options[key] = true;
      continue;
    }

    options[key] = next;
    index += 1;
  }

  return { positional, options };
}

function printHuman(result) {
  const stream = result.ok ? process.stdout : process.stderr;
  const marker = result.ok ? "PASS" : "FAIL";
  stream.write(`${marker} ${result.command}\n`);

  if (result.context) {
    const entries = Object.entries(result.context)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => `${key}=${value}`);

    if (entries.length > 0) {
      stream.write(`${entries.join(" ")}\n`);
    }
  }

  for (const [name, value] of Object.entries(result.state || {})) {
    stream.write(`- ${name}: ${value}\n`);
  }

  for (const filePath of result.writes || []) {
    stream.write(`- write: ${filePath}\n`);
  }

  for (const error of result.errors || []) {
    stream.write(`  error: ${error}\n`);
  }
}

const scopeHandlers = {
  module: runModuleCommand,
  feature: runFeatureCommand,
  stage: runStageCommand
};

async function main() {
  const { positional, options } = parseArgs(process.argv.slice(2));
  const [scope, subcommand] = positional;

  if ((!scope && options.help) || scope === "help") {
    printHelp(TOP_LEVEL_USAGE);
    process.exit(0);
  }

  if (scope === "render-runtimes") {
    if (options.help) {
      printHelp(HELP_TEXT.renderRuntimes);
      process.exit(0);
    }

    try {
      const result = await runRenderRuntimesCommand({ options });
      const output = {
        scope,
        subcommand: null,
        ...result
      };

      if (options.json) {
        process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
      } else {
        printHuman(output);
      }

      process.exit(0);
    } catch (error) {
      if (error instanceof CliError) {
        const payload = {
          ok: false,
          scope,
          subcommand: null,
          command: "render-runtimes",
          errors: [error.message],
          ...error.details
        };

        if (options.json) {
          process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
        } else {
          printHuman(payload);
        }

        process.exit(error.exitCode);
      }

      console.error(`Command failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(7);
    }
  }

  if (scope && options.help && !subcommand && HELP_TEXT[scope]) {
    printHelp(HELP_TEXT[scope]);
    process.exit(0);
  }

  if (!scope || !subcommand) {
    console.error(TOP_LEVEL_USAGE);
    process.exit(2);
  }

  const handler = scopeHandlers[scope];

  if (!handler) {
    console.error(`Unsupported command scope: ${scope}`);
    process.exit(2);
  }

  if (options.help) {
    const helpText = SUBCOMMAND_HELP[scope]?.[subcommand] || HELP_TEXT[scope];
    printHelp(helpText);
    process.exit(0);
  }

  try {
    const result = await handler({ subcommand, options });
    const output = {
      scope,
      subcommand,
      ...result
    };

    if (options.json) {
      process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    } else {
      printHuman(output);
    }

    process.exit(0);
  } catch (error) {
    if (error instanceof CliError) {
      const payload = {
        ok: false,
        scope,
        subcommand,
        command: `${scope} ${subcommand}`,
        errors: [error.message],
        ...error.details
      };

      if (options.json) {
        process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
      } else {
        printHuman(payload);
      }

      process.exit(error.exitCode);
    }

    console.error(`Command failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(7);
  }
}

await main();
