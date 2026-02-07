import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createAdminClient,
  createTestUser,
  cleanupStations,
  cleanupUsers,
} from '../helpers/supabase';
import { calculateMemberStats } from '@/features/dashboard/lib/calculate-stats';

describe('OG Card Data Fetching (Admin Client)', () => {
  const userIds: string[] = [];
  const stationIds: string[] = [];

  let userA: Awaited<ReturnType<typeof createTestUser>>;
  let userB: Awaited<ReturnType<typeof createTestUser>>;
  let admin: ReturnType<typeof createAdminClient>;

  beforeAll(async () => {
    admin = createAdminClient();
    userA = await createTestUser(`og-a-${Date.now()}@test.com`);
    userB = await createTestUser(`og-b-${Date.now()}@test.com`);
    userIds.push(userA.id, userB.id);

    // 스테이션 + 멤버 생성 (admin)
    const { data: station } = await admin
      .from('stations')
      .insert({ title: 'OG 테스트', created_by: userA.id })
      .select()
      .single();

    stationIds.push(station!.id);

    await admin.from('station_members').insert([
      { station_id: station!.id, user_id: userA.id, role: 'owner' },
      { station_id: station!.id, user_id: userB.id, role: 'member' },
    ]);

    // 완료된 게임 생성
    const { data: gameType } = await admin
      .from('game_types')
      .select('id')
      .eq('slug', 'crocodile')
      .single();

    const { data: session } = await admin
      .from('game_sessions')
      .insert({
        station_id: station!.id,
        game_type_id: gameType!.id,
        bet_amount: 1000,
        status: 'completed',
        created_by: userA.id,
      })
      .select('id')
      .single();

    await admin.from('game_participants').insert([
      { session_id: session!.id, user_id: userA.id, result: 'win', dopamine_change: 1000 },
      { session_id: session!.id, user_id: userB.id, result: 'lose', dopamine_change: -1000 },
    ]);
  });

  afterAll(async () => {
    await cleanupStations(stationIds);
    await cleanupUsers(userIds);
  });

  it('admin 클라이언트로 스테이션 데이터 조회 (RLS 우회)', async () => {
    const { data: station, error } = await admin
      .from('stations')
      .select('title')
      .eq('id', stationIds[0])
      .single();

    expect(error).toBeNull();
    expect(station!.title).toBe('OG 테스트');
  });

  it('admin 클라이언트로 멤버+유저 조인 조회', async () => {
    const { data: members } = await admin
      .from('station_members')
      .select('*, users(nickname, avatar_url)')
      .eq('station_id', stationIds[0]);

    expect(members).toHaveLength(2);
  });

  it('admin 클라이언트로 게임 참여자 조회', async () => {
    const { data: participants } = await admin
      .from('game_participants')
      .select('user_id, result, dopamine_change, game_sessions!inner(station_id, status)')
      .eq('game_sessions.station_id', stationIds[0])
      .eq('game_sessions.status', 'completed');

    expect(participants!.length).toBeGreaterThanOrEqual(2);
  });

  it('전체 OG 데이터 -> calculateMemberStats 통합 흐름', async () => {
    const [membersResult, gameResult, manualResult] = await Promise.all([
      admin
        .from('station_members')
        .select('*, users(nickname, avatar_url)')
        .eq('station_id', stationIds[0]),
      admin
        .from('game_participants')
        .select('user_id, result, dopamine_change, game_sessions!inner(station_id, status)')
        .eq('game_sessions.station_id', stationIds[0])
        .eq('game_sessions.status', 'completed'),
      admin
        .from('manual_entries')
        .select('from_user, to_user, amount')
        .eq('station_id', stationIds[0]),
    ]);

    const members = (membersResult.data ?? []) as {
      user_id: string;
      role: string;
      users: { nickname: string; avatar_url: string | null } | null;
    }[];
    const gameParticipants = (gameResult.data ?? []) as {
      user_id: string;
      result: string | null;
      dopamine_change: number;
    }[];
    const manualEntries = (manualResult.data ?? []) as {
      from_user: string;
      to_user: string;
      amount: number;
    }[];

    const stats = calculateMemberStats(members, gameParticipants, manualEntries);
    expect(stats).toHaveLength(2);

    const userAStat = stats.find((s) => s.userId === userA.id)!;
    expect(userAStat.wins).toBe(1);
    expect(userAStat.gameBalance).toBe(1000);

    const userBStat = stats.find((s) => s.userId === userB.id)!;
    expect(userBStat.losses).toBe(1);
    expect(userBStat.gameBalance).toBe(-1000);
  });

  it('존재하지 않는 stationId: 빈 결과', async () => {
    const { data } = await admin
      .from('stations')
      .select('title')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();

    expect(data).toBeNull();
  });

  it('존재하지 않는 userId: stats에서 찾을 수 없음', async () => {
    const [membersResult, gameResult, manualResult] = await Promise.all([
      admin
        .from('station_members')
        .select('*, users(nickname, avatar_url)')
        .eq('station_id', stationIds[0]),
      admin
        .from('game_participants')
        .select('user_id, result, dopamine_change, game_sessions!inner(station_id, status)')
        .eq('game_sessions.station_id', stationIds[0])
        .eq('game_sessions.status', 'completed'),
      admin
        .from('manual_entries')
        .select('from_user, to_user, amount')
        .eq('station_id', stationIds[0]),
    ]);

    const stats = calculateMemberStats(
      (membersResult.data ?? []) as any[],
      (gameResult.data ?? []) as any[],
      (manualResult.data ?? []) as any[],
    );

    const fakeUserStat = stats.find((s) => s.userId === 'nonexistent-user-id');
    expect(fakeUserStat).toBeUndefined();
  });
});
