import { SystemState, PulleyCalcSystem } from '../types';
import { convertFromPulleyCalc } from './importExport';

export interface Scenario {
    name: string;
    description: string;
    system: SystemState;
}

const createScenario = (name: string, description: string, calcSystem: PulleyCalcSystem): Scenario => {
    return {
        name,
        description,
        system: convertFromPulleyCalc(calcSystem)
    };
};

export const scenarios: Scenario[] = [
    createScenario(
        "3:1 Simple",
        "Standard 3:1 mechanical advantage (Z-drag equivalent).",
        {
            name: "3:1",
            throw: 10,
            sheaveWidth: 2,
            connectionLength: 1,
            friction: 0.1,
            routes: [{ type: 'simple', ratio: 3 }]
        }
    ),
    createScenario(
        "4:1 Simple",
        "4:1 mechanical advantage using double pulleys.",
        {
            name: "4:1",
            throw: 10,
            sheaveWidth: 2,
            connectionLength: 1,
            friction: 0.1,
            routes: [{ type: 'simple', ratio: 4 }]
        }
    ),
    createScenario(
        "5:1 Simple",
        "5:1 mechanical advantage using double and triple pulleys.",
        {
            name: "5:1",
            throw: 10,
            sheaveWidth: 2,
            connectionLength: 1,
            friction: 0.1,
            routes: [{ type: 'simple', ratio: 5 }]
        }
    ),
    createScenario(
        "6:1 Compound (3:1 -> 2:1)",
        "Compound system: A 3:1 system pulling on a 2:1 system.",
        {
            name: "6:1 Compound",
            throw: 10,
            sheaveWidth: 2,
            connectionLength: 1,
            friction: 0.1,
            routes: [
                { type: 'simple', ratio: 3 },
                { type: 'simple', ratio: 2 }
            ]
        }
    ),
    createScenario(
        "9:1 Compound (3:1 -> 3:1)",
        "Compound system: A 3:1 system pulling on another 3:1 system.",
        {
            name: "9:1 Compound",
            throw: 10,
            sheaveWidth: 2,
            connectionLength: 1,
            friction: 0.1,
            routes: [
                { type: 'simple', ratio: 3 },
                { type: 'simple', ratio: 3 }
            ]
        }
    )
];
