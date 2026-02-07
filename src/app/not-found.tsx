import { VStack, Typography, Button } from '@/shared/ui';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <VStack gap={12} className="items-center">
        <Typography variants="h2_bold">404</Typography>
        <Typography variants="body1" className="text-muted-foreground">
          페이지를 찾을 수 없습니다
        </Typography>
        <a href="/">
          <Button>홈으로 돌아가기</Button>
        </a>
      </VStack>
    </main>
  );
}
