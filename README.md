# ui-tests-design

Plan, review and implement React component, hook and utility tests using TypeScript, Vitest and React Testing Library.

Tests focus on observable behavior and real component integration, with controlled external boundaries. The skill distinguishes element appearance from state changes, uses conditional cleanup registration, and requires test results rather than checklist-only claims. It adapts to the project's versions and conventions. E2E, visual regression and backend testing are outside its scope.

## Installation

### AI Marketplace

The plugin is distributed through `inprojects-ai-tools` from this repository's `plugin/` directory, pinned to tag `v1.1.0`. After the tag and marketplace update are published, install it in Claude Code:

```text
/plugin install ui-tests-design@inprojects-ai-tools
```

For Codex, refresh the marketplace and select `ui-tests-design` in the plugin directory, or use the commands supported by your installed CLI. The contained skill is `ui-tests-design`. For UI design, the existing plugin selector `ui-design` is preserved.

### Standalone project or user installation

Keep a source checkout outside the application's skills directory, then export only the skill files. This avoids a nested `.git` directory and excludes generated plugin copies and evaluations:

```sh
skill_checkout=$(mktemp -d)
git clone --branch v1.1.0 --depth 1 https://github.com/inprojectspl/ui-tests-design.git "$skill_checkout/source"
mkdir -p .claude/skills/ui-tests-design
git -C "$skill_checkout/source" archive HEAD SKILL.md references | tar -x -C .claude/skills/ui-tests-design
```

Commit that ordinary directory in the parent project. For Claude user installation replace the destination with `~/.claude/skills/ui-tests-design`. For Codex use `.agents/skills/ui-tests-design` or `~/.agents/skills/ui-tests-design`. Copy both `SKILL.md` and `references/`; copying only the entrypoint is insufficient. Existing root-level `SKILL.md` paths remain available.

To update, review the next release, fetch/check out its tag in the source checkout, repeat the archive export and commit the resulting diff. Review removed reference files as well; archive extraction does not delete obsolete files.

If the team deliberately uses submodules, configure one explicitly instead of committing an ordinary nested clone:

```sh
git submodule add https://github.com/inprojectspl/ui-tests-design.git .claude/skills/ui-tests-design
git -C .claude/skills/ui-tests-design checkout v1.1.0
git add .gitmodules .claude/skills/ui-tests-design
```

Other clones need `git submodule update --init --recursive` (or `git clone --recurse-submodules`). To update, fetch/check out the new tag within the submodule and commit the new gitlink in the parent. A submodule includes authoring/package files; prefer the archive method when only skill resources should be installed.

## Usage and results

- "Plan tests for LoginForm" returns scenarios, expectation sources and assumptions without edits.
- "Review SearchResults tests" returns located findings and impact without unsolicited rewrites.
- "Fix the flaky dismissal test" changes tests, runs the relevant command and reports results or blockers.

`userEvent` is the default for supported interactions. `waitFor` remains correct for a button becoming enabled. Hooks, nested groups and `within()` are valid when they improve clarity and isolation; no universal coverage percentage is prescribed.

## Maintenance and verification

`SKILL.md` and `references/` at the repository root are the authoring sources. `plugin/.claude-plugin/plugin.json` holds the release metadata. The generated `plugin/skills/`, portable `plugin/plugin.json` and compatibility `.codex-plugin/plugin.json` are committed so installing a tag requires no build step:

```sh
python3 scripts/package_plugin.py
python3 scripts/package_plugin.py --check
claude plugin validate plugin
```

This preserves standalone source paths while providing conventional plugin packaging for both runtimes. Generated files must not be edited directly. No MCP server, hook, extra permission or explicit-only invocation policy is required.

See [evaluation record](evals/README.md) for audit decisions, executable examples, exact versions and limitations. Example execution and agent behavioral evaluation are separate. See [CHANGELOG](CHANGELOG.md) for releases.

## License

MIT.
