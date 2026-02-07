import { redirect } from 'next/navigation';
import { createClient } from '@/shared/api/supabase-server';
import { signOut } from '@/features/auth';
import { CreateStationForm, StationCard } from '@/features/station';
import { VStack, HStack, Typography, Button } from '@/shared/ui';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('nickname')
    .eq('id', user.id)
    .single();

  // 유저가 속한 스테이션 목록
  const { data: memberStations } = await supabase
    .from('station_members')
    .select('station_id')
    .eq('user_id', user.id);

  const stationIds = memberStations?.map((m) => m.station_id) ?? [];

  const { data: stations } = stationIds.length > 0
    ? await supabase
        .from('stations')
        .select('*, station_members(count)')
        .in('id', stationIds)
        .order('created_at', { ascending: false })
    : { data: [] };

  return (
    <main className="min-h-screen p-6 max-w-lg mx-auto">
      <VStack gap={24}>
        <HStack className="justify-between w-full">
          <Typography variants="h2_bold" as="h1">
            {profile?.nickname ?? '도파민러'}님
          </Typography>
          <form action={signOut}>
            <Button variant="ghost" size="sm">
              로그아웃
            </Button>
          </form>
        </HStack>

        <VStack gap={12} className="w-full">
          <Typography variants="h3_bold" as="h2">
            새 스테이션
          </Typography>
          <CreateStationForm />
        </VStack>

        <VStack gap={12} className="w-full">
          <Typography variants="h3_bold" as="h2">
            내 스테이션
          </Typography>
          {stations && stations.length > 0 ? (
            stations.map((station) => (
              <StationCard
                key={station.id}
                id={station.id}
                title={station.title}
                description={station.description}
                memberCount={
                  Array.isArray(station.station_members)
                    ? station.station_members[0]?.count ?? 0
                    : 0
                }
              />
            ))
          ) : (
            <Typography variants="body2" className="text-muted-foreground">
              아직 참여 중인 스테이션이 없습니다
            </Typography>
          )}
        </VStack>
      </VStack>
    </main>
  );
}
