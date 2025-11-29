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
    onPointHover?: (pointId: string | null) => void;
}

const Pulley: React.FC<PulleyProps> = ({
    pulley,
    onSelect,
    onDragEnd,
    snapToGrid,
    onPointClick,
    onPointHover,
}) => {
    const radius = pulley.diameter / 2;
    const sheaveSpacing = radius * 2 + 15; // Space between sheaves
    const [hoveredPoint, setHoveredPoint] = React.useState<string | null>(null);

    // Validate radius to prevent NaN errors
    if (!pulley.diameter || isNaN(pulley.diameter) || pulley.diameter <= 0) {
        console.error('Invalid pulley diameter:', pulley.diameter);
        return null;
    }

    const renderSheave = (index: number, xOffset: number) => {
        const sheaveId = `${pulley.id}-sheave-${index}`;

        return (
            <Group key={sheaveId} x={xOffset} y={0}>
                {/* Main sheave circle - all pulleys identical */}
                <Circle
                    radius={radius}
                    fill="rgba(160, 160, 180, 0.2)"
                    stroke="#888"
                    strokeWidth={2.5}
                />

                {/* Inner circle for depth */}
                <Circle
                    radius={radius * 0.7}
                    stroke="#666"
                    strokeWidth={1.5}
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
                    radius={hoveredPoint === `${pulley.id}-anchor` ? 7 : 5}
                    fill="#ff6b6b"
                    stroke={hoveredPoint === `${pulley.id}-anchor` ? "#00d9ff" : "#fff"}
                    strokeWidth={hoveredPoint === `${pulley.id}-anchor` ? 3 : 2}
                    onClick={(e) => {
                        e.cancelBubble = true;
                        if (onSelect) onSelect();
                        if (onPointClick) onPointClick(`${pulley.id}-anchor`, e);
                    }}
                    onTap={(e) => {
                        if (onPointClick) {
                            e.cancelBubble = true;
                            onPointClick(`${pulley.id}-anchor`, e);
                        }
                    }}
                    onMouseEnter={() => {
                        setHoveredPoint(`${pulley.id}-anchor`);
                        onPointHover && onPointHover(`${pulley.id}-anchor`);
                    }}
                    onMouseLeave={() => {
                        setHoveredPoint(null);
                        onPointHover && onPointHover(null);
                    }}
                />
                <Text
                    x={-20}
                    y={-radius - 25}
                    text="Anchor"
                    fontSize={7}
                    fill="#ff6b6b"
                    fontFamily="monospace"
                    fontStyle="bold"
                    rotation={-(pulley.rotation || 0)}
                    offsetX={-20}
                    offsetY={-radius - 25}
                />

                {/* 2. Input Rope Point (left) - BLUE with arrow */}
                <Circle
                    x={-radius - 8}
                    y={0}
                    radius={hoveredPoint === `${pulley.id}-sheave-${index}-in` ? 7 : 5}
                    fill="#339af0"
                    stroke={hoveredPoint === `${pulley.id}-sheave-${index}-in` ? "#00d9ff" : "#fff"}
                    strokeWidth={hoveredPoint === `${pulley.id}-sheave-${index}-in` ? 3 : 2}
                    onClick={(e) => {
                        e.cancelBubble = true;
                        if (onSelect) onSelect();
                        if (onPointClick) onPointClick(`${pulley.id}-sheave-${index}-in`, e);
                    }}
                    onMouseEnter={() => {
                        setHoveredPoint(`${pulley.id}-sheave-${index}-in`);
                        onPointHover && onPointHover(`${pulley.id}-sheave-${index}-in`);
                    }}
                    onMouseLeave={() => {
                        setHoveredPoint(null);
                        onPointHover && onPointHover(null);
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
                    x={-20}
                    y={-5}
                    text="In"
                    fontSize={7}
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
                    radius={hoveredPoint === `${pulley.id}-sheave-${index}-out` ? 7 : 5}
                    fill="#ffd43b"
                    stroke={hoveredPoint === `${pulley.id}-sheave-${index}-out` ? "#00d9ff" : "#fff"}
                    strokeWidth={hoveredPoint === `${pulley.id}-sheave-${index}-out` ? 3 : 2}
                    onClick={(e) => {
                        e.cancelBubble = true;
                        if (onSelect) onSelect();
                        if (onPointClick) onPointClick(`${pulley.id}-sheave-${index}-out`, e);
                    }}
                    onMouseEnter={() => {
                        setHoveredPoint(`${pulley.id}-sheave-${index}-out`);
                        onPointHover && onPointHover(`${pulley.id}-sheave-${index}-out`);
                    }}
                    onMouseLeave={() => {
                        setHoveredPoint(null);
                        onPointHover && onPointHover(null);
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
                    fontSize={7}
                    fill="#ffd43b"
                    fontFamily="monospace"
                    fontStyle="bold"
                    rotation={-(pulley.rotation || 0)}
                    offsetX={radius + 12}
                    offsetY={-5}
                />

                {/* 4. Becket Point (bottom) - ORANGE - part of sheave when hasBecket */}
                {pulley.hasBecket && (
                    <>
                        <Circle
                            x={0}
                            y={radius + 8}
                            radius={hoveredPoint === `${pulley.id}-becket` ? 7 : 6}
                            fill="#ff8c00"
                            stroke={hoveredPoint === `${pulley.id}-becket` ? "#00d9ff" : "#fff"}
                            strokeWidth={hoveredPoint === `${pulley.id}-becket` ? 3 : 2}
                            onClick={(e) => {
                                e.cancelBubble = true;
                                if (onSelect) onSelect();
                                if (onPointClick) onPointClick(`${pulley.id}-becket`, e);
                            }}
                            onTap={(e) => {
                                e.cancelBubble = true;
                                if (onPointClick) onPointClick(`${pulley.id}-becket`, e);
                            }}
                            onMouseEnter={() => {
                                setHoveredPoint(`${pulley.id}-becket`);
                                onPointHover && onPointHover(`${pulley.id}-becket`);
                            }}
                            onMouseLeave={() => {
                                setHoveredPoint(null);
                                onPointHover && onPointHover(null);
                            }}
                        />
                        <Text
                            x={-15}
                            y={radius + 15}
                            text="Becket"
                            fontSize={7}
                            fill="#ff8c00"
                            fontFamily="monospace"
                            fontStyle="bold"
                            rotation={-(pulley.rotation || 0)}
                            offsetX={-15}
                            offsetY={radius + 15}
                        />
                    </>
                )}

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
