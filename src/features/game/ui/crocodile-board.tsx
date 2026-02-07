'use client';

import { useState } from 'react';
import { VStack, HStack, Typography, Button } from '@/shared/ui';
import { formatDopamine } from '@/shared/lib/utils';
import { initCrocodileGame, pressTooth, isGameOver } from '../lib/crocodile';
import { completeGame } from '../api/actions';
import type { CrocodilePlayer, CrocodileState } from '../lib/crocodile';

interface CrocodileBoardProps {
  stationId: string;
  participants: CrocodilePlayer[];
  betAmount: number;
  onComplete: () => void;
}

export function CrocodileBoard({
  stationId,
  participants,
  betAmount,
  onComplete,
}: CrocodileBoardProps) {
  const [game, setGame] = useState<CrocodileState>(() =>
    initCrocodileGame(participants),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentPlayer = game.players[game.currentPlayerIndex];
  const gameOver = isGameOver(game);
  const loser = gameOver
    ? game.players.find((p) => p.userId === game.loserId)
    : null;

  const handlePressTooth = (index: number) => {
    if (gameOver) return;
    setGame((prev) => {
      if (prev.pressedTeeth.has(index)) return prev;
      return pressTooth(prev, index);
    });
  };

  const handleSaveResult = async () => {
    if (!gameOver || saving || saved) return;
    setSaving(true);

    try {
      const participantResults = game.players.map((p) => ({
        userId: p.userId,
        result: p.userId === game.loserId ? 'lose' as const : 'win' as const,
      }));

      await completeGame({
        stationId,
        gameTypeSlug: 'crocodile',
        betAmount,
        participants: participantResults,
      });
      setSaved(true);
    } catch {
      alert('결과 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <VStack gap={20} className="w-full items-center">
      {/* 현재 차례 / 결과 */}
      {gameOver ? (
        <VStack gap={4} className="items-center">
          <Typography variants="h2_bold" className="text-red-500">
            {loser?.nickname}님 패배!
          </Typography>
          <Typography variants="body2" className="text-muted-foreground">
            {formatDopamine(-betAmount)}도파민 차감
          </Typography>
        </VStack>
      ) : (
        <VStack gap={4} className="items-center">
          <Typography variants="body1" className="text-muted-foreground">
            현재 차례
          </Typography>
          <Typography variants="h3_bold">{currentPlayer.nickname}</Typography>
        </VStack>
      )}

      {/* 이빨 그리드 */}
      <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
        {Array.from({ length: game.teethCount }, (_, i) => {
          const isPressed = game.pressedTeeth.has(i);
          const isTrap = gameOver && i === game.trapIndex;

          return (
            <button
              key={i}
              onClick={() => handlePressTooth(i)}
              disabled={isPressed || gameOver}
              className={`
                aspect-square rounded-lg text-lg font-bold transition-all
                ${
                  isTrap
                    ? 'bg-red-500 text-white scale-95'
                    : isPressed
                      ? 'bg-muted text-muted-foreground scale-95'
                      : 'bg-primary/10 hover:bg-primary/20 text-primary hover:scale-105 active:scale-95'
                }
              `}
            >
              {isTrap ? '💀' : isPressed ? '✓' : '🦷'}
            </button>
          );
        })}
      </div>

      {/* 참여자 턴 인디케이터 */}
      <HStack gap={8} className="flex-wrap justify-center">
        {game.players.map((player, idx) => (
          <div
            key={player.userId}
            className={`px-3 py-1 rounded-full text-sm ${
              gameOver && player.userId === game.loserId
                ? 'bg-red-500/10 text-red-500 font-bold'
                : !gameOver && idx === game.currentPlayerIndex
                  ? 'bg-primary text-primary-foreground font-bold'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {player.nickname}
          </div>
        ))}
      </HStack>

      {/* 게임 오버 액션 */}
      {gameOver && (
        <VStack gap={8} className="w-full">
          {!saved ? (
            <Button
              className="w-full"
              size="lg"
              onClick={handleSaveResult}
              disabled={saving}
            >
              {saving ? '저장 중...' : '결과 저장하기'}
            </Button>
          ) : (
            <VStack gap={8} className="w-full">
              <Typography variants="body2" className="text-emerald-600 text-center">
                결과가 저장되었습니다
              </Typography>
              <Button className="w-full" variant="outline" onClick={onComplete}>
                스테이션으로 돌아가기
              </Button>
            </VStack>
          )}
        </VStack>
      )}
    </VStack>
  );
}
