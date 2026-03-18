export function createResult(command, {
  ok = true,
  writes = [],
  state = {},
  context = {},
  errors = [],
  files = []
} = {}) {
  return {
    ok,
    command,
    writes,
    state,
    context,
    errors,
    files
  };
}
