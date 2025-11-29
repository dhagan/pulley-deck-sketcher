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
    friction?: number; // Friction coefficient (default 0.95 = 5% loss)
    efficiency?: number; // Overall efficiency percentage (calculated from friction)
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
    tension?: number;
    label?: string;
    chainId?: string; // ID of the chain this rope belongs to
    isChainStart?: boolean; // True if this is the first rope in a chain (at becket)
    isChainEnd?: boolean; // True if this is the last rope in a chain (at person)
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
    startId: string; // Component ID where spring starts
    startPoint: string; // Specific point on start component
    endId: string; // Component ID where spring ends
    endPoint: string; // Specific point on end component
    label?: string;
    stiffness?: number; // Spring constant k (N/mm)
    restLength?: number; // Unloaded length in mm
}

export type Component = PulleyComponent | AnchorComponent | RopeComponent | CleatComponent | PersonComponent | SpringComponent;

export interface RopeChain {
    id: string;
    ropeIds: string[]; // Ordered list of rope segment IDs that form the chain
    startPoint: string; // Where the chain starts (e.g., becket)
    endPoint: string; // Where the chain ends (e.g., person)
}

export interface SystemState {
    components: Component[];
    selectedId: string | null;
    gridSize: number;
    snapToGrid: boolean;
    showRopeArrows?: boolean;
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
