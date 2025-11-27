import React, { useState, useEffect } from 'react';
import { SystemState, ComponentType, PulleyComponent, AnchorComponent, CleatComponent, PersonComponent, RopeComponent, SpringComponent } from './types';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import { saveSystem, loadSystem, exportMechanicalDrawing } from './utils/importExport';
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

    // Load first scenario on mount
    useEffect(() => {
        fetch('/scenarios/3-to-1.json')
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
        if (toolMode === 'rope') {
            if (!ropeStart) {
                // First click - validate it's a valid start point
                // Valid starts: Fixed Anchor (standalone), Becket (rope start), Spring, Person center, OUT points
                // NOT valid: Pulley Anchor (red - suspension point), IN points (blue)
                const isPulleyAnchor = pointId.includes('pulley') && pointId.includes('anchor');
                const isInPoint = pointId.includes('-in');
                const isFixedAnchor = pointId.includes('anchor-') && !pointId.includes('pulley');
                const isBecket = pointId.includes('becket');
                const isSpring = pointId.includes('spring');
                const isPersonCenter = pointId.includes('person') && pointId.endsWith('center');
                const isOutPoint = pointId.includes('-out');
                
                const isValidStart = (isFixedAnchor || isBecket || isSpring || isPersonCenter || isOutPoint) && !isPulleyAnchor && !isInPoint;
                
                if (!isValidStart) {
                    alert('Ropes can START at:\n✓ Fixed Anchor\n✓ Becket (orange)\n✓ OUT point (yellow)\n✓ Spring\n✓ Person center\n\n✗ NOT at Pulley center, Pulley Anchor (red) or IN point (blue)!');
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

    // Keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && system.selectedId) {
                handleDelete();
            } else if (e.key === 'Escape') {
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
    }, [system.selectedId, toolMode]);

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
                toolMode={toolMode}
                ropeStart={ropeStart}
                selectedId={system.selectedId}
                system={system}
            />
            <div className="main-content">
                <Canvas
                    system={system}
                    setSystem={setSystem}
                    toolMode={toolMode}
                    onComponentClick={handleComponentClick}
                    onPointClick={handlePointClick}
                    onPointHover={(pointId) => setHoveredPoint(pointId)}
                    measurementStart={measurementStart}
                    setMeasurementStart={setMeasurementStart}
                    measurementEnd={measurementEnd}
                    setMeasurementEnd={setMeasurementEnd}
                    onContextMenu={handleCanvasRightClick}
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
                <PropertiesPanel system={system} setSystem={setSystem} />
            </div>
            <div className="status-bar">
                <div className="status-info">
                    <div className="status-item">
                        <strong>Components:</strong> {system.components.length}
                    </div>
                    <div className="status-item">
                        <strong>Selected:</strong> {system.selectedId ? 
                            (() => {
                                const comp = system.components.find(c => c.id === system.selectedId);
                                if (!comp) return 'None';
                                const label = (comp as any).label || comp.id;
                                return `${comp.type} (${label})`;
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
