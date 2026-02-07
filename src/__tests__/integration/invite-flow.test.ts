import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createAdminClient,
  createTestUser,
  cleanupStations,
  cleanupUsers,
} from '../helpers/supabase';

describe('Invite Flow', () => {
  const userIds: string[] = [];
  const stationIds: string[] = [];

  let userA: Awaited<ReturnType<typeof createTestUser>>;
  let userB: Awaited<ReturnType<typeof createTestUser>>;
  let inviteCode: string;

  beforeAll(async () => {
    userA = await createTestUser(`invite-a-${Date.now()}@test.com`);
    userB = await createTestUser(`invite-b-${Date.now()}@test.com`);
    userIds.push(userA.id, userB.id);

    // userA가 스테이션 생성
    const { data: station } = await userA.client
      .from('stations')
      .insert({ title: '초대 테스트', created_by: userA.id })
      .select()
      .single();

    stationIds.push(station!.id);
    inviteCode = station!.invite_code;

    await userA.client.from('station_members').insert({
      station_id: station!.id,
      user_id: userA.id,
      role: 'owner',
    });
  });

  afterAll(async () => {
    await cleanupStations(stationIds);
    await cleanupUsers(userIds);
  });

  it('유효한 초대 코드로 station_id 조회 (RPC)', async () => {
    const { data: foundId, error } = await userB.client
      .rpc('get_station_id_by_invite_code', { code: inviteCode });

    expect(error).toBeNull();
    expect(foundId).toBe(stationIds[0]);
  });

  it('유효하지 않은 초대 코드: null 반환', async () => {
    const { data: foundId } = await userB.client
      .rpc('get_station_id_by_invite_code', { code: 'invalid-code-123' });

    expect(foundId).toBeNull();
  });

  it('초대 코드로 스테이션 참가', async () => {
    const { data: stationId } = await userB.client
      .rpc('get_station_id_by_invite_code', { code: inviteCode });

    const { error: joinError } = await userB.client
      .from('station_members')
      .insert({ station_id: stationId, user_id: userB.id, role: 'member' });

    expect(joinError).toBeNull();

    // 참가 후 스테이션 조회 가능
    const { data: stations } = await userB.client
      .from('stations')
      .select('id')
      .eq('id', stationIds[0]);

    expect(stations).toHaveLength(1);
  });

  it('중복 참가 시도: 에러 (PK 중복)', async () => {
    const { error } = await userB.client
      .from('station_members')
      .insert({ station_id: stationIds[0], user_id: userB.id, role: 'member' });

    expect(error).toBeTruthy();
    expect(error!.code).toBe('23505'); // unique_violation
  });

  it('참가 후 멤버 목록에 포함 확인', async () => {
    const { data: members } = await userA.client
      .from('station_members')
      .select('user_id')
      .eq('station_id', stationIds[0]);

    const memberIds = members!.map((m) => m.user_id);
    expect(memberIds).toContain(userA.id);
    expect(memberIds).toContain(userB.id);
  });

  it('비멤버는 초대 코드 RPC 호출은 가능하지만 스테이션 데이터 접근 불가', async () => {
    const userC = await createTestUser(`invite-c-${Date.now()}@test.com`);
    userIds.push(userC.id);

    // RPC는 SECURITY DEFINER이므로 누구나 호출 가능
    const { data: foundId, error } = await userC.client
      .rpc('get_station_id_by_invite_code', { code: inviteCode });

    expect(error).toBeNull();
    expect(foundId).toBe(stationIds[0]);

    // 하지만 스테이션 데이터는 RLS로 차단
    const { data: stations } = await userC.client
      .from('stations')
      .select('id')
      .eq('id', stationIds[0]);

    expect(stations).toHaveLength(0);
  });
});
