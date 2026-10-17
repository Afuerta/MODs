const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '../src');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src=['"]([^'"]+)['"]/g)].map(match => match[1]);
if (!files.length || new Set(files).size !== files.length) throw new Error('Missing or duplicate game scripts');
const combined = files.map(file => {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    new vm.Script(source, { filename: file });
    return source;
}).join('\n');
new vm.Script(combined, { filename: 'combined-game.js' });
console.log(`${files.length} ordered scripts parse individually and together.`);
