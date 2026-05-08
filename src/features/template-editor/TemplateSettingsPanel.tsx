import type { ChangeEvent } from 'react'
import type { TemplateContract } from '@/shared/template-contract/templateContract'
import { FormCheckbox, FormField, FormInput, FormSection, formControlClassName } from './TemplateEditorFormPrimitives'
import { updateTemplateSettings } from './templateSettingsState'

interface TemplateSettingsPanelProps {
  template: TemplateContract
  onTemplateChange: (template: TemplateContract) => void
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function parseSafeAreaNumber(
  template: TemplateContract,
  axis: 'marginX' | 'marginY',
  value: string,
) {
  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue)) {
    return template.canvas.safeArea ?? {
      enabled: true,
      marginX: 80,
      marginY: 60,
    }
  }

  return {
    ...(template.canvas.safeArea ?? {
      enabled: true,
      marginX: 80,
      marginY: 60,
    }),
    [axis]: parsedValue,
  }
}

export function TemplateSettingsPanel({
  template,
  onTemplateChange,
}: TemplateSettingsPanelProps) {
  const safeArea = template.canvas.safeArea ?? {
    enabled: true,
    marginX: 80,
    marginY: 60,
  }

  const handleTextChange =
    (field: 'name' | 'description' | 'liveboardTemplateName') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.currentTarget.value

      onTemplateChange(
        updateTemplateSettings(template, {
          [field]: value,
        }),
      )
    }

  return (
    <div className='flex flex-col gap-4 text-ui-primary'>
      <div className='flex items-center justify-between gap-3 rounded-md border border-ui-border bg-ui-card/40 px-3 py-3'>
        <div className='min-w-0'>
          <div className='text-sm font-semibold text-ui-primary'>Template settings</div>
          <div className='text-xs text-ui-secondary'>
            Configure the final template metadata and LiveBoard output fields.
          </div>
        </div>
      </div>

      <FormSection
        description='These fields are part of the final exported template contract.'
        title='Template'
      >
        <FormInput
          label='name'
          onChange={handleTextChange('name')}
          type='text'
          value={template.name}
        />

        <FormField label='description'>
          <textarea
            aria-label='description'
            className={formControlClassName('min-h-24 py-2')}
            onChange={handleTextChange('description')}
            value={template.description ?? ''}
          />
        </FormField>

        <FormInput
          label='liveboard templateName'
          onChange={handleTextChange('liveboardTemplateName')}
          type='text'
          value={template.output.liveboard?.templateName ?? ''}
        />
      </FormSection>

      <FormSection
        description='Tags and safe area settings remain editor-authored contract metadata.'
        title='Metadata'
      >
        <FormInput
          label='tags'
          onChange={(event) => {
            onTemplateChange(
              updateTemplateSettings(template, {
                tags: parseTags(event.currentTarget.value),
              }),
            )
          }}
          placeholder='news, lower-third, sports'
          type='text'
          value={template.metadata.tags.join(', ')}
        />

        <FormCheckbox
          checked={safeArea.enabled}
          label='safe area enabled'
          onChange={(event) => {
            onTemplateChange(
              updateTemplateSettings(template, {
                safeArea: {
                  ...safeArea,
                  enabled: event.currentTarget.checked,
                },
              }),
            )
          }}
        />

        <FormInput
          label='marginX'
          onChange={(event) => {
            onTemplateChange(
              updateTemplateSettings(template, {
                safeArea: parseSafeAreaNumber(template, 'marginX', event.currentTarget.value),
              }),
            )
          }}
          type='number'
          value={safeArea.marginX}
        />

        <FormInput
          label='marginY'
          onChange={(event) => {
            onTemplateChange(
              updateTemplateSettings(template, {
                safeArea: parseSafeAreaNumber(template, 'marginY', event.currentTarget.value),
              }),
            )
          }}
          type='number'
          value={safeArea.marginY}
        />
      </FormSection>
    </div>
  )
}

export default TemplateSettingsPanel
