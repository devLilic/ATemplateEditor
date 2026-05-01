import type { PropsWithChildren, ReactNode } from 'react'

interface PanelProps extends PropsWithChildren {
  title?: string
  eyebrow?: string
  aside?: ReactNode
  className?: string
  contentClassName?: string
}

function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function Panel({
  title,
  eyebrow,
  aside,
  children,
  className,
  contentClassName,
}: PanelProps) {
  const hasHeader = Boolean(title || eyebrow || aside)

  return (
    <section
      className={cx(
        'rounded-md border border-ui-border bg-ui-panel/80 shadow-panel',
        className,
      )}
    >
      {hasHeader ? (
        <header className='flex min-h-12 flex-wrap items-start justify-between gap-3 border-b border-ui-border px-4 py-3'>
          <div className='min-w-0'>
            {eyebrow ? (
              <div className='mb-1 text-xs font-semibold uppercase text-ui-accent'>{eyebrow}</div>
            ) : null}
            {title ? (
              <h2 className='m-0 break-words text-base font-semibold text-ui-primary'>{title}</h2>
            ) : null}
          </div>
          {aside ? (
            <div className='shrink-0 text-sm text-ui-secondary'>{aside}</div>
          ) : null}
        </header>
      ) : null}

      <div className={cx('p-4', contentClassName)}>
        {children}
      </div>
    </section>
  )
}
