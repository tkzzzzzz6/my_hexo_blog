'use strict';
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const ejs = require('ejs');
const { execFileSync } = require('node:child_process');
function visit(dir, callback) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) visit(file, callback);
    else callback(file);
  }
}
visit('.github', file => { if (/\.ya?ml$/.test(file)) yaml.load(fs.readFileSync(file, 'utf8')); });
visit('themes/hingle/layout', file => { if (file.endsWith('.ejs')) ejs.compile(fs.readFileSync(file, 'utf8'), { filename: file }); });
JSON.parse(fs.readFileSync('.github/agent-policy.json', 'utf8'));
const base = process.env.PR_BASE_SHA || execFileSync('git', ['merge-base', 'origin/main', 'HEAD'], { encoding: 'utf8' }).trim();
if (!/^[a-f0-9]{40}$/.test(base)) throw new Error('Invalid lint base SHA');
const changed = execFileSync('git', ['diff', '--name-only', '--diff-filter=AM', '-z', base, 'HEAD'], { encoding: 'utf8' }).split('\0').filter(Boolean);
for (const file of changed) if (/\.[cm]?js$/.test(file)) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
console.log('Workflow/Issue YAML, policy JSON, EJS and changed JavaScript syntax checked.');
