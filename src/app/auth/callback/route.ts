import { NextResponse } from 'next/server';
import { createClient } from '@/shared/api/supabase-server';

export async function GET(request: Request) {
  console.log('🚀 ~ GET ~ request.url:', request.url);
  const { searchParams, origin } = new URL(request.url);
  console.log('🚀 ~ GET ~ origin:', origin);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // 유저 프로필이 없으면 생성 (upsert로 race condition 방지)
      const kakaoMetadata = data.user.user_metadata;
      await supabase.from('users').upsert(
        {
          id: data.user.id,
          kakao_id: kakaoMetadata?.provider_id ?? null,
          nickname: kakaoMetadata?.full_name ?? kakaoMetadata?.name ?? '도파민러',
          avatar_url: kakaoMetadata?.avatar_url ?? null,
        },
        { onConflict: 'id' },
      );

      // 로그인 전 페이지로 리다이렉트 (open redirect 방지: 상대 경로만 허용)
      const next = searchParams.get('next') || '/';
      const redirectPath = next.startsWith('/') ? next : '/';
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // 인증 실패 시 로그인 페이지로
  return NextResponse.redirect(`${origin}/login`);
}
