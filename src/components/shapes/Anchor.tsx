import React from 'react';
import { Circle, Group, Text, RegularPolygon } from 'react-konva';
import { AnchorComponent as AnchorType } from '../../types';

interface AnchorProps {
    anchor: AnchorType;
    isSelected: boolean;
    onSelect: () => void;
    onDragEnd: (pos: { x: number; y: number }) => void;
    snapToGrid: (pos: { x: number; y: number }) => { x: number; y: number };
}

const Anchor: React.FC<AnchorProps> = ({
    anchor,
    isSelected,
    onSelect,
    onDragEnd,
    snapToGrid,
}) => {
    return (
        <Group
            x={anchor.position.x}
            y={anchor.position.y}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={(e) => {
                const pos = snapToGrid({ x: e.target.x(), y: e.target.y() });
                onDragEnd(pos);
            }}
        >
            {/* Anchor triangle */}
            <RegularPolygon
                sides={3}
                radius={12}
                fill="#ff6b6b"
                stroke="#fff"
                strokeWidth={2}
                rotation={180}
            />

            {/* Connection point */}
            <Circle
                x={0}
                y={4}
                radius={2}
                fill="#fff"
                stroke="#ff6b6b"
                strokeWidth={2}
                onClick={(e) => {
                    e.cancelBubble = true;
                    onSelect();
                }}
                onTap={(e) => {
                    e.cancelBubble = true;
                    onSelect();
                }}
            />

            {/* Selection indicator */}
            {isSelected && (
                <Circle
                    x={0}
                    y={0}
                    radius={10}
                    stroke="#00d9ff"
                    strokeWidth={2}
                    dash={[5, 5]}
                />
            )}

            {/* Label */}
            {anchor.label && (
                <Text
                    x={-30}
                    y={20}
                    text={anchor.label}
                    fontSize={12}
                    fill="#aaa"
                    fontFamily="monospace"
                />
            )}
        </Group>
    );
};

export default Anchor;
