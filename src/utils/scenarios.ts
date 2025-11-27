import { SystemState, ComponentType, PulleyComponent, AnchorComponent, RopeComponent } from '../types';

export interface Scenario {
    name: string;
    description: string;
    system: SystemState;
}

export const scenarios: Scenario[] = [
    {
        name: "2:1 Simple",
        description: "Simple 2:1 mechanical advantage with one moving pulley.",
        system: {
            gridSize: 20,
            snapToGrid: true,
            selectedId: null,
            components: [
                {
                    id: "anchor-1",
                    type: ComponentType.ANCHOR,
                    position: { x: 200, y: 100 },
                    label: "Fixed"
                } as AnchorComponent,
                {
                    id: "pulley-1",
                    type: ComponentType.PULLEY,
                    position: { x: 200, y: 300 },
                    diameter: 60,
                    sheaves: 1,
                    hasBecket: true,
                    rotation: 0,
                    attachmentPoints: {
                        top: { x: 200, y: 270 },
                        bottom: { x: 200, y: 330 }
                    }
                } as PulleyComponent,
                // Anchor to pulley anchor point
                {
                    id: "rope-1",
                    type: ComponentType.ROPE,
                    startId: "anchor-1",
                    startPoint: "anchor-1",
                    endId: "pulley-1",
                    endPoint: "pulley-1-anchor",
                    routeThrough: []
                } as RopeComponent,
                // Main rope: goes in sheave, wraps around, comes out, goes to becket
                {
                    id: "rope-2",
                    type: ComponentType.ROPE,
                    startId: "pulley-1",
                    startPoint: "pulley-1-sheave-0-in",
                    endId: "pulley-1",
                    endPoint: "pulley-1-becket",
                    routeThrough: ["pulley-1"]
                } as RopeComponent
            ]
        }
    },
    {
        name: "3:1 Mechanical Advantage",
        description: "Standard 3:1 system with double and single pulleys.",
        system: {
            gridSize: 20,
            snapToGrid: true,
            selectedId: null,
            components: [
                {
                    id: "anchor-1",
                    type: ComponentType.ANCHOR,
                    position: { x: 300, y: 100 },
                    label: "Fixed"
                } as AnchorComponent,
                {
                    id: "pulley-double",
                    type: ComponentType.PULLEY,
                    position: { x: 300, y: 200 },
                    diameter: 60,
                    sheaves: 2,
                    hasBecket: true,
                    rotation: 0,
                    attachmentPoints: {
                        top: { x: 300, y: 170 },
                        bottom: { x: 300, y: 230 }
                    }
                } as PulleyComponent,
                {
                    id: "pulley-single",
                    type: ComponentType.PULLEY,
                    position: { x: 300, y: 400 },
                    diameter: 60,
                    sheaves: 1,
                    hasBecket: false,
                    rotation: 0,
                    attachmentPoints: {
                        top: { x: 300, y: 370 },
                        bottom: { x: 300, y: 430 }
                    }
                } as PulleyComponent,
                // Anchor to double pulley anchor point
                {
                    id: "rope-1",
                    type: ComponentType.ROPE,
                    startId: "anchor-1",
                    startPoint: "anchor-1",
                    endId: "pulley-double",
                    endPoint: "pulley-double-anchor",
                    routeThrough: []
                } as RopeComponent,
                // Main continuous rope through the system
                {
                    id: "rope-2",
                    type: ComponentType.ROPE,
                    startId: "pulley-double",
                    startPoint: "pulley-double-sheave-0-in",
                    endId: "pulley-double",
                    endPoint: "pulley-double-becket",
                    routeThrough: ["pulley-double", "pulley-single", "pulley-double"]
                } as RopeComponent
            ]
        }
    }
];
