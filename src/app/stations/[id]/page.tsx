import { notFound } from 'next/navigation';
import { createClient } from '@/shared/api/supabase-server';
import { VStack, HStack, Typography, Button } from '@/shared/ui';
import { InviteLinkCopy } from '@/features/station/ui/invite-link-copy';
import { DashboardList, calculateMemberStats } from '@/features/dashboard';

interface StationPageProps {
  params: Promise<{ id: string }>;
}

export default async function StationPage({ params }: StationPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: station } = await supabase
    .from('stations')
    .select('*')
    .eq('id', id)
    .single();

  if (!station) notFound();

  // 병렬로 데이터 fetching
  const [membersResult, gameParticipantsResult, manualEntriesResult] = await Promise.all([
    // 멤버 목록 + 유저 정보
    supabase
      .from('station_members')
      .select('*, users(nickname, avatar_url)')
      .eq('station_id', id),
    // 완료된 게임 참여자 결과
    supabase
      .from('game_participants')
      .select('user_id, result, dopamine_change, game_sessions!inner(station_id, status)')
      .eq('game_sessions.station_id', id)
      .eq('game_sessions.status', 'completed'),
    // 수동 도파민 입력
    supabase
      .from('manual_entries')
      .select('from_user, to_user, amount')
      .eq('station_id', id),
  ]);

  const members = membersResult.data ?? [];
  const gameParticipants = (gameParticipantsResult.data ?? []) as {
    user_id: string;
    result: string | null;
    dopamine_change: number;
  }[];
  const manualEntries = (manualEntriesResult.data ?? []) as {
    from_user: string;
    to_user: string;
    amount: number;
  }[];

  const memberStats = calculateMemberStats(
    members as {
      user_id: string;
      role: string;
      users: { nickname: string; avatar_url: string | null } | null;
    }[],
    gameParticipants,
    manualEntries,
  );

  return (
    <main className="min-h-screen p-6 max-w-lg mx-auto">
      <VStack gap={24}>
        <VStack gap={8}>
          <HStack className="justify-between w-full">
            <Typography variants="h2_bold" as="h1">
              {station.title}
            </Typography>
            <a href="/">
              <Button variant="ghost" size="sm">홈</Button>
            </a>
          </HStack>
          {station.description && (
            <Typography variants="body2" className="text-muted-foreground">
              {station.description}
            </Typography>
          )}
        </VStack>

        <InviteLinkCopy inviteCode={station.invite_code} />

        {/* 대시보드 */}
        <VStack gap={12} className="w-full">
          <HStack className="justify-between w-full">
            <Typography variants="h3_bold" as="h2">
              대시보드
            </Typography>
            <Typography variants="caption" className="text-muted-foreground">
              멤버 {members.length}명
            </Typography>
          </HStack>
          <DashboardList memberStats={memberStats} />
        </VStack>

        <VStack gap={8} className="w-full">
          <Typography variants="body2" className="text-muted-foreground text-center">
            게임 기능은 곧 추가됩니다
          </Typography>
        </VStack>
      </VStack>
    </main>
  );
}
