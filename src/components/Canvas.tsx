import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Group, Circle, Text } from 'react-konva';
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
    toolMode: 'select' | 'rope' | 'measure';
    onComponentClick: (id: string) => void;
    onPointClick?: (pointId: string, e: any) => void;
    measurementStart?: { x: number; y: number } | null;
    setMeasurementStart?: (pos: { x: number; y: number } | null) => void;
    measurementEnd?: { x: number; y: number } | null;
    setMeasurementEnd?: (pos: { x: number; y: number } | null) => void;
}

const Canvas: React.FC<CanvasProps> = ({
    system,
    setSystem,
    toolMode,
    onComponentClick,
    onPointClick,
    measurementStart,
    setMeasurementStart,
    measurementEnd,
    setMeasurementEnd
}) => {
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

    const handleStageClick = (e: any) => {
        if (toolMode === 'measure' && setMeasurementStart && setMeasurementEnd) {
            const stage = e.target.getStage();
            const pointerPosition = stage.getPointerPosition();

            if (!measurementStart) {
                setMeasurementStart(pointerPosition);
                setMeasurementEnd(pointerPosition); // Initialize end to start
            } else {
                // Finish measurement
                setMeasurementEnd(pointerPosition);
                // Optional: Reset after a delay or keep it? 
                // Let's keep it until next click starts a new one
                if (measurementEnd && measurementStart) {
                    // If we click again, restart
                    setMeasurementStart(pointerPosition);
                    setMeasurementEnd(pointerPosition);
                }
            }
        }
    };

    const handleStageMouseMove = (e: any) => {
        if (toolMode === 'measure' && measurementStart && setMeasurementEnd) {
            const stage = e.target.getStage();
            const pointerPosition = stage.getPointerPosition();
            setMeasurementEnd(pointerPosition);
        }
    };

    return (
        <div ref={containerRef} className="canvas-container">
            <Stage
                width={dimensions.width}
                height={dimensions.height}
                onClick={handleStageClick}
                onMouseMove={handleStageMouseMove}
            >
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

                    {/* Measurement Tool Rendering */}
                    {toolMode === 'measure' && measurementStart && measurementEnd && (
                        <Group>
                            <Line
                                points={[measurementStart.x, measurementStart.y, measurementEnd.x, measurementEnd.y]}
                                stroke="#ff00ff"
                                strokeWidth={2}
                                dash={[10, 5]}
                            />
                            <Circle x={measurementStart.x} y={measurementStart.y} radius={4} fill="#ff00ff" />
                            <Circle x={measurementEnd.x} y={measurementEnd.y} radius={4} fill="#ff00ff" />
                            <Group x={(measurementStart.x + measurementEnd.x) / 2} y={(measurementStart.y + measurementEnd.y) / 2 - 20}>
                                <div style={{ position: 'absolute' }}></div> {/* Dummy for React parsing if needed, but Konva handles Group */}
                                <Text
                                    text={`${Math.round(Math.sqrt(Math.pow(measurementEnd.x - measurementStart.x, 2) + Math.pow(measurementEnd.y - measurementStart.y, 2)))}px`}
                                    fontSize={14}
                                    fill="#ff00ff"
                                    fontStyle="bold"
                                    align="center"
                                />
                            </Group>
                        </Group>
                    )}
                </Layer>
            </Stage>
        </div>
    );
};

export default Canvas;
