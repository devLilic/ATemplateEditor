import { describe, expect, it } from 'vitest'
import { createDefaultTemplate } from '@/shared/template-contract/templateDefaults'
import {
  addTemplate,
  createAndAddTemplate,
  createTemplateLibraryState,
  duplicateTemplate,
  getSelectedTemplate,
  removeTemplate,
  renameTemplate,
  selectTemplate,
  updateTemplate,
} from './templateLibraryState'

function createTemplatePair() {
  const firstTemplate = createDefaultTemplate({ name: 'First Template' })
  const secondTemplate = createDefaultTemplate({ name: 'Second Template' })

  return {
    firstTemplate,
    secondTemplate,
    templates: [firstTemplate, secondTemplate],
  }
}

describe('template library state', () => {
  describe('createTemplateLibraryState', () => {
    it('returns an empty templates array and undefined selection by default', () => {
      const state = createTemplateLibraryState()

      expect(state.templates).toEqual([])
      expect(state.selectedTemplateId).toBeUndefined()
    })

    it('preserves provided templates and selects the first template when no explicit selection is given', () => {
      const { templates, firstTemplate } = createTemplatePair()

      const state = createTemplateLibraryState({ templates })

      expect(state.templates).toBe(templates)
      expect(state.selectedTemplateId).toBe(firstTemplate.id)
    })

    it('uses an explicit selectedTemplateId when it exists', () => {
      const { templates, secondTemplate } = createTemplatePair()

      const state = createTemplateLibraryState({
        templates,
        selectedTemplateId: secondTemplate.id,
      })

      expect(state.selectedTemplateId).toBe(secondTemplate.id)
    })

    it('falls back to the first template when selectedTemplateId does not exist', () => {
      const { templates, firstTemplate } = createTemplatePair()

      const state = createTemplateLibraryState({
        templates,
        selectedTemplateId: 'template-missing',
      })

      expect(state.selectedTemplateId).toBe(firstTemplate.id)
    })

    it('keeps selectedTemplateId undefined when templates is empty', () => {
      const state = createTemplateLibraryState({
        templates: [],
        selectedTemplateId: 'template-missing',
      })

      expect(state.templates).toEqual([])
      expect(state.selectedTemplateId).toBeUndefined()
    })
  })

  describe('getSelectedTemplate', () => {
    it('returns the currently selected template', () => {
      const { templates, secondTemplate } = createTemplatePair()
      const state = createTemplateLibraryState({
        templates,
        selectedTemplateId: secondTemplate.id,
      })

      expect(getSelectedTemplate(state)).toBe(secondTemplate)
    })

    it('returns undefined when the selection is invalid', () => {
      const { templates } = createTemplatePair()
      const state = {
        templates,
        selectedTemplateId: 'template-missing',
      }

      expect(getSelectedTemplate(state)).toBeUndefined()
    })
  })

  describe('selectTemplate', () => {
    it('returns a new state and selects an existing template id', () => {
      const { templates, secondTemplate, firstTemplate } = createTemplatePair()
      const state = createTemplateLibraryState({ templates })

      const nextState = selectTemplate(state, secondTemplate.id)

      expect(nextState).not.toBe(state)
      expect(nextState.selectedTemplateId).toBe(secondTemplate.id)
      expect(state.selectedTemplateId).toBe(firstTemplate.id)
    })

    it('ignores an inexistent template id', () => {
      const { templates, firstTemplate } = createTemplatePair()
      const state = createTemplateLibraryState({ templates })

      const nextState = selectTemplate(state, 'template-missing')

      expect(nextState.selectedTemplateId).toBe(firstTemplate.id)
      expect(nextState.templates).toBe(state.templates)
    })
  })

  describe('addTemplate', () => {
    it('adds the template, selects it, and does not mutate the original state', () => {
      const { templates } = createTemplatePair()
      const state = createTemplateLibraryState({ templates })
      const template = createDefaultTemplate({ name: 'Breaking News' })

      const nextState = addTemplate(state, template)

      expect(nextState).not.toBe(state)
      expect(nextState.templates).not.toBe(state.templates)
      expect(nextState.templates).toHaveLength(state.templates.length + 1)
      expect(nextState.templates.at(-1)).toBe(template)
      expect(nextState.selectedTemplateId).toBe(template.id)
      expect(state.templates).toHaveLength(templates.length)
    })

    it('ignores a template with duplicate id', () => {
      const { templates, firstTemplate } = createTemplatePair()
      const state = createTemplateLibraryState({ templates })

      const nextState = addTemplate(state, {
        ...createDefaultTemplate({ name: 'Duplicate Attempt' }),
        id: firstTemplate.id,
      })

      expect(nextState.templates).toEqual(state.templates)
      expect(nextState.selectedTemplateId).toBe(state.selectedTemplateId)
    })
  })

  describe('createAndAddTemplate', () => {
    it('creates a default template, adds it, and selects it', () => {
      const state = createTemplateLibraryState()

      const nextState = createAndAddTemplate(state)
      const createdTemplate = nextState.templates[0]

      expect(nextState.templates).toHaveLength(1)
      expect(createdTemplate).toBeDefined()
      expect(createdTemplate.layers.length).toBeGreaterThan(0)
      expect(createdTemplate.elements.length).toBeGreaterThan(0)
      expect(nextState.selectedTemplateId).toBe(createdTemplate.id)
    })

    it('accepts input.name for the created template', () => {
      const state = createTemplateLibraryState()

      const nextState = createAndAddTemplate(state, {
        name: 'Scoreboard',
      })

      expect(nextState.templates[0]?.name).toBe('Scoreboard')
      expect(nextState.selectedTemplateId).toBe(nextState.templates[0]?.id)
    })
  })

  describe('duplicateTemplate', () => {
    it('duplicates an existing template with a new id, appends Copy to the name, and selects it', () => {
      const { templates, firstTemplate } = createTemplatePair()
      const state = createTemplateLibraryState({ templates })

      const nextState = duplicateTemplate(state, firstTemplate.id)
      const duplicatedTemplate = nextState.templates.at(-1)

      expect(duplicatedTemplate).toBeDefined()
      expect(duplicatedTemplate).not.toBe(firstTemplate)
      expect(duplicatedTemplate?.id).not.toBe(firstTemplate.id)
      expect(duplicatedTemplate?.name).toBe(`${firstTemplate.name} Copy`)
      expect(nextState.selectedTemplateId).toBe(duplicatedTemplate?.id)
      expect(firstTemplate.name).toBe('First Template')
    })

    it('ignores an inexistent template id', () => {
      const { templates } = createTemplatePair()
      const state = createTemplateLibraryState({ templates })

      const nextState = duplicateTemplate(state, 'template-missing')

      expect(nextState.templates).toEqual(state.templates)
      expect(nextState.selectedTemplateId).toBe(state.selectedTemplateId)
    })
  })

  describe('updateTemplate', () => {
    it('updates an existing template, preserves its original id, and does not mutate the original state', () => {
      const { templates, firstTemplate } = createTemplatePair()
      const state = createTemplateLibraryState({ templates })

      const nextState = updateTemplate(state, firstTemplate.id, (template) => ({
        ...template,
        id: 'template-overwrite-attempt',
        name: 'Updated Template',
        metadata: {
          ...template.metadata,
          description: 'Updated description',
        },
      }))

      const updatedTemplate = nextState.templates.find((template) => template.id === firstTemplate.id)

      expect(updatedTemplate).toMatchObject({
        id: firstTemplate.id,
        name: 'Updated Template',
        metadata: {
          description: 'Updated description',
        },
      })
      expect(state.templates[0]).toMatchObject({
        id: firstTemplate.id,
        name: 'First Template',
      })
    })

    it('ignores an inexistent template id', () => {
      const { templates } = createTemplatePair()
      const state = createTemplateLibraryState({ templates })

      const nextState = updateTemplate(state, 'template-missing', (template) => ({
        ...template,
        name: 'Should Not Apply',
      }))

      expect(nextState.templates).toEqual(state.templates)
      expect(nextState.selectedTemplateId).toBe(state.selectedTemplateId)
    })
  })

  describe('removeTemplate', () => {
    it('removes the template and selects the first remaining template when the removed one was selected', () => {
      const { templates, firstTemplate, secondTemplate } = createTemplatePair()
      const state = createTemplateLibraryState({
        templates,
        selectedTemplateId: secondTemplate.id,
      })

      const nextState = removeTemplate(state, secondTemplate.id)

      expect(nextState.templates.find((template) => template.id === secondTemplate.id)).toBeUndefined()
      expect(nextState.selectedTemplateId).toBe(firstTemplate.id)
      expect(state.templates).toHaveLength(2)
    })

    it('clears selection when no templates remain', () => {
      const template = createDefaultTemplate({ name: 'Solo Template' })
      const state = createTemplateLibraryState({
        templates: [template],
        selectedTemplateId: template.id,
      })

      const nextState = removeTemplate(state, template.id)

      expect(nextState.templates).toEqual([])
      expect(nextState.selectedTemplateId).toBeUndefined()
    })

    it('ignores an inexistent template id', () => {
      const { templates } = createTemplatePair()
      const state = createTemplateLibraryState({ templates })

      const nextState = removeTemplate(state, 'template-missing')

      expect(nextState.templates).toEqual(state.templates)
      expect(nextState.selectedTemplateId).toBe(state.selectedTemplateId)
    })
  })

  describe('renameTemplate', () => {
    it('renames an existing template and trims whitespace', () => {
      const { templates, firstTemplate } = createTemplatePair()
      const state = createTemplateLibraryState({ templates })

      const nextState = renameTemplate(state, firstTemplate.id, '  Updated Name  ')

      expect(nextState.templates.find((template) => template.id === firstTemplate.id)?.name).toBe(
        'Updated Name',
      )
      expect(state.templates[0]?.name).toBe('First Template')
    })

    it('ignores an empty trimmed name', () => {
      const { templates } = createTemplatePair()
      const state = createTemplateLibraryState({ templates })

      const nextState = renameTemplate(state, templates[0].id, '   ')

      expect(nextState.templates).toEqual(state.templates)
    })

    it('ignores an inexistent template id', () => {
      const { templates } = createTemplatePair()
      const state = createTemplateLibraryState({ templates })

      const nextState = renameTemplate(state, 'template-missing', 'Updated Name')

      expect(nextState.templates).toEqual(state.templates)
      expect(nextState.selectedTemplateId).toBe(state.selectedTemplateId)
    })
  })
})
