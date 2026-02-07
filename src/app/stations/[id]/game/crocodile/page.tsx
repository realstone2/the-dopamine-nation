import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/shared/api/supabase-server';
import { VStack, HStack, Typography, Button } from '@/shared/ui';
import { CrocodileGamePage } from '@/features/game';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CrocodileGameRoute({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: station } = await supabase
    .from('stations')
    .select('id, title')
    .eq('id', id)
    .single();

  if (!station) notFound();

  const { data: members } = await supabase
    .from('station_members')
    .select('user_id, users(nickname, avatar_url)')
    .eq('station_id', id);

  const memberList = (members ?? []).map((m) => {
    const u = m.users as unknown as { nickname: string; avatar_url: string | null } | null;
    return {
      userId: m.user_id as string,
      nickname: u?.nickname ?? '알 수 없음',
      avatarUrl: u?.avatar_url ?? null,
    };
  });

  return (
    <main className="min-h-screen p-6 max-w-lg mx-auto">
      <VStack gap={20}>
        <HStack className="justify-between w-full">
          <VStack gap={2}>
            <Typography variants="h2_bold" as="h1">
              악어이빨 게임
            </Typography>
            <Typography variants="caption" className="text-muted-foreground">
              {station.title}
            </Typography>
          </VStack>
          <a href={`/stations/${id}`}>
            <Button variant="ghost" size="sm">돌아가기</Button>
          </a>
        </HStack>

        <CrocodileGamePage
          stationId={id}
          currentUserId={user.id}
          members={memberList}
        />
      </VStack>
    </main>
  );
}
