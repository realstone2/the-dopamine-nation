import { redirect } from 'next/navigation';
import { createClient } from '@/shared/api/supabase-server';
import { signOut } from '@/features/auth';
import { VStack, Typography, Button } from '@/shared/ui';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('nickname, avatar_url')
    .eq('id', user.id)
    .single();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <VStack gap={16} className="items-center">
        <Typography variants="h2_bold" as="h1">
          안녕하세요, {profile?.nickname ?? '도파민러'}님!
        </Typography>
        <Typography variants="body1" className="text-muted-foreground">
          스테이션을 만들거나 초대를 받아 시작하세요
        </Typography>
        <form action={signOut}>
          <Button variant="outline" size="sm">
            로그아웃
          </Button>
        </form>
      </VStack>
    </main>
  );
}
