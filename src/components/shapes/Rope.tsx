import React from 'react';
import { Line, Group, Text, Circle, Arrow } from 'react-konva';
import { RopeComponent as RopeType, Component, PulleyComponent } from '../../types';
import { calculatePathLength, calculateRopePath } from '../../utils/geometry';

interface RopeProps {
    rope: RopeType;
    components: Component[];
    isSelected: boolean;
    onSelect: () => void;
    showArrows?: boolean;
}

const Rope: React.FC<RopeProps> = ({ rope, components, isSelected, onSelect, showArrows = true }) => {
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

        // Handle Cleat points
        if (component.type === 'cleat') {
            return compWithPos.position;
        }

        // Handle Person points
        if (component.type === 'person') {
            return compWithPos.position;
        }

        // Handle Spring points
        if (component.type === 'spring') {
            const spring = component as any;
            if (pointId?.includes('top')) {
                return spring.position;
            } else if (pointId?.includes('bottom')) {
                const length = spring.currentLength || spring.restLength || 100;
                return { x: spring.position.x, y: spring.position.y + length };
            }
            return spring.position;
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
                localX = totalWidth / 2 + radius + 8;
                localY = 0;
            } else if (pointId.includes('load') || pointId.includes('becket-bottom')) {
                // Bottom attachment point (load/becket connection)
                localX = 0;
                localY = radius + 8;
            } else if (pointId.includes('top')) {
                localX = 0;
                localY = -radius;
            } else if (pointId.includes('bottom')) {
                localX = 0;
                localY = radius;
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
        // Build path through all intermediate points
        path = [startPos];
        
        for (let i = 0; i < rope.routeThrough.length; i++) {
            const point = rope.routeThrough[i];
            if (typeof point === 'string') {
                // Parse the point ID to find the component and get coordinates
                // Format: "pulley-1-sheave-0-in" or "pulley-1-anchor"
                const parts = point.split('-');
                const componentId = parts.slice(0, 2).join('-'); // e.g., "pulley-1"
                const component = components.find(c => c.id === componentId);
                
                if (component && component.type === 'pulley') {
                    const coords = getPointCoordinates(component, point);
                    path.push(coords);
                    
                    // Check if next point is OUT on the same pulley (rope wraps around)
                    const nextPoint = rope.routeThrough[i + 1];
                    if (nextPoint && typeof nextPoint === 'string') {
                        const nextParts = nextPoint.split('-');
                        const nextComponentId = nextParts.slice(0, 2).join('-');
                        
                        // If current is IN and next is OUT on same pulley, add arc points
                        if (point.includes('-in') && nextPoint.includes('-out') && componentId === nextComponentId) {
                            const pulley = component as PulleyComponent;
                            const radius = pulley.diameter / 2;
                            const center = pulley.position;
                            
                            // IN is at -radius (left), OUT is at +radius (right)
                            // Add points along the bottom arc (180 degrees from IN to OUT)
                            const numArcPoints = 12; // More points = smoother arc
                            for (let j = 1; j < numArcPoints; j++) {
                                // Start at PI (left side) and go to 2*PI (right side) = bottom arc
                                const angle = Math.PI + (j / numArcPoints) * Math.PI;
                                const arcX = center.x + radius * Math.cos(angle);
                                const arcY = center.y + radius * Math.sin(angle);
                                path.push({ x: arcX, y: arcY });
                            }
                        }
                    }
                } else if (component) {
                    const coords = getPointCoordinates(component, point);
                    path.push(coords);
                }
            } else {
                // Legacy format with id and sheaveIndex
                const pulley = components.find(c => c.id === point.id);
                if (pulley) {
                    const pointId = `${point.id}-sheave-${point.sheaveIndex}-in`;
                    const coords = getPointCoordinates(pulley, pointId);
                    path.push(coords);
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
        <Group>
            {/* Invisible wider hitbox for easier selection */}
            <Line
                points={points}
                stroke="transparent"
                strokeWidth={10}
                lineCap="round"
                lineJoin="round"
                onClick={onSelect}
                onTap={onSelect}
                onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'pointer';
                }}
                onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'default';
                }}
            />
            
            {/* Rope line - using lineCap and lineJoin for clean segments */}
            <Line
                points={points}
                stroke={isSelected ? '#00d9ff' : '#ffd43b'}
                strokeWidth={isSelected ? 4 : 2}
                lineCap="round"
                lineJoin="round"
                tension={0} // No bezier smoothing - show actual path with wraps
                shadowColor={isSelected ? '#00d9ff' : undefined}
                shadowBlur={isSelected ? 10 : 0}
                listening={false}
            />

            {/* Directional arrows */}
            {showArrows && length > 20 && (() => {
                const arrows = [];
                const numArrows = Math.max(2, Math.min(6, Math.floor(length / 60)));
                
                // Place arrows along the line segments, avoiding pulley circumferences
                for (let i = 0; i < numArrows; i++) {
                    // Calculate position along total length
                    const t = (i + 1) / (numArrows + 1);
                    let targetDist = t * length;
                    let accumulatedDist = 0;
                    
                    // Find the segment containing this distance
                    for (let j = 0; j < path.length - 1; j++) {
                        const p1 = path[j];
                        const p2 = path[j + 1];
                        const segLen = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
                        
                        if (accumulatedDist + segLen >= targetDist) {
                            // Arrow is in this segment
                            const segT = (targetDist - accumulatedDist) / segLen;
                            const x = p1.x + segT * (p2.x - p1.x);
                            const y = p1.y + segT * (p2.y - p1.y);
                            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
                            
                            arrows.push(
                                <Arrow
                                    key={`arrow-${i}`}
                                    x={x}
                                    y={y}
                                    points={[0, 0, 12, 0]}
                                    pointerLength={5}
                                    pointerWidth={5}
                                    fill={isSelected ? '#00d9ff' : '#ffd43b'}
                                    stroke={isSelected ? '#00d9ff' : '#ffd43b'}
                                    strokeWidth={1.5}
                                    rotation={angle}
                                />
                            );
                            break;
                        }
                        accumulatedDist += segLen;
                    }
                }
                return arrows;
            })()}

            {/* Rope length indicator */}
            {false && length > 0 && (
                <Group x={midPoint.x} y={midPoint.y + 30}>
                    <Circle
                        radius={22}
                        fill="rgba(59, 130, 246, 0.9)"
                        stroke="#3b82f6"
                        strokeWidth={1}
                    />
                    <Text
                        x={-18}
                        y={-6}
                        text={`${Math.round(length)}px`}
                        fontSize={11}
                        fill="#f1f5f9"
                        fontFamily="'JetBrains Mono', 'Fira Code', monospace"
                        fontStyle="bold"
                        width={36}
                        align="center"
                    />
                </Group>
            )}

            {/* Start label */}
            {path.length > 0 && (
                <Group x={path[0].x} y={path[0].y}>
                    <Circle
                        radius={18}
                        fill="rgba(68, 255, 68, 0.8)"
                        stroke="#fff"
                        strokeWidth={2}
                    />
                    <Text
                        x={-12}
                        y={-6}
                        text="START"
                        fontSize={8}
                        fill="#000"
                        fontFamily="monospace"
                        fontStyle="bold"
                        width={24}
                        align="center"
                    />
                </Group>
            )}

            {/* End label */}
            {path.length > 0 && (
                <Group x={path[path.length - 1].x} y={path[path.length - 1].y}>
                    <Circle
                        radius={18}
                        fill="rgba(255, 68, 68, 0.8)"
                        stroke="#fff"
                        strokeWidth={2}
                    />
                    <Text
                        x={-10}
                        y={-6}
                        text="END"
                        fontSize={9}
                        fill="#fff"
                        fontFamily="monospace"
                        fontStyle="bold"
                        width={20}
                        align="center"
                    />
                </Group>
            )}
        </Group>
    );
};

export default Rope;
