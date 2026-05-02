export interface TemplateValidationError {
  path: string
  message: string
}

export interface TemplateValidationResult {
  valid: boolean
  errors: TemplateValidationError[]
}

type TemplateValidationObject = Record<string, unknown>

function isObject(value: unknown): value is TemplateValidationObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function addError(errors: TemplateValidationError[], path: string, message: string) {
  errors.push({
    path,
    message,
  })
}

function validateLayer(layer: unknown, index: number, errors: TemplateValidationError[]) {
  const path = `layers[${index}]`

  if (!isObject(layer)) {
    addError(errors, path, 'Layer must be an object.')
    return
  }

  if (!isNonEmptyString(layer.id)) {
    addError(errors, `${path}.id`, 'Layer id must be a non-empty string.')
  }

  if (!isNonEmptyString(layer.name)) {
    addError(errors, `${path}.name`, 'Layer name must be a non-empty string.')
  }

  if (!isLayerType(layer.type)) {
    addError(errors, `${path}.type`, 'Layer type must be text, background, or image.')
  }

  if (typeof layer.visible !== 'boolean') {
    addError(errors, `${path}.visible`, 'Layer visible must be a boolean.')
  }

  if (typeof layer.locked !== 'boolean') {
    addError(errors, `${path}.locked`, 'Layer locked must be a boolean.')
  }

  if (!isFiniteNumber(layer.zIndex)) {
    addError(errors, `${path}.zIndex`, 'Layer zIndex must be a finite number.')
  }

  const opacity = layer.opacity

  if (!isFiniteNumber(opacity) || opacity < 0 || opacity > 1) {
    addError(errors, `${path}.opacity`, 'Layer opacity must be a finite number between 0 and 1.')
  }
}

function isTemplateElementKind(value: unknown) {
  return value === 'text' || value === 'image' || value === 'shape'
}

function isLayerType(value: unknown) {
  return value === 'text' || value === 'background' || value === 'image'
}

function isTextAlign(value: unknown) {
  return value === 'left' || value === 'center' || value === 'right'
}

function isTextFitMode(value: unknown) {
  return value === 'scaleX'
}

function isImageObjectFit(value: unknown) {
  return value === 'contain' || value === 'cover' || value === 'fill'
}

function isShapeType(value: unknown) {
  return value === 'rectangle' || value === 'ellipse'
}

function isEditableFieldType(value: unknown) {
  return value === 'text' || value === 'image' || value === 'number'
}

function isBindingTargetProperty(value: unknown) {
  return value === 'text' || value === 'image' || value === 'visibility'
}

function isEditableDefaultValue(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

function validateEditableField(
  field: unknown,
  index: number,
  errors: TemplateValidationError[],
  fieldKeys: Set<string>,
) {
  const path = `editableFields[${index}]`

  if (!isObject(field)) {
    addError(errors, path, 'Editable field must be an object.')
    return
  }

  if (!isNonEmptyString(field.id)) {
    addError(errors, `${path}.id`, 'Editable field id must be a non-empty string.')
  }

  if (!isNonEmptyString(field.key)) {
    addError(errors, `${path}.key`, 'Editable field key must be a non-empty string.')
  } else {
    fieldKeys.add(field.key)
  }

  if (!isNonEmptyString(field.label)) {
    addError(errors, `${path}.label`, 'Editable field label must be a non-empty string.')
  }

  if (!isEditableFieldType(field.type)) {
    addError(errors, `${path}.type`, 'Editable field type must be text, image, or number.')
  }

  if (typeof field.required !== 'boolean') {
    addError(errors, `${path}.required`, 'Editable field required must be a boolean.')
  }

  if (field.defaultValue !== undefined && !isEditableDefaultValue(field.defaultValue)) {
    addError(errors, `${path}.defaultValue`, 'Editable field defaultValue must be a string, number, or boolean.')
  }
}

function validateBinding(
  binding: unknown,
  index: number,
  errors: TemplateValidationError[],
  fieldKeys: Set<string>,
  elementIds: Set<string>,
) {
  const path = `bindings[${index}]`

  if (!isObject(binding)) {
    addError(errors, path, 'Binding must be an object.')
    return
  }

  if (!isNonEmptyString(binding.id)) {
    addError(errors, `${path}.id`, 'Binding id must be a non-empty string.')
  }

  if (!isNonEmptyString(binding.fieldKey)) {
    addError(errors, `${path}.fieldKey`, 'Binding fieldKey must be a non-empty string.')
  } else if (!fieldKeys.has(binding.fieldKey)) {
    addError(errors, `${path}.fieldKey`, 'Editable field does not exist.')
  }

  if (!isNonEmptyString(binding.elementId)) {
    addError(errors, `${path}.elementId`, 'Binding elementId must be a non-empty string.')
  } else if (!elementIds.has(binding.elementId)) {
    addError(errors, `${path}.elementId`, 'Element does not exist.')
  }

  if (!isBindingTargetProperty(binding.targetProperty)) {
    addError(errors, `${path}.targetProperty`, 'Binding targetProperty must be text, image, or visibility.')
  }
}

function validateTextElement(element: TemplateValidationObject, path: string, errors: TemplateValidationError[]) {
  if (typeof element.fallbackText !== 'string') {
    addError(errors, `${path}.fallbackText`, 'Text fallbackText must be a string.')
  }

  if (!isObject(element.style)) {
    addError(errors, `${path}.style`, 'Text style must be an object.')
    return
  }

  const fontSize = element.style.fontSize

  if (!isFiniteNumber(fontSize) || fontSize <= 0) {
    addError(errors, `${path}.style.fontSize`, 'Text style.fontSize must be greater than 0.')
  }

  if (!isNonEmptyString(element.style.fontFamily)) {
    addError(errors, `${path}.style.fontFamily`, 'Text style.fontFamily must be a non-empty string.')
  }

  if (!isNonEmptyString(element.style.color)) {
    addError(errors, `${path}.style.color`, 'Text style.color must be a non-empty string.')
  }

  if (!isTextAlign(element.style.textAlign)) {
    addError(errors, `${path}.style.textAlign`, 'Text style.textAlign must be left, center, or right.')
  }

  if (element.behavior !== undefined) {
    if (!isObject(element.behavior)) {
      addError(errors, `${path}.behavior`, 'Text behavior must be an object.')
      return
    }

    if (element.behavior.fitInBox !== undefined && typeof element.behavior.fitInBox !== 'boolean') {
      addError(errors, `${path}.behavior.fitInBox`, 'Text behavior.fitInBox must be a boolean.')
    }

    if (element.behavior.fitMode !== undefined && !isTextFitMode(element.behavior.fitMode)) {
      addError(errors, `${path}.behavior.fitMode`, 'Text behavior.fitMode must be scaleX.')
    }

    if (element.behavior.minScaleX !== undefined) {
      const minScaleX = element.behavior.minScaleX

      if (!isFiniteNumber(minScaleX) || minScaleX <= 0 || minScaleX > 1) {
        addError(errors, `${path}.behavior.minScaleX`, 'Text behavior.minScaleX must be greater than 0 and less than or equal to 1.')
      }
    }
  }
}

function validateImageElement(element: TemplateValidationObject, path: string, errors: TemplateValidationError[]) {
  const opacity = element.opacity

  if (!isFiniteNumber(opacity) || opacity < 0 || opacity > 1) {
    addError(errors, `${path}.opacity`, 'Image opacity must be a finite number between 0 and 1.')
  }

  if (!isImageObjectFit(element.objectFit)) {
    addError(errors, `${path}.objectFit`, 'Image objectFit must be contain, cover, or fill.')
  }
}

function validateShapeElement(element: TemplateValidationObject, path: string, errors: TemplateValidationError[]) {
  if (!isShapeType(element.shapeType)) {
    addError(errors, `${path}.shapeType`, 'Shape shapeType must be rectangle or ellipse.')
  }

  if (!isNonEmptyString(element.fillColor)) {
    addError(errors, `${path}.fillColor`, 'Shape fillColor must be a non-empty string.')
  }

  const borderWidth = element.borderWidth

  if (!isFiniteNumber(borderWidth) || borderWidth < 0) {
    addError(errors, `${path}.borderWidth`, 'Shape borderWidth must be a finite number greater than or equal to 0.')
  }
}

function validateElement(
  element: unknown,
  index: number,
  errors: TemplateValidationError[],
  layerIds: Set<string>,
) {
  const path = `elements[${index}]`

  if (!isObject(element)) {
    addError(errors, path, 'Element must be an object.')
    return
  }

  if (!isNonEmptyString(element.id)) {
    addError(errors, `${path}.id`, 'Element id must be a non-empty string.')
  }

  if (!isNonEmptyString(element.layerId)) {
    addError(errors, `${path}.layerId`, 'Element layerId must be a non-empty string.')
  } else if (!layerIds.has(element.layerId)) {
    addError(errors, `${path}.layerId`, 'Layer does not exist.')
  }

  if (!isTemplateElementKind(element.kind)) {
    addError(errors, `${path}.kind`, 'Element kind must be text, image, or shape.')
  }

  if (!isNonEmptyString(element.name)) {
    addError(errors, `${path}.name`, 'Element name must be a non-empty string.')
  }

  if (!isObject(element.position)) {
    addError(errors, `${path}.position`, 'Element position must be an object.')
  } else {
    if (!isFiniteNumber(element.position.x)) {
      addError(errors, `${path}.position.x`, 'Element position.x must be a finite number.')
    }

    if (!isFiniteNumber(element.position.y)) {
      addError(errors, `${path}.position.y`, 'Element position.y must be a finite number.')
    }
  }

  if (!isObject(element.size)) {
    addError(errors, `${path}.size`, 'Element size must be an object.')
  } else {
    const width = element.size.width
    const height = element.size.height

    if (!isFiniteNumber(width) || width <= 0) {
      addError(errors, `${path}.size.width`, 'Element size.width must be greater than 0.')
    }

    if (!isFiniteNumber(height) || height <= 0) {
      addError(errors, `${path}.size.height`, 'Element size.height must be greater than 0.')
    }
  }

  if (element.rotation !== undefined && !isFiniteNumber(element.rotation)) {
    addError(errors, `${path}.rotation`, 'Element rotation must be a finite number.')
  }

  if (typeof element.visible !== 'boolean') {
    addError(errors, `${path}.visible`, 'Element visible must be a boolean.')
  }

  if (typeof element.locked !== 'boolean') {
    addError(errors, `${path}.locked`, 'Element locked must be a boolean.')
  }

  if (element.kind === 'text') {
    validateTextElement(element, path, errors)
  }

  if (element.kind === 'image') {
    validateImageElement(element, path, errors)
  }

  if (element.kind === 'shape') {
    validateShapeElement(element, path, errors)
  }
}

export function validateTemplate(input: unknown): TemplateValidationResult {
  const errors: TemplateValidationError[] = []
  const layerIds = new Set<string>()
  const elementIds = new Set<string>()
  const fieldKeys = new Set<string>()

  if (!isObject(input)) {
    addError(errors, '', 'Template must be an object.')

    return {
      valid: false,
      errors,
    }
  }

  if (!isNonEmptyString(input.schemaVersion)) {
    addError(errors, 'schemaVersion', 'schemaVersion must be a non-empty string.')
  }

  if (!isNonEmptyString(input.id)) {
    addError(errors, 'id', 'id must be a non-empty string.')
  }

  if (!isNonEmptyString(input.name)) {
    addError(errors, 'name', 'name must be a non-empty string.')
  }

  if (!isObject(input.canvas)) {
    addError(errors, 'canvas', 'canvas must be an object.')
  } else {
    if (typeof input.canvas.width !== 'number' || input.canvas.width <= 0) {
      addError(errors, 'canvas.width', 'canvas.width must be greater than 0.')
    }

    if (typeof input.canvas.height !== 'number' || input.canvas.height <= 0) {
      addError(errors, 'canvas.height', 'canvas.height must be greater than 0.')
    }
  }

  if (!Array.isArray(input.layers)) {
    addError(errors, 'layers', 'layers must be an array.')
  } else {
    input.layers.forEach((layer, index) => {
      validateLayer(layer, index, errors)

      if (isObject(layer) && isNonEmptyString(layer.id)) {
        layerIds.add(layer.id)
      }
    })
  }

  if (!Array.isArray(input.elements)) {
    addError(errors, 'elements', 'elements must be an array.')
  } else {
    input.elements.forEach((element, index) => {
      validateElement(element, index, errors, layerIds)

      if (isObject(element) && isNonEmptyString(element.id)) {
        elementIds.add(element.id)
      }
    })
  }

  if (!Array.isArray(input.assets)) {
    addError(errors, 'assets', 'assets must be an array.')
  }

  if (!Array.isArray(input.editableFields)) {
    addError(errors, 'editableFields', 'editableFields must be an array.')
  } else {
    input.editableFields.forEach((field, index) => {
      validateEditableField(field, index, errors, fieldKeys)
    })
  }

  if (!Array.isArray(input.bindings)) {
    addError(errors, 'bindings', 'bindings must be an array.')
  } else {
    input.bindings.forEach((binding, index) => {
      validateBinding(binding, index, errors, fieldKeys, elementIds)
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
