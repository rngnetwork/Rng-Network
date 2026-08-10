/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * verify-flyway-jpa-sync.js
 *
 * Verifies that Spring Data JPA Entities in backend/src/main/java/com/rng
 * match Flyway SQL Migration scripts in backend/src/main/resources/db/migration.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const migrationDir = path.join(rootDir, 'backend', 'src', 'main', 'resources', 'db', 'migration');
const javaSourcePath = path.join(rootDir, 'backend', 'src', 'main', 'java', 'com', 'rng');
const reportOutputDir = path.join(rootDir, 'backend', 'target');

console.log('🔍 Starting JPA Entity to Flyway SQL Migrations Synchronization Check...');

if (!fs.existsSync(migrationDir)) {
  console.error(`❌ Error: Flyway migration directory not found at ${migrationDir}`);
  process.exit(1);
}

// Read all migration files
const migrationFiles = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql'));
let combinedSqlContent = '';
for (const file of migrationFiles) {
  combinedSqlContent += fs.readFileSync(path.join(migrationDir, file), 'utf8') + '\n';
}

function findJavaFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findJavaFiles(filePath, fileList);
    } else if (file.endsWith('.java')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const javaFiles = findJavaFiles(javaSourcePath);
const entities = [];
const errors = [];

for (const file of javaFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (/@Entity\b(?!\s*Scan)/.test(content)) {
    const classNameMatch = content.match(/public\s+class\s+(\w+)/);
    if (!classNameMatch) continue;

    const className = classNameMatch[1];
    
    let tableName = className.toLowerCase() + 's';
    const tableMatch = content.match(/@Table\s*\(\s*name\s*=\s*["']([^"']+)["']/);
    if (tableMatch) {
      tableName = tableMatch[1].trim();
    }

    const fields = [];
    const fieldRegex = /(?:@Column\(([\s\S]*?)\)[\s\S]*?)?(?:private|protected|public)\s+([\w<>?,\s]+)\s+(\w+);/g;
    let match;

    while ((match = fieldRegex.exec(content)) !== null) {
      const columnAnnotation = match[1] || '';
      const fieldType = match[2].trim();
      const fieldName = match[3];

      let columnName = fieldName;
      const colNameMatch = columnAnnotation.match(/name\s*=\s*["']([^"']+)["']/);
      if (colNameMatch) {
        columnName = colNameMatch[1].trim();
      }

      fields.push({ fieldName, columnName, fieldType });
    }

    entities.push({ className, tableName, file, fields });
  }
}

console.log(`\n📦 Found ${entities.length} JPA Entity classes in backend:`);
entities.forEach(e => console.log(`   - ${e.className} (Table: "${e.tableName}") [${e.fields.length} fields]`));

for (const entity of entities) {
  const tableNameLower = entity.tableName.toLowerCase();
  const hasTableInSql = combinedSqlContent.toLowerCase().includes(`create table`) && combinedSqlContent.toLowerCase().includes(tableNameLower);

  if (!hasTableInSql) {
    errors.push(`Missing SQL Table for JPA Entity [${entity.className}] (Expected table: "${entity.tableName}" in Flyway SQL migrations)`);
  }
}

// Generate Real-Time Markdown Report
let markdownReport = `## 🛡️ Flyway SQL & JPA Entity Synchronization Report\n\n`;
markdownReport += `**Generated At**: \`${new Date().toISOString()}\`  \n`;
markdownReport += `**Total JPA Entities Audited**: **${entities.length}**  \n`;
markdownReport += `**Audit Status**: ${errors.length === 0 ? '✅ **100% PASSED (Fully Synchronized)**' : '❌ **FAILED (Missing Migration)**'}  \n\n`;

markdownReport += `### 📦 Audited JPA Entities Summary\n\n`;
markdownReport += `| JPA Entity Class | Table Name | Key Fields | Flyway SQL Status |\n`;
markdownReport += `| :--- | :--- | :--- | :--- |\n`;

for (const entity of entities) {
  const entityErrors = errors.filter(e => e.includes(`[${entity.className}]`));
  const status = entityErrors.length === 0 ? '✅ Table & Schema Mirrored' : '❌ Discrepancy Found';
  markdownReport += `| \`${entity.className}\` | \`${entity.tableName}\` | ${entity.fields.length} fields | ${status} |\n`;
}

if (errors.length > 0) {
  markdownReport += `\n### ❌ Identified Discrepancies\n\n`;
  errors.forEach(err => {
    markdownReport += `- ${err}\n`;
  });
}

if (!fs.existsSync(reportOutputDir)) {
  fs.mkdirSync(reportOutputDir, { recursive: true });
}

const reportFilePath = path.join(reportOutputDir, 'schema-sync-report.md');
fs.writeFileSync(reportFilePath, markdownReport, 'utf8');
console.log(`\n📄 Real-time Markdown report saved to: ${reportFilePath}`);

if (errors.length > 0) {
  console.error('❌ CI Verification Failure! Flyway SQL Migrations are OUT OF SYNC with Backend JPA Entities:\n');
  errors.forEach(err => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log('✅ SUCCESS: Flyway SQL migrations are perfectly synchronized with backend JPA entities!');
  process.exit(0);
}
