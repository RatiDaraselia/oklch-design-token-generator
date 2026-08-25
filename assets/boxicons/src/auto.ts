import { getIcons, createElement } from './boxicons.js';
import { parseDataAttributes } from './utils.js';
import * as allIcons from './icons/index.js';
import type { IconOptions, IconPack, IconSize, FlipDirection, IconsRecord } from './types.js';

/**
 * Scan the DOM for elements with data-bx attribute and replace them with SVGs
 * This uses all available icons - for tree-shaking, use createIcons instead.
 */
export function scanAndReplace(root: Element | Document = document): void {
  getIcons({
    icons: allIcons as unknown as IconsRecord,
    root,
  });
}

/**
 * Set up a MutationObserver to automatically process new elements
 * This uses all available icons - for tree-shaking, use createIcons with observe manually.
 */
export function observe(root: Element | Document = document): MutationObserver {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            // Check if the node itself has data-bx
            if (node.hasAttribute('data-bx')) {
              processNode(node);
            }
            // Check descendants
            const descendants = node.querySelectorAll('[data-bx]');
            descendants.forEach(processNode);
          }
        });
      }
    }
  });

  const targetNode = root instanceof Document ? root.body : root;
  observer.observe(targetNode, {
    childList: true,
    subtree: true,
  });

  return observer;
}

function processNode(element: Element): void {
  const attrs = parseDataAttributes(element);
  
  if (!attrs.name) {
    return;
  }

  // Find the icon by looking for a matching name (case-insensitive)
  const iconName = attrs.name.toLowerCase();
  const icon = Object.values(allIcons).find(i => 
    typeof i === 'object' && i !== null && 'name' in i && (i as any).name === iconName
  );
  
  if (!icon || typeof icon !== 'object' || !('name' in icon)) {
    console.warn(`Icon "${attrs.name}" not found.`);
    return;
  }

  const options: IconOptions = {
    pack: attrs.pack as IconPack | undefined,
    size: attrs.size as IconSize | undefined,
    width: attrs.width,
    height: attrs.height,
    fill: attrs.fill,
    opacity: attrs.opacity,
    flip: attrs.flip as FlipDirection | undefined,
    rotate: attrs.rotate,
    removePadding: attrs.removePadding,
    className: element.className || undefined,
    ariaLabel: element.getAttribute('aria-label') || undefined,
  };

  const svg = createElement(icon as any, options);
  
  // Copy over any additional attributes from the original element
  const attributesToCopy = ['id', 'title'];
  for (const attr of attributesToCopy) {
    const value = element.getAttribute(attr);
    if (value) {
      svg.setAttribute(attr, value);
    }
  }

  // Replace the element with the SVG (safe cast since we're in browser context)
  element.parentNode?.replaceChild(svg as Node, element);
}

/**
 * Initialize auto-replacement: scan existing elements and observe for new ones
 */
export function init(root: Element | Document = document): MutationObserver {
  // Process existing elements
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => scanAndReplace(root));
    } else {
      scanAndReplace(root);
    }
  }
  
  // Set up observer for future elements
  return observe(root);
}

// Auto-initialize when this module is imported
let autoObserver: MutationObserver | null = null;

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      autoObserver = init();
    });
  } else {
    autoObserver = init();
  }
}

export { autoObserver };
