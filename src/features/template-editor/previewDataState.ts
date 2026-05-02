import type { TemplateContract, TemplateEditableField } from '@/shared/template-contract/templateContract'

export interface PreviewFieldState {
  key: string
  label: string
  type: TemplateEditableField['type']
  required: boolean
  previewValue: string | undefined
  fallbackValue: string | undefined
  resolvedValue: string
}

function getStringRecordValue(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key]
  return typeof value === 'string' ? value : undefined
}

export function getPreviewFieldValue(template: TemplateContract, fieldKey: string): string {
  const previewValue = getStringRecordValue(template.previewData, fieldKey)

  if (previewValue && previewValue.length > 0) {
    return previewValue
  }

  const fallbackValue = getStringRecordValue(template.fallbackValues, fieldKey)

  if (fallbackValue !== undefined) {
    return fallbackValue
  }

  const editableField = template.editableFields.find((field) => field.key === fieldKey)

  if (editableField && typeof editableField.defaultValue === 'string') {
    return editableField.defaultValue
  }

  return ''
}

export function listPreviewFields(template: TemplateContract): PreviewFieldState[] {
  return template.editableFields.map((field) => ({
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    previewValue: getStringRecordValue(template.previewData, field.key),
    fallbackValue: getStringRecordValue(template.fallbackValues, field.key),
    resolvedValue: getPreviewFieldValue(template, field.key),
  }))
}

export function createSamplePreviewData(template: TemplateContract): Record<string, string> {
  return Object.fromEntries(
    template.editableFields.map((field) => [field.key, getPreviewFieldValue(template, field.key)]),
  )
}

export function setPreviewFieldValue(
  template: TemplateContract,
  fieldKey: string,
  value: string,
): TemplateContract {
  return {
    ...template,
    previewData: {
      ...template.previewData,
      [fieldKey]: value,
    },
  }
}

export function setFallbackFieldValue(
  template: TemplateContract,
  fieldKey: string,
  value: string,
): TemplateContract {
  return {
    ...template,
    fallbackValues: {
      ...template.fallbackValues,
      [fieldKey]: value,
    },
  }
}

export function removePreviewFieldValue(template: TemplateContract, fieldKey: string): TemplateContract {
  const { [fieldKey]: _removed, ...remainingPreviewData } = template.previewData

  return {
    ...template,
    previewData: remainingPreviewData,
  }
}

export function removeFallbackFieldValue(template: TemplateContract, fieldKey: string): TemplateContract {
  const { [fieldKey]: _removed, ...remainingFallbackValues } = template.fallbackValues

  return {
    ...template,
    fallbackValues: remainingFallbackValues,
  }
}

export function applySamplePreviewData(template: TemplateContract): TemplateContract {
  return {
    ...template,
    previewData: {
      ...template.previewData,
      ...createSamplePreviewData(template),
    },
  }
}
