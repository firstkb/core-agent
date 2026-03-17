import fs from "node:fs";
import path from "node:path";

import { getRepoRoot } from "../config.mjs";

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function resolveMaybeAbsolute(repoRoot, value) {
  if (!value) {
    return repoRoot;
  }

  return path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
}

function renderTemplate(template, context) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(context, key)) {
      throw new Error(`Missing render context value: ${key}`);
    }

    return String(context[key]);
  });
}

function boolToYaml(value) {
  return value ? "true" : "false";
}

function buildBulletBlock(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function toTomlString(value) {
  return JSON.stringify(String(value));
}

function toTomlStringArray(values) {
  return `[${values.map((value) => toTomlString(value)).join(", ")}]`;
}

function loadTemplates(repoRoot) {
  const root = path.join(repoRoot, ".agent-code", "render");

  return {
    agentsMd: readText(path.join(root, "AGENTS.md.tmpl")),
    cursorAgent: readText(path.join(root, "cursor-agent.md.tmpl")),
    codexAgent: readText(path.join(root, "codex-agent.toml.tmpl")),
    repoSkill: readText(path.join(root, "repo-skill.md.tmpl")),
    cursorRuleSourceOfTruth: readText(path.join(root, "cursor-rule-source-of-truth.md.tmpl")),
    cursorRuleRouting: readText(path.join(root, "cursor-rule-routing.md.tmpl")),
    codexConfig: readText(path.join(root, "codex-config.toml.tmpl"))
  };
}

function buildStandardsSection(repoRoot) {
  const standardsDir = path.join(repoRoot, ".agent-code", "standards");

  return fs.readdirSync(standardsDir)
    .filter((entry) => entry.endsWith(".md"))
    .sort()
    .map((entry) => `- \`.agent-code/standards/${entry}\``)
    .join("\n");
}

function buildAgentsSection(agents) {
  return Object.values(agents)
    .map((agent) => `- \`${agent.system_name}\` — ${agent.role_summary}`)
    .join("\n");
}

function buildSkillsSection(skills) {
  return Object.values(skills)
    .map((skill) => `- \`${skill.name}\` — backed by \`${skill.system_agent}\`; ${skill.description}`)
    .join("\n");
}

function buildCodexAgentsRegistry(agents) {
  const codexRoot = ".codex";

  return Object.values(agents)
    .sort((left, right) => left.system_name.localeCompare(right.system_name))
    .map((agent) => {
      const configFile = toPosix(path.relative(codexRoot, agent.generated_paths.codex_agent));

      return [
        `[agents.${agent.system_name}]`,
        `description = ${toTomlString(agent.descriptions.agent)}`,
        `nickname_candidates = ${toTomlStringArray([agent.skill_nickname])}`,
        `config_file = ${toTomlString(configFile)}`
      ].join("\n");
    })
    .join("\n\n");
}

function buildAgentContext(agent) {
  return {
    system_name: agent.system_name,
    skill_nickname: agent.skill_nickname,
    persona_name: agent.persona_name,
    shared_agent_prompt: agent.source_paths.agent_prompt,
    shared_skill_prompt: agent.source_paths.skill_prompt,
    agent_description: agent.descriptions.agent,
    skill_description: agent.descriptions.skill,
    cursor_model: agent.runtime.cursor_model,
    readonly: boolToYaml(agent.runtime.readonly),
    is_background: boolToYaml(agent.runtime.is_background),
    codex_model: agent.runtime.codex_model,
    codex_reasoning_effort: agent.runtime.codex_reasoning_effort,
    critical_invariants: buildBulletBlock(agent.critical_invariants),
    critical_invariants_plain: buildBulletBlock(agent.critical_invariants)
  };
}

function buildRenderJobs(repoRoot) {
  const agents = readJson(path.join(repoRoot, ".agent-code", "registry", "agents.json"));
  const skills = readJson(path.join(repoRoot, ".agent-code", "registry", "skills.json"));
  const templates = loadTemplates(repoRoot);

  const jobs = [
    {
      relativePath: "AGENTS.md",
      content: renderTemplate(templates.agentsMd, {
        skills_section: buildSkillsSection(skills),
        agents_section: buildAgentsSection(agents),
        standards_section: buildStandardsSection(repoRoot)
      })
    },
    {
      relativePath: ".cursor/rules/00-source-of-truth.md",
      content: renderTemplate(templates.cursorRuleSourceOfTruth, {})
    },
    {
      relativePath: ".cursor/rules/10-routing.md",
      content: renderTemplate(templates.cursorRuleRouting, {})
    },
    {
      relativePath: ".codex/config.toml",
      content: renderTemplate(templates.codexConfig, {
        codex_agents_registry: buildCodexAgentsRegistry(agents)
      })
    }
  ];

  for (const agent of Object.values(agents)) {
    const context = buildAgentContext(agent);

    jobs.push(
      {
        relativePath: agent.generated_paths.cursor_agent,
        content: renderTemplate(templates.cursorAgent, context)
      },
      {
        relativePath: agent.generated_paths.codex_agent,
        content: renderTemplate(templates.codexAgent, context)
      },
      {
        relativePath: agent.generated_paths.repo_skill,
        content: renderTemplate(templates.repoSkill, context)
      }
    );
  }

  return { jobs, agents, skills };
}

export function renderRuntimes({ check = false, outputRoot } = {}) {
  const repoRoot = getRepoRoot();
  const resolvedOutputRoot = resolveMaybeAbsolute(repoRoot, outputRoot);
  const { jobs, agents, skills } = buildRenderJobs(repoRoot);
  const errors = [];
  const files = [];

  let filesWritten = 0;
  let filesChecked = 0;
  let driftDetected = false;

  for (const job of jobs) {
    const outputPath = path.join(resolvedOutputRoot, job.relativePath);
    const normalizedRelativePath = toPosix(path.relative(resolvedOutputRoot, outputPath));

    files.push(normalizedRelativePath);

    if (check) {
      filesChecked += 1;

      if (!fs.existsSync(outputPath)) {
        errors.push(`missing generated file: ${normalizedRelativePath}`);
        driftDetected = true;
        continue;
      }

      const existing = readText(outputPath);

      if (existing !== job.content) {
        errors.push(`generated file drifted: ${normalizedRelativePath}`);
        driftDetected = true;
      }

      continue;
    }

    ensureDir(outputPath);
    fs.writeFileSync(outputPath, job.content, "utf8");
    filesWritten += 1;
  }

  return {
    ok: check ? !driftDetected : true,
    target: "runtime_adapters",
    context: {
      mode: check ? "check" : "write",
      output_root: toPosix(path.relative(repoRoot, resolvedOutputRoot) || "."),
      agents: Object.keys(agents).length,
      skills: Object.keys(skills).length
    },
    checks: {
      registry_loaded: true,
      templates_loaded: true,
      agents_rendered: Object.keys(agents).length > 0,
      skills_rendered: Object.keys(skills).length > 0,
      files_written: check ? true : filesWritten === jobs.length,
      files_checked: check ? filesChecked === jobs.length : true,
      drift_free: check ? !driftDetected : true
    },
    errors,
    files
  };
}
