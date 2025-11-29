import React, { useState, useEffect } from 'react';
import { SystemState, ComponentType, PulleyComponent, AnchorComponent, CleatComponent, PersonComponent, RopeComponent, SpringComponent } from './types';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import { saveSystem, loadSystem, exportMechanicalDrawing } from './utils/importExport';
import { calculatePathLength } from './utils/geometry';
import { calculateMechanicalAdvantage } from './utils/mechanicalAdvantage';
import './App.css';

type ToolMode = 'select' | 'rope' | 'spring' | 'measure';

const App: React.FC = () => {
    const [system, setSystem] = useState<SystemState>({
        components: [],
        selectedId: null,
        gridSize: 20,
        snapToGrid: true,
        showRopeArrows: true,
    });
    
    // Undo/Redo history
    const [history, setHistory] = useState<SystemState[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    
    // Track system changes for undo/redo
    useEffect(() => {
        // Only add to history if there are actual components or selection changes
        if (system.components.length > 0 || system.selectedId !== null) {
            const currentState = JSON.stringify(system);
            const lastState = historyIndex >= 0 ? JSON.stringify(history[historyIndex]) : null;
            
            // Only add if state has actually changed
            if (currentState !== lastState) {
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(JSON.parse(JSON.stringify(system)));
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
            }
        }
    }, [system.components, system.selectedId]);

    // Load first scenario on mount
    useEffect(() => {
        fetch('/pulley-cad/scenarios/3-to-1.json')
            .then(res => res.json())
            .then(data => setSystem(data))
            .catch(err => console.error('Failed to load default scenario:', err));
    }, []);

    const [toolMode, setToolMode] = useState<ToolMode>('select');
    const [ropeStart, setRopeStart] = useState<string | null>(null);
    const [measurementStart, setMeasurementStart] = useState<{ x: number; y: number } | null>(null);
    const [measurementEnd, setMeasurementEnd] = useState<{ x: number; y: number } | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
    const [showMeasurements, setShowMeasurements] = useState<boolean>(true);
    const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
    const [showPropertiesPanel, setShowPropertiesPanel] = useState<boolean>(true);
    const [showSolverPanel, setShowSolverPanel] = useState<boolean>(true);

    const createComponentId = (type: string) => `${type}-${Date.now()}`;
    const defaultPosition = { x: 400, y: 300 };

    const handleAddPulley = () => {
        const id = createComponentId('pulley');
        const pulley: PulleyComponent = {
            id,
            type: ComponentType.PULLEY,
            position: defaultPosition,
            diameter: 30,
            sheaves: 1,
            hasBecket: false,
            rotation: 0,
        };
        setSystem(prev => ({ ...prev, components: [...prev.components, pulley] }));
    };

    const handleAddDoubleBlock = () => {
        const id = createComponentId('pulley');
        const pulley: PulleyComponent = {
            id,
            type: ComponentType.PULLEY,
            position: defaultPosition,
            diameter: 30,
            sheaves: 2,
            hasBecket: false,
            rotation: 0,
        };
        setSystem(prev => ({ ...prev, components: [...prev.components, pulley] }));
    };

    const handleAddTripleBlock = () => {
        const id = createComponentId('pulley');
        const pulley: PulleyComponent = {
            id,
            type: ComponentType.PULLEY,
            position: defaultPosition,
            diameter: 30,
            sheaves: 3,
            hasBecket: false,
            rotation: 0,
        };
        setSystem(prev => ({ ...prev, components: [...prev.components, pulley] }));
    };

    const handleAddAnchor = () => {
        const id = createComponentId('anchor');
        const anchor: AnchorComponent = {
            id,
            type: ComponentType.ANCHOR,
            position: defaultPosition,
            label: `A${system.components.filter(c => c.type === ComponentType.ANCHOR).length + 1}`,
        };
        setSystem(prev => ({ ...prev, components: [...prev.components, anchor] }));
    };

    const handleAddCleat = () => {
        const id = createComponentId('cleat');
        const cleat: CleatComponent = {
            id,
            type: ComponentType.CLEAT,
            position: defaultPosition,
            label: `Cleat ${system.components.filter(c => c.type === ComponentType.CLEAT).length + 1}`,
        };
        setSystem(prev => ({ ...prev, components: [...prev.components, cleat] }));
    };

    const handleAddPerson = () => {
        const id = createComponentId('person');
        const person: PersonComponent = {
            id,
            type: ComponentType.PERSON,
            position: defaultPosition,
            label: 'Person',
            pulling: false,
        };
        setSystem(prev => ({ ...prev, components: [...prev.components, person] }));
    };

    const handleAddSpring = () => {
        // Springs need to be created like ropes - set tool mode
        setToolMode('spring');
        setRopeStart(null); // Reuse rope drawing infrastructure
    };

    const handleAddRope = () => {
        setToolMode('rope');
        setRopeStart(null);
    };

    const handleMeasureToggle = () => {
        if (toolMode === 'measure') {
            setToolMode('select');
            setMeasurementStart(null);
            setMeasurementEnd(null);
        } else {
            setToolMode('measure');
            setMeasurementStart(null);
            setMeasurementEnd(null);
        }
    };

    const handlePointClick = (pointId: string) => {
        // Extract component ID from pointId (e.g., "pulley-1-anchor" -> "pulley-1")
        const componentId = pointId.split('-sheave')[0].split('-becket')[0].split('-anchor')[0].split('-center')[0];
        
        // Set both the component and the specific point
        setSystem((prev) => ({ ...prev, selectedId: componentId }));
        setSelectedPoint(pointId);
        
        if (toolMode === 'rope') {
            if (!ropeStart) {
                // First click - validate it's a valid start point
                // Valid starts: Fixed Anchor, Pulley Anchor, Becket, Spring, Person center, OUT points
                // NOT valid: Pulley center, IN points (blue)
                const isPulleyCenter = pointId.includes('pulley') && pointId.endsWith('center');
                const isInPoint = pointId.includes('-in');
                const isFixedAnchor = pointId.includes('anchor-') && !pointId.includes('pulley');
                const isPulleyAnchor = pointId.includes('pulley') && pointId.includes('anchor');
                const isBecket = pointId.includes('becket');
                const isSpring = pointId.includes('spring');
                const isPersonCenter = pointId.includes('person') && pointId.endsWith('center');
                const isOutPoint = pointId.includes('-out');
                
                const isValidStart = (isFixedAnchor || isPulleyAnchor || isBecket || isSpring || isPersonCenter || isOutPoint) && !isPulleyCenter && !isInPoint;
                
                if (!isValidStart) {
                    alert('Ropes can START at:\n✓ Fixed Anchor\n✓ Pulley Anchor (red)\n✓ Becket (orange)\n✓ OUT point (yellow)\n✓ Spring\n✓ Person center\n\n✗ NOT at Pulley center or IN point (blue)!');
                    return;
                }
                
                // Extra validation: becket cannot be used if it's the same component we're routing through
                if (pointId.includes('becket')) {
                    console.log('Starting rope from becket:', pointId);
                }
                
                setRopeStart(pointId);
            } else {
                // Second click - validate it's a valid end point
                const isPulleyCenter = !pointId.includes('anchor') && 
                                      !pointId.includes('becket') && 
                                      !pointId.includes('in') && 
                                      !pointId.includes('out') &&
                                      !pointId.includes('person') &&
                                      !pointId.includes('spring') &&
                                      pointId.endsWith('center');
                
                if (isPulleyCenter) {
                    alert('ERROR: Ropes cannot connect to pulley center!\n\nMust end at:\n✓ IN point (blue)\n✓ OUT point (yellow)\n✓ Anchor/Spring\n✓ Person center');
                    setRopeStart(null);
                    return;
                }
                
                const isValidEnd = pointId.includes('in') || 
                                  pointId.includes('out') || 
                                  pointId.includes('anchor') ||
                                  pointId.includes('load') ||
                                  pointId.includes('spring') ||
                                  (pointId.includes('person') && pointId.endsWith('center'));
                
                if (!isValidEnd) {
                    alert('Ropes must end at a sheave In/Out point, Anchor, Load, Spring, or Person center\n\n✗ NOT at Pulley center!');
                    setRopeStart(null);
                    return;
                }

                // Validate proper flow direction
                if (ropeStart.includes('-out') && pointId.includes('-out')) {
                    alert('Cannot connect Out to Out. Route should go: Start → In → Out → In → Out...');
                    setRopeStart(null);
                    return;
                }
                if (ropeStart.includes('-in') && pointId.includes('-in')) {
                    alert('Cannot connect In to In. Route should go: Out → In or Start → In');
                    setRopeStart(null);
                    return;
                }
                
                // Validate IN->OUT flow (In must connect to Out, Out must connect to In)
                // Start points (anchor/becket/load/spring) should connect to IN
                const isStartPoint = ropeStart.includes('anchor') || ropeStart.includes('becket') || 
                                    ropeStart.includes('load') || ropeStart.includes('spring') || 
                                    ropeStart.endsWith('center');
                
                if (isStartPoint && pointId.includes('-out')) {
                    alert('Start points must connect to an IN point first (not directly to OUT)');
                    setRopeStart(null);
                    return;
                }
                
                if (ropeStart.includes('-in') && !pointId.includes('-out') && !pointId.includes('anchor') && !pointId.includes('load') && !pointId.includes('spring') && !pointId.endsWith('center')) {
                    alert('After an IN point, rope must go to an OUT point (or end at Anchor/Load/Spring)');
                    setRopeStart(null);
                    return;
                }
                if (ropeStart.includes('-out') && !pointId.includes('-in')) {
                    alert('After an OUT point, rope must go to an IN point');
                    setRopeStart(null);
                    return;
                }

                // Parse start and end IDs to get component IDs
                const getComponentId = (fullId: string) => {
                    const parts = fullId.split('-');
                    return `${parts[0]}-${parts[1]}`;
                };

                const startCompId = getComponentId(ropeStart);
                const endCompId = getComponentId(pointId);

                // Create rope
                const rope: RopeComponent = {
                    id: `rope-${Date.now()}`,
                    type: ComponentType.ROPE,
                    startId: startCompId,
                    startPoint: ropeStart,
                    endId: endCompId,
                    endPoint: pointId,
                    label: `Rope ${system.components.filter(c => c.type === ComponentType.ROPE).length + 1}`,
                };
                setSystem(prev => ({ ...prev, components: [...prev.components, rope] }));
                setRopeStart(null);
                setToolMode('select');
            }
        } else if (toolMode === 'spring') {
            if (!ropeStart) {
                // First click - spring start point (usually pulley anchor)
                setRopeStart(pointId);
            } else {
                // Second click - spring end point (load point)
                const getComponentId = (fullId: string) => {
                    const parts = fullId.split('-');
                    return `${parts[0]}-${parts[1]}`;
                };

                const startCompId = getComponentId(ropeStart);
                const endCompId = getComponentId(pointId);

                const spring: SpringComponent = {
                    id: `spring-${Date.now()}`,
                    type: ComponentType.SPRING,
                    startId: startCompId,
                    startPoint: ropeStart,
                    endId: endCompId,
                    endPoint: pointId,
                    label: `Load ${system.components.filter(c => c.type === ComponentType.SPRING).length + 1}`,
                    stiffness: 1.0, // N/mm
                    restLength: 100, // mm
                };
                setSystem(prev => ({ ...prev, components: [...prev.components, spring] }));
                setRopeStart(null);
                setToolMode('select');
            }
        }
    };

    const handleComponentClick = (id: string) => {
        // Fallback for components without specific points (like simple anchors/cleats for now)
        // or if clicking the body instead of a point
        if (toolMode === 'rope') {
            if (!ropeStart) {
                setRopeStart(id);
            } else {
                const rope: RopeComponent = {
                    id: `rope-${Date.now()}`,
                    type: ComponentType.ROPE,
                    startId: ropeStart,
                    startPoint: 'center', // Default
                    endId: id,
                    endPoint: 'center', // Default
                };
                setSystem(prev => ({ ...prev, components: [...prev.components, rope] }));
                setRopeStart(null);
                setToolMode('select');
            }
        } else {
            setSystem(prev => ({ ...prev, selectedId: id }));
        }
    };

    const handleSave = () => {
        saveSystem(system);
    };

    const handleLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const loaded = await loadSystem(file);
            if (loaded) {
                setSystem(loaded);
            }
        }
    };

    const handleLoadScenario = (newSystem: SystemState) => {
        setSystem(newSystem);
    };

    const handleExport = () => {
        exportMechanicalDrawing(system);
    };

    const handleClear = () => {
        if (window.confirm('Clear all components? This cannot be undone.')) {
            setSystem({
                components: [],
                selectedId: null,
                gridSize: 20,
                snapToGrid: true,
                showRopeArrows: true,
            });
            setToolMode('select');
            setRopeStart(null);
            setMeasurementStart(null);
            setMeasurementEnd(null);
        }
    };

    const handleDelete = () => {
        if (system.selectedId) {
            setSystem(prev => ({
                ...prev,
                components: prev.components.filter(c => c.id !== system.selectedId),
                selectedId: null,
            }));
        }
    };
    
    // Undo/Redo functionality (now automatic via useEffect)

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && system.selectedId) {
                handleDelete();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (historyIndex > 0) {
                    setHistoryIndex(historyIndex - 1);
                    setSystem(history[historyIndex - 1]);
                }
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
                e.preventDefault();
                if (historyIndex < history.length - 1) {
                    setHistoryIndex(historyIndex + 1);
                    setSystem(history[historyIndex + 1]);
                }
            }
            if (e.key === 'Escape') {
                if (toolMode === 'rope') {
                    setToolMode('select');
                    setRopeStart(null);
                } else if (toolMode === 'measure') {
                    setToolMode('select');
                    setMeasurementStart(null);
                    setMeasurementEnd(null);
                } else if (system.selectedId) {
                    setSystem(prev => ({ ...prev, selectedId: null }));
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [system.selectedId, toolMode, history, historyIndex]);

    const handleCanvasRightClick = (e: any) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        setContextMenu(pos);
    };

    const handleContextMenuClose = () => {
        setContextMenu(null);
    };

    return (
        <div className="app" onClick={handleContextMenuClose}>
            <Toolbar
                onAddPulley={handleAddPulley}
                onAddDoubleBlock={handleAddDoubleBlock}
                onAddTripleBlock={handleAddTripleBlock}
                onAddAnchor={handleAddAnchor}
                onAddCleat={handleAddCleat}
                onAddPerson={handleAddPerson}
                onAddSpring={handleAddSpring}
                onAddRope={handleAddRope}
                onMeasure={handleMeasureToggle}
                onSave={handleSave}
                onLoad={handleLoad}
                onLoadScenario={handleLoadScenario}
                onExportSVG={handleExport}
                onClear={handleClear}
                onDelete={handleDelete}
                toolMode={toolMode as 'select' | 'rope' | 'spring' | 'measure'}
                ropeStart={ropeStart}
                selectedId={system.selectedId}
                system={system}
                showMeasurements={showMeasurements}
                onToggleMeasurements={() => setShowMeasurements(!showMeasurements)}
            />
            <div className="main-content">
                <Canvas
                    system={system}
                    setSystem={setSystem}
                    toolMode={toolMode as 'select' | 'rope' | 'spring' | 'measure'}
                    onComponentClick={handleComponentClick}
                    onPointClick={handlePointClick}
                    onPointHover={(pointId) => setHoveredPoint(pointId)}
                    measurementStart={measurementStart}
                    setMeasurementStart={setMeasurementStart}
                    measurementEnd={measurementEnd}
                    setMeasurementEnd={setMeasurementEnd}
                    onContextMenu={handleCanvasRightClick}
                    showMeasurements={showMeasurements}
                />
                {contextMenu && (
                    <div
                        className="context-menu"
                        style={{
                            position: 'absolute',
                            left: contextMenu.x,
                            top: contextMenu.y,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="context-menu-item" onClick={() => { handleAddPulley(); handleContextMenuClose(); }}>◉ Add Pulley</button>
                        <button className="context-menu-item" onClick={() => { handleAddAnchor(); handleContextMenuClose(); }}>▲ Add Anchor</button>
                        <button className="context-menu-item" onClick={() => { handleAddCleat(); handleContextMenuClose(); }}>⊥ Add Cleat</button>
                        <button className="context-menu-item" onClick={() => { handleAddPerson(); handleContextMenuClose(); }}>● Add Person</button>
                        <button className="context-menu-item" onClick={() => { handleAddSpring(); handleContextMenuClose(); }}>⋈ Add Spring</button>
                    </div>
                )}
                {showPropertiesPanel && <PropertiesPanel system={system} setSystem={setSystem} onCollapse={() => setShowPropertiesPanel(false)} />}
                {showSolverPanel && (
                    <div className="solver-panel">
                        <div className="panel-header">
                            <h3>Solver</h3>
                            <button 
                                className="panel-toggle"
                                onClick={() => setShowSolverPanel(false)}
                                title="Hide Solver Panel"
                            >
                                →
                            </button>
                        </div>
                        <div className="solver-content">
                            <div className="solver-section">
                                <h4>Mechanical Analysis</h4>
                                <div className="solver-stat">
                                    <span>Theoretical MA:</span>
                                    <span>{(() => {
                                        const ma = calculateMechanicalAdvantage(system);
                                        return ma ? `${ma.theoreticalMA}:1` : 'N/A';
                                    })()}</span>
                                </div>
                                <div className="solver-stat">
                                    <span>Actual MA:</span>
                                    <span>{(() => {
                                        const ma = calculateMechanicalAdvantage(system);
                                        return ma ? `${ma.actualMA.toFixed(2)}:1` : 'N/A';
                                    })()}</span>
                                </div>
                                <div className="solver-stat">
                                    <span>Efficiency:</span>
                                    <span>{(() => {
                                        const ma = calculateMechanicalAdvantage(system);
                                        return ma ? `${(ma.efficiency * 100).toFixed(1)}%` : 'N/A';
                                    })()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {!showPropertiesPanel && (
                <button 
                    className="panel-toggle-show"
                    style={{ right: showSolverPanel ? '260px' : '8px' }}
                    onClick={() => setShowPropertiesPanel(true)}
                    title="Show Properties Panel"
                >
                    ←
                </button>
            )}
            {!showSolverPanel && (
                <button 
                    className="panel-toggle-show"
                    style={{ right: '8px' }}
                    onClick={() => setShowSolverPanel(true)}
                    title="Show Solver Panel"
                >
                    ←
                </button>
            )}
            <div className="status-bar">
                <div className="status-info">
                    <div className="status-item">
                        <strong>Components:</strong> {system.components.length}
                    </div>
                    <div className="status-item">
                        <strong>MA:</strong> {(() => {
                            const maResult = calculateMechanicalAdvantage(system);
                            if (!maResult) return 'N/A';
                            return `${maResult.theoreticalMA}:1 (actual: ${maResult.actualMA.toFixed(2)}:1)`;
                        })()}
                    </div>
                    <div className="status-item">
                        <strong>Total Rope:</strong> {(() => {
                            const ropes = system.components.filter(c => c.type === ComponentType.ROPE) as RopeComponent[];
                            const totalLength = ropes.reduce((sum, rope) => {
                                const startComp = system.components.find(c => c.id === rope.startId);
                                const endComp = system.components.find(c => c.id === rope.endId);
                                if (!startComp || !endComp) return sum;
                                
                                // Calculate rope length (simplified - would need full path calculation)
                                const getPos = (comp: Component, point?: string) => {
                                    if (comp.type === ComponentType.ROPE || comp.type === ComponentType.SPRING) return { x: 0, y: 0 };
                                    return (comp as any).position;
                                };
                                
                                const start = getPos(startComp, rope.startPoint);
                                const end = getPos(endComp, rope.endPoint);
                                const dx = end.x - start.x;
                                const dy = end.y - start.y;
                                return sum + Math.sqrt(dx * dx + dy * dy);
                            }, 0);
                            return `${Math.round(totalLength)}px`;
                        })()}
                    </div>
                    <div className="status-item">
                        <strong>Selected:</strong> {system.selectedId ? 
                            (() => {
                                const comp = system.components.find(c => c.id === system.selectedId);
                                if (!comp) return 'None';
                                
                                // If a specific point is selected, show it
                                if (selectedPoint && selectedPoint.startsWith(system.selectedId)) {
                                    const formatPointForDisplay = (pointId: string) => {
                                        if (pointId.includes('anchor')) return 'anchor';
                                        if (pointId.includes('becket')) return 'becket';
                                        if (pointId.includes('sheave')) {
                                            const match = pointId.match(/sheave-(\d+)-(in|out)/);
                                            if (match) return `sheave-${match[1]}-${match[2]}`;
                                        }
                                        if (pointId.includes('center')) return 'center';
                                        return pointId;
                                    };
                                    
                                    if (comp.type === ComponentType.PULLEY) {
                                        const pulley = comp as PulleyComponent;
                                        const idNum = comp.id.split('-')[1];
                                        const point = formatPointForDisplay(selectedPoint);
                                        return `Pulley #${idNum} [${point}]`;
                                    }
                                    
                                    const label = (comp as any).label || comp.type;
                                    const point = formatPointForDisplay(selectedPoint);
                                    return `${label} [${point}]`;
                                }
                                
                                if (comp.type === ComponentType.ROPE) {
                                    const rope = comp as RopeComponent;
                                    const formatPoint = (pointId: string | undefined) => {
                                        if (!pointId) return '';
                                        const parts = pointId.split('-');
                                        if (pointId.includes('becket')) return 'becket';
                                        if (pointId.includes('anchor')) return 'anchor';
                                        if (pointId.includes('sheave')) {
                                            const idx = parts[parts.indexOf('sheave') + 1];
                                            const type = parts[parts.length - 1];
                                            return `sheave-${idx}-${type}`;
                                        }
                                        return pointId;
                                    };
                                    
                                    // Calculate rope length with wraps
                                    const startComp = system.components.find(c => c.id === rope.startId);
                                    const endComp = system.components.find(c => c.id === rope.endId);
                                    
                                    if (!startComp || !endComp) return 'Rope (invalid)';
                                    
                                    const getPos = (comp: any, point?: string) => {
                                        if (comp.type === ComponentType.ROPE || comp.type === ComponentType.SPRING) return { x: 0, y: 0 };
                                        return comp.position;
                                    };
                                    
                                    const startPos = getPos(startComp, rope.startPoint);
                                    const endPos = getPos(endComp, rope.endPoint);
                                    let path = [startPos];
                                    
                                    // Check for wraps
                                    const startPulleyId = rope.startPoint?.split('-sheave')[0];
                                    const endPulleyId = rope.endPoint?.split('-sheave')[0];
                                    const wrapsAroundPulley = startPulleyId === endPulleyId && startComp.type === 'pulley' &&
                                        ((rope.startPoint?.includes('-in') && rope.endPoint?.includes('-out')) ||
                                         (rope.startPoint?.includes('-out') && rope.endPoint?.includes('-in')));
                                    
                                    if (wrapsAroundPulley) {
                                        const pulley = startComp as PulleyComponent;
                                        const radius = pulley.diameter / 2;
                                        const center = pulley.position;
                                        const numArcPoints = 12;
                                        
                                        for (let i = 1; i < numArcPoints; i++) {
                                            const t = i / numArcPoints;
                                            const angle = rope.startPoint?.includes('-in') ? 
                                                Math.PI - t * Math.PI : t * Math.PI;
                                            path.push({
                                                x: center.x + radius * Math.cos(angle),
                                                y: center.y + radius * Math.sin(angle)
                                            });
                                        }
                                    }
                                    
                                    path.push(endPos);
                                    const ropeLength = Math.round(calculatePathLength(path));
                                    
                                    const startLabel = (startComp as any)?.label || rope.startId;
                                    const endLabel = (endComp as any)?.label || rope.endId;
                                    const startPt = formatPoint(rope.startPoint);
                                    const endPt = formatPoint(rope.endPoint);
                                    return `Rope: ${startLabel}[${startPt}] → ${endLabel}[${endPt}] (${ropeLength}px)${rope.chainId ? ` chain: ${rope.chainId}` : ''}`;
                                }
                                
                                // For other components, show friendly label
                                const label = (comp as any).label;
                                if (label) {
                                    return `${comp.type}: ${label}`;
                                }
                                // For pulleys without custom labels, show type and number from ID
                                if (comp.type === ComponentType.PULLEY) {
                                    const pulley = comp as PulleyComponent;
                                    const idNum = comp.id.split('-')[1];
                                    return `Pulley #${idNum} (${pulley.sheaves} sheave${pulley.sheaves > 1 ? 's' : ''}${pulley.hasBecket ? ', becket' : ''})`;
                                }
                                return comp.type;
                                // For other components with labels
                                if (label) {
                                    return `${comp.type}: ${label}`;
                                }
                                return comp.type;
                            })() : 'None'}
                    </div>
                    <div className="status-item">
                        <strong>Mode:</strong> {toolMode === 'rope' ? 'Rope Drawing' : toolMode === 'spring' ? 'Spring Drawing' : toolMode === 'measure' ? 'Measuring' : 'Select'}
                    </div>
                    {(toolMode === 'rope' || toolMode === 'spring') && ropeStart && (
                        <div className="status-item" style={{ color: '#4ade80', fontWeight: 'bold' }}>
                            <strong>Rope Start:</strong> {(() => {
                                const comp = system.components.find(c => ropeStart.startsWith(c.id));
                                if (!comp) return ropeStart;
                                const label = (comp as any).label || comp.type;
                                const point = ropeStart.includes('becket') ? 'becket' : 
                                             ropeStart.includes('anchor') ? 'anchor' :
                                             ropeStart.includes('-in') ? 'IN' :
                                             ropeStart.includes('-out') ? 'OUT' :
                                             ropeStart.includes('center') ? 'center' : 'point';
                                return `${label} (${point})`;
                            })()} → Click end point
                        </div>
                    )}
                    {(toolMode === 'rope' || toolMode === 'spring') && hoveredPoint && (
                        <div className="status-item" style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                            <strong>Hover:</strong> {(() => {
                                const comp = system.components.find(c => hoveredPoint.startsWith(c.id));
                                if (!comp) return hoveredPoint;
                                const label = (comp as any).label || comp.type;
                                const point = hoveredPoint.includes('becket') ? 'becket' :
                                             hoveredPoint.includes('anchor') ? 'anchor' :
                                             hoveredPoint.includes('-in') ? 'IN' :
                                             hoveredPoint.includes('-out') ? 'OUT' :
                                             hoveredPoint.includes('center') ? 'center' : 'point';
                                return `${label} (${point})`;
                            })()}
                        </div>
                    )}
                </div>
                <div className="status-info">
                    <div className="status-item">
                        Shortcuts: <strong>Del</strong> to delete, <strong>Esc</strong> to deselect/cancel
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
