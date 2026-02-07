'use client';

import { VStack, Typography, Button } from '@/shared/ui';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <VStack gap={12} className="items-center">
        <Typography variants="h2_bold">오류 발생</Typography>
        <Typography variants="body1" className="text-muted-foreground">
          문제가 발생했습니다. 다시 시도해주세요.
        </Typography>
        <Button onClick={reset}>다시 시도</Button>
      </VStack>
    </main>
  );
}
