/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * generate-jacoco-report.js
 *
 * Enterprise-grade JaCoCo code coverage parser and Markdown report generator
 * for GitHub Actions Step Summary ($GITHUB_STEP_SUMMARY).
 *
 * Reads standard JaCoCo CSV output (`jacoco.csv`), aggregates metrics across core
 * JaCoCo counters (Instructions, Branches, Lines, Methods, Classes), and outputs
 * an Executive Coverage Dashboard summary.
 *
 * Usage:
 *   node generate-jacoco-report.js [pathToJacocoCsv] [outputMarkdownPath] [targetThreshold]
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── File Path Resolution ─────────────────────────────────────────────────────
const defaultInput = path.resolve(__dirname, '..', '..', 'backend', 'target', 'site', 'jacoco', 'jacoco.csv');
const defaultOutput = path.resolve(__dirname, '..', '..', 'backend', 'target', 'jacoco-report.md');
const TARGET_THRESHOLD = parseFloat(process.argv[4] || process.env.JACOCO_TARGET_THRESHOLD || '90.0');

const inputFile = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : defaultInput;
const outputFile = process.argv[3] ? path.resolve(process.cwd(), process.argv[3]) : defaultOutput;

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Error: JaCoCo CSV output not found at: ${inputFile}`);
  process.exit(1);
}

// ── CSV Parsing ──────────────────────────────────────────────────────────────
const rawCsv = fs.readFileSync(inputFile, 'utf8');
const lines = rawCsv.split(/\r?\n/).filter(line => line.trim().length > 0);

if (lines.length <= 1) {
  console.error('❌ Error: JaCoCo CSV is empty or only contains header.');
  process.exit(1);
}

const header = lines[0].split(',');
const colIndex = {};
header.forEach((col, idx) => {
  colIndex[col.trim()] = idx;
});

const requiredCols = [
  'INSTRUCTION_MISSED', 'INSTRUCTION_COVERED',
  'BRANCH_MISSED', 'BRANCH_COVERED',
  'LINE_MISSED', 'LINE_COVERED',
  'METHOD_MISSED', 'METHOD_COVERED'
];

for (const col of requiredCols) {
  if (colIndex[col] === undefined) {
    console.error(`❌ Missing required column "${col}" in JaCoCo CSV.`);
    process.exit(1);
  }
}

// ── Metric Accumulator ───────────────────────────────────────────────────────
const totals = {
  instructionsCovered: 0,
  instructionsMissed: 0,
  branchesCovered: 0,
  branchesMissed: 0,
  linesCovered: 0,
  linesMissed: 0,
  methodsCovered: 0,
  methodsMissed: 0,
  classesCovered: 0,
  classesMissed: 0
};

for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',');
  if (parts.length < header.length) continue;

  const instMissed = parseInt(parts[colIndex.INSTRUCTION_MISSED], 10) || 0;
  const instCovered = parseInt(parts[colIndex.INSTRUCTION_COVERED], 10) || 0;
  const branchMissed = parseInt(parts[colIndex.BRANCH_MISSED], 10) || 0;
  const branchCovered = parseInt(parts[colIndex.BRANCH_COVERED], 10) || 0;
  const lineMissed = parseInt(parts[colIndex.LINE_MISSED], 10) || 0;
  const lineCovered = parseInt(parts[colIndex.LINE_COVERED], 10) || 0;
  const methodMissed = parseInt(parts[colIndex.METHOD_MISSED], 10) || 0;
  const methodCovered = parseInt(parts[colIndex.METHOD_COVERED], 10) || 0;

  const isClassCovered = instCovered > 0;

  totals.instructionsMissed += instMissed;
  totals.instructionsCovered += instCovered;
  totals.branchesMissed += branchMissed;
  totals.branchesCovered += branchCovered;
  totals.linesMissed += lineMissed;
  totals.linesCovered += lineCovered;
  totals.methodsMissed += methodMissed;
  totals.methodsCovered += methodCovered;

  if (isClassCovered) {
    totals.classesCovered++;
  } else {
    totals.classesMissed++;
  }
}

// ── Helper formatters ────────────────────────────────────────────────────────
function calcPct(covered, missed) {
  const total = covered + missed;
  if (total === 0) return 100.0;
  return (covered / total) * 100;
}

function renderProgressBar(pct) {
  const totalBlocks = 10;
  const filledBlocks = Math.min(10, Math.max(0, Math.round(pct / 10)));
  const emptyBlocks = totalBlocks - filledBlocks;
  const bar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  return `\`${bar}\` **${pct.toFixed(1)}%**`;
}

function statusBadge(pct, target = TARGET_THRESHOLD) {
  if (pct >= target) return `✅ \`${pct.toFixed(1)}%\` (>=${target}%)`;
  if (pct >= target - 10) return `⚠️ \`${pct.toFixed(1)}%\` (<${target}%)`;
  return `❌ \`${pct.toFixed(1)}%\` (<${target - 10}%)`;
}

// ── Overall Percentages ──────────────────────────────────────────────────────
const instPct = calcPct(totals.instructionsCovered, totals.instructionsMissed);
const branchPct = calcPct(totals.branchesCovered, totals.branchesMissed);
const linePct = calcPct(totals.linesCovered, totals.linesMissed);
const methodPct = calcPct(totals.methodsCovered, totals.methodsMissed);
const classPct = calcPct(totals.classesCovered, totals.classesMissed);

const isOverallPassing = instPct >= TARGET_THRESHOLD && branchPct >= TARGET_THRESHOLD && linePct >= TARGET_THRESHOLD;

// ── Markdown Document Generation ─────────────────────────────────────────────
let md = `## 🛡️ Enterprise JaCoCo Code Coverage Telemetry Report\n\n`;

const overallStatus = isOverallPassing
  ? `🟢 **QUALITY GATE PASSED (All Core Metrics >= ${TARGET_THRESHOLD}%)**`
  : `🟡 **QUALITY GATE WARNING (< ${TARGET_THRESHOLD}% Target Threshold)**`;

md += `**Quality Gate Status**: ${overallStatus} &nbsp;|&nbsp; `;
md += `**Target Goal**: \`>= ${TARGET_THRESHOLD}.0%\` per metric &nbsp;|&nbsp; `;
md += `**Generated**: \`${new Date().toISOString()}\`\n\n`;

// Executive Coverage Dashboard Table
md += `### 📊 Executive Coverage Dashboard\n\n`;
md += `| JaCoCo Metric Component | Covered / Total | Missed | Visual Progress | Status vs. ${TARGET_THRESHOLD}% Goal |\n`;
md += `| :--- | :---: | :---: | :---: | :---: |\n`;
md += `| **Instruction Coverage** | \`${totals.instructionsCovered.toLocaleString()} / ${(totals.instructionsCovered + totals.instructionsMissed).toLocaleString()}\` | \`${totals.instructionsMissed.toLocaleString()}\` | ${renderProgressBar(instPct)} | ${statusBadge(instPct)} |\n`;
md += `| **Branch Coverage** | \`${totals.branchesCovered.toLocaleString()} / ${(totals.branchesCovered + totals.branchesMissed).toLocaleString()}\` | \`${totals.branchesMissed.toLocaleString()}\` | ${renderProgressBar(branchPct)} | ${statusBadge(branchPct)} |\n`;
md += `| **Line Coverage** | \`${totals.linesCovered.toLocaleString()} / ${(totals.linesCovered + totals.linesMissed).toLocaleString()}\` | \`${totals.linesMissed.toLocaleString()}\` | ${renderProgressBar(linePct)} | ${statusBadge(linePct)} |\n`;
md += `| **Method Coverage** | \`${totals.methodsCovered.toLocaleString()} / ${(totals.methodsCovered + totals.methodsMissed).toLocaleString()}\` | \`${totals.methodsMissed.toLocaleString()}\` | ${renderProgressBar(methodPct)} | ${statusBadge(methodPct)} |\n`;
md += `| **Class Coverage** | \`${totals.classesCovered.toLocaleString()} / ${(totals.classesCovered + totals.classesMissed).toLocaleString()}\` | \`${totals.classesMissed.toLocaleString()}\` | ${renderProgressBar(classPct)} | ${statusBadge(classPct)} |\n`;

// ── Output File Writing ──────────────────────────────────────────────────────
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputFile, md, 'utf8');
console.log(`✅ JaCoCo Telemetry Report generated successfully at: ${outputFile}`);
console.log(`   - Overall Instructions: ${instPct.toFixed(1)}%`);
console.log(`   - Overall Branches:     ${branchPct.toFixed(1)}%`);
console.log(`   - Overall Lines:        ${linePct.toFixed(1)}%`);
console.log(`   - Overall Methods:      ${methodPct.toFixed(1)}%`);
console.log(`   - Overall Classes:      ${classPct.toFixed(1)}%`);
