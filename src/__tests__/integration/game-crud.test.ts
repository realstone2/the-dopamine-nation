import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createAdminClient,
  createTestUser,
  cleanupStations,
  cleanupUsers,
} from '../helpers/supabase';

describe('Game CRUD + RLS', () => {
  const userIds: string[] = [];
  const stationIds: string[] = [];

  let userA: Awaited<ReturnType<typeof createTestUser>>;
  let userB: Awaited<ReturnType<typeof createTestUser>>;
  let userC: Awaited<ReturnType<typeof createTestUser>>; // 비멤버
  let gameTypeId: number;

  beforeAll(async () => {
    userA = await createTestUser(`game-a-${Date.now()}@test.com`);
    userB = await createTestUser(`game-b-${Date.now()}@test.com`);
    userC = await createTestUser(`game-c-${Date.now()}@test.com`);
    userIds.push(userA.id, userB.id, userC.id);

    // 스테이션 생성 + 멤버 추가 (admin으로)
    const admin = createAdminClient();
    const { data: station } = await admin
      .from('stations')
      .insert({ title: '게임 테스트 스테이션', created_by: userA.id })
      .select()
      .single();

    stationIds.push(station!.id);

    await admin.from('station_members').insert([
      { station_id: station!.id, user_id: userA.id, role: 'owner' },
      { station_id: station!.id, user_id: userB.id, role: 'member' },
    ]);

    // 게임 타입 조회
    const { data: gameType } = await admin
      .from('game_types')
      .select('id')
      .eq('slug', 'crocodile')
      .single();

    gameTypeId = gameType!.id;
  });

  afterAll(async () => {
    await cleanupStations(stationIds);
    await cleanupUsers(userIds);
  });

  it('게임 세션 생성 + 참여자 기록', async () => {
    const betAmount = 1000;

    // 세션 생성
    const { data: session, error: sessionError } = await userA.client
      .from('game_sessions')
      .insert({
        station_id: stationIds[0],
        game_type_id: gameTypeId,
        bet_amount: betAmount,
        status: 'completed',
        created_by: userA.id,
      })
      .select('id')
      .single();

    expect(sessionError).toBeNull();
    expect(session).toBeTruthy();

    // 참여자 기록 — userA: win, userB: lose
    const winAmount = betAmount; // 1:1이므로 전액
    const { error: participantError } = await userA.client
      .from('game_participants')
      .insert([
        {
          session_id: session!.id,
          user_id: userA.id,
          result: 'win',
          dopamine_change: winAmount,
        },
        {
          session_id: session!.id,
          user_id: userB.id,
          result: 'lose',
          dopamine_change: -betAmount,
        },
      ]);

    expect(participantError).toBeNull();

    // 참여자 조회
    const { data: participants } = await userA.client
      .from('game_participants')
      .select('user_id, result, dopamine_change')
      .eq('session_id', session!.id);

    expect(participants).toHaveLength(2);

    const winner = participants!.find((p) => p.result === 'win');
    const loser = participants!.find((p) => p.result === 'lose');
    expect(winner?.dopamine_change).toBe(1000);
    expect(loser?.dopamine_change).toBe(-1000);
  });

  it('비멤버는 게임 세션 조회 불가', async () => {
    const { data: sessions } = await userC.client
      .from('game_sessions')
      .select('id')
      .eq('station_id', stationIds[0]);

    expect(sessions).toHaveLength(0);
  });

  it('비멤버는 게임 참여자 조회 불가', async () => {
    const { data: participants } = await userC.client
      .from('game_participants')
      .select('id');

    expect(participants).toHaveLength(0);
  });

  it('멤버(userB)도 같은 스테이션 게임 세션 조회 가능', async () => {
    const { data: sessions } = await userB.client
      .from('game_sessions')
      .select('id, bet_amount')
      .eq('station_id', stationIds[0]);

    expect(sessions!.length).toBeGreaterThanOrEqual(1);
    expect(sessions![0].bet_amount).toBe(1000);
  });
});
