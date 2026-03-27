# Testing Recipes

Ready-to-use patterns for common testing scenarios in React + Vitest + React Testing Library + TypeScript. Each recipe shows the recommended approach with rationale.

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
- Factory returns only what tests need — elements and mocks
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

  // Success state — use findBy* to wait for async update
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
- Use `findBy*` for async results — never `waitFor` + `getBy*`

---

## Recipe: Custom Hook

**When:** Testing a reusable hook in isolation.

```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { useDebounce } from './useDebounce'

it('returns the debounced value after the delay', async () => {
  vi.useFakeTimers()

  const { result, rerender } = renderHook(
    ({ value }) => useDebounce(value, 300),
    { initialProps: { value: 'hello' } }
  )

  expect(result.current).toBe('hello')

  rerender({ value: 'hello world' })

  // Value not yet updated
  expect(result.current).toBe('hello')

  // Advance past the debounce delay
  vi.advanceTimersByTime(300)

  // Note: waitFor with assertions is correct for renderHook results.
  // The "prefer findBy* over waitFor+getBy*" rule applies to DOM queries only.
  // result.current is not a DOM element — waitFor is the right tool here.
  await waitFor(() => {
    expect(result.current).toBe('hello world')
  })

  vi.useRealTimers()
})
```

**Key points:**
- Use `renderHook` for hooks that are not tightly coupled to a specific component
- Access current value via `result.current`
- Use `rerender` to simulate prop changes
- Pair `vi.useFakeTimers()` with `vi.useRealTimers()` in cleanup

---

## Recipe: Timers (Debounce, Delay, Polling)

**When:** Testing setTimeout, setInterval, or debounced behavior.

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchInput } from './SearchInput'

it('triggers search after debounce delay', async () => {
  vi.useFakeTimers()
  const onSearch = vi.fn()
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

  render(<SearchInput onSearch={onSearch} debounceMs={500} />)

  await user.type(screen.getByRole('searchbox'), 'react testing')

  // Not yet called — debounce period active
  expect(onSearch).not.toHaveBeenCalled()

  // Fast-forward past debounce
  vi.advanceTimersByTime(500)

  expect(onSearch).toHaveBeenCalledWith('react testing')
  expect(onSearch).toHaveBeenCalledTimes(1)

  vi.useRealTimers()
})
```

**CRITICAL:** When using `userEvent` with fake timers, pass `advanceTimers: vi.advanceTimersByTime` to `userEvent.setup()`. Otherwise, `userEvent` cannot advance internal delays and will hang.

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

  render(
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <ThrowingComponent />
    </ErrorBoundary>
  )

  expect(screen.getByText('Something went wrong')).toBeInTheDocument()

  consoleSpy.mockRestore()
})
```

---

## Recipe: Testing Absence of Elements

**When:** Asserting that something is NOT rendered.

```tsx
it('does not show admin controls for regular users', () => {
  render(<Dashboard role="viewer" />)

  // queryBy* returns null instead of throwing
  expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
})

it('removes the notification after dismissal', async () => {
  const user = userEvent.setup()
  render(<Notification message="Hello" />)

  await user.click(screen.getByRole('button', { name: /dismiss/i }))

  // waitForElementToBeRemoved for elements that disappear asynchronously
  await waitForElementToBeRemoved(() => screen.queryByText('Hello'))
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
