import React from 'react';
import { Line, Group, Text, Circle } from 'react-konva';
import { RopeComponent as RopeType, Component, PulleyComponent } from '../../types';
import { calculatePathLength } from '../../utils/geometry';

interface RopeProps {
    rope: RopeType;
    components: Component[];
    isSelected: boolean;
    onSelect: () => void;
}

const Rope: React.FC<RopeProps> = ({ rope, components, isSelected, onSelect }) => {
    // Helper to get coordinates for a specific point on a component
    const getPointCoordinates = (component: Component, pointId?: string): { x: number; y: number } => {
        // Rope components don't have a single position
        if (component.type === 'rope') return { x: 0, y: 0 };

        const compWithPos = component as Exclude<Component, RopeType>;
        if (!pointId || pointId === 'center') return compWithPos.position;

        // Handle Anchor points
        if (component.type === 'anchor') {
            return compWithPos.position;
        }

        // Handle Pulley points
        if (component.type === 'pulley') {
            const pulley = component as PulleyComponent;
            const radius = pulley.diameter / 2;
            const sheaveSpacing = radius * 2 + 15;
            const rotationRad = (pulley.rotation || 0) * (Math.PI / 180);

            // Parse point ID: pulley-id-type or pulley-id-sheave-index-type
            // Examples: pulley-1-anchor, pulley-1-becket, pulley-1-sheave-0-in

            let localX = 0;
            let localY = 0;

            if (pointId.includes('anchor')) {
                localX = 0;
                localY = -radius; // On top of circumference
            } else if (pointId.includes('becket')) {
                const totalWidth = (pulley.sheaves - 1) * sheaveSpacing;
                localX = totalWidth / 2 + radius + 20;
                localY = 0;
            } else if (pointId.includes('sheave')) {
                const parts = pointId.split('-');
                const sheaveIndex = parseInt(parts[parts.indexOf('sheave') + 1]);
                const type = parts[parts.length - 1]; // 'in' or 'out'

                const totalWidth = (pulley.sheaves - 1) * sheaveSpacing;
                const startX = -totalWidth / 2;
                const sheaveX = startX + sheaveIndex * sheaveSpacing;

                // Place connection points ON the circumference, not offset
                if (type === 'in') {
                    localX = sheaveX - radius;
                    localY = 0;
                } else if (type === 'out') {
                    localX = sheaveX + radius;
                    localY = 0;
                }
            }

            // Apply rotation
            const rotatedX = localX * Math.cos(rotationRad) - localY * Math.sin(rotationRad);
            const rotatedY = localX * Math.sin(rotationRad) + localY * Math.cos(rotationRad);

            return {
                x: pulley.position.x + rotatedX,
                y: pulley.position.y + rotatedY
            };
        }

        return compWithPos.position;
    };

    // Find start and end components
    const startComp = components.find(c => c.id === rope.startId);
    const endComp = components.find(c => c.id === rope.endId);

    if (!startComp || !endComp) return null;
    if (startComp.type === 'rope' || endComp.type === 'rope') return null;

    const startPos = getPointCoordinates(startComp, rope.startPoint);
    const endPos = getPointCoordinates(endComp, rope.endPoint);

    let path: Array<{ x: number; y: number }> = [];

    if (rope.routeThrough && rope.routeThrough.length > 0) {
        // Rope wraps through pulleys
        path.push(startPos);

        for (const pulleyId of rope.routeThrough) {
            const pulley = components.find(c => c.id === pulleyId);
            if (pulley && pulley.type === 'pulley') {
                const p = pulley as PulleyComponent;
                const radius = p.diameter / 2;

                // Add arc points around the pulley (simple approximation)
                const center = p.position;
                const segments = 16;

                // Calculate angles from start to end around the pulley
                const startAngle = Math.atan2(path[path.length - 1].y - center.y, path[path.length - 1].x - center.x);
                const endAngle = Math.atan2(endPos.y - center.y, endPos.x - center.x);

                // Generate arc
                for (let i = 0; i <= segments; i++) {
                    const t = i / segments;
                    let angle = startAngle + (endAngle - startAngle) * t;

                    // Normalize angle difference
                    let diff = endAngle - startAngle;
                    if (diff > Math.PI) angle = startAngle + (endAngle - 2 * Math.PI - startAngle) * t;
                    else if (diff < -Math.PI) angle = startAngle + (endAngle + 2 * Math.PI - startAngle) * t;

                    path.push({
                        x: center.x + radius * Math.cos(angle),
                        y: center.y + radius * Math.sin(angle)
                    });
                }
            }
        }

        path.push(endPos);
    } else {
        // Simple straight line
        path = [startPos, endPos];
    }

    // Flatten path for Konva Line
    const points = path.flatMap(p => [p.x, p.y]);

    // Calculate length
    const length = calculatePathLength(path);

    // Calculate midpoint for label
    const midIndex = Math.floor(path.length / 2);
    const midPoint = path[midIndex] || path[0];

    return (
        <Group onClick={onSelect} onTap={onSelect}>
            {/* Rope line */}
            <Line
                points={points}
                stroke={isSelected ? '#00d9ff' : '#ffd43b'}
                strokeWidth={isSelected ? 3 : 2}
                lineCap="round"
                lineJoin="round"
                tension={0.5} // Add some curve to look more natural
            />

            {/* Length label */}
            <Group x={midPoint.x} y={midPoint.y}>
                <Circle
                    radius={20}
                    fill="rgba(0, 0, 0, 0.7)"
                />
                <Text
                    x={-15}
                    y={-6}
                    text={`${length.toFixed(0)}px`}
                    fontSize={11}
                    fill="#ffd43b"
                    fontFamily="monospace"
                />
            </Group>

            {/* Tension label (if calculated) */}
            {rope.tension !== undefined && (
                <Group x={midPoint.x} y={midPoint.y - 30}>
                    <Circle
                        radius={18}
                        fill="rgba(0, 0, 0, 0.7)"
                    />
                    <Text
                        x={-12}
                        y={-6}
                        text={`T=${rope.tension.toFixed(1)}N`}
                        fontSize={10}
                        fill="#51cf66"
                        fontFamily="monospace"
                    />
                </Group>
            )}
        </Group>
    );
};

export default Rope;
