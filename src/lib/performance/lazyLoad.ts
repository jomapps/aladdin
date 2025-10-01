/**
 * Lazy Loading Utilities
 * Phase 7: Production Polish
 */

import { ComponentType, lazy } from 'react'

/**
 * Lazy load component with retry logic
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries: number = 3,
): React.LazyExoticComponent<T> {
  return lazy(() =>
    componentImport().catch((error) => {
      if (retries > 0) {
        // Retry after a delay
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(lazyWithRetry(componentImport, retries - 1))
          }, 1000)
        })
      }
      throw error
    }),
  )
}

/**
 * Preload a lazy component
 */
export function preloadComponent<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
): void {
  componentImport()
}

/**
 * Lazy load multiple components
 */
export function lazyLoadMultiple(
  imports: Record<string, () => Promise<{ default: ComponentType<any> }>>,
): Record<string, React.LazyExoticComponent<ComponentType<any>>> {
  const result: Record<string, React.LazyExoticComponent<ComponentType<any>>> = {}

  for (const [key, importFn] of Object.entries(imports)) {
    result[key] = lazyWithRetry(importFn)
  }

  return result
}

/**
 * Preload all components in a map
 */
export function preloadAll(
  imports: Record<string, () => Promise<{ default: ComponentType<any> }>>,
): void {
  for (const importFn of Object.values(imports)) {
    preloadComponent(importFn)
  }
}

/**
 * Intersection Observer based lazy loader
 */
export class IntersectionLazyLoader {
  private observer: IntersectionObserver
  private callbacks: Map<Element, () => void>

  constructor(options?: IntersectionObserverInit) {
    this.callbacks = new Map()
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const callback = this.callbacks.get(entry.target)
          if (callback) {
            callback()
            this.unobserve(entry.target)
          }
        }
      })
    }, options)
  }

  observe(element: Element, callback: () => void): void {
    this.callbacks.set(element, callback)
    this.observer.observe(element)
  }

  unobserve(element: Element): void {
    this.callbacks.delete(element)
    this.observer.unobserve(element)
  }

  disconnect(): void {
    this.observer.disconnect()
    this.callbacks.clear()
  }
}

/**
 * Create lazy image loader
 */
export function createImageLoader() {
  const loader = new IntersectionLazyLoader({
    rootMargin: '50px',
  })

  return {
    loadImage: (img: HTMLImageElement) => {
      const src = img.dataset.src
      if (!src) return

      loader.observe(img, () => {
        img.src = src
        img.classList.add('loaded')
      })
    },
    disconnect: () => loader.disconnect(),
  }
}

/**
 * Route preloading helper
 */
export const routePreloader = {
  preloadedRoutes: new Set<string>(),

  preload(path: string, componentImport: () => Promise<any>): void {
    if (this.preloadedRoutes.has(path)) return

    componentImport()
    this.preloadedRoutes.add(path)
  },

  isPreloaded(path: string): boolean {
    return this.preloadedRoutes.has(path)
  },

  clear(): void {
    this.preloadedRoutes.clear()
  },
}

/**
 * Dynamic import with loading state
 */
export async function dynamicImportWithState<T>(
  importFn: () => Promise<T>,
  onLoading?: () => void,
  onSuccess?: (module: T) => void,
  onError?: (error: Error) => void,
): Promise<T | null> {
  try {
    if (onLoading) onLoading()

    const module = await importFn()

    if (onSuccess) onSuccess(module)

    return module
  } catch (error) {
    if (onError) onError(error as Error)
    return null
  }
}
