import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const styles =
    variant === 'secondary'
      ? 'bg-secondary text-secondary-foreground'
      : variant === 'outline'
        ? 'border border-border text-foreground'
        : 'bg-primary/10 text-primary'
  return (
    <div className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', styles, className)} {...props} />
  )
}