import React, { useEffect, useState } from 'react'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'

const originalError = console.error

function Save({ enabled = true }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => { if (enabled) setReady(true) }, 10)
    return () => clearTimeout(timer)
  }, [enabled])
  return <button disabled={!ready}>Save</button>
}

it('waits for an existing button to become enabled', async () => {
  render(<Save />)
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled())
})

it('rejects the same assertion when enabling is broken', async () => {
  render(<Save enabled={false} />)
  await expect(waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled(), { timeout: 40 })).rejects.toThrow()
})

function Notification({ delay = 0, broken = false }) {
  const [visible, setVisible] = useState(true)
  return visible ? <div>Hello<button onClick={() => {
    if (broken) return
    if (delay) setTimeout(() => setVisible(false), delay)
    else setVisible(false)
  }}>Dismiss</button></div> : null
}

it.each([0, 10])('observes removal with a %i ms delay', async delay => {
  const user = userEvent.setup()
  render(<Notification delay={delay} />)
  expect(screen.getByText('Hello')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Dismiss' }))
  await waitFor(() => expect(screen.queryByText('Hello')).not.toBeInTheDocument())
})

it('detects broken dismissal', async () => {
  const user = userEvent.setup()
  render(<Notification broken />)
  await user.click(screen.getByRole('button', { name: 'Dismiss' }))
  await expect(waitFor(() => expect(screen.queryByText('Hello')).not.toBeInTheDocument(), { timeout: 40 })).rejects.toThrow()
})

function useDebounce(value: string, delay: number) {
  const [result, setResult] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setResult(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return result
}

it('advances debounce within act without warnings', async () => {
  vi.useFakeTimers()
  const warning = vi.spyOn(console, 'error')
  const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), { initialProps: { value: 'hello' } })
  rerender({ value: 'world' })
  expect(result.current).toBe('hello')
  await act(async () => { await vi.advanceTimersByTimeAsync(299) })
  expect(result.current).toBe('hello')
  await act(async () => { await vi.advanceTimersByTimeAsync(1) })
  expect(result.current).toBe('world')
  expect(warning).not.toHaveBeenCalled()
})

it.each([false, true])('tests debounce with fake clock = %s', async fake => {
  if (fake) vi.useFakeTimers()
  function Search() {
    const [value, setValue] = useState('')
    const result = useDebounce(value, 500)
    return <><input aria-label="Search" value={value} onChange={e => setValue(e.target.value)} /><output>{result}</output></>
  }
  render(<Search />)
  if (fake) {
    // This case isolates the timer contract; the real-clock case covers typing.
    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), { target: { value: 'react' } })
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    await act(async () => { await vi.advanceTimersByTimeAsync(500) })
  } else {
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'react')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('react'))
  }
  expect(screen.getByRole('status')).toHaveTextContent('react')
})

it.fails('runs teardown after a controlled assertion failure', () => {
  vi.useFakeTimers()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  render(<div>Failed test residue</div>)
  expect(true).toBe(false)
})

it('inherits no fake clock, spy or DOM from the failed test', () => {
  expect(vi.isFakeTimers()).toBe(false)
  expect(console.error).toBe(originalError)
  expect(document.body).toBeEmptyDOMElement()
})
