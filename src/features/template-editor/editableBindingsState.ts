import type {
  TemplateBinding,
  TemplateContract,
  TemplateEditableField,
} from '@/shared/template-contract/templateContract'

export interface CreateEditableFieldInput {
  key: string
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

export function createEditableField(input: CreateEditableFieldInput): TemplateEditableField {
  return {
    id: createEditableFieldId(),
    key: input.key,
    label: input.label,
    type: input.type,
    required: input.required ?? false,
    defaultValue: input.defaultValue ?? '',
  }
}

export function addEditableField(
  template: TemplateContract,
  field: TemplateEditableField,
): TemplateContract {
  if (template.editableFields.some((existingField) => existingField.key === field.key)) {
    return template
  }

  return {
    ...template,
    editableFields: [...template.editableFields, field],
  }
}

export function updateEditableField(
  template: TemplateContract,
  fieldId: string,
  patch: Partial<TemplateEditableField>,
): TemplateContract {
  const fieldIndex = template.editableFields.findIndex((field) => field.id === fieldId)

  if (fieldIndex === -1) {
    return template
  }

  const currentField = template.editableFields[fieldIndex]
  const nextField: TemplateEditableField = {
    ...currentField,
    ...patch,
    id: currentField.id,
  }
  const oldKey = currentField.key
  const newKey = nextField.key
  const editableFields = template.editableFields.map((field, index) =>
    index === fieldIndex ? nextField : field,
  )

  if (oldKey === newKey) {
    return {
      ...template,
      editableFields,
    }
  }

  return {
    ...template,
    editableFields,
    bindings: template.bindings.map((binding) =>
      binding.fieldKey === oldKey ? { ...binding, fieldKey: newKey } : binding,
    ),
    previewData: renameRecordKey(template.previewData, oldKey, newKey),
    fallbackValues: renameRecordKey(template.fallbackValues, oldKey, newKey),
  }
}

export function removeEditableField(template: TemplateContract, fieldId: string): TemplateContract {
  const fieldToRemove = template.editableFields.find((field) => field.id === fieldId)

  if (!fieldToRemove) {
    return template
  }

  return {
    ...template,
    editableFields: template.editableFields.filter((field) => field.id !== fieldId),
    bindings: template.bindings.filter((binding) => binding.fieldKey !== fieldToRemove.key),
    previewData: removeRecordKey(template.previewData, fieldToRemove.key),
    fallbackValues: removeRecordKey(template.fallbackValues, fieldToRemove.key),
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
  const bindingIdExists = template.bindings.some((existingBinding) => existingBinding.id === binding.id)
  const fieldExists = template.editableFields.some((field) => field.key === binding.fieldKey)
  const elementExists = template.elements.some((element) => element.id === binding.elementId)

  if (bindingIdExists || !fieldExists || !elementExists) {
    return template
  }

  return {
    ...template,
    bindings: [...template.bindings, binding],
  }
}

export function updateBinding(
  template: TemplateContract,
  bindingId: string,
  patch: Partial<TemplateBinding>,
): TemplateContract {
  const bindingIndex = template.bindings.findIndex((binding) => binding.id === bindingId)

  if (bindingIndex === -1) {
    return template
  }

  const currentBinding = template.bindings[bindingIndex]
  const nextFieldKey =
    patch.fieldKey && template.editableFields.some((field) => field.key === patch.fieldKey)
      ? patch.fieldKey
      : currentBinding.fieldKey
  const nextElementId =
    patch.elementId && template.elements.some((element) => element.id === patch.elementId)
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
  }
}

export function removeBinding(template: TemplateContract, bindingId: string): TemplateContract {
  const hasBinding = template.bindings.some((binding) => binding.id === bindingId)

  if (!hasBinding) {
    return template
  }

  return {
    ...template,
    bindings: template.bindings.filter((binding) => binding.id !== bindingId),
  }
}

export function listBindingsForElement(
  template: TemplateContract,
  elementId: string,
): TemplateBinding[] {
  return template.bindings.filter((binding) => binding.elementId === elementId)
}

export function listBindingsForField(
  template: TemplateContract,
  fieldKey: string,
): TemplateBinding[] {
  return template.bindings.filter((binding) => binding.fieldKey === fieldKey)
}
