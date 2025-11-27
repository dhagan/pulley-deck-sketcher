import React from 'react';
import { SystemState, PulleyComponent, SpringComponent, RopeComponent, ComponentType, Component } from '../types';

interface PropertiesPanelProps {
    system: SystemState;
    setSystem: React.Dispatch<React.SetStateAction<SystemState>>;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ system, setSystem }) => {
    const selectedComponent = system.components.find(c => c.id === system.selectedId);

    const updateComponent = (updates: any) => {
        setSystem(prev => ({
            ...prev,
            components: prev.components.map(c =>
                c.id === system.selectedId ? { ...c, ...updates } as Component : c
            )
        }));
    };

    const renderPulleyProperties = (pulley: PulleyComponent) => (
        <>
            <div className="property-row">
                <span className="property-label">Diameter (mm):</span>
                <input
                    type="number"
                    value={pulley.diameter}
                    onChange={(e) => updateComponent({ diameter: parseInt(e.target.value) || 60 })}
                    min="20"
                    max="200"
                />
            </div>
            <div className="property-row">
                <span className="property-label">Sheaves:</span>
                <select
                    value={pulley.sheaves}
                    onChange={(e) => updateComponent({ sheaves: parseInt(e.target.value) as 1 | 2 | 3 })}
                    style={{
                        background: '#3d3d3d',
                        border: '1px solid #4d4d4d',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        color: '#fff',
                        fontSize: '13px',
                    }}
                >
                    <option value="1">Single (1)</option>
                    <option value="2">Double (2)</option>
                    <option value="3">Triple (3)</option>
                </select>
            </div>
            <div className="property-row">
                <span className="property-label">Becket:</span>
                <input
                    type="checkbox"
                    checked={pulley.hasBecket}
                    onChange={(e) => updateComponent({ hasBecket: e.target.checked })}
                />
            </div>
            <div className="property-row">
                <span className="property-label">Rotation (°):</span>
                <input
                    type="number"
                    value={pulley.rotation || 0}
                    onChange={(e) => updateComponent({ rotation: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="360"
                />
            </div>
        </>
    );

    const renderSpringProperties = (spring: SpringComponent) => (
        <>
            <div className="property-row">
                <span className="property-label">Stiffness (N/m):</span>
                <input
                    type="number"
                    value={spring.stiffness}
                    onChange={(e) => updateComponent({ stiffness: parseFloat(e.target.value) || 100 })}
                    min="1"
                    max="10000"
                />
            </div>
            <div className="property-row">
                <span className="property-label">Rest Length (px):</span>
                <input
                    type="number"
                    value={spring.restLength}
                    onChange={(e) => updateComponent({ restLength: parseFloat(e.target.value) || 100 })}
                    min="10"
                    max="500"
                />
            </div>
        </>
    );

    const renderRopeProperties = (rope: RopeComponent) => (
        <>
            <div className="property-row">
                <span className="property-label">Label:</span>
                <input
                    type="text"
                    value={rope.label || ''}
                    onChange={(e) => updateComponent({ label: e.target.value })}
                    placeholder="Rope name"
                />
            </div>
            <div className="property-row">
                <span className="property-label">Start:</span>
                <span className="property-value">{rope.startId}</span>
            </div>
            <div className="property-row">
                <span className="property-label">End:</span>
                <span className="property-value">{rope.endId}</span>
            </div>
        </>
    );

    return (
        <div className="properties-panel">
            <h2 style={{ marginBottom: '20px', fontSize: '16px' }}>Properties</h2>

            <div className="property-group">
                <h3>Grid Settings</h3>
                <div className="property-row">
                    <span className="property-label">Grid Size:</span>
                    <input
                        type="number"
                        value={system.gridSize}
                        onChange={(e) => setSystem({ ...system, gridSize: parseInt(e.target.value) })}
                        min="5"
                        max="100"
                    />
                </div>
                <div className="property-row">
                    <span className="property-label">Snap to Grid:</span>
                    <input
                        type="checkbox"
                        checked={system.snapToGrid}
                        onChange={(e) => setSystem({ ...system, snapToGrid: e.target.checked })}
                    />
                </div>
                <div className="property-row">
                    <span className="property-label">Rope Arrows:</span>
                    <input
                        type="checkbox"
                        checked={system.showRopeArrows !== false}
                        onChange={(e) => setSystem({ ...system, showRopeArrows: e.target.checked })}
                    />
                </div>
            </div>

            {selectedComponent && (
                <div className="property-group">
                    <h3>Selected: {selectedComponent.type}</h3>
                    <div className="property-row">
                        <span className="property-label">ID:</span>
                        <span className="property-value">{selectedComponent.id}</span>
                    </div>

                    {selectedComponent.type === ComponentType.PULLEY && renderPulleyProperties(selectedComponent as PulleyComponent)}

                    {selectedComponent.type === ComponentType.ROPE && renderRopeProperties(selectedComponent as RopeComponent)}

                    {selectedComponent.type === ComponentType.SPRING && renderSpringProperties(selectedComponent as SpringComponent)}

                    {(selectedComponent.type === ComponentType.ANCHOR ||
                        selectedComponent.type === ComponentType.CLEAT ||
                        selectedComponent.type === ComponentType.PERSON) &&
                        'label' in selectedComponent && (
                            <div className="property-row">
                                <span className="property-label">Label:</span>
                                <input
                                    type="text"
                                    value={selectedComponent.label || ''}
                                    onChange={(e) => updateComponent({ label: e.target.value })}
                                />
                            </div>
                        )}

                    {selectedComponent.type === ComponentType.SPRING && 'label' in selectedComponent && (
                        <div className="property-row">
                            <span className="property-label">Label:</span>
                            <input
                                type="text"
                                value={selectedComponent.label || ''}
                                onChange={(e) => updateComponent({ label: e.target.value })}
                            />
                        </div>
                    )}
                </div>
            )}

            {!selectedComponent && (
                <div style={{ color: '#888', fontSize: '13px', marginTop: '20px' }}>
                    No component selected
                </div>
            )}

            <div className="property-group">
                <h3>Measurements</h3>
                <div style={{ color: '#888', fontSize: '12px' }}>
                    Click two components to measure distance
                </div>
            </div>
        </div>
    );
};

export default PropertiesPanel;
