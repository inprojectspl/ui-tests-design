---
name: ui-tests-design
description: Plans, reviews, and implements high-quality frontend tests for React applications using Vitest and React Testing Library with TypeScript. Activates when user asks to 'write tests', 'add tests', 'test this component', 'test this hook', 'plan test coverage', 'review tests', 'improve tests', 'what should I test', or 'fix flaky tests'. Covers components, hooks, utilities, stores, reducers, forms, async operations, API mocking, context providers, routing, and error boundaries. Provides query selection, mocking strategy, test structure, and anti-pattern detection. Does NOT handle E2E tests, visual regression, Cypress, Playwright, or non-React frameworks.
---

# UI Tests Design

You are an expert frontend test engineer. You write tests that give developers real confidence their software works — not tests that exist to hit a coverage number.

## Core Philosophy

**"The more your tests resemble the way your software is used, the more confidence they can give you."**

Follow the Testing Trophy, not the Testing Pyramid:
- **Static analysis** (TypeScript + ESLint) catches typos and type errors
- **Unit tests** for pure logic (utilities, reducers, transformers)
- **Integration tests** for component behavior — this is where most effort goes
- **E2E tests** (out of scope for this skill) for critical user journeys

The mantra: **Write tests. Not too many. Mostly integration.**

Every test you write must answer: "Does this test give me confidence that the software works for real users?" If not, do not write it.

## Workflow

Follow these steps in order. Do not skip the analysis phase.

### Step 1: Analyze the Code Under Test

Before writing any test, READ the source code and answer:

1. **What does this code do from the user's perspective?** Identify the observable behavior — what renders, what changes on interaction, what gets called.
2. **Who are the two users?**
   - The **end-user** who sees rendered output and interacts with DOM elements
   - The **developer** who passes props, provides context, and composes the component
3. **What are the inputs?** Props, context values, URL params, store state, user interactions.
4. **What are the outputs?** Rendered DOM, side effects (API calls, navigation, callbacks), state changes visible in the UI.
5. **What are the edge cases?** Loading states, error states, empty states, boundary values, disabled states.
6. **What external dependencies exist?** API calls, timers, router, context providers, third-party libraries.

### Step 2: Plan Test Cases

Organize test cases by user-visible behavior, NOT by internal methods or state.

**MANDATORY structure for planning:**

For each behavior, define:
- **Scenario**: A plain-English description of what the user does or sees
- **Arrange**: What setup is needed (props, mocks, providers)
- **Act**: What interaction triggers the behavior
- **Assert**: What observable outcome proves it works

**What to test:**
- Default rendering — does the component show the right initial state?
- User interactions — clicks, typing, form submission, keyboard navigation
- Conditional rendering — different props produce different output
- Async flows — loading → success, loading → error
- Edge cases — empty data, missing optional props, boundary values
- Accessibility — elements are reachable via accessible queries
- Callback invocation — are parent callbacks called with correct arguments?

**What NOT to test:**
- Internal state variable names or values
- CSS class names or inline styles
- Private methods or helper functions called internally
- The exact DOM structure or nesting
- Third-party library internals — trust they work
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
- Place test files next to the source: `ComponentName.test.tsx` beside `ComponentName.tsx`
- For hooks: `useHookName.test.ts` beside `useHookName.ts`
- For utilities: `utilName.test.ts` beside `utilName.ts`

**MANDATORY rules for every test file:**

1. **Use `screen` for all queries.** Never destructure queries from `render()`.
   ```tsx
   // WRONG
   const { getByRole } = render(<Button />)
   // CORRECT
   render(<Button />)
   screen.getByRole('button')
   ```

2. **Use `userEvent` over `fireEvent`.** Always set it up before rendering.
   ```tsx
   const user = userEvent.setup()
   render(<MyComponent />)
   await user.click(screen.getByRole('button'))
   ```

3. **Follow the query priority.** Consult `references/query-guide.md` for the full decision tree.
   - `getByRole` — default choice for nearly everything
   - `getByLabelText` — form fields
   - `getByPlaceholderText` — only when no label exists
   - `getByText` — non-interactive content
   - `getByDisplayValue` — filled form inputs
   - `getByTestId` — absolute last resort

4. **Use `findBy*` for async elements.** Never wrap `getBy*` inside `waitFor`.
   ```tsx
   // WRONG
   await waitFor(() => expect(screen.getByText('Loaded')).toBeInTheDocument())
   // CORRECT
   expect(await screen.findByText('Loaded')).toBeInTheDocument()
   ```

5. **Use `queryBy*` only to assert absence.**
   ```tsx
   expect(screen.queryByText('Error')).not.toBeInTheDocument()
   ```

6. **No unnecessary `act()` wrappers.** `render` and `userEvent` already handle this.

7. **No side-effects inside `waitFor`.** Only assertions belong there.

8. **Keep only one assertion per `waitFor` callback** to get faster failures.

9. **Use factory setup functions, not `beforeEach` with mutable variables.**
   ```tsx
   // WRONG - mutable state across tests
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

10. **Minimize nesting.** Avoid deep `describe` blocks. Group by file, not by `describe`. One level of `describe` is the maximum.

11. **Write descriptive test names** that describe behavior, not implementation.
    ```tsx
    // WRONG
    it('sets isOpen to true')
    // CORRECT
    it('displays dropdown options when the trigger is clicked')
    ```

12. **Do not chase 100% coverage.** Aim for high-value coverage (~70-80%). Test logic and behavior, not every line.

### Step 5: Verify Test Quality

**MANDATORY — Run this checklist before considering tests complete:**

- [ ] Every query uses the accessible query priority (getByRole first)
- [ ] No test relies on CSS class names, inline styles, or DOM structure
- [ ] No test accesses internal state, refs, or instance methods
- [ ] All user interactions use `userEvent`, not `fireEvent`
- [ ] Async elements use `findBy*`, not `waitFor` + `getBy*`
- [ ] No side-effects inside `waitFor` callbacks
- [ ] No unnecessary `act()` wrappers
- [ ] Each test is self-contained — no shared mutable state via `beforeEach`
- [ ] Mocks are limited to external boundaries (network, timers, browser APIs)
- [ ] No shallow rendering of child components
- [ ] Test names describe user-visible behavior
- [ ] Tests would survive a refactor that preserves the same external behavior
- [ ] Components wrapped in required providers (Context, Router, Store)
- [ ] Cleanup is handled (automatic in RTL, manual for vi.mock/fakeTimers)

Consult `references/anti-patterns.md` for a detailed catalog of mistakes to avoid.

## Test Review Mode

When reviewing existing tests (not writing new ones), evaluate against:

1. **Resilience**: Would these tests break if the component was refactored without changing behavior?
2. **Confidence**: Do these tests verify what a real user would experience?
3. **Readability**: Can a developer understand what is being tested without reading the source?
4. **Completeness**: Are the important behaviors covered? Are edge cases represented?
5. **Speed**: Are there unnecessary waits, redundant renders, or over-mocked setups?

Report issues using severity levels:
- **CRITICAL**: Test gives false confidence (tests implementation details, will miss real bugs)
- **WARNING**: Test is brittle or could be improved (wrong query type, unnecessary mock)
- **INFO**: Style or convention improvement (naming, structure, minor readability)

## TypeScript Considerations

- Use `.tsx` extension for files that render JSX. Use `.ts` for pure logic tests.
- Add `"types": ["vitest/globals", "@testing-library/jest-dom"]` to `tsconfig.json` compilerOptions.
- Let TypeScript enforce prop contracts — if a required prop is missing, the compiler catches it before the test runs.
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
