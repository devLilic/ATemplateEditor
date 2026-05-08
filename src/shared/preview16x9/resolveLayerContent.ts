import type {
  TemplateFieldContract,
  TemplateTextLayerContract,
} from '../template-contract/templateContract'
import type { Preview16x9Input } from './previewTypes'

function findField(
  template: Preview16x9Input['template'],
  fieldId: string,
): TemplateFieldContract | undefined {
  const directField = template.fields.find((field) => field.id === fieldId)

  if (directField) {
    return directField
  }

  const legacyField = (template.editableFields ?? []).find(
    (field) => field.id === fieldId || field.key === fieldId,
  )

  if (!legacyField) {
    return undefined
  }

  return {
    id: legacyField.id,
    label: legacyField.label,
    type: 'text',
    required: legacyField.required,
    defaultValue: legacyField.defaultValue,
    placeholder: legacyField.placeholder,
    description: legacyField.description,
  }
}

export function resolveTextLayerContent(
  input: Preview16x9Input,
  layer: TemplateTextLayerContract,
): string {
  const fieldId = layer.fieldId

  if (!fieldId) {
    return layer.fallbackText ?? ''
  }

  const inputValue = input.data?.[fieldId]

  if (typeof inputValue === 'string') {
    return inputValue
  }

  const sampleValue = input.template.preview.sampleData[fieldId]

  if (typeof sampleValue === 'string') {
    return sampleValue
  }

  const field = findField(input.template, fieldId)

  if (typeof field?.defaultValue === 'string') {
    return field.defaultValue
  }

  if (typeof layer.fallbackText === 'string') {
    return layer.fallbackText
  }

  return ''
}
