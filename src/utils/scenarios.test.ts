import { describe, it, expect } from 'vitest';
import { validateSystem } from './validation';
// @ts-ignore - Node built-ins
import { readFileSync, readdirSync } from 'fs';
// @ts-ignore - Node built-ins
import { join } from 'path';

describe('Scenario Validation', () => {
    // @ts-ignore - __dirname in test context
    const scenariosDir = join(__dirname, '../../scenarios');
    const files = readdirSync(scenariosDir).filter((f: string) => f.endsWith('.json'));

    files.forEach((file: string) => {
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
