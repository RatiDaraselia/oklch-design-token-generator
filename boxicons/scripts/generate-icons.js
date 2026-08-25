const fs = require('fs');
const path = require('path');

const SVG_DIR = path.join(path.dirname(require.resolve('@boxicons/core/package.json')), 'svg');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'icons');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Reserved words that conflict with JavaScript keywords
const RESERVED_NAMES = new Set([
  'Component',
  'Fragment',
  'Element',
  'Node',
  'Event',
  'Error',
  'Function',
  'Object',
  'Array',
  'String',
  'Number',
  'Boolean',
  'Symbol',
  'Map',
  'Set',
  'Promise',
  'Proxy',
  'Reflect',
  'Date',
  'RegExp',
  'JSON',
  'Math',
  'Intl',
  'NaN',
  'Infinity',
  'undefined',
  'null',
  'true',
  'false',
]);

/**
 * Convert kebab-case filename to PascalCase component name
 */
function toPascalCase(filename) {
  const name = filename.replace(/^bx-/, '').replace(/\.svg$/, '');
  
  let result = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  if (/^\d/.test(result)) {
    result = 'Icon' + result;
  }
  
  if (RESERVED_NAMES.has(result)) {
    result = result + 'Icon';
  }
  
  return result;
}

/**
 * Convert PascalCase to kebab-case for icon name
 */
function toKebabCase(pascalCase) {
  return pascalCase
    .replace(/^Icon/, '')
    .replace(/Icon$/, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Parse SVG content
 */
function parseSvg(svgContent) {
  const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';
  
  const innerMatch = svgContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  const innerContent = innerMatch ? innerMatch[1].trim() : '';
  
  return { viewBox, innerContent };
}

/**
 * Escape for template literals
 */
function escapeForTemplate(str) {
  return str.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

/**
 * Read all SVG files from a pack directory
 */
function readPackSvgs(packName) {
  const packDir = path.join(SVG_DIR, packName);
  if (!fs.existsSync(packDir)) {
    return new Map();
  }
  
  const files = fs.readdirSync(packDir).filter(f => f.endsWith('.svg'));
  const svgs = new Map();
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(packDir, file), 'utf8');
    const componentName = toPascalCase(file);
    svgs.set(componentName, { filename: file, content });
  }
  
  return svgs;
}

/**
 * Generate an icon definition module
 */
function generateIconModule(componentName, packs, defaultPack) {
  const packSvgs = {};
  
  for (const pack of packs) {
    const packDir = path.join(SVG_DIR, pack);
    const files = fs.readdirSync(packDir).filter(f => f.endsWith('.svg'));
    
    for (const file of files) {
      if (toPascalCase(file) === componentName) {
        const content = fs.readFileSync(path.join(packDir, file), 'utf8');
        const { viewBox, innerContent } = parseSvg(content);
        packSvgs[pack] = { viewBox, innerContent: escapeForTemplate(innerContent) };
        break;
      }
    }
  }
  
  if (Object.keys(packSvgs).length === 0) {
    return null;
  }

  const iconName = toKebabCase(componentName);
  
  const packsEntries = Object.entries(packSvgs)
    .map(([pack, { viewBox, innerContent }]) => {
      return `    ${pack}: { viewBox: '${viewBox}', content: \`${innerContent}\` }`;
    })
    .join(',\n');

  const module = `import type { IconDefinition } from '../types.js';

/**
 * ${componentName} icon definition
 */
export const ${componentName}: IconDefinition = {
  name: '${iconName}',
  defaultPack: '${defaultPack}',
  packs: {
${packsEntries}
  }
};

export default ${componentName};
`;

  return module;
}

/**
 * Main generation function
 */
function generate() {
  console.log('🎨 Generating Boxicons JS icon definitions...\n');
  
  const basicSvgs = readPackSvgs('basic');
  const filledSvgs = readPackSvgs('filled');
  const brandsSvgs = readPackSvgs('brands');
  
  console.log(`📦 Found ${basicSvgs.size} basic icons`);
  console.log(`📦 Found ${filledSvgs.size} filled icons`);
  console.log(`📦 Found ${brandsSvgs.size} brand icons`);
  
  const iconConfigs = new Map();
  
  for (const name of basicSvgs.keys()) {
    const packs = ['basic'];
    if (filledSvgs.has(name)) {
      packs.push('filled');
    }
    iconConfigs.set(name, { packs, defaultPack: 'basic', isBrandOnly: false });
  }
  
  for (const name of filledSvgs.keys()) {
    if (!iconConfigs.has(name)) {
      iconConfigs.set(name, { packs: ['filled'], defaultPack: 'filled', isBrandOnly: false });
    }
  }
  
  for (const name of brandsSvgs.keys()) {
    if (!iconConfigs.has(name)) {
      iconConfigs.set(name, { packs: ['brands'], defaultPack: 'brands', isBrandOnly: true });
    } else {
      const config = iconConfigs.get(name);
      config.packs.push('brands');
    }
  }
  
  console.log(`\n📝 Generating ${iconConfigs.size} unique icon definitions...\n`);
  
  const exports = [];
  let generated = 0;
  
  for (const [name, config] of iconConfigs) {
    const module = generateIconModule(name, config.packs, config.defaultPack);
    
    if (module) {
      const outputPath = path.join(OUTPUT_DIR, `${name}.ts`);
      fs.writeFileSync(outputPath, module);
      exports.push(name);
      generated++;
      
      if (generated % 100 === 0) {
        console.log(`   Generated ${generated} icons...`);
      }
    }
  }
  
  console.log(`   Generated ${generated} icons total.\n`);
  
  // Generate barrel export file
  const iconsIndexContent = exports
    .sort()
    .map(name => `export { ${name} } from './${name}.js';`)
    .join('\n');
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'index.ts'),
    iconsIndexContent + '\n'
  );
  
  console.log('✅ Generated icons/index.ts with all exports');
  
  // Generate an "all" module that exports all icons as a single object
  const allIconsContent = `// This module exports ALL icons as a single object
// Only use this if you need all icons and don't care about bundle size
import type { IconsRecord } from '../types.js';

${exports.sort().map(name => `import { ${name} } from './${name}.js';`).join('\n')}

export const allIcons: IconsRecord = {
${exports.sort().map(name => `  ${name},`).join('\n')}
};

export const iconCount = ${exports.length};

export default allIcons;
`;
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'all.ts'),
    allIconsContent
  );
  
  console.log('✅ Generated icons/all.ts for importing all icons\n');
  console.log(`🎉 Successfully generated ${generated} icon definitions!`);
}

generate();
