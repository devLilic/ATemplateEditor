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

async function renderTemplateEditorShell(
  options: {
    clearInitialElementSelection?: boolean
    emptyLibrary?: boolean
    emptyTemplate?: boolean
  } = {},
) {
  vi.resetModules()

  if (options.emptyLibrary) {
    vi.doMock('@/features/template-library', async () => {
      const actual =
        await vi.importActual<typeof import('@/features/template-library')>('@/features/template-library')

      return {
        ...actual,
        createTemplateLibraryState() {
          return {
            templates: [],
            selectedTemplateId: undefined,
          }
        },
        getSelectedTemplate() {
          return undefined
        },
      }
    })
  }

  if (options.emptyTemplate) {
    vi.doMock('@/shared/template-contract/templateDefaults', async () => {
      const contract =
        await vi.importActual<typeof import('@/shared/template-contract/templateContract')>(
          '@/shared/template-contract/templateContract',
        )

      return {
        createDefaultTemplate() {
          return contract.createEmptyTemplate({
            name: 'Empty template',
          })
        },
      }
    })
  }

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
  vi.doUnmock('@/features/template-library')
  vi.doUnmock('@/features/template-state')
  vi.doUnmock('@/shared/template-contract/templateDefaults')
})

describe('TemplateEditorShell polish', () => {
  it('shows the header title and a workspace status label', async () => {
    const view = await renderTemplateEditorShell()

    try {
      expect(view.container.textContent).toContain('ATemplateEditor')
      expect(view.container.textContent).toContain('Template workspace')
    } finally {
      await view.cleanup()
    }
  })

  it('renders all major editor panels', async () => {
    const view = await renderTemplateEditorShell()

    try {
      expect(view.container.textContent).toContain('Template Library')
      expect(view.container.textContent).toContain('Preview')
      expect(view.container.textContent).toContain('Layers')
      expect(view.container.textContent).toContain('Properties')
      expect(view.container.textContent).toContain('Preview data')
      expect(view.container.textContent).toContain('Editable fields & bindings')
      expect(view.container.textContent).toContain('OnAir metadata')
    } finally {
      await view.cleanup()
    }
  })

  it('shows clear empty states for missing templates, layers, editable fields, and element selection', async () => {
    const emptyLibraryView = await renderTemplateEditorShell({
      emptyLibrary: true,
    })

    try {
      expect(emptyLibraryView.container.textContent).toContain('No templates')
    } finally {
      await emptyLibraryView.cleanup()
    }

    const emptyTemplateView = await renderTemplateEditorShell({
      emptyTemplate: true,
      clearInitialElementSelection: true,
    })

    try {
      expect(emptyTemplateView.container.textContent).toContain('No layers')
      expect(emptyTemplateView.container.textContent).toContain('No editable fields')
      expect(emptyTemplateView.container.textContent).toContain('Select an element to edit properties')
    } finally {
      await emptyTemplateView.cleanup()
    }
  })

  it('uses clear text labels for the main controls', async () => {
    const view = await renderTemplateEditorShell()

    try {
      expect(findByExactText(view.container, 'New template')?.tagName).toBe('BUTTON')
      expect(findByExactText(view.container, 'Export JSON')?.tagName).toBe('BUTTON')
      expect(findByExactText(view.container, 'Import JSON')?.tagName).toBe('BUTTON')
      expect(findByExactText(view.container, 'Apply sample data')?.tagName).toBe('BUTTON')
    } finally {
      await view.cleanup()
    }
  })

  it('uses button elements and selected markers for selectable items', async () => {
    const view = await renderTemplateEditorShell()

    try {
      const newTemplateButton = findByExactText(view.container, 'New template')
      const defaultTemplate = findByExactText(view.container, 'Default template')
      const mainLayer = findByExactText(view.container, 'Main Layer')

      expect(newTemplateButton?.tagName).toBe('BUTTON')
      expect(defaultTemplate?.tagName).toBe('BUTTON')
      expect(mainLayer?.tagName).toBe('BUTTON')
      expect(hasSelectedMarker(defaultTemplate)).toBe(true)
      expect(hasSelectedMarker(mainLayer)).toBe(true)
    } finally {
      await view.cleanup()
    }
  })
})
