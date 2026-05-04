import type { TemplateContract, TemplateFieldContract } from '@/shared/template-contract/templateContract'

export interface PreviewFieldState {
  key: string
  label: string
  type: TemplateFieldContract['type']
  required: boolean
  previewValue: string | undefined
  fallbackValue: string | undefined
  resolvedValue: string
}

function getStringRecordValue(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key]
  return typeof value === 'string' ? value : undefined
}

function listContractFields(template: TemplateContract): TemplateFieldContract[] {
  if ((template.editableFields ?? []).length > 0) {
    return (template.editableFields ?? []).map((field) => ({
      id: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      defaultValue: field.defaultValue,
    }))
  }

  return template.fields
}

function updateBoundTextFallbacks(
  template: TemplateContract,
  fieldId: string,
  value: string,
): TemplateContract['elements'] {
  return (template.elements ?? []).map((element) =>
    element.kind === 'text' && element.sourceField === fieldId
      ? {
          ...element,
          fallbackText: value,
        }
      : element,
  )
}

export function getPreviewFieldValue(template: TemplateContract, fieldId: string): string {
  const previewValue = getStringRecordValue(template.preview.sampleData, fieldId)

  if (previewValue && previewValue.length > 0) {
    return previewValue
  }

  const fallbackValue = getStringRecordValue(template.fallbackValues ?? {}, fieldId)

  if (fallbackValue !== undefined) {
    return fallbackValue
  }

  const field = listContractFields(template).find((currentField) => currentField.id === fieldId)

  if (typeof field?.defaultValue === 'string') {
    return field.defaultValue
  }

  const boundTextElement = (template.elements ?? []).find(
    (element) => element.kind === 'text' && element.sourceField === fieldId,
  )

  if (boundTextElement?.kind === 'text') {
    return boundTextElement.fallbackText
  }

  return ''
}

export function listPreviewFields(template: TemplateContract): PreviewFieldState[] {
  return listContractFields(template).map((field) => ({
    key: field.id,
    label: field.label,
    type: field.type,
    required: field.required,
    previewValue: getStringRecordValue(template.preview.sampleData, field.id),
    fallbackValue:
      getStringRecordValue(template.fallbackValues ?? {}, field.id) ??
      (typeof field.defaultValue === 'string' ? field.defaultValue : undefined),
    resolvedValue: getPreviewFieldValue(template, field.id),
  }))
}

export function createSamplePreviewData(template: TemplateContract): Record<string, string> {
  return Object.fromEntries(
    listContractFields(template).map((field) => [field.id, getPreviewFieldValue(template, field.id)]),
  )
}

export function setPreviewFieldValue(
  template: TemplateContract,
  fieldId: string,
  value: string,
): TemplateContract {
  return {
    ...template,
    preview: {
      ...template.preview,
      sampleData: {
        ...template.preview.sampleData,
        [fieldId]: value,
      },
    },
  }
}

export function setFallbackFieldValue(
  template: TemplateContract,
  fieldId: string,
  value: string,
): TemplateContract {
  return {
    ...template,
    fields: template.fields.map((field) =>
      field.id === fieldId ? { ...field, defaultValue: value } : field,
    ),
    editableFields: (template.editableFields ?? []).map((field) =>
      field.id === fieldId || field.key === fieldId ? { ...field, defaultValue: value } : field,
    ),
    elements: updateBoundTextFallbacks(template, fieldId, value),
    fallbackValues: {
      ...(template.fallbackValues ?? {}),
      [fieldId]: value,
    },
  }
}

export function removePreviewFieldValue(template: TemplateContract, fieldId: string): TemplateContract {
  const { [fieldId]: _removed, ...remainingPreviewData } = template.preview.sampleData

  return {
    ...template,
    preview: {
      ...template.preview,
      sampleData: remainingPreviewData,
    },
  }
}

export function removeFallbackFieldValue(template: TemplateContract, fieldId: string): TemplateContract {
  const { [fieldId]: _removed, ...remainingFallbackValues } = template.fallbackValues ?? {}

  return {
    ...template,
    fields: template.fields.map((field) =>
      field.id === fieldId ? { ...field, defaultValue: undefined } : field,
    ),
    editableFields: (template.editableFields ?? []).map((field) =>
      field.id === fieldId || field.key === fieldId ? { ...field, defaultValue: '' } : field,
    ),
    fallbackValues: remainingFallbackValues,
  }
}

export function applySamplePreviewData(template: TemplateContract): TemplateContract {
  return {
    ...template,
    preview: {
      ...template.preview,
      sampleData: {
        ...template.preview.sampleData,
        ...createSamplePreviewData(template),
      },
    },
  }
}
