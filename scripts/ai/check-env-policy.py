#!/usr/bin/env python3
"""Validate tracked environment-file policy.

Usage:
  python3 scripts/ai/check-env-policy.py --check
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


ENV_ROOT = "platform/backend/env/"
IGNORED_FALLBACK_DIRS = {
    ".git",
    ".venv",
    ".venv-ppe",
    ".venv-ppe311",
    "node_modules",
    "reference-code",
    "artifacts",
}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def fallback_files(root: Path) -> list[str]:
    out: list[str] = []
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in IGNORED_FALLBACK_DIRS for part in path.relative_to(root).parts):
            continue
        out.append(path.relative_to(root).as_posix())
    return sorted(out)


def git_ls_files(root: Path) -> list[str]:
    try:
        result = subprocess.run(
            ["git", "ls-files"],
            cwd=root,
            check=True,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except (FileNotFoundError, subprocess.CalledProcessError):
        return fallback_files(root)
    return [line for line in result.stdout.splitlines() if line]


def is_forbidden_env_file(rel: str) -> bool:
    if not rel.startswith(ENV_ROOT):
        return False
    name = rel.removeprefix(ENV_ROOT)
    if "/" in name:
        return False
    if name == "Untitled":
        return True
    return name.endswith(".env") and not name.endswith(".env.example")


def run_check() -> int:
    root = repo_root()
    tracked_or_fallback = git_ls_files(root)
    forbidden = sorted(rel for rel in tracked_or_fallback if is_forbidden_env_file(rel))

    if forbidden:
        print("Env policy violation detected:\n")
        for rel in forbidden:
            print(f"- {rel}: local env files must not be tracked; keep only *.env.example")
        return 1

    print("Env policy check passed.")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate tracked env-file policy")
    parser.add_argument("--check", action="store_true", required=True, help="Fail on env policy drift")
    return parser.parse_args()


def main() -> int:
    parse_args()
    return run_check()


if __name__ == "__main__":
    sys.exit(main())
