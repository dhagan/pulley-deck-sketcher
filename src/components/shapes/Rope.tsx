import React from 'react';
import { Line, Group, Text, Circle } from 'react-konva';
import { RopeComponent as RopeType, Component, PulleyComponent } from '../../types';
import { calculateRopePath, calculatePathLength } from '../../utils/geometry';

interface RopeProps {
    rope: RopeType;
    components: Component[];
    isSelected: boolean;
    onSelect: () => void;
}

const Rope: React.FC<RopeProps> = ({ rope, components, isSelected, onSelect }) => {
    // Find start and end components
    const startComp = components.find(c => c.id === rope.startId);
    const endComp = components.find(c => c.id === rope.endId);

    if (!startComp || !endComp) return null;
    if (startComp.type === 'rope' || endComp.type === 'rope') return null;

    // Get pulleys in route
    const pulleys = rope.routeThrough
        .map(id => components.find(c => c.id === id))
        .filter((c): c is PulleyComponent => c?.type === 'pulley');

    // Calculate path
    const path = calculateRopePath(
        startComp.position,
        pulleys,
        endComp.position
    );

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
