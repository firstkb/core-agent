#!/usr/bin/env python3
"""Scaffold a new coordinated run for Ramp Platform v108.

This tool is mechanical only.
Atlas / Control chooses the task id, primary mode, and active lanes.
The script validates, stamps versions, and materializes the run files.
"""
from __future__ import annotations

import argparse
import datetime as dt
import re
import sys
from pathlib import Path

SCRIPT_VERSION = "1.0.0"
SKILL_NAME = "ramp-conductor"
SKILL_DISPLAY_NAME = "Atlas"
SKILL_VERSION = "1.0.0"
CONTROL_PROMPT_VERSION = "1.0.0"
FRONTEND_PROMPT_VERSION = "1.0.0"
BACKEND_PROMPT_VERSION = "1.0.0"
TASK_ID_RE = re.compile(r"^\d{4}-\d{2}-\d{2}_[a-z0-9-]+_[a-z0-9]+(?:-[a-z0-9]+)*(?:-\d{2})?$")

MODE_CHOICES = {
    "FE_ONLY",
    "BE_ONLY",
    "CROSS_STACK_PARALLEL",
    "CROSS_STACK_SEQUENTIAL",
    "RESEARCH_CONTRACT_LOCK",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a new run directory under platform/docs/ai/runs/<task-id>/"
    )
    parser.add_argument("--task-id", required=True, help="Task id chosen by Atlas / Control")
    parser.add_argument("--mode", required=True, choices=sorted(MODE_CHOICES))
    parser.add_argument(
        "--lanes",
        default="",
        help="Comma-separated lanes: frontend,backend. Omit for RESEARCH_CONTRACT_LOCK.",
    )
    parser.add_argument("--title", default="", help="Optional human-readable title")
    parser.add_argument("--goal", default="", help="Optional short goal")
    parser.add_argument("--created-by", default="manual", help="Who initiated this run scaffolding")
    parser.add_argument("--force", action="store_true", help="Overwrite an existing run directory")
    parser.add_argument("--dry-run", action="store_true", help="Validate and print actions without writing files")
    return parser.parse_args()


def normalize_lanes(raw: str) -> list[str]:
    if not raw.strip():
        return []
    parts = []
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


def set_bullet_value(text: str, label: str, value: str) -> str:
    pattern = re.compile(rf"^(\-\s+{re.escape(label)}:)[^\n\r]*$", re.MULTILINE)
    new_text, count = pattern.subn(lambda m: f"{m.group(1)} {value}", text, count=1)
    if count == 0:
        raise ValueError(f"Could not find bullet field: {label}")
    return new_text


def render_control_task(template: str, *, task_id: str, title: str, created_at: str, mode: str, lanes: list[str], created_by: str, goal: str) -> str:
    rendered = template
    rendered = set_bullet_value(rendered, "task_id", task_id)
    rendered = set_bullet_value(rendered, "title", title)
    rendered = set_bullet_value(rendered, "status", "draft")
    rendered = set_bullet_value(rendered, "created_at", created_at)
    rendered = set_bullet_value(rendered, "updated_at", created_at)
    rendered = set_bullet_value(rendered, "created_by", created_by)
    rendered = set_bullet_value(rendered, "task_id_source", "Atlas / Control")
    rendered = set_bullet_value(rendered, "skill_name", SKILL_NAME)
    rendered = set_bullet_value(rendered, "skill_display_name", SKILL_DISPLAY_NAME)
    rendered = set_bullet_value(rendered, "skill_version", SKILL_VERSION)
    rendered = set_bullet_value(rendered, "control_prompt_version", CONTROL_PROMPT_VERSION)
    rendered = set_bullet_value(rendered, "frontend_prompt_version", FRONTEND_PROMPT_VERSION)
    rendered = set_bullet_value(rendered, "backend_prompt_version", BACKEND_PROMPT_VERSION)
    rendered = set_bullet_value(rendered, "primary_mode", mode)
    rendered = set_bullet_value(rendered, "active_lanes", ", ".join(lanes) if lanes else "none")
    execution_order = "frontend -> backend" if mode == "CROSS_STACK_SEQUENTIAL" else "parallel or control-defined"
    if mode in {"FE_ONLY", "BE_ONLY"}:
        execution_order = "single lane"
    if mode == "RESEARCH_CONTRACT_LOCK":
        execution_order = "research first"
    rendered = set_bullet_value(rendered, "execution_order", execution_order)
    rendered = set_bullet_value(rendered, "run_artifact_scope", f"platform/docs/ai/runs/{task_id}/")
    rendered = set_bullet_value(rendered, "user_goal", goal)
    for lane in lanes:
        report_path = f"platform/docs/ai/runs/{task_id}/{lane}.md"
        if lane == "frontend":
            rendered = set_bullet_value(rendered, "report_path", report_path)
            # replace only first FE report_path; BE below if present
            # fields later are duplicated, so handle order via split marker.
    # duplicate-field handling for FE/BE report_path etc
    # do a more explicit second pass:
    rendered = replace_second_occurrence(rendered, "report_path", f"platform/docs/ai/runs/{task_id}/backend.md") if "backend" in lanes else replace_second_occurrence(rendered, "report_path", "")
    # first occurrence corresponds to FE
    rendered = set_bullet_value(rendered, "report_path", f"platform/docs/ai/runs/{task_id}/frontend.md" if "frontend" in lanes else "")
    rendered = set_bullet_value(rendered, "final_status", "draft")
    rendered = set_bullet_value(rendered, "shared_memory_updates_applied", "not yet")
    rendered = set_bullet_value(rendered, "archive_recommendation", "archive only after closeout and inactivity")
    rendered = set_bullet_value(rendered, "next_exact_step", "Control to fill packets and launch active lanes")
    return rendered


def replace_second_occurrence(text: str, label: str, value: str) -> str:
    pattern = re.compile(rf"^(\-\s+{re.escape(label)}:)[^\n\r]*$", re.MULTILINE)
    matches = list(pattern.finditer(text))
    if len(matches) < 2:
        return text
    match = matches[1]
    start, end = match.span()
    return text[:start] + f"- {label}: {value}" + text[end:]


def render_lane_file(template: str, *, task_id: str, lane: str, created_at: str) -> str:
    prompt_version = FRONTEND_PROMPT_VERSION if lane == "frontend" else BACKEND_PROMPT_VERSION
    rendered = template
    rendered = set_bullet_value(rendered, "task_id", task_id)
    rendered = set_bullet_value(rendered, "lane", lane)
    rendered = set_bullet_value(rendered, "status", "active")
    rendered = set_bullet_value(rendered, "report_time", created_at)
    rendered = set_bullet_value(rendered, "prompt_version", prompt_version)
    rendered = set_bullet_value(rendered, "control_prompt_version", CONTROL_PROMPT_VERSION)
    rendered = set_bullet_value(rendered, "author", "Control / Atlas")
    rendered = set_bullet_value(rendered, "expected_report_path", f"platform/docs/ai/runs/{task_id}/{lane}.md")
    rendered = set_bullet_value(rendered, "recommended_next_control_action", "Wait for lane work or clarify blockers")
    rendered = set_bullet_value(rendered, "ready_for_reconciliation", "no")
    rendered = set_bullet_value(rendered, "ready_for_closeout", "no")
    rendered = set_bullet_value(rendered, "next_lane_step", "Control to fill packet snapshot before implementation begins")
    return rendered


def render_final_file(task_id: str, created_at: str) -> str:
    return f"""# FINAL CLOSEOUT\n\n## Metadata\n- task_id: {task_id}\n- status: draft | reconciled | closed | superseded\n- created_at: {created_at}\n- updated_at: {created_at}\n- skill_name: {SKILL_NAME}\n- skill_display_name: {SKILL_DISPLAY_NAME}\n- skill_version: {SKILL_VERSION}\n- control_prompt_version: {CONTROL_PROMPT_VERSION}\n\n## Reconciliation\n- summary:\n- contract_drift_found:\n- checks_summary:\n- shared_memory_updates_applied:\n- unresolved_risks:\n- archive_recommendation:\n- next_exact_step:\n"""


def title_from_task_id(task_id: str) -> str:
    try:
        _, scope, slug = task_id.split("_", 2)
    except ValueError:
        return task_id
    pretty = slug.replace("-", " ").strip().title()
    return f"[{scope}] {pretty}"


def main() -> int:
    args = parse_args()
    lanes = validate_mode_and_lanes(args.mode, normalize_lanes(args.lanes))
    ensure_task_id(args.task_id)

    root = repo_root()
    runs_dir = root / "platform" / "docs" / "ai" / "runs"
    run_dir = runs_dir / args.task_id
    task_template_path = root / "platform" / "docs" / "ai" / "templates" / "control-task.md"
    lane_template_path = root / "platform" / "docs" / "ai" / "templates" / "lane-report.md"

    if not task_template_path.exists() or not lane_template_path.exists():
        raise SystemExit("Required templates not found. Apply the memory bundle first.")

    if run_dir.exists() and not args.force:
        raise SystemExit(f"Run directory already exists: {run_dir}. Use --force to overwrite.")

    created_at = dt.datetime.now().astimezone().strftime("%Y-%m-%d %H:%M:%S %z")
    title = args.title.strip() or title_from_task_id(args.task_id)
    goal = args.goal.strip()

    task_md = render_control_task(
        read_text(task_template_path),
        task_id=args.task_id,
        title=title,
        created_at=created_at,
        mode=args.mode,
        lanes=lanes,
        created_by=args.created_by,
        goal=goal,
    )
    final_md = render_final_file(args.task_id, created_at)
    lane_files = {
        f"{lane}.md": render_lane_file(read_text(lane_template_path), task_id=args.task_id, lane=lane, created_at=created_at)
        for lane in lanes
    }

    planned = [run_dir / "task.md", run_dir / "final.md", *[run_dir / name for name in lane_files]]

    if args.dry_run:
        print("Dry run: would create")
        for path in planned:
            print(f"- {path.relative_to(root)}")
        return 0

    if run_dir.exists() and args.force:
        import shutil
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
    print("Next step: Atlas / Control should fill packets and launch the active lanes.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
