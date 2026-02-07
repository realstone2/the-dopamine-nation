import { describe, it, expect } from 'vitest';
import { calculateMemberStats } from '@/features/dashboard/lib/calculate-stats';

const MEMBERS = [
  { user_id: 'u1', role: 'owner', users: { nickname: 'Alice', avatar_url: null } },
  { user_id: 'u2', role: 'member', users: { nickname: 'Bob', avatar_url: null } },
];

describe('calculateMemberStats', () => {
  it('게임 + 수동 입력 없는 경우: 모든 값 0', () => {
    const stats = calculateMemberStats(MEMBERS, [], []);
    expect(stats).toHaveLength(2);
    expect(stats[0]).toMatchObject({
      userId: 'u1',
      wins: 0,
      losses: 0,
      gameBalance: 0,
      manualBalance: 0,
      totalBalance: 0,
    });
  });

  it('게임 결과 반영', () => {
    const gameParticipants = [
      { user_id: 'u1', result: 'win', dopamine_change: 1000 },
      { user_id: 'u2', result: 'lose', dopamine_change: -1000 },
    ];
    const stats = calculateMemberStats(MEMBERS, gameParticipants, []);
    const alice = stats.find((s) => s.userId === 'u1')!;
    const bob = stats.find((s) => s.userId === 'u2')!;
    expect(alice.wins).toBe(1);
    expect(alice.gameBalance).toBe(1000);
    expect(bob.losses).toBe(1);
    expect(bob.gameBalance).toBe(-1000);
  });

  it('수동 입력 반영', () => {
    const manualEntries = [
      { from_user: 'u1', to_user: 'u2', amount: 500 },
    ];
    const stats = calculateMemberStats(MEMBERS, [], manualEntries);
    const alice = stats.find((s) => s.userId === 'u1')!;
    const bob = stats.find((s) => s.userId === 'u2')!;
    expect(alice.manualBalance).toBe(-500);
    expect(bob.manualBalance).toBe(500);
    expect(alice.totalBalance).toBe(-500);
    expect(bob.totalBalance).toBe(500);
  });

  it('게임 + 수동 합산 totalBalance', () => {
    const gameParticipants = [
      { user_id: 'u1', result: 'win', dopamine_change: 1000 },
      { user_id: 'u2', result: 'lose', dopamine_change: -1000 },
    ];
    const manualEntries = [
      { from_user: 'u1', to_user: 'u2', amount: 300 },
    ];
    const stats = calculateMemberStats(MEMBERS, gameParticipants, manualEntries);
    const alice = stats.find((s) => s.userId === 'u1')!;
    expect(alice.totalBalance).toBe(700); // 1000 - 300
    const bob = stats.find((s) => s.userId === 'u2')!;
    expect(bob.totalBalance).toBe(-700); // -1000 + 300
  });

  it('users가 null인 멤버: 닉네임 "알 수 없음"', () => {
    const membersWithNull = [
      { user_id: 'u1', role: 'owner', users: null },
    ];
    const stats = calculateMemberStats(membersWithNull, [], []);
    expect(stats[0].nickname).toBe('알 수 없음');
  });

  it('여러 게임 결과 누적', () => {
    const gameParticipants = [
      { user_id: 'u1', result: 'win', dopamine_change: 500 },
      { user_id: 'u1', result: 'lose', dopamine_change: -200 },
      { user_id: 'u1', result: 'win', dopamine_change: 300 },
    ];
    const stats = calculateMemberStats(MEMBERS, gameParticipants, []);
    const alice = stats.find((s) => s.userId === 'u1')!;
    expect(alice.wins).toBe(2);
    expect(alice.losses).toBe(1);
    expect(alice.gameBalance).toBe(600); // 500 - 200 + 300
  });

  it('역할(role)이 올바르게 전달됨', () => {
    const stats = calculateMemberStats(MEMBERS, [], []);
    const alice = stats.find((s) => s.userId === 'u1')!;
    const bob = stats.find((s) => s.userId === 'u2')!;
    expect(alice.role).toBe('owner');
    expect(bob.role).toBe('member');
  });
});
