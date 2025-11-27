import React from 'react';
import { Group, Text, Circle, Line } from 'react-konva';
import { PersonComponent as PersonType } from '../../types';

interface PersonProps {
    person: PersonType;
    isSelected: boolean;
    onSelect: () => void;
    onDragEnd: (pos: { x: number; y: number }) => void;
    snapToGrid: (pos: { x: number; y: number }) => { x: number; y: number };
}

const Person: React.FC<PersonProps> = ({
    person,
    isSelected,
    onSelect,
    onDragEnd,
    snapToGrid,
}) => {
    return (
        <Group
            x={person.position.x}
            y={person.position.y}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={(e) => {
                const pos = snapToGrid({ x: e.target.x(), y: e.target.y() });
                onDragEnd(pos);
            }}
        >
            {/* Head */}
            <Circle
                x={0}
                y={-10}
                radius={4}
                fill="#ffd43b"
                stroke="#fff"
                strokeWidth={2}
            />

            {/* Body */}
            <Line
                points={[0, -6, 0, 5]}
                stroke="#ffd43b"
                strokeWidth={2}
                lineCap="round"
            />

            {/* Arms */}
            <Line
                points={person.pulling ? [-7.5, -2.5, 0, -2.5, 7.5, 0] : [-6, -1, 0, -2.5, 6, -1]}
                stroke="#ffd43b"
                strokeWidth={2}
                lineCap="round"
                lineJoin="round"
            />

            {/* Legs */}
            <Line
                points={[-4, 5, 0, 5, 0, 12.5]}
                stroke="#ffd43b"
                strokeWidth={2}
                lineCap="round"
                lineJoin="round"
            />
            <Line
                points={[4, 5, 0, 5, 0, 12.5]}
                stroke="#ffd43b"
                strokeWidth={2}
                lineCap="round"
                lineJoin="round"
            />

            {/* Connection point (hands) */}
            <Circle
                x={person.pulling ? 7.5 : 0}
                y={person.pulling ? 0 : -2.5}
                radius={2}
                fill="#ff6b6b"
                stroke="#fff"
                strokeWidth={2}
            />

            {/* Selection indicator */}
            {isSelected && (
                <Circle
                    x={0}
                    y={0}
                    radius={30}
                    stroke="#00d9ff"
                    strokeWidth={2}
                    dash={[5, 5]}
                />
            )}

            {/* Label */}
            {person.label && (
                <Text
                    x={-30}
                    y={30}
                    text={person.label}
                    fontSize={12}
                    fill="#aaa"
                    fontFamily="monospace"
                />
            )}
        </Group>
    );
};

export default Person;
