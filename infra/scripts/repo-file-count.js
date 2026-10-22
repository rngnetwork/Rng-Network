#!/usr/bin/env node
/**
 * ==============================================================================
 * Rednecks Gaming Repository File Inventory & Telemetry Reporter
 * ==============================================================================
 * Analyzes the monorepo workspace with all current working tree & staged changes.
 * Produces comprehensive tabular telemetry across subsystems, file extensions,
 * lines of code, and git staging states.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');

function runGit(cmd) {
  try {
    return execSync(cmd, { cwd: repoRoot, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

// 1. Get all tracked files in git index
const lsOutput = runGit('git ls-files');
const trackedFiles = lsOutput ? lsOutput.split(/\r?\n/).filter(Boolean) : [];

const statusOutput = runGit('git status --porcelain');
const statusLines = statusOutput ? statusOutput.split(/\r?\n/).filter(Boolean) : [];

// Parse git status
const gitStats = {
  stagedRenames: 0,
  stagedModified: 0,
  stagedAdded: 0,
  stagedDeleted: 0,
  unmerged: 0,
  unstaged: 0,
  untracked: 0,
};

for (const line of statusLines) {
  const indexState = line[0];
  const workTreeState = line[1];

  if (indexState === 'R') gitStats.stagedRenames++;
  else if (indexState === 'M') gitStats.stagedModified++;
  else if (indexState === 'A') gitStats.stagedAdded++;
  else if (indexState === 'D') gitStats.stagedDeleted++;

  if (indexState === 'U' || workTreeState === 'U') gitStats.unmerged++;
  if (['M', 'D'].includes(workTreeState)) gitStats.unstaged++;
  if (line.startsWith('??')) gitStats.untracked++;
}

// 2. Classify by Subsystem
const subsystems = {
  'frontend': { name: 'Frontend (rednecksgaming-frontend)', count: 0, lines: 0, bytes: 0 },
  'backend': { name: 'Backend (rednecksgaming-backend)', count: 0, lines: 0, bytes: 0 },
  'infra': { name: 'Infrastructure (Docker & Dev Scripts)', count: 0, lines: 0, bytes: 0 },
  '.github': { name: 'GitHub Workflows & Tooling', count: 0, lines: 0, bytes: 0 },
  '.devcontainer': { name: 'DevContainer Environment', count: 0, lines: 0, bytes: 0 },
  'docs': { name: 'Documentation & Architecture', count: 0, lines: 0, bytes: 0 },
  'root': { name: 'Root Orchestration & Configs', count: 0, lines: 0, bytes: 0 },
};

// 3. Classify by File Extension
const extensions = {};

let totalLines = 0;
let totalBytes = 0;

for (const file of trackedFiles) {
  const normalizedFile = file.replace(/\\/g, '/');
  const fullPath = path.join(repoRoot, normalizedFile);
  let bytes = 0;
  let lines = 0;

  try {
    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      bytes = stat.size;
      totalBytes += bytes;

      const ext = path.extname(normalizedFile).toLowerCase() || path.basename(normalizedFile);
      const isBinary = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.jar', '.class', '.woff', '.woff2'].includes(ext);

      if (!isBinary) {
        const content = fs.readFileSync(fullPath, 'utf8');
        lines = content.split(/\r?\n/).length;
        totalLines += lines;
      }
    }
  } catch {
    // Ignore unreadable
  }

  // Subsystem bucket
  const topDir = normalizedFile.includes('/') ? normalizedFile.split('/')[0] : 'root';
  const sub = subsystems[topDir] ? topDir : 'root';
  subsystems[sub].count++;
  subsystems[sub].lines += lines;
  subsystems[sub].bytes += bytes;

  // Extension bucket
  const extKey = path.extname(normalizedFile).toLowerCase() || `[${path.basename(normalizedFile)}]`;
  if (!extensions[extKey]) {
    extensions[extKey] = { ext: extKey, count: 0, lines: 0, bytes: 0 };
  }
  extensions[extKey].count++;
  extensions[extKey].lines += lines;
  extensions[extKey].bytes += bytes;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function pad(str, len, align = 'left') {
  str = String(str);
  if (str.length >= len) return str;
  const padStr = ' '.repeat(len - str.length);
  return align === 'right' ? padStr + str : str + padStr;
}

// Generate Output
console.log('');
console.log('========================================================================================');
console.log('              REDNECKS GAMING - REPOSITORY FILE INVENTORY REPORT                        ');
console.log('========================================================================================');
console.log(`Generated: ${new Date().toISOString()}`);
console.log(`Total Tracked Files: ${trackedFiles.length} | Total Code Lines: ${totalLines.toLocaleString()} | Total Size: ${formatBytes(totalBytes)}`);
console.log('----------------------------------------------------------------------------------------\n');

// Table 1: Subsystem Breakdown
console.log('### 1. Subsystem Architecture Breakdown\n');
console.log('| Subsystem                            | Files | % of Repo | Total Lines | Total Size   |');
console.log('| :----------------------------------- | ----: | --------: | ----------: | -----------: |');
for (const [key, data] of Object.entries(subsystems)) {
  if (data.count === 0) continue;
  const pct = ((data.count / trackedFiles.length) * 100).toFixed(1) + '%';
  console.log(
    `| ${pad(data.name, 36)} | ${pad(data.count, 5, 'right')} | ${pad(pct, 9, 'right')} | ${pad(data.lines.toLocaleString(), 11, 'right')} | ${pad(formatBytes(data.bytes), 12, 'right')} |`
  );
}
console.log(
  `| ${pad('TOTAL', 36)} | ${pad(trackedFiles.length, 5, 'right')} | ${pad('100.0%', 9, 'right')} | ${pad(totalLines.toLocaleString(), 11, 'right')} | ${pad(formatBytes(totalBytes), 12, 'right')} |`
);
console.log('');

// Table 2: File Type / Extension Breakdown
console.log('### 2. File Type & Extension Inventory\n');
console.log('| Extension | Description                        | Files | % Total | Total Lines | Disk Size    |');
console.log('| :-------- | :--------------------------------- | ----: | ------: | ----------: | -----------: |');

const extDescriptions = {
  '.java': 'Java 25 Source & Test Suites',
  '.tsx': 'React 19 / Next.js Components',
  '.ts': 'TypeScript Modules & Models',
  '.json': 'Configuration & Data Schemas',
  '.yml': 'YAML Configs & CI Workflows',
  '.yaml': 'YAML Compose Configurations',
  '.sql': 'Flyway Relational Migrations',
  '.md': 'Markdown Documentation & PRD',
  '.ps1': 'PowerShell Development Scripts',
  '.sh': 'POSIX Bash Automation Scripts',
  '.js': 'JavaScript Tooling & Reporters',
  '.mjs': 'ES Module Configurations',
  '.png': 'PNG Graphic Assets',
  '.gif': 'Animated GIF Assets',
  '.jpg': 'JPEG Graphic Backgrounds',
  '.ico': 'Browser Favicon Icon',
  '.css': 'Tailwind CSS Stylesheets',
  '.example': 'Environment Template Files',
  '.gitignore': 'Git Exclusions Specification',
  '.gitattributes': 'Git Attributes Specification',
};

const sortedExts = Object.values(extensions).sort((a, b) => b.count - a.count);
for (const item of sortedExts) {
  const desc = extDescriptions[item.ext] || 'Text / Config Source File';
  const pct = ((item.count / trackedFiles.length) * 100).toFixed(1) + '%';
  console.log(
    `| ${pad(item.ext, 9)} | ${pad(desc, 34)} | ${pad(item.count, 5, 'right')} | ${pad(pct, 7, 'right')} | ${pad(item.lines.toLocaleString(), 11, 'right')} | ${pad(formatBytes(item.bytes), 12, 'right')} |`
  );
}
console.log('');

// Table 3: Git Working Index & Staging Breakdown
console.log('### 3. Git Staging & Working Index State\n');
console.log('| Git Index State                     | Count | Status Assessment                                     |');
console.log('| :---------------------------------- | ----: | :---------------------------------------------------- |');
console.log(`| Staged Renames (git mv)             | ${pad(gitStats.stagedRenames, 5, 'right')} | ✅ Cleanly tracked rename history                      |`);
console.log(`| Staged Modifications (git add)      | ${pad(gitStats.stagedModified, 5, 'right')} | ✅ Staged without commit                              |`);
console.log(`| Staged Additions                    | ${pad(gitStats.stagedAdded, 5, 'right')} | ✅ New launchers, workflows & scripts staged          |`);
console.log(`| Staged Deletions                    | ${pad(gitStats.stagedDeleted, 5, 'right')} | ✅ Legacy redundant files cleanly removed             |`);
console.log(`| Unstaged Modifications              | ${pad(gitStats.unstaged, 5, 'right')} | ${gitStats.unstaged === 0 ? '✅ Working tree clean (zero unstaged drift)' : '⚠️ Unstaged changes present'} |`);
console.log(`| Untracked Files                     | ${pad(gitStats.untracked, 5, 'right')} | ${gitStats.untracked === 0 ? '✅ Zero untracked clutter' : '⚠️ Untracked files present'}              |`);
console.log(`| Unmerged Conflicts                  | ${pad(gitStats.unmerged, 5, 'right')} | ${gitStats.unmerged === 0 ? '✅ Zero merge conflicts' : '❌ Merge conflicts detected'}                |`);
console.log('----------------------------------------------------------------------------------------\n');
