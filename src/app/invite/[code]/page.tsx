import Link from 'next/link';
import { createClient } from '@/shared/api/supabase-server';
import { joinStationByInviteCode } from '@/features/station';
import { VStack, Typography, Button } from '@/shared/ui';

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 미인증 유저: 로그인 후 이 페이지로 돌아오도록 안내
  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <VStack gap={16} className="items-center">
          <Typography variants="h2_bold" as="h1">
            스테이션 초대
          </Typography>
          <Typography variants="body1" className="text-muted-foreground text-center">
            초대를 수락하려면 먼저 로그인해주세요
          </Typography>
          <Link href={`/login?redirect=/invite/${code}`}>
            <Button size="lg">로그인하고 참여하기</Button>
          </Link>
        </VStack>
      </main>
    );
  }

  // 인증된 유저: 기존 참여 로직
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
