'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/shared/api/supabase-server';

export async function createStation(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('인증이 필요합니다');

  const title = formData.get('title') as string;
  const description = formData.get('description') as string | null;

  if (!title?.trim()) throw new Error('스테이션 이름을 입력해주세요');

  // 스테이션 생성
  const { data: station, error } = await supabase
    .from('stations')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // 생성자를 owner로 추가
  const { error: memberError } = await supabase.from('station_members').insert({
    station_id: station.id,
    user_id: user.id,
    role: 'owner',
  });

  if (memberError) {
    // 롤백: 멤버 추가 실패 시 스테이션 삭제
    await supabase.from('stations').delete().eq('id', station.id);
    throw new Error('스테이션 생성에 실패했습니다');
  }

  revalidatePath('/');
  redirect(`/stations/${station.id}`);
}

export async function joinStationByInviteCode(inviteCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('인증이 필요합니다');

  // 초대 코드로 스테이션 찾기 (RPC: 비멤버도 조회 가능)
  const { data: stationId, error: stationError } = await supabase
    .rpc('get_station_id_by_invite_code', { code: inviteCode });

  if (stationError || !stationId) throw new Error('유효하지 않은 초대 코드입니다');

  const station = { id: stationId as string };

  // 이미 멤버인지 확인
  const { data: existing } = await supabase
    .from('station_members')
    .select('station_id')
    .eq('station_id', station.id)
    .eq('user_id', user.id)
    .single();

  if (!existing) {
    await supabase.from('station_members').insert({
      station_id: station.id,
      user_id: user.id,
      role: 'member',
    });
  }

  revalidatePath('/');
  redirect(`/stations/${station.id}`);
}

export async function deleteStation(stationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('인증이 필요합니다');

  // owner인지 확인
  const { data: membership } = await supabase
    .from('station_members')
    .select('role')
    .eq('station_id', stationId)
    .eq('user_id', user.id)
    .single();

  if (membership?.role !== 'owner') throw new Error('방장만 삭제할 수 있습니다');

  const { error } = await supabase
    .from('stations')
    .delete()
    .eq('id', stationId);

  if (error) throw new Error(error.message);

  revalidatePath('/');
  redirect('/');
}

export async function leaveStation(stationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('인증이 필요합니다');

  // owner는 탈퇴 불가 (스테이션 삭제를 사용해야 함)
  const { data: membership } = await supabase
    .from('station_members')
    .select('role')
    .eq('station_id', stationId)
    .eq('user_id', user.id)
    .single();

  if (membership?.role === 'owner') {
    throw new Error('방장은 스테이션을 나갈 수 없습니다. 스테이션을 삭제해주세요.');
  }

  await supabase
    .from('station_members')
    .delete()
    .eq('station_id', stationId)
    .eq('user_id', user.id);

  revalidatePath('/');
  redirect('/');
}
