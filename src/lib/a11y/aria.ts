/**
 * ARIA Utilities
 * Helper functions for ARIA attributes and patterns
 */

/**
 * Generate unique ID for ARIA relationships
 */
let idCounter = 0;
export const generateAriaId = (prefix: string = 'aria'): string => {
  return `${prefix}-${++idCounter}-${Date.now()}`;
};

/**
 * Create ARIA label attributes
 */
export const ariaLabel = (label: string) => ({
  'aria-label': label,
});

/**
 * Create ARIA labelledby attributes
 */
export const ariaLabelledBy = (ids: string | string[]) => ({
  'aria-labelledby': Array.isArray(ids) ? ids.join(' ') : ids,
});

/**
 * Create ARIA describedby attributes
 */
export const ariaDescribedBy = (ids: string | string[]) => ({
  'aria-describedby': Array.isArray(ids) ? ids.join(' ') : ids,
});

/**
 * Create ARIA expanded attributes
 */
export const ariaExpanded = (isExpanded: boolean) => ({
  'aria-expanded': isExpanded,
});

/**
 * Create ARIA selected attributes
 */
export const ariaSelected = (isSelected: boolean) => ({
  'aria-selected': isSelected,
});

/**
 * Create ARIA checked attributes
 */
export const ariaChecked = (isChecked: boolean | 'mixed') => ({
  'aria-checked': isChecked,
});

/**
 * Create ARIA disabled attributes
 */
export const ariaDisabled = (isDisabled: boolean) => ({
  'aria-disabled': isDisabled,
});

/**
 * Create ARIA hidden attributes
 */
export const ariaHidden = (isHidden: boolean = true) => ({
  'aria-hidden': isHidden,
});

/**
 * Create ARIA live region attributes
 */
export const ariaLive = (
  priority: 'off' | 'polite' | 'assertive' = 'polite',
  atomic: boolean = true
) => ({
  'aria-live': priority,
  'aria-atomic': atomic,
});

/**
 * Create ARIA current attributes
 */
export const ariaCurrent = (
  type: 'page' | 'step' | 'location' | 'date' | 'time' | boolean = true
) => ({
  'aria-current': type,
});

/**
 * Create ARIA controls attributes
 */
export const ariaControls = (ids: string | string[]) => ({
  'aria-controls': Array.isArray(ids) ? ids.join(' ') : ids,
});

/**
 * Create ARIA owns attributes
 */
export const ariaOwns = (ids: string | string[]) => ({
  'aria-owns': Array.isArray(ids) ? ids.join(' ') : ids,
});

/**
 * Create ARIA dialog attributes
 */
export const ariaDialog = (
  labelId?: string,
  descriptionId?: string,
  modal: boolean = true
) => ({
  role: 'dialog',
  'aria-modal': modal,
  ...(labelId && ariaLabelledBy(labelId)),
  ...(descriptionId && ariaDescribedBy(descriptionId)),
});

/**
 * Create ARIA menu attributes
 */
export const ariaMenu = (
  labelId?: string,
  orientation: 'horizontal' | 'vertical' = 'vertical'
) => ({
  role: 'menu',
  'aria-orientation': orientation,
  ...(labelId && ariaLabelledBy(labelId)),
});

/**
 * Create ARIA menuitem attributes
 */
export const ariaMenuItem = (disabled: boolean = false) => ({
  role: 'menuitem',
  ...ariaDisabled(disabled),
});

/**
 * Create ARIA tablist attributes
 */
export const ariaTabList = (
  labelId?: string,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
) => ({
  role: 'tablist',
  'aria-orientation': orientation,
  ...(labelId && ariaLabelledBy(labelId)),
});

/**
 * Create ARIA tab attributes
 */
export const ariaTab = (
  isSelected: boolean,
  controlsId: string,
  disabled: boolean = false
) => ({
  role: 'tab',
  ...ariaSelected(isSelected),
  ...ariaControls(controlsId),
  ...ariaDisabled(disabled),
  tabIndex: isSelected ? 0 : -1,
});

/**
 * Create ARIA tabpanel attributes
 */
export const ariaTabPanel = (labelledById: string, hidden: boolean = false) => ({
  role: 'tabpanel',
  ...ariaLabelledBy(labelledById),
  ...ariaHidden(hidden),
  tabIndex: 0,
});

/**
 * Create ARIA listbox attributes
 */
export const ariaListBox = (
  labelId?: string,
  multiselectable: boolean = false
) => ({
  role: 'listbox',
  'aria-multiselectable': multiselectable,
  ...(labelId && ariaLabelledBy(labelId)),
});

/**
 * Create ARIA option attributes
 */
export const ariaOption = (
  isSelected: boolean,
  disabled: boolean = false,
  posinset?: number,
  setsize?: number
) => ({
  role: 'option',
  ...ariaSelected(isSelected),
  ...ariaDisabled(disabled),
  ...(posinset && { 'aria-posinset': posinset }),
  ...(setsize && { 'aria-setsize': setsize }),
});

/**
 * Create ARIA combobox attributes
 */
export const ariaComboBox = (
  controlsId: string,
  expanded: boolean,
  autocomplete: 'none' | 'inline' | 'list' | 'both' = 'list',
  labelId?: string
) => ({
  role: 'combobox',
  'aria-autocomplete': autocomplete,
  ...ariaExpanded(expanded),
  ...ariaControls(controlsId),
  ...(labelId && ariaLabelledBy(labelId)),
});

/**
 * Create ARIA button attributes
 */
export const ariaButton = (
  pressed?: boolean,
  expanded?: boolean,
  disabled: boolean = false
) => ({
  role: 'button',
  ...(typeof pressed === 'boolean' && { 'aria-pressed': pressed }),
  ...(typeof expanded === 'boolean' && ariaExpanded(expanded)),
  ...ariaDisabled(disabled),
});

/**
 * Create ARIA alert attributes
 */
export const ariaAlert = (labelId?: string) => ({
  role: 'alert',
  'aria-live': 'assertive',
  'aria-atomic': true,
  ...(labelId && ariaLabelledBy(labelId)),
});

/**
 * Create ARIA status attributes
 */
export const ariaStatus = (labelId?: string) => ({
  role: 'status',
  'aria-live': 'polite',
  'aria-atomic': true,
  ...(labelId && ariaLabelledBy(labelId)),
});

/**
 * Create ARIA progressbar attributes
 */
export const ariaProgressBar = (
  value: number,
  min: number = 0,
  max: number = 100,
  labelId?: string
) => ({
  role: 'progressbar',
  'aria-valuenow': value,
  'aria-valuemin': min,
  'aria-valuemax': max,
  ...(labelId && ariaLabelledBy(labelId)),
});
