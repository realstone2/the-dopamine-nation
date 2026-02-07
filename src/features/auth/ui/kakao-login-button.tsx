'use client';

import { signInWithKakao } from '../api/actions';
import { Button } from '@/shared/ui';

interface KakaoLoginButtonProps {
  redirectAfterLogin?: string;
}

export function KakaoLoginButton({ redirectAfterLogin }: KakaoLoginButtonProps) {
  const signInWithRedirect = signInWithKakao.bind(null, redirectAfterLogin);

  return (
    <form action={signInWithRedirect}>
      <Button size="lg" className="w-full bg-[#FEE500] text-[#191919] hover:bg-[#FEE500]/90">
        카카오로 시작하기
      </Button>
    </form>
  );
}
