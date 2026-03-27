# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
