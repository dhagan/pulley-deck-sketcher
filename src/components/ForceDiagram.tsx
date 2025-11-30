import React from 'react';
import { Stage, Layer, Circle, Line, Text, Arrow, Group } from 'react-konva';
import { SystemState } from '../types';
import { PulleySolver } from '../solver';
import { formatResultsForDisplay, DisplayResults } from '../utils/display';

interface ForceDiagramProps {
    system: SystemState;
    loadForce: number;
}

const ForceDiagram: React.FC<ForceDiagramProps> = ({ system, loadForce }) => {
    if (system.components.length === 0) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                <p>Add components to see force diagram</p>
            </div>
        );
    }

    try {
        const solver = new PulleySolver(system as any);
        const result = solver.solve(loadForce);
        const display = formatResultsForDisplay(result, system as any, 'Force Diagram', loadForce);

        // Calculate bounds to fit all components
        const positions = system.components
            .filter(c => 'position' in c)
            .map(c => (c as any).position);
        
        if (positions.length === 0) return null;

        const minX = Math.min(...positions.map(p => p.x)) - 100;
        const maxX = Math.max(...positions.map(p => p.x)) + 100;
        const minY = Math.min(...positions.map(p => p.y)) - 100;
        const maxY = Math.max(...positions.map(p => p.y)) + 100;

        const width = maxX - minX;
        const height = maxY - minY;
        const scale = Math.min(600 / width, 400 / height, 1);

        // Scale factor for force arrows (make them visible but not overwhelming)
        const forceScale = 2;

        return (
            <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '10px' }}>
                <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                    Force Diagram
                </div>
                <Stage width={620} height={420} scaleX={scale} scaleY={scale} x={-minX * scale + 10} y={-minY * scale + 10}>
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
                                        strokeWidth={2}
                                        opacity={0.6}
                                    />
                                    {/* Tension label at midpoint */}
                                    <Text
                                        x={(sourceNode.x + targetNode.x) / 2}
                                        y={(sourceNode.y + targetNode.y) / 2 - 10}
                                        text={edge.label}
                                        fontSize={10}
                                        fill="#4ade80"
                                        offsetX={20}
                                    />
                                </Group>
                            );
                        })}

                        {/* Draw components */}
                        {display.graph.nodes.map(node => {
                            let color = '#888';
                            let shape = 'circle';
                            
                            if (node.type === 'anchor') {
                                color = '#ef4444';
                                shape = 'triangle';
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
                                        radius={8}
                                        fill={color}
                                        stroke="#fff"
                                        strokeWidth={1}
                                    />
                                    <Text
                                        x={node.x}
                                        y={node.y + 15}
                                        text={node.label}
                                        fontSize={10}
                                        fill="#fff"
                                        offsetX={node.label.length * 2.5}
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
                                        strokeWidth={2}
                                        fill="#fbbf24"
                                        pointerLength={8}
                                        pointerWidth={8}
                                    />
                                    <Text
                                        x={endX}
                                        y={endY - 15}
                                        text={force.magnitudeFormatted}
                                        fontSize={10}
                                        fill="#fbbf24"
                                        fontStyle="bold"
                                        offsetX={25}
                                    />
                                </Group>
                            );
                        })}

                        {/* Legend */}
                        <Group x={minX + 20} y={minY + 20}>
                            <Text text="Legend:" fontSize={12} fill="#fff" fontStyle="bold" />
                            
                            <Circle x={0} y={25} radius={5} fill="#ef4444" stroke="#fff" strokeWidth={1} />
                            <Text x={10} y={20} text="Anchor" fontSize={10} fill="#fff" />
                            
                            <Circle x={0} y={45} radius={5} fill="#3b82f6" stroke="#fff" strokeWidth={1} />
                            <Text x={10} y={40} text="Pulley" fontSize={10} fill="#fff" />
                            
                            <Circle x={0} y={65} radius={5} fill="#f59e0b" stroke="#fff" strokeWidth={1} />
                            <Text x={10} y={60} text="Person/Pull" fontSize={10} fill="#fff" />
                            
                            <Line points={[0, 80, 30, 80]} stroke="#4ade80" strokeWidth={2} />
                            <Text x={35} y={75} text="Rope Tension" fontSize={10} fill="#fff" />
                            
                            <Arrow points={[0, 95, 30, 95]} stroke="#fbbf24" strokeWidth={2} fill="#fbbf24" pointerLength={6} pointerWidth={6} />
                            <Text x={35} y={90} text="Force Vector" fontSize={10} fill="#fff" />
                        </Group>
                    </Layer>
                </Stage>
                
                <div style={{ marginTop: '10px', fontSize: '11px', color: '#aaa' }}>
                    <div>Pull Force: {display.summary.inputForce}</div>
                    <div>Load Force: {loadForce} N</div>
                    <div>MA: {display.summary.actualMA}</div>
                </div>
            </div>
        );
    } catch (error) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>
                <p>Unable to generate force diagram</p>
                <p style={{ fontSize: '11px' }}>{error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
        );
    }
};

export default ForceDiagram;
