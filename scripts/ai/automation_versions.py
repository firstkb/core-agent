#!/usr/bin/env python3
"""Check or synchronize mirrored Atlas automation versions from automation-manifest.json.

Usage:
  python3 scripts/ai/automation_versions.py --check
  python3 scripts/ai/automation_versions.py --write
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


PATTERNS = {
    "skill": re.compile(r"^(Skill version:\s*)([^\n\r]+)$", re.MULTILINE),
    "prompt": re.compile(r"^(prompt_version:\s*)([^\n\r]+)$", re.MULTILINE),
    "template": re.compile(r"^(template_version:\s*)([^\n\r]+)$", re.MULTILINE),
}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.write_text(text, encoding="utf-8")


def load_manifest(root: Path) -> dict:
    manifest_path = root / "ai-memory/atlas/automation-manifest.json"
    if not manifest_path.exists():
        raise SystemExit("ai-memory/atlas/automation-manifest.json not found")
    return json.loads(read_text(manifest_path))


def collect_targets(root: Path, manifest: dict) -> list[dict]:
    targets: list[dict] = []

    skill = manifest["skill"]
    targets.append(
        {
            "kind": "skill",
            "path": root / skill.get("file", ".agents/skills/atlas/SKILL.md"),
            "expected": skill["version"],
            "pattern": PATTERNS["skill"],
        }
    )

    for name, meta in manifest["prompts"].items():
        targets.append(
            {
                "kind": f"prompt:{name}",
                "path": root / meta["file"],
                "expected": meta["version"],
                "pattern": PATTERNS["prompt"],
            }
        )

    for name, meta in manifest["templates"].items():
        targets.append(
            {
                "kind": f"template:{name}",
                "path": root / meta["file"],
                "expected": meta["version"],
                "pattern": PATTERNS["template"],
            }
        )

    return targets


def check_targets(targets: list[dict]) -> int:
    mismatches: list[str] = []
    for target in targets:
        text = read_text(target["path"])
        match = target["pattern"].search(text)
        if not match:
            raise SystemExit(
                f"Could not find mirrored version field for {target['kind']} in {target['path']}"
            )
        current = match.group(2).strip()
        if current != target["expected"]:
            mismatches.append(
                f"{target['kind']}: {target['path']} has {current}, expected {target['expected']}"
            )
    if mismatches:
        print("Automation version drift detected:\n")
        for item in mismatches:
            print(f"- {item}")
        return 1
    print("Automation versions are in sync.")
    return 0


def write_targets(targets: list[dict]) -> int:
    changed = 0
    for target in targets:
        text = read_text(target["path"])
        new_text, count = target["pattern"].subn(
            lambda m, expected=target["expected"]: f"{m.group(1)}{expected}",
            text,
            count=1,
        )
        if count == 0:
            raise SystemExit(
                f"Could not find mirrored version field for {target['kind']} in {target['path']}"
            )
        if new_text != text:
            write_text(target["path"], new_text)
            changed += 1
    print(f"Synchronized automation version mirrors in {changed} file(s).")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Check or sync mirrored automation versions")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--check", action="store_true", help="Fail if mirrored versions do not match the manifest")
    group.add_argument("--write", action="store_true", help="Rewrite mirrored versions from the manifest")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = repo_root()
    manifest = load_manifest(root)
    targets = collect_targets(root, manifest)
    if args.check:
        return check_targets(targets)
    return write_targets(targets)


if __name__ == "__main__":
    sys.exit(main())
