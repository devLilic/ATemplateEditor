// @vitest-environment jsdom

import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { act } from 'react-dom/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PreviewCanvas } from '@/shared/preview16x9'
import {
  createEmptyTemplate,
  createLayer,
  createTextElement,
  createTextLayer,
} from '@/shared/template-contract/templateContract'

async function renderLayersPanel() {
  const module = await import('./LayersPanel')
  const LayersPanel = module.LayersPanel

  const template = createTemplateWithTwoLayers()
  const onTemplateChange = vi.fn()
  const onSelectLayer = vi.fn()
  const container = document.createElement('div')
  document.body.appendChild(container)

  let root: Root

  await act(async () => {
    root = createRoot(container)
    root.render(
      <LayersPanel
        onSelectLayer={onSelectLayer}
        onTemplateChange={onTemplateChange}
        selectedLayerId={template.layers[1]?.id}
        template={template}
      />,
    )
  })

  return {
    container,
    onSelectLayer,
    onTemplateChange,
    template,
    cleanup: async () => {
      await act(async () => {
        root.unmount()
      })
      container.remove()
    },
  }
}

async function renderSingleLayerPanel() {
  const module = await import('./LayersPanel')
  const LayersPanel = module.LayersPanel

  const layer = createLayer({ name: 'Only Layer', type: 'text', zIndex: 0 })
  const onlyElement = {
    ...createTextElement({
      layerId: layer.id,
      name: 'Only text',
    }),
    fallbackText: 'Only text',
  }
  const template = {
    ...createEmptyTemplate({ name: 'Single layer template' }),
    layers: [layer],
    elements: [onlyElement],
  }
  const onTemplateChange = vi.fn()
  const onSelectLayer = vi.fn()
  const container = document.createElement('div')
  document.body.appendChild(container)

  let root: Root

  await act(async () => {
    root = createRoot(container)
    root.render(
      <LayersPanel
        onSelectLayer={onSelectLayer}
        onTemplateChange={onTemplateChange}
        selectedLayerId={layer.id}
        template={template}
      />,
    )
  })

  return {
    container,
    onTemplateChange,
    template,
    cleanup: async () => {
      await act(async () => {
        root.unmount()
      })
      container.remove()
    },
  }
}

function createTemplateWithTwoLayers() {
  const bottomLayer = createTextLayer({
    name: 'Background',
    zIndex: 0,
    fallbackText: 'Background text',
  })
  const topLayer = createTextLayer({
    name: 'Headline',
    zIndex: 1,
    fallbackText: 'Headline text',
  })
  const backgroundText = {
    ...createTextElement({
      layerId: bottomLayer.id,
      name: 'Background text',
    }),
    fallbackText: 'Background text',
  }
  const headlineText = {
    ...createTextElement({
      layerId: topLayer.id,
      name: 'Headline text',
    }),
    fallbackText: 'Headline text',
  }

  return {
    ...createEmptyTemplate({ name: 'Layered template' }),
    layers: [bottomLayer, topLayer],
    elements: [backgroundText, headlineText],
  }
}

function findExactText(container: ParentNode, text: string) {
  return Array.from(container.querySelectorAll('*')).find((node) => {
    const element = node as HTMLElement
    return (
      element.textContent?.trim() === text &&
      Array.from(element.children).every((child) => child.textContent?.trim() !== text)
    )
  }) as HTMLElement | undefined
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.resetModules()
})

describe('LayersPanel', () => {
  it('renders the list of layers', async () => {
    const view = await renderLayersPanel()

    try {
      expect(view.container.textContent).toContain('Background')
      expect(view.container.textContent).toContain('Headline')
    } finally {
      await view.cleanup()
    }
  })

  it('shows each layer name, visible toggle, locked toggle, and zIndex', async () => {
    const view = await renderLayersPanel()

    try {
      expect(view.container.textContent).toContain('Add text layer')
      expect(view.container.textContent).toContain('Add image layer')
      expect(view.container.textContent).toContain('Add shape layer')
      expect(view.container.textContent).toContain('Add background layer')
      expect(view.container.textContent).toContain('Add group layer')
      expect(view.container.textContent).toContain('Background')
      expect(view.container.textContent).toContain('Headline')
      expect(view.container.textContent).toContain('background')
      expect(view.container.textContent).toContain('text')
      expect(view.container.textContent).toContain('0')
      expect(view.container.textContent).toContain('1')
      expect(view.container.querySelectorAll('input[aria-label^="Visible "]')).toHaveLength(2)
      expect(view.container.querySelectorAll('input[aria-label^="Locked "]')).toHaveLength(2)
    } finally {
      await view.cleanup()
    }
  })

  it('adds a text layer', async () => {
    const view = await renderLayersPanel()

    try {
      const button = Array.from(view.container.querySelectorAll('button')).find(
        (element) => element.textContent?.trim() === 'Add text layer',
      ) as HTMLButtonElement | undefined

      expect(button).toBeDefined()

      await act(async () => {
        button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })

      expect(view.onTemplateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          layers: expect.arrayContaining([expect.objectContaining({ type: 'text' })]),
        }),
      )
    } finally {
      await view.cleanup()
    }
  })

  it('adds an image layer', async () => {
    const view = await renderLayersPanel()

    try {
      const button = Array.from(view.container.querySelectorAll('button')).find(
        (element) => element.textContent?.trim() === 'Add image layer',
      ) as HTMLButtonElement | undefined

      expect(button).toBeDefined()

      await act(async () => {
        button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })

      expect(view.onTemplateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          layers: expect.arrayContaining([expect.objectContaining({ type: 'image' })]),
        }),
      )
    } finally {
      await view.cleanup()
    }
  })

  it('adds a shape layer', async () => {
    const view = await renderLayersPanel()

    try {
      const button = Array.from(view.container.querySelectorAll('button')).find(
        (element) => element.textContent?.trim() === 'Add shape layer',
      ) as HTMLButtonElement | undefined

      expect(button).toBeDefined()

      await act(async () => {
        button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })

      expect(view.onTemplateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          layers: expect.arrayContaining([expect.objectContaining({ type: 'shape' })]),
        }),
      )
    } finally {
      await view.cleanup()
    }
  })

  it('adds a background layer', async () => {
    const view = await renderLayersPanel()

    try {
      const button = Array.from(view.container.querySelectorAll('button')).find(
        (element) => element.textContent?.trim() === 'Add background layer',
      ) as HTMLButtonElement | undefined

      expect(button).toBeDefined()

      await act(async () => {
        button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })

      expect(view.onTemplateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          layers: expect.arrayContaining([expect.objectContaining({ type: 'background' })]),
        }),
      )
    } finally {
      await view.cleanup()
    }
  })

  it('adds a group layer', async () => {
    const view = await renderLayersPanel()

    try {
      const button = Array.from(view.container.querySelectorAll('button')).find(
        (element) => element.textContent?.trim() === 'Add group layer',
      ) as HTMLButtonElement | undefined

      expect(button).toBeDefined()

      await act(async () => {
        button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })

      expect(view.onTemplateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          layers: expect.arrayContaining([expect.objectContaining({ type: 'group' })]),
        }),
      )
    } finally {
      await view.cleanup()
    }
  })

  it('marks the selected layer with data-selected="true"', async () => {
    const view = await renderLayersPanel()

    try {
      const selectedLayer = findExactText(view.container, 'Headline')

      expect(selectedLayer).toBeDefined()
      expect(
        selectedLayer?.closest('[data-selected="true"]') ?? selectedLayer?.querySelector('[data-selected="true"]'),
      ).not.toBeNull()
    } finally {
      await view.cleanup()
    }
  })

  it('updates layer.visible when the visible toggle changes', async () => {
    const view = await renderLayersPanel()

    try {
      const visibleToggle = view.container.querySelector(
        `input[aria-label="Visible ${view.template.layers[0]?.name}"]`,
      ) as HTMLInputElement | null

      expect(visibleToggle).not.toBeNull()

      await act(async () => {
        if (!visibleToggle) {
          return
        }

        visibleToggle.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })

      expect(view.onTemplateChange).toHaveBeenCalledTimes(1)
      expect(view.onTemplateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          layers: expect.arrayContaining([
            expect.objectContaining({
              id: view.template.layers[0]?.id,
              visible: false,
            }),
          ]),
        }),
      )
    } finally {
      await view.cleanup()
    }
  })

  it('updates layer.locked when the locked toggle changes', async () => {
    const view = await renderLayersPanel()

    try {
      const lockedToggle = view.container.querySelector(
        `input[aria-label="Locked ${view.template.layers[1]?.name}"]`,
      ) as HTMLInputElement | null

      expect(lockedToggle).not.toBeNull()

      await act(async () => {
        if (!lockedToggle) {
          return
        }

        lockedToggle.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })

      expect(view.onTemplateChange).toHaveBeenCalledTimes(1)
      expect(view.onTemplateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          layers: expect.arrayContaining([
            expect.objectContaining({
              id: view.template.layers[1]?.id,
              locked: true,
            }),
          ]),
        }),
      )
    } finally {
      await view.cleanup()
    }
  })

  it('renders a delete layer control for the selected layer', async () => {
    const view = await renderLayersPanel()

    try {
      const deleteButton = view.container.querySelector('button[aria-label^="Delete layer "]')

      expect(deleteButton).not.toBeNull()
    } finally {
      await view.cleanup()
    }
  })

  it('deletes the selected layer and removes its elements from the template', async () => {
    const view = await renderLayersPanel()

    try {
      const selectedLayer = view.template.layers[1]!
      const deleteButton = view.container.querySelector(
        `button[aria-label="Delete layer ${selectedLayer.name}"]`,
      ) as HTMLButtonElement | null

      expect(deleteButton).not.toBeNull()

      await act(async () => {
        deleteButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })

      expect(view.onTemplateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          layers: [
            expect.objectContaining({
              id: view.template.layers[0]!.id,
            }),
          ],
          elements: [
            expect.objectContaining({
              layerId: view.template.layers[0]!.id,
            }),
          ],
        }),
      )
      expect(view.onTemplateChange.mock.calls[0]?.[0]?.layers).toHaveLength(1)
      expect(view.onTemplateChange.mock.calls[0]?.[0]?.elements).toHaveLength(1)
    } finally {
      await view.cleanup()
    }
  })

  it('does not allow deleting the last remaining layer', async () => {
    const view = await renderSingleLayerPanel()

    try {
      const deleteButton = view.container.querySelector(
        `button[aria-label="Delete layer ${view.template.layers[0]!.name}"]`,
      ) as HTMLButtonElement | null

      expect(deleteButton).not.toBeNull()
      expect(deleteButton?.disabled).toBe(true)

      await act(async () => {
        deleteButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })

      expect(view.onTemplateChange).not.toHaveBeenCalled()
    } finally {
      await view.cleanup()
    }
  })
})

describe('reorderLayersFromTopList', () => {
  it('updates zIndex based on the top-first layer order', async () => {
    const { reorderLayersFromTopList } = await import('./layersPanelState')
    const template = createTemplateWithTwoLayers()
    const reorderedTemplate = reorderLayersFromTopList(template, [
      template.layers[1]!.id,
      template.layers[0]!.id,
    ])

    expect(reorderedTemplate.layers[0]).toMatchObject({ id: template.layers[1]!.id, zIndex: 1 })
    expect(reorderedTemplate.layers[1]).toMatchObject({ id: template.layers[0]!.id, zIndex: 0 })
  })

  it('gives the top layer in the list the highest zIndex', async () => {
    const { reorderLayersFromTopList } = await import('./layersPanelState')
    const template = createTemplateWithTwoLayers()
    const reorderedTemplate = reorderLayersFromTopList(template, [
      template.layers[0]!.id,
      template.layers[1]!.id,
    ])
    const zIndexes = reorderedTemplate.layers.map((layer) => layer.zIndex)

    expect(Math.max(...zIndexes)).toBe(
      reorderedTemplate.layers.find((layer) => layer.id === template.layers[0]!.id)?.zIndex,
    )
  })

  it('makes the preview respect the new zIndex order', async () => {
    const { reorderLayersFromTopList } = await import('./layersPanelState')
    const template = createTemplateWithTwoLayers()
    const reorderedTemplate = reorderLayersFromTopList(template, [
      template.layers[0]!.id,
      template.layers[1]!.id,
    ])
    const markup = renderToStaticMarkup(
      createElement(PreviewCanvas, {
        template: reorderedTemplate,
        width: 640,
        height: 360,
      }),
    )

    expect(markup.indexOf('Background text')).toBeGreaterThan(markup.indexOf('Headline text'))
  })
})
