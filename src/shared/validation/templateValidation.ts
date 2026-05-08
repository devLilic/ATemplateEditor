export interface TemplateValidationIssue {
  path: string
  message: string
}

export type TemplateValidationError = TemplateValidationIssue

export interface TemplateValidationResult {
  valid: boolean
  errors: TemplateValidationIssue[]
  warnings: TemplateValidationIssue[]
}

export interface ValidateTemplateOptions {
  mode?: 'draft' | 'finalExport'
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

function addIssue(issues: TemplateValidationIssue[], path: string, message: string) {
  issues.push({ path, message })
}

function addError(errors: TemplateValidationIssue[], path: string, message: string) {
  addIssue(errors, path, message)
}

function addWarning(warnings: TemplateValidationIssue[], path: string, message: string) {
  addIssue(warnings, path, message)
}

function createValidationResult(
  errors: TemplateValidationIssue[],
  warnings: TemplateValidationIssue[],
): TemplateValidationResult {
  const result = {
    valid: errors.length === 0,
    errors,
  } as TemplateValidationResult

  Object.defineProperty(result, 'warnings', {
    configurable: true,
    enumerable: false,
    value: warnings,
    writable: true,
  })

  return result
}

function addDuplicateIdError(
  ids: Set<string>,
  id: string,
  path: string,
  label: string,
  errors: TemplateValidationIssue[],
) {
  if (ids.has(id)) {
    addError(errors, path, `${label} id must be unique.`)
    return
  }

  ids.add(id)
}

function isTemplateElementKind(value: unknown) {
  return value === 'text' || value === 'image' || value === 'shape'
}

function isLayerType(value: unknown) {
  return value === 'text' || value === 'image' || value === 'shape' || value === 'background' || value === 'group'
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
  return value === 'rectangle' || value === 'ellipse' || value === 'line'
}

function isEditableFieldType(value: unknown) {
  return value === 'text'
}

function isBindingTargetProperty(value: unknown) {
  return value === 'text'
}

function isEditableDefaultValue(value: unknown) {
  return typeof value === 'string'
}

function validateBox(
  box: unknown,
  path: string,
  errors: TemplateValidationIssue[],
) {
  if (!isObject(box)) {
    addError(errors, path, 'Layer box must be an object.')
    return
  }

  if (!isFiniteNumber(box.x)) {
    addError(errors, `${path}.x`, 'Layer box.x must be a finite number.')
  }

  if (!isFiniteNumber(box.y)) {
    addError(errors, `${path}.y`, 'Layer box.y must be a finite number.')
  }

  if (!isFiniteNumber(box.width) || box.width <= 0) {
    addError(errors, `${path}.width`, 'Layer box.width must be greater than 0.')
  }

  if (!isFiniteNumber(box.height) || box.height <= 0) {
    addError(errors, `${path}.height`, 'Layer box.height must be greater than 0.')
  }
}

function validateLayerBase(
  layer: unknown,
  index: number,
  errors: TemplateValidationIssue[],
  layerIds: Set<string>,
) {
  const path = `layers[${index}]`

  if (!isObject(layer)) {
    addError(errors, path, 'Layer must be an object.')
    return
  }

  if (!isNonEmptyString(layer.id)) {
    addError(errors, `${path}.id`, 'Layer id must be a non-empty string.')
  } else {
    addDuplicateIdError(layerIds, layer.id, `${path}.id`, 'Layer', errors)
  }

  if (!isNonEmptyString(layer.name)) {
    addError(errors, `${path}.name`, 'Layer name must be a non-empty string.')
  }

  if (!isLayerType(layer.type)) {
    addError(errors, `${path}.type`, 'Layer type must be text, image, shape, background, or group.')
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

  validateBox(layer.box, `${path}.box`, errors)

  if (layer.opacity !== undefined && (!isFiniteNumber(layer.opacity) || layer.opacity < 0 || layer.opacity > 1)) {
    addError(errors, `${path}.opacity`, 'Layer opacity must be a finite number between 0 and 1.')
  }
}

function validateField(
  field: unknown,
  index: number,
  errors: TemplateValidationIssue[],
  fieldIds: Set<string>,
) {
  const path = `fields[${index}]`

  if (!isObject(field)) {
    addError(errors, path, 'Field must be an object.')
    return
  }

  if (!isNonEmptyString(field.id)) {
    addError(errors, `${path}.id`, 'Field id must be a non-empty string.')
  } else {
    addDuplicateIdError(fieldIds, field.id, `${path}.id`, 'Field', errors)
  }

  if (!isNonEmptyString(field.label)) {
    addError(errors, `${path}.label`, 'Field label must be a non-empty string.')
  }

  if (!isEditableFieldType(field.type)) {
    addError(errors, `${path}.type`, 'Field type must be text.')
  }

  if (typeof field.required !== 'boolean') {
    addError(errors, `${path}.required`, 'Field required must be a boolean.')
  }

  if (field.defaultValue !== undefined && typeof field.defaultValue !== 'string') {
    addError(errors, `${path}.defaultValue`, 'Field defaultValue must be a string.')
  }

  if (field.placeholder !== undefined && typeof field.placeholder !== 'string') {
    addError(errors, `${path}.placeholder`, 'Field placeholder must be a string.')
  }

  if (field.description !== undefined && typeof field.description !== 'string') {
    addError(errors, `${path}.description`, 'Field description must be a string.')
  }
}

function validateEditableField(
  field: unknown,
  index: number,
  errors: TemplateValidationIssue[],
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
    addError(
      errors,
      `${path}.defaultValue`,
      'Editable field defaultValue must be a string, number, or boolean.',
    )
  }
}

function validateBinding(
  binding: unknown,
  index: number,
  errors: TemplateValidationIssue[],
  fieldIds: Set<string>,
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
  } else if (!fieldIds.has(binding.fieldKey)) {
    addError(errors, `${path}.fieldKey`, 'Field does not exist.')
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

function validateTextElement(element: TemplateValidationObject, path: string, errors: TemplateValidationIssue[]) {
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
        addError(
          errors,
          `${path}.behavior.minScaleX`,
          'Text behavior.minScaleX must be greater than 0 and less than or equal to 1.',
        )
      }
    }
  }
}

function validateImageElement(element: TemplateValidationObject, path: string, errors: TemplateValidationIssue[]) {
  const opacity = element.opacity

  if (!isFiniteNumber(opacity) || opacity < 0 || opacity > 1) {
    addError(errors, `${path}.opacity`, 'Image opacity must be a finite number between 0 and 1.')
  }

  if (!isImageObjectFit(element.objectFit)) {
    addError(errors, `${path}.objectFit`, 'Image objectFit must be contain, cover, or fill.')
  }
}

function validateShapeElement(element: TemplateValidationObject, path: string, errors: TemplateValidationIssue[]) {
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
  errors: TemplateValidationIssue[],
  layerIds: Set<string>,
  elementIds: Set<string>,
) {
  const path = `elements[${index}]`

  if (!isObject(element)) {
    addError(errors, path, 'Element must be an object.')
    return
  }

  if (!isNonEmptyString(element.id)) {
    addError(errors, `${path}.id`, 'Element id must be a non-empty string.')
  } else {
    elementIds.add(element.id)
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

function validateTextLayer(
  layer: TemplateValidationObject,
  path: string,
  errors: TemplateValidationIssue[],
  warnings: TemplateValidationIssue[],
  fieldIds: Set<string>,
  usedFieldIds: Set<string>,
) {
  if (layer.fieldId !== undefined) {
    if (!isNonEmptyString(layer.fieldId)) {
      addError(errors, `${path}.fieldId`, 'Text layer fieldId must be a non-empty string.')
    } else if (!fieldIds.has(layer.fieldId)) {
      addError(errors, `${path}.fieldId`, 'Field does not exist.')
    } else {
      usedFieldIds.add(layer.fieldId)
    }
  }

  if (layer.fallbackText !== undefined && typeof layer.fallbackText !== 'string') {
    addError(errors, `${path}.fallbackText`, 'Text layer fallbackText must be a string.')
  }

  const hasFallbackText = typeof layer.fallbackText === 'string' && layer.fallbackText.length > 0
  if (layer.fieldId === undefined && !hasFallbackText) {
    addWarning(warnings, path, 'Text layer has neither fieldId nor fallbackText.')
  }

  if (layer.style !== undefined) {
    if (!isObject(layer.style)) {
      addError(errors, `${path}.style`, 'Text layer style must be an object.')
      return
    }

    if (!isNonEmptyString(layer.style.fontFamily)) {
      addError(errors, `${path}.style.fontFamily`, 'Text layer style.fontFamily must be a non-empty string.')
    }

    if (!isFiniteNumber(layer.style.fontSize) || layer.style.fontSize <= 0) {
      addError(errors, `${path}.style.fontSize`, 'Text layer style.fontSize must be greater than 0.')
    }

    if (!isNonEmptyString(layer.style.color)) {
      addError(errors, `${path}.style.color`, 'Text layer style.color must be a non-empty string.')
    }

    if (!isTextAlign(layer.style.textAlign)) {
      addError(errors, `${path}.style.textAlign`, 'Text layer style.textAlign must be left, center, or right.')
    }
  }

  if (layer.behavior !== undefined) {
    if (!isObject(layer.behavior)) {
      addError(errors, `${path}.behavior`, 'Text layer behavior must be an object.')
      return
    }

    if (typeof layer.behavior.fitInBox !== 'boolean') {
      addError(errors, `${path}.behavior.fitInBox`, 'Text layer behavior.fitInBox must be a boolean.')
    }

    if (!isTextFitMode(layer.behavior.fitMode)) {
      addError(errors, `${path}.behavior.fitMode`, 'Text layer behavior.fitMode must be scaleX.')
    }

    if (
      !isFiniteNumber(layer.behavior.minScaleX) ||
      layer.behavior.minScaleX <= 0 ||
      layer.behavior.minScaleX > 1
    ) {
      addError(
        errors,
        `${path}.behavior.minScaleX`,
        'Text layer behavior.minScaleX must be greater than 0 and less than or equal to 1.',
      )
    }

    if (layer.behavior.whiteSpace !== 'nowrap' && layer.behavior.whiteSpace !== 'normal') {
      addError(errors, `${path}.behavior.whiteSpace`, 'Text layer behavior.whiteSpace must be nowrap or normal.')
    }
  }
}

function validateImageLayer(
  layer: TemplateValidationObject,
  path: string,
  errors: TemplateValidationIssue[],
  assetIds: Set<string>,
  usedAssetIds: Set<string>,
) {
  if (layer.assetId !== undefined) {
    if (!isNonEmptyString(layer.assetId)) {
      addError(errors, `${path}.assetId`, 'Image layer assetId must be a non-empty string.')
    } else if (!assetIds.has(layer.assetId)) {
      addError(errors, `${path}.assetId`, 'Asset does not exist.')
    } else {
      usedAssetIds.add(layer.assetId)
    }
  }

  if (layer.fallbackPath !== undefined && typeof layer.fallbackPath !== 'string') {
    addError(errors, `${path}.fallbackPath`, 'Image layer fallbackPath must be a string.')
  }

  if (!isObject(layer.style)) {
    addError(errors, `${path}.style`, 'Image layer style must be an object.')
    return
  }

  if (!isImageObjectFit(layer.style.objectFit)) {
    addError(errors, `${path}.style.objectFit`, 'Image layer style.objectFit must be contain, cover, or fill.')
  }
}

function validateShapeLayer(layer: TemplateValidationObject, path: string, errors: TemplateValidationIssue[]) {
  if (!isShapeType(layer.shape)) {
    addError(errors, `${path}.shape`, 'Shape layer shape must be rectangle, ellipse, or line.')
  }

  if (!isObject(layer.style)) {
    addError(errors, `${path}.style`, 'Shape layer style must be an object.')
    return
  }

  if (!isNonEmptyString(layer.style.fill)) {
    addError(errors, `${path}.style.fill`, 'Shape layer style.fill must be a non-empty string.')
  }

  if (!isNonEmptyString(layer.style.stroke)) {
    addError(errors, `${path}.style.stroke`, 'Shape layer style.stroke must be a non-empty string.')
  }

  if (!isFiniteNumber(layer.style.strokeWidth) || layer.style.strokeWidth < 0) {
    addError(errors, `${path}.style.strokeWidth`, 'Shape layer style.strokeWidth must be greater than or equal to 0.')
  }

  if (!isFiniteNumber(layer.style.borderRadius) || layer.style.borderRadius < 0) {
    addError(errors, `${path}.style.borderRadius`, 'Shape layer style.borderRadius must be greater than or equal to 0.')
  }
}

function validateBackgroundLayer(
  layer: TemplateValidationObject,
  path: string,
  errors: TemplateValidationIssue[],
  assetIds: Set<string>,
  usedAssetIds: Set<string>,
) {
  if (!isObject(layer.style)) {
    addError(errors, `${path}.style`, 'Background layer style must be an object.')
    return
  }

  if (layer.style.fill !== undefined && typeof layer.style.fill !== 'string') {
    addError(errors, `${path}.style.fill`, 'Background layer style.fill must be a string.')
  }

  if (layer.style.assetId !== undefined) {
    if (!isNonEmptyString(layer.style.assetId)) {
      addError(errors, `${path}.style.assetId`, 'Background layer style.assetId must be a non-empty string.')
    } else if (!assetIds.has(layer.style.assetId)) {
      addError(errors, `${path}.style.assetId`, 'Asset does not exist.')
    } else {
      usedAssetIds.add(layer.style.assetId)
    }
  }

  if (layer.style.objectFit !== undefined && !isImageObjectFit(layer.style.objectFit)) {
    addError(errors, `${path}.style.objectFit`, 'Background layer style.objectFit must be contain, cover, or fill.')
  }
}

function validateGroupLayer(
  layer: TemplateValidationObject,
  path: string,
  errors: TemplateValidationIssue[],
  layerIds: Set<string>,
) {
  if (!Array.isArray(layer.children)) {
    addError(errors, `${path}.children`, 'Group layer children must be an array.')
    return
  }

  layer.children.forEach((childId, childIndex) => {
    const childPath = `${path}.children[${childIndex}]`

    if (!isNonEmptyString(childId)) {
      addError(errors, childPath, 'Group layer child id must be a non-empty string.')
      return
    }

    if (!layerIds.has(childId)) {
      addError(errors, childPath, 'Layer does not exist.')
    }
  })
}

function validateLayerDetails(
  layer: unknown,
  index: number,
  errors: TemplateValidationIssue[],
  warnings: TemplateValidationIssue[],
  fieldIds: Set<string>,
  usedFieldIds: Set<string>,
  assetIds: Set<string>,
  usedAssetIds: Set<string>,
  layerIds: Set<string>,
) {
  const path = `layers[${index}]`

  if (!isObject(layer) || !isLayerType(layer.type)) {
    return
  }

  if (layer.type === 'text') {
    validateTextLayer(layer, path, errors, warnings, fieldIds, usedFieldIds)
    return
  }

  if (layer.type === 'image') {
    validateImageLayer(layer, path, errors, assetIds, usedAssetIds)
    return
  }

  if (layer.type === 'shape') {
    validateShapeLayer(layer, path, errors)
    return
  }

  if (layer.type === 'background') {
    validateBackgroundLayer(layer, path, errors, assetIds, usedAssetIds)
    return
  }

  if (layer.type === 'group') {
    validateGroupLayer(layer, path, errors, layerIds)
  }
}

export function validateTemplate(
  input: unknown,
  options: ValidateTemplateOptions = {},
): TemplateValidationResult {
  const errors: TemplateValidationIssue[] = []
  const warnings: TemplateValidationIssue[] = []
  const layerIds = new Set<string>()
  const elementIds = new Set<string>()
  const fieldIds = new Set<string>()
  const assetIds = new Set<string>()
  const usedFieldIds = new Set<string>()
  const usedAssetIds = new Set<string>()
  const mode = options.mode ?? 'draft'

  if (!isObject(input)) {
    addError(errors, '', 'Template must be an object.')
    return createValidationResult(errors, warnings)
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
    if (!isFiniteNumber(input.canvas.width) || input.canvas.width <= 0) {
      addError(errors, 'canvas.width', 'canvas.width must be greater than 0.')
    }

    if (!isFiniteNumber(input.canvas.height) || input.canvas.height <= 0) {
      addError(errors, 'canvas.height', 'canvas.height must be greater than 0.')
    }

    if (input.canvas.aspectRatio !== undefined && input.canvas.aspectRatio !== '16:9') {
      addError(errors, 'canvas.aspectRatio', 'canvas.aspectRatio must be 16:9.')
    }
  }

  if (!isObject(input.output)) {
    addError(errors, 'output', 'output must be an object.')
  } else if (input.output.liveboard !== undefined) {
    if (!isObject(input.output.liveboard)) {
      addError(errors, 'output.liveboard', 'output.liveboard must be an object.')
    } else if (typeof input.output.liveboard.templateName !== 'string') {
      addError(errors, 'output.liveboard.templateName', 'output.liveboard.templateName must be a string.')
    } else if (input.output.liveboard.templateName.trim().length === 0) {
      if (mode === 'finalExport') {
        addError(
          errors,
          'output.liveboard.templateName',
          'output.liveboard.templateName must not be empty in final export mode.',
        )
      } else {
        addWarning(
          warnings,
          'output.liveboard.templateName',
          'output.liveboard.templateName is empty in draft mode.',
        )
      }
    }
  }

  if (!Array.isArray(input.fields)) {
    addError(errors, 'fields', 'fields must be an array.')
  } else {
    input.fields.forEach((field, index) => {
      validateField(field, index, errors, fieldIds)
    })
  }

  if (!Array.isArray(input.layers)) {
    addError(errors, 'layers', 'layers must be an array.')
  } else {
    if (input.layers.length === 0) {
      addWarning(warnings, 'layers', 'Template has no layers.')
    }

    input.layers.forEach((layer, index) => {
      validateLayerBase(layer, index, errors, layerIds)
    })
  }

  if (input.elements !== undefined && !Array.isArray(input.elements)) {
    addError(errors, 'elements', 'elements must be an array.')
  } else if (Array.isArray(input.elements)) {
    input.elements.forEach((element, index) => {
      validateElement(element, index, errors, layerIds, elementIds)
    })
  }

  if (!Array.isArray(input.assets)) {
    addError(errors, 'assets', 'assets must be an array.')
  } else {
    input.assets.forEach((asset, index) => {
      const path = `assets[${index}]`

      if (!isObject(asset)) {
        addError(errors, path, 'Asset must be an object.')
        return
      }

      if (!isNonEmptyString(asset.id)) {
        addError(errors, `${path}.id`, 'Asset id must be a non-empty string.')
      } else {
        addDuplicateIdError(assetIds, asset.id, `${path}.id`, 'Asset', errors)
      }

      if (!isNonEmptyString(asset.name)) {
        addError(errors, `${path}.name`, 'Asset name must be a non-empty string.')
      }

      if (asset.type !== 'image') {
        addError(errors, `${path}.type`, 'Asset type must be image.')
      }

      if (!isNonEmptyString(asset.path)) {
        addError(errors, `${path}.path`, 'Asset path must be a non-empty string.')
      }
    })
  }

  if (input.editableFields !== undefined && !Array.isArray(input.editableFields)) {
    addError(errors, 'editableFields', 'editableFields must be an array.')
  } else if (Array.isArray(input.editableFields)) {
    const fieldKeys = new Set<string>()

    input.editableFields.forEach((field, index) => {
      validateEditableField(field, index, errors, fieldKeys)
    })
  }

  if (input.bindings !== undefined && !Array.isArray(input.bindings)) {
    addError(errors, 'bindings', 'bindings must be an array.')
  } else if (Array.isArray(input.bindings)) {
    input.bindings.forEach((binding, index) => {
      validateBinding(binding, index, errors, fieldIds, elementIds)
    })
  }

  if (!isObject(input.preview)) {
    addError(errors, 'preview', 'preview must be an object.')
  } else {
    if (!isObject(input.preview.sampleData)) {
      addError(errors, 'preview.sampleData', 'preview.sampleData must be an object.')
    }

    if (!isObject(input.preview.background)) {
      addError(errors, 'preview.background', 'preview.background must be an object.')
    } else if (input.preview.background.type === 'image') {
      if (!isNonEmptyString(input.preview.background.assetId)) {
        addError(errors, 'preview.background.assetId', 'preview.background.assetId must be a non-empty string.')
      } else if (!assetIds.has(input.preview.background.assetId)) {
        addError(errors, 'preview.background.assetId', 'Asset does not exist.')
      } else {
        usedAssetIds.add(input.preview.background.assetId)
      }
    }

    if (typeof input.preview.showSafeArea !== 'boolean') {
      addError(errors, 'preview.showSafeArea', 'preview.showSafeArea must be a boolean.')
    }

    if (typeof input.preview.showLayerBounds !== 'boolean') {
      addError(errors, 'preview.showLayerBounds', 'preview.showLayerBounds must be a boolean.')
    }
  }

  if (!isObject(input.metadata)) {
    addError(errors, 'metadata', 'metadata must be an object.')
  } else {
    if (!isNonEmptyString(input.metadata.createdAt)) {
      addError(errors, 'metadata.createdAt', 'metadata.createdAt must be a non-empty string.')
    }

    if (!isNonEmptyString(input.metadata.updatedAt)) {
      addError(errors, 'metadata.updatedAt', 'metadata.updatedAt must be a non-empty string.')
    }

    if (
      input.metadata.duplicatedFromTemplateId !== undefined &&
      input.metadata.duplicatedFromTemplateId !== null &&
      !isNonEmptyString(input.metadata.duplicatedFromTemplateId)
    ) {
      addError(
        errors,
        'metadata.duplicatedFromTemplateId',
        'metadata.duplicatedFromTemplateId must be a string or null.',
      )
    }

    if (
      input.metadata.tags !== undefined &&
      (!Array.isArray(input.metadata.tags) ||
        input.metadata.tags.some((tag) => typeof tag !== 'string'))
    ) {
      addError(errors, 'metadata.tags', 'metadata.tags must be an array of strings.')
    }
  }

  if (Array.isArray(input.layers)) {
    input.layers.forEach((layer, index) => {
      validateLayerDetails(
        layer,
        index,
        errors,
        warnings,
        fieldIds,
        usedFieldIds,
        assetIds,
        usedAssetIds,
        layerIds,
      )
    })
  }

  if (Array.isArray(input.fields)) {
    input.fields.forEach((field, index) => {
      if (!isObject(field) || !isNonEmptyString(field.id)) {
        return
      }

      if (!usedFieldIds.has(field.id)) {
        addWarning(warnings, `fields[${index}].id`, 'Field is defined but not used by any text layer.')
      }
    })
  }

  if (Array.isArray(input.assets)) {
    input.assets.forEach((asset, index) => {
      if (!isObject(asset) || !isNonEmptyString(asset.id)) {
        return
      }

      if (!usedAssetIds.has(asset.id)) {
        addWarning(warnings, `assets[${index}].id`, 'Asset is defined but not used.')
      }
    })
  }

  return createValidationResult(errors, warnings)
}
