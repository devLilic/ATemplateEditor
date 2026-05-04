// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createImageElement,
  createLayer,
  createShapeElement,
  createTextElement,
  type TemplateElement,
} from '@/shared/template-contract/templateContract'

type RotatableElement = TemplateElement & {
  rotation?: number
}

function findAllByExactText(container: ParentNode, text: string) {
  return Array.from(container.querySelectorAll('*')).filter((element) => {
    const candidate = element as HTMLElement

    if (candidate.textContent?.trim() !== text) {
      return false
    }

    return Array.from(candidate.children).every((child) => child.textContent?.trim() !== text)
  }) as HTMLElement[]
}

function findByExactText(container: ParentNode, text: string) {
  return findAllByExactText(container, text)[0]
}

function findControl(container: ParentNode, fieldName: string) {
  const escapedFieldName = fieldName.replace(/["\\]/g, '\\$&')
  const directMatch = container.querySelector(
    `input[name="${escapedFieldName}"], select[name="${escapedFieldName}"], textarea[name="${escapedFieldName}"], ` +
      `input[aria-label="${escapedFieldName}"], select[aria-label="${escapedFieldName}"], textarea[aria-label="${escapedFieldName}"]`,
  )

  if (directMatch) {
    return directMatch as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  }

  const label = findByExactText(container, fieldName)

  if (!label) {
    return undefined
  }

  if (label instanceof HTMLLabelElement) {
    if (label.control) {
      return label.control as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    }

    const nestedControl = label.querySelector('input, select, textarea')

    if (nestedControl) {
      return nestedControl as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    }

    const htmlFor = label.getAttribute('for')

    if (htmlFor) {
      const associatedControl = container.querySelector(`#${htmlFor.replace(/["\\]/g, '\\$&')}`)

      if (associatedControl) {
        return associatedControl as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      }
    }
  }

  const nextControl = label.nextElementSibling

  if (nextControl instanceof HTMLInputElement || nextControl instanceof HTMLSelectElement || nextControl instanceof HTMLTextAreaElement) {
    return nextControl
  }

  return undefined
}

function expectControls(container: ParentNode, fieldNames: string[]) {
  for (const fieldName of fieldNames) {
    expect(findControl(container, fieldName), `missing control for ${fieldName}`).toBeDefined()
  }
}

function changeTextLikeControl(
  control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  value: string,
) {
  if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement) {
    control.value = value
  }

  control.dispatchEvent(new Event('input', { bubbles: true }))
  control.dispatchEvent(new Event('change', { bubbles: true }))
}

function changeCheckbox(control: HTMLInputElement, checked: boolean) {
  control.checked = checked
  control.dispatchEvent(new Event('input', { bubbles: true }))
  control.dispatchEvent(new Event('change', { bubbles: true }))
}

function createFixtureElements() {
  const layer = createLayer({
    name: 'Main Layer',
    zIndex: 0,
  })

  const textElement = {
    ...createTextElement({
      layerId: layer.id,
      name: 'Title',
      position: { x: 120, y: 240 },
      size: { width: 900, height: 100 },
    }),
    rotation: 12,
    fallbackText: 'Breaking news',
    style: {
      fontSize: 64,
      fontFamily: 'Arial',
      color: '#FFFFFF',
      textAlign: 'center' as const,
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: 0,
      verticalAlign: 'middle' as const,
      textTransform: 'uppercase' as const,
      maxLines: 2,
    },
  }

  const imageElement = {
    ...createImageElement({
      layerId: layer.id,
      name: 'Logo',
      position: { x: 80, y: 60 },
      size: { width: 320, height: 180 },
    }),
    rotation: 6,
    assetId: 'asset-logo',
    opacity: 0.75,
    objectFit: 'contain' as const,
    objectPosition: 'center center',
    borderRadius: 12,
  } as RotatableElement

  const shapeElement = {
    ...createShapeElement({
      layerId: layer.id,
      name: 'Background Box',
      position: { x: 40, y: 40 },
      size: { width: 640, height: 200 },
    }),
    rotation: 18,
    shapeType: 'rectangle' as const,
    fillColor: '#112233',
    borderColor: '#445566',
    borderWidth: 4,
    stroke: '#778899',
    strokeWidth: 2,
    borderRadius: 16,
  } as RotatableElement

  return {
    textElement,
    imageElement,
    shapeElement,
  }
}

async function renderElementPropertiesPanel({
  element,
  onElementChange = vi.fn(),
}: {
  element?: TemplateElement
  onElementChange?: ReturnType<typeof vi.fn>
}) {
  const module = await import('./ElementPropertiesPanel')
  const ElementPropertiesPanel = module.ElementPropertiesPanel ?? module.default
  const container = document.createElement('div')
  document.body.appendChild(container)

  let root!: Root

  await act(async () => {
    root = createRoot(container)
    root.render(<ElementPropertiesPanel element={element} onElementChange={onElementChange} />)
  })

  return {
    container,
    onElementChange,
    cleanup: async () => {
      await act(async () => {
        root.unmount()
      })
      container.remove()
    },
  }
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.resetModules()
})

describe('ElementPropertiesPanel', () => {
  it('shows a placeholder when no element is selected', async () => {
    const view = await renderElementPropertiesPanel({})

    try {
      expect(view.container.textContent).toContain('Select an element to edit properties')
    } finally {
      await view.cleanup()
    }
  })

  it('renders the basic text element fields', async () => {
    const { textElement } = createFixtureElements()
    const view = await renderElementPropertiesPanel({
      element: textElement,
    })

    try {
      expect(view.container.textContent).toContain('Title')
      expect(view.container.textContent).toContain('text')
      expectControls(view.container, [
        'name',
        'x',
        'y',
        'width',
        'height',
        'rotation',
        'visible',
        'locked',
        'fallbackText',
        'fontSize',
        'fontFamily',
        'color',
        'textAlign',
        'fontWeight',
        'lineHeight',
        'letterSpacing',
        'verticalAlign',
        'textTransform',
        'maxLines',
        'fitInBox',
        'fitMode',
        'minScaleX',
      ])

      const colorControl = findControl(view.container, 'color')

      expect(colorControl).toBeInstanceOf(HTMLInputElement)
      expect((colorControl as HTMLInputElement).type).toBe('color')
    } finally {
      await view.cleanup()
    }
  })

  it('renders the basic image element fields', async () => {
    const { imageElement } = createFixtureElements()
    const view = await renderElementPropertiesPanel({
      element: imageElement as TemplateElement,
    })

    try {
      expect(view.container.textContent).toContain('Logo')
      expect(view.container.textContent).toContain('image')
      expectControls(view.container, [
        'name',
        'x',
        'y',
        'width',
        'height',
        'rotation',
        'visible',
        'locked',
        'assetId',
        'opacity',
        'objectFit',
        'objectPosition',
        'borderRadius',
      ])
    } finally {
      await view.cleanup()
    }
  })

  it('renders the basic shape element fields', async () => {
    const { shapeElement } = createFixtureElements()
    const view = await renderElementPropertiesPanel({
      element: shapeElement as TemplateElement,
    })

    try {
      expect(view.container.textContent).toContain('Background Box')
      expect(view.container.textContent).toContain('shape')
      expectControls(view.container, [
        'name',
        'x',
        'y',
        'width',
        'height',
        'rotation',
        'visible',
        'locked',
        'shapeType',
        'fillColor',
        'borderColor',
        'borderWidth',
        'stroke',
        'strokeWidth',
        'borderRadius',
      ])

      const fillColorControl = findControl(view.container, 'fillColor')
      const borderColorControl = findControl(view.container, 'borderColor')

      expect(fillColorControl).toBeInstanceOf(HTMLInputElement)
      expect((fillColorControl as HTMLInputElement).type).toBe('color')
      expect(borderColorControl).toBeInstanceOf(HTMLInputElement)
      expect((borderColorControl as HTMLInputElement).type).toBe('color')
    } finally {
      await view.cleanup()
    }
  })

  it('calls onElementChange with a name patch', async () => {
    const { textElement } = createFixtureElements()
    const onElementChange = vi.fn()
    const view = await renderElementPropertiesPanel({
      element: textElement,
      onElementChange,
    })

    try {
      const nameControl = findControl(view.container, 'name')

      expect(nameControl).toBeDefined()

      await act(async () => {
        changeTextLikeControl(nameControl!, 'Headline')
      })

      expect(onElementChange).toHaveBeenCalledWith(textElement.id, {
        name: 'Headline',
      })
    } finally {
      await view.cleanup()
    }
  })

  it('calls onElementChange with a position patch when x changes', async () => {
    const { textElement } = createFixtureElements()
    const onElementChange = vi.fn()
    const view = await renderElementPropertiesPanel({
      element: textElement,
      onElementChange,
    })

    try {
      const xControl = findControl(view.container, 'x')

      expect(xControl).toBeDefined()

      await act(async () => {
        changeTextLikeControl(xControl!, '256')
      })

      expect(onElementChange).toHaveBeenCalledWith(textElement.id, {
        position: {
          ...textElement.position,
          x: 256,
        },
      })
    } finally {
      await view.cleanup()
    }
  })

  it('calls onElementChange with a size patch when width changes', async () => {
    const { textElement } = createFixtureElements()
    const onElementChange = vi.fn()
    const view = await renderElementPropertiesPanel({
      element: textElement,
      onElementChange,
    })

    try {
      const widthControl = findControl(view.container, 'width')

      expect(widthControl).toBeDefined()

      await act(async () => {
        changeTextLikeControl(widthControl!, '1024')
      })

      expect(onElementChange).toHaveBeenCalledWith(textElement.id, {
        size: {
          ...textElement.size,
          width: 1024,
        },
      })
    } finally {
      await view.cleanup()
    }
  })

  it('calls onElementChange with a visible patch when visible changes', async () => {
    const { textElement } = createFixtureElements()
    const onElementChange = vi.fn()
    const view = await renderElementPropertiesPanel({
      element: textElement,
      onElementChange,
    })

    try {
      const visibleControl = findControl(view.container, 'visible')

      expect(visibleControl).toBeDefined()
      expect(visibleControl).toBeInstanceOf(HTMLInputElement)

      await act(async () => {
        changeCheckbox(visibleControl as HTMLInputElement, false)
      })

      expect(onElementChange).toHaveBeenCalledWith(textElement.id, {
        visible: false,
      })
    } finally {
      await view.cleanup()
    }
  })

  it('calls onElementChange with a text style patch when fontSize changes', async () => {
    const { textElement } = createFixtureElements()
    const onElementChange = vi.fn()
    const view = await renderElementPropertiesPanel({
      element: textElement,
      onElementChange,
    })

    try {
      const fontSizeControl = findControl(view.container, 'fontSize')

      expect(fontSizeControl).toBeDefined()

      await act(async () => {
        changeTextLikeControl(fontSizeControl!, '72')
      })

      expect(onElementChange).toHaveBeenCalledWith(textElement.id, {
        style: {
          ...textElement.style,
          fontSize: 72,
        },
      })
    } finally {
      await view.cleanup()
    }
  })

  it('calls onElementChange with a text behavior patch when fitInBox changes', async () => {
    const { textElement } = createFixtureElements()
    const onElementChange = vi.fn()
    const view = await renderElementPropertiesPanel({
      element: textElement,
      onElementChange,
    })

    try {
      const fitInBoxControl = findControl(view.container, 'fitInBox')

      expect(fitInBoxControl).toBeDefined()
      expect(fitInBoxControl).toBeInstanceOf(HTMLInputElement)

      await act(async () => {
        changeCheckbox(fitInBoxControl as HTMLInputElement, false)
      })

      expect(onElementChange).toHaveBeenCalledWith(textElement.id, {
        behavior: {
          ...textElement.behavior,
          fitInBox: false,
        },
      })
    } finally {
      await view.cleanup()
    }
  })

  it('calls onElementChange with a text behavior patch when minScaleX changes', async () => {
    const { textElement } = createFixtureElements()
    const onElementChange = vi.fn()
    const view = await renderElementPropertiesPanel({
      element: textElement,
      onElementChange,
    })

    try {
      const minScaleXControl = findControl(view.container, 'minScaleX')

      expect(minScaleXControl).toBeDefined()

      await act(async () => {
        changeTextLikeControl(minScaleXControl!, '0.7')
      })

      expect(onElementChange).toHaveBeenCalledWith(textElement.id, {
        behavior: {
          ...textElement.behavior,
          minScaleX: 0.7,
        },
      })
    } finally {
      await view.cleanup()
    }
  })

  it('calls onElementChange with a text color patch when color changes', async () => {
    const { textElement } = createFixtureElements()
    const onElementChange = vi.fn()
    const view = await renderElementPropertiesPanel({
      element: textElement,
      onElementChange,
    })

    try {
      const colorControl = findControl(view.container, 'color')

      expect(colorControl).toBeDefined()

      await act(async () => {
        changeTextLikeControl(colorControl!, '#ff0000')
      })

      expect(onElementChange).toHaveBeenCalledWith(textElement.id, {
        style: {
          ...textElement.style,
          color: '#ff0000',
        },
      })
    } finally {
      await view.cleanup()
    }
  })

  it('calls onElementChange with a shape fillColor patch when fillColor changes', async () => {
    const { shapeElement } = createFixtureElements()
    const onElementChange = vi.fn()
    const view = await renderElementPropertiesPanel({
      element: shapeElement as TemplateElement,
      onElementChange,
    })

    try {
      const fillColorControl = findControl(view.container, 'fillColor')

      expect(fillColorControl).toBeDefined()

      await act(async () => {
        changeTextLikeControl(fillColorControl!, '#abcdef')
      })

      expect(onElementChange).toHaveBeenCalledWith(shapeElement.id, {
        fillColor: '#abcdef',
      })
    } finally {
      await view.cleanup()
    }
  })

  it('calls onElementChange with a shape borderColor patch when borderColor changes', async () => {
    const { shapeElement } = createFixtureElements()
    const onElementChange = vi.fn()
    const view = await renderElementPropertiesPanel({
      element: shapeElement as TemplateElement,
      onElementChange,
    })

    try {
      const borderColorControl = findControl(view.container, 'borderColor')

      expect(borderColorControl).toBeDefined()

      await act(async () => {
        changeTextLikeControl(borderColorControl!, '#123456')
      })

      expect(onElementChange).toHaveBeenCalledWith(shapeElement.id, {
        borderColor: '#123456',
      })
    } finally {
      await view.cleanup()
    }
  })

  it('does not call onElementChange when a numeric field receives an invalid value', async () => {
    const { textElement } = createFixtureElements()
    const onElementChange = vi.fn()
    const view = await renderElementPropertiesPanel({
      element: textElement,
      onElementChange,
    })

    try {
      const xControl = findControl(view.container, 'x')

      expect(xControl).toBeDefined()

      await act(async () => {
        changeTextLikeControl(xControl!, '')
      })

      expect(onElementChange).not.toHaveBeenCalled()
    } finally {
      await view.cleanup()
    }
  })
})
