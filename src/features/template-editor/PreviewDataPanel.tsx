import type { ChangeEvent } from 'react'
import type { TemplateContract } from '@/shared/template-contract/templateContract'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import {
  applySamplePreviewData,
  listPreviewFields,
  setFallbackFieldValue,
  setPreviewFieldValue,
} from './previewDataState'
import { FormInput, FormSection } from './TemplateEditorFormPrimitives'

interface PreviewDataPanelProps {
  template: TemplateContract
  onTemplateChange: (template: TemplateContract) => void
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
        <EmptyState
          description='Add editable fields to preview sample and fallback values here.'
          title='No editable fields yet'
        />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4 text-ui-primary'>
      <div className='flex items-center justify-between gap-3 rounded-md border border-ui-border bg-ui-card/40 px-3 py-3'>
        <div className='min-w-0'>
          <div className='text-sm font-semibold text-ui-primary'>Preview data</div>
          <div className='text-xs text-ui-secondary'>
            Preview values override fallback values only inside TemplateEditor.
          </div>
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
          <FormSection
            className='gap-3'
            description='Preview overrides fallback. Resolved value shows what the preview uses.'
            aside={<div className='text-[11px] uppercase text-ui-disabled'>{field.type}</div>}
            key={field.key}
            title={field.label}
          >
            <div className='min-w-0'>
              <div className='text-xs text-ui-secondary'>{field.key}</div>
            </div>

            <FormInput
              label='preview value'
              onChange={handlePreviewValueChange(field.key)}
              type='text'
              value={field.previewValue ?? ''}
            />

            <FormInput
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
          </FormSection>
        ))}
      </div>
    </div>
  )
}

export default PreviewDataPanel
