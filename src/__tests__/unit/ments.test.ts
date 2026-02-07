import { describe, it, expect } from 'vitest';
import { getTeaseMent, getTeaseEmoji } from '@/features/share-card/lib/ments';

describe('getTeaseMent', () => {
  it('양수 수지: 문자열 반환', () => {
    const ment = getTeaseMent(100);
    expect(typeof ment).toBe('string');
    expect(ment.length).toBeGreaterThan(0);
  });

  it('음수 수지: 문자열 반환', () => {
    const ment = getTeaseMent(-100);
    expect(typeof ment).toBe('string');
    expect(ment.length).toBeGreaterThan(0);
  });

  it('0 수지: "균형의 신" 반환', () => {
    expect(getTeaseMent(0)).toBe('균형의 신');
  });

  it('다양한 양수값에 대해 일관된 결과 (결정론적)', () => {
    const ment1 = getTeaseMent(500);
    const ment2 = getTeaseMent(500);
    expect(ment1).toBe(ment2);
  });

  it('다양한 음수값에 대해 일관된 결과 (결정론적)', () => {
    const ment1 = getTeaseMent(-300);
    const ment2 = getTeaseMent(-300);
    expect(ment1).toBe(ment2);
  });
});

describe('getTeaseEmoji', () => {
  it('양수: 😎', () => expect(getTeaseEmoji(100)).toBe('😎'));
  it('음수: 🔥', () => expect(getTeaseEmoji(-100)).toBe('🔥'));
  it('0: ⚖️', () => expect(getTeaseEmoji(0)).toBe('⚖️'));
});
