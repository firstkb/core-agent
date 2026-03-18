import fs from "node:fs";
function allocateNumericSuffix(entries, pattern) {
  let maxValue = 0;

  for (const entry of entries) {
    const match = entry.match(pattern);
    if (!match) {
      continue;
    }

    const numericValue = Number(match[1]);
    if (numericValue > maxValue) {
      maxValue = numericValue;
    }
  }

  return maxValue + 1;
}

function listDirectoryNames(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    return [];
  }

  return fs.readdirSync(directoryPath);
}

export function allocateAttemptId(attemptsRoot) {
  const nextValue = allocateNumericSuffix(listDirectoryNames(attemptsRoot), /^attempt-(\d{3})$/);
  return `attempt-${String(nextValue).padStart(3, "0")}`;
}
