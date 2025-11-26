import React from 'react';
import { Circle, Group, Text } from 'react-konva';
import { PulleyComponent as PulleyType } from '../../types';

interface PulleyProps {
    pulley: PulleyType;
    isSelected: boolean;
    onSelect: () => void;
    onDragEnd: (pos: { x: number; y: number }) => void;
    snapToGrid: (pos: { x: number; y: number }) => { x: number; y: number };
}

const Pulley: React.FC<PulleyProps> = ({
    pulley,
    isSelected,
    onSelect,
    onDragEnd,
    snapToGrid,
}) => {
    const radius = pulley.diameter / 2;
    const sheaveSpacing = 8; // pixels between sheaves

    const renderSheaves = () => {
        const sheaves = [];
        const totalWidth = (pulley.sheaves - 1) * sheaveSpacing;
        const startX = -totalWidth / 2;

        for (let i = 0; i < pulley.sheaves; i++) {
            const x = startX + i * sheaveSpacing;
            sheaves.push(
                <Circle
                    key={`sheave-${i}`}
                    x={x}
                    y={0}
                    radius={radius}
                    fill="rgba(100, 150, 255, 0.2)"
                    stroke="#4a90e2"
                    strokeWidth={2}
                />
            );

            // Inner circle for depth
            sheaves.push(
                <Circle
                    key={`inner-${i}`}
                    x={x}
                    y={0}
                    radius={radius * 0.7}
                    stroke="#4a90e2"
                    strokeWidth={1}
                    opacity={0.5}
                />
            );
        }
        return sheaves;
    };

    const renderAttachmentPoints = () => {
        const points = [];

        // Top attachment
        points.push(
            <Circle
                key="top"
                x={0}
                y={-radius - 10}
                radius={4}
                fill="#ff6b6b"
                stroke="#fff"
                strokeWidth={1}
            />
        );

        // Bottom attachment
        points.push(
            <Circle
                key="bottom"
                x={0}
                y={radius + 10}
                radius={4}
                fill="#51cf66"
                stroke="#fff"
                strokeWidth={1}
            />
        );

        // Becket (if present)
        if (pulley.hasBecket) {
            points.push(
                <Circle
                    key="becket"
                    x={radius + 10}
                    y={0}
                    radius={4}
                    fill="#ffd43b"
                    stroke="#fff"
                    strokeWidth={1}
                />
            );
        }

        return points;
    };

    const renderLabel = () => {
        return (
            <Text
                x={-30}
                y={radius + 25}
                text={`${pulley.diameter}mm ${pulley.sheaves}x`}
                fontSize={12}
                fill="#aaa"
                fontFamily="monospace"
            />
        );
    };

    return (
        <Group
            x={pulley.position.x}
            y={pulley.position.y}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={(e) => {
                const pos = snapToGrid({ x: e.target.x(), y: e.target.y() });
                onDragEnd(pos);
            }}
        >
            {/* Sheaves */}
            {renderSheaves()}

            {/* Attachment points */}
            {renderAttachmentPoints()}

            {/* Selection indicator */}
            {isSelected && (
                <Circle
                    x={0}
                    y={0}
                    radius={radius + 10}
                    stroke="#00d9ff"
                    strokeWidth={2}
                    dash={[5, 5]}
                />
            )}

            {/* Label */}
            {renderLabel()}

            {/* Center axle */}
            <Circle
                x={0}
                y={0}
                radius={3}
                fill="#666"
            />
        </Group>
    );
};

export default Pulley;
