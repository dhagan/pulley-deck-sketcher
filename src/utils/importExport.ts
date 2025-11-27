import { SystemState, PulleyComponent, AnchorComponent, RopeComponent, PersonComponent, SpringComponent, ComponentType, PulleyCalcSystem } from '../types';

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
            showRopeArrows: data.showRopeArrows !== undefined ? data.showRopeArrows : true,
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

/**
 * Convert ag-pulley-calc format to pulley-deck-sketcher format
 * This creates a visual layout from a mechanical advantage specification
 */
export function convertFromPulleyCalc(calcSystem: PulleyCalcSystem): SystemState {
    const components: (PulleyComponent | AnchorComponent | RopeComponent | PersonComponent | SpringComponent)[] = [];
    let componentId = 0;

    // We need to layout stages.
    // Assuming routes are ordered: Stage 1 (Load) -> Stage 2 (Power) -> ...
    // Stage 1 lifts the main load.
    // Stage 2 pulls Stage 1's rope.
    // Stage 3 pulls Stage 2's rope.

    const stageBlocks: { top: string, bottom: string, ratio: number, startAtTop: boolean }[] = [];

    // Pass 1: Create Blocks for all stages
    calcSystem.routes.forEach((route, index) => {
        if (route.type !== 'simple') return;

        const stageX = 400 + index * 300;
        const topY = 100;
        const bottomY = 300;

        const ratio = route.ratio;
        const topSheaves = Math.ceil(ratio / 2) as 1 | 2 | 3;
        const bottomSheaves = Math.floor(ratio / 2) as 1 | 2 | 3;
        const startAtTop = ratio % 2 === 0;

        // Top Pulley (Fixed)
        const topPulleyId = `pulley-${componentId++}`;
        components.push({
            id: topPulleyId,
            type: ComponentType.PULLEY,
            position: { x: stageX, y: topY },
            diameter: calcSystem.sheaveWidth * 25.4,
            sheaves: topSheaves,
            hasBecket: startAtTop,
            rotation: 0,
            attachmentPoints: {
                top: { x: stageX, y: topY - 20 },
                bottom: { x: stageX, y: topY + 20 },
                becket: startAtTop ? { x: stageX + 30, y: topY } : undefined,
            },
        });

        // Bottom Pulley (Moving)
        const bottomPulleyId = `pulley-${componentId++}`;
        components.push({
            id: bottomPulleyId,
            type: ComponentType.PULLEY,
            position: { x: stageX, y: bottomY },
            diameter: calcSystem.sheaveWidth * 25.4,
            sheaves: bottomSheaves,
            hasBecket: !startAtTop,
            rotation: 180,
            attachmentPoints: {
                top: { x: stageX, y: bottomY - 20 },
                bottom: { x: stageX, y: bottomY + 20 },
                becket: !startAtTop ? { x: stageX + 30, y: bottomY } : undefined,
            },
        });

        stageBlocks.push({ top: topPulleyId, bottom: bottomPulleyId, ratio, startAtTop });

        // Add Top Anchor for each stage
        const anchorId = `anchor-${componentId++}`;
        components.push({
            id: anchorId,
            type: ComponentType.ANCHOR,
            position: { x: stageX, y: topY - 50 },
            label: `Anchor ${index + 1}`,
        });

        // Connect Top Anchor to Top Pulley
        components.push({
            id: `rope-${componentId++}`,
            type: ComponentType.ROPE,
            startId: anchorId,
            startPoint: 'center',
            endId: topPulleyId,
            endPoint: 'top', // Connect to top of pulley
            routeThrough: [],
        });
    });

    // Pass 2: Create Ropes and Connections
    stageBlocks.forEach((stage, index) => {
        const isLastStage = index === stageBlocks.length - 1;
        const nextStage = !isLastStage ? stageBlocks[index + 1] : null;

        const routeThrough: (string | { id: string, sheaveIndex: number })[] = [];
        const bottomSheaves = Math.floor(stage.ratio / 2);

        let topSheaveIdx = 0;
        let bottomSheaveIdx = 0;

        // Build rope path through sheaves
        if (stage.startAtTop) {
            for (let i = 0; i < bottomSheaves; i++) {
                routeThrough.push({ id: stage.bottom, sheaveIndex: bottomSheaveIdx++ });
                routeThrough.push({ id: stage.top, sheaveIndex: topSheaveIdx++ });
            }
        } else {
            for (let i = 0; i < bottomSheaves; i++) {
                routeThrough.push({ id: stage.top, sheaveIndex: topSheaveIdx++ });
                routeThrough.push({ id: stage.bottom, sheaveIndex: bottomSheaveIdx++ });
            }
            routeThrough.push({ id: stage.top, sheaveIndex: topSheaveIdx++ });
        }

        const startId = stage.startAtTop ? stage.top : stage.bottom;

        // Determine End
        let endId: string;
        let endPoint: string = 'center';

        if (isLastStage) {
            // Pull
            const pullId = `person-${componentId++}`;
            components.push({
                id: pullId,
                type: ComponentType.PERSON,
                position: { x: 400 + index * 300 + 100, y: 400 },
                label: 'Pull',
                pulling: true
            });
            endId = pullId;
        } else {
            // Connect to next stage's moving block (bottom pulley)
            if (nextStage) {
                endId = nextStage.bottom;
                endPoint = 'bottom'; // Connect to bottom of pulley (which is physically top due to 180 rotation)
            } else {
                endId = 'unknown'; // Should not happen
            }
        }

        components.push({
            id: `rope-${componentId++}`,
            type: ComponentType.ROPE,
            startId: startId,
            startPoint: 'becket',
            endId: endId,
            endPoint: endPoint,
            routeThrough: routeThrough,
        });
    });

    // Add Main Load to First Stage Bottom Block via Spring
    if (stageBlocks.length > 0) {
        const loadId = `anchor-${componentId++}`;
        const loadY = 450;
        const pulleyBottomY = 300 + 20; // Bottom pulley Y + radius (approx)

        components.push({
            id: loadId,
            type: ComponentType.ANCHOR,
            position: { x: 400, y: loadY }, // Below first stage
            label: 'Main Load',
        });

        // Add Spring
        components.push({
            id: `spring-${componentId++}`,
            type: ComponentType.SPRING,
            position: { x: 400, y: pulleyBottomY },
            stiffness: 100,
            restLength: loadY - pulleyBottomY,
            currentLength: loadY - pulleyBottomY,
            label: 'Load Spring'
        });
    }

    return {
        components,
        selectedId: null,
        gridSize: 20,
        snapToGrid: true,
        showRopeArrows: true,
    };
}

/**
 * Import from ag-pulley-calc JSON file
 */
export function importFromPulleyCalc(json: string): SystemState | null {
    try {
        const calcSystem = JSON.parse(json) as PulleyCalcSystem;
        return convertFromPulleyCalc(calcSystem);
    } catch (error) {
        console.error('Failed to import from pulley-calc format:', error);
        return null;
    }
}

/**
 * Load ag-pulley-calc system from file
 */
export function loadPulleyCalcSystem(file: File): Promise<SystemState | null> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const system = importFromPulleyCalc(content);
            resolve(system);
        };
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
    });
}
