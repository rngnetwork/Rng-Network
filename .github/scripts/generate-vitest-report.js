/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * generate-vitest-report.js
 *
 * Parses Vitest JSON output and generates a clean, tabular Markdown report
 * formatted like the Dorny Test Reporter for GitHub Actions ($GITHUB_STEP_SUMMARY).
 *
 * Usage:
 *   node generate-vitest-report.js [pathToVitestJson] [outputMarkdownPath]
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── File Path Resolution ─────────────────────────────────────────────────────
const defaultInput = path.resolve(__dirname, '..', '..', 'frontend', 'test-results.json');
const defaultOutput = path.resolve(__dirname, '..', '..', 'target', 'vitest-report.md');

const inputFile = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : defaultInput;
const outputFile = process.argv[3] ? path.resolve(process.cwd(), process.argv[3]) : defaultOutput;

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Error: Vitest JSON output not found at: ${inputFile}`);
  process.exit(1);
}

let testData;
try {
  const raw = fs.readFileSync(inputFile, 'utf8');
  testData = JSON.parse(raw);
} catch (err) {
  console.error(`❌ Failed to parse Vitest JSON report: ${err.message}`);
  process.exit(1);
}

// ── Metrics Calculation ──────────────────────────────────────────────────────
const totalTests = testData.numTotalTests || 0;
const passedTests = testData.numPassedTests || 0;
const failedTests = testData.numFailedTests || 0;
const pendingTests = testData.numPendingTests || 0;
const totalSuites = (testData.testResults || []).length;

const hasFailures = failedTests > 0 || !testData.success;
const statusBadge = hasFailures ? '❌ **FAILED**' : '✅ **ALL TESTS PASSED**';

function formatDuration(ms) {
  if (typeof ms !== 'number' || isNaN(ms)) return '0ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function getFileName(filePath) {
  return path.basename(filePath);
}

// ── Markdown Document Construction ───────────────────────────────────────────
let md = `## 🧪 Frontend Component & Unit Test Results (Vitest)\n\n`;
md += `**Overall Result**: ${statusBadge} &nbsp;|&nbsp; `;
md += `**Environment**: Node.js v${process.versions.node} &nbsp;|&nbsp; `;
md += `**Generated**: \`${new Date().toISOString()}\`\n\n`;

// 1. Executive Summary Table
md += `### 📊 Summary Metrics\n\n`;
md += `| Test Metric | Value | Status |\n`;
md += `| :--- | :---: | :--- |\n`;
md += `| **Total Test Suites** | \`${totalSuites}\` | 📦 Suites Evaluated |\n`;
md += `| **Total Test Cases** | \`${totalTests}\` | 🧪 Executed |\n`;
md += `| **Passed Tests** | \`${passedTests}\` | ${passedTests === totalTests ? '✅ 100% Passing' : '✅ Passing'} |\n`;
md += `| **Failed Tests** | \`${failedTests}\` | ${failedTests > 0 ? '❌ Failures Detected' : '🟢 0 Failures'} |\n`;
if (pendingTests > 0) {
  md += `| **Pending / Skipped** | \`${pendingTests}\` | ⏭️ Skipped |\n`;
}
md += `\n`;

// 2. Suite-by-Suite Breakdown Table (Dorny Style)
md += `### 📦 Test Suite Breakdown\n\n`;
md += `| Suite File | Tests | Passed | Failed | Duration | Status |\n`;
md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;

const suites = testData.testResults || [];
let failedAssertions = [];

for (const suite of suites) {
  const fileName = getFileName(suite.name);
  const suiteAssertions = suite.assertionResults || [];
  const suiteTotal = suiteAssertions.length;
  const suitePassed = suiteAssertions.filter(a => a.status === 'passed').length;
  const suiteFailed = suiteAssertions.filter(a => a.status === 'failed').length;
  const suiteDuration = (suite.endTime && suite.startTime) ? (suite.endTime - suite.startTime) : 0;
  const suiteStatus = suiteFailed > 0 ? '❌ Failed' : '✅ Passed';

  md += `| \`${fileName}\` | **${suiteTotal}** | ${suitePassed} | ${suiteFailed > 0 ? `**${suiteFailed}**` : '0'} | \`${formatDuration(suiteDuration)}\` | ${suiteStatus} |\n`;

  // Collect any failures for the diagnostic block
  for (const a of suiteAssertions) {
    if (a.status === 'failed') {
      failedAssertions.push({
        suite: fileName,
        title: a.title,
        fullName: a.fullName,
        messages: a.failureMessages || []
      });
    }
  }
}
md += `\n`;

// 3. Detailed Individual Test Case Table (Collapsible)
md += `<details>\n`;
md += `<summary><strong>🔍 Detailed Test Case Inventory (${totalTests} tests)</strong></summary>\n\n`;
md += `| Suite | Test Case Title | Duration | Result |\n`;
md += `| :--- | :--- | :---: | :---: |\n`;

for (const suite of suites) {
  const fileName = getFileName(suite.name);
  for (const a of (suite.assertionResults || [])) {
    const badge = a.status === 'passed' ? '✅ Pass' : '❌ Fail';
    const cleanTitle = (a.title || a.fullName || 'Untitled').replace(/\|/g, '\\|');
    md += `| \`${fileName}\` | ${cleanTitle} | \`${formatDuration(a.duration)}\` | ${badge} |\n`;
  }
}
md += `\n</details>\n\n`;

// 4. Failure Diagnostics Block (If Applicable)
if (failedAssertions.length > 0) {
  md += `### 🚨 Failure Diagnostics & Traceback\n\n`;
  for (const f of failedAssertions) {
    md += `#### ❌ \`${f.suite}\` → ${f.fullName}\n`;
    if (f.messages.length > 0) {
      md += `\`\`\`text\n${f.messages.join('\n')}\n\`\`\`\n\n`;
    }
  }
} else {
  md += `> [!NOTE]\n`;
  md += `> All ${totalTests} Vitest component and unit test assertions executed cleanly with zero failures.\n`;
}

// ── Output Writing ────────────────────────────────────────────────────────────
const outDir = path.dirname(outputFile);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(outputFile, md, 'utf8');
console.log(`📄 Tabular Vitest Markdown report written to: ${outputFile}`);

if (hasFailures) {
  console.error(`❌ Vitest reported ${failedTests} test failure(s).`);
  process.exit(1);
}
