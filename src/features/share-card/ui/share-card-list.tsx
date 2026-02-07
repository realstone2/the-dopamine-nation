'use client';

import { useState } from 'react';
import { VStack, HStack, Typography, Button } from '@/shared/ui';
import { Card, CardContent } from '@/shared/ui';
import { getTeaseMent, getTeaseEmoji } from '../lib/ments';
import { formatDopamine } from '@/shared/lib/utils';

interface MemberStat {
  userId: string;
  nickname: string;
  totalBalance: number;
}

interface ShareCardListProps {
  stationId: string;
  memberStats: MemberStat[];
}

export function ShareCardList({ stationId, memberStats }: ShareCardListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (userId: string) => {
    const url = `${window.location.origin}/api/og/card?userId=${userId}&stationId=${stationId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(userId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <VStack gap={8} className="w-full">
      {memberStats.map((stat) => (
        <Card key={stat.userId}>
          <CardContent className="py-3">
            <HStack className="justify-between">
              <VStack gap={2}>
                <Typography variants="body2" className="font-semibold">
                  {stat.nickname}
                </Typography>
                <Typography variants="caption" className="text-muted-foreground">
                  {getTeaseEmoji(stat.totalBalance)} {getTeaseMent(stat.totalBalance)}
                  {' · '}{formatDopamine(stat.totalBalance)}도파민
                </Typography>
              </VStack>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(stat.userId)}
              >
                {copiedId === stat.userId ? '복사됨!' : '공유'}
              </Button>
            </HStack>
          </CardContent>
        </Card>
      ))}
    </VStack>
  );
}
