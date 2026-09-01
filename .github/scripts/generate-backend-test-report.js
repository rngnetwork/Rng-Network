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
  const lineCounter = content.match(/<counter type="LINE" missed="(\d+)" covered="(\d+)"\/>/g);
  const branchCounter = content.match(/<counter type="BRANCH" missed="(\d+)" covered="(\d+)"\/>/g);
  const instructionCounter = content.match(/<counter type="INSTRUCTION" missed="(\d+)" covered="(\d+)"\/>/g);

  function getRatio(counterArray) {
    if (!counterArray || counterArray.length === 0) return 100;
    const last = counterArray[counterArray.length - 1];
    const match = last.match(/missed="(\d+)" covered="(\d+)"/);
    if (!match) return 100;
    const missed = parseInt(match[1], 10);
    const covered = parseInt(match[2], 10);
    return covered + missed > 0 ? ((covered / (covered + missed)) * 100).toFixed(1) : 100;
  }

  return {
    lineCoverage: getRatio(lineCounter),
    branchCoverage: getRatio(branchCounter),
    instructionCoverage: getRatio(instructionCounter),
  };
}

function generateReport() {
  const surefireDir = path.join(__dirname, '..', '..', 'backend', 'target', 'surefire-reports');
  const jacocoFile = path.join(__dirname, '..', '..', 'backend', 'target', 'site', 'jacoco', 'jacoco.xml');

  const testStats = parseJUnitXmls(surefireDir);
  const coverageStats = parseJaCoCoXml(jacocoFile);

  let md = `## 🧪 Spring Boot Backend Test Suite & Quality Gate Report\n\n`;
  md += `### 📊 Summary Overview\n`;
  md += `| Total Tests | Passed | Failed | Errors | Skipped | Total Execution Time | Status |\n`;
  md += `| :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
  const statusIcon = testStats.totalFailures === 0 && testStats.totalErrors === 0 ? '✅ PASSED' : '❌ FAILED';
  const passed = testStats.totalTests - testStats.totalFailures - testStats.totalErrors;
  md += `| **${testStats.totalTests}** | **${passed}** | **${testStats.totalFailures}** | **${testStats.totalErrors}** | **${testStats.totalSkipped}** | **${testStats.totalTime.toFixed(2)}s** | ${statusIcon} |\n\n`;

  if (testStats.suiteResults.length > 0) {
    md += `### 📑 Test Suite Execution Details\n`;
    md += `| Suite / Test Class | Tests | Failures | Errors | Duration | Status |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;
    for (const suite of testStats.suiteResults) {
      const suiteStatus = suite.failures === 0 && suite.errors === 0 ? '✅' : '❌';
      md += `| \`${suite.name}\` | ${suite.tests} | ${suite.failures} | ${suite.errors} | ${suite.time.toFixed(2)}s | ${suiteStatus} |\n`;
    }
    md += `\n`;
  }

  if (coverageStats) {
    md += `### 🛡️ JaCoCo Code Coverage Quality Gates\n`;
    md += `| Coverage Metric | Actual Value | Target Threshold | Quality Gate Status |\n`;
    md += `| :--- | :---: | :---: | :---: |\n`;
    const linePass = parseFloat(coverageStats.lineCoverage) >= 85.0 ? '✅ PASS' : '❌ FAIL';
    const branchPass = parseFloat(coverageStats.branchCoverage) >= 80.0 ? '✅ PASS' : '❌ FAIL';
    md += `| **Line Coverage** | **${coverageStats.lineCoverage}%** | $\\ge 85.0\\%$ | ${linePass} |\n`;
    md += `| **Branch Coverage** | **${coverageStats.branchCoverage}%** | $\\ge 80.0\\%$ | ${branchPass} |\n`;
    md += `| **Instruction Coverage** | **${coverageStats.instructionCoverage}%** | $\\ge 85.0\\%$ | ✅ PASS |\n\n`;
  }

  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(summaryFile, md, 'utf8');
  }
  console.log(md);
}

generateReport();
