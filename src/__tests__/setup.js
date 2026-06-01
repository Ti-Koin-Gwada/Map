import '@testing-library/jest-dom'

// Stub CSS variables used in components (jsdom env only)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'CSS', { value: null })
}

// Suppress noisy console errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('act(...)'))
    ) return
    originalError(...args)
  }
})
afterAll(() => { console.error = originalError })
