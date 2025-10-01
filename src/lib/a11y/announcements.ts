/**
 * Screen Reader Announcements
 * Utilities for making screen reader announcements
 */

export type AnnouncementPriority = 'polite' | 'assertive';

class AnnouncementManager {
  private politeRegion: HTMLDivElement | null = null;
  private assertiveRegion: HTMLDivElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeRegions();
    }
  }

  private initializeRegions(): void {
    // Create polite live region
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('role', 'status');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.className = 'sr-only';
    document.body.appendChild(this.politeRegion);

    // Create assertive live region
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.setAttribute('role', 'alert');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.className = 'sr-only';
    document.body.appendChild(this.assertiveRegion);
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: AnnouncementPriority = 'polite'): void {
    if (typeof window === 'undefined') return;

    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;

    if (!region) {
      this.initializeRegions();
      return this.announce(message, priority);
    }

    // Clear previous message
    region.textContent = '';

    // Set new message after a brief delay to ensure it's announced
    setTimeout(() => {
      region.textContent = message;
    }, 100);
  }

  /**
   * Announce with polite priority (default)
   */
  announcePolite(message: string): void {
    this.announce(message, 'polite');
  }

  /**
   * Announce with assertive priority (interrupts current announcement)
   */
  announceAssertive(message: string): void {
    this.announce(message, 'assertive');
  }

  /**
   * Clear all announcements
   */
  clear(): void {
    if (this.politeRegion) {
      this.politeRegion.textContent = '';
    }
    if (this.assertiveRegion) {
      this.assertiveRegion.textContent = '';
    }
  }
}

// Singleton instance
const announcer = new AnnouncementManager();

/**
 * Announce a message to screen readers
 */
export const announce = (
  message: string,
  priority: AnnouncementPriority = 'polite'
): void => {
  announcer.announce(message, priority);
};

/**
 * Announce with polite priority
 */
export const announcePolite = (message: string): void => {
  announcer.announcePolite(message);
};

/**
 * Announce with assertive priority
 */
export const announceAssertive = (message: string): void => {
  announcer.announceAssertive(message);
};

/**
 * Clear all announcements
 */
export const clearAnnouncements = (): void => {
  announcer.clear();
};

/**
 * Announce navigation
 */
export const announceNavigation = (pageName: string): void => {
  announcePolite(`Navigated to ${pageName} page`);
};

/**
 * Announce loading state
 */
export const announceLoading = (resource: string): void => {
  announcePolite(`Loading ${resource}`);
};

/**
 * Announce loaded state
 */
export const announceLoaded = (resource: string): void => {
  announcePolite(`${resource} loaded`);
};

/**
 * Announce error
 */
export const announceError = (error: string): void => {
  announceAssertive(`Error: ${error}`);
};

/**
 * Announce success
 */
export const announceSuccess = (message: string): void => {
  announcePolite(`Success: ${message}`);
};

/**
 * Announce item count
 */
export const announceItemCount = (count: number, itemType: string): void => {
  const plural = count !== 1 ? 's' : '';
  announcePolite(`Showing ${count} ${itemType}${plural}`);
};
