import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const featureDir = path.join(root, 'project/features');
const errors = [];

for (const file of fs.readdirSync(featureDir)) {
    if (!file.endsWith('.feature.md')) continue;
    const full = path.join(featureDir, file);
    const text = fs.readFileSync(full, 'utf8');
    if (!text.includes('## Feature')) {
        errors.push(`${path.relative(root, full)}: missing "## Feature" section`);
    }
}

if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
}

console.log('Feature docs OK');
