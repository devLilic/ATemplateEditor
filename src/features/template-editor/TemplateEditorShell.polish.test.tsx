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

function findButtonByText(container: ParentNode, text: string) {
  return Array.from(container.querySelectorAll('button')).find(
    (element) => element.textContent?.trim() === text,
  ) as HTMLButtonElement | undefined
}

async function renderTemplateEditorShell() {
  vi.resetModules()

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
})

describe('TemplateEditorShell workspace layout', () => {
  it('does not render the old large title header copy', async () => {
    const view = await renderTemplateEditorShell()

    try {
      expect(view.container.textContent).not.toContain('ATemplateEditor')
      expect(view.container.textContent).not.toContain('Template JSON editor for broadcast graphics')
    } finally {
      await view.cleanup()
    }
  })

  it('renders a full-screen workspace root with the expected test id', async () => {
    const view = await renderTemplateEditorShell()

    try {
      const workspace = view.container.querySelector('[data-testid="template-workspace"]') as
        | HTMLElement
        | null

      expect(workspace).not.toBeNull()
      expect(workspace?.className).toContain('h-screen')
      expect(workspace?.className).toContain('w-screen')
    } finally {
      await view.cleanup()
    }
  })

  it('renders right-panel tabs for Inspector, Data, Bindings, and OnAir', async () => {
    const view = await renderTemplateEditorShell()

    try {
      expect(findButtonByText(view.container, 'Inspector')?.tagName).toBe('BUTTON')
      expect(findButtonByText(view.container, 'Data')?.tagName).toBe('BUTTON')
      expect(findButtonByText(view.container, 'Bindings')?.tagName).toBe('BUTTON')
      expect(findButtonByText(view.container, 'OnAir')?.tagName).toBe('BUTTON')
    } finally {
      await view.cleanup()
    }
  })

  it('shows only the active right-panel tab content', async () => {
    const view = await renderTemplateEditorShell()

    try {
      expect(view.container.textContent).toContain('Common')
      expect(view.container.textContent).not.toContain('Apply sample data')
      expect(view.container.textContent).not.toContain('Add text field')
      expect(view.container.textContent).not.toContain('Clear OSC commands')
    } finally {
      await view.cleanup()
    }
  })

  it('does not use New template or Save template as the main header actions', async () => {
    const view = await renderTemplateEditorShell()

    try {
      expect(view.container.textContent).not.toContain('New template')
      expect(view.container.textContent).not.toContain('Save template')
    } finally {
      await view.cleanup()
    }
  })
})
