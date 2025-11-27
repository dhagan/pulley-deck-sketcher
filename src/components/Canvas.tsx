import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Group, Circle, Text } from 'react-konva';
import { SystemState, ComponentType, PulleyComponent, AnchorComponent, RopeComponent, CleatComponent, PersonComponent, SpringComponent } from '../types';
import { snapToGrid as snapToGridUtil } from '../utils/geometry';
import Pulley from './shapes/Pulley';
import Anchor from './shapes/Anchor';
import Rope from './shapes/Rope';
import Cleat from './shapes/Cleat';
import Person from './shapes/Person';
import Spring from './shapes/Spring';

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
    onContextMenu?: (e: any) => void;
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
    setMeasurementEnd,
    onContextMenu
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [stageScale, setStageScale] = useState(1);

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

    const handleWheel = (e: any) => {
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();
        const mousePointTo = {
            x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
            y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
        };

        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

        setStageScale(newScale);
        setStagePos({
            x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
            y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
        });
    };

    const renderGrid = () => {
        const { gridSize } = system;
        const lines = [];
        // Render a large enough grid to cover panning
        // Ideally this should be dynamic based on view, but fixed large range is easier for now
        const startX = -5000;
        const endX = 5000;
        const startY = -5000;
        const endY = 5000;

        for (let x = startX; x <= endX; x += gridSize) {
            lines.push(
                <Line
                    key={`v-${x}`}
                    points={[x, startY, x, endY]}
                    stroke="#3d3d3d"
                    strokeWidth={1}
                    opacity={0.3}
                />
            );
        }

        for (let y = startY; y <= endY; y += gridSize) {
            lines.push(
                <Line
                    key={`h-${y}`}
                    points={[startX, y, endX, y]}
                    stroke="#3d3d3d"
                    strokeWidth={1}
                    opacity={0.3}
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

    const getRelativePointerPosition = (stage: any) => {
        const transform = stage.getAbsoluteTransform().copy();
        transform.invert();
        const pos = stage.getPointerPosition();
        return transform.point(pos);
    };

    const handleStageClick = (e: any) => {
        if (toolMode === 'measure' && setMeasurementStart && setMeasurementEnd) {
            const stage = e.target.getStage();
            const pointerPosition = getRelativePointerPosition(stage);

            if (!measurementStart) {
                setMeasurementStart(pointerPosition);
                setMeasurementEnd(pointerPosition); // Initialize end to start
            } else {
                // Finish measurement
                setMeasurementEnd(pointerPosition);
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
            const pointerPosition = getRelativePointerPosition(stage);
            setMeasurementEnd(pointerPosition);
        }
    };

    const [isPanning, setIsPanning] = useState(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: any) => {
        const isMiddle = e.evt.button === 1;
        const isLeft = e.evt.button === 0;
        const isStage = e.target === e.target.getStage();

        if (isMiddle || (isLeft && toolMode === 'select' && isStage)) {
            setIsPanning(true);
            lastMousePos.current = { x: e.evt.clientX, y: e.evt.clientY };
            e.evt.preventDefault(); // Prevent default browser scrolling for MMB
        }
    };

    const handleMouseMove = (e: any) => {
        if (isPanning) {
            const dx = e.evt.clientX - lastMousePos.current.x;
            const dy = e.evt.clientY - lastMousePos.current.y;

            setStagePos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            lastMousePos.current = { x: e.evt.clientX, y: e.evt.clientY };
        }

        handleStageMouseMove(e);
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    return (
        <div ref={containerRef} className="canvas-container">
            <Stage
                width={dimensions.width}
                height={dimensions.height}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                x={stagePos.x}
                y={stagePos.y}
                scaleX={stageScale}
                scaleY={stageScale}
                onClick={handleStageClick}
                onContextMenu={onContextMenu || ((e) => e.evt.preventDefault())}
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
                                showArrows={system.showRopeArrows}
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

                    {system.components
                        .filter((c): c is SpringComponent => c.type === ComponentType.SPRING)
                        .map(spring => (
                            <Spring
                                key={spring.id}
                                spring={spring}
                                isSelected={spring.id === system.selectedId}
                                onSelect={() => handleSelect(spring.id)}
                                onDragEnd={(pos) => handleDragEnd(spring.id, pos)}
                                snapToGrid={snapToGrid}
                                onPointClick={onPointClick}
                            />
                        ))}

                    {/* Measurement Tool Rendering */}
                    {toolMode === 'measure' && measurementStart && measurementEnd && (() => {
                        const dx = measurementEnd.x - measurementStart.x;
                        const dy = measurementEnd.y - measurementStart.y;
                        const len = Math.sqrt(dx * dx + dy * dy);
                        if (len < 1) return null;

                        // Unit vector
                        const ux = dx / len;
                        const uy = dy / len;

                        // Perpendicular vector (rotate 90 deg)
                        const px = -uy;
                        const py = ux;

                        const offset = 40 / stageScale;
                        const extLen = 10 / stageScale;

                        // Extension lines start points (slightly offset from object)
                        const gap = 5 / stageScale;
                        const ext1Start = { x: measurementStart.x + px * gap, y: measurementStart.y + py * gap };
                        const ext1End = { x: measurementStart.x + px * (offset + extLen), y: measurementStart.y + py * (offset + extLen) };

                        const ext2Start = { x: measurementEnd.x + px * gap, y: measurementEnd.y + py * gap };
                        const ext2End = { x: measurementEnd.x + px * (offset + extLen), y: measurementEnd.y + py * (offset + extLen) };

                        // Dimension line points
                        const dimStart = { x: measurementStart.x + px * offset, y: measurementStart.y + py * offset };
                        const dimEnd = { x: measurementEnd.x + px * offset, y: measurementEnd.y + py * offset };

                        // Arrow head size
                        const arrowSize = 10 / stageScale;
                        // Arrow 1 (at dimStart, pointing to dimStart)
                        // Vector from dimStart towards dimEnd is (ux, uy)
                        // Arrow wings
                        const arrow1_1 = { x: dimStart.x + (ux * arrowSize + px * arrowSize * 0.5), y: dimStart.y + (uy * arrowSize + py * arrowSize * 0.5) };
                        const arrow1_2 = { x: dimStart.x + (ux * arrowSize - px * arrowSize * 0.5), y: dimStart.y + (uy * arrowSize - py * arrowSize * 0.5) };

                        // Arrow 2 (at dimEnd, pointing to dimEnd)
                        // Vector from dimEnd towards dimStart is (-ux, -uy)
                        const arrow2_1 = { x: dimEnd.x + (-ux * arrowSize + px * arrowSize * 0.5), y: dimEnd.y + (-uy * arrowSize + py * arrowSize * 0.5) };
                        const arrow2_2 = { x: dimEnd.x + (-ux * arrowSize - px * arrowSize * 0.5), y: dimEnd.y + (-uy * arrowSize - py * arrowSize * 0.5) };

                        return (
                            <Group>
                                {/* Extension Lines */}
                                <Line points={[ext1Start.x, ext1Start.y, ext1End.x, ext1End.y]} stroke="#ff00ff" strokeWidth={1 / stageScale} />
                                <Line points={[ext2Start.x, ext2Start.y, ext2End.x, ext2End.y]} stroke="#ff00ff" strokeWidth={1 / stageScale} />

                                {/* Dimension Line */}
                                <Line points={[dimStart.x, dimStart.y, dimEnd.x, dimEnd.y]} stroke="#ff00ff" strokeWidth={1 / stageScale} />

                                {/* Arrows */}
                                <Line points={[arrow1_1.x, arrow1_1.y, dimStart.x, dimStart.y, arrow1_2.x, arrow1_2.y]} stroke="#ff00ff" strokeWidth={1 / stageScale} closed={false} />
                                <Line points={[arrow2_1.x, arrow2_1.y, dimEnd.x, dimEnd.y, arrow2_2.x, arrow2_2.y]} stroke="#ff00ff" strokeWidth={1 / stageScale} closed={false} />

                                {/* Text */}
                                <Group x={(dimStart.x + dimEnd.x) / 2} y={(dimStart.y + dimEnd.y) / 2}>
                                    {/* Background for text to read it over lines */}
                                    <Circle radius={15 / stageScale} fill="rgba(0,0,0,0.5)" />
                                    <Text
                                        x={-20 / stageScale}
                                        y={-7 / stageScale}
                                        text={`${Math.round(len)}px`}
                                        fontSize={14 / stageScale}
                                        fill="#ff00ff"
                                        fontStyle="bold"
                                        align="center"
                                        width={40 / stageScale}
                                    />
                                </Group>
                            </Group>
                        );
                    })()}
                </Layer>
            </Stage>
        </div>
    );
};

export default Canvas;
