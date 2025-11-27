import React from 'react';
import { SystemState } from '../types';
import { scenarios } from '../utils/scenarios';
import { validateSystem, formatValidationReport } from '../utils/validation';

interface ToolbarProps {
    onAddPulley: () => void;
    onAddDoubleBlock: () => void;
    onAddTripleBlock: () => void;
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
    system: SystemState;
}

const Toolbar: React.FC<ToolbarProps> = ({
    onAddPulley,
    onAddDoubleBlock,
    onAddTripleBlock,
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
    system,
}) => {
    const handleValidate = () => {
        const result = validateSystem(system);
        const report = formatValidationReport(result);
        
        if (result.valid) {
            alert('✓ System Valid!\n\n' + report);
        } else {
            alert('✗ System has errors:\n\n' + report);
        }
    };

    return (
        <div className="toolbar">
            <div className="toolbar-group" style={{ display: 'flex', gap: '8px' }}>
                <select 
                    className="toolbar-select" 
                    onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'single') onAddPulley();
                        else if (value === 'double') onAddDoubleBlock();
                        else if (value === 'triple') onAddTripleBlock();
                        e.target.value = '';
                    }}
                    defaultValue=""
                    style={{ 
                        padding: '6px 12px', 
                        background: '#2a2a2a', 
                        color: '#e0e0e0', 
                        border: '1px solid #3d3d3d',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    <option value="" disabled>+ Add Block...</option>
                    <option value="single">◉ Single Block</option>
                    <option value="double">◎ Double Block</option>
                    <option value="triple">⊚ Triple Block</option>
                </select>
                <button className="toolbar-button" onClick={onAddAnchor} title="Add Anchor">▲ Anchor</button>
                <button className="toolbar-button" onClick={onAddCleat} title="Add Cleat">⊥ Cleat</button>
                <button className="toolbar-button" onClick={onAddPerson} title="Add Person">● Person</button>
                <button className="toolbar-button" onClick={onAddSpring} title="Add Spring">⋈ Spring</button>
                <button
                    className={`toolbar-button ${toolMode === 'rope' ? 'active' : ''}`}
                    onClick={onAddRope}
                    title="Add Rope (Click points to connect)"
                >
                    ─ Rope {ropeStart ? '(Select End)' : ''}
                </button>
                <button
                    className={`toolbar-button ${toolMode === 'measure' ? 'active' : ''}`}
                    onClick={onMeasure}
                    title="Measure Distance"
                >
                    ↔ Measure
                </button>
                {selectedId && onDelete && (
                    <button 
                        className="toolbar-button" 
                        onClick={onDelete} 
                        title="Delete Selected"
                        style={{ background: '#8b1a1a', color: '#fff' }}
                    >
                        🗑 Delete
                    </button>
                )}
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
                <button 
                    className="toolbar-button" 
                    onClick={handleValidate} 
                    title="Validate System"
                    style={{ 
                        marginLeft: '16px',
                        background: 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)', 
                        borderColor: '#69db7c' 
                    }}
                >
                    ✓ Validate
                </button>
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
