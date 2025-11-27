import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { validateSystem, formatValidationReport } from '../src/utils/validation.js';

const scenariosDir = './scenarios';
const files = readdirSync(scenariosDir).filter(f => f.endsWith('.json'));

console.log('=== VALIDATING ALL SCENARIOS ===\n');

let allValid = true;

files.forEach(file => {
    const content = readFileSync(join(scenariosDir, file), 'utf-8');
    const system = JSON.parse(content);
    const result = validateSystem(system);
    
    console.log(`\n--- ${file} ---`);
    console.log(formatValidationReport(result));
    
    if (!result.valid) {
        allValid = false;
    }
});

console.log('\n=== SUMMARY ===');
console.log(`Overall: ${allValid ? '✓ ALL SCENARIOS VALID' : '✗ SOME SCENARIOS INVALID'}`);

process.exit(allValid ? 0 : 1);
