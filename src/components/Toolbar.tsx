import React from 'react';
import { ComponentType } from '../types';

interface ToolbarProps {
    onAddComponent: (type: ComponentType) => void;
    onSave: () => void;
    onLoad: () => void;
    onExport: () => void;
    toolMode: 'select' | 'rope';
    ropeStart: string | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ onAddComponent, onSave, onLoad, onExport, toolMode, ropeStart }) => {
    return (
        <div className="toolbar">
            <button
                className="toolbar-button"
                onClick={() => onAddComponent(ComponentType.ANCHOR)}
                title="Add Anchor Point"
            >
                🔗 Anchor
            </button>
            <button
                className="toolbar-button"
                onClick={() => onAddComponent(ComponentType.PULLEY)}
                title="Add Pulley"
            >
                ⚙️ Pulley
            </button>
            <button
                className="toolbar-button"
                onClick={() => onAddComponent(ComponentType.CLEAT)}
                title="Add Cleat"
            >
                🪝 Cleat
            </button>
            <button
                className="toolbar-button"
                onClick={() => onAddComponent(ComponentType.PERSON)}
                title="Add Person"
            >
                🧍 Person
            </button>
            <button
                className={`toolbar-button ${toolMode === 'rope' ? 'active' : ''}`}
                onClick={() => onAddComponent(ComponentType.ROPE)}
                title="Add Rope (click start, then end)"
            >
                〰️ Rope {ropeStart && '(1/2)'}
            </button>
            <div style={{ flex: 1 }} />
            <button className="toolbar-button" onClick={onSave} title="Save System">
                💾 Save
            </button>
            <button className="toolbar-button" onClick={onLoad} title="Load System">
                📂 Load
            </button>
            <button className="toolbar-button" onClick={onExport} title="Export Drawing">
                📄 Export SVG
            </button>
            <button className="toolbar-button" title="Analyze System">
                📊 Analyze
            </button>
            <button className="toolbar-button" title="Animate">
                ▶️ Animate
            </button>
        </div>
    );
};

export default Toolbar;
