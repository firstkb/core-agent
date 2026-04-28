#!/usr/bin/env python3
"""Validate docs and ai-memory routing invariants.

Usage:
  python3 scripts/ai/docs_memory_check.py --check
"""
from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote


RETIRED_REFERENCE_DIRS = [
    "platform/frontend/docs/metronic",
    "platform/frontend/docs/platform-studio/EXTDB",
    "platform/frontend/docs/platform-studio/ezform",
    "platform/frontend/docs/platform-studio/smartapp",
    "platform/frontend/docs/platform-studio/old-code-reference",
    "platform/backend/docs/MSSQL",
]

FORBIDDEN_POINTER_MARKERS = [
    "This document has been compacted into:",
    "This document has moved to:",
    "This document is no longer the active source",
    "no longer the active source for current auth behavior",
    "Status: compatibility pointer",
    "Status: archive compatibility pointer",
    "Status: future proposal pointer",
]

DELETED_FORM_BUILDER_DOCS = [
    "platform/frontend/docs/platform-studio/form-builder-advanced-fields.md",
    "platform/frontend/docs/platform-studio/form-builder-content-nodes.md",
    "platform/frontend/docs/platform-studio/form-builder-field-rules-contract.md",
    "platform/frontend/docs/platform-studio/form-builder-grid-columns-contract.md",
    "platform/frontend/docs/platform-studio/form-builder-subform-checklist-contract.md",
    "platform/frontend/docs/platform-studio/form-builder-choice-fields.md",
    "platform/frontend/docs/platform-studio/form-builder-ready-made-fields.md",
    "platform/frontend/docs/platform-studio/form-builder-suggest-text-field-contract-v1.md",
    "platform/frontend/docs/platform-studio/form-builder-schema-scope-contract.md",
]

LOCAL_LINK_SCOPES = [
    "AGENTS.md",
    "AGENTS_NAME.md",
    "docs",
    "ai-memory",
    "platform/AGENTS.md",
    "platform/README.md",
    "platform/frontend/docs",
    "platform/backend/docs",
    ".agents",
    ".codex",
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

OLD_PRODUCT_IDENTITY_TERMS = [
    "Ramp Platform v108",
    "RAMP Platform v108",
    "ramp-platform-v108",
]

OLD_PRODUCT_IDENTITY_ALLOWED_FILES = {
    "ai-memory/durable/current-state.md",
    "ai-memory/durable/decisions-log.md",
    "ai-memory/docs/docs-migration-plan.md",
}

OLD_PRODUCT_IDENTITY_ALLOWED_MARKERS = [
    "historical working name",
    "retired",
    "old",
    "archive",
    "historical",
]

OLD_ATLAS_INVOCATION_TERMS = [
    "$ramp-conductor",
    ".agents/skills/ramp-conductor",
]

OLD_ATLAS_INVOCATION_ALLOWED_FILES = {
    "ai-memory/durable/decisions-log.md",
    "scripts/ai/docs_memory_check.py",
}

ACTIVE_RUN_FINAL_REQUIRED_MARKERS = [
    "Status: awaiting-owner-review",
    "Next owner action:",
    "Last updated:",
]

PRODUCT_IDENTITY_SCAN_SCOPES = [
    "AGENTS.md",
    "README.md",
    "docs",
    "ai-memory",
    "platform/AGENTS.md",
    "platform/README.md",
    "platform/frontend/AGENTS.md",
    "platform/backend/AGENTS.md",
    "platform/frontend/docs",
    "platform/backend/docs",
    ".agents",
    "scripts/ai/new-run.py",
]

READ_ORDER_SURFACES = [
    "platform/AGENTS.md",
    "platform/frontend/AGENTS.md",
    "platform/backend/AGENTS.md",
    ".agents/skills/atlas/SKILL.md",
    ".agents/skills/scribe/SKILL.md",
    "ai-memory/atlas/README.md",
    "ai-memory/README.md",
    "ai-memory/START_HERE.md",
    "ai-memory/agent-workflow.md",
    "ai-memory/atlas/prompts/control-chat-prompt-v1.md",
    "ai-memory/atlas/prompts/frontend-prompt-v1.md",
    "ai-memory/atlas/prompts/frontend-prompt-compact-v1.md",
    "ai-memory/atlas/prompts/backend-prompt-v1.md",
    "ai-memory/atlas/prompts/backend-prompt-compact-v1.md",
    "ai-memory/atlas/templates/chat-start.md",
]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def fallback_files(root: Path) -> list[str]:
    out: list[str] = []
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        rel_path = path.relative_to(root)
        if any(part in IGNORED_FALLBACK_DIRS for part in rel_path.parts):
            continue
        out.append(rel_path.as_posix())
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


def add_error(errors: list[str], path: Path | str, message: str) -> None:
    errors.append(f"{path}: {message}")


def tracked_existing_markdown(root: Path, tracked: list[str]) -> list[Path]:
    paths: list[Path] = []
    for rel in tracked:
        if not rel.endswith(".md"):
            continue
        if not any(rel == scope or rel.startswith(f"{scope}/") for scope in LOCAL_LINK_SCOPES):
            continue
        path = root / rel
        if path.exists():
            paths.append(path)
    return paths


def strip_fenced_code(text: str) -> str:
    return re.sub(r"```.*?```", "", text, flags=re.DOTALL)


def markdown_link_targets(text: str) -> list[str]:
    body = strip_fenced_code(text)
    return re.findall(r"(?<!!)\[[^\]\n]+\]\(([^)\n]+)\)", body)


def normalize_link_target(raw_target: str) -> str | None:
    target = raw_target.strip()
    if not target:
        return None
    if target.startswith("<"):
        end = target.find(">")
        if end == -1:
            return None
        target = target[1:end]
    else:
        target = target.split()[0]

    target = unquote(target)
    target = target.split("#", 1)[0].split("?", 1)[0]
    if not target or target.startswith("#"):
        return None
    if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", target):
        return None
    if target.startswith("{") or target.startswith("$"):
        return None
    return target


def should_check_target(target: str) -> bool:
    if target.startswith("/"):
        repo_abs_prefixes = ("/docs/", "/ai-memory/", "/platform/", "/AGENTS.md")
        return target.startswith(repo_abs_prefixes)
    return True


def resolve_link(root: Path, source: Path, target: str) -> Path:
    if target.startswith("/"):
        return root / target.lstrip("/")
    return (source.parent / target).resolve()


def check_markdown_links(root: Path, paths: list[Path], errors: list[str]) -> None:
    for path in paths:
        text = read_text(path)
        for raw_target in markdown_link_targets(text):
            target = normalize_link_target(raw_target)
            if target is None or not should_check_target(target):
                continue
            resolved = resolve_link(root, path, target)
            try:
                resolved.relative_to(root)
            except ValueError:
                add_error(errors, path.relative_to(root), f"link escapes repo: {raw_target}")
                continue
            if not resolved.exists():
                add_error(errors, path.relative_to(root), f"broken markdown link: {raw_target}")


def check_reference_code_retirement(root: Path, errors: list[str]) -> None:
    for rel in RETIRED_REFERENCE_DIRS:
        path = root / rel
        if path.exists():
            add_error(errors, rel, "retired reference-code docs directory must not exist")

    active_scan_roots = [
        root / "docs/ref",
        root / "platform/frontend/docs",
        root / "platform/backend/docs",
        root / "ai-memory/index",
    ]
    retired_prefixes = [f"{rel}/" for rel in RETIRED_REFERENCE_DIRS]
    retired_prefixes.append("platform/backend/docs/MSSQL/**")

    for scan_root in active_scan_roots:
        if not scan_root.exists():
            continue
        for path in scan_root.rglob("*.md"):
            text = read_text(path)
            for retired in retired_prefixes:
                if retired in text:
                    add_error(errors, path.relative_to(root), f"active docs mention retired raw-pack path `{retired}`")


def check_root_file_sets(root: Path, errors: list[str]) -> None:
    expected = {
        "platform/frontend/docs": {"README.md"},
        "platform/backend/docs": {"README.md"},
        "docs/ref": {"README.md", "reference-code.md"},
    }
    for rel, allowed in expected.items():
        folder = root / rel
        if not folder.exists():
            add_error(errors, rel, "required docs folder is missing")
            continue
        files = {path.name for path in folder.iterdir() if path.is_file()}
        extra = sorted(files - allowed)
        missing = sorted(allowed - files)
        if extra:
            add_error(errors, rel, f"unexpected root file(s): {', '.join(extra)}")
        if missing:
            add_error(errors, rel, f"missing root file(s): {', '.join(missing)}")


def check_retired_memory_paths(root: Path, errors: list[str]) -> None:
    if (root / "platform/docs/ai").exists():
        add_error(errors, "platform/docs/ai", "retired legacy memory path must not exist")
    if (root / ".agents/skills/ramp-conductor").exists():
        add_error(errors, ".agents/skills/ramp-conductor", "retired Atlas skill path must not exist; use .agents/skills/atlas")
    if not (root / ".agents/skills/atlas/SKILL.md").exists():
        add_error(errors, ".agents/skills/atlas/SKILL.md", "Atlas skill must exist at the canonical path")
    if (root / "ai-memory/AGENTS.override.md").exists():
        add_error(errors, "ai-memory/AGENTS.override.md", "retired override file must not exist")
    if not (root / "ai-memory/START_HERE.md").exists():
        add_error(errors, "ai-memory/START_HERE.md", "first-read memory file must exist")


def check_active_run_policy(root: Path, errors: list[str]) -> None:
    active_root = root / "ai-memory/runs/active"
    if not active_root.exists():
        add_error(errors, "ai-memory/runs/active", "active run folder must exist")
        return

    for run_dir in sorted(path for path in active_root.iterdir() if path.is_dir()):
        rel = run_dir.relative_to(root)
        if not (run_dir / "task.md").exists():
            add_error(errors, rel, "active run must include task.md")

        final = run_dir / "final.md"
        if not final.exists():
            continue

        final_text = read_text(final)
        missing = [marker for marker in ACTIVE_RUN_FINAL_REQUIRED_MARKERS if marker not in final_text]
        if missing:
            add_error(
                errors,
                final.relative_to(root),
                "active run final.md must either be archived or include explicit awaiting-owner-review closure markers: "
                + ", ".join(missing),
            )


def check_product_identity(root: Path, tracked: list[str], errors: list[str]) -> None:
    skill = root / ".agents/skills/atlas/SKILL.md"
    if skill.exists():
        skill_text = read_text(skill)
        for marker in ["name: atlas", "VSM v1.0.0", "$atlas"]:
            if marker not in skill_text:
                add_error(errors, skill.relative_to(root), f"missing Atlas identity marker `{marker}`")

    for rel in tracked:
        if not any(rel == scope or rel.startswith(f"{scope}/") for scope in PRODUCT_IDENTITY_SCAN_SCOPES):
            continue
        if "/archive/" in rel or rel.startswith("ai-memory/runs/") or rel.startswith("artifacts/"):
            continue
        path = root / rel
        if not path.exists() or not path.is_file():
            continue
        try:
            text = read_text(path)
        except UnicodeDecodeError:
            continue
        for term in OLD_PRODUCT_IDENTITY_TERMS:
            if term in text:
                if rel in OLD_PRODUCT_IDENTITY_ALLOWED_FILES:
                    bad_lines = [
                        line
                        for line in text.splitlines()
                        if term in line
                        and not any(marker in line.lower() for marker in OLD_PRODUCT_IDENTITY_ALLOWED_MARKERS)
                    ]
                    if not bad_lines:
                        continue
                add_error(errors, rel, f"uses retired current-product identity `{term}`; use VSM v1.0.0")
        for term in OLD_ATLAS_INVOCATION_TERMS:
            if term in text and rel not in OLD_ATLAS_INVOCATION_ALLOWED_FILES:
                add_error(errors, rel, f"uses retired Atlas invocation/path `{term}`; use $atlas and .agents/skills/atlas")


def check_platform_readme(root: Path, errors: list[str]) -> None:
    path = root / "platform/README.md"
    if not path.exists():
        add_error(errors, "platform/README.md", "platform README is missing")
        return
    text = read_text(path)
    layout = re.search(r"## Current layout\s+```text\n(.*?)```", text, flags=re.DOTALL)
    if layout and re.search(r"(^|\n)\s+ai/\s*(\n|$)", layout.group(1)):
        add_error(errors, path.relative_to(root), "current layout must not list retired platform/docs/ai")
    if "`ai-memory/START_HERE.md`" not in text:
        add_error(errors, path.relative_to(root), "read order must include ai-memory/START_HERE.md")


def check_docs_migration_plan_status(root: Path, errors: list[str]) -> None:
    path = root / "ai-memory/docs/docs-migration-plan.md"
    if not path.exists():
        add_error(errors, path.relative_to(root), "docs migration plan is missing")
        return
    text = read_text(path)
    if "Status: historical migration record" not in text:
        add_error(errors, path.relative_to(root), "migration plan must be historical, not current operational status")
    if "ai-memory/docs/docs-memory-score-audit.md" not in text:
        add_error(errors, path.relative_to(root), "migration plan must point to the current readiness score owner")
    if re.search(r"overall readiness is \d+/?100", text, flags=re.IGNORECASE):
        add_error(errors, path.relative_to(root), "migration plan must not claim a current readiness score")
    if "96/100 readiness score" in text:
        add_error(errors, path.relative_to(root), "historical score must not be phrased as an active readiness score")


def check_semantic_drift_pointers(root: Path, errors: list[str]) -> None:
    read_routes = root / "ai-memory/index/read-routes.yaml"
    if read_routes.exists():
        text = read_text(read_routes)
        if "# Use this after memory-index.yaml" in text:
            add_error(errors, read_routes.relative_to(root), "read-routes header must follow START_HERE-first read order")

    atlas_readme = root / "ai-memory/atlas/README.md"
    if atlas_readme.exists():
        text = read_text(atlas_readme)
        if "read `ai-memory/index/memory-index.yaml` and" in text:
            add_error(errors, atlas_readme.relative_to(root), "Atlas read rule must not put memory-index before START_HERE")

    automation_versions = root / "scripts/ai/automation_versions.py"
    if automation_versions.exists() and ".agents/skills/ramp-conductor/SKILL.md" in read_text(automation_versions):
        add_error(errors, automation_versions.relative_to(root), "automation fallback must use .agents/skills/atlas/SKILL.md")

    archive_readme = root / "platform/docs/archive/agent-prompts/README.md"
    if archive_readme.exists() and "platform/docs/ai/*" in read_text(archive_readme):
        add_error(errors, archive_readme.relative_to(root), "archive README must not point canonical memory to retired platform/docs/ai")


def check_agents_name_status(root: Path, errors: list[str]) -> None:
    path = root / "AGENTS_NAME.md"
    if not path.exists():
        return
    text = read_text(path)
    required = [
        "Status: non-authoritative draft",
        "Canonical agent roles are defined in:",
        "Do not use this file as active runtime naming or role routing.",
    ]
    for marker in required:
        if marker not in text:
            add_error(errors, path.relative_to(root), f"missing non-authoritative marker `{marker}`")


def check_pointer_markers(root: Path, errors: list[str]) -> None:
    scan_roots = [root / "platform/frontend/docs", root / "platform/backend/docs"]
    for scan_root in scan_roots:
        if not scan_root.exists():
            continue
        for path in scan_root.rglob("*.md"):
            text = read_text(path)
            for marker in FORBIDDEN_POINTER_MARKERS:
                if marker in text:
                    add_error(errors, path.relative_to(root), f"forbidden pointer marker `{marker}`")


def check_form_builder_policy(root: Path, errors: list[str]) -> None:
    frontend_docs_root = root / "platform/frontend/docs"
    for path in frontend_docs_root.rglob("*.md"):
        text = read_text(path)
        for deleted in DELETED_FORM_BUILDER_DOCS:
            if deleted in text:
                add_error(errors, path.relative_to(root), f"references deleted Form Builder exact-detail doc `{deleted}`")

    platform_studio = root / "platform/frontend/docs/platform-studio"
    count = 0
    if platform_studio.exists():
        for path in platform_studio.rglob("*.md"):
            if "Status: exact detail reference" in read_text(path):
                count += 1
    if count != 14:
        add_error(errors, platform_studio.relative_to(root), f"expected 14 retained exact-detail docs, found {count}")

    audit = root / "ai-memory/docs/frontend/platform-studio/form-builder-exact-detail-consolidation-audit.md"
    if not audit.exists():
        add_error(errors, audit.relative_to(root), "Form Builder consolidation audit is missing")
        return
    audit_text = read_text(audit)
    expected_metrics = [
        "`keep_exact_detail`: 14",
        "`compact_more_then_delete`: 0",
        "`deleted_after_payload_extraction`: 9",
    ]
    for metric in expected_metrics:
        if metric not in audit_text:
            add_error(errors, audit.relative_to(root), f"missing audit metric `{metric}`")


def check_gitignore(root: Path, errors: list[str]) -> None:
    gitignore = root / ".gitignore"
    if not gitignore.exists():
        add_error(errors, ".gitignore", "missing .gitignore")
        return
    lines = {line.strip() for line in read_text(gitignore).splitlines()}
    if "reference-code/" not in lines and "/reference-code/" not in lines:
        add_error(errors, ".gitignore", "reference-code/ must stay ignored")
    if "ai-memory/local/" not in lines:
        add_error(errors, ".gitignore", "ai-memory/local/ must stay ignored for local-only agent credentials")
    if "platform/frontend/storybook-static/" not in lines:
        add_error(errors, ".gitignore", "Storybook static build output must stay ignored")
    if "platform/docs/ai/" not in lines:
        add_error(errors, ".gitignore", "retired platform/docs/ai/ must stay ignored")

def check_preflight_policy(root: Path, errors: list[str]) -> None:
    path = root / "scripts/ai/preflight.sh"
    if not path.exists():
        add_error(errors, "scripts/ai/preflight.sh", "lightweight local preflight script must exist")
        return
    if not os.access(path, os.X_OK):
        add_error(errors, path.relative_to(root), "preflight script must be executable")

    text = read_text(path)
    for marker in ["--lite", "--full", "--docs", "not a GitHub Actions gate"]:
        if marker not in text:
            add_error(errors, path.relative_to(root), f"missing preflight contract marker `{marker}`")

    workflow_root = root / ".github/workflows"
    if workflow_root.exists():
        for workflow in workflow_root.rglob("*"):
            if workflow.is_file() and "preflight.sh" in read_text(workflow):
                add_error(errors, workflow.relative_to(root), "preflight must stay manual/local until owner promotes it to a CI gate")


def check_read_order_policy(root: Path, errors: list[str]) -> None:
    for rel in READ_ORDER_SURFACES:
        path = root / rel
        if not path.exists():
            add_error(errors, rel, "read-order surface is missing")
            continue

        text = read_text(path)
        start_index = text.find("ai-memory/START_HERE.md")
        routes_index = text.find("ai-memory/index/read-routes.yaml")
        memory_index = text.find("ai-memory/index/memory-index.yaml")

        if start_index == -1:
            add_error(errors, path.relative_to(root), "default read order must include ai-memory/START_HERE.md")
            continue
        if routes_index == -1:
            add_error(errors, path.relative_to(root), "default read order must include ai-memory/index/read-routes.yaml")
        elif start_index > routes_index:
            add_error(errors, path.relative_to(root), "START_HERE must appear before read-routes in default read order")

        if memory_index != -1:
            if memory_index < start_index:
                add_error(errors, path.relative_to(root), "memory-index.yaml must not appear before START_HERE in active read-order surfaces")
            if "broader routing" not in text and "broader route map" not in text:
                add_error(errors, path.relative_to(root), "memory-index.yaml must be described as broader routing, not default first-read")


def run_check() -> int:
    root = repo_root()
    tracked = git_ls_files(root)
    errors: list[str] = []

    check_root_file_sets(root, errors)
    check_retired_memory_paths(root, errors)
    check_active_run_policy(root, errors)
    check_platform_readme(root, errors)
    check_product_identity(root, tracked, errors)
    check_docs_migration_plan_status(root, errors)
    check_semantic_drift_pointers(root, errors)
    check_agents_name_status(root, errors)
    check_reference_code_retirement(root, errors)
    check_pointer_markers(root, errors)
    check_form_builder_policy(root, errors)
    check_gitignore(root, errors)
    check_preflight_policy(root, errors)
    check_read_order_policy(root, errors)
    check_markdown_links(root, tracked_existing_markdown(root, tracked), errors)

    if errors:
        print("Docs/memory drift detected:\n")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Docs/memory check passed.")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate docs and ai-memory routing invariants")
    parser.add_argument("--check", action="store_true", required=True, help="Fail on docs/memory drift")
    return parser.parse_args()


def main() -> int:
    parse_args()
    return run_check()


if __name__ == "__main__":
    sys.exit(main())
