import { describe, expect, it } from 'vitest'
import { createDefaultTemplate } from './templateDefaults'
import {
  createEmptyTemplate,
  createField,
  createImageElement,
  createLayer,
  createShapeElement,
  createTextElement,
  updateTemplateMetadata,
} from './templateContract'

describe('template contract base', () => {
  it('creates an empty template with the final top-level contract fields only', () => {
    const template = createEmptyTemplate() as Record<string, unknown>

    expect(Object.keys(template).sort()).toEqual(
      [
        'schemaVersion',
        'id',
        'name',
        'description',
        'canvas',
        'output',
        'fields',
        'assets',
        'layers',
        'preview',
        'metadata',
      ].sort(),
    )
  })

  it('uses primitive defaults for the template identity fields', () => {
    const template = createEmptyTemplate()

    expect(typeof template.schemaVersion).toBe('string')
    expect(typeof template.id).toBe('string')
    expect(template.id.trim().length).toBeGreaterThan(0)
    expect(typeof template.name).toBe('string')
    expect(template).toHaveProperty('description')
    expect(['string', 'undefined']).toContain(typeof template.description)
  })

  it('does not include removed legacy root fields', () => {
    const template = createEmptyTemplate()

    expect(template).not.toHaveProperty('osc')
    expect(template).not.toHaveProperty('onAir')
    expect(template).not.toHaveProperty('editableFields')
    expect(template).not.toHaveProperty('bindings')
    expect(template).not.toHaveProperty('previewData')
    expect(template).not.toHaveProperty('fallbackValues')
  })

  it('creates a default liveboard output contract', () => {
    const template = createEmptyTemplate()

    expect(template).toHaveProperty('output.liveboard')
    expect(template).toHaveProperty('output.liveboard.templateName', '')
  })

  it('creates a default 1920x1080 16:9 canvas with safe area enabled', () => {
    const template = createEmptyTemplate()

    expect(template).toHaveProperty('canvas.width', 1920)
    expect(template).toHaveProperty('canvas.height', 1080)
    expect(template).toHaveProperty('canvas.aspectRatio', '16:9')
    expect(template).toHaveProperty('canvas.safeArea.enabled', true)
    expect(template).toHaveProperty('canvas.safeArea.marginX', 80)
    expect(template).toHaveProperty('canvas.safeArea.marginY', 60)
  })

  it('uses collection defaults for template content fields', () => {
    const template = createEmptyTemplate() as {
      fields?: unknown[]
      assets?: unknown[]
      layers?: unknown[]
    }

    expect(template.fields).toEqual([])
    expect(template.assets).toEqual([])
    expect(template.layers).toEqual([])
  })

  it('uses object defaults for preview data and rendering helpers', () => {
    const template = createEmptyTemplate()

    expect(template).toHaveProperty('preview.sampleData')
    expect(template).toHaveProperty('preview.background.type', 'color')
    expect(template).toHaveProperty('preview.background.value', '#111827')
    expect(template).toHaveProperty('preview.showSafeArea', true)
    expect(template).toHaveProperty('preview.showLayerBounds', false)
  })

  it('creates metadata fields for template lifecycle details', () => {
    const template = createEmptyTemplate()

    expect(template.metadata).toHaveProperty('createdAt')
    expect(typeof template.metadata.createdAt).toBe('string')
    expect(template.metadata).toHaveProperty('updatedAt')
    expect(typeof template.metadata.updatedAt).toBe('string')
    expect(template.metadata).toHaveProperty('duplicatedFromTemplateId')
    expect((template.metadata as Record<string, unknown>).duplicatedFromTemplateId).toBeNull()
    expect(template.metadata).toHaveProperty('tags')
    expect(Array.isArray(template.metadata.tags)).toBe(true)
    expect(template.metadata.tags).toEqual([])
  })

  it('updates template metadata immutably', () => {
    const template = createEmptyTemplate()
    const updatedTemplate = updateTemplateMetadata(template, {
      duplicatedFromTemplateId: 'template-source',
      tags: ['sports', 'lower-third'],
    } as Parameters<typeof updateTemplateMetadata>[1])

    expect(updatedTemplate).not.toBe(template)
    expect(updatedTemplate.metadata).not.toBe(template.metadata)
    expect((updatedTemplate.metadata as Record<string, unknown>).duplicatedFromTemplateId).toBe(
      'template-source',
    )
    expect(updatedTemplate.metadata.tags).toEqual(['sports', 'lower-third'])
    expect((template.metadata as Record<string, unknown>).duplicatedFromTemplateId).toBeNull()
    expect(template.metadata.tags).toEqual([])
  })

  it('creates a default template with one text layer, one title field, preview data, and blank liveboard template name', () => {
    const template = createDefaultTemplate() as {
      fields?: Array<Record<string, unknown>>
      layers?: Array<Record<string, unknown>>
      preview?: {
        sampleData?: Record<string, unknown>
      }
      output?: {
        liveboard?: {
          templateName?: string
        }
      }
    }

    expect(template.layers).toHaveLength(1)
    expect(template.layers?.[0]).toHaveProperty('type', 'text')

    expect(Array.isArray(template.fields)).toBe(true)
    expect(template.fields ?? []).toHaveLength(1)
    expect(template.fields?.[0]).toHaveProperty('id', 'title')
    expect(template.fields?.[0]).toHaveProperty('label', 'Title')
    expect(template.fields?.[0]).toHaveProperty('type', 'text')
    expect(template.fields?.[0]).toHaveProperty('required', false)
    expect(template.fields?.[0]).toHaveProperty('defaultValue', 'Sample title')

    expect(template.preview?.sampleData).toHaveProperty('title', 'Sample title')
    expect(template.output?.liveboard?.templateName).toBe('')
  })

  it('creates a text field contract with generated defaults', () => {
    const field = createField({
      label: 'Headline',
      placeholder: 'Enter headline',
      description: 'Primary text field',
    })

    expect(typeof field.id).toBe('string')
    expect(field.id.trim().length).toBeGreaterThan(0)
    expect(field.label).toBe('Headline')
    expect(field.type).toBe('text')
    expect(field.required).toBe(false)
    expect(field.defaultValue).toBeUndefined()
    expect(field.placeholder).toBe('Enter headline')
    expect(field.description).toBe('Primary text field')
  })

  it('creates a text element with the expected base structure', () => {
    const element = createTextElement({ layerId: 'layer-main', name: 'Headline' })

    expect(element.kind).toBe('text')
    expect(typeof element.id).toBe('string')
    expect(element.id.trim().length).toBeGreaterThan(0)
    expect(element.layerId).toBe('layer-main')
    expect(element.name).toBe('Headline')
    expect(element.position).toHaveProperty('x')
    expect(element.position).toHaveProperty('y')
    expect(element.size).toHaveProperty('width')
    expect(element.size).toHaveProperty('height')
    expect(element.rotation).toBe(0)
    expect(element.visible).toBe(true)
    expect(element.locked).toBe(false)
    expect(element).toHaveProperty('sourceField')
    expect(element.fallbackText).toBe('')
    expect(element.style).toHaveProperty('fontSize')
    expect(element.style).toHaveProperty('fontFamily')
    expect(element.style).toHaveProperty('color')
    expect(element.style).toHaveProperty('textAlign')
    expect(element.style).toHaveProperty('fontWeight')
    expect(element.style).toHaveProperty('lineHeight')
    expect(element.style).toHaveProperty('letterSpacing')
    expect(element.style).toHaveProperty('verticalAlign')
    expect(element.style).toHaveProperty('textTransform')
    expect(element.style).toHaveProperty('maxLines')
  })

  it('creates an image element with the expected base structure', () => {
    const element = createImageElement({ layerId: 'layer-media', name: 'Logo' })

    expect(element.kind).toBe('image')
    expect(typeof element.id).toBe('string')
    expect(element.id.trim().length).toBeGreaterThan(0)
    expect(element).toHaveProperty('assetId')
    expect(element.position).toHaveProperty('x')
    expect(element.position).toHaveProperty('y')
    expect(element.size).toHaveProperty('width')
    expect(element.size).toHaveProperty('height')
    expect(element.opacity).toBe(1)
    expect(element.objectFit).toBe('contain')
    expect(element).toHaveProperty('objectPosition')
    expect(element).toHaveProperty('borderRadius')
  })

  it('creates a shape element with the expected base structure', () => {
    const element = createShapeElement({ layerId: 'layer-background', name: 'Lower third box' })

    expect(element.kind).toBe('shape')
    expect(typeof element.id).toBe('string')
    expect(element.id.trim().length).toBeGreaterThan(0)
    expect(element.shapeType).toBe('rectangle')
    expect(element.position).toHaveProperty('x')
    expect(element.position).toHaveProperty('y')
    expect(element.size).toHaveProperty('width')
    expect(element.size).toHaveProperty('height')
    expect(element).toHaveProperty('fillColor')
    expect(element).toHaveProperty('borderColor')
    expect(element.borderWidth).toBe(0)
    expect(element).toHaveProperty('stroke')
    expect(element).toHaveProperty('strokeWidth')
    expect(element).toHaveProperty('borderRadius')
  })

  it('creates a layer with the expected default structure', () => {
    const layer = createLayer()

    expect(typeof layer.id).toBe('string')
    expect(layer.id.trim().length).toBeGreaterThan(0)
    expect(layer.name).toBe('Layer')
    expect(layer.type).toBe('text')
    expect(layer.visible).toBe(true)
    expect(layer.visibility).toEqual({
      mode: 'always',
      fieldId: undefined,
    })
    expect(layer.locked).toBe(false)
    expect(layer.zIndex).toBe(0)
    expect(layer.opacity).toBe(1)
  })

  it('allows a new template to receive a created layer manually', () => {
    const layer = createLayer({ name: 'Main' })
    const template = createEmptyTemplate()
    const updatedTemplate = { ...template, layers: [layer] }

    expect(updatedTemplate.layers[0].name).toBe('Main')
  })
})
