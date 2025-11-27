import { Component, RopeComponent, RopeChain, ComponentType } from '../types';

/**
 * Detect rope chains by following connected rope segments
 */
export const detectRopeChains = (components: Component[]): RopeChain[] => {
    const ropes = components.filter((c): c is RopeComponent => c.type === ComponentType.ROPE);
    const visited = new Set<string>();
    const chains: RopeChain[] = [];

    // Helper to check if a point is a terminal (start/end of chain)
    const isTerminal = (pointId: string): boolean => {
        return pointId.includes('anchor') || 
               pointId.includes('becket') || 
               pointId.includes('person') ||
               pointId.includes('spring');
    };

    // Helper to find ropes connected to a point
    const findConnectedRopes = (pointId: string, excludeRopeId?: string): RopeComponent[] => {
        return ropes.filter(r => {
            if (r.id === excludeRopeId || visited.has(r.id)) return false;
            const startMatch = r.startPoint === pointId || r.startId === pointId;
            const endMatch = r.endPoint === pointId || r.endId === pointId;
            return startMatch || endMatch;
        });
    };

    // Build chains by following connected ropes
    for (const startRope of ropes) {
        if (visited.has(startRope.id)) continue;

        const chainRopes: RopeComponent[] = [startRope];
        visited.add(startRope.id);

        // Follow forward from end point
        let currentEndPoint = startRope.endPoint || startRope.endId;
        while (!isTerminal(currentEndPoint)) {
            const nextRopes = findConnectedRopes(currentEndPoint, chainRopes[chainRopes.length - 1].id);
            if (nextRopes.length === 0) break;
            
            const nextRope = nextRopes[0];
            chainRopes.push(nextRope);
            visited.add(nextRope.id);
            
            // Move to the other end of this rope
            if (nextRope.startPoint === currentEndPoint || nextRope.startId === currentEndPoint) {
                currentEndPoint = nextRope.endPoint || nextRope.endId;
            } else {
                currentEndPoint = nextRope.startPoint || nextRope.startId;
            }
        }

        // Only create chain if it has more than 1 rope
        if (chainRopes.length > 1) {
            chains.push({
                id: `chain-${chains.length + 1}`,
                ropeIds: chainRopes.map(r => r.id),
                startPoint: startRope.startPoint || startRope.startId,
                endPoint: currentEndPoint,
            });
        }
    }

    return chains;
};

/**
 * Get all rope IDs in a chain
 */
export const getRopesInChain = (chainId: string, chains: RopeChain[]): string[] => {
    const chain = chains.find(c => c.id === chainId);
    return chain ? chain.ropeIds : [];
};

/**
 * Find which chain a rope belongs to
 */
export const findChainForRope = (ropeId: string, chains: RopeChain[]): RopeChain | null => {
    return chains.find(c => c.ropeIds.includes(ropeId)) || null;
};

/**
 * Get the path segments where rope wraps around a pulley
 * Returns array of { pulleyId, sheaveIndex, startAngle, endAngle }
 */
export const getPulleyWraps = (chain: RopeChain, components: Component[]): Array<{
    pulleyId: string;
    sheaveIndex: number;
    startAngle: number;
    endAngle: number;
}> => {
    const wraps: Array<{ pulleyId: string; sheaveIndex: number; startAngle: number; endAngle: number }> = [];
    const ropes = components.filter((c): c is RopeComponent => 
        c.type === ComponentType.ROPE && chain.ropeIds.includes(c.id)
    );

    for (let i = 0; i < ropes.length - 1; i++) {
        const currentRope = ropes[i];
        const nextRope = ropes[i + 1];

        // Check if current rope ends at IN and next starts at OUT on same pulley
        const currentEnd = currentRope.endPoint || '';
        const nextStart = nextRope.startPoint || '';

        if (currentEnd.includes('-in') && nextStart.includes('-out')) {
            const pulleyId = currentEnd.split('-sheave')[0];
            const nextPulleyId = nextStart.split('-sheave')[0];

            if (pulleyId === nextPulleyId) {
                // Extract sheave index
                const sheaveMatch = currentEnd.match(/sheave-(\d+)/);
                const sheaveIndex = sheaveMatch ? parseInt(sheaveMatch[1]) : 0;

                // For now, wrap from IN (left, PI) to OUT (right, 0) going around bottom
                wraps.push({
                    pulleyId,
                    sheaveIndex,
                    startAngle: Math.PI, // Left side (IN)
                    endAngle: 0, // Right side (OUT) - will render as 2*PI
                });
            }
        }
    }

    return wraps;
};
