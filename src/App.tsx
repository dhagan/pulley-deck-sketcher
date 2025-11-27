import React, { useState } from 'react';
import { SystemState, ComponentType, PulleyComponent, AnchorComponent, CleatComponent, PersonComponent, RopeComponent } from './types';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import { saveSystem, loadSystem, exportMechanicalDrawing } from './utils/importExport';
import './App.css';

type ToolMode = 'select' | 'rope' | 'measure';

const App: React.FC = () => {
    const [system, setSystem] = useState<SystemState>({
        components: [],
        selectedId: null,
        gridSize: 20,
        snapToGrid: true,
    });

    const [toolMode, setToolMode] = useState<ToolMode>('select');
    const [ropeStart, setRopeStart] = useState<string | null>(null);
    const [measurementStart, setMeasurementStart] = useState<{ x: number; y: number } | null>(null);
    const [measurementEnd, setMeasurementEnd] = useState<{ x: number; y: number } | null>(null);

    const createComponentId = (type: string) => `${type}-${Date.now()}`;
    const defaultPosition = { x: 400, y: 300 };

    const handleAddPulley = () => {
        const id = createComponentId('pulley');
        const pulley: PulleyComponent = {
            id,
            type: ComponentType.PULLEY,
            position: defaultPosition,
            diameter: 60,
            sheaves: 1,
            hasBecket: false,
            rotation: 0,
            attachmentPoints: {
                top: { x: defaultPosition.x, y: defaultPosition.y - 40 },
                bottom: { x: defaultPosition.x, y: defaultPosition.y + 40 },
            },
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
                setRopeStart(pointId);
            } else {
                // Parse start and end IDs to get component IDs
                // Format: componentId-suffix (e.g., pulley-1-sheave-0-in)
                // We need to extract the base component ID for the rope definition
                // But for now, let's store the full point ID in startPoint/endPoint

                const getComponentId = (fullId: string) => {
                    // Simple heuristic: take the first two parts as ID if it starts with pulley/anchor
                    // This might need refinement based on ID generation strategy
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
                    routeThrough: [],
                };
                setSystem(prev => ({ ...prev, components: [...prev.components, rope] }));
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
                    routeThrough: [],
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

    return (
        <div className="app">
            <Toolbar
                onAddPulley={handleAddPulley}
                onAddAnchor={handleAddAnchor}
                onAddCleat={handleAddCleat}
                onAddPerson={handleAddPerson}
                onAddRope={handleAddRope}
                onMeasure={handleMeasureToggle}
                onSave={handleSave}
                onLoad={handleLoad}
                onLoadScenario={handleLoadScenario}
                onExportSVG={handleExport}
                toolMode={toolMode}
                ropeStart={ropeStart}
            />
            <div className="main-content">
                <Canvas
                    system={system}
                    setSystem={setSystem}
                    toolMode={toolMode}
                    onComponentClick={handleComponentClick}
                    onPointClick={handlePointClick}
                    measurementStart={measurementStart}
                    setMeasurementStart={setMeasurementStart}
                    measurementEnd={measurementEnd}
                    setMeasurementEnd={setMeasurementEnd}
                />
                <PropertiesPanel system={system} setSystem={setSystem} />
            </div>
        </div>
    );
};

export default App;
