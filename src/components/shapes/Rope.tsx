import React from 'react';
import { Line, Group, Text, Circle, Arrow } from 'react-konva';
import { RopeComponent as RopeType, Component, PulleyComponent } from '../../types';
import { calculatePathLength } from '../../utils/geometry';

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

        // Handle Spring - return the top attachment point (position)
        if (component.type === 'spring') {
            return compWithPos.position;
        }

        return compWithPos.position;
    };

    // Check if this is an anchor rope (suspension/load attachment)
    const isAnchorRope = rope.startPoint?.includes('anchor') || 
                         rope.endPoint?.includes('anchor') ||
                         rope.startPoint?.includes('spring') ||
                         rope.endPoint?.includes('spring');
    
    const ropeColor = isAnchorRope ? '#888888' : '#3b82f6'; // gray for anchor, blue for working ropes

    // Find start and end components
    const startComp = components.find(c => c.id === rope.startId);
    const endComp = components.find(c => c.id === rope.endId);

    if (!startComp || !endComp) return null;
    if (startComp.type === 'rope' || endComp.type === 'rope') return null;

    const startPos = getPointCoordinates(startComp, rope.startPoint);
    const endPos = getPointCoordinates(endComp, rope.endPoint);

    // Build path including pulley wraps
    let path: Array<{ x: number; y: number }> = [startPos];
    
    // Check if rope goes through a pulley (IN to OUT on same pulley = wrap around)
    const startIsIn = rope.startPoint?.includes('-in');
    const endIsOut = rope.endPoint?.includes('-out');
    const startPulleyId = rope.startPoint?.split('-sheave')[0];
    const endPulleyId = rope.endPoint?.split('-sheave')[0];
    
    // If start is IN and end is OUT on the same pulley, add arc points
    if (startIsIn && endIsOut && startPulleyId === endPulleyId && endComp.type === 'pulley') {
        const pulley = endComp as PulleyComponent;
        const radius = pulley.diameter / 2;
        const center = pulley.position;
        
        // Add points along the arc from IN (left) to OUT (right) going around the bottom
        const numArcPoints = 8;
        for (let i = 1; i < numArcPoints; i++) {
            const angle = Math.PI + (i / numArcPoints) * Math.PI; // From PI (left) to 2*PI (right)
            path.push({
                x: center.x + radius * Math.cos(angle),
                y: center.y + radius * Math.sin(angle)
            });
        }
    }
    
    path.push(endPos);

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
                stroke={isSelected ? '#00d9ff' : ropeColor}
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

            {/* Start label - only at chain start (becket) */}
            {rope.startPoint?.includes('becket') && path.length > 0 && (
                <Group x={path[0].x} y={path[0].y}>
                    <Circle
                        radius={10}
                        fill="rgba(255, 140, 0, 0.6)"
                        stroke="#fff"
                        strokeWidth={1}
                    />
                    <Text
                        x={-8}
                        y={-4}
                        text="S"
                        fontSize={10}
                        fill="#fff"
                        fontFamily="monospace"
                        fontStyle="bold"
                        width={16}
                        align="center"
                    />
                </Group>
            )}

            {/* End label - only at chain end (person) */}
            {rope.endPoint?.includes('person') && path.length > 0 && (
                <Group x={path[path.length - 1].x} y={path[path.length - 1].y}>
                    <Circle
                        radius={10}
                        fill="rgba(255, 68, 68, 0.6)"
                        stroke="#fff"
                        strokeWidth={1}
                    />
                    <Text
                        x={-7}
                        y={-4}
                        text="E"
                        fontSize={10}
                        fill="#fff"
                        fontFamily="monospace"
                        fontStyle="bold"
                        width={14}
                        align="center"
                    />
                </Group>
            )}
        </Group>
    );
};

export default Rope;
