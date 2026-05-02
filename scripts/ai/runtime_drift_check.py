#!/usr/bin/env python3
"""Report mechanical drift in Codex/Maestro runtime surfaces.

Usage:
  python3 scripts/ai/runtime_drift_check.py --report
  python3 scripts/ai/runtime_drift_check.py --check
  python3 scripts/ai/runtime_drift_check.py --self-test
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
import tomllib
from pathlib import Path
from typing import Any


ACTIVE_HOT_PATHS = [
    "AGENTS.md",
    "platform/AGENTS.md",
    "platform/frontend/AGENTS.md",
    "platform/backend/AGENTS.md",
    "maestro/AGENTS.md",
    "maestro/README.md",
    "maestro/docs/runtime-contract.md",
    "maestro/memory/START_HERE.md",
    "maestro/memory/index/read-routes.yaml",
    "maestro/memory/index/memory-index.yaml",
    ".codex/config.toml",
    ".codex/standards/README.md",
    ".codex/standards/runtime",
    ".agents/skills",
    "maestro/contracts",
    "maestro/templates",
]

FORBIDDEN_LIFECYCLE_TERMS = [
    "platform/docs/ai/",
    "maestro/memory/runs/",
    "maestro/memory/retired-runtime/",
    "artifacts/<module>",
    "status.json",
]

ALLOWED_HISTORY_MARKERS = [
    "legacy",
    "legacy-only",
    "historical",
    "history",
    "provenance",
    "superseded",
    "old ",
    "old `",
    "former",
    "deleted",
    "retired",
    "not active",
    "not for new work",
    "do not use",
    "do not read",
    "do not recreate",
    "do not exist",
    "only for old",
    "continuation only",
    "retained for old",
]

RETIRED_ROUTE_TERMS = [
    "platform/docs/ai/",
    "maestro/memory/runs/",
    "maestro/memory/retired-runtime/",
    "artifacts/<module>",
]

OPENAI_INTERFACE_REQUIRED = {
    "display_name",
    "short_description",
    "brand_color",
    "default_prompt",
}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def suggested_owner(display_path: str) -> str:
    if display_path.startswith(".codex/"):
        return ".codex runtime/contracts owner"
    if display_path.startswith(".agents/skills/"):
        return "skill owner"
    if display_path.startswith("maestro/memory/"):
        return "Archivist / memory owner"
    if display_path.startswith("maestro/contracts/") or display_path.startswith("maestro/templates/"):
        return "Maestro contract/template owner"
    if display_path.startswith("maestro/docs/") or display_path.startswith("maestro/"):
        return "Maestro runtime docs owner"
    if display_path.startswith("platform/frontend/"):
        return "frontend lane owner"
    if display_path.startswith("platform/backend/"):
        return "backend lane owner"
    if display_path.startswith("platform/"):
        return "platform owner"
    if display_path.startswith("scripts/ai/"):
        return "runtime validation owner"
    return "repo runtime owner"


def add_error(errors: list[str], path: Path | str, message: str) -> None:
    if isinstance(path, Path):
        try:
            display_path = path.relative_to(repo_root()).as_posix()
        except ValueError:
            display_path = path.as_posix()
    else:
        display_path = path
    errors.append(f"{display_path}: {message} (owner: {suggested_owner(display_path)})")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


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


def fallback_files(root: Path) -> list[str]:
    ignored = {
        ".git",
        ".venv",
        ".venv-ppe",
        ".venv-ppe311",
        "node_modules",
        "reference-code",
    }
    out: list[str] = []
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(root)
        if any(part in ignored for part in rel.parts):
            continue
        out.append(rel.as_posix())
    return sorted(out)


def load_toml(path: Path, errors: list[str]) -> dict[str, Any] | None:
    try:
        return tomllib.loads(read_text(path))
    except FileNotFoundError:
        add_error(errors, path, "required TOML file is missing")
    except tomllib.TOMLDecodeError as exc:
        add_error(errors, path, f"TOML parse error: {exc}")
    return None


def is_legacy_agent(agent_id: str, agent_cfg: dict[str, Any]) -> bool:
    description = str(agent_cfg.get("description", "")).lower()
    nicknames = [str(value).lower() for value in agent_cfg.get("nickname_candidates", [])]
    return (
        description.startswith("legacy ")
        or " legacy " in f" {description} "
        or agent_id in {"module_orchestrator", "research_codebase", "brief_auditor"}
        or any(nickname.startswith("legacy_") for nickname in nicknames)
    )


def check_agent_registry(root: Path, errors: list[str]) -> None:
    config_path = root / ".codex/config.toml"
    config = load_toml(config_path, errors)
    if config is None:
        return

    agents_cfg = config.get("agents", {})
    if not isinstance(agents_cfg, dict):
        add_error(errors, config_path, "`agents` table is missing or invalid")
        return

    registered: dict[str, dict[str, Any]] = {
        agent_id: value
        for agent_id, value in agents_cfg.items()
        if isinstance(value, dict) and "config_file" in value
    }

    for agent_id, agent_cfg in sorted(registered.items()):
        config_file = str(agent_cfg.get("config_file", ""))
        if not config_file:
            add_error(errors, config_path, f"agent `{agent_id}` has no config_file")
            continue
        agent_file = root / ".codex" / config_file
        if not agent_file.exists():
            add_error(
                errors,
                config_path,
                f"registered agent `{agent_id}` config file is missing: .codex/{config_file}",
            )

        contract_dir = root / ".codex/contracts" / agent_id
        if not is_legacy_agent(agent_id, agent_cfg) and not contract_dir.is_dir():
            add_error(
                errors,
                contract_dir,
                f"active registered agent `{agent_id}` is missing a contract folder",
            )

    registered_files = {
        str(agent_cfg.get("config_file", ""))
        for agent_cfg in registered.values()
        if str(agent_cfg.get("config_file", "")).startswith("agents/")
    }

    agents_dir = root / ".codex/agents"
    if not agents_dir.exists():
        add_error(errors, agents_dir, "agents directory is missing")
        return

    for path in sorted(agents_dir.glob("*.toml")):
        rel = f"agents/{path.name}"
        if rel not in registered_files:
            add_error(errors, path, "unregistered agent file in active .codex/agents")


def check_nickname_uniqueness(root: Path, errors: list[str]) -> None:
    config_path = root / ".codex/config.toml"
    config = load_toml(config_path, errors)
    if config is None:
        return

    agents_cfg = config.get("agents", {})
    if not isinstance(agents_cfg, dict):
        return

    active_nicknames: dict[str, str] = {}
    all_nicknames: dict[str, str] = {}
    for agent_id, agent_cfg in sorted(agents_cfg.items()):
        if not isinstance(agent_cfg, dict) or "config_file" not in agent_cfg:
            continue
        nicknames = [str(value).strip().lower() for value in agent_cfg.get("nickname_candidates", [])]
        legacy = is_legacy_agent(agent_id, agent_cfg)
        for nickname in nicknames:
            if not nickname:
                add_error(errors, config_path, f"agent `{agent_id}` has an empty nickname candidate")
                continue
            previous = all_nicknames.get(nickname)
            if previous is not None:
                add_error(
                    errors,
                    config_path,
                    f"nickname `{nickname}` is used by both `{previous}` and `{agent_id}`",
                )
            all_nicknames[nickname] = agent_id

            if legacy:
                if nickname in active_nicknames:
                    add_error(
                        errors,
                        config_path,
                        f"legacy nickname `{nickname}` collides with active agent `{active_nicknames[nickname]}`",
                    )
                if not (nickname.startswith("legacy_") or nickname == agent_id):
                    add_error(
                        errors,
                        config_path,
                        f"legacy agent `{agent_id}` nickname `{nickname}` must be explicit legacy form or the agent id",
                    )
            else:
                previous_active = active_nicknames.get(nickname)
                if previous_active is not None:
                    add_error(
                        errors,
                        config_path,
                        f"active nickname `{nickname}` is used by both `{previous_active}` and `{agent_id}`",
                    )
                active_nicknames[nickname] = agent_id


def iter_template_refs(value: Any, trail: tuple[str, ...] = ()) -> list[tuple[tuple[str, ...], str]]:
    refs: list[tuple[tuple[str, ...], str]] = []
    if isinstance(value, dict):
        for key, child in value.items():
            child_trail = (*trail, str(key))
            in_template_map = any(part in {"templates", "support_templates"} for part in trail)
            if (
                isinstance(child, str)
                and (key == "template" or key.endswith("_template") or in_template_map)
            ):
                refs.append((child_trail, child))
            refs.extend(iter_template_refs(child, child_trail))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            refs.extend(iter_template_refs(child, (*trail, str(index))))
    return refs


def template_path_exists(root: Path, contract_path: Path, template_ref: str) -> bool:
    explicit_prefixes = (".codex/", "maestro/", "platform/", "scripts/")
    if template_ref.startswith(explicit_prefixes):
        return (root / template_ref).exists()
    return (contract_path.parent / template_ref).exists()


def check_contract_template_paths(root: Path, errors: list[str]) -> None:
    contracts_root = root / ".codex/contracts"
    if not contracts_root.exists():
        add_error(errors, contracts_root, "contracts directory is missing")
        return

    for path in sorted(contracts_root.glob("*/contract.json")):
        try:
            data = json.loads(read_text(path))
        except json.JSONDecodeError as exc:
            add_error(errors, path, f"JSON parse error: {exc}")
            continue
        except FileNotFoundError:
            add_error(errors, path, "contract file is missing")
            continue

        for trail, template_ref in iter_template_refs(data):
            if template_path_exists(root, path, template_ref):
                continue
            json_path = ".".join(trail)
            add_error(
                errors,
                path,
                f"template path does not resolve at `{json_path}`: {template_ref}",
            )


def check_local_memory_not_tracked(tracked: list[str], errors: list[str]) -> None:
    for rel in sorted(path for path in tracked if path.startswith("maestro/memory/local/")):
        add_error(errors, rel, "local memory/auth files must not be tracked")


def is_active_hot_path(rel: str) -> bool:
    return any(rel == scope or rel.startswith(f"{scope}/") for scope in ACTIVE_HOT_PATHS)


def line_has_allowed_history_marker(line: str) -> bool:
    lowered = line.lower()
    return any(marker in lowered for marker in ALLOWED_HISTORY_MARKERS)


def context_has_allowed_history_marker(lines: list[str], index: int) -> bool:
    start = max(0, index - 3)
    end = min(len(lines), index + 4)
    context = " ".join(lines[start:end]).lower()
    return any(marker in context for marker in ALLOWED_HISTORY_MARKERS)


def check_forbidden_old_lifecycle_terms(root: Path, tracked: list[str], errors: list[str]) -> None:
    for rel in tracked:
        if not is_active_hot_path(rel):
            continue
        path = root / rel
        if not path.exists() or not path.is_file():
            continue
        try:
            lines = read_text(path).splitlines()
        except UnicodeDecodeError:
            continue

        for index, line in enumerate(lines):
            if not any(term in line for term in FORBIDDEN_LIFECYCLE_TERMS):
                continue
            if line_has_allowed_history_marker(line) or context_has_allowed_history_marker(lines, index):
                continue
            add_error(
                errors,
                f"{rel}:{index + 1}",
                "forbidden old lifecycle term in active hot path without legacy/historical framing",
            )


def parse_simple_yaml_sections(path: Path, errors: list[str]) -> dict[str, dict[str, str]]:
    sections: dict[str, dict[str, str]] = {}
    current: str | None = None
    try:
        lines = read_text(path).splitlines()
    except FileNotFoundError:
        add_error(errors, path, "openai.yaml is missing")
        return sections

    for index, line in enumerate(lines, start=1):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if not line.startswith(" ") and line.endswith(":"):
            current = line[:-1].strip()
            sections.setdefault(current, {})
            continue
        if line.startswith("  ") and current is not None and ":" in line:
            key, raw_value = line.strip().split(":", 1)
            value = raw_value.strip().strip('"').strip("'")
            sections[current][key.strip()] = value
            continue
        add_error(errors, f"{path.relative_to(repo_root()).as_posix()}:{index}", "unsupported openai.yaml shape")
    return sections


def check_openai_yaml_shape(root: Path, errors: list[str]) -> None:
    skills_root = root / ".agents/skills"
    for yaml_path in sorted(skills_root.glob("*/agents/openai.yaml")):
        skill_dir = yaml_path.parents[1]
        skill_name = skill_dir.name
        if not (skill_dir / "SKILL.md").exists():
            add_error(errors, yaml_path, f"skill `{skill_name}` is missing SKILL.md")

        sections = parse_simple_yaml_sections(yaml_path, errors)
        interface = sections.get("interface")
        policy = sections.get("policy")
        if interface is None:
            add_error(errors, yaml_path, "missing required `interface` section")
            continue
        if policy is None:
            add_error(errors, yaml_path, "missing required `policy` section")
            continue

        missing = sorted(OPENAI_INTERFACE_REQUIRED - set(interface))
        if missing:
            add_error(errors, yaml_path, f"missing interface keys: {', '.join(missing)}")
        brand_color = interface.get("brand_color", "")
        if not (len(brand_color) == 7 and brand_color.startswith("#") and all(ch in "0123456789abcdefABCDEF" for ch in brand_color[1:])):
            add_error(errors, yaml_path, "`interface.brand_color` must be a #RRGGBB color")
        if policy.get("allow_implicit_invocation") != "false":
            add_error(errors, yaml_path, "`policy.allow_implicit_invocation` must be false")
        default_prompt = interface.get("default_prompt", "")
        if f"${skill_name}" not in default_prompt:
            add_error(errors, yaml_path, f"`interface.default_prompt` should mention `${skill_name}`")


def parse_read_route_blocks(path: Path, errors: list[str]) -> tuple[list[str], dict[str, list[tuple[str, int]]]]:
    default_read: list[str] = []
    route_reads: dict[str, list[tuple[str, int]]] = {}
    current_top: str | None = None
    current_route: str | None = None
    in_read = False
    read_indent = -1
    route_names: set[str] = set()

    lines = read_text(path).splitlines()
    for index, line in enumerate(lines, start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        indent = len(line) - len(line.lstrip(" "))

        if indent == 0 and stripped.endswith(":"):
            current_top = stripped[:-1]
            current_route = None
            in_read = False
            continue

        if current_top == "routes" and indent == 2 and stripped.endswith(":"):
            current_route = stripped[:-1]
            if current_route in route_names:
                add_error(errors, f"{path.relative_to(repo_root()).as_posix()}:{index}", f"duplicate route key `{current_route}`")
            route_names.add(current_route)
            route_reads.setdefault(current_route, [])
            in_read = False
            continue

        if stripped == "read:":
            in_read = True
            read_indent = indent
            continue

        if in_read and indent <= read_indent:
            in_read = False

        if in_read and stripped.startswith("- "):
            value = stripped[2:].strip()
            if current_top == "default":
                default_read.append(value)
            elif current_top == "routes" and current_route is not None:
                route_reads.setdefault(current_route, []).append((value, index))

    return default_read, route_reads


def check_read_routes(root: Path, errors: list[str]) -> None:
    path = root / "maestro/memory/index/read-routes.yaml"
    default_read, route_reads = parse_read_route_blocks(path, errors)

    expected_default = [
        "maestro/memory/START_HERE.md",
        "maestro/memory/index/read-routes.yaml",
    ]
    if default_read[:2] != expected_default:
        add_error(
            errors,
            path,
            "default read order must start with START_HERE.md followed by read-routes.yaml",
        )
    if "maestro/memory/index/memory-index.yaml" in default_read:
        add_error(errors, path, "memory-index.yaml must not be in the default read list")

    if not route_reads:
        add_error(errors, path, "no routes found")

    for route_name, entries in sorted(route_reads.items()):
        if not entries:
            add_error(errors, path, f"route `{route_name}` has no read entries")
            continue
        for entry, line_number in entries:
            display = f"{path.relative_to(root).as_posix()}:{line_number}"
            if any(term in entry for term in RETIRED_ROUTE_TERMS):
                add_error(errors, display, f"route `{route_name}` reads retired runtime path `{entry}`")
            if entry == "platform/**" or entry.startswith("platform/**"):
                add_error(errors, display, f"route `{route_name}` reads broad platform glob `{entry}`")
            if entry.startswith("reference-code/"):
                add_error(errors, display, f"route `{route_name}` reads raw reference-code path `{entry}`")
            if "*" in entry:
                continue
            if not (root / entry).exists():
                add_error(errors, display, f"route `{route_name}` read path is missing: {entry}")


def schema_enum(path: Path, keys: list[str]) -> set[str]:
    data = json.loads(read_text(path))
    value: Any = data
    for key in keys:
        value = value[key]
    return set(value)


def check_stage_enum_asymmetry(root: Path, errors: list[str]) -> None:
    orchestration = schema_enum(
        root / "maestro/contracts/orchestration-plan.schema.json",
        ["properties", "stages", "items", "enum"],
    )
    packet = schema_enum(
        root / "maestro/contracts/task-packet.schema.json",
        ["properties", "assigned_stage", "enum"],
    )
    handoff = schema_enum(
        root / "maestro/contracts/stage-handoff.schema.json",
        ["properties", "stage", "enum"],
    )
    if packet != handoff:
        add_error(errors, "maestro/contracts", "task-packet assigned_stage enum must match stage-handoff stage enum")
    if orchestration - packet != {"intake"}:
        add_error(errors, "maestro/contracts", "only documented stage enum asymmetry may be orchestration-only `intake`")
    if packet - orchestration:
        add_error(errors, "maestro/contracts", f"packet stages missing from orchestration plan: {sorted(packet - orchestration)}")

    mapping_path = root / "maestro/docs/template-schema-mapping.md"
    mapping = read_text(mapping_path)
    required_phrases = [
        "Stage Role Constraints",
        "`intake` is excluded",
        "remain adaptive at the schema layer",
    ]
    for phrase in required_phrases:
        if phrase not in mapping:
            add_error(errors, mapping_path, f"stage enum/asymmetry documentation missing phrase: {phrase}")


def collect_errors(root: Path, tracked_override: list[str] | None = None) -> list[str]:
    errors: list[str] = []
    tracked = tracked_override if tracked_override is not None else git_ls_files(root)

    check_agent_registry(root, errors)
    check_nickname_uniqueness(root, errors)
    check_contract_template_paths(root, errors)
    check_local_memory_not_tracked(tracked, errors)
    check_forbidden_old_lifecycle_terms(root, tracked, errors)
    check_openai_yaml_shape(root, errors)
    check_read_routes(root, errors)
    check_stage_enum_asymmetry(root, errors)

    return errors


def run_report(check: bool) -> int:
    errors = collect_errors(repo_root())
    if errors:
        print("Runtime drift detected:\n")
        for error in errors:
            print(f"- {error}")
        return 1 if check else 0

    print("Runtime drift check passed.")
    return 0


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def run_self_test() -> int:
    with tempfile.TemporaryDirectory(prefix="runtime-drift-check-") as tmp:
        root = Path(tmp)
        write(
            root / ".codex/config.toml",
            """
[agents]
max_depth = 1

[agents.active_agent]
description = "Active test agent."
nickname_candidates = ["active"]
config_file = "agents/active_agent.toml"

[agents.no_contract]
description = "Active agent without contract."
nickname_candidates = ["no_contract"]
config_file = "agents/no_contract.toml"

[agents.duplicate_nick]
description = "Active duplicate nickname."
nickname_candidates = ["active"]
config_file = "agents/duplicate_nick.toml"

[agents.missing_config]
description = "Active missing config."
nickname_candidates = ["missing"]
config_file = "agents/missing_config.toml"
""".strip()
            + "\n",
        )
        write(root / ".codex/agents/active_agent.toml", 'name = "active_agent"\n')
        write(root / ".codex/agents/no_contract.toml", 'name = "no_contract"\n')
        write(root / ".codex/agents/duplicate_nick.toml", 'name = "duplicate_nick"\n')
        write(root / ".codex/agents/orphan.toml", 'name = "orphan"\n')
        write(
            root / ".codex/contracts/active_agent/contract.json",
            '{"agent_id":"active_agent","artifacts":{"bad":{"template":"missing.tmpl"}},"support_templates":{"note":"missing-note.tmpl"}}\n',
        )
        write(root / ".codex/contracts/duplicate_nick/contract.json", '{"agent_id":"duplicate_nick"}\n')
        write(
            root / ".codex/standards/runtime/artifact-governance.md",
            "New work uses artifacts/<module>/ and status.json lifecycle.\n",
        )
        write(
            root / ".agents/skills/bad_skill/agents/openai.yaml",
            """
interface:
  display_name: "Bad"
  brand_color: "blue"

policy:
  allow_implicit_invocation: true
""".strip()
            + "\n",
        )
        write(
            root / "maestro/memory/index/read-routes.yaml",
            """
default:
  read:
    - maestro/memory/START_HERE.md
    - maestro/memory/index/read-routes.yaml

routes:
  bad_route:
    triggers:
      - bad
    read:
      - maestro/memory/missing.md
""".strip()
            + "\n",
        )
        write(
            root / "maestro/contracts/orchestration-plan.schema.json",
            '{"properties":{"stages":{"items":{"enum":["intake","research"]}}}}\n',
        )
        write(
            root / "maestro/contracts/task-packet.schema.json",
            '{"properties":{"assigned_stage":{"enum":["research"]}}}\n',
        )
        write(
            root / "maestro/contracts/stage-handoff.schema.json",
            '{"properties":{"stage":{"enum":["research"]}}}\n',
        )
        write(
            root / "maestro/docs/template-schema-mapping.md",
            "# Template Schema Mapping\n\n## Stage Role Constraints\n\n`intake` is excluded and other stages remain adaptive at the schema layer.\n",
        )
        write(root / "maestro/memory/local/browser-use-auth.md", "secret\n")

        tracked = fallback_files(root)
        errors = collect_errors(root, tracked_override=tracked)
        required = [
            "unregistered agent file",
            "registered agent `missing_config` config file is missing",
            "active registered agent `no_contract` is missing a contract folder",
            "active nickname `active` is used by both `active_agent` and `duplicate_nick`",
            "template path does not resolve",
            "local memory/auth files must not be tracked",
            "forbidden old lifecycle term",
            "missing interface keys",
            "`policy.allow_implicit_invocation` must be false",
            "route `bad_route` read path is missing",
        ]
        missing = [needle for needle in required if not any(needle in error for error in errors)]
        if missing:
            print("Runtime drift self-test failed:\n")
            print("Missing expected findings:")
            for needle in missing:
                print(f"- {needle}")
            print("\nActual findings:")
            for error in errors:
                print(f"- {error}")
            return 1

    print("Runtime drift self-test passed.")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Report Codex/Maestro runtime drift")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--report", action="store_true", help="Print drift findings but exit 0")
    mode.add_argument("--check", action="store_true", help="Fail when drift is found")
    mode.add_argument("--self-test", action="store_true", help="Run built-in known-bad checks")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.self_test:
        return run_self_test()
    return run_report(check=args.check)


if __name__ == "__main__":
    sys.exit(main())
