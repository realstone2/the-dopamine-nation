'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VStack } from '@/shared/ui';
import { GameSetupForm } from './game-setup-form';
import { RandomPickBoard } from './random-pick-board';

interface RandomPickGamePageProps {
  stationId: string;
  currentUserId: string;
  members: { userId: string; nickname: string; avatarUrl: string | null }[];
}

export function RandomPickGamePage({
  stationId,
  currentUserId,
  members,
}: RandomPickGamePageProps) {
  const router = useRouter();
  const [gameConfig, setGameConfig] = useState<{
    participants: { userId: string; nickname: string }[];
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
      <RandomPickBoard
        stationId={stationId}
        participants={gameConfig.participants}
        betAmount={gameConfig.betAmount}
        onComplete={() => router.push(`/stations/${stationId}`)}
      />
    </VStack>
  );
}
