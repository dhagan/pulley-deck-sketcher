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

    const addComponent = (type: ComponentType) => {
        if (type === ComponentType.ROPE) {
            setToolMode('rope');
            setRopeStart(null);
            return;
        }

        const id = `${type}-${Date.now()}`;
        const position = { x: 400, y: 300 };

        if (type === ComponentType.PULLEY) {
            const pulley: PulleyComponent = {
                id,
                type: ComponentType.PULLEY,
                position,
                diameter: 60,
                sheaves: 1,
                hasBecket: false,
                attachmentPoints: {
                    top: { x: position.x, y: position.y - 40 },
                    bottom: { x: position.x, y: position.y + 40 },
                },
            };
            setSystem(prev => ({ ...prev, components: [...prev.components, pulley] }));
        } else if (type === ComponentType.ANCHOR) {
            const anchor: AnchorComponent = {
                id,
                type: ComponentType.ANCHOR,
                position,
                label: `A${system.components.filter(c => c.type === ComponentType.ANCHOR).length + 1}`,
            };
            setSystem(prev => ({ ...prev, components: [...prev.components, anchor] }));
        } else if (type === ComponentType.CLEAT) {
            const cleat: CleatComponent = {
                id,
                type: ComponentType.CLEAT,
                position,
                label: `Cleat ${system.components.filter(c => c.type === ComponentType.CLEAT).length + 1}`,
            };
            setSystem(prev => ({ ...prev, components: [...prev.components, cleat] }));
        } else if (type === ComponentType.PERSON) {
            const person: PersonComponent = {
                id,
                type: ComponentType.PERSON,
                position,
                label: 'Person',
                pulling: false,
            };
            setSystem(prev => ({ ...prev, components: [...prev.components, person] }));
        }
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

    const handleLoad = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const loaded = await loadSystem(file);
                if (loaded) {
                    setSystem(loaded);
                }
            }
        };
        input.click();
    };

    const handleExport = () => {
        exportMechanicalDrawing(system);
    };

    return (
        <div className="app">
            <Toolbar
                onAddComponent={addComponent}
                onSave={handleSave}
                onLoad={handleLoad}
                onExport={handleExport}
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
