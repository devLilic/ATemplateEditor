import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonVariant =
  | 'neutral'
  | 'accent'
  | 'selected'
  | 'success'
  | 'warning'
  | 'danger'
  | 'ghost'

interface ButtonProps extends PropsWithChildren, ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  neutral: 'border-ui-border bg-ui-card text-ui-primary hover:border-ui-border-strong hover:bg-ui-elevated',
  accent: 'border-ui-accent/50 bg-ui-accent/10 text-ui-accent hover:border-ui-accent hover:bg-ui-accent/15',
  selected: 'border-ui-selected/70 bg-ui-selected/20 text-ui-primary hover:border-ui-selected hover:bg-ui-selected/25',
  success: 'border-ui-success/55 bg-ui-success/10 text-ui-success hover:border-ui-success hover:bg-ui-success/15',
  warning: 'border-ui-warning/55 bg-ui-warning/10 text-ui-warning hover:border-ui-warning hover:bg-ui-warning/15',
  danger: 'border-ui-danger/55 bg-ui-danger/10 text-ui-danger hover:border-ui-danger hover:bg-ui-danger/15',
  ghost: 'border-transparent bg-transparent text-ui-secondary hover:border-ui-border hover:bg-ui-card hover:text-ui-primary',
}

function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function Button({
  children,
  type = 'button',
  className,
  variant = 'neutral',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex min-h-8 items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ui-app disabled:pointer-events-none disabled:border-ui-border disabled:bg-ui-card/60 disabled:text-ui-disabled',
        variantClasses[variant],
        className,
      )}
      {...props}
      type={type}
    >
      {children}
    </button>
  )
}
