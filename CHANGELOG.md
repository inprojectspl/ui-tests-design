# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.1] - 2026-10-08

### Changed

- Rewrote the skill description with concrete trigger situations and Polish request phrases, so agents that route by description alone, such as Claude Code, select the skill reliably.
- Separated this test-design policy from the `vitest` runner API skill in both directions.

## [1.1.0] - 2026-10-08

### Added

- Added executable async, timer, failure-cleanup and globals-mode checks with versioned dependencies and agent evaluation cases.
- Added generated Claude Code, Codex and portable plugin packages for marketplace distribution.

### Changed

- Separated plan, review and implementation outputs, required independent expectations and actual execution evidence, and made style defaults proportional to the project.
- Documented archive-based installation, submodule updates and installed-version checks.

### Fixed

- Corrected appearance versus state waiting, immediate dismissal, conditional cleanup registration and restoration after failed assertions.
- Wrapped manual React timer updates in awaited act and documented the reproduced user-event/fake-timer incompatibility with separate interaction and timer examples.

## [1.0.0] - 2026-03-27

### Added

- Core skill implementation (`SKILL.md`) with structured 5-step workflow: Analyze, Plan, Implement, Verify, Review
- Testing Trophy philosophy as the foundational approach (behavior-driven, integration-first)
- Decision tree for test category selection (unit vs integration vs component)
- Decision tree for mocking strategy (when to mock, what to mock, what never to mock)
- Mandatory verification checklist with 14 quality checks
- Test review mode with severity-based issue reporting (CRITICAL / WARNING / INFO)
- TypeScript-specific guidance for type-safe mocks and configuration
- Query selection guide (`references/query-guide.md`) with full priority order, ARIA role reference, and `getByRole` deep dive
- Anti-patterns catalog (`references/anti-patterns.md`) covering 13 common mistakes with severity ratings and code examples
- Testing recipes (`references/testing-recipes.md`) with 10 ready-to-use patterns:
  - Component with user interactions
  - Form submission
  - Async data fetching (API mocking)
  - Custom hooks with `renderHook`
  - Timers (debounce, delay, polling)
  - Context providers
  - Router integration
  - Pure functions (reducers, utilities)
  - Error boundaries
  - Testing absence of elements
  - Multiple providers (composite wrapper)
- README with installation instructions, usage examples, and reference links

[Unreleased]: https://github.com/inprojectspl/ui-tests-design/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/inprojectspl/ui-tests-design/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/inprojectspl/ui-tests-design/releases/tag/v1.1.0
[1.0.0]: https://github.com/inprojectspl/ui-tests-design/tree/5ca0dec0283b5d60d793b436af2b8756ae6b6a06
