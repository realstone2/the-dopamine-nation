import { notFound } from 'next/navigation';
import { createClient } from '@/shared/api/supabase-server';
import { VStack, HStack, Typography, Button } from '@/shared/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui';
import { InviteLinkCopy } from '@/features/station/ui/invite-link-copy';

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

  // 멤버 목록 + 유저 정보
  const { data: members } = await supabase
    .from('station_members')
    .select('*, users(nickname, avatar_url)')
    .eq('station_id', id);

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

        <VStack gap={12} className="w-full">
          <Typography variants="h3_bold" as="h2">
            멤버 ({members?.length ?? 0}명)
          </Typography>
          {members?.map((member) => {
            const user = member.users as { nickname: string; avatar_url: string | null } | null;
            return (
              <Card key={member.user_id}>
                <CardHeader>
                  <HStack gap={12}>
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                      {user?.nickname?.charAt(0) ?? '?'}
                    </div>
                    <VStack gap={2}>
                      <CardTitle className="text-base">
                        {user?.nickname ?? '알 수 없음'}
                      </CardTitle>
                      <Typography variants="caption">
                        {member.role === 'owner' ? '방장' : '멤버'}
                      </Typography>
                    </VStack>
                  </HStack>
                </CardHeader>
              </Card>
            );
          })}
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
