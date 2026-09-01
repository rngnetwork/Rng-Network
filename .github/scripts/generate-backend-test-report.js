/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

function parseJUnitXmls(reportsDir) {
  let totalTests = 0;
  let totalFailures = 0;
  let totalErrors = 0;
  let totalSkipped = 0;
  let totalTime = 0;
  const suiteResults = [];

  if (fs.existsSync(reportsDir)) {
    const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.xml') && f.startsWith('TEST-'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(reportsDir, file), 'utf8');
      const testsMatch = content.match(/tests="(\d+)"/);
      const failuresMatch = content.match(/failures="(\d+)"/);
      const errorsMatch = content.match(/errors="(\d+)"/);
      const skippedMatch = content.match(/skipped="(\d+)"/);
      const timeMatch = content.match(/time="([\d.]+)"/);
      const nameMatch = content.match(/name="([^"]+)"/);

      const tests = testsMatch ? parseInt(testsMatch[1], 10) : 0;
      const failures = failuresMatch ? parseInt(failuresMatch[1], 10) : 0;
      const errors = errorsMatch ? parseInt(errorsMatch[1], 10) : 0;
      const skipped = skippedMatch ? parseInt(skippedMatch[1], 10) : 0;
      const time = timeMatch ? parseFloat(timeMatch[1]) : 0;
      const suiteName = nameMatch ? nameMatch[1].split('.').pop() : file;

      totalTests += tests;
      totalFailures += failures;
      totalErrors += errors;
      totalSkipped += skipped;
      totalTime += time;

      suiteResults.push({ name: suiteName, tests, failures, errors, time });
    }
  }

  return { totalTests, totalFailures, totalErrors, totalSkipped, totalTime, suiteResults };
}

function parseJaCoCoXml(jacocoPath) {
  if (!fs.existsSync(jacocoPath)) {
    return null;
  }
  const content = fs.readFileSync(jacocoPath, 'utf8');

  function parseCounter(counterStr) {
    if (!counterStr) return { missed: 0, covered: 0, total: 0, pct: '100.0' };
    const m = counterStr.match(/missed="(\d+)" covered="(\d+)"/);
    if (!m) return { missed: 0, covered: 0, total: 0, pct: '100.0' };
    const missed = parseInt(m[1], 10);
    const covered = parseInt(m[2], 10);
    const total = missed + covered;
    const pct = total > 0 ? ((covered / total) * 100).toFixed(1) : '100.0';
    return { missed, covered, total, pct };
  }

  // Global bundle counters (last occurrences before </report>)
  const lineCounters = content.match(/<counter type="LINE" missed="(\d+)" covered="(\d+)"\/>/g) || [];
  const branchCounters = content.match(/<counter type="BRANCH" missed="(\d+)" covered="(\d+)"\/>/g) || [];
  const instructionCounters = content.match(/<counter type="INSTRUCTION" missed="(\d+)" covered="(\d+)"\/>/g) || [];
  const complexityCounters = content.match(/<counter type="COMPLEXITY" missed="(\d+)" covered="(\d+)"\/>/g) || [];
  const methodCounters = content.match(/<counter type="METHOD" missed="(\d+)" covered="(\d+)"\/>/g) || [];
  const classCounters = content.match(/<counter type="CLASS" missed="(\d+)" covered="(\d+)"\/>/g) || [];

  const global = {
    line: parseCounter(lineCounters[lineCounters.length - 1]),
    branch: parseCounter(branchCounters[branchCounters.length - 1]),
    instruction: parseCounter(instructionCounters[instructionCounters.length - 1]),
    complexity: parseCounter(complexityCounters[complexityCounters.length - 1]),
    method: parseCounter(methodCounters[methodCounters.length - 1]),
    class: parseCounter(classCounters[classCounters.length - 1]),
  };

  // Parse Package elements
  const packages = [];
  const packageRegex = /<package name="([^"]+)">([\s\S]*?)<\/package>/g;
  let pkgMatch;

  while ((pkgMatch = packageRegex.exec(content)) !== null) {
    const pkgName = pkgMatch[1].replace(/\//g, '.');
    const pkgBody = pkgMatch[2];

    const pkgLineCounters = pkgBody.match(/<counter type="LINE" missed="(\d+)" covered="(\d+)"\/>/g) || [];
    const pkgBranchCounters = pkgBody.match(/<counter type="BRANCH" missed="(\d+)" covered="(\d+)"\/>/g) || [];
    const pkgInstCounters = pkgBody.match(/<counter type="INSTRUCTION" missed="(\d+)" covered="(\d+)"\/>/g) || [];

    const line = parseCounter(pkgLineCounters[pkgLineCounters.length - 1]);
    const branch = parseCounter(pkgBranchCounters[pkgBranchCounters.length - 1]);
    const instruction = parseCounter(pkgInstCounters[pkgInstCounters.length - 1]);

    if (line.total > 0) {
      packages.push({ name: pkgName, line, branch, instruction });
    }
  }

  return { global, packages };
}

function parseJaCoCoHtmlSummary(htmlDir) {
  const indexPath = path.join(htmlDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return { available: false };
  }
  const content = fs.readFileSync(indexPath, 'utf8');
  const hasSessionInfo = content.includes('Sessions');
  return { available: true, path: indexPath, hasSessionInfo };
}

function generateReport() {
  const surefireDir = path.join(__dirname, '..', '..', 'backend', 'target', 'surefire-reports');
  const jacocoXml = path.join(__dirname, '..', '..', 'backend', 'target', 'site', 'jacoco', 'jacoco.xml');
  const jacocoHtmlDir = path.join(__dirname, '..', '..', 'backend', 'target', 'site', 'jacoco');

  const testStats = parseJUnitXmls(surefireDir);
  const coverageData = parseJaCoCoXml(jacocoXml);
  const htmlInfo = parseJaCoCoHtmlSummary(jacocoHtmlDir);

  let md = `## 🧪 Spring Boot Backend Test Suite & JaCoCo Quality Gate Report\n\n`;

  // 1. Executive Test Summary
  md += `### 📊 Test Execution Summary\n`;
  md += `| Total Tests | Passed | Failed | Errors | Skipped | Total Duration | Overall Status |\n`;
  md += `| :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
  const statusIcon = testStats.totalFailures === 0 && testStats.totalErrors === 0 ? '✅ PASSED' : '❌ FAILED';
  const passed = testStats.totalTests - testStats.totalFailures - testStats.totalErrors;
  md += `| **${testStats.totalTests}** | **${passed}** | **${testStats.totalFailures}** | **${testStats.totalErrors}** | **${testStats.totalSkipped}** | **${testStats.totalTime.toFixed(2)}s** | ${statusIcon} |\n\n`;

  // 2. JaCoCo Quality Gates (Enforcing >= 90%)
  if (coverageData) {
    const g = coverageData.global;
    md += `### 🛡️ JaCoCo Code Coverage Quality Gates (Target: $\\ge 90.0\\%$)\n`;
    md += `| Coverage Metric | Covered / Total | Actual Ratio | Target Threshold | Quality Gate Status |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: |\n`;

    const linePass = parseFloat(g.line.pct) >= 90.0 ? '✅ PASS' : '❌ FAIL';
    const branchPass = parseFloat(g.branch.pct) >= 90.0 ? '✅ PASS' : '❌ FAIL';
    const instPass = parseFloat(g.instruction.pct) >= 90.0 ? '✅ PASS' : '❌ FAIL';
    const methodPass = parseFloat(g.method.pct) >= 90.0 ? '✅ PASS' : '❌ FAIL';

    md += `| **Line Coverage** | ${g.line.covered} / ${g.line.total} | **${g.line.pct}%** | $\\ge 90.0\\%$ | ${linePass} |\n`;
    md += `| **Branch Coverage** | ${g.branch.covered} / ${g.branch.total} | **${g.branch.pct}%** | $\\ge 90.0\\%$ | ${branchPass} |\n`;
    md += `| **Instruction Coverage** | ${g.instruction.covered} / ${g.instruction.total} | **${g.instruction.pct}%** | $\\ge 90.0\\%$ | ${instPass} |\n`;
    md += `| **Method Coverage** | ${g.method.covered} / ${g.method.total} | **${g.method.pct}%** | $\\ge 90.0\\%$ | ${methodPass} |\n`;
    md += `| **Cyclomatic Complexity** | ${g.complexity.covered} / ${g.complexity.total} | **${g.complexity.pct}%** | — | ℹ️ INFO |\n\n`;

    // 3. Package-by-Package Detailed Breakdown
    if (coverageData.packages.length > 0) {
      md += `### 📦 Package-by-Package Coverage Breakdown\n`;
      md += `| Package | Line Coverage | Lines (Cov / Total) | Branch Coverage | Branches (Cov / Total) | Status |\n`;
      md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;

      for (const pkg of coverageData.packages) {
        const pkgLineStatus = parseFloat(pkg.line.pct) >= 90.0 ? '✅' : '⚠️';
        md += `| \`${pkg.name}\` | **${pkg.line.pct}%** | ${pkg.line.covered} / ${pkg.line.total} | **${pkg.branch.pct}%** | ${pkg.branch.covered} / ${pkg.branch.total} | ${pkgLineStatus} |\n`;
      }
      md += `\n`;
    }
  }

  // 4. HTML Dashboard Status
  if (htmlInfo.available) {
    md += `> 📄 **JaCoCo Interactive HTML Report**: Generated at \`target/site/jacoco/index.html\` (archived as build artifact).\n\n`;
  }

  // 5. Test Suite Execution Details
  if (testStats.suiteResults.length > 0) {
    md += `### 📑 Automated Test Suite Class Details\n`;
    md += `| Suite / Test Class | Total Tests | Failures | Errors | Execution Duration | Status |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;
    for (const suite of testStats.suiteResults) {
      const suiteStatus = suite.failures === 0 && suite.errors === 0 ? '✅' : '❌';
      md += `| \`${suite.name}\` | ${suite.tests} | ${suite.failures} | ${suite.errors} | ${suite.time.toFixed(2)}s | ${suiteStatus} |\n`;
    }
    md += `\n`;
  }

  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(summaryFile, md, 'utf8');
  }
  console.log(md);
}

generateReport();
