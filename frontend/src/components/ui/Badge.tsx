import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'accent' | 'muted';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'muted', children, className }: BadgeProps) {
  return (
    <span className={cn(`badge-${variant}`, className)}>
      {children}
    </span>
  );
}
