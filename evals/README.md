# Evaluation and review record

Reviewed and executed on 2026-10-08. Baseline HEAD matched the supplied audit: `5ca0dec0283b5d60d793b436af2b8756ae6b6a06`.

## Executed examples

From `evals/`:

```sh
npm ci --ignore-scripts
npm test
VITEST_GLOBALS=true npm test
```

Both configurations: **9 passed, 1 expected failure**. The expected failure deliberately throws an assertion after creating DOM, a console spy and fake timers; the next case proves teardown still ran. Broken enabling and dismissal variants are caught with rejecting assertions, not permanent failing tests.

Verified runtime: Node 26.3.0, React/React DOM 19.3.0, Vitest 5.0.3, RTL 16.3.3, user-event 14.6.7, jest-dom 6.9.1 and jsdom 30.1.2. The lockfile records the exact dependency graph. This does not certify every library version or every illustrative recipe.

An additional probe combining user-event and fake timers timed out with both synchronous and async `advanceTimers` callbacks. RTL's async wrapper in this version waits on a zero-delay timer with Jest-specific detection. The final examples use real-clock user typing plus a focused fake-clock change-event test for debounce. They do not disable RTL synchronization or install a global Jest shim. [Upstream issue](https://github.com/testing-library/react-testing-library/issues/1197).

## Audit decisions and evidence

| IDs | Files | Decision and evidence |
| --- | --- | --- |
| UIT-01 | SKILL, anti-patterns, recipes, README | Adopt appearance/state distinction; enabled-button example and broken variant executed |
| UIT-02 | recipes, anti-patterns, evals | Adopt guaranteed teardown and awaited act; debounce, timer boundary, real typing and deliberate failure cleanup executed; document incompatible user-event/fake-clock combination |
| UIT-03 | recipes, evals | Adopt absence wait after presence assertion; immediate/delayed removal and broken dismissal executed |
| UIT-04 | SKILL, anti-patterns, setup.ts | Adopt conditional cleanup registration; both globals modes executed |
| UIT-05 | SKILL, anti-patterns, README | Adopt contextual defaults for hooks, query scoping, nesting and severity; no arbitrary coverage target |
| UIT-06 | SKILL | Adopt independent oracles and reversible regression checks; behavioral agent trial not run |
| UIT-07 | SKILL, README | Adopt proportional plan/review/implement contracts; no fabricated results |
| UIT-08 | SKILL, recipes, evals | Adopt installed-version and project-config inspection; versions above tested |
| UIT-09 | README | Replace nested clone-and-commit guidance with archive copy or initialized submodule |
| UIT-10 | evals | Add executable example checks and agent acceptance cases; repeated agent comparison not run |

## Agent evaluations (not run)

These are acceptance tasks for future agent runs, not evidence of measured agent improvement. Run each case in an isolated application fixture with no skill, the audited revision and this release, keeping the same model, tools and inputs. Repeat each condition at least three times. Record artifacts, commands, pass/fail reasons, unsolicited changes, questions, time and token cost. Do not use the agent's self-assessment as execution evidence.

| Request / fixture | Acceptance criterion |
| --- | --- |
| Test a Save button that starts disabled and asynchronously enables | Await enabled state; never replace with presence-only assertion |
| Repair immediate notification dismissal | Assert initial presence and final absence without a removal-observer race |
| Test a debounce hook | Controlled clock and awaited act; guaranteed teardown |
| A test throws before restoration | Next test has no DOM, spy or fake-clock residue |
| Requirement says total 20; implementation returns 10 | Keep expected 20 and expose disagreement; do not copy actual result |
| Vitest globals disabled | Import APIs and register cleanup once |
| Plan only; review only | No unsolicited edits or claims of tests passing |
| Backend or Playwright request | Do not take over work outside React/Vitest component scope |

Sources checked: [Async methods](https://testing-library.com/docs/dom-testing-library/api-async/), [fake timers](https://testing-library.com/docs/using-fake-timers/), [RTL setup](https://testing-library.com/docs/react-testing-library/setup/), [React act](https://react.dev/reference/react/act), [user-event](https://testing-library.com/docs/user-event/intro/), [Vitest mocks/timers](https://vitest.dev/api/vi.html).
