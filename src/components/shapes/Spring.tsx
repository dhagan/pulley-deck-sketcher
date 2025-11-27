import React from 'react';
import { Group, Line, Text, Circle } from 'react-konva';
import { SpringComponent as SpringType, Component } from '../../types';

interface SpringProps {
    spring: SpringType;
    components: Component[];
    isSelected: boolean;
    onSelect: () => void;
}

const Spring: React.FC<SpringProps> = ({ spring, components, isSelected, onSelect }) => {
    const getPointPosition = (pointId: string): { x: number; y: number } | null => {
        const componentId = pointId.split('-')[0] + '-' + pointId.split('-')[1];
        const component = components.find(c => c.id === componentId);
        
        if (!component || !('position' in component)) return null;
        return component.position;
    };

    const startPos = getPointPosition(spring.startPoint);
    const endPos = getPointPosition(spring.endPoint);

    if (!startPos || !endPos) {
        console.error('Invalid spring connection points:', spring);
        return null;
    }

    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const angle = Math.atan2(dy, dx);

    const coils = 8;
    const coilWidth = 15;

    const springPoints: number[] = [];
    for (let i = 0; i <= coils; i++) {
        const t = i / coils;
        const x = startPos.x + dx * t;
        const y = startPos.y + dy * t;
        
        const offset = (i % 2 === 0) ? -coilWidth / 2 : coilWidth / 2;
        const perpX = -Math.sin(angle) * offset;
        const perpY = Math.cos(angle) * offset;
        
        springPoints.push(x + perpX, y + perpY);
    }

    return (
        <Group onClick={onSelect} onTap={onSelect}>
            <Line
                points={springPoints}
                stroke={isSelected ? '#00d9ff' : '#ff6b6b'}
                strokeWidth={isSelected ? 3 : 2}
                lineCap="round"
                lineJoin="round"
            />
            <Circle x={startPos.x} y={startPos.y} radius={4} fill="#ff6b6b" stroke="#fff" strokeWidth={1} />
            <Circle x={endPos.x} y={endPos.y} radius={4} fill="#ff6b6b" stroke="#fff" strokeWidth={1} />
            {spring.label && (
                <Text
                    x={(startPos.x + endPos.x) / 2 - 20}
                    y={(startPos.y + endPos.y) / 2 - 25}
                    text={spring.label}
                    fontSize={12}
                    fill="#ff6b6b"
                    fontFamily="monospace"
                />
            )}
        </Group>
    );
};

export default Spring;
