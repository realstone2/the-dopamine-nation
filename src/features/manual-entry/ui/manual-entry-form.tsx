'use client';

import { useState } from 'react';
import { VStack, Typography, Button, Input } from '@/shared/ui';
import { Card, CardContent } from '@/shared/ui';
import { createManualEntry } from '../api/actions';

interface Member {
  userId: string;
  nickname: string;
}

interface ManualEntryFormProps {
  stationId: string;
  currentUserId: string;
  members: Member[];
}

export function ManualEntryForm({
  stationId,
  currentUserId,
  members,
}: ManualEntryFormProps) {
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const otherMembers = members.filter((m) => m.userId !== currentUserId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(amount, 10);
    if (!toUserId || isNaN(amountNum) || amountNum <= 0) return;

    setSaving(true);
    setMessage(null);

    try {
      await createManualEntry({
        stationId,
        toUserId,
        amount: amountNum,
        description: description || undefined,
      });
      setToUserId('');
      setAmount('');
      setDescription('');
      setMessage({ type: 'success', text: '도파민이 기록되었습니다' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : '저장에 실패했습니다',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack gap={12} className="w-full">
        <VStack gap={4} className="w-full">
          <Typography variants="body2" className="font-medium">
            받는 사람
          </Typography>
          <VStack gap={4} className="w-full">
            {otherMembers.map((member) => (
              <Card
                key={member.userId}
                className={`cursor-pointer transition-colors ${
                  toUserId === member.userId
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/30'
                }`}
                onClick={() => setToUserId(member.userId)}
              >
                <CardContent className="py-3">
                  <Typography variants="body2">{member.nickname}</Typography>
                </CardContent>
              </Card>
            ))}
          </VStack>
        </VStack>

        <VStack gap={4} className="w-full">
          <Typography variants="body2" className="font-medium">
            금액
          </Typography>
          <Input
            type="number"
            placeholder="도파민 (= 원)"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </VStack>

        <VStack gap={4} className="w-full">
          <Typography variants="body2" className="font-medium">
            설명 (선택)
          </Typography>
          <Input
            placeholder="예: 점심 내기에서 짐"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
          />
        </VStack>

        {message && (
          <Typography
            variants="body2"
            className={message.type === 'success' ? 'text-emerald-600' : 'text-red-500'}
          >
            {message.text}
          </Typography>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={!toUserId || !amount || parseInt(amount) <= 0 || saving}
        >
          {saving ? '저장 중...' : '도파민 기록하기'}
        </Button>
      </VStack>
    </form>
  );
}
