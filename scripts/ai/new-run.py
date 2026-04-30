#!/usr/bin/env python3
"""Scaffold a new Atlas-coordinated platform product run for VSM v1.0.0.

This tool is mechanical only.
Atlas / Control chooses whether a run is needed, the task id, the mode, and the active lanes.
The script validates, reads versions from the automation manifest, and materializes the run files.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import shutil
import sys
from pathlib import Path

TASK_ID_RE = re.compile(r"^\d{4}-\d{2}-\d{2}_[a-z0-9-]+_[a-z0-9]+(?:-[a-z0-9]+)*(?:-\d{2})?$")
RUN_MODE_CHOICES = {
    "FE_ONLY",
    "BE_ONLY",
    "CROSS_STACK_PARALLEL",
    "CROSS_STACK_SEQUENTIAL",
    "RESEARCH_CONTRACT_LOCK",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a new run directory under maestro/memory/runs/active/<task-id>/"
    )
    parser.add_argument("--task-id", required=True, help="Task id chosen by Atlas / Control")
    parser.add_argument("--mode", required=True, choices=sorted(RUN_MODE_CHOICES))
    parser.add_argument(
        "--lanes",
        default="",
        help="Comma-separated lanes: frontend,backend. Omit for RESEARCH_CONTRACT_LOCK.",
    )
    parser.add_argument("--title", default="", help="Optional human-readable title")
    parser.add_argument("--goal", default="", help="Optional short goal")
    parser.add_argument("--why-now", default="", help="Optional short why-now note")
    parser.add_argument("--created-by", default="Atlas", help="Who initiated this run scaffolding")
    parser.add_argument("--force", action="store_true", help="Overwrite an existing run directory")
    parser.add_argument("--dry-run", action="store_true", help="Validate and print actions without writing files")
    return parser.parse_args()


def normalize_lanes(raw: str) -> list[str]:
    if not raw.strip():
        return []
    parts: list[str] = []
    for item in raw.split(","):
        lane = item.strip().lower()
        if not lane:
            continue
        if lane == "fe":
            lane = "frontend"
        elif lane == "be":
            lane = "backend"
        if lane not in {"frontend", "backend"}:
            raise SystemExit(f"Unsupported lane: {item}")
        if lane not in parts:
            parts.append(lane)
    return parts


def validate_mode_and_lanes(mode: str, lanes: list[str]) -> list[str]:
    if mode == "FE_ONLY":
        inferred = ["frontend"] if not lanes else lanes
        if inferred != ["frontend"]:
            raise SystemExit("FE_ONLY requires lanes=frontend")
        return inferred
    if mode == "BE_ONLY":
        inferred = ["backend"] if not lanes else lanes
        if inferred != ["backend"]:
            raise SystemExit("BE_ONLY requires lanes=backend")
        return inferred
    if mode in {"CROSS_STACK_PARALLEL", "CROSS_STACK_SEQUENTIAL"}:
        inferred = ["frontend", "backend"] if not lanes else lanes
        if set(inferred) != {"frontend", "backend"}:
            raise SystemExit(f"{mode} requires lanes=frontend,backend")
        return ["frontend", "backend"]
    if mode == "RESEARCH_CONTRACT_LOCK":
        if lanes:
            raise SystemExit("RESEARCH_CONTRACT_LOCK should not create implementation lanes")
        return []
    raise SystemExit(f"Unsupported mode: {mode}")


def ensure_task_id(task_id: str) -> None:
    if not TASK_ID_RE.match(task_id):
        raise SystemExit(
            "Invalid task-id format. Expected YYYY-MM-DD_<scope>_<short-kebab-purpose>"
        )


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def load_manifest(root: Path) -> dict:
    manifest_path = root / "maestro/memory" / "atlas" / "automation-manifest.json"
    if not manifest_path.exists():
        raise SystemExit("maestro/memory/atlas/automation-manifest.json not found. Apply the Atlas memory bundle first.")
    return json.loads(read_text(manifest_path))


def set_bullet_value(text: str, label: str, value: str) -> str:
    pattern = re.compile(rf"^(\-\s+{re.escape(label)}:)[^\n\r]*$", re.MULTILINE)
    new_text, count = pattern.subn(lambda m: f"{m.group(1)} {value}", text, count=1)
    if count == 0:
        raise ValueError(f"Could not find bullet field: {label}")
    return new_text


def title_from_task_id(task_id: str) -> str:
    try:
        _, scope, slug = task_id.split("_", 2)
    except ValueError:
        return task_id
    pretty = slug.replace("-", " ").strip().title()
    return f"[{scope}] {pretty}"


def chat_topology(mode: str) -> str:
    return {
        "FE_ONLY": "CONTROL_PLUS_FE",
        "BE_ONLY": "CONTROL_PLUS_BE",
        "CROSS_STACK_PARALLEL": "CONTROL_PLUS_FE_AND_BE",
        "CROSS_STACK_SEQUENTIAL": "CONTROL_PLUS_FE_AND_BE",
        "RESEARCH_CONTRACT_LOCK": "CONTROL_ONLY",
    }[mode]


def execution_order(mode: str) -> str:
    return {
        "FE_ONLY": "single lane",
        "BE_ONLY": "single lane",
        "CROSS_STACK_PARALLEL": "parallel",
        "CROSS_STACK_SEQUENTIAL": "control-defined sequence",
        "RESEARCH_CONTRACT_LOCK": "research first",
    }[mode]


def render_control_task(template: str, *, task_id: str, title: str, created_at: str, mode: str, lanes: list[str], created_by: str, goal: str, why_now: str, manifest: dict) -> str:
    prompts = manifest["prompts"]
    skill = manifest["skill"]

    rendered = template
    rendered = set_bullet_value(rendered, "task_id", task_id)
    rendered = set_bullet_value(rendered, "title", title)
    rendered = set_bullet_value(rendered, "status", "draft")
    rendered = set_bullet_value(rendered, "created_at", created_at)
    rendered = set_bullet_value(rendered, "updated_at", created_at)
    rendered = set_bullet_value(rendered, "created_by", created_by)
    rendered = set_bullet_value(rendered, "skill_name", skill["name"])
    rendered = set_bullet_value(rendered, "skill_display_name", skill["display_name"])
    rendered = set_bullet_value(rendered, "skill_version", skill["version"])
    rendered = set_bullet_value(rendered, "control_prompt_version", prompts["control"]["version"])
    rendered = set_bullet_value(rendered, "frontend_prompt_version", prompts["frontend"]["version"])
    rendered = set_bullet_value(rendered, "backend_prompt_version", prompts["backend"]["version"])
    rendered = set_bullet_value(rendered, "run_required", "yes")
    rendered = set_bullet_value(rendered, "primary_mode", mode)
    rendered = set_bullet_value(rendered, "recommended_chat_topology", chat_topology(mode))
    rendered = set_bullet_value(rendered, "active_lanes", ", ".join(lanes) if lanes else "none")
    rendered = set_bullet_value(rendered, "execution_order", execution_order(mode))
    rendered = set_bullet_value(rendered, "scaffolder_action", f"created via new-run {manifest['scaffolder']['version']}")
    rendered = set_bullet_value(rendered, "run_artifact_scope", f"maestro/memory/runs/active/{task_id}/")
    rendered = set_bullet_value(rendered, "goal", goal)
    rendered = set_bullet_value(rendered, "why_now", why_now)
    rendered = set_bullet_value(rendered, "lane_plan", f"mode={mode}; lanes={', '.join(lanes) if lanes else 'none'}")
    rendered = set_bullet_value(rendered, "memory_update_targets", "current-state.md | decisions-log.md | relevant modules/*.md | canonical-docs.md if authority changed")
    rendered = set_bullet_value(rendered, "prompt_delivery_status", "pending")
    rendered = set_bullet_value(rendered, "direct_launch_prompt_required", "no")
    rendered = set_bullet_value(rendered, "next_control_step", "Atlas to fill packets, render ready lane prompts, launch the planned lane topology, and reconcile outputs")

    if "frontend" in lanes:
        rendered = set_bullet_value(rendered, "fe_expected_report_path", f"maestro/memory/runs/active/{task_id}/frontend.md")
        rendered = set_bullet_value(rendered, "frontend_launch_prompt_path", f"maestro/memory/runs/active/{task_id}/frontend.md#ready-chat-launch-prompt")
    if "backend" in lanes:
        rendered = set_bullet_value(rendered, "be_expected_report_path", f"maestro/memory/runs/active/{task_id}/backend.md")
        rendered = set_bullet_value(rendered, "backend_launch_prompt_path", f"maestro/memory/runs/active/{task_id}/backend.md#ready-chat-launch-prompt")

    rendered = set_bullet_value(rendered, "final_status", "draft")
    rendered = set_bullet_value(rendered, "shared_memory_updates_applied", "not yet")
    rendered = set_bullet_value(rendered, "archive_recommendation", "archive only after closeout and inactivity")
    return rendered


def render_lane_file(template: str, *, task_id: str, lane: str, created_at: str, manifest: dict) -> str:
    prompt_key = "frontend" if lane == "frontend" else "backend"
    prompt_version = manifest["prompts"][prompt_key]["version"]
    prompt_file = manifest["prompts"][prompt_key]["file"]
    control_prompt_version = manifest["prompts"]["control"]["version"]
    rendered = template
    rendered = set_bullet_value(rendered, "task_id", task_id)
    rendered = set_bullet_value(rendered, "lane", lane)
    rendered = set_bullet_value(rendered, "status", "active")
    rendered = set_bullet_value(rendered, "report_time", created_at)
    rendered = set_bullet_value(rendered, "prompt_version", prompt_version)
    rendered = set_bullet_value(rendered, "control_prompt_version", control_prompt_version)
    rendered = set_bullet_value(rendered, "author", manifest["skill"]["display_name"])
    rendered = set_bullet_value(rendered, "base_prompt_file", prompt_file)
    rendered = set_bullet_value(rendered, "base_prompt_version", prompt_version)
    rendered = set_bullet_value(rendered, "prompt_variant", "full")
    rendered = set_bullet_value(rendered, "launch_prompt_status", "pending")
    rendered = set_bullet_value(rendered, "expected_report_path", f"maestro/memory/runs/active/{task_id}/{lane}.md")
    rendered = set_bullet_value(rendered, "memory_delta_expectation", "propose shared-memory deltas only; Atlas finalizes")
    rendered = set_bullet_value(rendered, "ready_for_reconciliation", "no")
    rendered = set_bullet_value(rendered, "ready_for_closeout", "no")
    rendered = set_bullet_value(rendered, "recommended_next_control_action", "Wait for lane work or clarify blockers")
    return rendered


def render_final_file(task_id: str, created_at: str, manifest: dict) -> str:
    skill = manifest["skill"]
    control_version = manifest["prompts"]["control"]["version"]
    return f"""# FINAL CLOSEOUT\n\n## Metadata\n- task_id: {task_id}\n- status: draft | reconciled | closed | superseded\n- created_at: {created_at}\n- updated_at: {created_at}\n- skill_name: {skill['name']}\n- skill_display_name: {skill['display_name']}\n- skill_version: {skill['version']}\n- control_prompt_version: {control_version}\n\n## Reconciliation\n- summary:\n- contract_drift_found:\n- checks_summary:\n- shared_memory_updates_applied:\n- unresolved_risks:\n- archive_recommendation:\n- next_exact_step:\n"""


def main() -> int:
    args = parse_args()
    lanes = validate_mode_and_lanes(args.mode, normalize_lanes(args.lanes))
    ensure_task_id(args.task_id)

    root = repo_root()
    manifest = load_manifest(root)
    runs_dir = root / "maestro/memory" / "runs" / "active"
    run_dir = runs_dir / args.task_id
    task_template_path = root / "maestro/memory" / "atlas" / "templates" / "control-task.md"
    lane_template_path = root / "maestro/memory" / "atlas" / "templates" / "lane-report.md"

    if not task_template_path.exists() or not lane_template_path.exists():
        raise SystemExit("Required templates not found. Apply the memory bundle first.")

    if run_dir.exists() and not args.force:
        raise SystemExit(f"Run directory already exists: {run_dir}. Use --force to overwrite.")

    created_at = dt.datetime.now().astimezone().strftime("%Y-%m-%d %H:%M:%S %z")
    title = args.title.strip() or title_from_task_id(args.task_id)
    goal = args.goal.strip()
    why_now = args.why_now.strip()

    task_md = render_control_task(
        read_text(task_template_path),
        task_id=args.task_id,
        title=title,
        created_at=created_at,
        mode=args.mode,
        lanes=lanes,
        created_by=args.created_by,
        goal=goal,
        why_now=why_now,
        manifest=manifest,
    )
    final_md = render_final_file(args.task_id, created_at, manifest)
    lane_files = {
        f"{lane}.md": render_lane_file(
            read_text(lane_template_path),
            task_id=args.task_id,
            lane=lane,
            created_at=created_at,
            manifest=manifest,
        )
        for lane in lanes
    }

    planned = [run_dir / "task.md", run_dir / "final.md", *[run_dir / name for name in lane_files]]

    if args.dry_run:
        print("Dry run: would create")
        for path in planned:
            print(f"- {path.relative_to(root)}")
        return 0

    if run_dir.exists() and args.force:
        shutil.rmtree(run_dir)
    run_dir.mkdir(parents=True, exist_ok=True)

    write_text(run_dir / "task.md", task_md)
    for name, content in lane_files.items():
        write_text(run_dir / name, content)
    write_text(run_dir / "final.md", final_md)

    print(f"Created run scaffold: {run_dir.relative_to(root)}")
    print(f"- task_id: {args.task_id}")
    print(f"- mode: {args.mode}")
    print(f"- lanes: {', '.join(lanes) if lanes else 'none'}")
    print("- versions sourced from: maestro/memory/atlas/automation-manifest.json")
    print("Next step: Atlas should fill packets and launch the active lane topology.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
