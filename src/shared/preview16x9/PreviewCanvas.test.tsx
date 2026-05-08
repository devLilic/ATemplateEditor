import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createDefaultTemplate } from '../template-contract/templateDefaults'
import {
  createBackgroundLayer,
  createEmptyTemplate,
  createField,
  createImageLayer,
  createShapeLayer,
  createTextLayer,
  type TemplateContract,
} from '../template-contract/templateContract'
import { PreviewCanvas } from './PreviewCanvas'

const DEFAULT_WIDTH = 640
const DEFAULT_HEIGHT = 360

function renderPreview(template: TemplateContract, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT) {
  return renderToStaticMarkup(createElement(PreviewCanvas, { template, width, height }))
}

function renderPreviewInput(input: {
  template: TemplateContract
  data?: Record<string, string>
  mode?: 'editor' | 'viewer'
}) {
  return renderToStaticMarkup(
    createElement(PreviewCanvas as unknown as (props: Record<string, unknown>) => JSX.Element, {
      ...input,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
    }),
  )
}

function createTextResolutionTemplate(input: {
  fieldId?: string
  sampleData?: Record<string, string>
  fields?: Array<ReturnType<typeof createField>>
  fallbackText?: string
}) {
  const template = createEmptyTemplate({ name: 'Preview resolution template' })
  const textLayer = createTextLayer({
    name: 'Headline',
    zIndex: 0,
    fieldId: input.fieldId,
    fallbackText: input.fallbackText ?? 'Layer fallback',
  })

  return {
    ...template,
    fields: input.fields ?? [],
    layers: [textLayer],
    preview: {
      ...template.preview,
      sampleData: input.sampleData ?? {},
    },
  }
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

  it('accepts the final preview input with template, optional data, and mode', () => {
    const markup = renderPreviewInput({
      template: createDefaultTemplate(),
      data: { title: 'Input data title' },
      mode: 'editor',
    })

    expect(markup).toContain('data-testid="preview-canvas"')
    expect(markup).toContain('data-testid="preview-frame"')
  })

  it('uses input data[fieldId] before template.preview.sampleData[fieldId]', () => {
    const template = createTextResolutionTemplate({
      fieldId: 'title',
      fields: [
        createField({
          id: 'title',
          label: 'Title',
          defaultValue: 'Field default',
        }),
      ],
      sampleData: {
        title: 'Sample title',
      },
      fallbackText: 'Layer fallback',
    })

    const markup = renderPreviewInput({
      template,
      data: {
        title: 'Input title',
      },
    })

    expect(markup).toContain('Input title')
    expect(markup).not.toContain('Sample title')
  })

  it('uses template.preview.sampleData[fieldId] before field.defaultValue', () => {
    const template = createTextResolutionTemplate({
      fieldId: 'title',
      fields: [
        createField({
          id: 'title',
          label: 'Title',
          defaultValue: 'Field default',
        }),
      ],
      sampleData: {
        title: 'Sample title',
      },
      fallbackText: 'Layer fallback',
    })

    const markup = renderPreviewInput({
      template,
    })

    expect(markup).toContain('Sample title')
    expect(markup).not.toContain('Field default')
  })

  it('uses field.defaultValue before layer.fallbackText', () => {
    const template = createTextResolutionTemplate({
      fieldId: 'title',
      fields: [
        createField({
          id: 'title',
          label: 'Title',
          defaultValue: 'Field default',
        }),
      ],
      sampleData: {},
      fallbackText: 'Layer fallback',
    })

    const markup = renderPreviewInput({
      template,
    })

    expect(markup).toContain('Field default')
    expect(markup).not.toContain('Layer fallback')
  })

  it('uses layer.fallbackText when the referenced field is missing', () => {
    const template = createTextResolutionTemplate({
      fieldId: 'missing-field',
      fields: [],
      sampleData: {},
      fallbackText: 'Layer fallback',
    })

    const markup = renderPreviewInput({
      template,
    })

    expect(markup).toContain('Layer fallback')
  })

  it('uses layer.fallbackText when a text layer has no fieldId', () => {
    const template = createTextResolutionTemplate({
      fields: [
        createField({
          id: 'title',
          label: 'Title',
          defaultValue: 'Field default',
        }),
      ],
      sampleData: {
        title: 'Sample title',
      },
      fallbackText: 'Standalone fallback',
    })

    const markup = renderPreviewInput({
      template,
    })

    expect(markup).toContain('Standalone fallback')
    expect(markup).not.toContain('Sample title')
  })

  it('sorts layers by zIndex before rendering', () => {
    const template = {
      ...createEmptyTemplate({ name: 'Sorted template' }),
      layers: [
        createTextLayer({
          name: 'Top',
          zIndex: 20,
          fallbackText: 'Top text',
        }),
        createTextLayer({
          name: 'Bottom',
          zIndex: 0,
          fallbackText: 'Bottom text',
        }),
        createTextLayer({
          name: 'Middle',
          zIndex: 10,
          fallbackText: 'Middle text',
        }),
      ],
    }

    const markup = renderPreviewInput({
      template,
    })

    expect(markup.indexOf('Bottom text')).toBeLessThan(markup.indexOf('Middle text'))
    expect(markup.indexOf('Middle text')).toBeLessThan(markup.indexOf('Top text'))
  })

  it('does not render layers with visible=false', () => {
    const template = {
      ...createEmptyTemplate({ name: 'Visibility template' }),
      layers: [
        createTextLayer({
          name: 'Visible',
          zIndex: 0,
          fallbackText: 'Visible text',
        }),
        createTextLayer({
          name: 'Hidden',
          zIndex: 1,
          fallbackText: 'Hidden text',
          visible: false,
        }),
      ],
    }

    const markup = renderPreviewInput({
      template,
    })

    expect(markup).toContain('Visible text')
    expect(markup).not.toContain('Hidden text')
  })

  it('shows the safe area overlay in editor mode when showSafeArea is enabled', () => {
    const template = {
      ...createDefaultTemplate(),
      preview: {
        ...createDefaultTemplate().preview,
        showSafeArea: true,
      },
    }

    const markup = renderPreviewInput({
      template,
      mode: 'editor',
    })

    expect(markup).toContain('data-preview-overlay="safe-area"')
  })

  it('shows layer bounds overlays in editor mode when showLayerBounds is enabled', () => {
    const template = {
      ...createDefaultTemplate(),
      preview: {
        ...createDefaultTemplate().preview,
        showLayerBounds: true,
      },
    }

    const markup = renderPreviewInput({
      template,
      mode: 'editor',
    })

    expect(markup).toContain('data-preview-overlay="layer-bounds"')
  })
})
