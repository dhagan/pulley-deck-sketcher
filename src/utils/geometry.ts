/**
 * Calculate tangent lines from external point to circle
 * Returns two tangent points on the circle
 */
function getExternalTangents(
    point: { x: number; y: number },
    circleCenter: { x: number; y: number },
    circleRadius: number
): Array<{ x: number; y: number; angle: number }> {
    const dx = circleCenter.x - point.x;
    const dy = circleCenter.y - point.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < circleRadius) {
        // Point inside circle - return circle center
        return [{
            x: circleCenter.x,
            y: circleCenter.y,
            angle: 0
        }];
    }

    // Angle from point to circle center
    const angleToCenter = Math.atan2(dy, dx);

    // Angle offset for tangent (angle between line to center and line to tangent point)
    const tangentOffset = Math.asin(circleRadius / dist);

    // The tangent point angles on the circle (measured from circle center)
    // We need to rotate 90 degrees from the direction to the tangent point
    const tangentAngle1 = angleToCenter + Math.PI / 2 - tangentOffset;
    const tangentAngle2 = angleToCenter - Math.PI / 2 + tangentOffset;

    return [
        {
            x: circleCenter.x + circleRadius * Math.cos(tangentAngle1),
            y: circleCenter.y + circleRadius * Math.sin(tangentAngle1),
            angle: tangentAngle1
        },
        {
            x: circleCenter.x + circleRadius * Math.cos(tangentAngle2),
            y: circleCenter.y + circleRadius * Math.sin(tangentAngle2),
            angle: tangentAngle2
        }
    ];
}

/**
 * Generate arc points between two angles on a circle
 */
function generateArc(
    center: { x: number; y: number },
    radius: number,
    startAngle: number,
    endAngle: number
): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];
    const segments = 16;

    // Normalize angles to -π to π range
    const normalizeAngle = (angle: number) => {
        let a = angle % (2 * Math.PI);
        if (a > Math.PI) a -= 2 * Math.PI;
        if (a < -Math.PI) a += 2 * Math.PI;
        return a;
    };

    let start = normalizeAngle(startAngle);
    let end = normalizeAngle(endAngle);

    // Calculate the angular difference
    let diff = end - start;

    // Always take the shorter arc (less than 180 degrees)
    if (diff > Math.PI) {
        diff -= 2 * Math.PI;
    } else if (diff < -Math.PI) {
        diff += 2 * Math.PI;
    }

    // Generate arc points
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = start + diff * t;
        points.push({
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle)
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
    if (pulleys.length === 0) {
        return [start, end];
    }

    const path: Array<{ x: number; y: number }> = [];
    let currentPos = start;

    for (let i = 0; i < pulleys.length; i++) {
        const pulley = pulleys[i];
        const radius = pulley.diameter / 2;
        const center = pulley.position;

        // Determine next target
        const nextPos = (i < pulleys.length - 1) ? pulleys[i + 1].position : end;

        // Get tangent points from current position to this pulley
        const entryTangents = getExternalTangents(currentPos, center, radius);

        // Get tangent points from next position to this pulley
        const exitTangents = getExternalTangents(nextPos, center, radius);

        // Choose the best entry and exit tangents (shortest path)
        let bestEntry = entryTangents[0];
        let bestExit = exitTangents[0];
        let minDist = Infinity;

        for (const entry of entryTangents) {
            for (const exit of exitTangents) {
                const d1 = distance(currentPos, entry);
                const d2 = distance(exit, nextPos);

                // Calculate arc length
                let arcAngle = Math.abs(exit.angle - entry.angle);
                if (arcAngle > Math.PI) arcAngle = 2 * Math.PI - arcAngle;
                const arcLength = radius * arcAngle;

                const totalDist = d1 + arcLength + d2;

                if (totalDist < minDist) {
                    minDist = totalDist;
                    bestEntry = entry;
                    bestExit = exit;
                }
            }
        }

        // Add straight line from current position to entry tangent
        if (path.length === 0) {
            path.push(currentPos);
        }
        path.push(bestEntry);

        // Add arc around pulley
        const arcPoints = generateArc(center, radius, bestEntry.angle, bestExit.angle);
        path.push(...arcPoints);

        // Update current position to exit tangent
        currentPos = bestExit;
    }

    // Add final straight line to end
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
