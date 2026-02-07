import { Card, CardHeader, CardContent } from '@/shared/ui';
import { HStack, VStack, Typography } from '@/shared/ui';
import { formatDopamine } from '@/shared/lib/utils';
import type { MemberStats } from '../lib/calculate-stats';

interface MemberStatsCardProps {
  stats: MemberStats;
  rank: number;
}

function getBalanceColor(balance: number) {
  if (balance > 0) return 'text-emerald-600';
  if (balance < 0) return 'text-red-500';
  return 'text-muted-foreground';
}

export function MemberStatsCard({ stats, rank }: MemberStatsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <HStack gap={12}>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
              {stats.avatarUrl ? (
                <img
                  src={stats.avatarUrl}
                  alt={stats.nickname}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                stats.nickname.charAt(0)
              )}
            </div>
            <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
              {rank}
            </div>
          </div>
          <VStack gap={0}>
            <HStack gap={4}>
              <Typography variants="body1" className="font-semibold">
                {stats.nickname}
              </Typography>
              {stats.role === 'owner' && (
                <Typography variants="caption" className="text-muted-foreground">
                  방장
                </Typography>
              )}
            </HStack>
            <Typography variants="caption" className={getBalanceColor(stats.totalBalance)}>
              {formatDopamine(stats.totalBalance)}도파민
            </Typography>
          </VStack>
        </HStack>
      </CardHeader>
      <CardContent>
        <HStack className="justify-between">
          <StatItem label="승" value={stats.wins} color="text-emerald-600" />
          <StatItem label="패" value={stats.losses} color="text-red-500" />
          <StatItem label="게임" value={formatDopamine(stats.gameBalance)} />
          <StatItem label="수동" value={formatDopamine(stats.manualBalance)} />
        </HStack>
      </CardContent>
    </Card>
  );
}

function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <VStack gap={2} className="items-center">
      <Typography variants="caption" className="text-muted-foreground">
        {label}
      </Typography>
      <Typography variants="body2" className={color ? `font-semibold ${color}` : 'font-semibold'}>
        {value}
      </Typography>
    </VStack>
  );
}
