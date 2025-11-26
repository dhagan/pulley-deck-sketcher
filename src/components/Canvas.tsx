import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { SystemState, ComponentType, PulleyComponent, AnchorComponent, RopeComponent, CleatComponent, PersonComponent } from '../types';
import { snapToGrid as snapToGridUtil } from '../utils/geometry';
import Pulley from './shapes/Pulley';
import Anchor from './shapes/Anchor';
import Rope from './shapes/Rope';
import Cleat from './shapes/Cleat';
import Person from './shapes/Person';

interface CanvasProps {
    system: SystemState;
    setSystem: React.Dispatch<React.SetStateAction<SystemState>>;
    toolMode: 'select' | 'rope';
    onComponentClick: (id: string) => void;
    onPointClick?: (pointId: string, e: any) => void;
}

const Canvas: React.FC<CanvasProps> = ({ system, setSystem, toolMode, onComponentClick, onPointClick }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const renderGrid = () => {
        const { gridSize } = system;
        const lines = [];
        const { width, height } = dimensions;

        for (let x = 0; x <= width; x += gridSize) {
            lines.push(
                <Line
                    key={`v-${x}`}
                    points={[x, 0, x, height]}
                    stroke="#3d3d3d"
                    strokeWidth={1}
                />
            );
        }

        for (let y = 0; y <= height; y += gridSize) {
            lines.push(
                <Line
                    key={`h-${y}`}
                    points={[0, y, width, y]}
                    stroke="#3d3d3d"
                    strokeWidth={1}
                />
            );
        }

        return lines;
    };

    const handleSelect = (id: string) => {
        if (toolMode === 'rope') {
            onComponentClick(id);
        } else {
            setSystem(prev => ({ ...prev, selectedId: id }));
        }
    };

    const handleDragEnd = (id: string, pos: { x: number; y: number }) => {
        setSystem(prev => ({
            ...prev,
            components: prev.components.map(c =>
                c.id === id ? { ...c, position: pos } : c
            )
        }));
    };

    const snapToGrid = (pos: { x: number; y: number }) => {
        return system.snapToGrid ? snapToGridUtil(pos, system.gridSize) : pos;
    };

    return (
        <div ref={containerRef} className="canvas-container">
            <Stage width={dimensions.width} height={dimensions.height}>
                <Layer>
                    {renderGrid()}
                </Layer>
                <Layer>
                    {system.components
                        .filter((c): c is RopeComponent => c.type === ComponentType.ROPE)
                        .map(rope => (
                            <Rope
                                key={rope.id}
                                rope={rope}
                                components={system.components}
                                isSelected={rope.id === system.selectedId}
                                onSelect={() => handleSelect(rope.id)}
                            />
                        ))}

                    {system.components
                        .filter((c): c is PulleyComponent => c.type === ComponentType.PULLEY)
                        .map(pulley => (
                            <Pulley
                                key={pulley.id}
                                pulley={pulley}
                                isSelected={pulley.id === system.selectedId}
                                onSelect={() => handleSelect(pulley.id)}
                                onDragEnd={(pos) => handleDragEnd(pulley.id, pos)}
                                snapToGrid={snapToGrid}
                                onPointClick={onPointClick}
                            />
                        ))}

                    {system.components
                        .filter((c): c is AnchorComponent => c.type === ComponentType.ANCHOR)
                        .map(anchor => (
                            <Anchor
                                key={anchor.id}
                                anchor={anchor}
                                isSelected={anchor.id === system.selectedId}
                                onSelect={() => handleSelect(anchor.id)}
                                onDragEnd={(pos) => handleDragEnd(anchor.id, pos)}
                                snapToGrid={snapToGrid}
                            />
                        ))}

                    {system.components
                        .filter((c): c is CleatComponent => c.type === ComponentType.CLEAT)
                        .map(cleat => (
                            <Cleat
                                key={cleat.id}
                                cleat={cleat}
                                isSelected={cleat.id === system.selectedId}
                                onSelect={() => handleSelect(cleat.id)}
                                onDragEnd={(pos) => handleDragEnd(cleat.id, pos)}
                                snapToGrid={snapToGrid}
                            />
                        ))}

                    {system.components
                        .filter((c): c is PersonComponent => c.type === ComponentType.PERSON)
                        .map(person => (
                            <Person
                                key={person.id}
                                person={person}
                                isSelected={person.id === system.selectedId}
                                onSelect={() => handleSelect(person.id)}
                                onDragEnd={(pos) => handleDragEnd(person.id, pos)}
                                snapToGrid={snapToGrid}
                            />
                        ))}
                </Layer>
            </Stage>
        </div>
    );
};

export default Canvas;
