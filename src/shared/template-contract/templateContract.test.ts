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
import * as templateContractModule from './templateContract'

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
    expect(layer.locked).toBe(false)
    expect(layer.zIndex).toBe(0)
    expect(layer.opacity).toBe(1)
    expect(layer.box).toEqual({
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
    })
  })

  it('allows a new template to receive a created layer manually', () => {
    const layer = createLayer({ name: 'Main' })
    const template = createEmptyTemplate()
    const updatedTemplate = { ...template, layers: [layer] }

    expect(updatedTemplate.layers[0].name).toBe('Main')
  })
})

describe('template layer contract final model', () => {
  function getLayerFactories() {
    const moduleRecord = templateContractModule as Record<string, unknown>

    return {
      createTextLayer: moduleRecord.createTextLayer as
        | ((input?: Record<string, unknown>) => Record<string, unknown>)
        | undefined,
      createImageLayer: moduleRecord.createImageLayer as
        | ((input?: Record<string, unknown>) => Record<string, unknown>)
        | undefined,
      createShapeLayer: moduleRecord.createShapeLayer as
        | ((input?: Record<string, unknown>) => Record<string, unknown>)
        | undefined,
      createBackgroundLayer: moduleRecord.createBackgroundLayer as
        | ((input?: Record<string, unknown>) => Record<string, unknown>)
        | undefined,
      createGroupLayer: moduleRecord.createGroupLayer as
        | ((input?: Record<string, unknown>) => Record<string, unknown>)
        | undefined,
    }
  }

  function expectCommonLayerFields(layer: Record<string, unknown>, type: string) {
    expect(typeof layer.id).toBe('string')
    expect((layer.id as string).trim().length).toBeGreaterThan(0)
    expect(typeof layer.name).toBe('string')
    expect(layer.type).toBe(type)
    expect(typeof layer.visible).toBe('boolean')
    expect(typeof layer.locked).toBe('boolean')
    expect(typeof layer.zIndex).toBe('number')
    expect(layer).toHaveProperty('box')
    expect(layer.box).toEqual(
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number),
      }),
    )

    if ('opacity' in layer && layer.opacity !== undefined) {
      expect(typeof layer.opacity).toBe('number')
    }
  }

  it('exposes the final layer factory exports', () => {
    const factories = getLayerFactories()

    expect(typeof factories.createTextLayer).toBe('function')
    expect(typeof factories.createImageLayer).toBe('function')
    expect(typeof factories.createShapeLayer).toBe('function')
    expect(typeof factories.createBackgroundLayer).toBe('function')
    expect(typeof factories.createGroupLayer).toBe('function')
  })

  it('supports text, image, shape, background, and group as the allowed layer types', () => {
    const factories = getLayerFactories()
    const textLayer = factories.createTextLayer?.()
    const imageLayer = factories.createImageLayer?.()
    const shapeLayer = factories.createShapeLayer?.()
    const backgroundLayer = factories.createBackgroundLayer?.()
    const groupLayer = factories.createGroupLayer?.()

    expect(textLayer?.type).toBe('text')
    expect(imageLayer?.type).toBe('image')
    expect(shapeLayer?.type).toBe('shape')
    expect(backgroundLayer?.type).toBe('background')
    expect(groupLayer?.type).toBe('group')
  })

  it('creates a text layer with the final common contract fields', () => {
    const { createTextLayer } = getLayerFactories()
    const layer = createTextLayer?.({ name: 'Headline' })

    expect(layer).toBeDefined()
    expectCommonLayerFields(layer as Record<string, unknown>, 'text')
  })

  it('creates a text layer with optional fieldId, fallbackText, style, and behavior', () => {
    const { createTextLayer } = getLayerFactories()
    const layer = createTextLayer?.({
      name: 'Headline',
      fieldId: 'title',
      fallbackText: 'Sample title',
    })

    expect(layer).toEqual(
      expect.objectContaining({
        type: 'text',
        fieldId: expect.anything(),
        fallbackText: expect.anything(),
        style: expect.any(Object),
        behavior: expect.any(Object),
      }),
    )
  })

  it('creates an image layer with optional assetId, fallbackPath, and style.objectFit', () => {
    const { createImageLayer } = getLayerFactories()
    const layer = createImageLayer?.({
      name: 'Logo',
      assetId: 'asset-logo',
      fallbackPath: 'assets/logo.png',
    })

    expect(layer).toBeDefined()
    expectCommonLayerFields(layer as Record<string, unknown>, 'image')
    expect(layer).toEqual(
      expect.objectContaining({
        assetId: expect.anything(),
        fallbackPath: expect.anything(),
        style: expect.objectContaining({
          objectFit: expect.any(String),
        }),
      }),
    )
  })

  it('creates a shape layer with the final shape options and style fields', () => {
    const { createShapeLayer } = getLayerFactories()
    const layer = createShapeLayer?.({
      name: 'Lower third box',
      shape: 'rectangle',
    })

    expect(layer).toBeDefined()
    expectCommonLayerFields(layer as Record<string, unknown>, 'shape')
    expect(layer).toEqual(
      expect.objectContaining({
        shape: expect.stringMatching(/^(rectangle|ellipse|line)$/),
        style: expect.objectContaining({
          fill: expect.any(String),
          stroke: expect.any(String),
          strokeWidth: expect.any(Number),
          borderRadius: expect.any(Number),
        }),
      }),
    )
  })

  it('creates a background layer with optional fill, assetId, and objectFit in style', () => {
    const { createBackgroundLayer } = getLayerFactories()
    const layer = createBackgroundLayer?.({
      name: 'Background',
    })

    expect(layer).toBeDefined()
    expectCommonLayerFields(layer as Record<string, unknown>, 'background')
    expect(layer).toEqual(
      expect.objectContaining({
        style: expect.any(Object),
      }),
    )

    const style = (layer as Record<string, unknown>).style as Record<string, unknown>
    expect(style).toBeDefined()
    expect(['string', 'undefined']).toContain(typeof style.fill)
    expect(['string', 'undefined']).toContain(typeof style.assetId)
    expect(['string', 'undefined']).toContain(typeof style.objectFit)
  })

  it('creates a group layer with children string ids', () => {
    const { createGroupLayer } = getLayerFactories()
    const layer = createGroupLayer?.({
      name: 'Group',
      children: ['layer-title', 'layer-logo'],
    })

    expect(layer).toBeDefined()
    expectCommonLayerFields(layer as Record<string, unknown>, 'group')
    expect(layer).toEqual(
      expect.objectContaining({
        children: ['layer-title', 'layer-logo'],
      }),
    )
    expect(Array.isArray((layer as Record<string, unknown>).children)).toBe(true)
    expect(((layer as Record<string, unknown>).children as unknown[]).every((child) => typeof child === 'string')).toBe(
      true,
    )
  })
})
