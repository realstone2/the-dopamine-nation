'use client';

import { useState } from 'react';
import { Button, Input } from '@/shared/ui';
import { VStack, HStack, Typography } from '@/shared/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui';

interface Member {
  userId: string;
  nickname: string;
  avatarUrl: string | null;
}

interface GameSetupFormProps {
  members: Member[];
  currentUserId: string;
  onStart: (participants: Member[], betAmount: number) => void;
}

export function GameSetupForm({ members, currentUserId, onStart }: GameSetupFormProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set([currentUserId]));
  const [betAmount, setBetAmount] = useState('');

  const toggleMember = (userId: string) => {
    const next = new Set(selectedIds);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    setSelectedIds(next);
  };

  const handleSubmit = () => {
    const amount = parseInt(betAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    if (selectedIds.size < 2) return;

    const participants = members.filter((m) => selectedIds.has(m.userId));
    onStart(participants, amount);
  };

  return (
    <VStack gap={16} className="w-full">
      <VStack gap={8} className="w-full">
        <Typography variants="body1" className="font-semibold">
          참여자 선택 (2명 이상)
        </Typography>
        <VStack gap={4} className="w-full">
          {members.map((member) => (
            <Card
              key={member.userId}
              className={`cursor-pointer transition-colors ${
                selectedIds.has(member.userId)
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-muted-foreground/30'
              }`}
              onClick={() => toggleMember(member.userId)}
            >
              <CardContent className="py-3">
                <HStack gap={12}>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.nickname}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      member.nickname.charAt(0)
                    )}
                  </div>
                  <Typography variants="body2">{member.nickname}</Typography>
                  {selectedIds.has(member.userId) && (
                    <Typography variants="caption" className="text-primary ml-auto">
                      선택됨
                    </Typography>
                  )}
                </HStack>
              </CardContent>
            </Card>
          ))}
        </VStack>
      </VStack>

      <VStack gap={8} className="w-full">
        <Typography variants="body1" className="font-semibold">
          판돈 설정
        </Typography>
        <Input
          type="number"
          placeholder="도파민 (= 원)"
          min={1}
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
        />
        {betAmount && parseInt(betAmount) > 0 && (
          <Typography variants="caption" className="text-muted-foreground">
            패배자가 {parseInt(betAmount).toLocaleString()}도파민 차감, 나머지가 나눠 가짐
          </Typography>
        )}
      </VStack>

      <Button
        className="w-full"
        size="lg"
        disabled={selectedIds.size < 2 || !betAmount || parseInt(betAmount) <= 0}
        onClick={handleSubmit}
      >
        게임 시작
      </Button>
    </VStack>
  );
}
