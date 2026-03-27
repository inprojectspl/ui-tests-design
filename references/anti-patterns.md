# Anti-Patterns Catalog

A comprehensive reference of common testing mistakes, why they are harmful, and how to fix them. Severity reflects real-world impact on test suite quality.

---

## CRITICAL: Testing Implementation Details

**The Problem:**
Tests that rely on internal state, private methods, or DOM structure break when code is refactored — even if behavior is unchanged. This produces **false negatives** (test breaks, app is fine) and encourages developers to stop trusting or maintaining tests.

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

## CRITICAL: Querying by CSS Class Names or DOM Structure

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

## CRITICAL: Using Shallow Rendering

**The Problem:**
Shallow rendering mocks all child components, testing only the current component in complete isolation. This inherently tests implementation details (which child components are used, what props are passed) rather than actual behavior.

**Rule:** Always render the full component tree. If the tree is too expensive, mock only the expensive leaf dependencies (API calls, heavy third-party widgets), not the intermediate React components.

---

## HIGH: Not Using `userEvent`

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

**Key rule:** Always call `userEvent.setup()` BEFORE `render()`. This ensures proper event system initialization.

---

## HIGH: Using `getBy*` Inside `waitFor`

**The Problem:**
`findBy*` queries already combine `getBy*` + `waitFor` under the hood. Using `getBy*` inside `waitFor` is redundant and produces worse error messages.

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

## HIGH: Side-Effects Inside `waitFor`

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

## HIGH: Wrapping Everything in `act()`

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

**If you see act() warnings:** It usually means a state update happened after the test finished. The fix is to wait for the update (via `findBy*` or `waitFor`), not to add `act()`.

---

## HIGH: Empty `waitFor` Callbacks

**The Problem:**
An empty `waitFor(() => {})` just waits for one tick of the event loop. This creates fragile tests that break when async internals change.

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

## MEDIUM: Not Using `screen`

**The Problem:**
Destructuring queries from `render()` requires updating the destructure every time you need a different query. `screen` gives direct access to all queries on `document.body`.

**Bad:**
```tsx
const { getByRole, getByText, queryByText } = render(<App />)
```

**Good:**
```tsx
render(<App />)
screen.getByRole('button')
screen.getByText('Hello')
screen.queryByText('Hidden')
```

---

## MEDIUM: Over-Mocking

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

## MEDIUM: Deep `describe` Nesting with `beforeEach` Mutations

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
        // Even more setup — where is handleSubmit's current value?
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

## MEDIUM: Snapshot Abuse

**The Problem:**
Large component snapshots break on every minor change (a class name, a text tweak, an attribute order change). They produce noise rather than signal, and developers learn to blindly update them with `--update`.

**Rule:** Avoid snapshot tests for components. They test DOM structure (an implementation detail). If you must use them, snapshot only small, meaningful pieces of data — like the arguments passed to a callback or a serialized data structure — not rendered output.

---

## LOW: Multiple Assertions in a Single `waitFor`

**The Problem:**
If the first assertion in a `waitFor` callback passes but the second fails, you have to wait for the full timeout before seeing the failure. With a single assertion, the test fails immediately.

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

## LOW: Testing Third-Party Libraries

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

## LOW: Unnecessary Manual Cleanup

Modern React Testing Library handles cleanup automatically after every test. Calling `cleanup()` manually is redundant.

**Exception:** You DO need to manually clean up:
- `vi.restoreAllMocks()` — if not configured globally
- `vi.useRealTimers()` — after `vi.useFakeTimers()`
- Global state mutations (window.localStorage, global variables)
