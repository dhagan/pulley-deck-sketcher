import { SystemState, SolverResult, ConnectionForce, ForceVector, RopeComponent, PulleyComponent, Component, Point } from './types';

/**
 * Main solver class for pulley systems
 */
export class PulleySolver {
    private system: SystemState;
    
    constructor(system: SystemState) {
        this.system = system;
    }
    
    /**
     * Solve the entire pulley system with applied load force
     * @param loadForce - The static force being lifted (load weight)
     */
    solve(loadForce: number = 100): SolverResult {
        const errors: string[] = [];
        
        // Validate system
        if (!this.validateSystem()) {
            return {
                success: false,
                errors: ['Invalid system configuration'],
                theoreticalMA: 0,
                actualMA: 0,
                efficiency: 0,
                anchorForces: [],
                ropeTensions: new Map(),
                totalRopeLength: 0,
                numberOfPulleys: 0,
                movingPulleys: 0,
                fixedPulleys: 0
            };
        }
        
        // Analyze pulley system structure
        const systemAnalysis = this.analyzeSystem();
        
        // Calculate mechanical advantage
        const ma = this.calculateMechanicalAdvantage(systemAnalysis);
        
        // Calculate required input force
        const inputForce = loadForce / ma.actual;
        
        // Calculate rope tensions throughout the system
        const ropeTensions = this.calculateRopeTensions(loadForce, inputForce, systemAnalysis);
        
        // Calculate anchor forces and resultant forces
        const anchorForces = this.calculateAnchorForces(ropeTensions);
        
        // Calculate total rope length
        const totalRopeLength = this.calculateTotalRopeLength();
        
        // Calculate displacement relationship
        // For a given load movement, calculate required pull distance
        const loadDistance = 1.0; // Assume load moves 1 unit
        const pullDistance = ma.theoretical * loadDistance; // Pull distance = MA × load distance
        const distanceRatio = pullDistance / loadDistance;
        
        return {
            success: true,
            theoreticalMA: ma.theoretical,
            actualMA: ma.actual,
            efficiency: ma.efficiency,
            inputForce,
            outputForce: loadForce,
            anchorForces,
            ropeTensions,
            pullDistance,
            loadDistance,
            distanceRatio,
            totalRopeLength,
            numberOfPulleys: systemAnalysis.allPulleys.length,
            movingPulleys: systemAnalysis.movingPulleys.length,
            fixedPulleys: systemAnalysis.fixedPulleys.length
        };
    }
    
    private validateSystem(): boolean {
        // Check for at least one rope and one pulley
        const hasRopes = this.system.components.some(c => c.type === 'rope');
        const hasPulleys = this.system.components.some(c => c.type === 'pulley');
        return hasRopes && hasPulleys;
    }
    
    private analyzeSystem() {
        const allPulleys = this.system.components.filter(c => c.type === 'pulley') as PulleyComponent[];
        const allRopes = this.system.components.filter(c => c.type === 'rope') as RopeComponent[];
        const anchors = this.system.components.filter(c => c.type === 'anchor');
        const load = this.system.components.find(c => c.type === 'spring');
        
        // Determine which pulleys are moving vs fixed
        // A pulley is moving if its anchor point is connected to the load
        const movingPulleys: PulleyComponent[] = [];
        const fixedPulleys: PulleyComponent[] = [];
        
        allPulleys.forEach(pulley => {
            const anchorRope = allRopes.find(r => 
                r.endPoint?.includes(pulley.id + '-anchor') || 
                r.startPoint?.includes(pulley.id + '-anchor')
            );
            
            if (anchorRope) {
                // Check if this anchor rope connects to load or a moving component
                const isConnectedToLoad = load && (
                    anchorRope.startId === (load as any).startId ||
                    anchorRope.endId === (load as any).startId
                );
                
                if (isConnectedToLoad) {
                    movingPulleys.push(pulley);
                } else {
                    fixedPulleys.push(pulley);
                }
            } else {
                // No anchor rope means it might be moving
                movingPulleys.push(pulley);
            }
        });
        
        // Find the working chain (rope chain)
        const chainRopes = allRopes.filter(r => r.chainId);
        const chainStart = allRopes.find(r => r.isChainStart);
        
        return {
            allPulleys,
            movingPulleys,
            fixedPulleys,
            allRopes,
            chainRopes,
            chainStart,
            anchors,
            load
        };
    }
    
    private calculateMechanicalAdvantage(systemAnalysis: ReturnType<typeof this.analyzeSystem>) {
        const { chainRopes, allPulleys } = systemAnalysis;
        
        if (chainRopes.length === 0) {
            return { theoretical: 1, actual: 1, efficiency: 1 };
        }
        
        // Count the number of rope segments supporting the load
        // In a typical pulley system, MA = number of rope segments supporting moving pulley
        const supportingSegments = this.countSupportingSegments(systemAnalysis);
        const theoretical = supportingSegments;
        
        // Calculate efficiency from friction losses
        let efficiency = 1.0;
        
        // Each time rope passes through a pulley, apply friction
        const pulleyPassCount = new Map<string, number>();
        
        chainRopes.forEach(rope => {
            // Check if rope passes through a pulley
            const startPulley = allPulleys.find(p => rope.startId === p.id);
            const endPulley = allPulleys.find(p => rope.endId === p.id);
            
            if (startPulley) {
                pulleyPassCount.set(startPulley.id, (pulleyPassCount.get(startPulley.id) || 0) + 1);
            }
            if (endPulley && endPulley.id !== startPulley?.id) {
                pulleyPassCount.set(endPulley.id, (pulleyPassCount.get(endPulley.id) || 0) + 1);
            }
        });
        
        // Apply friction for each pulley pass
        pulleyPassCount.forEach((passes, pulleyId) => {
            const pulley = allPulleys.find(p => p.id === pulleyId);
            const pulleyFriction = pulley?.friction || 0.95;
            
            // Each pass through pulley reduces efficiency
            for (let i = 0; i < passes; i++) {
                efficiency *= pulleyFriction;
            }
        });
        
        return {
            theoretical,
            actual: theoretical * efficiency,
            efficiency
        };
    }
    
    private countSupportingSegments(systemAnalysis: ReturnType<typeof this.analyzeSystem>): number {
        const { chainRopes, movingPulleys } = systemAnalysis;
        
        if (chainRopes.length === 0) return 1;
        
        // For simple systems: count rope segments in the chain
        // This is the theoretical mechanical advantage
        return chainRopes.length;
    }
    
    private calculateRopeTensions(
        loadForce: number, 
        inputForce: number, 
        systemAnalysis: ReturnType<typeof this.analyzeSystem>
    ): Map<string, number> {
        const tensions = new Map<string, number>();
        const { chainRopes, allRopes, allPulleys } = systemAnalysis;
        
        if (chainRopes.length === 0) {
            // No chain, simple case
            allRopes.forEach(rope => tensions.set(rope.id, loadForce));
            return tensions;
        }
        
        // Start from the input (person pulling) and propagate tension through the chain
        let currentTension = inputForce;
        
        // Find the rope chain in order
        const orderedChain = this.orderRopeChain(chainRopes);
        
        orderedChain.forEach((rope, index) => {
            // Set tension for this segment
            tensions.set(rope.id, currentTension);
            
            // Check if rope passes through a pulley and apply friction
            const endPulley = allPulleys.find(p => rope.endId === p.id);
            if (endPulley) {
                const friction = endPulley.friction || 0.95;
                // Tension slightly increases after passing through pulley due to friction
                currentTension = currentTension / friction;
            }
        });
        
        // Calculate tensions for non-chain ropes (suspension ropes, etc.)
        allRopes.forEach(rope => {
            if (!rope.chainId) {
                // Suspension ropes carry the sum of forces on the pulley
                const pulley = allPulleys.find(p => 
                    rope.startId === p.id || rope.endId === p.id
                );
                
                if (pulley) {
                    // Sum tensions of all ropes connected to this pulley
                    let totalTension = 0;
                    chainRopes.forEach(chainRope => {
                        if (chainRope.startId === pulley.id || chainRope.endId === pulley.id) {
                            totalTension += tensions.get(chainRope.id) || 0;
                        }
                    });
                    tensions.set(rope.id, totalTension);
                }
            }
        });
        
        return tensions;
    }
    
    private orderRopeChain(chainRopes: RopeComponent[]): RopeComponent[] {
        const ordered: RopeComponent[] = [];
        
        // Find chain start
        let current = chainRopes.find(r => r.isChainStart);
        if (!current) return chainRopes;
        
        ordered.push(current);
        const remaining = chainRopes.filter(r => r.id !== current!.id);
        
        // Follow the chain
        while (remaining.length > 0) {
            const next = remaining.find(r => r.startId === current!.endId || r.startPoint === current!.endPoint);
            if (!next) break;
            
            ordered.push(next);
            current = next;
            remaining.splice(remaining.indexOf(next), 1);
        }
        
        return ordered;
    }
    
    private calculateAnchorForces(ropeTensions: Map<string, number>): ConnectionForce[] {
        const forces: ConnectionForce[] = [];
        const allComponents = this.system.components;
        
        // Calculate forces at each component
        allComponents.forEach(component => {
            if (component.type === 'anchor' || component.type === 'pulley') {
                const connectedRopes = this.system.components.filter(c => 
                    c.type === 'rope' && 
                    ((c as RopeComponent).startId === component.id || (c as RopeComponent).endId === component.id)
                ) as RopeComponent[];
                
                if (connectedRopes.length === 0) return;
                
                let totalForceX = 0;
                let totalForceY = 0;
                
                // Calculate force vector for each connected rope
                connectedRopes.forEach(rope => {
                    const tension = ropeTensions.get(rope.id) || 0;
                    
                    // Get rope direction
                    const start = this.getComponentPosition(rope.startId);
                    const end = this.getComponentPosition(rope.endId);
                    
                    if (start && end) {
                        const dx = end.x - start.x;
                        const dy = end.y - start.y;
                        const length = Math.sqrt(dx * dx + dy * dy);
                        
                        if (length > 0) {
                            // Normalize and apply tension
                            const forceX = (dx / length) * tension;
                            const forceY = (dy / length) * tension;
                            
                            // Force on this component (opposite if it's the start)
                            if (rope.startId === component.id) {
                                totalForceX -= forceX;
                                totalForceY -= forceY;
                            } else {
                                totalForceX += forceX;
                                totalForceY += forceY;
                            }
                        }
                    }
                });
                
                const magnitude = Math.sqrt(totalForceX * totalForceX + totalForceY * totalForceY);
                const angle = Math.atan2(totalForceY, totalForceX);
                
                forces.push({
                    componentId: component.id,
                    connectionPoint: component.type === 'anchor' ? 'anchor' : 'pulley-anchor',
                    force: {
                        magnitude,
                        angle,
                        x: totalForceX,
                        y: totalForceY
                    },
                    tension: magnitude
                });
            }
        });
        
        return forces;
    }
    
    private getComponentPosition(componentId: string): Point | null {
        const component = this.system.components.find(c => c.id === componentId);
        if (component && 'position' in component) {
            return component.position;
        }
        return null;
    }
    
    private calculateTotalRopeLength(): number {
        const ropes = this.system.components.filter(c => c.type === 'rope') as RopeComponent[];
        
        let totalLength = 0;
        
        ropes.forEach(rope => {
            const start = this.getComponentPosition(rope.startId);
            const end = this.getComponentPosition(rope.endId);
            
            if (start && end) {
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                
                // Check if rope wraps around a pulley
                const startPulley = this.system.components.find(c => c.id === rope.startId && c.type === 'pulley') as PulleyComponent | undefined;
                const endPulley = this.system.components.find(c => c.id === rope.endId && c.type === 'pulley') as PulleyComponent | undefined;
                
                let additionalLength = 0;
                
                // Add pulley wrap length (approximate as quarter circumference per connection)
                if (startPulley && rope.startPoint?.includes('sheave')) {
                    additionalLength += (Math.PI * startPulley.diameter) / 4;
                }
                if (endPulley && rope.endPoint?.includes('sheave')) {
                    additionalLength += (Math.PI * endPulley.diameter) / 4;
                }
                
                totalLength += length + additionalLength;
            }
        });
        
        return totalLength;
    }
}

export default PulleySolver;
