'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui';
import { HStack } from '@/shared/ui';
import { deleteStation, leaveStation } from '../api/actions';

interface StationActionsProps {
  stationId: string;
  isOwner: boolean;
}

export function StationActions({ stationId, isOwner }: StationActionsProps) {
  const [confirming, setConfirming] = useState<'delete' | 'leave' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirming !== 'delete') {
      setConfirming('delete');
      return;
    }
    setLoading(true);
    try {
      await deleteStation(stationId);
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다');
      setLoading(false);
      setConfirming(null);
    }
  };

  const handleLeave = async () => {
    if (confirming !== 'leave') {
      setConfirming('leave');
      return;
    }
    setLoading(true);
    try {
      await leaveStation(stationId);
    } catch (err) {
      alert(err instanceof Error ? err.message : '탈퇴에 실패했습니다');
      setLoading(false);
      setConfirming(null);
    }
  };

  return (
    <HStack gap={8} className="w-full">
      {isOwner ? (
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? '삭제 중...' : confirming === 'delete' ? '정말 삭제하시겠습니까?' : '스테이션 삭제'}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleLeave}
          disabled={loading}
        >
          {loading ? '처리 중...' : confirming === 'leave' ? '정말 나가시겠습니까?' : '스테이션 나가기'}
        </Button>
      )}
    </HStack>
  );
}
