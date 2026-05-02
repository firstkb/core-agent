#!/usr/bin/env python3
"""Validate tracked environment-file policy.

Usage:
  python3 scripts/checks/check_env_policy.py --check
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


ENV_ROOT = "platform/backend/env/"
EXPECTED_GITIGNORE_RULES = [
    "platform/backend/env/*.env",
    "!platform/backend/env/*.env.example",
    "platform/backend/env/Untitled",
]
FORBIDDEN_ENV_EXAMPLE_TERMS = [
    "esafesys",
]
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


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def is_forbidden_env_file(rel: str) -> bool:
    if not rel.startswith(ENV_ROOT):
        return False
    name = rel.removeprefix(ENV_ROOT)
    if "/" in name:
        return False
    if name == "Untitled":
        return True
    return name.endswith(".env") and not name.endswith(".env.example")


def check_gitignore(root: Path, errors: list[str]) -> None:
    gitignore = root / ".gitignore"
    if not gitignore.exists():
        errors.append(".gitignore: missing .gitignore")
        return

    lines = {line.strip() for line in read_text(gitignore).splitlines()}
    for rule in EXPECTED_GITIGNORE_RULES:
        if rule not in lines:
            errors.append(f".gitignore: missing env policy rule `{rule}`")


def check_tracked_env_files(tracked_or_fallback: list[str], errors: list[str]) -> None:
    for rel in sorted(rel for rel in tracked_or_fallback if is_forbidden_env_file(rel)):
        errors.append(f"{rel}: local env files must not be tracked; keep only *.env.example")


def check_env_example_identifiers(root: Path, tracked_or_fallback: list[str], errors: list[str]) -> None:
    for rel in tracked_or_fallback:
        if not rel.startswith(ENV_ROOT) or not rel.endswith(".env.example"):
            continue
        path = root / rel
        if not path.exists():
            continue
        text = read_text(path).lower()
        for term in FORBIDDEN_ENV_EXAMPLE_TERMS:
            if term in text:
                errors.append(f"{rel}: env example contains organization-specific identifier `{term}`")


def run_check() -> int:
    root = repo_root()
    tracked_or_fallback = git_ls_files(root)
    errors: list[str] = []

    check_gitignore(root, errors)
    check_tracked_env_files(tracked_or_fallback, errors)
    check_env_example_identifiers(root, tracked_or_fallback, errors)

    if errors:
        print("Env policy violation detected:\n")
        for error in errors:
            print(f"- {error}")
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
