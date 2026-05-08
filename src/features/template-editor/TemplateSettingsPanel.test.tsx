// @vitest-environment jsdom

import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEmptyTemplate, type TemplateContract } from '@/shared/template-contract/templateContract'
import { TemplateSettingsPanel } from './TemplateSettingsPanel'

function findControlByLabel(container: ParentNode, label: string) {
  return container.querySelector(`[aria-label="${label}"]`) as
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement
    | null
}

async function renderTemplateSettingsPanel(
  template: TemplateContract = createEmptyTemplate(),
  onTemplateChange = vi.fn(),
) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  let root: Root

  await act(async () => {
    root = createRoot(container)
    root.render(
      <TemplateSettingsPanel
        onTemplateChange={onTemplateChange}
        template={template}
      />,
    )
  })

  return {
    container,
    onTemplateChange,
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
  vi.restoreAllMocks()
})

describe('TemplateSettingsPanel final template settings contract', () => {
  it('shows controls for name, description, liveboard templateName, tags, and safe area fields', async () => {
    const view = await renderTemplateSettingsPanel()

    try {
      expect(findControlByLabel(view.container, 'name')).not.toBeNull()
      expect(findControlByLabel(view.container, 'description')).not.toBeNull()
      expect(findControlByLabel(view.container, 'liveboard templateName')).not.toBeNull()
      expect(findControlByLabel(view.container, 'tags')).not.toBeNull()
      expect(findControlByLabel(view.container, 'safe area enabled')).not.toBeNull()
      expect(findControlByLabel(view.container, 'marginX')).not.toBeNull()
      expect(findControlByLabel(view.container, 'marginY')).not.toBeNull()
    } finally {
      await view.cleanup()
    }
  })

  it('renders the current values for final template settings fields', async () => {
    const template = createEmptyTemplate()
    const configuredTemplate = {
      ...template,
      name: 'Match Graphic',
      description: 'Main scoreboard template',
      output: {
        liveboard: {
          templateName: 'scoreboard-main',
        },
      },
      metadata: {
        ...template.metadata,
        tags: ['sports', 'scorebug'],
      },
      canvas: {
        ...template.canvas,
        safeArea: {
          enabled: false,
          marginX: 72,
          marginY: 44,
        },
      },
    }
    const view = await renderTemplateSettingsPanel(configuredTemplate)

    try {
      expect(findControlByLabel(view.container, 'name')?.getAttribute('value')).toBe('Match Graphic')
      expect((findControlByLabel(view.container, 'description') as HTMLTextAreaElement | null)?.value).toBe(
        'Main scoreboard template',
      )
      expect(findControlByLabel(view.container, 'liveboard templateName')?.getAttribute('value')).toBe(
        'scoreboard-main',
      )
      expect(findControlByLabel(view.container, 'tags')?.getAttribute('value')).toBe('sports, scorebug')
      expect((findControlByLabel(view.container, 'safe area enabled') as HTMLInputElement | null)?.checked).toBe(
        false,
      )
      expect(findControlByLabel(view.container, 'marginX')?.getAttribute('value')).toBe('72')
      expect(findControlByLabel(view.container, 'marginY')?.getAttribute('value')).toBe('44')
    } finally {
      await view.cleanup()
    }
  })

  it('does not render OSC host, port, or transport command controls', async () => {
    const view = await renderTemplateSettingsPanel()

    try {
      expect(findControlByLabel(view.container, 'osc host')).toBeNull()
      expect(findControlByLabel(view.container, 'osc port')).toBeNull()
      expect(findControlByLabel(view.container, 'osc play')).toBeNull()
      expect(findControlByLabel(view.container, 'osc stop')).toBeNull()
      expect(findControlByLabel(view.container, 'osc resume')).toBeNull()
      expect(view.container.textContent).not.toContain('OSC host')
      expect(view.container.textContent).not.toContain('OSC port')
      expect(view.container.textContent).not.toContain('OSC play')
      expect(view.container.textContent).not.toContain('OSC stop')
      expect(view.container.textContent).not.toContain('OSC resume')
    } finally {
      await view.cleanup()
    }
  })

  it('does not render an OnAir runtime or timers section', async () => {
    const view = await renderTemplateSettingsPanel()

    try {
      expect(view.container.textContent).not.toContain('OnAir runtime')
      expect(view.container.textContent).not.toContain('duration')
      expect(view.container.textContent).not.toContain('timer')
      expect(view.container.textContent).not.toContain('preroll')
      expect(view.container.textContent).not.toContain('postroll')
      expect(view.container.textContent).not.toContain('auto-hide')
    } finally {
      await view.cleanup()
    }
  })
})
