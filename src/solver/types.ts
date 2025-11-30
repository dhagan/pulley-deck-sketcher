export interface Point {
    x: number;
    y: number;
}

export interface PulleyComponent {
    id: string;
    type: 'pulley';
    position: Point;
    diameter: number;
    sheaves: number;
    hasBecket: boolean;
    rotation: number;
    friction?: number;
}

export interface RopeComponent {
    id: string;
    type: 'rope';
    startId: string;
    startPoint?: string;
    endId: string;
    endPoint?: string;
    label?: string;
    tension?: number;
    chainId?: string;
    isChainStart?: boolean;
    isChainEnd?: boolean;
}

export interface AnchorComponent {
    id: string;
    type: 'anchor';
    position: Point;
    label?: string;
}

export interface PersonComponent {
    id: string;
    type: 'person';
    position: Point;
    label?: string;
    pulling?: boolean;
}

export interface SpringComponent {
    id: string;
    type: 'spring';
    startId: string;
    startPoint?: string;
    endId: string;
    endPoint?: string;
    stiffness: number;
    restLength: number;
}

export type Component = PulleyComponent | RopeComponent | AnchorComponent | PersonComponent | SpringComponent;

export interface SystemState {
    version?: string;
    components: Component[];
    gridSize: number;
    snapToGrid: boolean;
    selectedId: string | null;
    showRopeArrows: boolean;
}

export interface ForceVector {
    magnitude: number;
    angle: number; // in radians
    x: number;
    y: number;
}

export interface ConnectionForce {
    componentId: string;
    connectionPoint: string;
    force: ForceVector;
    tension?: number;
}

export interface SolverResult {
    success: boolean;
    errors?: string[];
    
    // Mechanical advantage
    theoreticalMA: number;
    actualMA: number;
    efficiency: number;
    
    // Forces
    inputForce?: number;
    outputForce?: number;
    anchorForces: ConnectionForce[];
    ropeTensions: Map<string, number>;
    
    // Displacements (distance relationship)
    pullDistance?: number;      // How far you pull the rope
    loadDistance?: number;       // How far the load lifts
    distanceRatio?: number;      // pullDistance / loadDistance (should equal MA)
    
    // System info
    totalRopeLength: number;
    numberOfPulleys: number;
    movingPulleys: number;
    fixedPulleys: number;
}
