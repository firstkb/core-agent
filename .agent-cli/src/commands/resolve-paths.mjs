import { getArtifactPaths, getTargetPaths, getTargetRequiredOptions, toPosix } from "../paths.mjs";

export async function runResolvePaths({ target, options }) {
  const module = options.module;
  const feature = options.feature;
  const requiredOptions = getTargetRequiredOptions(target);
  const checks = {};

  for (const optionName of requiredOptions) {
    checks[`${optionName}_provided`] = Boolean(options[optionName]);
  }

  const missingRequiredOptions = requiredOptions.filter((optionName) => !options[optionName]);

  if (missingRequiredOptions.length > 0) {
    const errors = [];

    for (const optionName of missingRequiredOptions) {
      errors.push(`missing required option: --${optionName}`);
    }

    return {
      ok: false,
      context: {
        target,
        module: module || null,
        feature: feature || null
      },
      checks,
      errors
    };
  }

  const artifactPaths = getArtifactPaths({ targetId: target, options });
  const targetPaths = getTargetPaths(target);

  return {
    ok: true,
    context: {
      target,
      module,
      feature
    },
    checks,
    errors: [],
    paths: {
      artifact_dir: toPosix(artifactPaths.artifactDir),
      readme_path: toPosix(artifactPaths.readmePath),
      status_path: toPosix(artifactPaths.statusPath),
      expected_readme: artifactPaths.expectedReadme,
      expected_status: artifactPaths.expectedStatus,
      artifacts: artifactPaths.expectedArtifactPaths,
      artifacts_root: artifactPaths.artifactsRoot,
      artifact_language: artifactPaths.artifactLanguage,
      package_root: toPosix(targetPaths.packageRoot),
      contracts_dir: toPosix(targetPaths.contractsDir),
      templates_dir: toPosix(targetPaths.templatesDir),
      contract_path: toPosix(targetPaths.contractPath),
      input_schema_path: toPosix(targetPaths.inputSchemaPath),
      output_schema_path: toPosix(targetPaths.outputSchemaPath),
      status_schema_path: toPosix(targetPaths.statusSchemaPath),
      readme_template_path: toPosix(targetPaths.readmeTemplatePath),
      status_template_path: toPosix(targetPaths.statusTemplatePath)
    }
  };
}
