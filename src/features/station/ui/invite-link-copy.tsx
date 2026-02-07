'use client';

import { useState } from 'react';
import { Button, Input } from '@/shared/ui';
import { HStack } from '@/shared/ui';

interface InviteLinkCopyProps {
  inviteCode: string;
}

export function InviteLinkCopy({ inviteCode }: InviteLinkCopyProps) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${window.location.origin}/invite/${inviteCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <HStack gap={8} className="w-full">
      <Input value={inviteUrl} readOnly className="flex-1 text-sm" />
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? '복사됨!' : '복사'}
      </Button>
    </HStack>
  );
}
