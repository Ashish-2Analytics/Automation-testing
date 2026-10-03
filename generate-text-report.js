/**
 * generate-text-report.js
 * Reads the Playwright JSON report and writes a clean text report.
 * Usage: node generate-text-report.js
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'test-report.json');
const outPath  = path.join(__dirname, 'test-report.txt');

if (!fs.existsSync(jsonPath)) {
  console.error('test-report.json not found. Run: npx playwright test --reporter=json > test-report.json');
  process.exit(1);
}

const raw  = fs.readFileSync(jsonPath, 'utf8').trim();
const data = JSON.parse(raw);

const lines = [];
const now   = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

lines.push('='.repeat(70));
lines.push('  TEMOUS CENTRAL — PLAYWRIGHT TEST REPORT');
lines.push(`  Generated: ${now}`);
lines.push('='.repeat(70));
lines.push('');

let totalTests = 0, passed = 0, failed = 0, skipped = 0;
let totalDurationMs = data.stats ? data.stats.duration : 0;

// Walk suites
function walkSuite(suite, depth) {
  if (!suite) return;

  const indent = '  '.repeat(depth);

  if (suite.title && depth > 0) {
    lines.push('');
    lines.push(`${indent}${'─'.repeat(60 - depth * 2)}`);
    lines.push(`${indent}SUITE: ${suite.title}`);
    lines.push(`${indent}${'─'.repeat(60 - depth * 2)}`);
  }

  if (suite.specs) {
    suite.specs.forEach(spec => {
      spec.tests.forEach(t => {
        totalTests++;
        const status = t.results[0] ? t.results[0].status : 'unknown';
        const dur    = t.results[0] ? t.results[0].duration : 0;
        const durStr = dur >= 1000 ? `${(dur/1000).toFixed(1)}s` : `${dur}ms`;
        let icon;
        if (status === 'passed')  { icon = 'PASS'; passed++;  }
        else if (status === 'failed') { icon = 'FAIL'; failed++;  }
        else                          { icon = 'SKIP'; skipped++; }

        const title = spec.title;
        const pad   = Math.max(2, 52 - title.length - depth * 2);
        lines.push(`${indent}  [${icon}]  ${title}${' '.repeat(pad)}(${durStr})`);

        // Show failure message
        if (status === 'failed' && t.results[0] && t.results[0].error) {
          const msg = t.results[0].error.message || '';
          const firstLine = msg.split('\n')[0].replace(/\s+/g, ' ').trim().substring(0, 80);
          lines.push(`${indent}         !! ${firstLine}`);
        }
      });
    });
  }

  if (suite.suites) {
    suite.suites.forEach(sub => walkSuite(sub, depth + 1));
  }
}

// Each top-level suite is a file
if (data.suites) {
  data.suites.forEach(fileSuite => walkSuite(fileSuite, 1));
}

// Summary
const durSec = (totalDurationMs / 1000).toFixed(1);
const pct    = totalTests > 0 ? ((passed / totalTests) * 100).toFixed(1) : '0.0';
const bar    = Math.round(Number(pct) / 5);
const barStr = '█'.repeat(bar) + '░'.repeat(20 - bar);

lines.push('');
lines.push('='.repeat(70));
lines.push('  SUMMARY');
lines.push('='.repeat(70));
lines.push(`  Total Tests : ${totalTests}`);
lines.push(`  Passed      : ${passed}  ✓`);
lines.push(`  Failed      : ${failed}  ✗`);
lines.push(`  Skipped     : ${skipped}  -`);
lines.push(`  Pass Rate   : ${pct}%  [${barStr}]`);
lines.push(`  Duration    : ${durSec}s`);
lines.push('');

if (failed > 0) {
  lines.push('  STATUS: SOME TESTS FAILED');
  lines.push('  Run "npx playwright show-report" for full HTML details.');
} else {
  lines.push('  STATUS: ALL TESTS PASSED');
}
lines.push('='.repeat(70));

const output = lines.join('\n');
fs.writeFileSync(outPath, output, 'utf8');

console.log(output);
console.log(`\nText report saved to: ${outPath}`);
