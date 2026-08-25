// Core functionality
export {
  getIcons,
  createIcons,
  createElement,
  createSvgString,
  createSvgElement,
} from './boxicons.js';

// Utilities
export { getSizePixels, buildTransform } from './utils.js';

// Types
export type {
  IconPack,
  IconSize,
  FlipDirection,
  IconData,
  IconDefinition,
  IconOptions,
  CreateIconsOptions,
  GetIconsOptions,
  IconsRecord,
} from './types.js';

// Re-export all icons
export * from './icons/index.js';

// Export all icons as a single object for convenience
import * as icons from './icons/index.js';
export { icons };
