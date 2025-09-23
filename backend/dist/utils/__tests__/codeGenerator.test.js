"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const codeGenerator_1 = require("../codeGenerator");
describe('Code Generator', () => {
    const testSeed = '12345';
    describe('computeCode', () => {
        it('should generate consistent codes for the same input', () => {
            const code1 = (0, codeGenerator_1.computeCode)(testSeed, 100);
            const code2 = (0, codeGenerator_1.computeCode)(testSeed, 100);
            expect(code1).toBe(code2);
        });
        it('should generate different codes for different block numbers', () => {
            const code1 = (0, codeGenerator_1.computeCode)(testSeed, 100);
            const code2 = (0, codeGenerator_1.computeCode)(testSeed, 105);
            expect(code1).not.toBe(code2);
        });
        it('should generate codes within valid range', () => {
            for (let i = 0; i < 100; i++) {
                const code = (0, codeGenerator_1.computeCode)(testSeed, i * 10);
                expect(code).toBeGreaterThanOrEqual(0);
                expect(code).toBeLessThan(1000000);
            }
        });
        it('should generate same code for blocks in same rotation interval', () => {
            const code1 = (0, codeGenerator_1.computeCode)(testSeed, 100);
            const code2 = (0, codeGenerator_1.computeCode)(testSeed, 104);
            expect(code1).toBe(code2);
        });
        it('should generate different code for blocks in different rotation intervals', () => {
            const code1 = (0, codeGenerator_1.computeCode)(testSeed, 100);
            const code2 = (0, codeGenerator_1.computeCode)(testSeed, 105);
            expect(code1).not.toBe(code2);
        });
    });
    describe('getNextRotationBlock', () => {
        it('should return correct next rotation block', () => {
            expect((0, codeGenerator_1.getNextRotationBlock)(100)).toBe(105);
            expect((0, codeGenerator_1.getNextRotationBlock)(104)).toBe(105);
            expect((0, codeGenerator_1.getNextRotationBlock)(105)).toBe(110);
        });
    });
    describe('getRotationKey', () => {
        it('should return correct rotation key', () => {
            expect((0, codeGenerator_1.getRotationKey)(100)).toBe(20);
            expect((0, codeGenerator_1.getRotationKey)(104)).toBe(20);
            expect((0, codeGenerator_1.getRotationKey)(105)).toBe(21);
        });
    });
    describe('isRotationBlock', () => {
        it('should correctly identify rotation blocks', () => {
            expect((0, codeGenerator_1.isRotationBlock)(100)).toBe(true);
            expect((0, codeGenerator_1.isRotationBlock)(105)).toBe(true);
            expect((0, codeGenerator_1.isRotationBlock)(110)).toBe(true);
            expect((0, codeGenerator_1.isRotationBlock)(101)).toBe(false);
            expect((0, codeGenerator_1.isRotationBlock)(104)).toBe(false);
        });
    });
});
//# sourceMappingURL=codeGenerator.test.js.map