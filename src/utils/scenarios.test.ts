import { describe, it, expect } from 'vitest';
import { validateSystem } from './validation';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('Scenario Validation', () => {
    const scenariosDir = join(__dirname, '../../scenarios');
    const files = readdirSync(scenariosDir).filter(f => f.endsWith('.json'));

    files.forEach(file => {
        it(`should validate ${file}`, () => {
            const content = readFileSync(join(scenariosDir, file), 'utf-8');
            const system = JSON.parse(content);
            const result = validateSystem(system);
            
            if (!result.valid) {
                console.log(`\n${file} errors:`);
                result.errors.forEach(err => console.log(`  - ${err}`));
            }
            
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });
});
