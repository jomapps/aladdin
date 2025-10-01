/**
 * Focus Management Utilities
 * Utilities for managing keyboard focus
 */

/**
 * Get all focusable elements within a container
 */
export const getFocusableElements = (
  container: HTMLElement | null
): HTMLElement[] => {
  if (!container) return [];

  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (element) => {
      // Check if element is visible
      const style = window.getComputedStyle(element);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        element.offsetParent !== null
      );
    }
  );
};

/**
 * Focus the first focusable element in a container
 */
export const focusFirst = (container: HTMLElement | null): boolean => {
  const elements = getFocusableElements(container);
  if (elements.length > 0) {
    elements[0].focus();
    return true;
  }
  return false;
};

/**
 * Focus the last focusable element in a container
 */
export const focusLast = (container: HTMLElement | null): boolean => {
  const elements = getFocusableElements(container);
  if (elements.length > 0) {
    elements[elements.length - 1].focus();
    return true;
  }
  return false;
};

/**
 * Store the currently focused element
 */
export const storeFocus = (): HTMLElement | null => {
  return document.activeElement as HTMLElement | null;
};

/**
 * Restore focus to a previously stored element
 */
export const restoreFocus = (element: HTMLElement | null): void => {
  if (element && typeof element.focus === 'function') {
    // Use setTimeout to ensure focus happens after any pending updates
    setTimeout(() => {
      element.focus();
    }, 0);
  }
};

/**
 * Focus trap handler for modals and dialogs
 */
export const createFocusTrap = (
  container: HTMLElement | null
): (() => void) => {
  if (!container) return () => {};

  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

    // Shift + Tab
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    }
    // Tab
    else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Check if element is focusable
 */
export const isFocusable = (element: HTMLElement): boolean => {
  const focusableElements = getFocusableElements(element.parentElement);
  return focusableElements.includes(element);
};

/**
 * Move focus to next focusable element
 */
export const focusNext = (
  container: HTMLElement | null = document.body
): boolean => {
  const elements = getFocusableElements(container);
  const currentIndex = elements.indexOf(document.activeElement as HTMLElement);

  if (currentIndex === -1) {
    return focusFirst(container);
  }

  const nextIndex = (currentIndex + 1) % elements.length;
  elements[nextIndex].focus();
  return true;
};

/**
 * Move focus to previous focusable element
 */
export const focusPrevious = (
  container: HTMLElement | null = document.body
): boolean => {
  const elements = getFocusableElements(container);
  const currentIndex = elements.indexOf(document.activeElement as HTMLElement);

  if (currentIndex === -1) {
    return focusLast(container);
  }

  const previousIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1;
  elements[previousIndex].focus();
  return true;
};

/**
 * Create a focus lock that prevents focus from leaving a container
 */
export class FocusLock {
  private container: HTMLElement;
  private previouslyFocused: HTMLElement | null;
  private cleanup: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.previouslyFocused = storeFocus();
  }

  activate(): void {
    // Focus first element
    focusFirst(this.container);

    // Create focus trap
    this.cleanup = createFocusTrap(this.container);
  }

  deactivate(): void {
    // Clean up focus trap
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }

    // Restore previous focus
    restoreFocus(this.previouslyFocused);
  }
}
