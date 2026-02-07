import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/shared/api/supabase-server';
import { VStack, HStack, Typography, Button } from '@/shared/ui';
import { InviteLinkCopy } from '@/features/station/ui/invite-link-copy';
import { DashboardList, calculateMemberStats } from '@/features/dashboard';
import { ManualEntryForm } from '@/features/manual-entry';
import { ShareCardList } from '@/features/share-card';

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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

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

        {/* 게임 시작 */}
        <VStack gap={12} className="w-full">
          <Typography variants="h3_bold" as="h2">
            게임하기
          </Typography>
          <HStack gap={8} className="w-full">
            <a href={`/stations/${id}/game/crocodile`} className="flex-1">
              <Button variant="outline" className="w-full h-20 text-lg">
                악어이빨
              </Button>
            </a>
            <a href={`/stations/${id}/game/random-pick`} className="flex-1">
              <Button variant="outline" className="w-full h-20 text-lg">
                랜덤뽑기
              </Button>
            </a>
          </HStack>
        </VStack>

        {/* 수동 도파민 입력 */}
        <VStack gap={12} className="w-full">
          <Typography variants="h3_bold" as="h2">
            수동 입력
          </Typography>
          <ManualEntryForm
            stationId={id}
            currentUserId={user.id}
            members={(members as { user_id: string; users: unknown }[]).map((m) => {
              const u = m.users as { nickname: string } | null;
              return {
                userId: m.user_id,
                nickname: u?.nickname ?? '알 수 없음',
              };
            })}
          />
        </VStack>

        {/* 놀림 카드 공유 */}
        <VStack gap={12} className="w-full">
          <Typography variants="h3_bold" as="h2">
            놀림 카드
          </Typography>
          <ShareCardList
            stationId={id}
            memberStats={memberStats.map((s) => ({
              userId: s.userId,
              nickname: s.nickname,
              totalBalance: s.totalBalance,
            }))}
          />
        </VStack>
      </VStack>
    </main>
  );
}
