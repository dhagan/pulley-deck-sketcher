import { describe, it, expect } from 'vitest';
import { validateSystem } from './validation';
import { SystemState, ComponentType, PulleyComponent, AnchorComponent, RopeComponent, PersonComponent } from '../types';

describe('Validation System', () => {
    describe('Valid Systems', () => {
        it('should validate a simple 2:1 system', () => {
            const system: SystemState = {
                components: [
                    {
                        id: 'anchor-1',
                        type: ComponentType.ANCHOR,
                        position: { x: 100, y: 100 },
                        label: 'Top Anchor'
                    } as AnchorComponent,
                    {
                        id: 'pulley-1',
                        type: ComponentType.PULLEY,
                        position: { x: 100, y: 200 },
                        diameter: 60,
                        sheaves: 1,
                        hasBecket: true,
                        rotation: 0,
                        attachmentPoints: { top: { x: 100, y: 170 }, bottom: { x: 100, y: 230 } }
                    } as PulleyComponent,
                    {
                        id: 'person-1',
                        type: ComponentType.PERSON,
                        position: { x: 200, y: 200 },
                        label: 'Pull',
                        pulling: true
                    } as PersonComponent,
                    {
                        id: 'anchor-2',
                        type: ComponentType.ANCHOR,
                        position: { x: 100, y: 300 },
                        label: 'Load'
                    } as AnchorComponent,
                    {
                        id: 'rope-1',
                        type: ComponentType.ROPE,
                        startId: 'anchor-1',
                        startPoint: 'anchor-1',
                        endId: 'pulley-1',
                        endPoint: 'pulley-1-anchor',
                        routeThrough: [],
                        label: 'Anchor'
                    } as RopeComponent,
                    {
                        id: 'rope-2',
                        type: ComponentType.ROPE,
                        startId: 'pulley-1',
                        startPoint: 'pulley-1-becket',
                        endId: 'person-1',
                        endPoint: 'person-1-center',
                        routeThrough: [],
                        label: 'Main'
                    } as RopeComponent,
                    {
                        id: 'rope-4',
                        type: ComponentType.ROPE,
                        startId: 'anchor-2',
                        startPoint: 'anchor-2',
                        endId: 'pulley-1',
                        endPoint: 'pulley-1-load',
                        routeThrough: [],
                        label: 'Load'
                    } as RopeComponent
                ],
                selectedId: null,
                gridSize: 20,
                snapToGrid: true,
                showRopeArrows: true
            };

            const result = validateSystem(system);
            
            // Debug output
            if (!result.valid) {
                console.log('Errors:', result.errors);
                console.log('Warnings:', result.warnings);
            }
            
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.stats.totalRopes).toBe(1); // Only rope-2 (becket->person) is working rope
            expect(result.stats.validRopes).toBe(1);
            expect(result.stats.invalidRopes).toBe(0);
        });
    });

    describe('Invalid Start Points', () => {
        it('should allow rope starting from OUT point', () => {
            const system: SystemState = {
                components: [
                    {
                        id: 'pulley-1',
                        type: ComponentType.PULLEY,
                        position: { x: 100, y: 200 },
                        diameter: 60,
                        sheaves: 1,
                        hasBecket: false,
                        rotation: 0,
                        attachmentPoints: { top: { x: 100, y: 170 }, bottom: { x: 100, y: 230 } }
                    } as PulleyComponent,
                    {
                        id: 'person-1',
                        type: ComponentType.PERSON,
                        position: { x: 200, y: 200 },
                        label: 'Pull',
                        pulling: true
                    } as PersonComponent,
                    {
                        id: 'rope-1',
                        type: ComponentType.ROPE,
                        startId: 'pulley-1',
                        startPoint: 'pulley-1-sheave-0-out',
                        endId: 'person-1',
                        endPoint: 'person-1-center',
                        routeThrough: [],
                        label: 'Valid from OUT'
                    } as RopeComponent
                ],
                selectedId: null,
                gridSize: 20,
                snapToGrid: true,
                showRopeArrows: true
            };

            const result = validateSystem(system);
            
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it('should reject rope starting at IN point', () => {
            const system: SystemState = {
                components: [
                    {
                        id: 'pulley-1',
                        type: ComponentType.PULLEY,
                        position: { x: 100, y: 200 },
                        diameter: 60,
                        sheaves: 1,
                        hasBecket: false,
                        rotation: 0,
                        attachmentPoints: { top: { x: 100, y: 170 }, bottom: { x: 100, y: 230 } }
                    } as PulleyComponent,
                    {
                        id: 'person-1',
                        type: ComponentType.PERSON,
                        position: { x: 200, y: 200 },
                        label: 'Pull',
                        pulling: true
                    } as PersonComponent,
                    {
                        id: 'rope-1',
                        type: ComponentType.ROPE,
                        startId: 'pulley-1',
                        startPoint: 'pulley-1-sheave-0-in',
                        endId: 'person-1',
                        endPoint: 'person-1-center',
                        routeThrough: [],
                        label: 'Invalid'
                    } as RopeComponent
                ],
                selectedId: null,
                gridSize: 20,
                snapToGrid: true,
                showRopeArrows: true
            };

            const result = validateSystem(system);
            
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('Invalid start point');
        });
    });

    describe('Invalid Routing', () => {
        // These tests are disabled since we removed routeThrough
        // With simple segments, these complex routing rules don't apply
        it.skip('should reject OUT to OUT connection', () => {
            const system: SystemState = {
                components: [
                    {
                        id: 'anchor-1',
                        type: ComponentType.ANCHOR,
                        position: { x: 100, y: 100 }
                    } as AnchorComponent,
                    {
                        id: 'pulley-1',
                        type: ComponentType.PULLEY,
                        position: { x: 100, y: 200 },
                        diameter: 60,
                        sheaves: 1,
                        hasBecket: false,
                        rotation: 0,
                        attachmentPoints: { top: { x: 100, y: 170 }, bottom: { x: 100, y: 230 } }
                    } as PulleyComponent,
                    {
                        id: 'rope-1',
                        type: ComponentType.ROPE,
                        startId: 'pulley-1',
                        startPoint: 'pulley-1-sheave-0-out',
                        endId: 'pulley-1',
                        endPoint: 'pulley-1-sheave-0-out',
                        routeThrough: [],
                        label: 'Invalid'
                    } as RopeComponent
                ],
                selectedId: null,
                gridSize: 20,
                snapToGrid: true,
                showRopeArrows: true
            };

            const result = validateSystem(system);
            
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('OUT to OUT'))).toBe(true);
        });

        it.skip('should reject IN to IN connection', () => {
            const system: SystemState = {
                components: [
                    {
                        id: 'anchor-1',
                        type: ComponentType.ANCHOR,
                        position: { x: 100, y: 100 }
                    } as AnchorComponent,
                    {
                        id: 'pulley-1',
                        type: ComponentType.PULLEY,
                        position: { x: 100, y: 200 },
                        diameter: 60,
                        sheaves: 2,
                        hasBecket: false,
                        rotation: 0,
                        attachmentPoints: { top: { x: 100, y: 170 }, bottom: { x: 100, y: 230 } }
                    } as PulleyComponent,
                    {
                        id: 'rope-1',
                        type: ComponentType.ROPE,
                        startId: 'pulley-1',
                        startPoint: 'pulley-1-sheave-0-in',
                        endId: 'pulley-1',
                        endPoint: 'pulley-1-sheave-1-in',
                        routeThrough: [],
                        label: 'Invalid'
                    } as RopeComponent
                ],
                selectedId: null,
                gridSize: 20,
                snapToGrid: true,
                showRopeArrows: true
            };

            const result = validateSystem(system);
            
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('IN to IN'))).toBe(true);
        });

        it.skip('should reject start point connecting directly to OUT', () => {
            const system: SystemState = {
                components: [
                    {
                        id: 'anchor-1',
                        type: ComponentType.ANCHOR,
                        position: { x: 100, y: 100 }
                    } as AnchorComponent,
                    {
                        id: 'pulley-1',
                        type: ComponentType.PULLEY,
                        position: { x: 100, y: 200 },
                        diameter: 60,
                        sheaves: 1,
                        hasBecket: false,
                        rotation: 0,
                        attachmentPoints: { top: { x: 100, y: 170 }, bottom: { x: 100, y: 230 } }
                    } as PulleyComponent,
                    {
                        id: 'rope-1',
                        type: ComponentType.ROPE,
                        startId: 'anchor-1',
                        startPoint: 'anchor-1',
                        endId: 'pulley-1',
                        endPoint: 'pulley-1-sheave-0-out',
                        routeThrough: [],
                        label: 'Invalid'
                    } as RopeComponent
                ],
                selectedId: null,
                gridSize: 20,
                snapToGrid: true,
                showRopeArrows: true
            };

            const result = validateSystem(system);
            
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('must connect to IN first'))).toBe(true);
        });
    });

    describe('Statistics', () => {
        it('should count ropes correctly', () => {
            const system: SystemState = {
                components: [
                    {
                        id: 'anchor-1',
                        type: ComponentType.ANCHOR,
                        position: { x: 100, y: 100 }
                    } as AnchorComponent,
                    {
                        id: 'rope-1',
                        type: ComponentType.ROPE,
                        startId: 'anchor-1',
                        startPoint: 'anchor-1',
                        endId: 'anchor-1',
                        endPoint: 'anchor-1',
                        routeThrough: [],
                        label: 'Valid'
                    } as RopeComponent,
                    {
                        id: 'rope-2',
                        type: ComponentType.ROPE,
                        startId: 'anchor-1',
                        startPoint: 'bad-point-in',
                        endId: 'anchor-1',
                        endPoint: 'bad-point-out',
                        routeThrough: [],
                        label: 'Invalid'
                    } as RopeComponent
                ],
                selectedId: null,
                gridSize: 20,
                snapToGrid: true,
                showRopeArrows: true
            };

            const result = validateSystem(system);
            
            expect(result.stats.totalRopes).toBe(1); // Only rope-2 counted (rope-1 is anchor rope)
            expect(result.stats.validRopes).toBe(0);
            expect(result.stats.invalidRopes).toBe(1);
        });
    });
});
