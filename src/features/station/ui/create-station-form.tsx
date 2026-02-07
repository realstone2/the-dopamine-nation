'use client';

import { createStation } from '../api/actions';
import { Button, Input } from '@/shared/ui';
import { VStack } from '@/shared/ui';

export function CreateStationForm() {
  return (
    <form action={createStation}>
      <VStack gap={12}>
        <Input
          name="title"
          placeholder="스테이션 이름"
          required
          maxLength={50}
        />
        <Input
          name="description"
          placeholder="설명 (선택)"
          maxLength={200}
        />
        <Button type="submit" className="w-full">
          스테이션 만들기
        </Button>
      </VStack>
    </form>
  );
}
