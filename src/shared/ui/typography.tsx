import { cn } from '@/shared/lib/utils';

const variantStyles = {
  h1_bold: 'text-3xl font-bold',
  h2_bold: 'text-2xl font-bold',
  h3_bold: 'text-xl font-bold',
  h4_bold: 'text-lg font-bold',
  body1: 'text-base',
  body2: 'text-sm',
  caption: 'text-xs text-gray-500',
} as const;

type TypographyVariant = keyof typeof variantStyles;

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variants: TypographyVariant;
  as?: React.ElementType;
}

export function Typography({
  variants,
  as: Component = 'span',
  className,
  ...props
}: TypographyProps) {
  return (
    <Component
      className={cn(variantStyles[variants], className)}
      {...props}
    />
  );
}
