import { describe, it, expect } from 'vitest';
import {
  initCrocodileGame,
  pressTooth,
  isGameOver,
  generateTrapIndex,
  type CrocodilePlayer,
} from '@/features/game/lib/crocodile';

const PLAYERS: CrocodilePlayer[] = [
  { userId: 'u1', nickname: 'Alice' },
  { userId: 'u2', nickname: 'Bob' },
];

describe('generateTrapIndex', () => {
  it('항상 [0, teethCount) 범위 내의 값을 반환', () => {
    const teethCount = 12;
    for (let i = 0; i < 100; i++) {
      const idx = generateTrapIndex(teethCount);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(teethCount);
    }
  });

  it('100회 호출 시 최소 2가지 이상의 다른 값을 생성 (비결정적)', () => {
    const teethCount = 12;
    const values = new Set<number>();
    for (let i = 0; i < 100; i++) {
      values.add(generateTrapIndex(teethCount));
    }
    expect(values.size).toBeGreaterThanOrEqual(2);
  });

  it('teethCount=1일 때 항상 0을 반환', () => {
    for (let i = 0; i < 10; i++) {
      expect(generateTrapIndex(1)).toBe(0);
    }
  });
});

describe('initCrocodileGame', () => {
  it('기본 이빨 개수(12)로 초기화', () => {
    const state = initCrocodileGame(PLAYERS);
    expect(state.teethCount).toBe(12);
    expect(state.players).toEqual(PLAYERS);
    expect(state.pressedTeeth.size).toBe(0);
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.loserId).toBeNull();
    expect(state.trapIndex).toBeGreaterThanOrEqual(0);
    expect(state.trapIndex).toBeLessThan(12);
  });

  it('커스텀 이빨 개수로 초기화', () => {
    const state = initCrocodileGame(PLAYERS, 6);
    expect(state.teethCount).toBe(6);
    expect(state.trapIndex).toBeLessThan(6);
  });

  it('명시적 trapIndex 지정', () => {
    const state = initCrocodileGame(PLAYERS, 12, 7);
    expect(state.trapIndex).toBe(7);
  });
});

describe('pressTooth', () => {
  it('안전한 이빨: 다음 플레이어로 턴 이동', () => {
    const state = initCrocodileGame(PLAYERS, 12, 5);
    const next = pressTooth(state, 0);
    expect(next.pressedTeeth.has(0)).toBe(true);
    expect(next.currentPlayerIndex).toBe(1);
    expect(next.loserId).toBeNull();
  });

  it('함정 이빨: 현재 플레이어가 패배', () => {
    const state = initCrocodileGame(PLAYERS, 12, 5);
    const next = pressTooth(state, 5);
    expect(next.pressedTeeth.has(5)).toBe(true);
    expect(next.loserId).toBe('u1');
  });

  it('이미 눌린 이빨: 상태 변화 없음', () => {
    const state = initCrocodileGame(PLAYERS, 12, 5);
    const after1 = pressTooth(state, 0);
    const after2 = pressTooth(after1, 0);
    expect(after2).toBe(after1);
  });

  it('게임 오버 후 추가 입력 무시', () => {
    const state = initCrocodileGame(PLAYERS, 12, 5);
    const over = pressTooth(state, 5);
    const afterOver = pressTooth(over, 3);
    expect(afterOver).toBe(over);
  });

  it('3명 플레이어: 턴 순환 확인', () => {
    const threePlayers: CrocodilePlayer[] = [
      { userId: 'u1', nickname: 'A' },
      { userId: 'u2', nickname: 'B' },
      { userId: 'u3', nickname: 'C' },
    ];
    const state = initCrocodileGame(threePlayers, 12, 11);
    const s1 = pressTooth(state, 0);
    expect(s1.currentPlayerIndex).toBe(1);
    const s2 = pressTooth(s1, 1);
    expect(s2.currentPlayerIndex).toBe(2);
    const s3 = pressTooth(s2, 2);
    expect(s3.currentPlayerIndex).toBe(0);
  });
});

describe('isGameOver', () => {
  it('게임 진행 중: false', () => {
    const state = initCrocodileGame(PLAYERS, 12, 5);
    expect(isGameOver(state)).toBe(false);
  });

  it('패배자 결정 후: true', () => {
    const state = initCrocodileGame(PLAYERS, 12, 5);
    const over = pressTooth(state, 5);
    expect(isGameOver(over)).toBe(true);
  });
});
