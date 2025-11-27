import { SystemState } from '../types';

export interface Scenario {
    name: string;
    description: string;
    system: SystemState;
}

// Dynamically load all JSON files from scenarios folder
const scenarioModules = import.meta.glob('../../scenarios/*.json', { eager: true });

export const scenarios: Scenario[] = Object.entries(scenarioModules).map(([path, module]: [string, any]) => {
    const system = module.default || module;
    const filename = path.split('/').pop()?.replace('.json', '') || 'Unknown';
    
    // Generate a nice name from filename
    const name = filename
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace(/To/g, 'to');
    
    return {
        name,
        description: `${name} mechanical advantage system.`,
        system
    };
});
