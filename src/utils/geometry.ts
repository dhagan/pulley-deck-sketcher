/**
 * Calculate tangent points from a line to a circle
 */
export function calculateTangentPoints(
    lineStart: { x: number; y: number },
    circleCenter: { x: number; y: number },
    circleRadius: number
): { entry: { x: number; y: number }; exit: { x: number; y: number } } | null {
    // Simple tangent calculation
    const dx = circleCenter.x - lineStart.x;
    const dy = circleCenter.y - lineStart.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < circleRadius) return null;

    const angle = Math.atan2(dy, dx);
    const tangentAngle = Math.asin(circleRadius / dist);

    return {
        entry: {
            x: circleCenter.x + circleRadius * Math.cos(angle + tangentAngle + Math.PI / 2),
            y: circleCenter.y + circleRadius * Math.sin(angle + tangentAngle + Math.PI / 2)
        },
        exit: {
            x: circleCenter.x + circleRadius * Math.cos(angle - tangentAngle - Math.PI / 2),
            y: circleCenter.y + circleRadius * Math.sin(angle - tangentAngle - Math.PI / 2)
        }
    };
}

/**
 * Calculate rope path through multiple pulleys
 */
export function calculateRopePath(
    start: { x: number; y: number },
    pulleys: Array<{ position: { x: number; y: number }; diameter: number }>,
    end: { x: number; y: number }
): Array<{ x: number; y: number }> {
    const path: Array<{ x: number; y: number }> = [start];

    let currentPoint = start;

    for (let i = 0; i < pulleys.length; i++) {
        const pulley = pulleys[i];

        const tangents = calculateTangentPoints(
            currentPoint,
            pulley.position,
            pulley.diameter / 2
        );

        if (tangents) {
            path.push(tangents.entry);
            path.push(tangents.exit);
            currentPoint = tangents.exit;
        }
    }

    path.push(end);
    return path;
}

/**
 * Calculate total path length
 */
export function calculatePathLength(path: Array<{ x: number; y: number }>): number {
    let length = 0;
    for (let i = 1; i < path.length; i++) {
        const dx = path[i].x - path[i - 1].x;
        const dy = path[i].y - path[i - 1].y;
        length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
}

/**
 * Snap point to grid
 */
export function snapToGrid(
    point: { x: number; y: number },
    gridSize: number
): { x: number; y: number } {
    return {
        x: Math.round(point.x / gridSize) * gridSize,
        y: Math.round(point.y / gridSize) * gridSize,
    };
}

/**
 * Calculate distance between two points
 */
export function distance(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}
