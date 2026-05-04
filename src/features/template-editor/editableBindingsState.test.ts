import { describe, expect, it } from 'vitest'
import {
  createEmptyTemplate,
  createLayer,
  createTextElement,
  type TemplateBinding,
  type TemplateContract,
  type TemplateEditableField,
  type TemplateTextElement,
} from '@/shared/template-contract/templateContract'
import {
  addBinding,
  addEditableField,
  createBinding,
  createEditableField,
  listBindingsForElement,
  listBindingsForField,
  removeBinding,
  removeEditableField,
  updateBinding,
  updateEditableField,
} from './editableBindingsState'

function createTemplateFixture(): TemplateContract {
  return createEmptyTemplate({
    name: 'Bindings Template',
  })
}

function createEditableFieldFixture(
  overrides: Partial<TemplateEditableField> = {},
): TemplateEditableField {
  return {
    id: overrides.id ?? 'field-title',
    key: overrides.key ?? 'title',
    label: overrides.label ?? 'Title',
    type: overrides.type ?? 'text',
    required: overrides.required ?? false,
    defaultValue: overrides.defaultValue ?? '',
  }
}

function createTemplateWithFieldFixture(
  fieldOverrides: Partial<TemplateEditableField> = {},
): {
  template: TemplateContract
  field: TemplateEditableField
} {
  const template = createTemplateFixture()
  const field = createEditableFieldFixture(fieldOverrides)

  return {
    template: {
      ...template,
      editableFields: [field],
    },
    field,
  }
}

function createTemplateWithTextElementFixture(): {
  template: TemplateContract
  element: TemplateTextElement
} {
  const template = createTemplateFixture()
  const layer = createLayer({
    name: 'Main',
    zIndex: 0,
  })
  const element = createTextElement({
    layerId: layer.id,
    name: 'Headline',
    position: { x: 100, y: 100 },
    size: { width: 800, height: 96 },
  })

  return {
    template: {
      ...template,
      layers: [layer],
      elements: [element],
    },
    element,
  }
}

function createBindingFixture(overrides: Partial<TemplateBinding> = {}): TemplateBinding {
  return {
    id: overrides.id ?? 'binding-title',
    fieldKey: overrides.fieldKey ?? 'title',
    elementId: overrides.elementId ?? 'element-title',
    targetProperty: overrides.targetProperty ?? 'text',
  }
}

function createTemplateWithFieldAndBindingFixture(): {
  template: TemplateContract
  field: TemplateEditableField
  element: TemplateTextElement
  binding: TemplateBinding
} {
  const { template: templateWithElement, element } = createTemplateWithTextElementFixture()
  const field = createEditableFieldFixture()
  const binding = createBindingFixture({
    elementId: element.id,
    fieldKey: field.key,
  })

  return {
    template: {
      ...templateWithElement,
      editableFields: [field],
      bindings: [binding],
      preview: {
        ...templateWithElement.preview,
        sampleData: {
          [field.key]: 'Preview title',
        },
      },
      fallbackValues: {
        [field.key]: 'Fallback title',
      },
    },
    field,
    element,
    binding,
  }
}

describe('editableBindingsState', () => {
  describe('createEditableField', () => {
    it('creates a field with an id, key, label, type, default required=false, and optional defaultValue', () => {
      const field = createEditableField({
        key: 'title',
        label: 'Title',
        type: 'text',
        defaultValue: 'Sample title',
      })

      expect(field.id).toBeTruthy()
      expect(field.key).toBe('title')
      expect(field.label).toBe('Title')
      expect(field.type).toBe('text')
      expect(field.required).toBe(false)
      expect(field.defaultValue).toBe('Sample title')
    })
  })

  describe('addEditableField', () => {
    it('adds a field immutably and ignores a field with a duplicate key', () => {
      const template = createTemplateFixture()
      const field = createEditableFieldFixture()

      const nextTemplate = addEditableField(template, field)
      const duplicateTemplate = addEditableField(nextTemplate, {
        ...field,
        id: 'field-duplicate',
        label: 'Duplicate title',
      })

      expect(nextTemplate).not.toBe(template)
      expect(nextTemplate.editableFields).toEqual([field])
      expect(template.editableFields).toEqual([])
      expect(duplicateTemplate).toBe(nextTemplate)
    })
  })

  describe('updateEditableField', () => {
    it('updates an existing field, preserves id, updates bindings when key changes, and ignores a missing field id', () => {
      const { template, field, binding } = createTemplateWithFieldAndBindingFixture()

      const updatedTemplate = updateEditableField(template, field.id, {
        id: 'field-overridden',
        key: 'headline',
        label: 'Headline',
      })
      const unchangedTemplate = updateEditableField(template, 'missing-field', {
        label: 'Ignored',
      })

      expect(updatedTemplate.editableFields).toHaveLength(1)
      expect(updatedTemplate.editableFields[0]).toMatchObject({
        id: field.id,
        key: 'headline',
        label: 'Headline',
      })
      expect(updatedTemplate.bindings).toEqual([
        {
          ...binding,
          fieldKey: 'headline',
        },
      ])
      expect(template.editableFields[0]).toEqual(field)
      expect(template.bindings[0]).toEqual(binding)
      expect(unchangedTemplate).toBe(template)
    })
  })

  describe('removeEditableField', () => {
    it('removes the field, its bindings, preview sampleData value, and fallbackValues value immutably', () => {
      const { template, field } = createTemplateWithFieldAndBindingFixture()

      const nextTemplate = removeEditableField(template, field.id)

      expect(nextTemplate).not.toBe(template)
      expect(nextTemplate.editableFields).toEqual([])
      expect(nextTemplate.bindings).toEqual([])
      expect(nextTemplate.preview.sampleData[field.key]).toBeUndefined()
      expect(nextTemplate.fallbackValues[field.key]).toBeUndefined()
      expect(template.editableFields).toHaveLength(1)
      expect(template.bindings).toHaveLength(1)
      expect(template.preview.sampleData[field.key]).toBe('Preview title')
      expect(template.fallbackValues[field.key]).toBe('Fallback title')
    })
  })

  describe('createBinding', () => {
    it('creates a binding with an id, fieldKey, elementId, and targetProperty', () => {
      const binding = createBinding({
        fieldKey: 'title',
        elementId: 'element-title',
        targetProperty: 'text',
      })

      expect(binding.id).toBeTruthy()
      expect(binding.fieldKey).toBe('title')
      expect(binding.elementId).toBe('element-title')
      expect(binding.targetProperty).toBe('text')
    })
  })

  describe('addBinding', () => {
    it('adds a valid binding and ignores duplicate ids, missing field keys, and missing element ids', () => {
      const { template: templateWithField, field } = createTemplateWithFieldFixture()
      const { element } = createTemplateWithTextElementFixture()
      const template = {
        ...templateWithField,
        layers: [createLayer({ name: 'Main', zIndex: 0 })],
        elements: [element],
      }
      const binding = createBindingFixture({
        elementId: element.id,
        fieldKey: field.key,
      })

      const nextTemplate = addBinding(template, binding)
      const duplicateTemplate = addBinding(nextTemplate, {
        ...binding,
        fieldKey: 'other-field',
      })
      const missingFieldTemplate = addBinding(template, {
        ...binding,
        id: 'binding-missing-field',
        fieldKey: 'missing-field',
      })
      const missingElementTemplate = addBinding(template, {
        ...binding,
        id: 'binding-missing-element',
        elementId: 'missing-element',
      })

      expect(nextTemplate.bindings).toEqual([binding])
      expect(duplicateTemplate).toBe(nextTemplate)
      expect(missingFieldTemplate).toBe(template)
      expect(missingElementTemplate).toBe(template)
    })
  })

  describe('updateBinding', () => {
    it('updates an existing binding, preserves id, and ignores a missing binding id', () => {
      const { template, binding } = createTemplateWithFieldAndBindingFixture()

      const updatedTemplate = updateBinding(template, binding.id, {
        id: 'binding-overridden',
        targetProperty: 'text',
        fieldKey: 'title',
      })
      const unchangedTemplate = updateBinding(template, 'missing-binding', {
        fieldKey: 'headline',
      })

      expect(updatedTemplate.bindings).toEqual([
        {
          ...binding,
          id: binding.id,
          targetProperty: 'text',
          fieldKey: 'title',
        },
      ])
      expect(unchangedTemplate).toBe(template)
    })
  })

  describe('removeBinding', () => {
    it('removes an existing binding and ignores a missing binding id', () => {
      const { template, binding } = createTemplateWithFieldAndBindingFixture()

      const nextTemplate = removeBinding(template, binding.id)
      const unchangedTemplate = removeBinding(template, 'missing-binding')

      expect(nextTemplate.bindings).toEqual([])
      expect(template.bindings).toEqual([binding])
      expect(unchangedTemplate).toBe(template)
    })
  })

  describe('listBindingsForElement', () => {
    it('returns the bindings that match the given element id', () => {
      const { template, binding, element } = createTemplateWithFieldAndBindingFixture()
      const otherBinding = createBindingFixture({
        id: 'binding-other',
        fieldKey: 'title',
        elementId: 'element-other',
      })
      const templateWithExtraBinding = {
        ...template,
        bindings: [binding, otherBinding],
      }

      expect(listBindingsForElement(templateWithExtraBinding, element.id)).toEqual([binding])
    })
  })

  describe('listBindingsForField', () => {
    it('returns the bindings that match the given fieldKey', () => {
      const { template, binding, field } = createTemplateWithFieldAndBindingFixture()
      const otherBinding = createBindingFixture({
        id: 'binding-other',
        fieldKey: 'subtitle',
        elementId: binding.elementId,
      })
      const templateWithExtraBinding = {
        ...template,
        bindings: [binding, otherBinding],
      }

      expect(listBindingsForField(templateWithExtraBinding, field.key)).toEqual([binding])
    })
  })
})
