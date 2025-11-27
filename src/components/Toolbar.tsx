import React from 'react';
import { SystemState } from '../types';
import { scenarios } from '../utils/scenarios';

interface ToolbarProps {
    onAddPulley: () => void;
    onAddAnchor: () => void;
    onAddCleat: () => void;
    onAddPerson: () => void;
    onAddSpring: () => void;
    onAddRope: () => void;
    onMeasure: () => void;
    onSave: () => void;
    onLoad: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onLoadScenario: (system: SystemState) => void;
    onExportSVG: () => void;
    onClear: () => void;
    onDelete?: () => void;
    toolMode: 'select' | 'rope' | 'measure';
    ropeStart: string | null;
    selectedId?: string | null;
}

const Toolbar: React.FC<ToolbarProps> = ({
    onAddPulley,
    onAddAnchor,
    onAddCleat,
    onAddPerson,
    onAddSpring,
    onAddRope,
    onMeasure,
    onSave,
    onLoad,
    onLoadScenario,
    onExportSVG,
    onClear,
    onDelete,
    toolMode,
    ropeStart,
    selectedId,
}) => {
    return (
        <div className="toolbar">
            <div className="toolbar-group" style={{ display: 'flex', gap: '8px' }}>
                <button className="toolbar-button" onClick={onAddPulley} title="Add Pulley">⚙️ Pulley</button>
                <button className="toolbar-button" onClick={onAddAnchor} title="Add Anchor">⚓ Anchor</button>
                <button className="toolbar-button" onClick={onAddCleat} title="Add Cleat">🪝 Cleat</button>
                <button className="toolbar-button" onClick={onAddPerson} title="Add Person">👤 Person</button>
                <button className="toolbar-button" onClick={onAddSpring} title="Add Spring">🌀 Spring</button>
                <button
                    className={`toolbar-button ${toolMode === 'rope' ? 'active' : ''}`}
                    onClick={onAddRope}
                    title="Add Rope (Click points to connect)"
                >
                    〰️ Rope {ropeStart ? '(Select End)' : ''}
                </button>
                <button
                    className={`toolbar-button ${toolMode === 'measure' ? 'active' : ''}`}
                    onClick={onMeasure}
                    title="Measure Distance"
                >
                    📏 Measure
                </button>
            </div>

            <div className="toolbar-separator" style={{ width: '1px', height: '24px', background: '#3d3d3d', margin: '0 8px' }}></div>

            <div className="toolbar-group" style={{ display: 'flex', gap: '8px' }}>
                <select
                    className="toolbar-select"
                    onChange={(e) => {
                        const scenario = scenarios.find(s => s.name === e.target.value);
                        if (scenario) {
                            onLoadScenario(scenario.system);
                            e.target.value = ""; // Reset selection
                        }
                    }}
                    style={{
                        background: '#3d3d3d',
                        border: '1px solid #4d4d4d',
                        borderRadius: '4px',
                        padding: '8px',
                        color: '#fff',
                        cursor: 'pointer'
                    }}
                >
                    <option value="">📂 Load Scenario...</option>
                    {scenarios.map(s => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                </select>

                <button className="toolbar-button" onClick={onSave} title="Save to JSON">💾 Save</button>
                <label className="toolbar-button" style={{ cursor: 'pointer' }} title="Load from JSON">
                    📂 Load File
                    <input
                        type="file"
                        accept=".json"
                        onChange={onLoad}
                        style={{ display: 'none' }}
                    />
                </label>
                <button className="toolbar-button" onClick={onExportSVG} title="Export as SVG">📤 Export SVG</button>
                {onDelete && (
                    <button
                        className="toolbar-button"
                        onClick={onDelete}
                        title="Delete Selected Component (Del)"
                        disabled={!selectedId}
                        style={{ opacity: selectedId ? 1 : 0.5, cursor: selectedId ? 'pointer' : 'not-allowed' }}
                    >
                        🗑️ Delete
                    </button>
                )}
                <button
                    className="toolbar-button"
                    onClick={onClear}
                    title="Clear All Components"
                    style={{ background: '#ff4444', color: '#fff' }}
                >
                    🗑️ Clear
                </button>
            </div>
        </div>
    );
};

export default Toolbar;
