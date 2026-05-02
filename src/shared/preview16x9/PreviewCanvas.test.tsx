import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createDefaultTemplate } from '../template-contract/templateDefaults'
import {
  createImageElement,
  createShapeElement,
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

  it('renders previewData.title inside a text element', () => {
    const template = createDefaultTemplate({
      titlePreview: 'Breaking News',
    })

    const markup = renderPreview(template)

    expect(markup).toContain('Breaking News')
    expect(markup).toContain('data-kind="text"')
  })

  it('renders shape elements with data-kind="shape"', () => {
    const template = createDefaultTemplate()
    const shapeElement = createShapeElement({
      layerId: template.layers[0].id,
      name: 'Background box',
    })

    const markup = renderPreview({
      ...template,
      elements: [...template.elements, shapeElement],
    })

    expect(markup).toContain('data-kind="shape"')
  })

  it('renders unresolved image elements with a visible placeholder marker', () => {
    const template = createDefaultTemplate()
    const imageElement = createImageElement({
      layerId: template.layers[0].id,
      name: 'Logo',
    })

    const markup = renderPreview({
      ...template,
      elements: [...template.elements, imageElement],
    })

    expect(markup).toContain('data-kind="image"')
    expect(markup).toMatch(/data-placeholder="true"|placeholder|missing|unresolved|no asset/i)
  })

  it('does not crash when the template has no elements and renders an empty frame', () => {
    const template = {
      ...createDefaultTemplate(),
      elements: [],
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
})
