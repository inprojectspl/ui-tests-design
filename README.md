# ui-tests-design

A Claude Skill that plans, reviews, and implements high-quality frontend tests for React applications using **Vitest**, **React Testing Library**, and **TypeScript**.

## What Problem Does This Solve?

Writing good frontend tests is harder than it looks. Most test suites suffer from one or more of these issues:

- **Brittle tests** that break on every refactor because they test implementation details
- **False confidence** from tests that pass even when the UI is broken
- **Wrong query choices** that make tests fragile and inaccessible
- **Over-mocking** that eliminates integration confidence
- **Snapshot abuse** that generates noise instead of signal
- **Flaky async tests** caused by misuse of `waitFor`, `act()`, or timing issues

This skill encodes the current best practices from React Testing Library, Kent C. Dodds' Testing Trophy philosophy, and modern Vitest patterns into a structured workflow that consistently produces robust, maintainable tests.

## Who Is This For?

- Developers working on React + Vite + TypeScript projects
- Teams that want consistent, high-quality test output from Claude
- Anyone writing or reviewing component tests, hook tests, or utility tests
- Projects using Vitest as their test runner and React Testing Library for component testing

## Capabilities

### Test Planning
- Analyzes source code to identify what needs testing
- Categorizes test cases by user-visible behavior
- Produces structured test plans (Arrange/Act/Assert)
- Identifies edge cases, error states, and boundary conditions

### Test Implementation
- Generates tests following the Testing Trophy philosophy
- Uses accessible queries (`getByRole` first, `getByTestId` last)
- Applies `userEvent` for realistic interaction simulation
- Handles async patterns correctly (`findBy*` over `waitFor` + `getBy*`)
- Provides factory setup functions instead of brittle `beforeEach` chains
- Includes proper provider wrapping for Context, Router, and stores

### Test Review
- Evaluates existing tests against a comprehensive anti-pattern catalog
- Reports issues by severity (CRITICAL / WARNING / INFO)
- Checks for implementation detail testing, query misuse, and over-mocking
- Verifies tests would survive a refactor

### Mocking Strategy
- Decision tree for when to mock vs. when to render real components
- Patterns for API mocking, timer mocking, and browser API mocking
- Guidance on MSW vs. `vi.mock()` tradeoffs

## Installation

### Claude Code (User-Level)

Copy the `ui-tests-design` folder into your skills directory:

```bash
cp -r ui-tests-design/ ~/.claude/skills/ui-tests-design
```

The skill will be available across all your projects.

### Claude Code (Project-Level)

Copy the `ui-tests-design` folder into your project's skill directory:

```bash
cp -r ui-tests-design/ .claude/skills/ui-tests-design
```

Commit it to Git so your team shares the same testing guidance.

### Claude.ai (Web)

1. Zip the `ui-tests-design` folder
2. Go to **Customize > Skills**
3. Click **Upload a skill**
4. Upload the zip file

## Usage

The skill activates automatically when you ask Claude to work with frontend tests. You can also invoke it explicitly.

### Example Prompts

**Writing new tests:**
```
Write tests for the UserProfile component
```

```
Add tests for the useAuth hook
```

```
Test the CartReducer — cover add, remove, and edge cases
```

**Planning test coverage:**
```
What should I test in this LoginForm component?
```

```
Plan test cases for the checkout flow
```

**Reviewing existing tests:**
```
Review the tests in SearchResults.test.tsx — are they following best practices?
```

```
This test file feels brittle. What should I fix?
```

**Fixing problems:**
```
Fix the flaky tests in Dashboard.test.tsx
```

```
These tests break every time I refactor. Help me make them resilient.
```

### Workflow

The skill follows a structured process:

1. **Analyze** — Read the source code, identify behavior, inputs, outputs, edge cases
2. **Plan** — Define test cases organized by user-visible behavior
3. **Implement** — Write tests following all rules (accessible queries, userEvent, factory setup, minimal mocking)
4. **Verify** — Run the mandatory quality checklist against anti-patterns

## Skill Structure

```
ui-tests-design/
├── SKILL.md                          # Core instructions and workflow
└── references/
    ├── anti-patterns.md              # Catalog of common testing mistakes
    ├── query-guide.md                # Query selection priority and examples
    └── testing-recipes.md            # Ready-to-use patterns for common scenarios
```

- **SKILL.md** contains the main workflow, decision trees, and verification checklist
- **references/** contains detailed documentation loaded on demand (progressive disclosure)

## Core Principles

This skill is built on these non-negotiable principles:

1. **"The more your tests resemble the way your software is used, the more confidence they can give you."** — React Testing Library guiding principle
2. **"Write tests. Not too many. Mostly integration."** — Kent C. Dodds
3. **Test behavior, not implementation.** If a refactor preserves behavior, tests must not break.
4. **Accessible queries first.** `getByRole` is the default; `getByTestId` is the last resort.
5. **Real interactions.** `userEvent` simulates what users actually do; `fireEvent` does not.
6. **Minimal mocking.** Mock only external boundaries (network, timers, browser APIs). Render real components.

## Non-Goals

This skill does **not** handle:

- End-to-end testing (Playwright, Cypress)
- Visual regression testing
- Performance testing or benchmarking
- Non-React frameworks (Vue, Svelte, Angular)
- Backend or API testing
- Snapshot testing (actively discouraged for components)

## References

The testing guidance in this skill is synthesized from:

- [React Testing Library documentation](https://testing-library.com/docs/react-testing-library/intro)
- [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles)
- [Common Mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) by Kent C. Dodds
- [Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details) by Kent C. Dodds
- [Write Tests. Not Too Many. Mostly Integration.](https://kentcdodds.com/blog/write-tests) by Kent C. Dodds
- [Avoid Nesting When You're Testing](https://kentcdodds.com/blog/avoid-nesting-when-youre-testing) by Kent C. Dodds
- [Making Your UI Tests Resilient to Change](https://kentcdodds.com/blog/making-your-ui-tests-resilient-to-change) by Kent C. Dodds
- [Vitest Documentation](https://vitest.dev/)
- [user-event Documentation](https://testing-library.com/docs/user-event/intro)

## License

MIT
