'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/shared/api/supabase-server';

interface CompleteGameParams {
  stationId: string;
  gameTypeSlug: string;
  betAmount: number;
  participants: { userId: string; result: 'win' | 'lose' }[];
}

export async function completeGame({
  stationId,
  gameTypeSlug,
  betAmount,
  participants,
}: CompleteGameParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('인증이 필요합니다');

  // 모든 참여자가 스테이션 멤버인지 검증
  const participantIds = participants.map((p) => p.userId);
  const { data: memberRows } = await supabase
    .from('station_members')
    .select('user_id')
    .eq('station_id', stationId)
    .in('user_id', participantIds);

  if (!memberRows || memberRows.length !== participantIds.length) {
    throw new Error('모든 참여자가 스테이션 멤버여야 합니다');
  }

  // 게임 타입 조회
  const { data: gameType } = await supabase
    .from('game_types')
    .select('id')
    .eq('slug', gameTypeSlug)
    .single();

  if (!gameType) throw new Error('유효하지 않은 게임 타입입니다');

  // 도파민 분배 계산
  const loserCount = participants.filter((p) => p.result === 'lose').length;
  const winnerCount = participants.filter((p) => p.result === 'win').length;

  if (loserCount === 0 || winnerCount === 0) {
    throw new Error('승자와 패자가 모두 있어야 합니다');
  }

  const totalLoss = betAmount * loserCount;
  const winPerPerson = Math.floor(totalLoss / winnerCount);

  // 세션 생성
  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .insert({
      station_id: stationId,
      game_type_id: gameType.id,
      bet_amount: betAmount,
      status: 'completed',
      created_by: user.id,
    })
    .select('id')
    .single();

  if (sessionError) throw new Error(sessionError.message);

  // 참여자 + 결과 기록
  const participantRows = participants.map((p) => ({
    session_id: session.id,
    user_id: p.userId,
    result: p.result,
    dopamine_change: p.result === 'lose' ? -betAmount : winPerPerson,
  }));

  const { error: participantError } = await supabase
    .from('game_participants')
    .insert(participantRows);

  if (participantError) {
    // 롤백: 참여자 기록 실패 시 세션 삭제
    await supabase.from('game_sessions').delete().eq('id', session.id);
    throw new Error('게임 결과 저장에 실패했습니다');
  }

  revalidatePath(`/stations/${stationId}`);
  return { sessionId: session.id };
}
