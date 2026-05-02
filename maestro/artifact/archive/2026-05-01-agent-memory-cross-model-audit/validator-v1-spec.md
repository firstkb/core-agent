# Validator v1 Spec

## Purpose

Add a small report-first validator for runtime drift. The validator should catch
mechanical inconsistencies that currently require manual audit, without becoming
a runtime, router, or agent orchestrator.

It reports facts. It must not:

- decide routing;
- assign agents;
- mutate artifacts;
- infer product behavior;
- rewrite files;
- replace Maestro judgment.

## Proposed Script

Path:

```text
scripts/ai/runtime_drift_check.py
```

Initial command:

```bash
python3 scripts/ai/runtime_drift_check.py --check
```

Optional implementation flags:

- `--check`: fail on drift;
- `--report`: print findings but exit 0 during early rollout;
- `--fixture-root <path>`: validate known-bad sample trees if fixtures are
  implemented as files.

## V1 Checks

### 1. Agent Registry Consistency

Inputs:

- `.codex/config.toml`
- `.codex/agents/*.toml`

Rules:

- every registered `config_file` in `.codex/config.toml` exists;
- every `.codex/agents/*.toml` file is registered, explicitly allowed as
  experimental, or explicitly allowed as legacy;
- active registered agents have a corresponding `.codex/contracts/<agent_id>/`
  folder unless explicitly exempted;
- legacy registered agents may stay, but must be clearly marked by config
  description or explicit allow-list.

Pre-Slice 2 known drift:

- `.codex/agents/foundation-explorer.toml`
- `.codex/agents/foundation-reviewer.toml`

Expected final result:

- no active-looking unregistered agent files remain.

### 2. Contract Template Path Resolution

Inputs:

- `.codex/contracts/*/contract.json`

Rules:

- every JSON file parses;
- every `template` field resolves to an existing file or is explicitly marked
  legacy/dead;
- resolution must be deterministic and documented by the validator.

Recommended resolution order:

1. repo-relative path if the value starts with `.codex/`, `maestro/`, or another
   explicit repo path;
2. path relative to the contract folder;
3. no fallback guessing.

Current known drift after Slice 2:

- `.codex/contracts/module_orchestrator/contract.json`
- `.codex/contracts/research_codebase/contract.json`

Expected final result:

- paths are corrected or legacy/dead exemption is explicit.

### 3. Local Auth / Local Memory Tracking Guard

Inputs:

- `git ls-files`

Rules:

- no tracked path may exist under `maestro/memory/local/**`;
- later versions may scan tracked artifacts for copied local auth secrets, but
  v1 only checks tracking.

Current state:

- `maestro/memory/local/browser-use-auth.md` is ignored and not tracked.

Expected final result:

- check passes and remains cheap.

### 4. Forbidden Old Lifecycle Instructions In Active Hot Paths

Inputs:

- active hot path list from `final-order-plan.md`;
- tracked files only.

Rules:

- active hot paths must not instruct new work to use old lifecycle roots:
  - `platform/docs/ai/**`
  - `maestro/memory/runs/**`
  - `maestro/memory/retired-runtime/**`
  - `artifacts/<module>/...` as normal new-work path
  - CLI-owned `status.json` lifecycle for vNext work
- historical mentions are allowed only when local context clearly marks them as
  `legacy`, `historical`, `superseded`, `provenance`, `old`, `git history`, or
  "not for new work".
- explicitly legacy `.codex` agents/contracts are exempt from old artifact
  path mentions when the file is clearly legacy-only.

Pre-Slice 2 known drift:

- `.codex/standards/runtime/artifact-governance.md` promotes old
  `artifacts/<module>` and `status.json` lifecycle without vNext/legacy
  framing.

Expected final result:

- active hot paths no longer promote stale lifecycle rules.

## Known-Bad Cases For Tests Or Fixtures

V1 does not need a large test harness. Use small fixtures or generated temp
trees. Each known-bad case should fail with a clear path and reason.

Required bad cases:

- `orphan_agent`: `.codex/agents/orphan.toml` exists but is not registered.
- `missing_registered_agent_config`: config points to a missing
  `.codex/agents/missing.toml`.
- `missing_contract_folder`: active registered agent has no matching
  `.codex/contracts/<agent_id>/`.
- `broken_template_path`: contract JSON has a `template` value that resolves
  nowhere.
- `tracked_local_auth`: simulated tracked path under `maestro/memory/local/`.
- `forbidden_old_lifecycle`: active standard says new work uses
  `artifacts/<module>` or CLI-owned `status.json`.

Optional good cases:

- explicit legacy registered agent with old artifact paths is accepted;
- root `AGENTS.md` legacy compatibility note is accepted when it says legacy
  continuation only;
- ignored local auth file is accepted when not tracked.

## Output Shape

On failure:

```text
Runtime drift detected:

- <path>: <short reason>
- <path>: <short reason>
```

On success:

```text
Runtime drift check passed.
```

## Rollout

### Phase 1: Report Mode

Implement the script and run it manually. It may report current known drift
without blocking docs/memory checks.

### Phase 2: Cleanup

Fix P0-A drift:

- stale artifact governance;
- unregistered foundation agents;
- planning mode conflict;
- `intake` semantics.

### Phase 3: Check Mode

After P0-A and AGENTS cleanup, add the validator to the required docs/preflight
path only if it stays fast and deterministic.

## Non-Goals

- no YAML route validation in v1;
- no `openai.yaml` schema validation in v1;
- no stage enum validation in v1;
- no memory-index route drift in v1;
- no code generation;
- no automatic fix mode.

Those belong to validator v2 only if v1 proves useful.
