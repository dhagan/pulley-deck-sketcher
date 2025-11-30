import React, { useState, useRef } from 'react';
import { Stage, Layer, Circle, Line, Text, Arrow, Group } from 'react-konva';
import { SystemState } from '../types';
import { PulleySolver } from '../solver';
import { formatResultsForDisplay } from '../utils/display';

interface ForceDiagramViewProps {
    system: SystemState;
    loadForce: number;
}

const ForceDiagramView: React.FC<ForceDiagramViewProps> = ({ system, loadForce }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const stageRef = useRef<any>(null);

    if (system.components.length === 0) {
        return (
            <div style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#0f172a',
                color: '#888'
            }}>
                <p>Add components to see force diagram</p>
            </div>
        );
    }

    const handleWheel = (e: any) => {
        e.evt.preventDefault();
        
        const scaleBy = 1.1;
        const stage = stageRef.current;
        const oldScale = scale;
        const pointer = stage.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - position.x) / oldScale,
            y: (pointer.y - position.y) / oldScale,
        };

        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        
        // Limit scale
        const limitedScale = Math.max(0.1, Math.min(5, newScale));

        setScale(limitedScale);
        setPosition({
            x: pointer.x - mousePointTo.x * limitedScale,
            y: pointer.y - mousePointTo.y * limitedScale,
        });
    };

    const handleDragEnd = (e: any) => {
        setPosition({
            x: e.target.x(),
            y: e.target.y(),
        });
    };

    try {
        const solver = new PulleySolver(system as any);
        const result = solver.solve(loadForce);
        const display = formatResultsForDisplay(result, system as any, 'Force Diagram', loadForce);

        // Calculate bounds to fit all components
        const positions = system.components
            .filter(c => 'position' in c)
            .map(c => (c as any).position);
        
        if (positions.length === 0) return null;

        const minX = Math.min(...positions.map(p => p.x));
        const maxX = Math.max(...positions.map(p => p.x));
        const minY = Math.min(...positions.map(p => p.y));
        const maxY = Math.max(...positions.map(p => p.y));

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Scale factor for force arrows (make them visible but not overwhelming)
        const forceScale = 2;

        return (
            <div style={{ 
                width: '100%', 
                height: '100%', 
                background: '#0f172a',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Controls */}
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 10,
                    display: 'flex',
                    gap: '8px',
                    background: '#1e293b',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #475569'
                }}>
                    <button
                        onClick={() => setScale(s => Math.min(5, s * 1.2))}
                        style={{
                            padding: '4px 12px',
                            background: '#334155',
                            border: '1px solid #475569',
                            color: '#f1f5f9',
                            cursor: 'pointer',
                            borderRadius: '2px'
                        }}
                    >
                        +
                    </button>
                    <button
                        onClick={() => setScale(s => Math.max(0.1, s / 1.2))}
                        style={{
                            padding: '4px 12px',
                            background: '#334155',
                            border: '1px solid #475569',
                            color: '#f1f5f9',
                            cursor: 'pointer',
                            borderRadius: '2px'
                        }}
                    >
                        −
                    </button>
                    <button
                        onClick={() => {
                            setScale(1);
                            setPosition({ x: 0, y: 0 });
                        }}
                        style={{
                            padding: '4px 12px',
                            background: '#334155',
                            border: '1px solid #475569',
                            color: '#f1f5f9',
                            cursor: 'pointer',
                            borderRadius: '2px'
                        }}
                    >
                        Reset
                    </button>
                    <div style={{
                        padding: '4px 12px',
                        color: '#94a3b8',
                        fontSize: '12px'
                    }}>
                        {Math.round(scale * 100)}%
                    </div>
                </div>

                {/* Info panel */}
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    zIndex: 10,
                    background: '#1e293b',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid #475569',
                    fontSize: '12px',
                    color: '#f1f5f9'
                }}>
                    <div><strong>Pull Force:</strong> {display.summary.inputForce}</div>
                    <div><strong>Load Force:</strong> {loadForce} N</div>
                    <div><strong>MA:</strong> {display.summary.actualMA}</div>
                    <div><strong>Efficiency:</strong> {display.summary.efficiency}</div>
                </div>

                <Stage
                    ref={stageRef}
                    width={window.innerWidth - 300}
                    height={window.innerHeight - 100}
                    onWheel={handleWheel}
                    draggable
                    x={position.x}
                    y={position.y}
                    scaleX={scale}
                    scaleY={scale}
                    onDragEnd={handleDragEnd}
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                >
                    <Layer>
                        {/* Draw rope tensions as lines */}
                        {display.graph.edges.map(edge => {
                            const sourceNode = display.graph.nodes.find(n => n.id === edge.source);
                            const targetNode = display.graph.nodes.find(n => n.id === edge.target);
                            
                            if (!sourceNode || !targetNode) return null;

                            return (
                                <Group key={edge.id}>
                                    <Line
                                        points={[sourceNode.x, sourceNode.y, targetNode.x, targetNode.y]}
                                        stroke="#4ade80"
                                        strokeWidth={3 / scale}
                                        opacity={0.6}
                                    />
                                    {/* Tension label at midpoint */}
                                    <Text
                                        x={(sourceNode.x + targetNode.x) / 2}
                                        y={(sourceNode.y + targetNode.y) / 2 - 15 / scale}
                                        text={edge.label}
                                        fontSize={12 / scale}
                                        fill="#4ade80"
                                        offsetX={20 / scale}
                                    />
                                </Group>
                            );
                        })}

                        {/* Draw components */}
                        {display.graph.nodes.map(node => {
                            let color = '#888';
                            
                            if (node.type === 'anchor') {
                                color = '#ef4444';
                            } else if (node.type === 'pulley') {
                                color = '#3b82f6';
                            } else if (node.type === 'person') {
                                color = '#f59e0b';
                            } else if (node.type === 'spring') {
                                color = '#8b5cf6';
                            }

                            return (
                                <Group key={node.id}>
                                    <Circle
                                        x={node.x}
                                        y={node.y}
                                        radius={10 / scale}
                                        fill={color}
                                        stroke="#fff"
                                        strokeWidth={2 / scale}
                                    />
                                    <Text
                                        x={node.x}
                                        y={node.y + 20 / scale}
                                        text={node.label}
                                        fontSize={12 / scale}
                                        fill="#fff"
                                        offsetX={node.label.length * 3 / scale}
                                    />
                                </Group>
                            );
                        })}

                        {/* Draw force vectors */}
                        {display.forces.map(force => {
                            const node = display.graph.nodes.find(n => n.id === force.componentId);
                            if (!node) return null;

                            // Scale force for visualization
                            const arrowLength = force.magnitude * forceScale;
                            const endX = node.x + Math.cos(force.angle) * arrowLength;
                            const endY = node.y + Math.sin(force.angle) * arrowLength;

                            return (
                                <Group key={`force-${force.componentId}`}>
                                    <Arrow
                                        points={[node.x, node.y, endX, endY]}
                                        stroke="#fbbf24"
                                        strokeWidth={3 / scale}
                                        fill="#fbbf24"
                                        pointerLength={10 / scale}
                                        pointerWidth={10 / scale}
                                    />
                                    <Text
                                        x={endX}
                                        y={endY - 20 / scale}
                                        text={force.magnitudeFormatted}
                                        fontSize={12 / scale}
                                        fill="#fbbf24"
                                        fontStyle="bold"
                                        offsetX={30 / scale}
                                    />
                                </Group>
                            );
                        })}

                        {/* Legend */}
                        <Group x={minX} y={minY}>
                            <Text text="Legend:" fontSize={14 / scale} fill="#fff" fontStyle="bold" />
                            
                            <Circle x={0} y={30 / scale} radius={6 / scale} fill="#ef4444" stroke="#fff" strokeWidth={1 / scale} />
                            <Text x={12 / scale} y={25 / scale} text="Anchor" fontSize={11 / scale} fill="#fff" />
                            
                            <Circle x={0} y={55 / scale} radius={6 / scale} fill="#3b82f6" stroke="#fff" strokeWidth={1 / scale} />
                            <Text x={12 / scale} y={50 / scale} text="Pulley" fontSize={11 / scale} fill="#fff" />
                            
                            <Circle x={0} y={80 / scale} radius={6 / scale} fill="#f59e0b" stroke="#fff" strokeWidth={1 / scale} />
                            <Text x={12 / scale} y={75 / scale} text="Person/Pull" fontSize={11 / scale} fill="#fff" />
                            
                            <Line points={[0, 100 / scale, 35 / scale, 100 / scale]} stroke="#4ade80" strokeWidth={2 / scale} />
                            <Text x={40 / scale} y={95 / scale} text="Rope Tension" fontSize={11 / scale} fill="#fff" />
                            
                            <Arrow 
                                points={[0, 120 / scale, 35 / scale, 120 / scale]} 
                                stroke="#fbbf24" 
                                strokeWidth={2 / scale} 
                                fill="#fbbf24" 
                                pointerLength={6 / scale} 
                                pointerWidth={6 / scale} 
                            />
                            <Text x={40 / scale} y={115 / scale} text="Force Vector" fontSize={11 / scale} fill="#fff" />
                        </Group>
                    </Layer>
                </Stage>
            </div>
        );
    } catch (error) {
        return (
            <div style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#0f172a',
                color: '#ef4444'
            }}>
                <p>Unable to generate force diagram</p>
                <p style={{ fontSize: '11px', color: '#888' }}>
                    {error instanceof Error ? error.message : 'Unknown error'}
                </p>
            </div>
        );
    }
};

export default ForceDiagramView;
