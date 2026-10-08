# Testing Recipes

Adaptable patterns for common testing scenarios in React + Vitest + React Testing Library + TypeScript. Application components below are illustrative imports, not bundled fixtures. Adapt to installed versions. Import `it`, `expect` and `vi` explicitly from Vitest when globals are disabled. See the repository evaluation README for executed examples and versions.

---

## Recipe: Component with User Interactions

**When:** Testing buttons, forms, toggles, dropdowns, or any interactive element.

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Counter } from './Counter'

it('increments the count when the button is clicked', async () => {
  const user = userEvent.setup()
  render(<Counter initialCount={0} />)

  expect(screen.getByText('Count: 0')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /increment/i }))

  expect(screen.getByText('Count: 1')).toBeInTheDocument()
})
```

**Key points:**
- `userEvent.setup()` is called BEFORE `render()`
- Queries use accessible roles and names
- Assertions check visible text, not state variables

---

## Recipe: Form Submission

**When:** Testing form validation, submission, and callback invocation.

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'

function setup(overrides: Partial<React.ComponentProps<typeof LoginForm>> = {}) {
  const onSubmit = vi.fn()
  const user = userEvent.setup()
  render(<LoginForm onSubmit={onSubmit} {...overrides} />)
  return {
    user,
    onSubmit,
    emailInput: screen.getByLabelText(/email/i),
    passwordInput: screen.getByLabelText(/password/i),
    submitButton: screen.getByRole('button', { name: /sign in/i }),
  }
}

it('calls onSubmit with form data when fields are valid', async () => {
  const { user, onSubmit, emailInput, passwordInput, submitButton } = setup()

  await user.type(emailInput, 'test@example.com')
  await user.type(passwordInput, 'securepassword')
  await user.click(submitButton)

  expect(onSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'securepassword',
  })
})

it('displays validation error when email is empty', async () => {
  const { user, submitButton } = setup()

  await user.click(submitButton)

  expect(screen.getByText(/email is required/i)).toBeInTheDocument()
})
```

**Key points:**
- Factory function `setup()` replaces `beforeEach` with mutable variables
- Factory returns only what tests need - elements and mocks
- Each test is self-contained and readable

---

## Recipe: Async Data Fetching (API Mocking)

**When:** Testing components that load data from an API.

```tsx
import { render, screen } from '@testing-library/react'
import { UserProfile } from './UserProfile'
import { api } from '../services/api'

vi.mock('../services/api')

it('shows loading state then renders user data on success', async () => {
  vi.mocked(api.getUser).mockResolvedValue({
    name: 'Jane Doe',
    email: 'jane@example.com',
  })

  render(<UserProfile userId="123" />)

  // Loading state
  expect(screen.getByText(/loading/i)).toBeInTheDocument()

  // Success state - use findBy* to wait for async update
  expect(await screen.findByText('Jane Doe')).toBeInTheDocument()
  expect(screen.getByText('jane@example.com')).toBeInTheDocument()

  // Loading indicator should be gone
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
})

it('displays error message on API failure', async () => {
  vi.mocked(api.getUser).mockRejectedValue(new Error('Network error'))

  render(<UserProfile userId="123" />)

  expect(await screen.findByText(/failed to load/i)).toBeInTheDocument()
})

it('shows empty state when no data is returned', async () => {
  vi.mocked(api.getUser).mockResolvedValue(null)

  render(<UserProfile userId="123" />)

  expect(await screen.findByText(/no user found/i)).toBeInTheDocument()
})
```

**Key points:**
- Mock at the module level with `vi.mock()`
- Use `vi.mocked()` for type-safe access to mock functions
- Test all three states: loading, success, error
- Use `findBy*` for appearing elements; `waitFor` remains appropriate for state, calls and absence

---

## Recipe: Custom Hook

**When:** Testing a reusable hook in isolation.

Use the explicit timer setup below (register once) in a Vitest configuration with `globals: false`. It unmounts components first so effect cleanup can cancel owned intervals, drains only remaining pending timers, and restores the real clock even if draining fails. Do not use unbounded `runAllTimers` for polling.

```tsx
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useDebounce } from './useDebounce'

beforeEach(() => vi.useFakeTimers())
afterEach(async () => {
  try {
    cleanup()
    await act(async () => { await vi.runOnlyPendingTimersAsync() })
  } finally {
    vi.useRealTimers()
    vi.restoreAllMocks()
  }
})

it('returns the debounced value after the delay', async () => {
  const { result, rerender } = renderHook(
    ({ value }) => useDebounce(value, 300),
    { initialProps: { value: 'hello' } },
  )
  rerender({ value: 'hello world' })
  expect(result.current).toBe('hello')
  await act(async () => { await vi.advanceTimersByTimeAsync(300) })
  expect(result.current).toBe('hello world')
})
```

For application-owned polling, assert cancellation on unmount. Unknown recurring timers need diagnosis, not an unbounded drain. For real-clock hook updates use `waitFor` on `result.current` when needed.

---

## Recipe: Timers (Debounce, Delay, Polling)

**When:** Testing the timer contract. Use the timer hooks from the preceding recipe; do not register cleanup twice. This focused example deliberately dispatches an input change, while a separate real-clock `userEvent` test covers typing behavior.

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react'
import { SearchInput } from './SearchInput'

it('triggers search after debounce delay', async () => {
  const onSearch = vi.fn()
  render(<SearchInput onSearch={onSearch} debounceMs={500} />)
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'react testing' } })
  expect(onSearch).not.toHaveBeenCalled()
  await act(async () => { await vi.advanceTimersByTimeAsync(500) })
  expect(onSearch).toHaveBeenCalledWith('react testing')
  expect(onSearch).toHaveBeenCalledTimes(1)
})
```

When combining user-event with a compatible fake-clock setup, configure `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` (or the async equivalent supported by that setup). Do not use `delay: null` to hide timing problems. This option is necessary but not universally sufficient: React 19.3.0, RTL 16.3.3, user-event 14.6.7 and Vitest 5.0.3 reproduced a timeout in RTL's async-wrapper drain on 2026-10-08. See [upstream issue](https://github.com/testing-library/react-testing-library/issues/1197).

For that combination, the executed examples separate real-clock typing from fake-clock timer assertions. Do not patch global `jest` or disable RTL's async wrapper merely to make the example green. Recheck compatibility when versions change; preserve interaction coverage separately.

---

## Recipe: Context Providers

**When:** Testing a component that consumes React Context.

```tsx
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from './ThemeContext'
import { ThemedButton } from './ThemedButton'

function renderWithTheme(ui: React.ReactElement, theme = 'light') {
  return render(
    <ThemeProvider value={theme}>
      {ui}
    </ThemeProvider>
  )
}

it('applies the dark theme styles', () => {
  renderWithTheme(<ThemedButton>Click me</ThemedButton>, 'dark')
  expect(screen.getByRole('button', { name: /click me/i })).toHaveAttribute(
    'data-theme',
    'dark'
  )
})
```

**Key points:**
- Create a `renderWith*` helper that wraps components with providers
- Pass controlled context values as arguments
- Use real providers, not mocked context values

---

## Recipe: Router Integration

**When:** Testing components that use React Router hooks or components.

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { Navigation } from './Navigation'

function renderWithRouter(ui: React.ReactElement, initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      {ui}
    </MemoryRouter>
  )
}

it('highlights the active navigation link', () => {
  renderWithRouter(<Navigation />, '/about')
  expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute(
    'aria-current',
    'page'
  )
})
```

---

## Recipe: Pure Functions (Reducers, Utilities, Transformers)

**When:** Testing functions that take input and return output with no side effects.

```tsx
import { cartReducer, CartAction, CartState } from './cartReducer'

const emptyCart: CartState = { items: [], total: 0 }

it('adds an item to the cart', () => {
  const action: CartAction = {
    type: 'ADD_ITEM',
    payload: { id: '1', name: 'Widget', price: 9.99 },
  }

  const result = cartReducer(emptyCart, action)

  expect(result.items).toHaveLength(1)
  expect(result.items[0]).toMatchObject({ id: '1', name: 'Widget' })
  expect(result.total).toBe(9.99)
})

it('removes an item from the cart', () => {
  const initialState: CartState = {
    items: [{ id: '1', name: 'Widget', price: 9.99 }],
    total: 9.99,
  }

  const result = cartReducer(initialState, { type: 'REMOVE_ITEM', payload: '1' })

  expect(result.items).toHaveLength(0)
  expect(result.total).toBe(0)
})
```

**Key points:**
- No `render`, no DOM, no Testing Library needed
- Pure input → output assertions
- TypeScript enforces correct action shapes
- Test edge cases: empty state, duplicate items, invalid actions

---

## Recipe: Error Boundaries

**When:** Testing that errors are caught and a fallback UI is shown.

```tsx
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

const ThrowingComponent = () => {
  throw new Error('Test error')
}

it('renders fallback UI when a child throws', () => {
  // Suppress console.error noise from React's error boundary logging
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  try {
    render(
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

  } finally {
    consoleSpy.mockRestore()
  }
})
```

---

## Recipe: Testing Absence of Elements

**When:** Asserting that something is NOT rendered. Import `waitFor` from RTL for the dismissal example. This handles immediate and delayed removal. A direct absence assertion suffices after synchronous removal; `waitForElementToBeRemoved` must start while the element still exists.

```tsx
it('does not show admin controls for regular users', () => {
  render(<Dashboard role="viewer" />)

  // queryBy* returns null instead of throwing
  expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
})

it('removes the notification after dismissal', async () => {
  const user = userEvent.setup()
  render(<Notification message="Hello" />)

  expect(screen.getByText('Hello')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /dismiss/i }))
  await waitFor(() => expect(screen.queryByText('Hello')).not.toBeInTheDocument())
})
```

---

## Recipe: Multiple Providers (Composite Wrapper)

**When:** Your app requires multiple nested providers.

```tsx
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from './ThemeContext'
import { AuthProvider } from './AuthContext'
import { MemoryRouter } from 'react-router-dom'

interface WrapperProps {
  children: React.ReactNode
}

function AllProviders({ children }: WrapperProps) {
  return (
    <MemoryRouter>
      <AuthProvider user={{ id: '1', name: 'Test User' }}>
        <ThemeProvider value="light">
          {children}
        </ThemeProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

function renderApp(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options })
}

// Usage in tests:
it('renders the dashboard for authenticated users', () => {
  renderApp(<Dashboard />)
  expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
})
```

**Key points:**
- Define a shared `AllProviders` wrapper once per project
- Export `renderApp` as a custom render for all component tests
- Override specific provider values via function parameters when needed
