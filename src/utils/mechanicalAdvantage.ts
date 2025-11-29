import { SystemState, ComponentType, RopeComponent, PulleyComponent } from '../types';

export interface MAResult {
    theoreticalMA: number;
    actualMA: number;
    efficiency: number;
    pulleys: number;
    movingPulleys: number;
    fixedPulleys: number;
}

/**
 * Calculate the mechanical advantage of a pulley system
 */
export function calculateMechanicalAdvantage(system: SystemState): MAResult | null {
    // Find all ropes that form a chain
    const ropes = system.components.filter(c => c.type === ComponentType.ROPE) as RopeComponent[];
    const pulleys = system.components.filter(c => c.type === ComponentType.PULLEY) as PulleyComponent[];
    
    if (ropes.length === 0 || pulleys.length === 0) {
        return null;
    }

    // Find the main rope chain (from becket to person)
    const chainStart = ropes.find(r => r.isChainStart);
    if (!chainStart || !chainStart.chainId) {
        return null;
    }

    const chainRopes = ropes.filter(r => r.chainId === chainStart.chainId);
    
    // Count moving vs fixed pulleys
    // A pulley is "moving" if its anchor point is connected to a rope (load)
    // A pulley is "fixed" if its anchor point is connected to a fixed anchor
    let movingPulleys = 0;
    let fixedPulleys = 0;
    
    pulleys.forEach(pulley => {
        const anchorPoint = `${pulley.id}-anchor`;
        const anchorRope = ropes.find(r => 
            r.startPoint === anchorPoint || r.endPoint === anchorPoint
        );
        
        if (anchorRope) {
            // Check if the other end is a fixed anchor
            const otherEnd = anchorRope.startPoint === anchorPoint ? 
                anchorRope.endId : anchorRope.startId;
            const otherComp = system.components.find(c => c.id === otherEnd);
            
            if (otherComp?.type === ComponentType.ANCHOR) {
                fixedPulleys++;
            } else {
                movingPulleys++;
            }
        } else {
            // No anchor rope means it's likely fixed to the structure
            fixedPulleys++;
        }
    });

    // Theoretical MA calculation
    // For simple systems: MA = number of rope segments supporting the load
    // This equals: 2 * moving pulleys (each moving pulley has rope on both sides)
    const supportingSegments = chainRopes.length;
    const theoreticalMA = supportingSegments;

    // Calculate actual MA based on friction
    // Each pulley introduces friction loss
    let actualMA = theoreticalMA;
    let totalEfficiency = 1.0;
    
    // Apply friction from each pulley in the chain
    pulleys.forEach(pulley => {
        const efficiency = pulley.friction || 0.95;
        
        // Count how many ropes pass through this pulley
        const ropesThrough = chainRopes.filter(r => 
            r.startId === pulley.id || r.endId === pulley.id
        ).length;
        
        // Each rope segment experiences friction
        for (let i = 0; i < ropesThrough; i++) {
            totalEfficiency *= efficiency;
        }
    });

    actualMA = theoreticalMA * totalEfficiency;

    return {
        theoreticalMA,
        actualMA,
        efficiency: totalEfficiency,
        pulleys: pulleys.length,
        movingPulleys,
        fixedPulleys
    };
}

/**
 * Format MA result as a readable string
 */
export function formatMAResult(result: MAResult): string {
    return `MA: ${result.theoreticalMA}:1 (actual: ${result.actualMA.toFixed(2)}:1, eff: ${(result.efficiency * 100).toFixed(1)}%)`;
}
