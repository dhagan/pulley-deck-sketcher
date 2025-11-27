import { SystemState, Component, RopeComponent, ComponentType } from '../types';

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    stats: {
        totalRopes: number;
        validRopes: number;
        invalidRopes: number;
    };
}

export const validateSystem = (system: SystemState): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const ropes = system.components.filter((c): c is RopeComponent => c.type === ComponentType.ROPE);
    
    let validRopes = 0;
    let invalidRopes = 0;

    // Validate each rope
    ropes.forEach((rope, index) => {
        const ropeErrors = validateRope(rope, system.components, index + 1);
        if (ropeErrors.length > 0) {
            errors.push(...ropeErrors);
            invalidRopes++;
        } else {
            validRopes++;
        }
    });

    // Check for disconnected components
    const disconnectedWarnings = checkDisconnectedComponents(system.components);
    warnings.push(...disconnectedWarnings);

    // Check for multiple ropes from same start point
    const duplicateWarnings = checkDuplicateStarts(ropes);
    warnings.push(...duplicateWarnings);

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        stats: {
            totalRopes: ropes.length,
            validRopes,
            invalidRopes,
        }
    };
};

const validateRope = (rope: RopeComponent, components: Component[], ropeNumber: number): string[] => {
    const errors: string[] = [];
    const prefix = `Rope ${ropeNumber} (${rope.label || rope.id})`;

    // Check start point exists and is valid
    const startComponent = components.find(c => c.id === rope.startId);
    if (!startComponent) {
        errors.push(`${prefix}: Start component not found`);
        return errors;
    }

    // Check end point exists and is valid
    const endComponent = components.find(c => c.id === rope.endId);
    if (!endComponent) {
        errors.push(`${prefix}: End component not found`);
        return errors;
    }

    // Validate start point - can start from: Fixed Anchor, Becket, Spring, Person center, OUT points
    // NOT valid: Pulley Anchor (red - suspension point), IN points (blue)
    const startPoint = rope.startPoint || '';
    const isPulleyAnchor = startPoint.includes('pulley') && startPoint.includes('anchor');
    const isInPoint = startPoint.includes('-in');
    const isFixedAnchor = startPoint.includes('anchor-') && !startPoint.includes('pulley');
    const isBecket = startPoint.includes('becket');
    const isSpring = startPoint.includes('spring');
    const isCenter = startPoint.endsWith('center');
    const isOutPoint = startPoint.includes('-out');
    
    const isValidStart = (isFixedAnchor || isBecket || isSpring || isCenter || isOutPoint) && !isPulleyAnchor && !isInPoint;

    if (!isValidStart) {
        errors.push(`${prefix}: Invalid start point "${startPoint}". Ropes can start from: Fixed Anchor, Becket, OUT point, Spring, or Person center. NOT from Pulley Anchor (red) or IN point (blue).`);
    }

    // Validate that becket doesn't go back to its own pulley (simplified - just check endPoint)
    if (startPoint.includes('becket')) {
        const becketPulleyId = rope.startId;
        const connectsToSamePulley = rope.endPoint?.startsWith(becketPulleyId);

        if (connectsToSamePulley) {
            errors.push(`${prefix}: Becket cannot connect directly to its own pulley. Becket should start a rope going to another pulley or person.`);
        }
    }

    // Validate end point - should be at person or terminal point
    const endPoint = rope.endPoint || '';
    const isValidEnd = 
        endPoint.includes('person') ||
        endPoint.includes('anchor') && !endPoint.includes('sheave') ||
        endPoint.includes('load') ||
        endPoint.includes('spring') ||
        endPoint.includes('in') ||
        endPoint.includes('out') ||
        endPoint.endsWith('center');

    if (!isValidEnd) {
        errors.push(`${prefix}: Invalid end point "${endPoint}"`);
    }

    // Check if rope ends at person (recommended)
    if (!endPoint.includes('person') && !endPoint.includes('cleat')) {
        // This is a warning, not an error, but we'll note it
        // warnings would need to be passed through
    }

    // Validate routing through pulleys - must follow OUT -> IN pattern
    const routingErrors = validateRouting(rope, components);
    if (routingErrors.length > 0) {
        errors.push(...routingErrors.map(e => `${prefix}: ${e}`));
    }

    return errors;
};

const validateRouting = (rope: RopeComponent, _components: Component[]): string[] => {
    // No routing validation needed since we use simple segments now
    return [];
};

const checkDisconnectedComponents = (components: Component[]): string[] => {
    const warnings: string[] = [];
    const ropes = components.filter((c): c is RopeComponent => c.type === ComponentType.ROPE);
    const connectedIds = new Set<string>();

    // Mark all components that have ropes connected
    ropes.forEach(rope => {
        connectedIds.add(rope.startId);
        connectedIds.add(rope.endId);
    });

    // Check for disconnected pulleys, anchors, etc.
    components.forEach(comp => {
        if (comp.type === ComponentType.ROPE) return;
        
        if (!connectedIds.has(comp.id)) {
            const label = (comp as any).label || comp.id;
            warnings.push(`Component "${label}" (${comp.type}) is not connected to any ropes`);
        }
    });

    return warnings;
};

const checkDuplicateStarts = (ropes: RopeComponent[]): string[] => {
    const warnings: string[] = [];
    const startPoints = new Map<string, number>();

    ropes.forEach(rope => {
        const start = rope.startPoint || rope.startId;
        startPoints.set(start, (startPoints.get(start) || 0) + 1);
    });

    startPoints.forEach((count, point) => {
        if (count > 1) {
            warnings.push(`${count} ropes start from the same point: ${point}`);
        }
    });

    return warnings;
};

export const formatValidationReport = (result: ValidationResult): string => {
    let report = '=== SYSTEM VALIDATION REPORT ===\n\n';
    
    report += `Status: ${result.valid ? '✓ VALID' : '✗ INVALID'}\n`;
    report += `Total Ropes: ${result.stats.totalRopes}\n`;
    report += `Valid: ${result.stats.validRopes}, Invalid: ${result.stats.invalidRopes}\n\n`;

    if (result.errors.length > 0) {
        report += '--- ERRORS ---\n';
        result.errors.forEach(err => {
            report += `  ✗ ${err}\n`;
        });
        report += '\n';
    }

    if (result.warnings.length > 0) {
        report += '--- WARNINGS ---\n';
        result.warnings.forEach(warn => {
            report += `  ⚠ ${warn}\n`;
        });
        report += '\n';
    }

    if (result.valid && result.warnings.length === 0) {
        report += '✓ System is properly configured!\n';
    }

    return report;
};
