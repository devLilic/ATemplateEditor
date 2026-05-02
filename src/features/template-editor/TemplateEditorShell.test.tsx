// @vitest-environment jsdom

import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

function hasSelectedMarker(element: HTMLElement | null | undefined) {
  let current = element

  while (current) {
    if (
      current.getAttribute('aria-selected') === 'true' ||
      current.getAttribute('data-selected') === 'true'
    ) {
      return true
    }

    current = current.parentElement
  }

  return false
}

async function renderTemplateEditorShell(options: { clearInitialElementSelection?: boolean } = {}) {
  vi.resetModules()

  if (options.clearInitialElementSelection) {
    vi.doMock('@/features/template-state', async () => {
      const actual =
        await vi.importActual<typeof import('@/features/template-state')>('@/features/template-state')

      return {
        ...actual,
        createTemplateEditorState(template: Parameters<typeof actual.createTemplateEditorState>[0]) {
          const state = actual.createTemplateEditorState(template)

          return {
            ...state,
            selectedElementId: undefined,
          }
        },
      }
    })
  }

  const module = await import('./TemplateEditorShell')
  const TemplateEditorShell = module.TemplateEditorShell ?? module.default

  const container = document.createElement('div')
  document.body.appendChild(container)

  let root: Root

  await act(async () => {
    root = createRoot(container)
    root.render(<TemplateEditorShell />)
  })

  return {
    container,
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
  vi.doUnmock('@/features/template-state')
})

describe('TemplateEditorShell', () => {
  it('renders the basic editor layout panels', async () => {
    const view = await renderTemplateEditorShell()

    try {
      expect(view.container.textContent).toContain('Template Library')
      expect(view.container.textContent).toContain('Preview')
      expect(view.container.textContent).toContain('Layers')
      expect(view.container.textContent).toContain('Inspector')
    } finally {
      await view.cleanup()
    }
  })

  it('shows at least one default template and renders its default preview text', async () => {
    const view = await renderTemplateEditorShell()

    try {
      expect(view.container.textContent).toContain('Default template')
      expect(view.container.textContent).toContain('Sample title')
      expect(view.container.querySelector('[data-testid="preview-canvas"]')).not.toBeNull()
    } finally {
      await view.cleanup()
    }
  })

  it('selects a template on click and exposes an accessible selected marker', async () => {
    const view = await renderTemplateEditorShell()

    try {
      const newTemplateButton = findByExactText(view.container, 'Create template')

      expect(newTemplateButton).toBeDefined()

      await act(async () => {
        newTemplateButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })

      const templates = findAllByExactText(view.container, 'Default template')

      expect(templates.length).toBeGreaterThanOrEqual(2)

      await act(async () => {
        templates[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })

      expect(hasSelectedMarker(templates[0])).toBe(true)
    } finally {
      await view.cleanup()
    }
  })

  it('adds a new template from the New template button and selects it', async () => {
    const view = await renderTemplateEditorShell()

    try {
      const newTemplateButton = findByExactText(view.container, 'Create template')

      expect(newTemplateButton).toBeDefined()
      expect(findAllByExactText(view.container, 'Default template')).toHaveLength(1)

      await act(async () => {
        newTemplateButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })

      const templates = findAllByExactText(view.container, 'Default template')
      const selectedTemplate = templates.find((template) => hasSelectedMarker(template))

      expect(templates.length).toBeGreaterThanOrEqual(2)
      expect(selectedTemplate).toBeDefined()
    } finally {
      await view.cleanup()
    }
  })

  it('renders the active template layers and marks the selected layer', async () => {
    const view = await renderTemplateEditorShell()

    try {
      const mainLayer = findByExactText(view.container, 'Main Layer')

      expect(mainLayer).toBeDefined()
      expect(hasSelectedMarker(mainLayer)).toBe(true)
    } finally {
      await view.cleanup()
    }
  })

  it('shows a properties placeholder when no element is selected', async () => {
    const view = await renderTemplateEditorShell({
      clearInitialElementSelection: true,
    })

    try {
      expect(view.container.textContent).toContain('Select an element to edit properties')
    } finally {
      await view.cleanup()
    }
  })

  it('shows the selected element name when an element is selected', async () => {
    const view = await renderTemplateEditorShell()

    try {
      expect(view.container.textContent).toContain('Title')
    } finally {
      await view.cleanup()
    }
  })
})
