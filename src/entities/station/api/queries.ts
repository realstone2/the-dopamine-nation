import { queryOptions } from '@tanstack/react-query';
import { createClient } from '@/shared/api/supabase-client';

const supabase = createClient();

export const stationQueries = {
  all: ['station'] as const,
  detail: (id: string) =>
    queryOptions({
      queryKey: [...stationQueries.all, id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('stations')
          .select('*, station_members(count)')
          .eq('id', id)
          .single();
        if (error) throw error;
        return data;
      },
    }),
  list: () =>
    queryOptions({
      queryKey: [...stationQueries.all, 'list'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('stations')
          .select('*, station_members(count)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      },
    }),
  members: (stationId: string) =>
    queryOptions({
      queryKey: [...stationQueries.all, stationId, 'members'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('station_members')
          .select('*, users(*)')
          .eq('station_id', stationId);
        if (error) throw error;
        return data;
      },
    }),
};
