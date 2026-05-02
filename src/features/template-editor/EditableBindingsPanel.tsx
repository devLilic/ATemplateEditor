import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react'
import type { TemplateContract } from '@/shared/template-contract/templateContract'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import {
  addEditableField,
  createEditableField,
  removeBinding,
  removeEditableField,
  updateEditableField,
} from './editableBindingsState'

interface EditableBindingsPanelProps {
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

function getNextFieldIndex(template: TemplateContract) {
  const usedIndices = template.editableFields
    .map((field) => /^field(\d+)$/.exec(field.key)?.[1])
    .map((value) => (value ? Number(value) : undefined))
    .filter((value): value is number => Number.isInteger(value))

  let nextIndex = 1

  while (usedIndices.includes(nextIndex)) {
    nextIndex += 1
  }

  return nextIndex
}

export function EditableBindingsPanel({
  template,
  onTemplateChange,
}: EditableBindingsPanelProps) {
  const handleAddTextField = () => {
    const nextIndex = getNextFieldIndex(template)
    const nextField = createEditableField({
      key: `field${nextIndex}`,
      label: `Field ${nextIndex}`,
      type: 'text',
    })

    onTemplateChange(addEditableField(template, nextField))
  }

  const handleFieldLabelChange =
    (fieldId: string) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onTemplateChange(
        updateEditableField(template, fieldId, {
          label: event.currentTarget.value,
        }),
      )
    }

  const handleFieldRequiredChange =
    (fieldId: string) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onTemplateChange(
        updateEditableField(template, fieldId, {
          required: event.currentTarget.checked,
        }),
      )
    }

  return (
    <div className='flex flex-col gap-4 text-ui-primary'>
      <div className='flex items-center justify-between gap-3 rounded-md border border-ui-border bg-ui-card/40 px-3 py-3'>
        <div className='min-w-0'>
          <div className='text-sm font-semibold text-ui-primary'>Editable fields &amp; bindings</div>
          <div className='text-xs text-ui-secondary'>Manage text fields and simple element bindings.</div>
        </div>
        <Button onClick={handleAddTextField} variant='accent'>
          Add text field
        </Button>
      </div>

      <section className='flex flex-col gap-3'>
        <div className='text-[11px] font-semibold uppercase tracking-normal text-ui-accent'>Fields</div>

        {template.editableFields.length > 0 ? (
          template.editableFields.map((field) => (
            <div
              className='flex flex-col gap-3 rounded-md border border-ui-border bg-ui-card/25 p-3'
              key={field.id}
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <div className='truncate text-sm font-semibold text-ui-primary'>{field.key}</div>
                  <div className='text-xs text-ui-secondary'>{field.type}</div>
                </div>
                <Button
                  onClick={() => {
                    onTemplateChange(removeEditableField(template, field.id))
                  }}
                  variant='ghost'
                >
                  Remove
                </Button>
              </div>

              <InputField
                label='label'
                onChange={handleFieldLabelChange(field.id)}
                type='text'
                value={field.label}
              />

              <Field label='required'>
                <input
                  aria-label='required'
                  checked={field.required}
                  className='h-4 w-4 accent-ui-accent'
                  name='required'
                  onChange={handleFieldRequiredChange(field.id)}
                  type='checkbox'
                />
              </Field>
            </div>
          ))
        ) : (
          <EmptyState title='No editable fields yet' />
        )}
      </section>

      <section className='flex flex-col gap-3'>
        <div className='text-[11px] font-semibold uppercase tracking-normal text-ui-accent'>Bindings</div>

        {template.bindings.length > 0 ? (
          template.bindings.map((binding) => (
            <div
              className='flex items-start justify-between gap-3 rounded-md border border-ui-border bg-ui-card/25 p-3'
              key={binding.id}
            >
              <div className='min-w-0 text-sm text-ui-primary'>
                <div className='break-all'>{binding.fieldKey}</div>
                <div className='break-all text-xs text-ui-secondary'>{binding.elementId}</div>
                <div className='text-xs text-ui-disabled'>{binding.targetProperty}</div>
              </div>
              <Button
                onClick={() => {
                  onTemplateChange(removeBinding(template, binding.id))
                }}
                variant='ghost'
              >
                Remove
              </Button>
            </div>
          ))
        ) : (
          <EmptyState title='No bindings yet' />
        )}
      </section>
    </div>
  )
}

export default EditableBindingsPanel
