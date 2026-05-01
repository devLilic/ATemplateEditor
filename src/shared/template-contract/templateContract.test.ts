import { describe, expect, it } from 'vitest'
import {
  createEmptyTemplate,
  createImageElement,
  createLayer,
  createShapeElement,
  createTextElement,
} from './templateContract'

describe('template contract base', () => {
  it('creates an empty template with the expected top-level contract fields', () => {
    const template = createEmptyTemplate()

    expect(template).toHaveProperty('schemaVersion')
    expect(template).toHaveProperty('id')
    expect(template).toHaveProperty('name')
    expect(template).toHaveProperty('type')
    expect(template).toHaveProperty('canvas')
    expect(template).toHaveProperty('layers')
    expect(template).toHaveProperty('elements')
    expect(template).toHaveProperty('assets')
    expect(template).toHaveProperty('editableFields')
    expect(template).toHaveProperty('bindings')
    expect(template).toHaveProperty('previewData')
    expect(template).toHaveProperty('osc')
    expect(template).toHaveProperty('onAir')
    expect(template).toHaveProperty('metadata')
    expect(template).toHaveProperty('fallbackValues')
  })

  it('uses primitive defaults for the template identity fields', () => {
    const template = createEmptyTemplate()

    expect(typeof template.schemaVersion).toBe('string')
    expect(typeof template.id).toBe('string')
    expect(template.id.trim().length).toBeGreaterThan(0)
    expect(typeof template.name).toBe('string')
    expect(typeof template.type).toBe('string')
  })

  it('creates a default 1920x1080 canvas', () => {
    const template = createEmptyTemplate()

    expect(template.canvas).toHaveProperty('width')
    expect(template.canvas).toHaveProperty('height')
    expect(template.canvas.width).toBe(1920)
    expect(template.canvas.height).toBe(1080)
  })

  it('uses collection defaults for template content fields', () => {
    const template = createEmptyTemplate()

    expect(Array.isArray(template.layers)).toBe(true)
    expect(Array.isArray(template.elements)).toBe(true)
    expect(Array.isArray(template.assets)).toBe(true)
    expect(Array.isArray(template.editableFields)).toBe(true)
    expect(Array.isArray(template.bindings)).toBe(true)
  })

  it('uses object defaults for preview and fallback data', () => {
    const template = createEmptyTemplate()

    expect(template.previewData).toEqual(expect.any(Object))
    expect(template.fallbackValues).toEqual(expect.any(Object))
  })

  it('creates metadata fields for future template ownership details', () => {
    const template = createEmptyTemplate()

    expect(template.metadata).toHaveProperty('createdAt')
    expect(typeof template.metadata.createdAt).toBe('string')
    expect(template.metadata).toHaveProperty('updatedAt')
    expect(typeof template.metadata.updatedAt).toBe('string')
    expect(template.metadata).toHaveProperty('author')
    expect(['string', 'undefined']).toContain(typeof template.metadata.author)
    expect(template.metadata).toHaveProperty('description')
    expect(['string', 'undefined']).toContain(typeof template.metadata.description)
  })

  it('creates OSC defaults for future OnAir Player integration', () => {
    const template = createEmptyTemplate()

    expect(template.osc.enabled).toBe(false)
    expect(template.osc).toHaveProperty('playCommand')
    expect(['object', 'undefined']).toContain(typeof template.osc.playCommand)
    expect(template.osc).toHaveProperty('stopCommand')
    expect(['object', 'undefined']).toContain(typeof template.osc.stopCommand)
  })

  it('creates onAir defaults for future playout behavior', () => {
    const template = createEmptyTemplate()

    expect(template.onAir).toHaveProperty('durationMs')
    expect(['number', 'undefined']).toContain(typeof template.onAir.durationMs)
    expect(template.onAir.autoHide).toBe(false)
    expect(template.onAir.prerollMs).toBe(0)
    expect(template.onAir.postrollMs).toBe(0)
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
  })

  it('creates a layer with the expected default structure', () => {
    const layer = createLayer()

    expect(typeof layer.id).toBe('string')
    expect(layer.id.trim().length).toBeGreaterThan(0)
    expect(layer.name).toBe('Layer')
    expect(layer.visible).toBe(true)
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
