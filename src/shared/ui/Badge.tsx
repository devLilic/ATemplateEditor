import type { PropsWithChildren } from 'react'

type BadgeVariant =
  | 'neutral'
  | 'selected'
  | 'active'
  | 'warning'
  | 'danger'
  | 'muted'

interface BadgeProps extends PropsWithChildren {
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'border-ui-border bg-ui-card text-ui-secondary',
  selected: 'border-ui-selected/60 bg-ui-selected/15 text-ui-primary',
  active: 'border-ui-success/55 bg-ui-success/10 text-ui-success',
  warning: 'border-ui-warning/55 bg-ui-warning/10 text-ui-warning',
  danger: 'border-ui-danger/55 bg-ui-danger/10 text-ui-danger',
  muted: 'border-ui-border bg-transparent text-ui-disabled',
}

function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function Badge({
  children,
  variant = 'neutral',
  className,
}: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-semibold uppercase leading-none tracking-normal',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
