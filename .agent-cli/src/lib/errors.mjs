export class CliError extends Error {
  constructor(message, exitCode = 1, details = {}) {
    super(message);
    this.name = "CliError";
    this.exitCode = exitCode;
    this.details = details;
  }
}

export function invariant(condition, message, exitCode = 3, details = {}) {
  if (!condition) {
    throw new CliError(message, exitCode, details);
  }
}
