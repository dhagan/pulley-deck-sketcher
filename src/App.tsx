import React, { useState } from 'react';
import { SystemState, ComponentType, PulleyComponent, AnchorComponent, CleatComponent, PersonComponent, RopeComponent } from './types';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import { saveSystem, loadSystem, exportMechanicalDrawing } from './utils/importExport';
import './App.css';

type ToolMode = 'select' | 'rope';

const App: React.FC = () => {
    const [system, setSystem] = useState<SystemState>({
        components: [],
        selectedId: null,
        gridSize: 20,
        snapToGrid: true,
    });

    const [toolMode, setToolMode] = useState<ToolMode>('select');
    const [ropeStart, setRopeStart] = useState<string | null>(null);

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

    const handleComponentClick = (id: string) => {
        if (toolMode === 'rope') {
            if (!ropeStart) {
                setRopeStart(id);
            } else {
                // Create rope
                const rope: RopeComponent = {
                    id: `rope-${Date.now()}`,
                    type: ComponentType.ROPE,
                    startId: ropeStart,
                    endId: id,
                    routeThrough: [],
                };
                setSystem(prev => ({ ...prev, components: [...prev.components, rope] }));
                setRopeStart(null);
                setToolMode('select');
            }
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
                />
                <PropertiesPanel system={system} setSystem={setSystem} />
            </div>
        </div>
    );
};

export default App;
