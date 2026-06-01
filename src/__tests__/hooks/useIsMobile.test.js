import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '../../hooks/useIsMobile.js'

afterEach(() => vi.restoreAllMocks())

describe('useIsMobile', () => {
  it('returns true when window width is below breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 })
    const { result } = renderHook(() => useIsMobile(768))
    expect(result.current).toBe(true)
  })

  it('returns false when window width is above breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 })
    const { result } = renderHook(() => useIsMobile(768))
    expect(result.current).toBe(false)
  })

  it('returns true at exactly breakpoint - 1', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 767 })
    const { result } = renderHook(() => useIsMobile(768))
    expect(result.current).toBe(true)
  })

  it('returns false at exactly breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 768 })
    const { result } = renderHook(() => useIsMobile(768))
    expect(result.current).toBe(false)
  })

  it('updates when window is resized', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 })
    const { result } = renderHook(() => useIsMobile(768))
    expect(result.current).toBe(false)

    act(() => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 400 })
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current).toBe(true)
  })

  it('removes the resize listener on unmount', () => {
    const spy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useIsMobile())
    unmount()
    expect(spy).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('uses 768px as the default breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 })
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })
})
