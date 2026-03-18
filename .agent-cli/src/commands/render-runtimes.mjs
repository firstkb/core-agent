import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createResult } from "../lib/output.mjs";
import { CliError, invariant } from "../lib/errors.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function renderTemplate(template, values) {
  return template.replace(/{{([a-zA-Z0-9_]+)}}/g, (match, key) => {
    invariant(Object.hasOwn(values, key), `Missing template value: ${key}`, 6);
    return String(values[key]);
  });
}

function ensureTrailingNewline(text) {
  return text.endsWith("\n") ? text : `${text}\n`;
}

function buildStandardsSection(repoRoot) {
  const standardsRoot = path.join(repoRoot, ".agent-code", "standards");
  return fs.readdirSync(standardsRoot)
    .filter((entry) => entry.endsWith(".md"))
    .sort()
    .map((entry) => `- \`.agent-code/standards/${entry}\``)
    .join("\n");
}

function buildCriticalInvariants(agent) {
  return agent.critical_invariants.map((line) => `- ${line}`).join("\n");
}

function buildCodexAgentsRegistry(agents) {
  return Object.values(agents).map((agent) => {
    const configFile = path.relative(".codex", agent.generated_paths.codex_agent).replace(/\\/g, "/");
    return [
      `[agents.${agent.system_name}]`,
      `description = ${JSON.stringify(agent.descriptions.agent)}`,
      `nickname_candidates = [${JSON.stringify(agent.skill_nickname)}]`,
      `config_file = ${JSON.stringify(configFile)}`
    ].join("\n");
  }).join("\n\n");
}

function buildRenderTargets({ repoRoot, config, agents, skills, templates }) {
  const standardsSection = buildStandardsSection(repoRoot);
  const targets = [];

  targets.push({
    path: path.join(repoRoot, "AGENTS.md"),
    content: renderTemplate(templates.agents, {
      standards_section: standardsSection
    })
  });

  targets.push({
    path: path.join(repoRoot, ".cursor", "rules", "00-source-of-truth.md"),
    content: templates.cursorSourceOfTruth
  });

  targets.push({
    path: path.join(repoRoot, ".cursor", "rules", "10-routing.md"),
    content: templates.cursorRouting
  });

  targets.push({
    path: path.join(repoRoot, ".codex", "config.toml"),
    content: renderTemplate(templates.codexConfig, {
      codex_agents_registry: buildCodexAgentsRegistry(agents)
    })
  });

  for (const agent of Object.values(agents)) {
    targets.push({
      path: path.join(repoRoot, agent.generated_paths.cursor_agent),
      content: renderTemplate(templates.cursorAgent, {
        system_name: agent.system_name,
        agent_description: agent.descriptions.agent,
        cursor_model: agent.runtime.cursor_model,
        readonly: String(agent.runtime.readonly),
        is_background: String(agent.runtime.is_background),
        persona_name: agent.persona_name,
        skill_nickname: agent.skill_nickname,
        shared_agent_prompt: agent.source_paths.agent_prompt,
        critical_invariants: buildCriticalInvariants(agent)
      })
    });

    targets.push({
      path: path.join(repoRoot, agent.generated_paths.codex_agent),
      content: renderTemplate(templates.codexAgent, {
        system_name: agent.system_name,
        codex_model: agent.runtime.codex_model,
        codex_reasoning_effort: agent.runtime.codex_reasoning_effort,
        persona_name: agent.persona_name,
        skill_nickname: agent.skill_nickname,
        shared_agent_prompt: agent.source_paths.agent_prompt,
        critical_invariants_plain: buildCriticalInvariants(agent)
      })
    });
  }

  for (const skill of Object.values(skills)) {
    const agent = agents[skill.system_agent];
    invariant(agent, `Skill ${skill.name} references unknown agent ${skill.system_agent}`, 6);

    targets.push({
      path: path.join(repoRoot, skill.generated_path),
      content: renderTemplate(templates.repoSkill, {
        skill_nickname: skill.name,
        skill_description: skill.description,
        system_name: agent.system_name,
        persona_name: agent.persona_name,
        shared_skill_prompt: skill.prompt_path
      })
    });
  }

  return targets.map((target) => ({
    ...target,
    content: ensureTrailingNewline(target.content)
  }));
}

function writeFileIfChanged(filePath, content) {
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
  if (current === content) {
    return false;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return true;
}

export async function runRenderRuntimesCommand({ options = {} } = {}) {
  const configPath = path.join(REPO_ROOT, ".agent-code", "config.json");
  const agentsPath = path.join(REPO_ROOT, ".agent-code", "registry", "agents.json");
  const skillsPath = path.join(REPO_ROOT, ".agent-code", "registry", "skills.json");
  const renderRoot = path.join(REPO_ROOT, readJson(configPath).paths.render_root);

  const agents = readJson(agentsPath);
  const skills = readJson(skillsPath);
  const templates = {
    agents: readText(path.join(renderRoot, "AGENTS.md.tmpl")),
    codexAgent: readText(path.join(renderRoot, "codex-agent.toml.tmpl")),
    codexConfig: readText(path.join(renderRoot, "codex-config.toml.tmpl")),
    cursorAgent: readText(path.join(renderRoot, "cursor-agent.md.tmpl")),
    cursorRouting: readText(path.join(renderRoot, "cursor-rule-routing.md.tmpl")),
    cursorSourceOfTruth: readText(path.join(renderRoot, "cursor-rule-source-of-truth.md.tmpl")),
    repoSkill: readText(path.join(renderRoot, "repo-skill.md.tmpl"))
  };

  const targets = buildRenderTargets({
    repoRoot: REPO_ROOT,
    config: readJson(configPath),
    agents,
    skills,
    templates
  });

  if (options.check === true) {
    const mismatches = targets
      .filter((target) => !fs.existsSync(target.path) || fs.readFileSync(target.path, "utf8") !== target.content)
      .map((target) => target.path);

    if (mismatches.length > 0) {
      throw new CliError("Generated runtime adapters are out of date", 5, {
        files: mismatches,
        state: {
          check: true,
          mismatches: mismatches.length
        }
      });
    }

    return createResult("render-runtimes", {
      writes: [],
      files: targets.map((target) => target.path),
      state: {
        check: true,
        mismatches: 0
      }
    });
  }

  const writes = [];

  for (const target of targets) {
    if (writeFileIfChanged(target.path, target.content)) {
      writes.push(target.path);
    }
  }

  return createResult("render-runtimes", {
    writes,
    files: targets.map((target) => target.path),
    state: {
      rendered: targets.length,
      updated: writes.length
    }
  });
}
