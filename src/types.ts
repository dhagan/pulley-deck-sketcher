// Component types
export enum ComponentType {
    PULLEY = 'pulley',
    ANCHOR = 'anchor',
    ROPE = 'rope',
    CLEAT = 'cleat',
    PERSON = 'person',
    SPRING = 'spring',
}

export interface Point {
    x: number;
    y: number;
}

export interface PulleyComponent {
    id: string;
    type: ComponentType.PULLEY;
    position: Point;
    diameter: number;
    sheaves: 1 | 2 | 3;
    hasBecket: boolean;
    rotation: number; // Rotation in degrees
    attachmentPoints: {
        top: Point;
        bottom: Point;
        becket?: Point;
    };
}

export interface AnchorComponent {
    id: string;
    type: ComponentType.ANCHOR;
    position: Point;
    label?: string;
}

export interface RopeComponent {
    id: string;
    type: ComponentType.ROPE;
    startId: string;
    startPoint?: string; // e.g., 'anchor', 'becket', 'sheave-0-in'
    endId: string;
    endPoint?: string;
    routeThrough: (string | { id: string; sheaveIndex: number })[];
    tension?: number;
}

export interface CleatComponent {
    id: string;
    type: ComponentType.CLEAT;
    position: Point;
    label?: string;
}

export interface PersonComponent {
    id: string;
    type: ComponentType.PERSON;
    position: Point;
    label?: string;
    pulling: boolean;
}

export interface SpringComponent {
    id: string;
    type: ComponentType.SPRING;
    position: Point;
    label?: string;
    stiffness: number; // Spring constant (N/m)
    restLength: number; // Unloaded length in pixels
    currentLength?: number; // Current length when loaded
}

export type Component = PulleyComponent | AnchorComponent | RopeComponent | CleatComponent | PersonComponent | SpringComponent;

export interface SystemState {
    components: Component[];
    selectedId: string | null;
    gridSize: number;
    snapToGrid: boolean;
}

export interface ForceAnalysis {
    componentId: string;
    forces: {
        x: number;
        y: number;
        magnitude: number;
    };
}

export interface SystemAnalysis {
    mechanicalAdvantage: number;
    totalRopeLength: number;
    forces: ForceAnalysis[];
    efficiency: number;
}

export interface Route {
    type: 'simple' | 'compound';
    ratio: number;
    maxLength?: number;
    nested?: Route[];
}

export interface PulleyCalcSystem {
    name: string;
    description?: string;
    throw: number;
    sheaveWidth: number;
    connectionLength: number;
    friction: number;
    routes: Route[];
}
