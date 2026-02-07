import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createAdminClient,
  createTestUser,
  cleanupStations,
  cleanupUsers,
} from '../helpers/supabase';

describe('Station CRUD + RLS', () => {
  const userIds: string[] = [];
  const stationIds: string[] = [];

  let userA: Awaited<ReturnType<typeof createTestUser>>;
  let userB: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    userA = await createTestUser(`test-a-${Date.now()}@test.com`);
    userB = await createTestUser(`test-b-${Date.now()}@test.com`);
    userIds.push(userA.id, userB.id);
  });

  afterAll(async () => {
    await cleanupStations(stationIds);
    await cleanupUsers(userIds);
  });

  it('스테이션 생성: INSERT + SELECT(RETURNING) 성공', async () => {
    const { data, error } = await userA.client
      .from('stations')
      .insert({ title: '테스트 스테이션', created_by: userA.id })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.title).toBe('테스트 스테이션');
    expect(data!.invite_code).toBeTruthy();

    stationIds.push(data!.id);

    // owner로 멤버 추가
    const { error: memberError } = await userA.client
      .from('station_members')
      .insert({ station_id: data!.id, user_id: userA.id, role: 'owner' });

    expect(memberError).toBeNull();
  });

  it('스테이션 조회: 멤버만 SELECT 가능', async () => {
    // userA는 멤버 → 조회 가능
    const { data: stations } = await userA.client
      .from('stations')
      .select('id, title')
      .eq('id', stationIds[0]);

    expect(stations).toHaveLength(1);
    expect(stations![0].title).toBe('테스트 스테이션');

    // userB는 비멤버 → 조회 불가
    const { data: noStations } = await userB.client
      .from('stations')
      .select('id, title')
      .eq('id', stationIds[0]);

    expect(noStations).toHaveLength(0);
  });

  it('초대 코드로 참가: RPC + INSERT station_members', async () => {
    // admin으로 초대 코드 조회 (RLS 우회)
    const admin = createAdminClient();
    const { data: station } = await admin
      .from('stations')
      .select('invite_code')
      .eq('id', stationIds[0])
      .single();

    expect(station?.invite_code).toBeTruthy();

    // userB가 RPC로 station_id 조회
    const { data: foundId, error: rpcError } = await userB.client
      .rpc('get_station_id_by_invite_code', { code: station!.invite_code });

    expect(rpcError).toBeNull();
    expect(foundId).toBe(stationIds[0]);

    // userB가 멤버로 가입
    const { error: joinError } = await userB.client
      .from('station_members')
      .insert({ station_id: stationIds[0], user_id: userB.id, role: 'member' });

    expect(joinError).toBeNull();

    // 이제 userB도 스테이션 조회 가능
    const { data: stations } = await userB.client
      .from('stations')
      .select('id')
      .eq('id', stationIds[0]);

    expect(stations).toHaveLength(1);
  });

  it('station_members: 같은 스테이션 멤버 조회 가능', async () => {
    const { data: members } = await userB.client
      .from('station_members')
      .select('user_id, role')
      .eq('station_id', stationIds[0]);

    expect(members).toHaveLength(2);
    const roles = members!.map((m) => m.role).sort();
    expect(roles).toEqual(['member', 'owner']);
  });

  it('스테이션 삭제: 비owner 실패, owner 성공', async () => {
    // userB(member)가 삭제 시도 → 실패
    const { error: deleteError } = await userB.client
      .from('stations')
      .delete()
      .eq('id', stationIds[0]);

    // RLS가 row를 찾지 못하므로 에러 없이 0건 삭제
    expect(deleteError).toBeNull();

    // 스테이션이 여전히 존재하는지 확인
    const admin = createAdminClient();
    const { data: stillExists } = await admin
      .from('stations')
      .select('id')
      .eq('id', stationIds[0])
      .single();

    expect(stillExists).toBeTruthy();

    // userA(owner)가 삭제 → 성공
    const { error: ownerDeleteError } = await userA.client
      .from('stations')
      .delete()
      .eq('id', stationIds[0]);

    expect(ownerDeleteError).toBeNull();

    // 삭제 확인
    const { data: deleted } = await admin
      .from('stations')
      .select('id')
      .eq('id', stationIds[0])
      .single();

    expect(deleted).toBeNull();

    // cleanup에서 이미 삭제됨
    stationIds.pop();
  });
});
