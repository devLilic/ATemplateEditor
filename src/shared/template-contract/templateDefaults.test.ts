import { describe, expect, it } from 'vitest'
import {
  createDefaultTemplate,
  getTemplateFieldValue,
  setTemplateFallbackValue,
  setTemplatePreviewValue,
} from './templateDefaults'

describe('default template factory', () => {
  it('creates a useful default broadcast graphics template', () => {
    const template = createDefaultTemplate()

    expect(template.schemaVersion).toBe('1.0.0')
    expect(template.canvas).toEqual({ width: 1920, height: 1080 })

    expect(template.layers.length).toBeGreaterThanOrEqual(1)
    const mainLayer = template.layers[0]
    expect(mainLayer.name).toBe('Main Layer')
    expect(mainLayer.type).toBe('text')

    const textElement = template.elements.find((element) => element.kind === 'text')
    expect(textElement).toBeDefined()
    expect(textElement?.layerId).toBe(mainLayer.id)
    expect(textElement?.fallbackText).toBe('Sample title')

    expect(template.previewData).toHaveProperty('title', 'Sample title')
    expect(template.fallbackValues).toHaveProperty('title', 'Sample title')
    expect(template.metadata.description).toBe('Default broadcast graphics template')
  })

  it('creates a default template with custom title input values', () => {
    const template = createDefaultTemplate({
      name: 'Breaking News',
      titleFallback: 'Fallback headline',
      titlePreview: 'Preview headline',
    })
    const textElement = template.elements.find((element) => element.kind === 'text')

    expect(template.name).toBe('Breaking News')
    expect(template.fallbackValues).toHaveProperty('title', 'Fallback headline')
    expect(template.previewData).toHaveProperty('title', 'Preview headline')
    expect(textElement?.fallbackText).toBe('Fallback headline')
    expect(template.editableFields[0].defaultValue).toBe('Fallback headline')
  })

  it('reads a template field from preview data before fallback values', () => {
    const template = {
      ...createDefaultTemplate(),
      previewData: { title: 'Preview title' },
      fallbackValues: { title: 'Fallback title' },
    }

    expect(getTemplateFieldValue(template, 'title')).toBe('Preview title')
  })

  it('creates one editable title field bound to the text element', () => {
    const template = createDefaultTemplate()
    const textElement = template.elements.find((element) => element.kind === 'text')

    expect(template.editableFields).toHaveLength(1)
    expect(template.editableFields[0]).toMatchObject({
      key: 'title',
      label: 'Title',
      type: 'text',
      required: false,
      defaultValue: 'Sample title',
    })
    expect(typeof template.editableFields[0].id).toBe('string')
    expect(template.editableFields[0].id.trim().length).toBeGreaterThan(0)

    expect(template.bindings).toHaveLength(1)
    expect(template.bindings[0]).toMatchObject({
      fieldKey: 'title',
      elementId: textElement?.id,
      targetProperty: 'text',
    })
  })

  it('reads a template field from fallback values when preview data is missing', () => {
    const template = {
      ...createDefaultTemplate(),
      previewData: {},
      fallbackValues: { title: 'Fallback title' },
    }

    expect(getTemplateFieldValue(template, 'title')).toBe('Fallback title')
  })

  it('returns an empty string when a template field has no preview or fallback value', () => {
    const template = {
      ...createDefaultTemplate(),
      previewData: {},
      fallbackValues: {},
    }

    expect(getTemplateFieldValue(template, 'title')).toBe('')
  })

  it('sets a template fallback value without mutating the original template', () => {
    const template = {
      ...createDefaultTemplate(),
      fallbackValues: {},
    }
    const updatedTemplate = setTemplateFallbackValue(template, 'title', 'Fallback')

    expect(updatedTemplate).not.toBe(template)
    expect(template.fallbackValues).not.toHaveProperty('title')
    expect(updatedTemplate.fallbackValues).toHaveProperty('title', 'Fallback')
  })

  it('sets a template preview value without mutating the original template', () => {
    const template = {
      ...createDefaultTemplate(),
      previewData: {},
    }
    const updatedTemplate = setTemplatePreviewValue(template, 'title', 'Preview')

    expect(updatedTemplate).not.toBe(template)
    expect(template.previewData).not.toHaveProperty('title')
    expect(updatedTemplate.previewData).toHaveProperty('title', 'Preview')
  })
})
