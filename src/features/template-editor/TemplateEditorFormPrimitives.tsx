import type {
  InputHTMLAttributes,
  PropsWithChildren,
  ReactNode,
  SelectHTMLAttributes,
} from 'react'

interface FormFieldProps {
  label: string
  children: ReactNode
}

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  children: ReactNode
}

interface FormSectionProps extends PropsWithChildren {
  title: string
  description?: string
  aside?: ReactNode
  className?: string
}

function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function formControlClassName(className?: string) {
  return cx(
    'h-9 w-full rounded-md border border-ui-border bg-ui-card px-3 text-sm text-ui-primary outline-none transition-colors',
    'placeholder:text-ui-disabled focus:border-ui-accent',
    className,
  )
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    <label className='flex flex-col gap-1.5'>
      <span className='text-[11px] font-semibold uppercase tracking-normal text-ui-disabled'>
        {label}
      </span>
      {children}
    </label>
  )
}

export function FormInput({ label, ...props }: FormInputProps) {
  return (
    <FormField label={label}>
      <input
        {...props}
        aria-label={label}
        className={formControlClassName(props.className)}
        name={props.name ?? label}
      />
    </FormField>
  )
}

export function FormSelect({ label, children, ...props }: FormSelectProps) {
  return (
    <FormField label={label}>
      <select
        {...props}
        aria-label={label}
        className={formControlClassName(props.className)}
        name={props.name ?? label}
      >
        {children}
      </select>
    </FormField>
  )
}

export function FormCheckbox({
  label,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> & { label: string }) {
  return (
    <label className='flex min-h-9 items-center justify-between gap-3 rounded-md border border-ui-border bg-ui-card/35 px-3 py-2'>
      <span className='text-[11px] font-semibold uppercase tracking-normal text-ui-disabled'>
        {label}
      </span>
      <input
        {...props}
        aria-label={label}
        className={cx('h-4 w-4 shrink-0 accent-ui-accent', className)}
        name={props.name ?? label}
        type='checkbox'
      />
    </label>
  )
}

export function FormSection({
  title,
  description,
  aside,
  className,
  children,
}: FormSectionProps) {
  return (
    <section className={cx('flex flex-col gap-3 rounded-md border border-ui-border bg-ui-card/25 p-3', className)}>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='text-[11px] font-semibold uppercase tracking-normal text-ui-accent'>
            {title}
          </div>
          {description ? <div className='mt-1 text-xs text-ui-secondary'>{description}</div> : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}
