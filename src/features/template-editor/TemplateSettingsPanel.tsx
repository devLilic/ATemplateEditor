import type { ChangeEvent } from 'react'
import {
  updateTemplateMetadata,
  type TemplateContract,
  type TemplateType,
} from '@/shared/template-contract/templateContract'
import {
  FormField,
  FormInput,
  FormSection,
  FormSelect,
  formControlClassName,
} from './TemplateEditorFormPrimitives'

interface TemplateSettingsPanelProps {
  template: TemplateContract
  onTemplateChange: (template: TemplateContract) => void
}

function updateTemplateRoot<K extends keyof TemplateContract>(
  template: TemplateContract,
  key: K,
  value: TemplateContract[K],
) {
  return {
    ...template,
    [key]: value,
  }
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function TemplateSettingsPanel({
  template,
  onTemplateChange,
}: TemplateSettingsPanelProps) {
  const handleRootChange =
    <K extends 'name' | 'description' | 'category' | 'type'>(key: K) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.currentTarget.value as TemplateContract[K]
      onTemplateChange(updateTemplateRoot(template, key, value))
    }

  return (
    <div className='flex flex-col gap-4 text-ui-primary'>
      <div className='flex items-center justify-between gap-3 rounded-md border border-ui-border bg-ui-card/40 px-3 py-3'>
        <div className='min-w-0'>
          <div className='text-sm font-semibold text-ui-primary'>Template settings</div>
          <div className='text-xs text-ui-secondary'>
            Configure the identity and authoring metadata stored with this template.
          </div>
        </div>
      </div>

      <FormSection
        description='These fields describe the template itself and travel with the exported JSON.'
        title='Template'
      >
        <FormInput
          label='name'
          onChange={handleRootChange('name')}
          type='text'
          value={template.name}
        />

        <FormInput
          label='id'
          readOnly
          type='text'
          value={template.id}
        />

        <FormField label='description'>
          <textarea
            aria-label='description'
            className={`${formControlClassName('min-h-24 py-2')}`}
            onChange={handleRootChange('description')}
            value={template.description ?? ''}
          />
        </FormField>

        <FormInput
          label='category'
          onChange={handleRootChange('category')}
          type='text'
          value={template.category ?? ''}
        />

        <FormSelect
          label='type'
          onChange={handleRootChange('type')}
          value={template.type}
        >
          <option value={'graphic' satisfies TemplateType}>graphic</option>
        </FormSelect>
      </FormSection>

      <FormSection
        description='Author and tags help classify templates across the workspace.'
        title='Metadata'
      >
        <FormInput
          label='author'
          onChange={(event) => {
            onTemplateChange(
              updateTemplateMetadata(template, {
                author: event.currentTarget.value || undefined,
              }),
            )
          }}
          type='text'
          value={template.metadata.author ?? ''}
        />

        <FormInput
          label='tags'
          onChange={(event) => {
            onTemplateChange(
              updateTemplateMetadata(template, {
                tags: parseTags(event.currentTarget.value),
              }),
            )
          }}
          placeholder='news, lower-third, sports'
          type='text'
          value={template.metadata.tags.join(', ')}
        />
      </FormSection>
    </div>
  )
}

export default TemplateSettingsPanel
