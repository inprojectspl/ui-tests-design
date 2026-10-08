# Anti-Patterns Catalog

A comprehensive reference of common testing mistakes, why they are harmful, and how to fix them. Assign finding severity from demonstrated consequences, not from the pattern name.

---

## Risk: Testing Implementation Details

**The Problem:**
Tests that rely on internal state, private methods, or DOM structure break when code is refactored - even if behavior is unchanged. This produces **false negatives** (test breaks, app is fine) and encourages developers to stop trusting or maintaining tests.

**Bad:**
```tsx
// Accesses internal state
const wrapper = render(<Accordion items={items} />)
expect(wrapper.state('openIndex')).toBe(0)

// Calls instance methods directly
wrapper.instance().setOpenIndex(1)
```

**Good:**
```tsx
render(<Accordion items={items} />)
await user.click(screen.getByRole('button', { name: /section 1/i }))
expect(screen.getByText('Section 1 content')).toBeVisible()
```

**Why it matters:** If you refactor `openIndex` from a number to an array, the bad test breaks. The good test still passes because user-visible behavior is unchanged.

---

## Risk: Querying by CSS Class Names or DOM Structure

**The Problem:**
CSS classes exist for styling, not for testing contracts. When styles change, tests break for no behavioral reason.

**Bad:**
```tsx
const { container } = render(<LoginForm />)
const button = container.querySelector('.submit-btn')
const input = container.querySelector('.username-field')
```

**Good:**
```tsx
render(<LoginForm />)
const button = screen.getByRole('button', { name: /sign in/i })
const input = screen.getByLabelText(/username/i)
```

---

## Risk: Using Shallow Rendering

**The Problem:**
Shallow rendering mocks all child components, testing only the current component in complete isolation. This inherently tests implementation details (which child components are used, what props are passed) rather than actual behavior.

**Rule:** Always render the full component tree. If the tree is too expensive, mock only the expensive leaf dependencies (API calls, heavy third-party widgets), not the intermediate React components.

---

## Risk: Not Using `userEvent`

**The Problem:**
`fireEvent` dispatches a single, low-level DOM event. Real user interactions trigger multiple events in sequence (focus, keydown, keypress, input, keyup, change, blur). Libraries that listen for specific events in this sequence will not respond to `fireEvent`.

**Bad:**
```tsx
fireEvent.change(input, { target: { value: 'hello' } })
fireEvent.click(button)
```

**Good:**
```tsx
const user = userEvent.setup()
await user.type(input, 'hello')
await user.click(button)
```

**Default:** Set up user-event before render. Use `fireEvent` for a justified low-level case, documenting what interaction coverage it omits. For the tested timer compatibility limitation, keep real-clock user-event coverage separately as shown in the recipes.

---

## Review: Waiting for Presence Verbosely

**The Problem:**
`findBy*` queries already combine `getBy*` + `waitFor` under the hood. For presence alone, prefer `findBy*`. For an existing element changing state, `waitFor(() => expect(screen.getByRole('button', { name: /save/i })).toBeEnabled())` is appropriate. Waiting only for presence would miss the disabled-state defect.

**Bad:**
```tsx
await waitFor(() => {
  expect(screen.getByText('Data loaded')).toBeInTheDocument()
})
```

**Good:**
```tsx
expect(await screen.findByText('Data loaded')).toBeInTheDocument()
```

---

## Risk: Side-Effects Inside `waitFor`

**The Problem:**
`waitFor` runs its callback multiple times (on an interval and on DOM mutations). Putting interactions inside means they execute an unpredictable number of times, causing flaky tests.

**Bad:**
```tsx
await waitFor(() => {
  fireEvent.click(button)  // May click 5+ times!
  expect(screen.getByText('Success')).toBeInTheDocument()
})
```

**Good:**
```tsx
await user.click(button)
expect(await screen.findByText('Success')).toBeInTheDocument()
```

---

## Risk: Wrapping Everything in `act()`

**The Problem:**
`render()` and `userEvent` already wrap their operations in `act()`. Adding your own is redundant noise. If you see `act()` warnings, they signal a real issue (like an unhandled async update), not something to silence with more wrappers.

**Bad:**
```tsx
act(() => {
  render(<MyComponent />)
})
```

**Good:**
```tsx
render(<MyComponent />)
```

**If you see act() warnings:** Identify the update. Await observable async behavior; use awaited `act()` for manual timer advances or direct hook calls that update state. Neither adding wrappers everywhere nor replacing every wait with `findBy*` is a general fix.

---

## Risk: Empty `waitFor` Callbacks

**The Problem:**
An empty `waitFor(() => {})` succeeds on its first callback; it does not reliably wait for an application update. This creates fragile tests that break when async internals change.

**Bad:**
```tsx
await waitFor(() => {})
expect(screen.getByText('Done')).toBeInTheDocument()
```

**Good:**
```tsx
expect(await screen.findByText('Done')).toBeInTheDocument()
```

---

## Review: Not Using `screen`

**The Problem:**
Destructuring queries from `render()` requires updating the destructure every time you need a different query. `screen` gives direct access to all queries on `document.body`.

**Bad:**
```tsx
const { getByRole, getByText, queryByText } = render(<App />)
```

Use `within(region)` for scoped queries and render-bound queries for custom containers.

**Good:**
```tsx
render(<App />)
screen.getByRole('button')
screen.getByText('Hello')
screen.queryByText('Hidden')
```

---

## Review: Over-Mocking

**The Problem:**
Every mock removes confidence in the integration between your code and the mocked dependency. If you mock everything, your tests prove nothing about whether the pieces work together.

**Rule of thumb:** Mock only at system boundaries:
- Network calls (fetch, axios, GraphQL clients)
- Timers (setTimeout, setInterval)
- Browser APIs not available in jsdom (IntersectionObserver, matchMedia, etc.)
- Expensive third-party services (analytics, payment SDKs)

Do NOT mock:
- Child React components
- Utility functions within the same codebase
- State management (render with real providers instead)
- React Router (use MemoryRouter)

---

## Review: Deep `describe` Nesting with `beforeEach` Mutations

**The Problem:**
Nested `describe` blocks with `beforeEach` hooks that reassign variables create a complex, hard-to-trace lifecycle. When reading a test, you have to mentally execute every `beforeEach` in the chain to know the current state.

**Bad:**
```tsx
describe('LoginForm', () => {
  let handleSubmit: vi.Mock

  beforeEach(() => {
    handleSubmit = vi.fn()
  })

  describe('when submitted', () => {
    beforeEach(() => {
      render(<LoginForm onSubmit={handleSubmit} />)
      // ... more setup
    })

    describe('with valid data', () => {
      beforeEach(() => {
        // Even more setup - where is handleSubmit's current value?
      })

      it('calls onSubmit', () => { /* ... */ })
    })
  })
})
```

**Good:**
```tsx
function setup(overrides = {}) {
  const handleSubmit = vi.fn()
  const user = userEvent.setup()
  render(<LoginForm onSubmit={handleSubmit} {...overrides} />)
  return { handleSubmit, user }
}

it('calls onSubmit with form data when submitted with valid input', async () => {
  const { handleSubmit, user } = setup()
  await user.type(screen.getByLabelText(/email/i), 'test@example.com')
  await user.click(screen.getByRole('button', { name: /submit/i }))
  expect(handleSubmit).toHaveBeenCalledWith({ email: 'test@example.com' })
})
```

---

## Review: Snapshot Abuse

**The Problem:**
Large component snapshots break on every minor change (a class name, a text tweak, an attribute order change). They produce noise rather than signal, and developers learn to blindly update them with `--update`.

**Rule:** Avoid snapshot tests for components. They test DOM structure (an implementation detail). If you must use them, snapshot only small, meaningful pieces of data - like the arguments passed to a callback or a serialized data structure - not rendered output.

---

## Review: Multiple Assertions in a Single `waitFor`

**The Problem:**
Any failing assertion causes retry until timeout, including a single assertion. Prefer one awaited condition for clearer diagnostics. An immediate follow-up assertion is valid only if the same completed transition guarantees it; otherwise await that condition too.

**Bad:**
```tsx
await waitFor(() => {
  expect(screen.getByText('Title')).toBeInTheDocument()
  expect(screen.getByText('Subtitle')).toBeInTheDocument()
})
```

**Good:**
```tsx
expect(await screen.findByText('Title')).toBeInTheDocument()
expect(screen.getByText('Subtitle')).toBeInTheDocument()
```

---

## Review: Testing Third-Party Libraries

**The Problem:**
If you test that React Router navigates correctly when you pass a `to` prop, you are testing React Router, not your code. Trust the library; test your integration with it.

**Bad:**
```tsx
it('navigates to the correct URL', () => {
  render(<MemoryRouter><NavLink to="/about" /></MemoryRouter>)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/about')
})
```

**Good:**
```tsx
it('renders a link to the about page with the correct label', () => {
  render(<MemoryRouter><Navigation /></MemoryRouter>)
  expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument()
})
```

---

## Review: Unnecessary Manual Cleanup

Check whether RTL registered cleanup. With Vitest globals enabled, its automatic hook can register; without a global `afterEach`, use a setup file:

```tsx
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

afterEach(cleanup)
```

Do not register this twice. If timer teardown needs an ordered cleanup sequence, use the explicit pattern in [testing-recipes.md](testing-recipes.md).

Restore resources in hooks or `finally`, never only after successful assertions:
- `vi.restoreAllMocks()` restores spies; it does not undo module mocks or reset every `vi.fn()` implementation.
- Clear call history or reset implementations deliberately according to the fixture; configure module mocks per test.
- Unmount components and cancel owned polling before bounded pending-timer draining, then restore real timers in `finally`.
- Restore stubbed globals/env and changed storage separately.

Nesting and fixture reassignment are style choices unless they cause hidden state or order dependence. Findings should identify the observed consequence, not mechanically inherit the heading's severity.
