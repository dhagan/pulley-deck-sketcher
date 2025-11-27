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
                // Rope from anchor to pulley input
                {
                    id: "rope-1",
                    type: ComponentType.ROPE,
                    startId: "anchor-1",
                    startPoint: "anchor-1",
                    endId: "pulley-1",
                    endPoint: "pulley-1-sheave-0-in",
                    routeThrough: []
                } as RopeComponent,
                // Rope from pulley output to becket (creates the 2:1)
                {
                    id: "rope-2",
                    type: ComponentType.ROPE,
                    startId: "pulley-1",
                    startPoint: "pulley-1-sheave-0-out",
                    endId: "pulley-1",
                    endPoint: "pulley-1-becket",
                    routeThrough: []
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
                // Rope segment 1: Anchor to double pulley
                {
                    id: "rope-1",
                    type: ComponentType.ROPE,
                    startId: "anchor-1",
                    startPoint: "anchor-1",
                    endId: "pulley-double",
                    endPoint: "pulley-double-sheave-0-in",
                    routeThrough: []
                } as RopeComponent,
                // Rope segment 2: Double pulley out to single pulley in
                {
                    id: "rope-2",
                    type: ComponentType.ROPE,
                    startId: "pulley-double",
                    startPoint: "pulley-double-sheave-0-out",
                    endId: "pulley-single",
                    endPoint: "pulley-single-sheave-0-in",
                    routeThrough: []
                } as RopeComponent,
                // Rope segment 3: Single pulley out to double pulley second sheave in
                {
                    id: "rope-3",
                    type: ComponentType.ROPE,
                    startId: "pulley-single",
                    startPoint: "pulley-single-sheave-0-out",
                    endId: "pulley-double",
                    endPoint: "pulley-double-sheave-1-in",
                    routeThrough: []
                } as RopeComponent,
                // Rope segment 4: Double pulley second sheave out to becket
                {
                    id: "rope-4",
                    type: ComponentType.ROPE,
                    startId: "pulley-double",
                    startPoint: "pulley-double-sheave-1-out",
                    endId: "pulley-double",
                    endPoint: "pulley-double-becket",
                    routeThrough: []
                } as RopeComponent
            ]
        }
    }
];
