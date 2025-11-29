import React from 'react';
import { Line, Group, Text, Circle, Arrow } from 'react-konva';
import { RopeComponent as RopeType, Component, PulleyComponent, ComponentType, RopeComponent, SpringComponent } from '../../types';
import { calculatePathLength } from '../../utils/geometry';

interface RopeProps {
    rope: RopeType;
    components: Component[];
    isSelected: boolean;
    onSelect: () => void;
    onSelectChain?: () => void;
    showArrows?: boolean;
}

const Rope: React.FC<RopeProps> = ({ rope, components, isSelected, onSelect, showArrows = true }) => {
    // Helper to get coordinates for a specific point on a component
    const getPointCoordinates = (component: Component, pointId?: string): { x: number; y: number } => {
        // Rope components don't have a single position
        if (component.type === ComponentType.ROPE) return { x: 0, y: 0 };
        
        // Springs don't have a single position either
        if (component.type === ComponentType.SPRING) {
            console.error('Springs cannot be rope connection points');
            return { x: 0, y: 0 };
        }

        const compWithPos = component as Exclude<Component, RopeComponent | SpringComponent>;
        if (!pointId || pointId === 'center') return compWithPos.position;

        // Handle Anchor points
        if (component.type === ComponentType.ANCHOR) {
            return compWithPos.position;
        }

        // Handle Cleat points
        if (component.type === ComponentType.CLEAT) {
            return compWithPos.position;
        }

        // Handle Person points
        if (component.type === ComponentType.PERSON) {
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
                // Top suspension point
                localX = 0;
                localY = -radius;
            } else if (pointId.includes('becket')) {
                // Becket attachment point at bottom of pulley
                localX = 0;
                localY = radius + 8;
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

    // Check if this is an anchor rope (suspension/load attachment)
    const isAnchorRope = rope.startPoint?.includes('anchor') || 
                         rope.endPoint?.includes('anchor') ||
                         rope.startPoint?.includes('spring') ||
                         rope.endPoint?.includes('spring');
    
    const ropeColor = isAnchorRope ? '#ef4444' : '#3b82f6'; // red for anchor, blue for working ropes

    // Find start and end components
    const startComp = components.find(c => c.id === rope.startId);
    const endComp = components.find(c => c.id === rope.endId);

    if (!startComp || !endComp) return null;
    if (startComp.type === 'rope' || endComp.type === 'rope') return null;

    const startPos = getPointCoordinates(startComp, rope.startPoint);
    const endPos = getPointCoordinates(endComp, rope.endPoint);

    // Build path including pulley wraps
    let path: Array<{ x: number; y: number }> = [startPos];
    
    // Check if rope wraps around a pulley (both IN→OUT and OUT→IN on same pulley)
    const startIsIn = rope.startPoint?.includes('-in');
    const startIsOut = rope.startPoint?.includes('-out');
    const endIsOut = rope.endPoint?.includes('-out');
    const endIsIn = rope.endPoint?.includes('-in');
    
    // Check if wrapping around same pulley - BOTH start and end must be on the same pulley
    // This means rope.startId === rope.endId (same component) AND it's a pulley
    const wrapsAroundPulley = rope.startId === rope.endId && 
                              startComp.type === 'pulley' &&
                              ((startIsIn && endIsOut) || (startIsOut && endIsIn));
    
    if (wrapsAroundPulley) {
        const pulley = startComp as PulleyComponent;
        const radius = pulley.diameter / 2;
        const center = pulley.position;
        const rotationRad = (pulley.rotation || 0) * (Math.PI / 180);
        
        // Add points along the arc - always go around the TOP (anchor side)
        const numArcPoints = 16; // More points for smoother arc
        if (startIsIn && endIsOut) {
            // IN (left) to OUT (right) - top arc
            for (let i = 1; i < numArcPoints; i++) {
                const t = i / numArcPoints;
                const angle = Math.PI - t * Math.PI; // 180° to 0°
                const localX = radius * Math.cos(angle);
                const localY = radius * Math.sin(angle);
                
                // Apply rotation
                const rotatedX = localX * Math.cos(rotationRad) - localY * Math.sin(rotationRad);
                const rotatedY = localX * Math.sin(rotationRad) + localY * Math.cos(rotationRad);
                
                path.push({
                    x: center.x + rotatedX,
                    y: center.y + rotatedY
                });
            }
        } else if (startIsOut && endIsIn) {
            // OUT (right) to IN (left) - top arc
            for (let i = 1; i < numArcPoints; i++) {
                const t = i / numArcPoints;
                const angle = t * Math.PI; // 0° to 180°
                const localX = radius * Math.cos(angle);
                const localY = radius * Math.sin(angle);
                
                // Apply rotation
                const rotatedX = localX * Math.cos(rotationRad) - localY * Math.sin(rotationRad);
                const rotatedY = localX * Math.sin(rotationRad) + localY * Math.cos(rotationRad);
                
                path.push({
                    x: center.x + rotatedX,
                    y: center.y + rotatedY
                });
            }
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
            {/* Invisible wider line for easier clicking */}
            <Line
                points={points}
                stroke="transparent"
                strokeWidth={12}
                lineCap="round"
                lineJoin="round"
                onClick={(e) => {
                    e.cancelBubble = true;
                    onSelect();
                }}
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
            
            {/* Wrap indicator - show when rope wraps around pulley */}
            {wrapsAroundPulley && startComp.type === 'pulley' && (() => {
                const pulley = startComp as PulleyComponent;
                return (
                    <Circle
                        x={pulley.position.x}
                        y={pulley.position.y}
                        radius={pulley.diameter / 2 + 2}
                        stroke={isSelected ? '#00d9ff' : '#4ade80'}
                        strokeWidth={isSelected ? 2 : 1.5}
                        dash={[5, 5]}
                        opacity={0.6}
                        listening={false}
                    />
                );
            })()}

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

            {/* Start label - only at actual chain start */}
            {rope.isChainStart && path.length > 0 && (
                <Group 
                    x={path[0].x} 
                    y={path[0].y}
                    onClick={(e) => {
                        e.cancelBubble = true;
                        onSelect(); // Always select individual rope
                    }}
                    onMouseEnter={(e) => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'pointer';
                    }}
                    onMouseLeave={(e) => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'default';
                    }}
                >
                    <Circle
                        radius={6}
                        fill="rgba(255, 140, 0, 0.8)"
                        stroke="#fff"
                        strokeWidth={1.5}
                    />
                    <Text
                        x={-5}
                        y={-3}
                        text="S"
                        fontSize={7}
                        fill="#fff"
                        fontFamily="monospace"
                        fontStyle="bold"
                    />
                </Group>
            )}

            {/* End label - only at actual chain end */}
            {rope.isChainEnd && path.length > 0 && (
                <Group 
                    x={path[path.length - 1].x} 
                    y={path[path.length - 1].y}
                    onClick={(e) => {
                        e.cancelBubble = true;
                        onSelect(); // Always select individual rope
                    }}
                    onMouseEnter={(e) => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'pointer';
                    }}
                    onMouseLeave={(e) => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'default';
                    }}
                >
                    <Circle
                        radius={6}
                        fill="rgba(255, 68, 68, 0.8)"
                        stroke="#fff"
                        strokeWidth={1.5}
                    />
                    <Text
                        x={-4}
                        y={-3}
                        text="E"
                        fontSize={7}
                        fill="#fff"
                        fontFamily="monospace"
                        fontStyle="bold"
                    />
                </Group>
            )}
        </Group>
    );
};

export default Rope;
