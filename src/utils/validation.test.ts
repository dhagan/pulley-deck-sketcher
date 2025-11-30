import { describe, it, expect } from 'vitest';
import { validateSystem, formatValidationReport } from './validation';
import { SystemState, ComponentType, RopeComponent, PulleyComponent, AnchorComponent, PersonComponent } from '../types';

describe('Validation System', () => {
    describe('validateSystem', () => {
        it('should validate empty system', () => {
            const system: SystemState = {
                components: [],
                selectedId: null,
                gridSize: 20,
                snapToGrid: true,
                showRopeArrows: true
            };

            const result = validateSystem(system);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.stats.totalRopes).toBe(0);
        });

        it('should detect missing start component', () => {
            const rope: RopeComponent = {
                id: 'rope-1',
                type: ComponentType.ROPE,
                startId: 'nonexistent',
                endId: 'anchor-1',
                startPoint: 'anchor-1-center',
                endPoint: 'anchor-2-center'
            };

            const anchor: AnchorComponent = {
                id: 'anchor-1',
                type: ComponentType.ANCHOR,
                position: { x: 100, y: 100 }
            };

            const system: SystemState = {
                components: [rope, anchor],
                selectedId: null,
                gridSize: 20,
                snapToGrid: true,
                showRopeArrows: true
            };

            const result = validateSystem(system);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('Start component not found');
        });

        it('should detect missing end component', () => {
            const rope: RopeComponent = {
                id: 'rope-1',
                type: ComponentType.ROPE,
                startId: 'anchor-1',
                endId: 'nonexistent',
                startPoint: 'anchor-1-center',
                endPoint: 'nonexistent-center'
            };

            const anchor: AnchorComponent = {
                id: 'anchor-1',
                type: ComponentType.ANCHOR,
                position: { x: 100, y: 100 }
            };

            const system: SystemState = {
                components: [rope, anchor],
                selectedId: null,
                gridSize: 20,
                snapToGrid: true,
                showRopeArrows: true
            };

            const result = validateSystem(system);
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('End component not found');
        });

        it('should reject rope connecting to pulley center', () => {
            const pulley: PulleyComponent = {
                id: 'pulley-1',
                type: ComponentType.PULLEY,
                position: { x: 200, y: 200 },
                diameter: 30,
                sheaves: 1,
                hasBecket: false,
                rotation: 0
            };

            const anchor: AnchorComponent = {
                id: 'anchor-1',
                type: ComponentType.ANCHOR,
                position: { x: 100, y: 100 }
            };

            const rope: RopeComponent = {
                id: 'rope-1',
                type: ComponentType.ROPE,
                startId: 'anchor-1',
                endId: 'pulley-1',
                startPoint: 'anchor-1-center',
                endPoint: 'pulley-1-center' // INVALID!
            };

            const system: SystemState = {
                components: [rope, pulley, anchor],
                selectedId: null,
                gridSize: 20,
                snapToGrid: true,
                showRopeArrows: true
            };

            const result = validateSystem(system);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('cannot end at pulley center'))).toBe(true);
        });

        it('should accept valid anchor to pulley IN connection', () => {
            const pulley: PulleyComponent = {
                id: 'pulley-1',
                type: ComponentType.PULLEY,
                position: { x: 200, y: 200 },
                diameter: 30,
                sheaves: 1,
                hasBecket: false,
                rotation: 0
            };

            const anchor: AnchorComponent = {
                id: 'anchor-1',
                type: ComponentType.ANCHOR,
                position: { x: 100, y: 100 }
            };

            const rope: RopeComponent = {
                id: 'rope-1',
                type: ComponentType.ROPE,
                startId: 'anchor-1',
                endId: 'pulley-1',
                startPoint: 'anchor-1-center',
                endPoint: 'pulley-1-sheave-0-in'
            };

            const system: SystemState = {
                components: [rope, pulley, anchor],
                selectedId: null,
                gridSize: 20,
                snapToGrid: true,
                showRopeArrows: true
            };

            const result = validateSystem(system);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject OUT to OUT connection', () => {
            const pulley1: PulleyComponent = {
                id: 'pulley-1',
                type: ComponentType.PULLEY,
                position: { x: 200, y: 200 },
                diameter: 30,
                sheaves: 1,
                hasBecket: false,
                rotation: 0
            };

            const pulley2: PulleyComponent = {
                id: 'pulley-2',
                type: ComponentType.PULLEY,
                position: { x: 300, y: 200 },
                diameter: 30,
                sheaves: 1,
                hasBecket: false,
                rotation: 0
            };

            const rope: RopeComponent = {
                id: 'rope-1',
                type: ComponentType.ROPE,
                startId: 'pulley-1',
                endId: 'pulley-2',
                startPoint: 'pulley-1-sheave-0-out',
                endPoint: 'pulley-2-sheave-0-out' // INVALID!
            };

            const system: SystemState = {
                components: [rope, pulley1, pulley2],
                selectedId: null,
                gridSize: 20,
                snapToGrid: true,
                showRopeArrows: true
            };

            const result = validateSystem(system);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('Cannot connect OUT to OUT'))).toBe(true);
        });

        it('should reject IN to IN connection', () => {
            const pulley1: PulleyComponent = {
                id: 'pulley-1',
                type: ComponentType.PULLEY,
                position: { x: 200, y: 200 },
                diameter: 30,
                sheaves: 1,
                hasBecket: false,
                rotation: 0
            };

            const pulley2: PulleyComponent = {
                id: 'pulley-2',
                type: ComponentType.PULLEY,
                position: { x: 300, y: 200 },
                diameter: 30,
                sheaves: 1,
                hasBecket: false,
                rotation: 0
            };

            const rope: RopeComponent = {
                id: 'rope-1',
                type: ComponentType.ROPE,
                startId: 'pulley-1',
                endId: 'pulley-2',
                startPoint: 'pulley-1-sheave-0-in',
                endPoint: 'pulley-2-sheave-0-in' // INVALID!
            };

            const system: SystemState = {
                components: [rope, pulley1, pulley2],
                selectedId: null,
                gridSize: 20,
                snapToGrid: true,
                showRopeArrows: true
            };

            const result = validateSystem(system);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('Cannot connect IN to IN'))).toBe(true);
        });

        it('should accept valid OUT to IN connection', () => {
            const pulley1: PulleyComponent = {
                id: 'pulley-1',
                type: ComponentType.PULLEY,
                position: { x: 200, y: 200 },
                diameter: 30,
                sheaves: 1,
                hasBecket: false,
                rotation: 0
            };

            const pulley2: PulleyComponent = {
                id: 'pulley-2',
                type: ComponentType.PULLEY,
                position: { x: 300, y: 200 },
                diameter: 30,
                sheaves: 1,
                hasBecket: false,
                rotation: 0
            };

            const rope: RopeComponent = {
                id: 'rope-1',
                type: ComponentType.ROPE,
                startId: 'pulley-1',
                endId: 'pulley-2',
                startPoint: 'pulley-1-sheave-0-out',
                endPoint: 'pulley-2-sheave-0-in'
            };

            const system: SystemState = {
                components: [rope, pulley1, pulley2],
                selectedId: null,
                gridSize: 20,
                snapToGrid: true,
                showRopeArrows: true
            };

            const result = validateSystem(system);
            expect(result.valid).toBe(true);
        });

        it('should warn about disconnected components', () => {
            const pulley: PulleyComponent = {
                id: 'pulley-1',
                type: ComponentType.PULLEY,
                position: { x: 200, y: 200 },
                diameter: 30,
                sheaves: 1,
                hasBecket: false,
                rotation: 0
            };

            const anchor: AnchorComponent = {
                id: 'anchor-1',
                type: ComponentType.ANCHOR,
                position: { x: 100, y: 100 }
            };

            const system: SystemState = {
                components: [pulley, anchor],
                selectedId: null,
                gridSize: 20,
                snapToGrid: true,
                showRopeArrows: true
            };

            const result = validateSystem(system);
            expect(result.warnings.length).toBeGreaterThan(0);
            expect(result.warnings.some(w => w.includes('not connected'))).toBe(true);
        });
    });

    describe('formatValidationReport', () => {
        it('should format valid system report', () => {
            const result = {
                valid: true,
                errors: [],
                warnings: [],
                stats: {
                    totalRopes: 5,
                    validRopes: 5,
                    invalidRopes: 0
                }
            };

            const report = formatValidationReport(result);
            expect(report).toContain('✓ VALID');
            expect(report).toContain('Total Ropes: 5');
            expect(report).toContain('Valid: 5, Invalid: 0');
            expect(report).toContain('properly configured');
        });

        it('should format invalid system report with errors', () => {
            const result = {
                valid: false,
                errors: ['Error 1', 'Error 2'],
                warnings: ['Warning 1'],
                stats: {
                    totalRopes: 3,
                    validRopes: 1,
                    invalidRopes: 2
                }
            };

            const report = formatValidationReport(result);
            expect(report).toContain('✗ INVALID');
            expect(report).toContain('ERRORS');
            expect(report).toContain('Error 1');
            expect(report).toContain('Error 2');
            expect(report).toContain('WARNINGS');
            expect(report).toContain('Warning 1');
        });
    });
});
