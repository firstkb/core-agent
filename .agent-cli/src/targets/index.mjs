export const TARGETS = Object.freeze({
  module_orchestrator: {
    id: "module_orchestrator",
    packageRoot: ".agent-code/contracts/module_orchestrator",
    contractsDir: ".agent-code/contracts/module_orchestrator",
    templatesDir: ".agent-code/templates/module_orchestrator"
  },
  research_codebase: {
    id: "research_codebase",
    packageRoot: ".agent-code/contracts/research_codebase",
    contractsDir: ".agent-code/contracts/research_codebase",
    templatesDir: ".agent-code/templates/research_codebase"
  }
});

export function getTargetDefinition(targetId) {
  const target = TARGETS[targetId];

  if (!target) {
    throw new Error(`Unsupported CLI target: ${targetId}`);
  }

  return target;
}
