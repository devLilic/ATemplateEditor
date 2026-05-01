import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className='rounded-md border border-dashed border-ui-border-strong bg-ui-card/45 px-4 py-5 text-center'>
      <h3 className='m-0 text-sm font-semibold text-ui-primary'>{title}</h3>
      {description ? (
        <p className='mx-auto mb-0 mt-2 max-w-md text-sm text-ui-secondary'>{description}</p>
      ) : null}
      {action ? (
        <div className='mt-4 flex justify-center'>{action}</div>
      ) : null}
    </div>
  )
}
