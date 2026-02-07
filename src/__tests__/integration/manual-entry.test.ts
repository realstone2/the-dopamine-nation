import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createAdminClient,
  createTestUser,
  cleanupStations,
  cleanupUsers,
} from '../helpers/supabase';

describe('Manual Entry CRUD + RLS', () => {
  const userIds: string[] = [];
  const stationIds: string[] = [];

  let userA: Awaited<ReturnType<typeof createTestUser>>;
  let userB: Awaited<ReturnType<typeof createTestUser>>;
  let userC: Awaited<ReturnType<typeof createTestUser>>; // 비멤버

  beforeAll(async () => {
    userA = await createTestUser(`manual-a-${Date.now()}@test.com`);
    userB = await createTestUser(`manual-b-${Date.now()}@test.com`);
    userC = await createTestUser(`manual-c-${Date.now()}@test.com`);
    userIds.push(userA.id, userB.id, userC.id);

    // 스테이션 + 멤버 셋업
    const admin = createAdminClient();
    const { data: station } = await admin
      .from('stations')
      .insert({ title: '수동입력 테스트', created_by: userA.id })
      .select()
      .single();

    stationIds.push(station!.id);

    await admin.from('station_members').insert([
      { station_id: station!.id, user_id: userA.id, role: 'owner' },
      { station_id: station!.id, user_id: userB.id, role: 'member' },
    ]);
  });

  afterAll(async () => {
    await cleanupStations(stationIds);
    await cleanupUsers(userIds);
  });

  it('수동 도파민 전송 생성', async () => {
    const { data, error } = await userA.client
      .from('manual_entries')
      .insert({
        station_id: stationIds[0],
        from_user: userA.id,
        to_user: userB.id,
        amount: 500,
        description: '점심 내기',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.amount).toBe(500);
    expect(data!.from_user).toBe(userA.id);
    expect(data!.to_user).toBe(userB.id);
  });

  it('멤버(userB)도 manual_entries 조회 가능', async () => {
    const { data: entries } = await userB.client
      .from('manual_entries')
      .select('amount, description')
      .eq('station_id', stationIds[0]);

    expect(entries!.length).toBeGreaterThanOrEqual(1);
    expect(entries![0].amount).toBe(500);
  });

  it('from_user가 자신이 아닌 경우 INSERT 차단 (RLS)', async () => {
    const { error } = await userA.client
      .from('manual_entries')
      .insert({
        station_id: stationIds[0],
        from_user: userB.id, // userA가 userB인 척
        to_user: userA.id,
        amount: 100,
      });

    expect(error).toBeTruthy();
  });

  it('비멤버는 manual_entries 조회 불가', async () => {
    const { data: entries } = await userC.client
      .from('manual_entries')
      .select('id')
      .eq('station_id', stationIds[0]);

    expect(entries).toHaveLength(0);
  });

  it('비멤버는 manual_entries INSERT 불가', async () => {
    const { error } = await userC.client
      .from('manual_entries')
      .insert({
        station_id: stationIds[0],
        from_user: userC.id,
        to_user: userA.id,
        amount: 100,
      });

    expect(error).toBeTruthy();
  });
});
