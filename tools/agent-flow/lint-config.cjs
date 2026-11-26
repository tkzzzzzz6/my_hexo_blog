'use strict';
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const ejs = require('ejs');
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
console.log('Workflow/Issue YAML, policy JSON and EJS syntax checked.');
