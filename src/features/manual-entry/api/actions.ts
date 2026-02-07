'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/shared/api/supabase-server';

interface CreateManualEntryParams {
  stationId: string;
  toUserId: string;
  amount: number;
  description?: string;
}

export async function createManualEntry({
  stationId,
  toUserId,
  amount,
  description,
}: CreateManualEntryParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('인증이 필요합니다');
  if (amount <= 0) throw new Error('금액은 0보다 커야 합니다');
  if (user.id === toUserId) throw new Error('자신에게 보낼 수 없습니다');

  // 보내는 사람, 받는 사람 모두 스테이션 멤버인지 검증
  const { data: members } = await supabase
    .from('station_members')
    .select('user_id')
    .eq('station_id', stationId)
    .in('user_id', [user.id, toUserId]);

  if (!members || members.length !== 2) {
    throw new Error('양쪽 모두 스테이션 멤버여야 합니다');
  }

  const { error } = await supabase.from('manual_entries').insert({
    station_id: stationId,
    from_user: user.id,
    to_user: toUserId,
    amount,
    description: description?.trim() || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/stations/${stationId}`);
}
