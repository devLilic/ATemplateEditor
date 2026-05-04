import { createDefaultTemplate } from '@/shared/template-contract/templateDefaults'
import type { TemplateContract } from '@/shared/template-contract/templateContract'

export interface TemplateLibraryState {
  templates: TemplateContract[]
  selectedTemplateId?: string
}

interface CreateTemplateLibraryStateInput {
  templates?: TemplateContract[]
  selectedTemplateId?: string
}

interface CreateTemplateInput {
  name?: string
}

function findTemplate(templates: TemplateContract[], templateId: string) {
  return templates.find((template) => template.id === templateId)
}

export function createTemplateLibraryState(
  input: CreateTemplateLibraryStateInput = {},
): TemplateLibraryState {
  const templates = input.templates ?? []
  const selectedTemplate =
    input.selectedTemplateId !== undefined
      ? findTemplate(templates, input.selectedTemplateId)
      : undefined

  return {
    templates,
    selectedTemplateId: selectedTemplate?.id ?? templates[0]?.id,
  }
}

export function getSelectedTemplate(state: TemplateLibraryState) {
  return state.selectedTemplateId
    ? findTemplate(state.templates, state.selectedTemplateId)
    : undefined
}

export function selectTemplate(
  state: TemplateLibraryState,
  templateId: string,
): TemplateLibraryState {
  const template = findTemplate(state.templates, templateId)

  if (!template) {
    return state
  }

  return {
    ...state,
    selectedTemplateId: template.id,
  }
}

export function addTemplate(
  state: TemplateLibraryState,
  template: TemplateContract,
): TemplateLibraryState {
  if (findTemplate(state.templates, template.id)) {
    return state
  }

  return {
    templates: [...state.templates, template],
    selectedTemplateId: template.id,
  }
}

export function createAndAddTemplate(
  state: TemplateLibraryState,
  input?: CreateTemplateInput,
): TemplateLibraryState {
  return addTemplate(state, createDefaultTemplate(input))
}

export function duplicateTemplate(
  state: TemplateLibraryState,
  templateId: string,
): TemplateLibraryState {
  const template = findTemplate(state.templates, templateId)

  if (!template) {
    return state
  }

  const now = new Date().toISOString()
  const duplicate = {
    ...createDefaultTemplate({
      name: `${template.name} Copy`,
    }),
    ...template,
    id: createDefaultTemplate().id,
    name: `${template.name} Copy`,
    metadata: {
      ...template.metadata,
      createdAt: now,
      updatedAt: now,
      duplicatedFromTemplateId: template.id,
    },
  }

  return {
    templates: [...state.templates, duplicate],
    selectedTemplateId: duplicate.id,
  }
}

export function updateTemplate(
  state: TemplateLibraryState,
  templateId: string,
  updater: (template: TemplateContract) => TemplateContract,
): TemplateLibraryState {
  const template = findTemplate(state.templates, templateId)

  if (!template) {
    return state
  }

  const updatedTemplate = updater(template)
  const now = new Date().toISOString()

  return {
    ...state,
    templates: state.templates.map((currentTemplate) =>
      currentTemplate.id === templateId
        ? {
            ...updatedTemplate,
            id: template.id,
            metadata: {
              ...updatedTemplate.metadata,
              updatedAt: now,
            },
          }
        : currentTemplate,
    ),
  }
}

export function removeTemplate(
  state: TemplateLibraryState,
  templateId: string,
): TemplateLibraryState {
  if (!findTemplate(state.templates, templateId)) {
    return state
  }

  const templates = state.templates.filter((template) => template.id !== templateId)

  return {
    templates,
    selectedTemplateId:
      state.selectedTemplateId === templateId ? templates[0]?.id : state.selectedTemplateId,
  }
}

export function renameTemplate(
  state: TemplateLibraryState,
  templateId: string,
  name: string,
): TemplateLibraryState {
  const trimmedName = name.trim()

  if (trimmedName.length === 0 || !findTemplate(state.templates, templateId)) {
    return state
  }

  return updateTemplate(state, templateId, (template) => ({
    ...template,
    name: trimmedName,
  }))
}
