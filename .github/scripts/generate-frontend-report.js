/**
 * generate-frontend-report.js
 *
 * Generates a real-time Markdown CI report for the Frontend (Next.js) job.
 * Receives actual step outcomes as positional CLI arguments from ci-cd.yml:
 *
 *   node generate-frontend-report.js <install> <typecheck> <lint> <audit> <build>
 *
 * Each argument must be one of: success | failure | skipped | cancelled
 * These are provided directly from ${{ steps.<id>.outcome }} in GitHub Actions.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Argument parsing ────────────────────────────────────────────────────────
const [,, installOutcome, typecheckOutcome, lintOutcome, auditOutcome, buildOutcome] = process.argv;

const VALID_OUTCOMES = new Set(['success', 'failure', 'skipped', 'cancelled']);

function validate(val, name) {
  const v = (val || '').toLowerCase().trim();
  if (!VALID_OUTCOMES.has(v)) {
    console.warn(`⚠️  Unknown outcome "${val}" for step "${name}". Defaulting to "failure".`);
    return 'failure';
  }
  return v;
}

const steps = [
  { label: 'Install Dependencies',      command: 'npm install --legacy-peer-deps', outcome: validate(installOutcome,   'install')   },
  { label: 'TypeScript Compilation',    command: 'npx tsc --noEmit',               outcome: validate(typecheckOutcome, 'typecheck') },
  { label: 'ESLint Code Quality',       command: 'npm run lint',                   outcome: validate(lintOutcome,      'lint')      },
  { label: 'Dependency Audit',          command: 'npm audit --audit-level=critical', outcome: validate(auditOutcome,   'audit')     },
  { label: 'Next.js Application Build', command: 'npm run build',                  outcome: validate(buildOutcome,     'build')     },
];

// ── Badge renderer ──────────────────────────────────────────────────────────
function badge(outcome) {
  switch (outcome) {
    case 'success':   return '✅ Passed';
    case 'failure':   return '❌ Failed';
    case 'skipped':   return '⏭️ Skipped';
    case 'cancelled': return '🚫 Cancelled';
    default:          return '❓ Unknown';
  }
}

// ── Overall status ──────────────────────────────────────────────────────────
const anyFailed    = steps.some(s => s.outcome === 'failure');
const anyCancelled = steps.some(s => s.outcome === 'cancelled');
const overallBadge = anyFailed    ? '❌ **FAILED**'
                   : anyCancelled ? '🚫 **CANCELLED**'
                   : '✅ **ALL CHECKS PASSED**';

// ── Build report ────────────────────────────────────────────────────────────
let report = `## 🎨 Frontend CI Verification Report\n\n`;
report += `**Generated At**: \`${new Date().toISOString()}\`  \n`;
report += `**Environment**: Node.js v${process.versions.node}  \n`;
report += `**Overall Status**: ${overallBadge}  \n\n`;

report += `### 🧪 Verification Steps\n\n`;
report += `| Check Step | Command | Status |\n`;
report += `| :--- | :--- | :--- |\n`;
for (const s of steps) {
  report += `| ${s.label} | \`${s.command}\` | ${badge(s.outcome)} |\n`;
}

if (anyFailed) {
  report += `\n> [!CAUTION]\n`;
  report += `> One or more frontend checks **failed**. Review the step logs above for details.\n`;
} else if (!anyCancelled) {
  report += `\n> [!NOTE]\n`;
  report += `> All frontend CI checks completed successfully.\n`;
}

// ── Write output ────────────────────────────────────────────────────────────
const outputDir  = path.resolve(__dirname, '..', '..', 'target');
const outputFile = path.join(outputDir, 'frontend-report.md');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputFile, report, 'utf8');
console.log(`📄 Frontend CI report written to: ${outputFile}`);
if (anyFailed) {
  console.error('❌ Frontend CI report: one or more steps failed.');
  process.exit(1);
}
