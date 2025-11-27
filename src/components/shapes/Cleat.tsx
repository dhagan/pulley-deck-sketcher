import React from 'react';
import { Group, Text, Rect, Circle } from 'react-konva';
import { CleatComponent as CleatType } from '../../types';

interface CleatProps {
    cleat: CleatType;
    isSelected: boolean;
    onSelect: () => void;
    onDragEnd: (pos: { x: number; y: number }) => void;
    snapToGrid: (pos: { x: number; y: number }) => { x: number; y: number };
}

const Cleat: React.FC<CleatProps> = ({
    cleat,
    isSelected,
    onSelect,
    onDragEnd,
    snapToGrid,
}) => {
    if (!cleat.position || isNaN(cleat.position.x) || isNaN(cleat.position.y)) {
        console.error('Invalid cleat position:', cleat.position);
        return null;
    }

    return (
        <Group
            x={cleat.position.x}
            y={cleat.position.y}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={(e) => {
                const pos = snapToGrid({ x: e.target.x(), y: e.target.y() });
                onDragEnd(pos);
            }}
        >
            {/* Cleat base */}
            <Rect
                x={-15}
                y={-8}
                width={30}
                height={16}
                fill="#8b7355"
                stroke="#fff"
                strokeWidth={2}
                cornerRadius={2}
            />

            {/* Cleat horns */}
            <Rect
                x={-20}
                y={-12}
                width={10}
                height={24}
                fill="#8b7355"
                stroke="#fff"
                strokeWidth={2}
                cornerRadius={2}
            />
            <Rect
                x={10}
                y={-12}
                width={10}
                height={24}
                fill="#8b7355"
                stroke="#fff"
                strokeWidth={2}
                cornerRadius={2}
            />

            {/* Connection point */}
            <Circle
                x={0}
                y={0}
                radius={4}
                fill="#fff"
                stroke="#8b7355"
                strokeWidth={2}
            />

            {/* Selection indicator */}
            {isSelected && (
                <Circle
                    x={0}
                    y={0}
                    radius={25}
                    stroke="#00d9ff"
                    strokeWidth={2}
                    dash={[5, 5]}
                />
            )}

            {/* Label */}
            {cleat.label && (
                <Text
                    x={-30}
                    y={20}
                    text={cleat.label}
                    fontSize={12}
                    fill="#aaa"
                    fontFamily="monospace"
                />
            )}
        </Group>
    );
};

export default Cleat;
