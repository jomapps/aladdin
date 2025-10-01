/**
 * Test Utilities and Helpers
 * Common utilities for UI testing
 */

import { vi } from 'vitest'

/**
 * Mock WebSocket for SSE/streaming tests
 */
export class MockEventSource {
  url: string
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  readyState: number = 0

  constructor(url: string) {
    this.url = url
    // Simulate connection after a delay
    setTimeout(() => {
      this.readyState = 1
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 10)
  }

  close() {
    this.readyState = 2
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(data)
      })
      this.onmessage(event)
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'))
    }
  }
}

/**
 * Mock fetch for API tests
 */
export const mockFetch = (responseData: any, options: { status?: number; delay?: number } = {}) => {
  const { status = 200, delay = 0 } = options

  return vi.fn(async () => {
    if (delay) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => responseData,
      text: async () => JSON.stringify(responseData)
    }
  })
}

/**
 * Wait for a condition to be true
 */
export const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const startTime = Date.now()

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Condition not met within timeout')
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }
}

/**
 * Create mock messages for chat tests
 */
export const createMockMessages = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `msg-${i}`,
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${i}`,
    timestamp: new Date(Date.now() - (count - i) * 1000)
  }))
}

/**
 * Create mock tasks for task tests
 */
export const createMockTasks = (count: number) => {
  const statuses = ['pending', 'running', 'completed', 'failed'] as const

  return Array.from({ length: count }, (_, i) => ({
    id: `task-${i}`,
    title: `Task ${i}`,
    description: `Description for task ${i}`,
    status: statuses[i % statuses.length],
    progress: i % 4 === 1 ? Math.floor(Math.random() * 100) : undefined,
    createdAt: new Date(Date.now() - (count - i) * 60000)
  }))
}

/**
 * Create mock search results
 */
export const createMockSearchResults = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `result-${i}`,
    type: ['document', 'scene', 'character', 'asset'][i % 4],
    title: `Result ${i}`,
    snippet: `This is the snippet for result ${i}`,
    score: 1 - i * 0.05
  }))
}

/**
 * Mock local storage
 */
export class MockStorage {
  private store: Record<string, string> = {}

  getItem(key: string): string | null {
    return this.store[key] || null
  }

  setItem(key: string, value: string): void {
    this.store[key] = value
  }

  removeItem(key: string): void {
    delete this.store[key]
  }

  clear(): void {
    this.store = {}
  }

  get length(): number {
    return Object.keys(this.store).length
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store)
    return keys[index] || null
  }
}

/**
 * Setup test environment
 */
export const setupTestEnvironment = () => {
  // Mock localStorage
  global.localStorage = new MockStorage() as any

  // Mock sessionStorage
  global.sessionStorage = new MockStorage() as any

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  })

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  } as any

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any
}

/**
 * Cleanup test environment
 */
export const cleanupTestEnvironment = () => {
  vi.clearAllMocks()
  vi.resetAllMocks()
}

/**
 * Simulate typing with realistic delays
 */
export const simulateTyping = async (
  element: HTMLElement,
  text: string,
  delayMs = 50
): Promise<void> => {
  for (const char of text) {
    const event = new KeyboardEvent('keydown', { key: char })
    element.dispatchEvent(event)

    if ('value' in element) {
      ;(element as any).value += char
    }

    const inputEvent = new Event('input', { bubbles: true })
    element.dispatchEvent(inputEvent)

    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
}

/**
 * Mock streaming response
 */
export class MockStreamingResponse {
  private chunks: string[]
  private index = 0
  private interval: NodeJS.Timeout | null = null

  constructor(chunks: string[], delayMs = 100) {
    this.chunks = chunks

    this.interval = setInterval(() => {
      if (this.index < this.chunks.length) {
        this.emit(this.chunks[this.index])
        this.index++
      } else {
        this.stop()
      }
    }, delayMs)
  }

  private emit(chunk: string) {
    // Override in tests to handle emitted chunks
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}

/**
 * Assert element is visible
 */
export const assertVisible = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
  expect(element).toBeVisible()
}

/**
 * Assert element has accessible name
 */
export const assertAccessible = (element: HTMLElement) => {
  expect(element).toHaveAccessibleName()
  expect(element).not.toHaveAttribute('aria-hidden', 'true')
}

/**
 * Get computed styles
 */
export const getComputedStyle = (element: HTMLElement): CSSStyleDeclaration => {
  return window.getComputedStyle(element)
}

/**
 * Check if element is focusable
 */
export const isFocusable = (element: HTMLElement): boolean => {
  const tabIndex = element.getAttribute('tabindex')
  return (
    !element.hasAttribute('disabled') &&
    (element.tagName === 'BUTTON' ||
      element.tagName === 'INPUT' ||
      element.tagName === 'SELECT' ||
      element.tagName === 'TEXTAREA' ||
      element.tagName === 'A' ||
      (tabIndex !== null && parseInt(tabIndex, 10) >= 0))
  )
}

/**
 * Performance measurement helper
 */
export const measurePerformance = async (
  fn: () => Promise<void> | void
): Promise<number> => {
  const start = performance.now()
  await fn()
  return performance.now() - start
}

/**
 * Create mock file for upload tests
 */
export const createMockFile = (
  name: string,
  size: number,
  type: string
): File => {
  const content = new Array(size).fill('a').join('')
  return new File([content], name, { type })
}

/**
 * Wait for element to be removed
 */
export const waitForRemoval = async (
  getElement: () => HTMLElement | null,
  timeout = 5000
): Promise<void> => {
  const startTime = Date.now()

  while (getElement() !== null) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Element was not removed within timeout')
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

/**
 * Mock animation frame
 */
export const mockAnimationFrame = () => {
  let callbacks: FrameRequestCallback[] = []
  let frameId = 0

  global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    const id = ++frameId
    callbacks.push(callback)
    return id
  })

  global.cancelAnimationFrame = vi.fn((id: number) => {
    callbacks = callbacks.filter((_, i) => i !== id - 1)
  })

  return {
    flush: () => {
      const cbs = callbacks
      callbacks = []
      cbs.forEach(cb => cb(performance.now()))
    }
  }
}
