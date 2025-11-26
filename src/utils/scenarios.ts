import { SystemState, ComponentType, PulleyComponent, AnchorComponent, RopeComponent } from '../types';

export interface Scenario {
    name: string;
    description: string;
    system: SystemState;
}

export const scenarios: Scenario[] = [
    {
        name: "2:1 Purchase",
        description: "Simple 2:1 mechanical advantage system with one moving pulley.",
        system: {
            gridSize: 20,
            snapToGrid: true,
            selectedId: null,
            components: [
                {
                    id: "anchor-1",
                    type: ComponentType.ANCHOR,
                    position: { x: 100, y: 100 },
                    label: "Head"
                } as AnchorComponent,
                {
                    id: "pulley-1",
                    type: ComponentType.PULLEY,
                    position: { x: 100, y: 300 },
                    diameter: 60,
                    sheaves: 1,
                    hasBecket: true,
                    rotation: 0,
                    attachmentPoints: {
                        top: { x: 100, y: 270 },
                        bottom: { x: 100, y: 330 },
                        becket: { x: 100, y: 340 }
                    }
                } as PulleyComponent,
                {
                    id: "rope-1",
                    type: ComponentType.ROPE,
                    startId: "anchor-1",
                    endId: "pulley-1",
                    routeThrough: ["pulley-1"],
                    tension: 100
                } as RopeComponent
            ]
        }
    },
    {
        name: "3:1 Purchase",
        description: "Standard 3:1 system using a double pulley and a single pulley.",
        system: {
            gridSize: 20,
            snapToGrid: true,
            selectedId: null,
            components: [
                {
                    id: "anchor-top",
                    type: ComponentType.ANCHOR,
                    position: { x: 200, y: 100 },
                    label: "Fixed Point"
                } as AnchorComponent,
                {
                    id: "pulley-double",
                    type: ComponentType.PULLEY,
                    position: { x: 200, y: 160 },
                    diameter: 60,
                    sheaves: 2,
                    hasBecket: true,
                    rotation: 0,
                    attachmentPoints: {
                        top: { x: 200, y: 130 },
                        bottom: { x: 200, y: 190 },
                        becket: { x: 200, y: 200 }
                    }
                } as PulleyComponent,
                {
                    id: "pulley-single",
                    type: ComponentType.PULLEY,
                    position: { x: 200, y: 400 },
                    diameter: 60,
                    sheaves: 1,
                    hasBecket: false,
                    rotation: 0,
                    attachmentPoints: {
                        top: { x: 200, y: 370 },
                        bottom: { x: 200, y: 430 }
                    }
                } as PulleyComponent,
                {
                    id: "rope-main",
                    type: ComponentType.ROPE,
                    startId: "pulley-double", // Becket on double pulley
                    endId: "pulley-double", // Pulling end
                    routeThrough: ["pulley-single", "pulley-double"],
                    tension: 50
                } as RopeComponent
            ]
        }
    },
    {
        name: "4:1 Purchase",
        description: "4:1 system using two double pulleys.",
        system: {
            gridSize: 20,
            snapToGrid: true,
            selectedId: null,
            components: [
                {
                    id: "anchor-main",
                    type: ComponentType.ANCHOR,
                    position: { x: 400, y: 100 },
                    label: "Mast"
                } as AnchorComponent,
                {
                    id: "pulley-upper",
                    type: ComponentType.PULLEY,
                    position: { x: 400, y: 160 },
                    diameter: 60,
                    sheaves: 2,
                    hasBecket: false,
                    rotation: 0,
                    attachmentPoints: {
                        top: { x: 400, y: 130 },
                        bottom: { x: 400, y: 190 }
                    }
                } as PulleyComponent,
                {
                    id: "pulley-lower",
                    type: ComponentType.PULLEY,
                    position: { x: 400, y: 400 },
                    diameter: 60,
                    sheaves: 2,
                    hasBecket: true,
                    rotation: 0,
                    attachmentPoints: {
                        top: { x: 400, y: 370 },
                        bottom: { x: 400, y: 430 },
                        becket: { x: 400, y: 440 }
                    }
                } as PulleyComponent,
                {
                    id: "rope-system",
                    type: ComponentType.ROPE,
                    startId: "pulley-lower", // Becket on lower
                    endId: "pulley-upper", // Pulling end
                    routeThrough: ["pulley-upper", "pulley-lower", "pulley-upper"],
                    tension: 25
                } as RopeComponent
            ]
        }
    }
];
