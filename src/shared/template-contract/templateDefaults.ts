import {
  createEmptyTemplate,
  createLayer,
  createTextElement,
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

export function createDefaultTemplate(input: CreateDefaultTemplateInput = {}): TemplateContract {
  const titleFallback = input.titleFallback ?? 'Sample title'
  const titlePreview = input.titlePreview ?? titleFallback
  const template = createEmptyTemplate({
    name: input.name ?? 'Default template',
  })
  const mainLayer = createLayer({
    name: 'Main Layer',
    zIndex: 0,
  })
  const titleElement = createTextElement({
    layerId: mainLayer.id,
    name: 'Title',
    position: { x: 160, y: 820 },
    size: { width: 1400, height: 120 },
  })

  return {
    ...template,
    layers: [mainLayer],
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
    previewData: {
      title: titlePreview,
    },
    fallbackValues: {
      title: titleFallback,
    },
    editableFields: [
      {
        id: createDefaultId('field'),
        key: 'title',
        label: 'Title',
        type: 'text',
        required: false,
        defaultValue: titleFallback,
      },
    ],
    bindings: [
      {
        id: createDefaultId('binding'),
        fieldKey: 'title',
        elementId: titleElement.id,
        targetProperty: 'text',
      },
    ],
    metadata: {
      ...template.metadata,
      description: 'Default broadcast graphics template',
    },
  }
}

export function getTemplateFieldValue(template: TemplateContract, fieldName: string) {
  const previewValue = template.previewData[fieldName]

  if (typeof previewValue === 'string' && previewValue.length > 0) {
    return previewValue
  }

  const fallbackValue = template.fallbackValues[fieldName]

  return typeof fallbackValue === 'string' ? fallbackValue : ''
}

export function setTemplateFallbackValue(
  template: TemplateContract,
  fieldName: string,
  value: string,
): TemplateContract {
  return {
    ...template,
    fallbackValues: {
      ...template.fallbackValues,
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
    previewData: {
      ...template.previewData,
      [fieldName]: value,
    },
  }
}
