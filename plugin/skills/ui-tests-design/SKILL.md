---
name: ui-tests-design
description: Plan, review, write and repair React component, hook and utility tests with TypeScript, Vitest and React Testing Library. Use when the user asks to add or improve frontend tests, cover a React component or hook, fix flaky component tests, or review test files for brittle queries, mocks or waits. This is the test-design policy for React code; the vitest skill only documents the runner API. Also use for Polish requests such as "napisz testy komponentu", "testy frontendu", "popraw testy Reacta" or "niestabilne testy". Excludes backend, E2E and visual regression testing.
---

# UI Tests Design

You are an expert frontend test engineer. You write tests that give developers real confidence their software works - not tests that exist to hit a coverage number.

## Core Philosophy

**"The more your tests resemble the way your software is used, the more confidence they can give you."**

Follow the Testing Trophy, not the Testing Pyramid:
- **Static analysis** (TypeScript + ESLint) catches typos and type errors
- **Unit tests** for pure logic (utilities, reducers, transformers)
- **Integration tests** for component behavior - this is where most effort goes
- **E2E tests** (out of scope for this skill) for critical user journeys

The mantra: **Write tests. Not too many. Mostly integration.**

Every test you write must answer: "Does this test give me confidence that the software works for real users?" If not, do not write it.

## Workflow

Match the requested mode and scope. Read the existing tests and configuration before asking questions or editing.

- **Plan:** scenarios, assumptions, expectation sources, test levels and setup; no edits or execution claims.
- **Review:** findings with file locations, consequences and fixes; no unsolicited edits. Base severity on the defect's impact, not a style preference.
- **Implement:** make the authorized changes, run the narrowest relevant project test command and report its exact result. Distinguish tests, typecheck and lint; name skipped checks and blockers.

Check installed React, Vitest, Testing Library and user-event versions, DOM environment, setup files, cleanup registration, helpers and test conventions. Adapt examples without upgrading dependencies or restructuring the project merely to match this skill.

This skill decides what to test and how. For Vitest runner details (configuration, `vi` utilities, differences between major versions) consult the `vitest` skill when it is installed.

### Step 1: Analyze the Code Under Test

Before writing any test, READ the source code and answer:

1. **What does this code do from the user's perspective?** Identify the observable behavior - what renders, what changes on interaction, what gets called.
2. **Who are the two users?**
   - The **end-user** who sees rendered output and interacts with DOM elements
   - The **developer** who passes props, provides context, and composes the component
3. **What are the inputs?** Props, context values, URL params, store state, user interactions.
4. **What are the outputs?** Rendered DOM, side effects (API calls, navigation, callbacks), state changes visible in the UI.
5. **What are the edge cases?** Loading states, error states, empty states, boundary values, disabled states.
6. **What external dependencies exist?** API calls, timers, router, context providers, third-party libraries.

### Step 2: Plan Test Cases

Organize test cases by user-visible behavior, NOT by internal methods or state.

**For a substantial plan (keep small tasks brief):**

For each behavior, define:
- **Scenario**: A plain-English description of what the user does or sees
- **Arrange**: What setup is needed (props, mocks, providers)
- **Act**: What interaction triggers the behavior
- **Assert**: What observable outcome proves it works
- **Expectation source**: requirement, accepted example, contract or bug report. Do not copy the implementation algorithm or treat its current output as the oracle. Surface conflicts and state assumptions when the contract is unclear.
- **Defect detected**: the specific plausible failure this test should catch.

**What to test:**
- Default rendering - does the component show the right initial state?
- User interactions - clicks, typing, form submission, keyboard navigation
- Conditional rendering - different props produce different output
- Async flows - loading → success, loading → error
- Edge cases - empty data, missing optional props, boundary values
- Accessibility - elements are reachable via accessible queries
- Callback invocation - are parent callbacks called with correct arguments?

**What NOT to test:**
- Internal state variable names or values
- CSS class names or inline styles
- Private methods or helper functions called internally
- The exact DOM structure or nesting
- Third-party library internals - trust they work
- Implementation details that could change during refactoring

### Step 3: Choose Testing Strategy

**Category Decision Tree:**

```
Is it a pure function (no React, no DOM)?
  YES → Unit test with plain Vitest (no render needed)
        Examples: reducers, transformers, validators, formatters, utils
  NO ↓

Is it a custom hook?
  YES → Use renderHook from @testing-library/react
  NO ↓

Is it a component?
  YES → Render with @testing-library/react
        Prefer integration style: render the real component tree
        Mock ONLY external boundaries (network, timers)
```

**Mocking Decision Tree:**

```
Is it a network call (fetch/axios/GraphQL)?
  → YES: Mock it. Use vi.mock() or MSW. Test loading/success/error states.

Is it a timer (setTimeout, setInterval, debounce)?
  → YES: Use vi.useFakeTimers(). Advance time explicitly.

Is it a child component?
  → NO, do NOT mock it. Render the full tree. No shallow rendering.

Is it a context provider?
  → Wrap with the real provider in test setup. Provide controlled values.

Is it a router?
  → Use MemoryRouter with initialEntries.

Is it a browser API (localStorage, IntersectionObserver, matchMedia)?
  → Mock at the global level in setup or per-test.

Everything else?
  → Do NOT mock. Mocking removes integration confidence.
```

Consult `references/testing-recipes.md` for code patterns covering each scenario.

### Step 4: Write the Tests

**File location and naming:**
- Follow the project layout; when none exists, colocate tests: `ComponentName.test.tsx` beside `ComponentName.tsx`
- For hooks: `useHookName.test.ts` beside `useHookName.ts`
- For utilities: `utilName.test.ts` beside `utilName.ts`

**Defaults for maintainable tests:**

1. **Prefer `screen` for document queries.** Use `within()` for a specific region and render-bound queries for a custom container.
   ```tsx
   // Valid, but screen is simpler for document-wide queries
   const { getByRole } = render(<Button />)
   // CORRECT
   render(<Button />)
   screen.getByRole('button')
   ```

2. **Prefer `userEvent` for supported interactions.** Set it up before rendering. Use `fireEvent` for a justified lower-level test, such as an unsupported event or an isolated timer contract, keeping real user interaction coverage separately.
   ```tsx
   const user = userEvent.setup()
   render(<MyComponent />)
   await user.click(screen.getByRole('button'))
   ```

3. **Follow the query priority.** Consult `references/query-guide.md` for the full decision tree.
   - `getByRole` - default choice for nearly everything
   - `getByLabelText` - form fields
   - `getByPlaceholderText` - only when no label exists
   - `getByText` - non-interactive content
   - `getByDisplayValue` - filled form inputs
   - `getByTestId` - absolute last resort

4. **Use `findBy*` for an element appearing asynchronously.** Use `waitFor` for changing state, attributes or calls, including an existing element:
   ```tsx
   await waitFor(() => expect(screen.getByRole('button', { name: /save/i })).toBeEnabled())
   ```
   For presence alone:
   ```tsx
   // Valid but verbose for presence alone
   await waitFor(() => expect(screen.getByText('Loaded')).toBeInTheDocument())
   // CORRECT
   expect(await screen.findByText('Loaded')).toBeInTheDocument()
   ```

5. **Prefer `queryBy*` for absence assertions.** Nonthrowing lookup may also suit an explicitly optional element; always assert the intended condition.
   ```tsx
   expect(screen.queryByText('Error')).not.toBeInTheDocument()
   ```

6. **No unnecessary `act()` wrappers.** Testing Library handles its own operations; wrap manual timer advances or direct hook updates that trigger React state in awaited `act()`. Diagnose warnings rather than silencing them.

7. **No side-effects inside `waitFor`.** Only assertions belong there.

8. **Prefer one condition per `waitFor` callback** for clear diagnostics. Any failing assertion is retried until timeout; a single assertion does not fail immediately.

9. **Prefer factory setup functions when they clarify local inputs.** Hooks are valid for independent fixture setup and guaranteed cleanup; avoid hidden state shared across tests.
   ```tsx
   // Valid when recreated per test; a factory may make dependencies clearer
   let user: UserEvent
   beforeEach(() => { user = userEvent.setup() })

   // CORRECT - isolated factory
   function setup(props = {}) {
     const user = userEvent.setup()
     render(<LoginForm {...props} />)
     return {
       user,
       emailInput: screen.getByLabelText(/email/i),
       submitButton: screen.getByRole('button', { name: /submit/i }),
     }
   }
   ```

10. **Minimize nesting.** Avoid deep `describe` blocks. Group by file, not by `describe`. Use nesting when it clarifies behavior; there is no fixed depth limit.

11. **Write descriptive test names** that describe behavior, not implementation.
    ```tsx
    // WRONG
    it('sets isOpen to true')
    // CORRECT
    it('displays dropdown options when the trigger is clicked')
    ```

12. **Prioritize valuable coverage.** Follow existing thresholds without inventing a universal percentage or changing project gates.

### Step 5: Verify Test Quality

Use the checks relevant to the task. Mark unverified checks explicitly.
For a bug fix, confirm the regression fails before the fix and passes after it when the relevant revision and runtime are available. A failure must concern the target behavior, not broken setup. Any deliberate mutation must be isolated, reversible and within the task scope. Do not weaken assertions, add skips or update expectations merely to make tests green. Changes to production code or quality configuration need authorization from the task.


- [ ] Every query uses the accessible query priority (getByRole first)
- [ ] No test relies on CSS class names, inline styles, or DOM structure
- [ ] No test accesses internal state, refs, or instance methods
- [ ] Supported interactions use `userEvent`; lower-level exceptions are justified
- [ ] Appearance uses `findBy*`; state changes and disappearance use the appropriate assertion/wait
- [ ] No side-effects inside `waitFor` callbacks
- [ ] No unnecessary `act()` wrappers
- [ ] Each test is independent, including any setup and cleanup hooks
- [ ] Mocks are limited to external boundaries (network, timers, browser APIs)
- [ ] No shallow rendering of child components
- [ ] Test names describe user-visible behavior
- [ ] Tests would survive a refactor that preserves the same external behavior
- [ ] Components wrapped in required providers (Context, Router, Store)
- [ ] Cleanup is registered once: RTL auto-cleanup requires an available global `afterEach`; for Vitest without globals, register `afterEach(cleanup)` in setup. Restore timers, spies and changed globals separately, even after failures

Consult `references/anti-patterns.md` for a detailed catalog of mistakes to avoid.

## Test Review Mode

When reviewing existing tests (not writing new ones), evaluate against:

1. **Resilience**: Would these tests break if the component was refactored without changing behavior?
2. **Confidence**: Do these tests verify what a real user would experience?
3. **Readability**: Can a developer understand what is being tested without reading the source?
4. **Completeness**: Are the important behaviors covered? Are edge cases represented?
5. **Speed**: Are there unnecessary waits, redundant renders, or over-mocked setups?

Report issues using severity levels:
- **CRITICAL**: Demonstrated false confidence on a high-impact behavior or broken isolation; explain the missed defect
- **WARNING**: Test is brittle or could be improved (wrong query type, unnecessary mock)
- **INFO**: Style or convention improvement (naming, structure, minor readability)

## TypeScript Considerations

- Use `.tsx` extension for files that render JSX. Use `.ts` for pure logic tests.
- Respect test-specific tsconfig boundaries. Use explicit Vitest imports when globals are disabled and `@testing-library/jest-dom/vitest` in setup; add global types only when the project uses them.
- Let TypeScript enforce prop contracts - if a required prop is missing, the compiler catches it before the test runs.
- Use `vi.fn<(arg: ArgType) => ReturnType>()` for type-safe mock functions.
- Use `satisfies` or explicit type annotations for mock data to catch mismatches at compile time.
- Prefer `vi.mocked()` to cast mocked modules for type-safe access.

## What This Skill Does NOT Do

- E2E testing (use Playwright or Cypress for that)
- Visual regression testing
- Performance testing or benchmarking
- Testing non-React frameworks (Vue, Svelte, Angular)
- Backend or API testing
- Generating snapshot tests (these are almost always low-value)
