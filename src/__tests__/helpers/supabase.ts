import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** RLS를 우회하는 Admin 클라이언트 (service_role) */
export function createAdminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** 특정 유저의 access_token으로 인증된 클라이언트 (RLS 적용) */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface TestUser {
  id: string;
  email: string;
  accessToken: string;
  client: SupabaseClient;
}

/** 테스트용 유저 생성 (Admin API) + public.users upsert */
export async function createTestUser(email: string): Promise<TestUser> {
  const admin = createAdminClient();

  // Auth 유저 생성
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: 'test-password-123!',
    email_confirm: true,
  });

  if (authError) throw new Error(`Failed to create auth user: ${authError.message}`);

  const userId = authData.user.id;

  // public.users 테이블에 프로필 생성
  const { error: profileError } = await admin.from('users').upsert({
    id: userId,
    kakao_id: `test_${userId.slice(0, 8)}`,
    nickname: email.split('@')[0],
    avatar_url: null,
  }, { onConflict: 'id' });

  if (profileError) throw new Error(`Failed to create user profile: ${profileError.message}`);

  // 로그인하여 access_token 획득
  const { data: session, error: signInError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  // access_token을 위해 직접 signIn
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: signIn, error: loginError } = await anonClient.auth.signInWithPassword({
    email,
    password: 'test-password-123!',
  });

  if (loginError) throw new Error(`Failed to sign in: ${loginError.message}`);

  const accessToken = signIn.session!.access_token;

  return {
    id: userId,
    email,
    accessToken,
    client: createUserClient(accessToken),
  };
}

/** 테스트 데이터 정리 — stations cascade 삭제로 관련 데이터 자동 정리 */
export async function cleanupStations(stationIds: string[]): Promise<void> {
  if (stationIds.length === 0) return;
  const admin = createAdminClient();
  await admin.from('stations').delete().in('id', stationIds);
}

/** 테스트 유저 삭제 */
export async function cleanupUsers(userIds: string[]): Promise<void> {
  if (userIds.length === 0) return;
  const admin = createAdminClient();
  // public.users는 auth.users ON DELETE CASCADE로 자동 삭제
  for (const id of userIds) {
    await admin.auth.admin.deleteUser(id);
  }
}
