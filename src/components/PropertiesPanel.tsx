import React from 'react';
import { SystemState, PulleyComponent, AnchorComponent, CleatComponent, PersonComponent, ComponentType, Component } from '../types';

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
            </div>

            {selectedComponent && (
                <div className="property-group">
                    <h3>Selected: {selectedComponent.type}</h3>
                    <div className="property-row">
                        <span className="property-label">ID:</span>
                        <span className="property-value">{selectedComponent.id}</span>
                    </div>

                    {selectedComponent.type === ComponentType.PULLEY && renderPulleyProperties(selectedComponent as PulleyComponent)}

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
