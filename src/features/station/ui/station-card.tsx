import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui';
import { HStack, Typography } from '@/shared/ui';

interface StationCardProps {
  id: string;
  title: string;
  description: string | null;
  memberCount: number;
}

export function StationCard({ id, title, description, memberCount }: StationCardProps) {
  return (
    <Link href={`/stations/${id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <HStack gap={8}>
            <Typography variants="caption">
              멤버 {memberCount}명
            </Typography>
          </HStack>
        </CardContent>
      </Card>
    </Link>
  );
}
