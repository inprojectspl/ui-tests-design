import { afterEach, vi } from 'vitest'
import { act, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

const automaticCleanup = typeof globalThis.afterEach === 'function'

afterEach(async () => {
  try {
    if (!automaticCleanup) cleanup()
    if (vi.isFakeTimers()) {
      await act(async () => { await vi.runOnlyPendingTimersAsync() })
    }
  } finally {
    vi.useRealTimers()
    vi.restoreAllMocks()
  }
})
