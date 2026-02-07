import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createAdminClient } from '@/shared/api/supabase-admin';
import { calculateMemberStats } from '@/features/dashboard';
import { getTeaseMent, getTeaseEmoji } from '@/features/share-card/lib/ments';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get('userId');
  const stationId = searchParams.get('stationId');

  if (!userId || !stationId) {
    return new Response('Missing userId or stationId', { status: 400 });
  }

  const supabase = createAdminClient();

  // 병렬로 데이터 fetching
  const [stationResult, membersResult, gameResult, manualResult, userResult] = await Promise.all([
    supabase.from('stations').select('title').eq('id', stationId).single(),
    supabase
      .from('station_members')
      .select('*, users(nickname, avatar_url)')
      .eq('station_id', stationId),
    supabase
      .from('game_participants')
      .select('user_id, result, dopamine_change, game_sessions!inner(station_id, status)')
      .eq('game_sessions.station_id', stationId)
      .eq('game_sessions.status', 'completed'),
    supabase
      .from('manual_entries')
      .select('from_user, to_user, amount')
      .eq('station_id', stationId),
    supabase.from('users').select('nickname, avatar_url').eq('id', userId).single(),
  ]);

  if (!stationResult.data || !userResult.data) {
    return new Response('Not found', { status: 404 });
  }

  const members = (membersResult.data ?? []) as {
    user_id: string;
    role: string;
    users: { nickname: string; avatar_url: string | null } | null;
  }[];
  const gameParticipants = (gameResult.data ?? []) as {
    user_id: string;
    result: string | null;
    dopamine_change: number;
  }[];
  const manualEntries = (manualResult.data ?? []) as {
    from_user: string;
    to_user: string;
    amount: number;
  }[];

  const allStats = calculateMemberStats(members, gameParticipants, manualEntries);
  const stats = allStats.find((s) => s.userId === userId);

  if (!stats) {
    return new Response('User not found in station', { status: 404 });
  }

  const nickname = userResult.data.nickname;
  const stationTitle = stationResult.data.title;
  const ment = getTeaseMent(stats.totalBalance);
  const emoji = getTeaseEmoji(stats.totalBalance);
  const balanceStr = stats.totalBalance > 0
    ? `+${stats.totalBalance.toLocaleString()}`
    : stats.totalBalance.toLocaleString();

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#09090b',
          color: '#fafafa',
          padding: '48px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 상단: 스테이션명 */}
        <div style={{ display: 'flex', fontSize: '20px', color: '#a1a1aa', marginBottom: '24px' }}>
          {stationTitle}
        </div>

        {/* 닉네임 + 멘트 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', fontSize: '48px', fontWeight: 'bold' }}>
            {nickname}
          </div>
          <div style={{ display: 'flex', fontSize: '28px', color: '#a1a1aa' }}>
            {emoji} {ment}
          </div>
        </div>

        {/* 통계 */}
        <div
          style={{
            display: 'flex',
            gap: '48px',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', fontSize: '18px', color: '#a1a1aa' }}>승리</div>
            <div style={{ display: 'flex', fontSize: '36px', fontWeight: 'bold', color: '#10b981' }}>
              {stats.wins}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', fontSize: '18px', color: '#a1a1aa' }}>패배</div>
            <div style={{ display: 'flex', fontSize: '36px', fontWeight: 'bold', color: '#ef4444' }}>
              {stats.losses}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', fontSize: '18px', color: '#a1a1aa' }}>도파민 수지</div>
            <div
              style={{
                display: 'flex',
                fontSize: '36px',
                fontWeight: 'bold',
                color: stats.totalBalance > 0 ? '#10b981' : stats.totalBalance < 0 ? '#ef4444' : '#a1a1aa',
              }}
            >
              {balanceStr}
            </div>
          </div>
        </div>

        {/* 하단 */}
        <div
          style={{
            display: 'flex',
            marginTop: 'auto',
            fontSize: '16px',
            color: '#52525b',
          }}
        >
          도파민의 민족
        </div>
      </div>
    ),
    {
      width: 800,
      height: 420,
    },
  );
}
