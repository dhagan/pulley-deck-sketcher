import React from 'react';
import { Circle, Group, Text, Arrow } from 'react-konva';
import { PulleyComponent as PulleyType } from '../../types';

interface PulleyProps {
    pulley: PulleyType;
    isSelected: boolean;
    onSelect: () => void;
    onDragEnd: (pos: { x: number; y: number }) => void;
    snapToGrid: (pos: { x: number; y: number }) => { x: number; y: number };
    onPointClick?: (pointId: string, e: any) => void;
}

const Pulley: React.FC<PulleyProps> = ({
    pulley,
    isSelected,
    onSelect,
    onDragEnd,
    snapToGrid,
    onPointClick,
}) => {
    const radius = pulley.diameter / 2;
    const sheaveSpacing = radius * 2 + 15; // Space between sheaves

    const renderSheave = (index: number, xOffset: number) => {
        const sheaveId = `${pulley.id}-sheave-${index}`;

        return (
            <Group key={sheaveId} x={xOffset} y={0}>
                {/* Main sheave circle */}
                <Circle
                    radius={radius}
                    fill="rgba(100, 150, 255, 0.2)"
                    stroke="#4a90e2"
                    strokeWidth={2}
                />

                {/* Inner circle for depth */}
                <Circle
                    radius={radius * 0.7}
                    stroke="#4a90e2"
                    strokeWidth={1}
                    opacity={0.5}
                />

                {/* Center axle */}
                <Circle
                    radius={3}
                    fill="#666"
                />

                {/* Connection Points */}

                {/* 1. Anchor Point (top) - RED */}
                <Circle
                    x={0}
                    y={-radius - 8}
                    radius={5}
                    fill="#ff6b6b"
                    stroke="#fff"
                    strokeWidth={2}
                    onClick={(e) => {
                        if (onPointClick) {
                            e.cancelBubble = true;
                            onPointClick(`${pulley.id}-anchor`, e);
                        }
                    }}
                    onTap={(e) => {
                        if (onPointClick) {
                            e.cancelBubble = true;
                            onPointClick(`${pulley.id}-anchor`, e);
                        }
                    }}
                />
                <Text
                    x={-15}
                    y={-radius - 25}
                    text="Anchor"
                    fontSize={9}
                    fill="#ff6b6b"
                    fontFamily="monospace"
                    rotation={-(pulley.rotation || 0)}
                    offsetX={-15}
                    offsetY={-radius - 25}
                />

                {/* 2. Input Rope Point (left) - BLUE with arrow */}
                <Circle
                    x={-radius - 8}
                    y={0}
                    radius={5}
                    fill="#339af0"
                    stroke="#fff"
                    strokeWidth={2}
                    onClick={(e) => {
                        if (onPointClick) {
                            e.cancelBubble = true;
                            onPointClick(`${pulley.id}-sheave-${index}-in`, e);
                        }
                    }}
                />
                <Arrow
                    points={[-radius - 20, 0, -radius - 8, 0]}
                    stroke="#339af0"
                    fill="#339af0"
                    strokeWidth={2}
                    pointerLength={6}
                    pointerWidth={6}
                />
                <Text
                    x={-radius - 20}
                    y={-5}
                    text="In"
                    fontSize={11}
                    fill="#339af0"
                    fontFamily="monospace"
                    fontStyle="bold"
                    rotation={-(pulley.rotation || 0)}
                    offsetX={-radius - 20}
                    offsetY={-5}
                />

                {/* 3. Output Rope Point (right) - GOLD with arrow */}
                <Circle
                    x={radius + 8}
                    y={0}
                    radius={5}
                    fill="#ffd43b"
                    stroke="#fff"
                    strokeWidth={2}
                    onClick={(e) => {
                        if (onPointClick) {
                            e.cancelBubble = true;
                            onPointClick(`${pulley.id}-sheave-${index}-out`, e);
                        }
                    }}
                />
                <Arrow
                    points={[radius + 8, 0, radius + 20, 0]}
                    stroke="#ffd43b"
                    fill="#ffd43b"
                    strokeWidth={2}
                    pointerLength={6}
                    pointerWidth={6}
                />
                <Text
                    x={radius + 12}
                    y={-5}
                    text="Out"
                    fontSize={11}
                    fill="#ffd43b"
                    fontFamily="monospace"
                    fontStyle="bold"
                    rotation={-(pulley.rotation || 0)}
                    offsetX={radius + 12}
                    offsetY={-5}
                />

                {/* Sheave number label */}
                <Text
                    x={-8}
                    y={radius + 15}
                    text={`#${index + 1}`}
                    fontSize={10}
                    fill="#aaa"
                    fontFamily="monospace"
                    rotation={-(pulley.rotation || 0)}
                    offsetX={-8}
                    offsetY={radius + 15}
                />
            </Group>
        );
    };

    const renderLoadAttachment = () => {
        // Bottom attachment point for load (movable)
        const bottomY = radius + 30;

        return (
            <Group x={0} y={bottomY}>
                <Circle
                    radius={6}
                    fill="#51cf66"
                    stroke="#fff"
                    strokeWidth={2}
                    onClick={(e) => {
                        if (onPointClick) {
                            e.cancelBubble = true;
                            onPointClick(`${pulley.id}-load`, e);
                        }
                    }}
                    onTap={(e) => {
                        if (onPointClick) {
                            e.cancelBubble = true;
                            onPointClick(`${pulley.id}-load`, e);
                        }
                    }}
                    draggable
                />
                <Text
                    x={-15}
                    y={10}
                    text="Load"
                    fontSize={9}
                    fill="#51cf66"
                    fontFamily="monospace"
                    rotation={-(pulley.rotation || 0)}
                    offsetX={-15}
                    offsetY={10}
                />
            </Group>
        );
    };

    const renderSheaves = () => {
        const sheaves = [];
        const totalWidth = (pulley.sheaves - 1) * sheaveSpacing;
        const startX = -totalWidth / 2;

        for (let i = 0; i < pulley.sheaves; i++) {
            const x = startX + i * sheaveSpacing;
            sheaves.push(renderSheave(i, x));
        }
        return sheaves;
    };

    const renderBecket = () => {
        if (!pulley.hasBecket) return null;

        const totalWidth = (pulley.sheaves - 1) * sheaveSpacing;
        const becketX = totalWidth / 2 + radius + 20;

        return (
            <Group x={becketX} y={0}>
                <Circle
                    radius={6}
                    fill="rgba(100, 150, 255, 0.2)"
                    stroke="#4a90e2"
                    strokeWidth={2}
                    onClick={(e) => {
                        if (onPointClick) {
                            e.cancelBubble = true;
                            onPointClick(`${pulley.id}-becket`, e);
                        }
                    }}
                />
                <Text
                    x={-20}
                    y={10}
                    text="Becket"
                    fontSize={9}
                    fill="#4a90e2"
                    fontFamily="monospace"
                    rotation={-(pulley.rotation || 0)}
                    offsetX={-20}
                    offsetY={10}
                />
            </Group>
        );
    };

    return (
        <Group
            x={pulley.position.x}
            y={pulley.position.y}
            rotation={pulley.rotation || 0}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={(e) => {
                const pos = snapToGrid({ x: e.target.x(), y: e.target.y() });
                onDragEnd(pos);
            }}
        >
            {/* Render all sheaves */}
            {renderSheaves()}

            {/* Render becket if present */}
            {renderBecket()}

            {/* Render load attachment point */}
            {renderLoadAttachment()}

            {/* Selection indicator */}
            {isSelected && (
                <Circle
                    x={0}
                    y={0}
                    radius={radius * pulley.sheaves + 30}
                    stroke="#00d9ff"
                    strokeWidth={2}
                    dash={[5, 5]}
                />
            )}

            {/* Overall label */}
            <Text
                x={-40}
                y={radius + 35}
                text={`${pulley.diameter}mm ${pulley.sheaves}x Pulley`}
                fontSize={12}
                fill="#aaa"
                fontFamily="monospace"
                rotation={-(pulley.rotation || 0)}
                offsetX={-40}
                offsetY={radius + 35}
            />
        </Group>
    );
};

export default Pulley;
