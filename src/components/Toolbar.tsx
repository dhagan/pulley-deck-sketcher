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
    toolMode: 'select' | 'rope' | 'spring' | 'measure';
    ropeStart: string | null;
    selectedId?: string | null;
    system: SystemState;
    showMeasurements?: boolean;
    onToggleMeasurements?: () => void;
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
    selectedId,
    system,
    showMeasurements = true,
    onToggleMeasurements,
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
            {/* Component buttons */}
            <button className="toolbar-button" onClick={onAddPulley} title="Add Single Block">◉</button>
            <button className="toolbar-button" onClick={onAddDoubleBlock} title="Add Double Block">◎</button>
            <button className="toolbar-button" onClick={onAddTripleBlock} title="Add Triple Block">⊚</button>
            <button className="toolbar-button" onClick={onAddAnchor} title="Add Anchor">▲</button>
            <button className="toolbar-button" onClick={onAddCleat} title="Add Cleat">⊥</button>
            <button className="toolbar-button" onClick={onAddPerson} title="Add Person">●</button>
            <button className="toolbar-button" onClick={onAddSpring} title="Add Spring">⋈</button>
            <button
                className={`toolbar-button ${toolMode === 'rope' ? 'active' : ''}`}
                onClick={onAddRope}
                title="Add Rope"
            >
                ─
            </button>
            <button
                className={`toolbar-button ${toolMode === 'measure' ? 'active' : ''}`}
                onClick={onMeasure}
                title="Measure Distance"
            >
                ↔
            </button>
            
            {/* Separator */}
            <div style={{ height: '8px' }}></div>
            
            {/* Action buttons */}
            {selectedId && onDelete && (
                <button 
                    className="toolbar-button" 
                    onClick={onDelete} 
                    title="Delete Selected (Del)"
                    style={{ background: '#dc2626', color: '#fff' }}
                >
                    🗑
                </button>
            )}
            <button
                className="toolbar-button"
                onClick={onClear}
                title="Clear All"
                style={{ background: '#991b1b', color: '#fff' }}
            >
                ✕
            </button>
            
            <div style={{ height: '8px' }}></div>
            
            <button className="toolbar-button" onClick={onSave} title="Save">💾</button>
            <label className="toolbar-button" style={{ cursor: 'pointer' }} title="Load">
                📂
                <input
                    type="file"
                    accept=".json"
                    onChange={onLoad}
                    style={{ display: 'none' }}
                />
            </label>
            <button className="toolbar-button" onClick={onExportSVG} title="Export SVG">📤</button>
            <button 
                className="toolbar-button" 
                onClick={handleValidate} 
                title="Validate"
                style={{ background: '#16a34a', color: '#fff' }}
            >
                ✓
            </button>
            {onToggleMeasurements && (
                <button 
                    className={`toolbar-button ${showMeasurements ? 'active' : ''}`}
                    onClick={onToggleMeasurements} 
                    title="Toggle Measurements"
                >
                    📏
                </button>
            )}
            
            <div style={{ height: '8px' }}></div>
            
            <select
                className="toolbar-select"
                onChange={(e) => {
                    const scenario = scenarios.find(s => s.name === e.target.value);
                    if (scenario) {
                        onLoadScenario(scenario.system);
                        e.target.value = "";
                    }
                }}
                style={{
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    padding: '6px 4px',
                    color: '#f1f5f9',
                    cursor: 'pointer',
                    fontSize: '10px',
                    width: '36px',
                    textAlign: 'center'
                }}
                title="Load Scenario"
            >
                <option value="">📁</option>
                {scenarios.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                ))}
            </select>
        </div>
    );
};

export default Toolbar;
