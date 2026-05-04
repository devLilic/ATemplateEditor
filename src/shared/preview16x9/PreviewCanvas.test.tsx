import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createDefaultTemplate } from '../template-contract/templateDefaults'
import {
  createBackgroundLayer,
  createImageLayer,
  createShapeLayer,
  type TemplateContract,
} from '../template-contract/templateContract'
import { PreviewCanvas } from './PreviewCanvas'

const DEFAULT_WIDTH = 640
const DEFAULT_HEIGHT = 360

function renderPreview(template: TemplateContract, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT) {
  return renderToStaticMarkup(createElement(PreviewCanvas, { template, width, height }))
}

describe('PreviewCanvas', () => {
  it('renders the preview canvas container and frame for a valid default template', () => {
    const markup = renderPreview(createDefaultTemplate())

    expect(markup).toContain('data-testid="preview-canvas"')
    expect(markup).toContain('data-testid="preview-frame"')
  })

  it('renders preview.sampleData.title inside a text layer', () => {
    const template = createDefaultTemplate({
      titlePreview: 'Breaking News',
    })

    const markup = renderPreview(template)

    expect(markup).toContain('Breaking News')
    expect(markup).toContain('data-kind="text"')
  })

  it('renders shape layers with data-kind="shape"', () => {
    const template = createDefaultTemplate()
    const shapeLayer = createShapeLayer({
      name: 'Background box',
      zIndex: 1,
    })

    const markup = renderPreview({
      ...template,
      layers: [...template.layers, shapeLayer],
    })

    expect(markup).toContain('data-kind="shape"')
  })

  it('renders unresolved image layers with a visible placeholder marker', () => {
    const template = createDefaultTemplate()
    const imageLayer = createImageLayer({
      name: 'Logo',
      zIndex: 1,
    })

    const markup = renderPreview({
      ...template,
      layers: [...template.layers, imageLayer],
    })

    expect(markup).toContain('data-kind="image"')
    expect(markup).toMatch(/data-placeholder="true"|placeholder|missing|unresolved|no asset/i)
  })

  it('renders a background layer through the final layer model', () => {
    const template = createDefaultTemplate()
    const backgroundLayer = createBackgroundLayer({
      zIndex: -1,
      style: {
        fill: '#000000',
      },
    })

    const markup = renderPreview({
      ...template,
      layers: [backgroundLayer, ...template.layers],
    })

    expect(markup).toContain('data-kind="background"')
  })

  it('does not crash when the template has no layers and renders an empty frame', () => {
    const template = {
      ...createDefaultTemplate(),
      layers: [],
    }

    let markup = ''

    expect(() => {
      markup = renderPreview(template)
    }).not.toThrow()

    expect(markup).toContain('data-testid="preview-frame"')
    expect(markup).not.toContain('data-kind="')
  })

  it('accepts template, width, and height props', () => {
    const markup = renderPreview(createDefaultTemplate(), 960, 540)

    expect(markup).toContain('data-testid="preview-canvas"')
    expect(markup).toContain('data-testid="preview-frame"')
  })

  it('keeps a layer visible when visibility.mode is always', () => {
    const template = createDefaultTemplate({
      titlePreview: '',
      titleFallback: '',
    })

    const markup = renderPreview({
      ...template,
      layers: template.layers.map((layer) => ({
        ...layer,
        visibility: {
          mode: 'always' as const,
          fieldId: template.editableFields[0]?.id,
        },
      })),
    })

    expect(markup).toContain('data-kind="text"')
  })

  it('hides a layer when visibility.mode is whenFieldHasValue and the linked field is empty', () => {
    const template = createDefaultTemplate({
      titlePreview: '',
      titleFallback: '',
    })

    const markup = renderPreview({
      ...template,
      layers: template.layers.map((layer) => ({
        ...layer,
        visibility: {
          mode: 'whenFieldHasValue' as const,
          fieldId: template.editableFields[0]?.id,
        },
      })),
    })

    expect(markup).not.toContain('data-kind="text"')
    expect(markup).toContain('data-testid="preview-frame"')
  })
})
