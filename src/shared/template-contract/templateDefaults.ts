import {
  createEmptyTemplate,
  createField,
  createLayer,
  createTextElement,
  type TemplateEditableField,
  type TemplateContract,
} from './templateContract'

interface CreateDefaultTemplateInput {
  name?: string
  titleFallback?: string
  titlePreview?: string
}

function createDefaultId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function getFieldDefaultValue(template: TemplateContract, fieldId: string) {
  const fallbackValue = template.fallbackValues?.[fieldId]

  if (typeof fallbackValue === 'string') {
    return fallbackValue
  }

  const field = template.fields.find((currentField) => currentField.id === fieldId)

  if (typeof field?.defaultValue === 'string') {
    return field.defaultValue
  }

  const legacyField = template.editableFields?.find(
    (currentField) => currentField.id === fieldId || currentField.key === fieldId,
  )

  if (typeof legacyField?.defaultValue === 'string') {
    return legacyField.defaultValue
  }

  const boundTextElement = template.elements?.find(
    (element) => element.kind === 'text' && element.sourceField === fieldId,
  )

  return boundTextElement?.kind === 'text' ? boundTextElement.fallbackText : undefined
}

export function createDefaultTemplate(input: CreateDefaultTemplateInput = {}): TemplateContract {
  const titleFallback = input.titleFallback ?? 'Sample title'
  const titlePreview = input.titlePreview ?? titleFallback
  const template = createEmptyTemplate({
    name: input.name ?? 'Default template',
  })
  const mainLayer = createLayer({
    name: 'Main Layer',
    type: 'text',
    zIndex: 0,
  })
  const titleElement = createTextElement({
    layerId: mainLayer.id,
    name: 'Title',
    position: { x: 160, y: 820 },
    size: { width: 1400, height: 120 },
  })
  const titleField = createField({
    id: 'title',
    label: 'Title',
    required: false,
    defaultValue: titleFallback,
  })
  const legacyTitleField: TemplateEditableField = {
    ...titleField,
    key: 'title',
    defaultValue: titleFallback,
  }
  const titleBinding = {
    id: createDefaultId('binding'),
    fieldKey: 'title',
    elementId: titleElement.id,
    targetProperty: 'text' as const,
  }

  return {
    ...template,
    layers: [mainLayer],
    fields: [titleField],
    elements: [
      {
        ...titleElement,
        sourceField: 'title',
        fallbackText: titleFallback,
        style: {
          ...titleElement.style,
          fontSize: 64,
        },
      },
    ],
    preview: {
      ...template.preview,
      sampleData: {
        title: titlePreview,
      },
    },
    fallbackValues: {
      title: titleFallback,
    },
    editableFields: [legacyTitleField],
    bindings: [titleBinding],
    metadata: {
      ...template.metadata,
      description: 'Default broadcast graphics template',
    },
  }
}

export function getTemplateFieldValue(template: TemplateContract, fieldName: string) {
  const previewValue = template.preview.sampleData[fieldName]

  if (typeof previewValue === 'string' && previewValue.length > 0) {
    return previewValue
  }

  const fallbackValue = template.fallbackValues?.[fieldName]

  return typeof fallbackValue === 'string' ? fallbackValue : ''
}

export function setTemplateFallbackValue(
  template: TemplateContract,
  fieldName: string,
  value: string,
): TemplateContract {
  const updateTextFallback = (sourceField?: string) => sourceField === fieldName

  return {
    ...template,
    fields: template.fields.map((field) =>
      field.id === fieldName ? { ...field, defaultValue: value } : field,
    ),
    editableFields: (template.editableFields ?? []).map((field) =>
      field.id === fieldName || field.key === fieldName ? { ...field, defaultValue: value } : field,
    ),
    elements: (template.elements ?? []).map((element) =>
      element.kind === 'text' && updateTextFallback(element.sourceField)
        ? {
            ...element,
            fallbackText: value,
          }
        : element,
    ),
    fallbackValues: {
      ...(template.fallbackValues ?? {}),
      [fieldName]: value,
    },
  }
}

export function setTemplatePreviewValue(
  template: TemplateContract,
  fieldName: string,
  value: string,
): TemplateContract {
  return {
    ...template,
    preview: {
      ...template.preview,
      sampleData: {
        ...template.preview.sampleData,
        [fieldName]: value,
      },
    },
  }
}
