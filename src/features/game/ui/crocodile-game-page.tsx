'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VStack } from '@/shared/ui';
import { GameSetupForm } from './game-setup-form';
import { CrocodileBoard } from './crocodile-board';
import type { CrocodilePlayer } from '../lib/crocodile';

interface CrocodileGamePageProps {
  stationId: string;
  currentUserId: string;
  members: { userId: string; nickname: string; avatarUrl: string | null }[];
}

export function CrocodileGamePage({
  stationId,
  currentUserId,
  members,
}: CrocodileGamePageProps) {
  const router = useRouter();
  const [gameConfig, setGameConfig] = useState<{
    participants: CrocodilePlayer[];
    betAmount: number;
  } | null>(null);

  if (!gameConfig) {
    return (
      <GameSetupForm
        members={members}
        currentUserId={currentUserId}
        onStart={(participants, betAmount) =>
          setGameConfig({
            participants: participants.map((p) => ({
              userId: p.userId,
              nickname: p.nickname,
            })),
            betAmount,
          })
        }
      />
    );
  }

  return (
    <VStack gap={16} className="w-full items-center">
      <CrocodileBoard
        stationId={stationId}
        participants={gameConfig.participants}
        betAmount={gameConfig.betAmount}
        onComplete={() => router.push(`/stations/${stationId}`)}
      />
    </VStack>
  );
}
