import React from 'react';
import { Group, Line, Circle, Text } from 'react-konva';
import { SpringComponent as SpringType } from '../../types';

interface SpringProps {
    spring: SpringType;
    isSelected: boolean;
    onSelect: () => void;
    onDragEnd: (pos: { x: number; y: number }) => void;
    snapToGrid: boolean;
}

const Spring: React.FC<SpringProps> = ({ spring, isSelected, onSelect, onDragEnd, snapToGrid }) => {
    const coils = 8;
    const coilWidth = 12;
    const length = spring.currentLength || spring.restLength;
    const coilHeight = length / coils;

    // Generate zigzag spring path
    const springPoints: number[] = [];
    for (let i = 0; i <= coils; i++) {
        const y = i * coilHeight;
        const x = (i % 2 === 0) ? -coilWidth / 2 : coilWidth / 2;
        springPoints.push(x, y);
    }

    return (
        <Group
            x={spring.position.x}
            y={spring.position.y}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={(e) => {
                const pos = e.target.position();
                onDragEnd(pos);
            }}
        >
            {/* Top anchor point */}
            <Circle
                x={0}
                y={0}
                radius={5}
                fill={isSelected ? '#00d9ff' : '#ff6b6b'}
                stroke="#000"
                strokeWidth={1}
            />

            {/* Spring coils */}
            <Line
                points={springPoints}
                stroke={isSelected ? '#00d9ff' : '#888'}
                strokeWidth={2}
                lineCap="round"
                lineJoin="round"
            />

            {/* Bottom anchor point */}
            <Circle
                x={0}
                y={length}
                radius={5}
                fill={isSelected ? '#00d9ff' : '#ff6b6b'}
                stroke="#000"
                strokeWidth={1}
            />

            {/* Label */}
            {spring.label && (
                <Text
                    x={15}
                    y={length / 2 - 6}
                    text={spring.label}
                    fontSize={12}
                    fill={isSelected ? '#00d9ff' : '#fff'}
                    fontStyle="bold"
                />
            )}

            {/* Spring info */}
            <Text
                x={15}
                y={length / 2 + 8}
                text={`k=${spring.stiffness}N/m`}
                fontSize={10}
                fill="#aaa"
            />
        </Group>
    );
};

export default Spring;
