import { VStack, Typography } from '@/shared/ui';

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <VStack gap={8} className="items-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <Typography variants="body2" className="text-muted-foreground">
          로딩 중...
        </Typography>
      </VStack>
    </main>
  );
}
