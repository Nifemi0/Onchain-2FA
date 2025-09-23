import { computeCode, getNextRotationBlock, getRotationKey, isRotationBlock } from '../codeGenerator';

describe('Code Generator', () => {
  const testSeed = '12345';
  
  describe('computeCode', () => {
    it('should generate consistent codes for the same input', () => {
      const code1 = computeCode(testSeed, 100);
      const code2 = computeCode(testSeed, 100);
      expect(code1).toBe(code2);
    });

    it('should generate different codes for different block numbers', () => {
      const code1 = computeCode(testSeed, 100);
      const code2 = computeCode(testSeed, 105);
      expect(code1).not.toBe(code2);
    });

    it('should generate codes within valid range', () => {
      for (let i = 0; i < 100; i++) {
        const code = computeCode(testSeed, i * 10);
        expect(code).toBeGreaterThanOrEqual(0);
        expect(code).toBeLessThan(1000000);
      }
    });

    it('should generate same code for blocks in same rotation interval', () => {
      const code1 = computeCode(testSeed, 100);
      const code2 = computeCode(testSeed, 104);
      expect(code1).toBe(code2);
    });

    it('should generate different code for blocks in different rotation intervals', () => {
      const code1 = computeCode(testSeed, 100);
      const code2 = computeCode(testSeed, 105);
      expect(code1).not.toBe(code2);
    });
  });

  describe('getNextRotationBlock', () => {
    it('should return correct next rotation block', () => {
      expect(getNextRotationBlock(100)).toBe(105);
      expect(getNextRotationBlock(104)).toBe(105);
      expect(getNextRotationBlock(105)).toBe(110);
    });
  });

  describe('getRotationKey', () => {
    it('should return correct rotation key', () => {
      expect(getRotationKey(100)).toBe(20);
      expect(getRotationKey(104)).toBe(20);
      expect(getRotationKey(105)).toBe(21);
    });
  });

  describe('isRotationBlock', () => {
    it('should correctly identify rotation blocks', () => {
      expect(isRotationBlock(100)).toBe(true);
      expect(isRotationBlock(105)).toBe(true);
      expect(isRotationBlock(110)).toBe(true);
      expect(isRotationBlock(101)).toBe(false);
      expect(isRotationBlock(104)).toBe(false);
    });
  });
});