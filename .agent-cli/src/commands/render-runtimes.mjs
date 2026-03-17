import { renderRuntimes } from "../lib/render-runtimes.mjs";

export async function runRenderRuntimes({ options }) {
  return renderRuntimes({
    check: Boolean(options.check),
    outputRoot: options["output-root"]
  });
}
