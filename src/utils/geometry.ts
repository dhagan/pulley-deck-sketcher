/**
 * Calculate tangent points from a point to a circle
 */
function getTangents(
    point: { x: number; y: number },
    circle: { center: { x: number; y: number }; radius: number }
): Array<{ x: number; y: number; angle: number }> | null {
    const dx = point.x - circle.center.x;
    const dy = point.y - circle.center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < circle.radius) return null; // Point inside circle

    const baseAngle = Math.atan2(dy, dx);
    const offsetAngle = Math.acos(circle.radius / dist);

    const t1Angle = baseAngle + offsetAngle;
    const t2Angle = baseAngle - offsetAngle;

    return [
        {
            x: circle.center.x + circle.radius * Math.cos(t1Angle),
            y: circle.center.y + circle.radius * Math.sin(t1Angle),
            angle: t1Angle
        },
        {
            x: circle.center.x + circle.radius * Math.cos(t2Angle),
            y: circle.center.y + circle.radius * Math.sin(t2Angle),
            angle: t2Angle
        }
    ];
}

/**
 * Generate points for an arc between two angles
 */
function getArcPoints(
    center: { x: number; y: number },
    radius: number,
    startAngle: number,
    endAngle: number,
    clockwise: boolean
): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];
    const segments = 10; // Number of segments for the arc

    // Normalize angles
    let start = startAngle;
    let end = endAngle;

    // Adjust for direction
    if (clockwise) {
        if (end > start) end -= 2 * Math.PI;
    } else {
        if (end < start) end += 2 * Math.PI;
    }

    const totalAngle = end - start;

    for (let i = 0; i <= segments; i++) {
        const theta = start + (totalAngle * i) / segments;
        points.push({
            x: center.x + radius * Math.cos(theta),
            y: center.y + radius * Math.sin(theta)
        });
    }

    return points;
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
        const radius = pulley.diameter / 2;
        const center = pulley.position;

        // Determine next target (next pulley center or end point)
        // Using center of next pulley is an approximation, but better than nothing
        const nextTarget = (i < pulleys.length - 1) ? pulleys[i + 1].position : end;

        // Get tangents from current point to this pulley
        const tangentsIn = getTangents(currentPoint, { center, radius });
        // Get tangents from next target to this pulley
        const tangentsOut = getTangents(nextTarget, { center, radius });

        if (tangentsIn && tangentsOut) {
            // We have 2 entry points and 2 exit points. 4 combinations.
            // We want to minimize the total distance: current -> in -> (arc) -> out -> next

            let bestPath: Array<{ x: number; y: number }> | null = null;
            let minDist = Infinity;
            let bestExit = currentPoint;

            for (const tIn of tangentsIn) {
                for (const tOut of tangentsOut) {
                    // Try both directions for arc
                    for (const clockwise of [true, false]) {
                        const arc = getArcPoints(center, radius, tIn.angle, tOut.angle, clockwise);

                        // Calculate distance
                        const d1 = distance(currentPoint, tIn);
                        const dArc = calculatePathLength(arc);
                        const d2 = distance(tOut, nextTarget);
                        const totalDist = d1 + dArc + d2;

                        if (totalDist < minDist) {
                            minDist = totalDist;
                            bestPath = arc;
                            bestExit = tOut;
                        }
                    }
                }
            }

            if (bestPath) {
                // Add arc points (excluding first point if it's duplicate of previous, but here we just push all)
                // Actually, we should be careful not to duplicate points too much
                path.push(...bestPath);
                currentPoint = bestExit;
            } else {
                // Fallback if something failed
                path.push(center);
                currentPoint = center;
            }
        } else {
            // Fallback if point inside circle
            path.push(center);
            currentPoint = center;
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
