import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react'
import type { TemplateContract } from '@/shared/template-contract/templateContract'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import {
  applySamplePreviewData,
  listPreviewFields,
  setFallbackFieldValue,
  setPreviewFieldValue,
} from './previewDataState'

interface PreviewDataPanelProps {
  template: TemplateContract
  onTemplateChange: (template: TemplateContract) => void
}

interface FieldProps {
  label: string
  children: ReactNode
}

interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
}

function Field({ label, children }: FieldProps) {
  return (
    <label className='flex flex-col gap-1'>
      <span className='text-[11px] font-semibold uppercase tracking-normal text-ui-disabled'>{label}</span>
      {children}
    </label>
  )
}

function inputClassName() {
  return 'h-9 rounded-md border border-ui-border bg-ui-card px-3 text-sm text-ui-primary outline-none transition-colors placeholder:text-ui-disabled focus:border-ui-accent'
}

function InputField({ label, ...props }: InputFieldProps) {
  return (
    <Field label={label}>
      <input
        {...props}
        aria-label={label}
        className={`${inputClassName()} ${props.className ?? ''}`.trim()}
        name={props.name ?? label}
      />
    </Field>
  )
}

export function PreviewDataPanel({ template, onTemplateChange }: PreviewDataPanelProps) {
  const previewFields = listPreviewFields(template)

  const handlePreviewValueChange =
    (fieldKey: string) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onTemplateChange(setPreviewFieldValue(template, fieldKey, event.currentTarget.value))
    }

  const handleFallbackValueChange =
    (fieldKey: string) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onTemplateChange(setFallbackFieldValue(template, fieldKey, event.currentTarget.value))
    }

  if (previewFields.length === 0) {
    return (
      <div className='flex flex-col gap-3 text-ui-primary'>
        <div className='text-sm font-semibold text-ui-primary'>Preview data</div>
        <EmptyState title='No editable fields yet' />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4 text-ui-primary'>
      <div className='flex items-center justify-between gap-3 rounded-md border border-ui-border bg-ui-card/40 px-3 py-3'>
        <div className='min-w-0'>
          <div className='text-sm font-semibold text-ui-primary'>Preview data</div>
          <div className='text-xs text-ui-secondary'>Edit preview and fallback values for template fields.</div>
        </div>
        <Button
          onClick={() => {
            onTemplateChange(applySamplePreviewData(template))
          }}
          variant='accent'
        >
          Apply sample data
        </Button>
      </div>

      <div className='flex flex-col gap-3'>
        {previewFields.map((field) => (
          <section
            className='flex flex-col gap-3 rounded-md border border-ui-border bg-ui-card/25 p-3'
            key={field.key}
          >
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <div className='truncate text-sm font-semibold text-ui-primary'>{field.label}</div>
                <div className='text-xs text-ui-secondary'>{field.key}</div>
              </div>
              <div className='text-[11px] uppercase text-ui-disabled'>{field.type}</div>
            </div>

            <InputField
              label='preview value'
              onChange={handlePreviewValueChange(field.key)}
              type='text'
              value={field.previewValue ?? ''}
            />

            <InputField
              label='fallback value'
              onChange={handleFallbackValueChange(field.key)}
              type='text'
              value={field.fallbackValue ?? ''}
            />

            <div className='rounded-md border border-ui-border bg-ui-app/50 px-3 py-2'>
              <div className='text-[11px] font-semibold uppercase tracking-normal text-ui-disabled'>
                Resolved value
              </div>
              <div className='mt-1 break-words text-sm text-ui-primary'>{field.resolvedValue || ''}</div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default PreviewDataPanel
