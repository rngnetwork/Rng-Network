import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Strict Design System Enforcement: No Legacy / Raw UI & 100% Custom Component Adoption', () => {
  const srcRoot = path.resolve(__dirname, '../../');
  const appDir = path.join(srcRoot, 'app');
  const componentsDir = path.join(srcRoot, 'components');

  const getSourceFiles = (dir: string): string[] => {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        // Exclude common components directory itself and test directory
        if (fullPath.includes(path.join('components', 'common')) || fullPath.includes(path.join('src', 'test'))) {
          continue;
        }
        results = results.concat(getSourceFiles(fullPath));
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(fullPath);
      }
    }
    return results;
  };

  const appAndComponentFiles = [...getSourceFiles(appDir), ...getSourceFiles(componentsDir)];

  it('scans all active application source files', () => {
    expect(appAndComponentFiles.length).toBeGreaterThan(0);
  });

  it('STRICT ENFORCEMENT: Zero raw HTML <table ...> tags outside common/ (All tables must use <Table />)', () => {
    const rawTableRegex = /<table[\s>]/;
    const violations: { file: string; line: string }[] = [];

    for (const file of appAndComponentFiles) {
      const lines = fs.readFileSync(file, 'utf-8').split('\n');
      for (const line of lines) {
        if (rawTableRegex.test(line)) {
          violations.push({ file: path.relative(srcRoot, file), line: line.trim() });
        }
      }
    }

    expect(
      violations,
      `Detected raw HTML <table> tags in application code. All tables must use the custom <Table /> component from @/components/common! Found:\n${JSON.stringify(violations, null, 2)}`
    ).toEqual([]);
  });

  it('STRICT ENFORCEMENT: Zero hand-rolled inline user avatar implementations (Must use <Avatar />)', () => {
    // Detects files handling user profile pictures with raw <Image or rounded-full fallback circles without importing Avatar from @/components/common
    const violations: { file: string; reason: string }[] = [];

    for (const file of appAndComponentFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relPath = path.relative(srcRoot, file);

      // Check for user/profile avatar rendering
      const rendersUserAvatar =
        (content.includes('discordAvatar') || content.includes('avatarSrc') || content.includes('user-avatar')) &&
        content.includes('rounded-full');

      const importsCustomAvatar =
        content.includes("from '@/components/common'") && content.includes('Avatar') ||
        content.includes("from '@/components/common/feedback/Avatar'");

      if (rendersUserAvatar && !importsCustomAvatar) {
        violations.push({
          file: relPath,
          reason: 'Renders user profile avatar or initials with inline rounded-full elements instead of custom <Avatar />',
        });
      }
    }

    expect(
      violations,
      `Detected hand-rolled inline avatar/initials rendering. User profile photos must strictly use the custom <Avatar /> component from @/components/common! Found:\n${JSON.stringify(violations, null, 2)}`
    ).toEqual([]);
  });

  it('STRICT ENFORCEMENT: Zero raw HTML <select> elements (All selects must use <Dropdown />)', () => {
    const rawSelectRegex = /<select[\s>]/;
    const violations: { file: string; line: string }[] = [];

    for (const file of appAndComponentFiles) {
      const lines = fs.readFileSync(file, 'utf-8').split('\n');
      for (const line of lines) {
        if (rawSelectRegex.test(line)) {
          violations.push({ file: path.relative(srcRoot, file), line: line.trim() });
        }
      }
    }

    expect(
      violations,
      `Detected raw HTML <select> elements. All select menus must use the custom <Dropdown /> component from @/components/common! Found:\n${JSON.stringify(violations, null, 2)}`
    ).toEqual([]);
  });

  it('STRICT ENFORCEMENT: Zero legacy GlassmorphicDropdown or legacy stylesheets', () => {
    const violations: { file: string; legacyRef: string }[] = [];
    for (const file of appAndComponentFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('GlassmorphicDropdown')) {
        violations.push({ file: path.relative(srcRoot, file), legacyRef: 'GlassmorphicDropdown' });
      }
      if (content.includes('embed-builder.css')) {
        violations.push({ file: path.relative(srcRoot, file), legacyRef: 'embed-builder.css' });
      }
    }
    expect(violations).toEqual([]);
  });

  it('STRICT ENFORCEMENT: 100% Adoption of Custom UI Components (Every common component must be utilized)', () => {
    const commonIndex = path.join(srcRoot, 'components', 'common', 'index.ts');
    expect(fs.existsSync(commonIndex)).toBe(true);

    const allCustomComponents = [
      'Card', 'Carousel', 'Table', 'List',
      'Alert', 'Avatar', 'Badge', 'Modal', 'ProgressBar', 'Toast', 'ToastProvider', 'Tooltip',
      'Button', 'Checkbox', 'ColorPicker', 'DateTimePicker', 'Dropdown', 'EmojiPicker', 'RadioButton', 'Slider', 'Stepper', 'TextInput', 'ToggleSwitch',
      'Accordion', 'Breadcrumbs', 'HamburgerMenu', 'Navbar', 'Pagination', 'Sidebar'
    ];

    const unusedComponents: string[] = [];

    for (const componentName of allCustomComponents) {
      let isUsed = false;

      for (const file of appAndComponentFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const importsFromCommon =
          content.includes('@/components/common') || content.includes('components/common');

        if (importsFromCommon) {
          const usesComponent =
            new RegExp(`\\b${componentName}\\b`).test(content) &&
            (content.includes(`<${componentName}`) || content.includes(`${componentName}.`));

          if (usesComponent) {
            isUsed = true;
            break;
          }
        }
      }

      if (!isUsed) {
        unusedComponents.push(componentName);
      }
    }

    expect(
      unusedComponents,
      `Found ${unusedComponents.length} custom UI components with ZERO usage across the application! All 29 common components must be integrated:\n${JSON.stringify(unusedComponents, null, 2)}`
    ).toEqual([]);
  });
});
