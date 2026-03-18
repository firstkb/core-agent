import { createResult } from "../lib/output.mjs";

export async function runRenderRuntimesCommand({ options = {} } = {}) {
  if (options.check === true) {
    return createResult("render-runtimes", {
      writes: [],
      files: [],
      context: {
        mode: "legacy_compatibility"
      },
      state: {
        check: true,
        mismatches: 0,
        compatibility_mode: "codex_native"
      }
    });
  }

  return createResult("render-runtimes", {
    writes: [],
    files: [],
    context: {
      mode: "legacy_compatibility"
    },
    state: {
      rendered: 0,
      updated: 0,
      compatibility_mode: "codex_native"
    }
  });
}
