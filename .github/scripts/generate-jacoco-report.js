/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * generate-jacoco-report.js
 *
 * Enterprise-grade JaCoCo code coverage parser and Markdown report generator
 * for GitHub Actions Step Summary ($GITHUB_STEP_SUMMARY).
 *
 * Reads standard JaCoCo CSV output (`jacoco.csv`), aggregates metrics across all
 * 6 JaCoCo counters (Instructions, Branches, Lines, Methods, Complexity, Classes),
 * breaks down coverage by package, and highlights classes below target threshold (default: 90%).
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
  'PACKAGE', 'CLASS',
  'INSTRUCTION_MISSED', 'INSTRUCTION_COVERED',
  'BRANCH_MISSED', 'BRANCH_COVERED',
  'LINE_MISSED', 'LINE_COVERED',
  'COMPLEXITY_MISSED', 'COMPLEXITY_COVERED',
  'METHOD_MISSED', 'METHOD_COVERED'
];

for (const col of requiredCols) {
  if (colIndex[col] === undefined) {
    console.error(`❌ Missing required column "${col}" in JaCoCo CSV.`);
    process.exit(1);
  }
}

// ── Metric Accumulator ───────────────────────────────────────────────────────
function createMetrics() {
  return {
    instructionsCovered: 0,
    instructionsMissed: 0,
    branchesCovered: 0,
    branchesMissed: 0,
    linesCovered: 0,
    linesMissed: 0,
    complexityCovered: 0,
    complexityMissed: 0,
    methodsCovered: 0,
    methodsMissed: 0,
    classesCovered: 0,
    classesMissed: 0
  };
}

const totals = createMetrics();
const packageMap = new Map();
const classRows = [];

for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',');
  if (parts.length < header.length) continue;

  const pkg = parts[colIndex.PACKAGE].trim();
  const cls = parts[colIndex.CLASS].trim();

  const instMissed = parseInt(parts[colIndex.INSTRUCTION_MISSED], 10) || 0;
  const instCovered = parseInt(parts[colIndex.INSTRUCTION_COVERED], 10) || 0;
  const branchMissed = parseInt(parts[colIndex.BRANCH_MISSED], 10) || 0;
  const branchCovered = parseInt(parts[colIndex.BRANCH_COVERED], 10) || 0;
  const lineMissed = parseInt(parts[colIndex.LINE_MISSED], 10) || 0;
  const lineCovered = parseInt(parts[colIndex.LINE_COVERED], 10) || 0;
  const cxtyMissed = parseInt(parts[colIndex.COMPLEXITY_MISSED], 10) || 0;
  const cxtyCovered = parseInt(parts[colIndex.COMPLEXITY_COVERED], 10) || 0;
  const methodMissed = parseInt(parts[colIndex.METHOD_MISSED], 10) || 0;
  const methodCovered = parseInt(parts[colIndex.METHOD_COVERED], 10) || 0;

  const isClassCovered = instCovered > 0;

  // Global totals
  totals.instructionsMissed += instMissed;
  totals.instructionsCovered += instCovered;
  totals.branchesMissed += branchMissed;
  totals.branchesCovered += branchCovered;
  totals.linesMissed += lineMissed;
  totals.linesCovered += lineCovered;
  totals.complexityMissed += cxtyMissed;
  totals.complexityCovered += cxtyCovered;
  totals.methodsMissed += methodMissed;
  totals.methodsCovered += methodCovered;

  if (isClassCovered) {
    totals.classesCovered++;
  } else {
    totals.classesMissed++;
  }

  // Package aggregation
  if (!packageMap.has(pkg)) {
    packageMap.set(pkg, createMetrics());
  }
  const p = packageMap.get(pkg);
  p.instructionsMissed += instMissed;
  p.instructionsCovered += instCovered;
  p.branchesMissed += branchMissed;
  p.branchesCovered += branchCovered;
  p.linesMissed += lineMissed;
  p.linesCovered += lineCovered;
  p.complexityMissed += cxtyMissed;
  p.complexityCovered += cxtyCovered;
  p.methodsMissed += methodMissed;
  p.methodsCovered += methodCovered;
  if (isClassCovered) p.classesCovered++;
  else p.classesMissed++;

  // Class record
  const lineTotal = lineCovered + lineMissed;
  const branchTotal = branchCovered + branchMissed;
  const linePct = lineTotal > 0 ? (lineCovered / lineTotal) * 100 : 100;
  const branchPct = branchTotal > 0 ? (branchCovered / branchTotal) * 100 : 100;
  const instTotal = instCovered + instMissed;
  const instPct = instTotal > 0 ? (instCovered / instTotal) * 100 : 100;

  classRows.push({
    package: pkg,
    class: cls,
    lineCovered, lineMissed, lineTotal, linePct,
    branchCovered, branchMissed, branchTotal, branchPct,
    instCovered, instMissed, instTotal, instPct
  });
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
const cxtyPct = calcPct(totals.complexityCovered, totals.complexityMissed);
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

// 1. Executive Summary Table
md += `### 📊 Executive Coverage Dashboard\n\n`;
md += `| JaCoCo Metric Component | Covered / Total | Missed | Visual Progress | Status vs. ${TARGET_THRESHOLD}% Goal |\n`;
md += `| :--- | :---: | :---: | :---: | :---: |\n`;
md += `| **Instruction Coverage** | \`${totals.instructionsCovered.toLocaleString()} / ${(totals.instructionsCovered + totals.instructionsMissed).toLocaleString()}\` | \`${totals.instructionsMissed.toLocaleString()}\` | ${renderProgressBar(instPct)} | ${statusBadge(instPct)} |\n`;
md += `| **Branch Coverage** | \`${totals.branchesCovered.toLocaleString()} / ${(totals.branchesCovered + totals.branchesMissed).toLocaleString()}\` | \`${totals.branchesMissed.toLocaleString()}\` | ${renderProgressBar(branchPct)} | ${statusBadge(branchPct)} |\n`;
md += `| **Line Coverage** | \`${totals.linesCovered.toLocaleString()} / ${(totals.linesCovered + totals.linesMissed).toLocaleString()}\` | \`${totals.linesMissed.toLocaleString()}\` | ${renderProgressBar(linePct)} | ${statusBadge(linePct)} |\n`;
md += `| **Method Coverage** | \`${totals.methodsCovered.toLocaleString()} / ${(totals.methodsCovered + totals.methodsMissed).toLocaleString()}\` | \`${totals.methodsMissed.toLocaleString()}\` | ${renderProgressBar(methodPct)} | ${statusBadge(methodPct)} |\n`;
md += `| **Cyclomatic Complexity** | \`${totals.complexityCovered.toLocaleString()} / ${(totals.complexityCovered + totals.complexityMissed).toLocaleString()}\` | \`${totals.complexityMissed.toLocaleString()}\` | ${renderProgressBar(cxtyPct)} | ${statusBadge(cxtyPct)} |\n`;
md += `| **Class Coverage** | \`${totals.classesCovered.toLocaleString()} / ${(totals.classesCovered + totals.classesMissed).toLocaleString()}\` | \`${totals.classesMissed.toLocaleString()}\` | ${renderProgressBar(classPct)} | ${statusBadge(classPct)} |\n\n`;

// 2. Package-by-Package Breakdown Table
md += `### 📦 Subsystem & Package Coverage Breakdown\n\n`;
md += `| Package | Line Coverage | Branch Coverage | Instruction Coverage | Method Coverage | Status |\n`;
md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;

const sortedPackages = Array.from(packageMap.entries()).sort((a, b) => {
  const pA = calcPct(a[1].linesCovered, a[1].linesMissed);
  const pB = calcPct(b[1].linesCovered, b[1].linesMissed);
  return pA - pB; // lowest first to highlight areas needing attention
});

for (const [pkgName, p] of sortedPackages) {
  const pLine = calcPct(p.linesCovered, p.linesMissed);
  const pBranch = p.branchesCovered + p.branchesMissed > 0 ? calcPct(p.branchesCovered, p.branchesMissed) : null;
  const pInst = calcPct(p.instructionsCovered, p.instructionsMissed);
  const pMethod = calcPct(p.methodsCovered, p.methodsMissed);

  const branchStr = pBranch !== null ? `${pBranch.toFixed(1)}% (${p.branchesCovered}/${p.branchesCovered + p.branchesMissed})` : `*n/a*`;
  const lineStr = `${pLine.toFixed(1)}% (${p.linesCovered}/${p.linesCovered + p.linesMissed})`;
  const instStr = `${pInst.toFixed(1)}%`;
  const methodStr = `${pMethod.toFixed(1)}% (${p.methodsCovered}/${p.methodsCovered + p.methodsMissed})`;

  const meetsAll = pLine >= TARGET_THRESHOLD && (pBranch === null || pBranch >= TARGET_THRESHOLD) && pInst >= TARGET_THRESHOLD;
  const status = meetsAll ? `🟢 >= ${TARGET_THRESHOLD}%` : `⚠️ < ${TARGET_THRESHOLD}%`;

  md += `| \`${pkgName}\` | **${lineStr}** | ${branchStr} | ${instStr} | ${methodStr} | ${status} |\n`;
}
md += `\n`;

// 3. Hotspots: Classes Below 90% Target
const belowTargetClasses = classRows
  .filter(c => (c.lineTotal > 0 && c.linePct < TARGET_THRESHOLD) || (c.branchTotal > 0 && c.branchPct < TARGET_THRESHOLD))
  .sort((a, b) => {
    // Sort by most missed branches and lines first
    return (b.branchMissed + b.lineMissed) - (a.branchMissed + a.lineMissed);
  });

md += `### 🎯 Actionable Hotspots (Classes Below ${TARGET_THRESHOLD}% Target)\n\n`;

if (belowTargetClasses.length === 0) {
  md += `> [!TIP]\n`;
  md += `> **Exceptional Code Quality**: 100% of analyzed classes meet or exceed the **${TARGET_THRESHOLD}%** coverage goal across lines and branches!\n\n`;
} else {
  md += `> [!IMPORTANT]\n`;
  md += `> **${belowTargetClasses.length} class(es)** are currently below the **${TARGET_THRESHOLD}%** target. Use the table below to target missing test branches and lines:\n\n`;

  const renderHotspotRow = (c) => {
    const branchInfo = c.branchTotal > 0 ? `${c.branchPct.toFixed(1)}% (${c.branchCovered}/${c.branchTotal})` : `*n/a*`;
    return `| \`${c.package}.${c.class}\` | **${c.linePct.toFixed(1)}%** (${c.lineCovered}/${c.lineTotal}) | **${branchInfo}** | \`${c.lineMissed}\` | \`${c.branchMissed}\` |`;
  };

  const tableHeader = `| Class Name | Line Coverage | Branch Coverage | Missed Lines | Missed Branches |\n| :--- | :---: | :---: | :---: | :---: |\n`;

  if (belowTargetClasses.length <= 15) {
    md += tableHeader;
    for (const c of belowTargetClasses) {
      md += renderHotspotRow(c) + '\n';
    }
  } else {
    // Show top 10 in open table, rest inside collapsible details
    md += tableHeader;
    for (const c of belowTargetClasses.slice(0, 10)) {
      md += renderHotspotRow(c) + '\n';
    }
    md += `\n<details><summary><b>🔍 View ${belowTargetClasses.length - 10} additional classes below ${TARGET_THRESHOLD}%</b></summary>\n\n`;
    md += tableHeader;
    for (const c of belowTargetClasses.slice(10)) {
      md += renderHotspotRow(c) + '\n';
    }
    md += `\n</details>\n`;
  }
  md += `\n`;
}

// 4. Quality Gate Guidance
md += `### 💡 Managing & Preserving 90%+ JaCoCo Coverage\n\n`;
md += `- **Line Budget**: Cumulative project line coverage is at **${linePct.toFixed(1)}%** (\`${totals.linesMissed}\` lines missed across codebase).\n`;
md += `- **Branch Budget**: Cumulative project branch coverage is at **${branchPct.toFixed(1)}%** (\`${totals.branchesMissed}\` branches missed across decision points).\n`;
md += `- **Next Steps**: Inspect targeted classes with missed branches in the Hotspots table above to add negative path, null validation, or edge boundary test cases.\n`;

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
console.log(`   - Hotspots (<${TARGET_THRESHOLD}%):     ${belowTargetClasses.length} classes`);
