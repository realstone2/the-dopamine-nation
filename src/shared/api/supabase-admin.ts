import { createClient } from '@supabase/supabase-js';

/**
 * RLS를 우회하는 Admin 클라이언트 (service_role).
 * OG 이미지 생성 등 공개 데이터 접근이 필요한 서버 전용 API에서 사용.
 * 주의: 절대 클라이언트에 노출하면 안 됨.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
