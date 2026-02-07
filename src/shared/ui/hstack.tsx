import { cn } from '@/shared/lib/utils';

interface HStackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: number;
  px?: number;
  py?: number;
}

export function HStack({ gap, px, py, className, ...props }: HStackProps) {
  return (
    <div
      className={cn('flex flex-row items-center', className)}
      style={{
        gap: gap ? `${gap}px` : undefined,
        paddingLeft: px ? `${px}px` : undefined,
        paddingRight: px ? `${px}px` : undefined,
        paddingTop: py ? `${py}px` : undefined,
        paddingBottom: py ? `${py}px` : undefined,
      }}
      {...props}
    />
  );
}
