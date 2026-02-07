'use client';

import { useState, useEffect, useRef } from 'react';
import { VStack, Typography, Button } from '@/shared/ui';
import { formatDopamine } from '@/shared/lib/utils';
import { completeGame } from '../api/actions';

interface Player {
  userId: string;
  nickname: string;
}

interface RandomPickBoardProps {
  stationId: string;
  participants: Player[];
  betAmount: number;
  onComplete: () => void;
}

type Phase = 'ready' | 'spinning' | 'result';

export function RandomPickBoard({
  stationId,
  participants,
  betAmount,
  onComplete,
}: RandomPickBoardProps) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [loserId, setLoserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const targetRef = useRef(-1);

  const loser = participants.find((p) => p.userId === loserId);

  const startSpin = () => {
    targetRef.current = Math.floor(Math.random() * participants.length);
    setPhase('spinning');
  };

  useEffect(() => {
    if (phase !== 'spinning') return;

    const target = targetRef.current;
    const totalSteps = participants.length * 3 + target;
    let step = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const currentIdx = step % participants.length;
      setHighlightIndex(currentIdx);
      step++;

      if (step > totalSteps) {
        setLoserId(participants[target].userId);
        setPhase('result');
        return;
      }

      // 점진적 감속: 후반부에 느려짐
      const delay = 60 + Math.floor((step / totalSteps) * 300);
      timeoutId = setTimeout(tick, delay);
    };

    tick();
    return () => clearTimeout(timeoutId);
  }, [phase, participants]);

  const handleSaveResult = async () => {
    if (!loserId || saving || saved) return;
    setSaving(true);

    try {
      const participantResults = participants.map((p) => ({
        userId: p.userId,
        result: p.userId === loserId ? 'lose' as const : 'win' as const,
      }));

      await completeGame({
        stationId,
        gameTypeSlug: 'random-pick',
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
      {/* 참여자 리스트 */}
      <VStack gap={8} className="w-full">
        {participants.map((player, idx) => (
          <div
            key={player.userId}
            className={`
              p-4 rounded-xl text-center transition-all duration-100
              ${
                phase === 'result' && player.userId === loserId
                  ? 'bg-red-500 text-white scale-105 font-bold'
                  : idx === highlightIndex && phase === 'spinning'
                    ? 'bg-primary text-primary-foreground scale-105'
                    : 'bg-muted'
              }
            `}
          >
            <Typography
              variants="body1"
              className={
                (phase === 'result' && player.userId === loserId) ||
                (idx === highlightIndex && phase === 'spinning')
                  ? 'font-bold'
                  : ''
              }
            >
              {player.nickname}
            </Typography>
          </div>
        ))}
      </VStack>

      {/* 상태별 UI */}
      {phase === 'ready' && (
        <Button className="w-full" size="lg" onClick={startSpin}>
          뽑기 시작!
        </Button>
      )}

      {phase === 'spinning' && (
        <Typography variants="body1" className="text-muted-foreground animate-pulse">
          추첨 중...
        </Typography>
      )}

      {phase === 'result' && loser && (
        <VStack gap={12} className="w-full items-center">
          <VStack gap={4} className="items-center">
            <Typography variants="h2_bold" className="text-red-500">
              {loser.nickname}님 당첨!
            </Typography>
            <Typography variants="body2" className="text-muted-foreground">
              {formatDopamine(-betAmount)}도파민 차감
            </Typography>
          </VStack>

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
