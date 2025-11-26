import { SystemState, PulleyComponent, AnchorComponent } from '../types';

/**
 * Export scene graph to JSON
 */
export function exportSceneGraph(system: SystemState): string {
    const sceneGraph = {
        version: '1.0',
        gridSize: system.gridSize,
        snapToGrid: system.snapToGrid,
        components: system.components,
        timestamp: new Date().toISOString(),
    };

    return JSON.stringify(sceneGraph, null, 2);
}

/**
 * Import scene graph from JSON
 */
export function importSceneGraph(json: string): SystemState | null {
    try {
        const data = JSON.parse(json);

        return {
            components: data.components || [],
            selectedId: null,
            gridSize: data.gridSize || 20,
            snapToGrid: data.snapToGrid !== undefined ? data.snapToGrid : true,
        };
    } catch (error) {
        console.error('Failed to import scene graph:', error);
        return null;
    }
}

/**
 * Export to SVG for mechanical drawing
 */
export function exportToSVG(system: SystemState, width: number, height: number): string {
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${width}" height="${height}" fill="#2d2d2d"/>`;

    // Draw grid
    for (let x = 0; x <= width; x += system.gridSize) {
        svg += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#3d3d3d" stroke-width="1"/>`;
    }
    for (let y = 0; y <= height; y += system.gridSize) {
        svg += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#3d3d3d" stroke-width="1"/>`;
    }

    // Draw components
    system.components.forEach(comp => {
        if (comp.type === 'pulley') {
            const pulley = comp as PulleyComponent;
            const r = pulley.diameter / 2;
            svg += `<circle cx="${pulley.position.x}" cy="${pulley.position.y}" r="${r}" fill="rgba(100,150,255,0.2)" stroke="#4a90e2" stroke-width="2"/>`;
            svg += `<text x="${pulley.position.x}" y="${pulley.position.y + r + 20}" fill="#aaa" font-size="12" text-anchor="middle">${pulley.diameter}mm ${pulley.sheaves}x</text>`;
        } else if (comp.type === 'anchor') {
            const anchor = comp as AnchorComponent;
            svg += `<polygon points="${anchor.position.x},${anchor.position.y + 12} ${anchor.position.x - 12},${anchor.position.y - 12} ${anchor.position.x + 12},${anchor.position.y - 12}" fill="#ff6b6b" stroke="#fff" stroke-width="2"/>`;
            if (anchor.label) {
                svg += `<text x="${anchor.position.x}" y="${anchor.position.y + 30}" fill="#aaa" font-size="12" text-anchor="middle">${anchor.label}</text>`;
            }
        }
    });

    svg += '</svg>';
    return svg;
}

/**
 * Download file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Save system to file
 */
export function saveSystem(system: SystemState) {
    const json = exportSceneGraph(system);
    downloadFile(json, 'pulley-system.json', 'application/json');
}

/**
 * Load system from file
 */
export function loadSystem(file: File): Promise<SystemState | null> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const system = importSceneGraph(content);
            resolve(system);
        };
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
    });
}

/**
 * Export mechanical drawing as SVG
 */
export function exportMechanicalDrawing(system: SystemState) {
    const svg = exportToSVG(system, 1200, 800);
    downloadFile(svg, 'mechanical-drawing.svg', 'image/svg+xml');
}
