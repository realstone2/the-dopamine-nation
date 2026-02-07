import { KakaoLoginButton } from '@/features/auth';
import { VStack, Typography } from '@/shared/ui';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <VStack gap={24} className="w-full max-w-sm px-6">
        <VStack gap={8} className="items-center">
          <Typography variants="h1_bold" as="h1">
            도파민의 민족
          </Typography>
          <Typography variants="body2" className="text-muted-foreground text-center">
            다양한 내기를 하며 도파민을 충전하는
            <br />
            당신들의 통계를 만들어드립니다
          </Typography>
        </VStack>
        <KakaoLoginButton />
      </VStack>
    </main>
  );
}
