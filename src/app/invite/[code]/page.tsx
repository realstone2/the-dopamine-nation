import { joinStationByInviteCode } from '@/features/station';
import { VStack, Typography, Button } from '@/shared/ui';

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;

  async function handleJoin() {
    'use server';
    await joinStationByInviteCode(code);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <VStack gap={16} className="items-center">
        <Typography variants="h2_bold" as="h1">
          스테이션 초대
        </Typography>
        <Typography variants="body1" className="text-muted-foreground">
          초대를 수락하고 스테이션에 참여하세요
        </Typography>
        <form action={handleJoin}>
          <Button size="lg">참여하기</Button>
        </form>
      </VStack>
    </main>
  );
}
