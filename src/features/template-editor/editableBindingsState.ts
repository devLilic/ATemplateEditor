import {
  createField,
  type TemplateBinding,
  type TemplateContract,
  type TemplateEditableField,
  type TemplateFieldContract,
} from '@/shared/template-contract/templateContract'

export interface CreateEditableFieldInput {
  id?: string
  key?: string
  label: string
  type: TemplateEditableField['type']
  required?: boolean
  defaultValue?: string
}

export interface CreateBindingInput {
  fieldKey: string
  elementId: string
  targetProperty: TemplateBinding['targetProperty']
}

function createEditableFieldId() {
  return `field-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function createBindingId() {
  return `binding-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function renameRecordKey(
  record: Record<string, unknown>,
  oldKey: string,
  newKey: string,
): Record<string, unknown> {
  if (oldKey === newKey || !(oldKey in record)) {
    return record
  }

  const { [oldKey]: movedValue, ...remainingRecord } = record

  return {
    ...remainingRecord,
    [newKey]: movedValue,
  }
}

function removeRecordKey(record: Record<string, unknown>, key: string): Record<string, unknown> {
  if (!(key in record)) {
    return record
  }

  const { [key]: _removed, ...remainingRecord } = record
  return remainingRecord
}

function toContractField(field: TemplateEditableField): TemplateFieldContract {
  return {
    id: field.id,
    label: field.label,
    type: field.type,
    required: field.required,
    defaultValue: field.defaultValue,
  }
}

function toLegacyField(field: TemplateFieldContract, key?: string): TemplateEditableField {
  return {
    ...field,
    key: key ?? field.id,
    defaultValue: field.defaultValue ?? '',
  }
}

function listFields(template: TemplateContract): TemplateFieldContract[] {
  if ((template.editableFields ?? []).length > 0) {
    return (template.editableFields ?? []).map((field) => ({
      id: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      defaultValue: field.defaultValue,
    }))
  }

  return template.fields
}

function updateBoundTextElements(
  template: TemplateContract,
  currentFieldId: string,
  nextFieldId: string,
  nextDefaultValue?: string,
) {
  return (template.elements ?? []).map((element) =>
    element.kind === 'text' && element.sourceField === currentFieldId
      ? {
          ...element,
          sourceField: nextFieldId,
          fallbackText: nextDefaultValue ?? element.fallbackText,
        }
      : element,
  )
}

function clearBoundTextElements(template: TemplateContract, fieldId: string) {
  return (template.elements ?? []).map((element) =>
    element.kind === 'text' && element.sourceField === fieldId
      ? {
          ...element,
          sourceField: undefined,
        }
      : element,
  )
}

export function createEditableField(input: CreateEditableFieldInput): TemplateEditableField {
  const fieldId = input.id ?? input.key ?? createEditableFieldId()
  const contractField = createField({
    id: fieldId,
    label: input.label,
    required: input.required ?? false,
    defaultValue: input.defaultValue ?? '',
    description: undefined,
    placeholder: undefined,
  })

  return toLegacyField(contractField, input.key ?? fieldId)
}

export function addEditableField(
  template: TemplateContract,
  field: TemplateEditableField,
): TemplateContract {
  const fieldExists = (template.editableFields ?? []).some((existingField) => existingField.key === field.key)

  if (fieldExists) {
    return template
  }

  return {
    ...template,
    fields: [...template.fields, toContractField(field)],
    editableFields: [...(template.editableFields ?? []), field],
  }
}

export function updateEditableField(
  template: TemplateContract,
  fieldId: string,
  patch: Partial<TemplateEditableField>,
): TemplateContract {
  const currentField =
    (template.editableFields ?? []).find((field) => field.id === fieldId) ??
    listFields(template)
      .map((field) => toLegacyField(field, field.id))
      .find((field) => field.id === fieldId)

  if (!currentField) {
    return template
  }

  const nextField: TemplateEditableField = {
    ...currentField,
    ...patch,
    id: currentField.id,
    key:
      typeof patch.key === 'string' && patch.key.trim().length > 0 ? patch.key : currentField.key,
    defaultValue: patch.defaultValue ?? currentField.defaultValue,
  }
  const oldKey = currentField.key
  const newKey = nextField.key

  return {
    ...template,
    fields: listFields(template).map((field) =>
      field.id === fieldId
        ? {
            ...field,
            id: field.id,
            label: nextField.label,
            type: nextField.type,
            required: nextField.required,
            defaultValue: nextField.defaultValue,
          }
        : field,
    ),
    editableFields: (template.editableFields ?? []).map((field) =>
      field.id === fieldId ? nextField : field,
    ),
    bindings: (template.bindings ?? []).map((binding) =>
      binding.fieldKey === oldKey ? { ...binding, fieldKey: newKey } : binding,
    ),
    preview: {
      ...template.preview,
      sampleData: renameRecordKey(template.preview.sampleData, oldKey, newKey),
    },
    fallbackValues: renameRecordKey(template.fallbackValues ?? {}, oldKey, newKey),
    elements: updateBoundTextElements(template, oldKey, newKey, nextField.defaultValue),
  }
}

export function removeEditableField(template: TemplateContract, fieldId: string): TemplateContract {
  const fieldToRemove =
    (template.editableFields ?? []).find((field) => field.id === fieldId) ??
    listFields(template)
      .map((field) => toLegacyField(field))
      .find((field) => field.id === fieldId)

  if (!fieldToRemove) {
    return template
  }

  return {
    ...template,
    fields: listFields(template).filter((field) => field.id !== fieldId),
    editableFields: (template.editableFields ?? []).filter((field) => field.id !== fieldId),
    bindings: (template.bindings ?? []).filter((binding) => binding.fieldKey !== fieldToRemove.key),
    preview: {
      ...template.preview,
      sampleData: removeRecordKey(template.preview.sampleData, fieldToRemove.key),
    },
    fallbackValues: removeRecordKey(template.fallbackValues ?? {}, fieldToRemove.key),
    elements: clearBoundTextElements(template, fieldToRemove.key),
  }
}

export function createBinding(input: CreateBindingInput): TemplateBinding {
  return {
    id: createBindingId(),
    fieldKey: input.fieldKey,
    elementId: input.elementId,
    targetProperty: input.targetProperty,
  }
}

export function addBinding(template: TemplateContract, binding: TemplateBinding): TemplateContract {
  const bindingIdExists = (template.bindings ?? []).some((existingBinding) => existingBinding.id === binding.id)
  const fieldExists = listFields(template).some((field) => field.id === binding.fieldKey)
  const elementExists = (template.elements ?? []).some((element) => element.id === binding.elementId)

  if (bindingIdExists || !fieldExists || !elementExists) {
    return template
  }

  return {
    ...template,
    bindings: [...(template.bindings ?? []), binding],
    elements: (template.elements ?? []).map((element) =>
      element.kind === 'text' && element.id === binding.elementId && binding.targetProperty === 'text'
        ? {
            ...element,
            sourceField: binding.fieldKey,
          }
        : element,
    ),
  }
}

export function updateBinding(
  template: TemplateContract,
  bindingId: string,
  patch: Partial<TemplateBinding>,
): TemplateContract {
  const bindingIndex = (template.bindings ?? []).findIndex((binding) => binding.id === bindingId)

  if (bindingIndex === -1) {
    return template
  }

  const currentBinding = template.bindings[bindingIndex]
  const nextFieldKey =
    patch.fieldKey && listFields(template).some((field) => field.id === patch.fieldKey)
      ? patch.fieldKey
      : currentBinding.fieldKey
  const nextElementId =
    patch.elementId && (template.elements ?? []).some((element) => element.id === patch.elementId)
      ? patch.elementId
      : currentBinding.elementId
  const nextBinding: TemplateBinding = {
    ...currentBinding,
    ...patch,
    id: currentBinding.id,
    fieldKey: nextFieldKey,
    elementId: nextElementId,
  }

  return {
    ...template,
    bindings: template.bindings.map((binding, index) =>
      index === bindingIndex ? nextBinding : binding,
    ),
    elements: (template.elements ?? []).map((element) =>
      element.kind === 'text' && element.id === nextBinding.elementId && nextBinding.targetProperty === 'text'
        ? {
            ...element,
            sourceField: nextBinding.fieldKey,
          }
        : element,
    ),
  }
}

export function removeBinding(template: TemplateContract, bindingId: string): TemplateContract {
  const bindingToRemove = (template.bindings ?? []).find((binding) => binding.id === bindingId)

  if (!bindingToRemove) {
    return template
  }

  const remainingBindings = (template.bindings ?? []).filter((binding) => binding.id !== bindingId)

  return {
    ...template,
    bindings: remainingBindings,
    elements: (template.elements ?? []).map((element) =>
      element.kind === 'text' &&
      element.id === bindingToRemove.elementId &&
      !remainingBindings.some(
        (binding) => binding.elementId === bindingToRemove.elementId && binding.targetProperty === 'text',
      )
        ? {
            ...element,
            sourceField: undefined,
          }
        : element,
    ),
  }
}

export function listBindingsForElement(
  template: TemplateContract,
  elementId: string,
): TemplateBinding[] {
  const storedBindings = (template.bindings ?? []).filter((binding) => binding.elementId === elementId)
  const derivedTextBinding = (template.elements ?? []).find(
    (
      element,
    ): element is Extract<(typeof template.elements)[number], { kind: 'text' }> =>
      element.kind === 'text' && element.id === elementId && typeof element.sourceField === 'string',
  )
  const derivedFieldId = derivedTextBinding?.sourceField

  if (!derivedFieldId || storedBindings.some((binding) => binding.targetProperty === 'text')) {
    return storedBindings
  }

  return [
    ...storedBindings,
    {
      id: `derived-${elementId}-${derivedFieldId}`,
      fieldKey: derivedFieldId,
      elementId,
      targetProperty: 'text',
    },
  ]
}

export function listBindingsForField(
  template: TemplateContract,
  fieldKey: string,
): TemplateBinding[] {
  const storedBindings = (template.bindings ?? []).filter((binding) => binding.fieldKey === fieldKey)
  const derivedBindings = (template.elements ?? [])
    .filter(
      (element): element is Extract<(typeof template.elements)[number], { kind: 'text' }> =>
        element.kind === 'text' && element.sourceField === fieldKey,
    )
    .map((element) => ({
      id: `derived-${element.id}-${fieldKey}`,
      fieldKey,
      elementId: element.id,
      targetProperty: 'text' as const,
    }))
    .filter((binding) => !storedBindings.some((storedBinding) => storedBinding.elementId === binding.elementId))

  return [...storedBindings, ...derivedBindings]
}
