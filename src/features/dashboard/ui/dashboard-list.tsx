import { VStack, Typography } from '@/shared/ui';
import type { MemberStats } from '../lib/calculate-stats';
import { MemberStatsCard } from './member-stats-card';

interface DashboardListProps {
  memberStats: MemberStats[];
}

export function DashboardList({ memberStats }: DashboardListProps) {
  // 도파민 수지 내림차순 정렬
  const sorted = [...memberStats].sort((a, b) => b.totalBalance - a.totalBalance);

  if (sorted.length === 0) {
    return (
      <Typography variants="body2" className="text-muted-foreground text-center">
        아직 멤버가 없습니다
      </Typography>
    );
  }

  return (
    <VStack gap={8} className="w-full">
      {sorted.map((stats, index) => (
        <MemberStatsCard key={stats.userId} stats={stats} rank={index + 1} />
      ))}
    </VStack>
  );
}
