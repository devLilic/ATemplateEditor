import {
  createEmptyTemplate,
  type TemplateContract,
  type TemplateFieldContract,
  type TemplateLayerContract,
  type TemplateTextLayerContract,
} from '@/shared/template-contract/templateContract'
import { validateTemplate } from '@/shared/validation/templateValidation'

export interface TemplateJsonImportError {
  path: string
  message: string
}

export type TemplateJsonImportResult =
  | { status: 'success'; template: TemplateContract }
  | { status: 'error'; errors: TemplateJsonImportError[] }

function toFinalTemplateContract(template: TemplateContract) {
  return {
    schemaVersion: template.schemaVersion,
    id: template.id,
    name: template.name,
    description: template.description ?? '',
    canvas: template.canvas,
    output: template.output,
    fields: template.fields,
    assets: template.assets,
    layers: template.layers,
    preview: template.preview,
    metadata: template.metadata,
  }
}

type JsonRecord = Record<string, unknown>

function isObject(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function getStringRecord(value: unknown): Record<string, string> {
  if (!isObject(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  )
}

function getLegacyLiveboardTemplateName(input: JsonRecord): string | undefined {
  const outputTemplateName = getString((input.output as JsonRecord | undefined)?.liveboard && isObject((input.output as JsonRecord).liveboard)
    ? ((input.output as JsonRecord).liveboard as JsonRecord).templateName
    : undefined)

  if (outputTemplateName !== undefined) {
    return outputTemplateName
  }

  const oscTemplateName = isObject(input.osc) ? getString(input.osc.templateName) : undefined
  if (oscTemplateName !== undefined) {
    return oscTemplateName
  }

  const controlTemplateName = isObject(input.control) ? getString(input.control.templateName) : undefined
  return controlTemplateName
}

function normalizeFieldId(field: JsonRecord): string | undefined {
  return getString(field.id) ?? getString(field.key)
}

function migrateFields(
  finalFields: unknown,
  editableFields: unknown,
  fallbackValues: Record<string, string>,
): TemplateFieldContract[] {
  const normalizedFields: TemplateFieldContract[] = Array.isArray(finalFields)
    ? finalFields.filter(isObject).map((field): TemplateFieldContract => {
        const fieldId = normalizeFieldId(field)

        return {
          ...field,
          id: fieldId ?? '',
          label: getString(field.label) ?? fieldId ?? '',
          type: 'text',
          required: typeof field.required === 'boolean' ? field.required : false,
          defaultValue: fieldId !== undefined && fallbackValues[fieldId] !== undefined
            ? fallbackValues[fieldId]
            : getString(field.defaultValue),
          placeholder: getString(field.placeholder),
          description: getString(field.description),
        }
      })
    : []

  if (normalizedFields.length > 0) {
    return normalizedFields as TemplateFieldContract[]
  }

  if (!Array.isArray(editableFields)) {
    return []
  }

  return editableFields
    .filter(isObject)
    .map((field): TemplateFieldContract | undefined => {
      const fieldId = normalizeFieldId(field)
      if (fieldId === undefined) {
        return undefined
      }

      return {
        id: fieldId,
        label: getString(field.label) ?? fieldId,
        type: 'text' as const,
        required: typeof field.required === 'boolean' ? field.required : false,
        defaultValue: fallbackValues[fieldId] ?? getString(field.defaultValue),
        placeholder: getString(field.placeholder),
        description: getString(field.description),
      }
    })
    .filter((field): field is TemplateFieldContract => field !== undefined)
}

function inferLayerFieldAssignments(input: JsonRecord): Map<string, string> {
  const assignments = new Map<string, string>()

  if (!Array.isArray(input.bindings)) {
    return assignments
  }

  const elementsById = new Map<string, JsonRecord>()
  if (Array.isArray(input.elements)) {
    for (const element of input.elements) {
      if (!isObject(element)) {
        continue
      }

      const elementId = getString(element.id)
      if (elementId !== undefined) {
        elementsById.set(elementId, element)
      }
    }
  }

  for (const binding of input.bindings) {
    if (!isObject(binding)) {
      continue
    }

    const fieldId = getString(binding.fieldKey)
    const elementId = getString(binding.elementId)
    if (fieldId === undefined || elementId === undefined) {
      continue
    }

    const boundElement = elementsById.get(elementId)
    const layerId = boundElement ? getString(boundElement.layerId) : undefined

    if (layerId !== undefined && !assignments.has(layerId)) {
      assignments.set(layerId, fieldId)
    }
  }

  return assignments
}

function migrateLayers(finalLayers: unknown, bindingAssignments: Map<string, string>): TemplateLayerContract[] {
  if (!Array.isArray(finalLayers)) {
    return []
  }

  const textLayerIndices = finalLayers
    .map((layer, index) => (isObject(layer) && layer.type === 'text' ? index : -1))
    .filter((index) => index >= 0)

  return finalLayers.filter(isObject).map((layer, index) => {
    if (layer.type !== 'text') {
      return layer as TemplateLayerContract
    }

    const nextLayer = { ...layer } as JsonRecord
    const layerId = getString(layer.id)
    const assignedFieldId =
      getString(layer.fieldId) ??
      (layerId !== undefined ? bindingAssignments.get(layerId) : undefined) ??
      (textLayerIndices.length === 1 && Array.isArray(layer.fieldId) === false
        ? Array.from(bindingAssignments.values())[0]
        : undefined)

    if (assignedFieldId !== undefined) {
      nextLayer.fieldId = assignedFieldId
    }

    return nextLayer as TemplateTextLayerContract
  })
}

function normalizeTemplate(parsed: unknown): TemplateContract {
  const defaults = createEmptyTemplate()

  if (!isObject(parsed)) {
    return defaults
  }

  const fallbackValues = getStringRecord(parsed.fallbackValues)
  const fields = migrateFields(parsed.fields, parsed.editableFields, fallbackValues)
  const bindingAssignments = inferLayerFieldAssignments(parsed)
  const layers = migrateLayers(parsed.layers, bindingAssignments)
  const sampleData = {
    ...getStringRecord(isObject(parsed.preview) ? parsed.preview.sampleData : undefined),
    ...getStringRecord(parsed.previewData),
  }
  const liveboardTemplateName = getLegacyLiveboardTemplateName(parsed) ?? defaults.output.liveboard?.templateName ?? ''
  const canvas = isObject(parsed.canvas) ? parsed.canvas : {}
  const preview = isObject(parsed.preview) ? parsed.preview : {}
  const metadata = isObject(parsed.metadata) ? parsed.metadata : {}
  const output = isObject(parsed.output) ? parsed.output : {}

  return {
    schemaVersion: getString(parsed.schemaVersion) as TemplateContract['schemaVersion'],
    id: getString(parsed.id) as TemplateContract['id'],
    name: getString(parsed.name) as TemplateContract['name'],
    description: getString(parsed.description) ?? defaults.description ?? '',
    canvas: {
      ...defaults.canvas,
      ...canvas,
      safeArea: isObject(canvas.safeArea) ? { ...defaults.canvas.safeArea, ...canvas.safeArea } : defaults.canvas.safeArea,
    },
    output: {
      ...defaults.output,
      ...output,
      liveboard: {
        templateName: liveboardTemplateName,
      },
    },
    fields,
    assets: Array.isArray(parsed.assets) ? parsed.assets : defaults.assets,
    layers,
    preview: {
      ...defaults.preview,
      ...preview,
      sampleData,
      background: isObject(preview.background) ? preview.background : defaults.preview.background,
    },
    metadata: {
      ...defaults.metadata,
      ...metadata,
      tags: Array.isArray(metadata.tags)
        ? metadata.tags.filter((tag): tag is string => typeof tag === 'string')
        : defaults.metadata.tags,
    },
  } as TemplateContract
}

export function exportTemplateToJson(template: TemplateContract): string {
  return JSON.stringify(toFinalTemplateContract(template), null, 2)
}

export function parseTemplateJson(json: string): TemplateJsonImportResult {
  try {
    const parsed: unknown = JSON.parse(json)
    const validation = validateTemplate(parsed)

    if (!validation.valid) {
      return {
        status: 'error',
        errors: validation.errors,
      }
    }

    return {
      status: 'success',
      template: parsed as TemplateContract,
    }
  } catch {
    return {
      status: 'error',
      errors: [
        {
          path: '$',
          message: 'Invalid JSON',
        },
      ],
    }
  }
}

export function importTemplateFromJson(json: string): TemplateJsonImportResult {
  try {
    const parsed: unknown = JSON.parse(json)
    const normalizedTemplate = normalizeTemplate(parsed)
    const validation = validateTemplate(normalizedTemplate)

    if (!validation.valid) {
      return {
        status: 'error',
        errors: validation.errors,
      }
    }

    return {
      status: 'success',
      template: normalizedTemplate,
    }
  } catch {
    return {
      status: 'error',
      errors: [
        {
          path: '$',
          message: 'Invalid JSON',
        },
      ],
    }
  }
}
