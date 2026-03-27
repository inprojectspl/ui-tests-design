# Query Selection Guide

This is the authoritative reference for choosing the right Testing Library query. Queries are ranked by how closely they reflect real user behavior.

## Priority Order

Use the first query that works. Only move down the list when a higher-priority query genuinely cannot identify the element.

### Tier 1: Accessible to Everyone

These queries reflect how both visual users and assistive technology users find elements. They should be your default.

| Query | Best For | Example |
|-------|----------|---------|
| `getByRole` | Almost everything. Buttons, links, headings, form inputs, dialogs, tabs, checkboxes. | `screen.getByRole('button', { name: /save/i })` |
| `getByLabelText` | Form fields with associated labels. The best choice for inputs, selects, textareas. | `screen.getByLabelText(/email address/i)` |
| `getByPlaceholderText` | Inputs that have placeholder text but no visible label. Not ideal — a placeholder is not a label substitute. | `screen.getByPlaceholderText(/search/i)` |
| `getByText` | Non-interactive elements: headings, paragraphs, spans, divs with meaningful text. | `screen.getByText(/welcome back/i)` |
| `getByDisplayValue` | Form fields that already have a filled-in value. Useful on pre-populated forms. | `screen.getByDisplayValue('john@example.com')` |

### Tier 2: Semantic Queries

HTML5 and ARIA attributes. Browser and assistive technology support varies.

| Query | Best For | Example |
|-------|----------|---------|
| `getByAltText` | Images, areas, custom elements with `alt` text. | `screen.getByAltText(/company logo/i)` |
| `getByTitle` | Elements with a `title` attribute. Note: not reliably read by screen readers, not visible by default. | `screen.getByTitle(/close/i)` |

### Tier 3: Test IDs (Last Resort)

| Query | Best For | Example |
|-------|----------|---------|
| `getByTestId` | Dynamic text, auto-generated content, or elements with no accessible name. The user cannot see or hear this attribute. | `screen.getByTestId('loading-spinner')` |

## Query Variant Decision Tree

Testing Library provides three variants of every query. Choose based on what you expect:

```
Do you expect the element to be in the DOM right now?
│
├─ YES, it MUST be there → getBy*
│   Throws immediately if not found. Use for elements that should always exist.
│
├─ YES, but it appears ASYNCHRONOUSLY → findBy*
│   Returns a Promise. Waits up to 1000ms by default. Use after API calls,
│   state transitions, or any async operation.
│
└─ NO, I want to assert it is NOT there → queryBy*
    Returns null if not found (instead of throwing). Use ONLY for absence assertions.
```

**CRITICAL RULE:** Never use `queryBy*` as your primary query. It hides failures by returning null instead of throwing. Use it exclusively in `expect(...).not.toBeInTheDocument()` assertions.

## `getByRole` Deep Dive

`getByRole` is the recommended default because it queries the accessibility tree — the same mechanism used by screen readers. If an element cannot be found via `getByRole`, your UI may have an accessibility problem.

### Common ARIA Roles

| Element | Implicit Role |
|---------|--------------|
| `<button>` | `button` |
| `<a href="...">` | `link` |
| `<input type="text">` | `textbox` |
| `<input type="checkbox">` | `checkbox` |
| `<input type="radio">` | `radio` |
| `<select>` | `combobox` (or `listbox` when `multiple`) |
| `<textarea>` | `textbox` |
| `<h1>`–`<h6>` | `heading` |
| `<ul>`, `<ol>` | `list` |
| `<li>` | `listitem` |
| `<img>` | `img` |
| `<dialog>` | `dialog` |
| `<nav>` | `navigation` |
| `<form>` | `form` (when named) |
| `<table>` | `table` |
| `<tr>` | `row` |
| `<td>` | `cell` |
| `<th>` | `columnheader` / `rowheader` |
| `<progress>` | `progressbar` |
| `<meter>` | `meter` |
| `<details>` | `group` |
| `<summary>` | `button` (inside details) |
| `<output>` | `status` |

### Filtering Options

```tsx
// By accessible name (from aria-label, aria-labelledby, or visible text)
screen.getByRole('button', { name: /submit/i })

// By heading level
screen.getByRole('heading', { level: 2 })

// By checked state
screen.getByRole('checkbox', { checked: true })

// By selected state
screen.getByRole('option', { selected: true })

// By expanded state
screen.getByRole('button', { expanded: false })

// By pressed state (toggle buttons)
screen.getByRole('button', { pressed: true })

// Multiple elements — use getAllByRole
screen.getAllByRole('listitem')
```

### Making Elements Accessible for Testing

If `getByRole` cannot find your element, the solution is almost always to fix the HTML, not to fall back to `getByTestId`:

```tsx
// BAD: div acting as a button — invisible to getByRole
<div className="btn" onClick={handleClick}>Save</div>

// GOOD: semantic HTML — getByRole('button') works automatically
<button onClick={handleClick}>Save</button>

// BAD: input without label — requires getByTestId
<input type="email" data-testid="email" />

// GOOD: labeled input — getByLabelText works
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ALSO GOOD: aria-label for icon-only buttons
<button aria-label="Close dialog" onClick={onClose}>
  <XIcon />
</button>
```

## Regex vs String Matching

**Prefer regex with case-insensitive flag** for resilience against minor text changes:

```tsx
// Fragile — breaks if casing or punctuation changes
screen.getByText('Submit Form')

// Resilient — survives "Submit form", "submit form", etc.
screen.getByText(/submit form/i)

// Exact match — use when specificity is required (e.g., distinguishing "Log in" from "Log in to admin")
screen.getByText('Log in', { exact: true })
```

## within() for Scoped Queries

When the same text appears multiple times in different sections:

```tsx
import { within } from '@testing-library/react'

const sidebar = screen.getByRole('navigation')
within(sidebar).getByRole('link', { name: /home/i })

const dialog = screen.getByRole('dialog')
within(dialog).getByRole('button', { name: /confirm/i })
```
