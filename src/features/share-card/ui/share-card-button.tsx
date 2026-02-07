'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui';

interface ShareCardButtonProps {
  userId: string;
  stationId: string;
}

export function ShareCardButton({ userId, stationId }: ShareCardButtonProps) {
  const [copied, setCopied] = useState(false);

  const ogUrl = `${window.location.origin}/api/og/card?userId=${userId}&stationId=${stationId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(ogUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? '링크 복사됨!' : '놀림 카드 공유'}
    </Button>
  );
}
