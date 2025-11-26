// Component types
export enum ComponentType {
    PULLEY = 'pulley',
    ANCHOR = 'anchor',
    ROPE = 'rope',
    CLEAT = 'cleat',
    PERSON = 'person',
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
    endId: string;
    routeThrough: string[];
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

export type Component = PulleyComponent | AnchorComponent | RopeComponent | CleatComponent | PersonComponent;

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
