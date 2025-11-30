import { SolverResult, SystemState } from '../solver/types';

/**
 * Format solver results for display in a UI panel
 */
export interface DisplayResults {
    scenario: string;
    loadForce: number;
    summary: {
        theoreticalMA: string;
        actualMA: string;
        efficiency: string;
        inputForce: string;
        outputForce: string;
        forceAdvantage: string;
    };
    system: {
        totalPulleys: number;
        movingPulleys: number;
        fixedPulleys: number;
        totalRopeLength: string;
    };
    tensions: Array<{
        ropeId: string;
        ropeLabel: string;
        tension: number;
        tensionFormatted: string;
    }>;
    forces: Array<{
        componentId: string;
        componentLabel: string;
        magnitude: number;
        angle: number;
        angleFormatted: string;
        x: number;
        y: number;
        magnitudeFormatted: string;
    }>;
    graph: {
        nodes: Array<{
            id: string;
            type: string;
            label: string;
            x: number;
            y: number;
        }>;
        edges: Array<{
            id: string;
            source: string;
            target: string;
            tension: number;
            label: string;
        }>;
    };
}

/**
 * Convert solver results to display format
 */
export function formatResultsForDisplay(
    result: SolverResult,
    system: SystemState,
    scenarioName: string = 'Scenario',
    loadForce: number = 100
): DisplayResults {
    // Format tensions
    const tensions = Array.from(result.ropeTensions.entries()).map(([ropeId, tension]) => {
        const rope = system.components.find(c => c.id === ropeId);
        const ropeLabel = rope && 'label' in rope ? rope.label || ropeId : ropeId;
        
        return {
            ropeId,
            ropeLabel,
            tension,
            tensionFormatted: `${tension.toFixed(2)} N`
        };
    }).sort((a, b) => b.tension - a.tension);
    
    // Format forces
    const forces = result.anchorForces.map(af => {
        const component = system.components.find(c => c.id === af.componentId);
        const componentLabel = component && 'label' in component ? component.label || af.componentId : af.componentId;
        
        return {
            componentId: af.componentId,
            componentLabel,
            magnitude: af.force.magnitude,
            angle: af.force.angle,
            angleFormatted: `${(af.force.angle * 180 / Math.PI).toFixed(1)}°`,
            x: af.force.x,
            y: af.force.y,
            magnitudeFormatted: `${af.force.magnitude.toFixed(2)} N`
        };
    }).sort((a, b) => b.magnitude - a.magnitude);
    
    // Build graph structure
    const nodes = system.components.map(c => ({
        id: c.id,
        type: c.type,
        label: 'label' in c ? c.label || c.id : c.id,
        x: 'position' in c ? c.position.x : 0,
        y: 'position' in c ? c.position.y : 0
    }));
    
    const edges = system.components
        .filter(c => c.type === 'rope')
        .map(c => {
            const rope = c as any;
            const tension = result.ropeTensions.get(rope.id) || 0;
            
            return {
                id: rope.id,
                source: rope.startId,
                target: rope.endId,
                tension,
                label: `${tension.toFixed(1)} N`
            };
        });
    
    return {
        scenario: scenarioName,
        loadForce,
        summary: {
            theoreticalMA: result.theoreticalMA.toFixed(2),
            actualMA: result.actualMA.toFixed(2),
            efficiency: `${(result.efficiency * 100).toFixed(1)}%`,
            inputForce: `${result.inputForce?.toFixed(2)} N`,
            outputForce: `${result.outputForce?.toFixed(2)} N`,
            forceAdvantage: `${(loadForce / (result.inputForce || 1)).toFixed(2)}x`
        },
        system: {
            totalPulleys: result.numberOfPulleys,
            movingPulleys: result.movingPulleys,
            fixedPulleys: result.fixedPulleys,
            totalRopeLength: `${result.totalRopeLength.toFixed(2)} units`
        },
        tensions,
        forces,
        graph: {
            nodes,
            edges
        }
    };
}

/**
 * Generate HTML for results display
 */
export function generateResultsHTML(displayResults: DisplayResults): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pulley Solver Results - ${displayResults.scenario}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        h1 {
            color: #4ec9b0;
            margin-bottom: 10px;
            font-size: 28px;
        }
        
        h2 {
            color: #569cd6;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 20px;
            border-bottom: 2px solid #569cd6;
            padding-bottom: 5px;
        }
        
        h3 {
            color: #dcdcaa;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 16px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .stat-card {
            background: #252526;
            border: 1px solid #3e3e42;
            border-radius: 8px;
            padding: 15px;
        }
        
        .stat-label {
            color: #858585;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        
        .stat-value {
            color: #4ec9b0;
            font-size: 24px;
            font-weight: bold;
        }
        
        .stat-value.large {
            font-size: 32px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            background: #252526;
            border-radius: 8px;
            overflow: hidden;
        }
        
        th {
            background: #2d2d30;
            color: #569cd6;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #3e3e42;
        }
        
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #3e3e42;
        }
        
        tr:last-child td {
            border-bottom: none;
        }
        
        tr:hover {
            background: #2a2a2a;
        }
        
        .value-high {
            color: #f48771;
            font-weight: bold;
        }
        
        .value-medium {
            color: #dcdcaa;
        }
        
        .value-low {
            color: #4ec9b0;
        }
        
        .graph-container {
            background: #252526;
            border: 1px solid #3e3e42;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            min-height: 400px;
        }
        
        .load-badge {
            display: inline-block;
            background: #264f78;
            color: #569cd6;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        
        .efficiency-bar {
            height: 24px;
            background: #2d2d30;
            border-radius: 12px;
            overflow: hidden;
            margin-top: 8px;
        }
        
        .efficiency-fill {
            height: 100%;
            background: linear-gradient(90deg, #4ec9b0, #569cd6);
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 ${displayResults.scenario}</h1>
        <div class="load-badge">Load Force: ${displayResults.loadForce} N</div>
        
        <h2>📊 Mechanical Advantage Summary</h2>
        <div class="summary-grid">
            <div class="stat-card">
                <div class="stat-label">Theoretical MA</div>
                <div class="stat-value large">${displayResults.summary.theoreticalMA}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Actual MA</div>
                <div class="stat-value large">${displayResults.summary.actualMA}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Efficiency</div>
                <div class="stat-value">${displayResults.summary.efficiency}</div>
                <div class="efficiency-bar">
                    <div class="efficiency-fill" style="width: ${displayResults.summary.efficiency}"></div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Force Advantage</div>
                <div class="stat-value">${displayResults.summary.forceAdvantage}</div>
            </div>
        </div>
        
        <h2>💪 Load vs Pull Forces</h2>
        <div class="summary-grid">
            <div class="stat-card" style="background: #2d3436; border: 2px solid #f48771;">
                <div class="stat-label">🏋️ Load (What You're Lifting)</div>
                <div class="stat-value" style="color: #f48771; font-size: 32px;">${displayResults.summary.outputForce}</div>
            </div>
            <div class="stat-card" style="background: #1e272e;">
                <div class="stat-label">⚡ Mechanical Advantage</div>
                <div class="stat-value" style="color: #dcdcaa; font-size: 28px;">${displayResults.summary.actualMA}:1</div>
                <div style="color: #858585; font-size: 12px; margin-top: 5px;">Efficiency: ${displayResults.summary.efficiency}</div>
            </div>
            <div class="stat-card" style="background: #2d3436; border: 2px solid #4ec9b0;">
                <div class="stat-label">💪 Pull (Force You Apply)</div>
                <div class="stat-value" style="color: #4ec9b0; font-size: 32px;">${displayResults.summary.inputForce}</div>
            </div>
        </div>
        
        <div style="background: #252526; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #569cd6;">
            <div style="color: #569cd6; font-weight: bold; margin-bottom: 10px;">📐 Force Relationship:</div>
            <div style="color: #d4d4d4; font-size: 16px;">
                Pull ${displayResults.summary.inputForce} × MA ${displayResults.summary.actualMA} = Load ${displayResults.summary.outputForce}
            </div>
            <div style="color: #858585; font-size: 14px; margin-top: 8px;">
                You pull with ${displayResults.summary.inputForce}, the system amplifies it by ${displayResults.summary.actualMA}x, resulting in ${displayResults.summary.outputForce} lifting force.
            </div>
        </div>
        
        <div style="background: #252526; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dcdcaa;">
            <div style="color: #dcdcaa; font-weight: bold; margin-bottom: 10px;">📏 Distance Relationship:</div>
            <div style="color: #d4d4d4; font-size: 16px;">
                Pull rope ${displayResults.summary.theoreticalMA} units to lift load 1 unit
            </div>
            <div style="color: #858585; font-size: 14px; margin-top: 8px;">
                You pull the rope ${displayResults.summary.theoreticalMA}× farther than the load moves. This is the trade-off: less force but more distance.
            </div>
        </div>
        
        <h2>⚙️ System Configuration</h2>
        <div class="summary-grid">
            <div class="stat-card">
                <div class="stat-label">Total Rope Length</div>
                <div class="stat-value">${displayResults.system.totalRopeLength}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Pulleys (Moving/Fixed)</div>
                <div class="stat-value">${displayResults.system.movingPulleys}/${displayResults.system.fixedPulleys}</div>
            </div>
        </div>
        
        <h2>🔗 Rope Tensions</h2>
        <table>
            <thead>
                <tr>
                    <th>Rope</th>
                    <th>Tension (N)</th>
                    <th>Relative</th>
                </tr>
            </thead>
            <tbody>
                ${displayResults.tensions.map((t, idx) => {
                    const maxTension = Math.max(...displayResults.tensions.map(t => t.tension));
                    const percentage = (t.tension / maxTension * 100).toFixed(0);
                    const colorClass = idx === 0 ? 'value-high' : idx < 3 ? 'value-medium' : 'value-low';
                    
                    return `
                    <tr>
                        <td>${t.ropeLabel}</td>
                        <td class="${colorClass}">${t.tensionFormatted}</td>
                        <td>${percentage}%</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
        
        <h2>⚓ Anchor & Resultant Forces</h2>
        <table>
            <thead>
                <tr>
                    <th>Component</th>
                    <th>Magnitude (N)</th>
                    <th>Angle</th>
                    <th>X-Force (N)</th>
                    <th>Y-Force (N)</th>
                </tr>
            </thead>
            <tbody>
                ${displayResults.forces.map(f => `
                <tr>
                    <td>${f.componentLabel}</td>
                    <td class="value-high">${f.magnitudeFormatted}</td>
                    <td>${f.angleFormatted}</td>
                    <td>${f.x.toFixed(2)}</td>
                    <td>${f.y.toFixed(2)}</td>
                </tr>`).join('')}
            </tbody>
        </table>
        
        <h2>📈 System Graph</h2>
        <div class="graph-container">
            <svg id="graph" width="100%" height="500" viewBox="0 0 800 600">
                <!-- Graph will be rendered here -->
            </svg>
        </div>
    </div>
    
    <script>
        // Render system graph
        const graphData = ${JSON.stringify(displayResults.graph)};
        renderGraph(graphData);
        
        function renderGraph(data) {
            const svg = document.getElementById('graph');
            const width = 800;
            const height = 600;
            
            // Find bounds
            const xCoords = data.nodes.map(n => n.x);
            const yCoords = data.nodes.map(n => n.y);
            const minX = Math.min(...xCoords);
            const maxX = Math.max(...xCoords);
            const minY = Math.min(...yCoords);
            const maxY = Math.max(...yCoords);
            
            const scaleX = width * 0.8 / (maxX - minX || 1);
            const scaleY = height * 0.8 / (maxY - minY || 1);
            const scale = Math.min(scaleX, scaleY);
            
            const offsetX = (width - (maxX - minX) * scale) / 2 - minX * scale;
            const offsetY = (height - (maxY - minY) * scale) / 2 - minY * scale;
            
            // Draw edges (ropes)
            data.edges.forEach(edge => {
                const source = data.nodes.find(n => n.id === edge.source);
                const target = data.nodes.find(n => n.id === edge.target);
                
                if (source && target) {
                    const x1 = source.x * scale + offsetX;
                    const y1 = source.y * scale + offsetY;
                    const x2 = target.x * scale + offsetX;
                    const y2 = target.y * scale + offsetY;
                    
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', x1);
                    line.setAttribute('y1', y1);
                    line.setAttribute('x2', x2);
                    line.setAttribute('y2', y2);
                    line.setAttribute('stroke', '#569cd6');
                    line.setAttribute('stroke-width', Math.max(2, edge.tension / 50));
                    line.setAttribute('opacity', '0.8');
                    svg.appendChild(line);
                    
                    // Add tension label
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', (x1 + x2) / 2);
                    text.setAttribute('y', (y1 + y2) / 2);
                    text.setAttribute('fill', '#4ec9b0');
                    text.setAttribute('font-size', '10');
                    text.setAttribute('text-anchor', 'middle');
                    text.textContent = edge.label;
                    svg.appendChild(text);
                }
            });
            
            // Draw nodes
            data.nodes.forEach(node => {
                const x = node.x * scale + offsetX;
                const y = node.y * scale + offsetY;
                
                const colors = {
                    'anchor': '#f48771',
                    'pulley': '#dcdcaa',
                    'person': '#4ec9b0',
                    'spring': '#c586c0'
                };
                
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', y);
                circle.setAttribute('r', node.type === 'pulley' ? 15 : 8);
                circle.setAttribute('fill', colors[node.type] || '#569cd6');
                circle.setAttribute('stroke', '#1e1e1e');
                circle.setAttribute('stroke-width', '2');
                svg.appendChild(circle);
                
                // Add label
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x);
                text.setAttribute('y', y - 20);
                text.setAttribute('fill', '#d4d4d4');
                text.setAttribute('font-size', '12');
                text.setAttribute('text-anchor', 'middle');
                text.textContent = node.label;
                svg.appendChild(text);
            });
        }
    </script>
</body>
</html>
    `.trim();
}
