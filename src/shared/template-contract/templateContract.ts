export type TemplateSchemaVersion = '1.0.0'
export type TemplateType = 'graphic'

export interface TemplateCanvas {
  width: number
  height: number
}

export interface TemplateLayer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  zIndex: number
  opacity: number
}

export type TemplateElementKind = 'text' | 'image' | 'shape'

export interface TemplatePosition {
  x: number
  y: number
}

export interface TemplateSize {
  width: number
  height: number
}

export interface TemplateTextStyle {
  fontSize: number
  fontFamily: string
  color: string
  textAlign: 'left' | 'center' | 'right'
}

export interface TemplateImageStyle {
  opacity: number
  objectFit: 'contain'
}

export interface TemplateShapeStyle {
  shapeType: 'rectangle'
  fillColor: string
  borderColor?: string
  borderWidth: number
}

export interface TemplateElementBase {
  id: string
  kind: TemplateElementKind
  layerId: string
  name: string
  position: TemplatePosition
  size: TemplateSize
  visible: boolean
  locked: boolean
}

export interface TemplateTextElement extends TemplateElementBase {
  kind: 'text'
  rotation: number
  sourceField?: string
  fallbackText: string
  style: TemplateTextStyle
}

export interface TemplateImageElement extends TemplateElementBase {
  kind: 'image'
  assetId?: string
  opacity: number
  objectFit: TemplateImageStyle['objectFit']
}

export interface TemplateShapeElement extends TemplateElementBase {
  kind: 'shape'
  shapeType: TemplateShapeStyle['shapeType']
  fillColor: string
  borderColor?: string
  borderWidth: number
}

export type TemplateElement = TemplateTextElement | TemplateImageElement | TemplateShapeElement

export interface TemplateAsset {
  id: string
}

export interface TemplateEditableField {
  id: string
}

export interface TemplateBinding {
  id: string
}

export interface TemplateOscCommand {
  address: string
  args?: unknown[]
}

export interface TemplateOscConfig {
  enabled: boolean
  playCommand?: TemplateOscCommand
  stopCommand?: TemplateOscCommand
}

export interface TemplateOnAirConfig {
  durationMs?: number
  autoHide: boolean
  prerollMs: number
  postrollMs: number
}

export interface TemplateMetadata {
  createdAt: string
  updatedAt: string
  author?: string
  description?: string
}

export interface TemplateContract {
  schemaVersion: TemplateSchemaVersion
  id: string
  name: string
  type: TemplateType
  canvas: TemplateCanvas
  layers: TemplateLayer[]
  elements: TemplateElement[]
  assets: TemplateAsset[]
  editableFields: TemplateEditableField[]
  bindings: TemplateBinding[]
  previewData: Record<string, unknown>
  osc: TemplateOscConfig
  onAir: TemplateOnAirConfig
  metadata: TemplateMetadata
  fallbackValues: Record<string, unknown>
}

interface CreateEmptyTemplateInput {
  name?: string
  type?: TemplateType
}

interface CreateLayerInput {
  name?: string
  zIndex?: number
}

interface CreateTemplateElementInput {
  layerId: string
  name?: string
  position?: TemplatePosition
  size?: TemplateSize
}

function createTemplateId() {
  return `template-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function createElementId() {
  return `element-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function createLayerId() {
  return `layer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function createElementBase(
  input: CreateTemplateElementInput,
  defaults: { name: string; size: TemplateSize },
): Omit<TemplateElementBase, 'kind'> {
  return {
    id: createElementId(),
    layerId: input.layerId,
    name: input.name ?? defaults.name,
    position: input.position ?? { x: 0, y: 0 },
    size: input.size ?? defaults.size,
    visible: true,
    locked: false,
  }
}

export function createLayer(input: CreateLayerInput = {}): TemplateLayer {
  return {
    id: createLayerId(),
    name: input.name ?? 'Layer',
    visible: true,
    locked: false,
    zIndex: input.zIndex ?? 0,
    opacity: 1,
  }
}

export function createEmptyTemplate(input: CreateEmptyTemplateInput = {}): TemplateContract {
  const now = new Date().toISOString()

  return {
    schemaVersion: '1.0.0',
    id: createTemplateId(),
    name: input.name ?? 'Untitled template',
    type: input.type ?? 'graphic',
    canvas: {
      width: 1920,
      height: 1080,
    },
    layers: [],
    elements: [],
    assets: [],
    editableFields: [],
    bindings: [],
    previewData: {},
    fallbackValues: {},
    osc: {
      enabled: false,
      playCommand: undefined,
      stopCommand: undefined,
    },
    onAir: {
      durationMs: undefined,
      autoHide: false,
      prerollMs: 0,
      postrollMs: 0,
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      author: undefined,
      description: undefined,
    },
  }
}

export function createTextElement(input: CreateTemplateElementInput): TemplateTextElement {
  return {
    ...createElementBase(input, {
      name: 'Text',
      size: { width: 600, height: 80 },
    }),
    kind: 'text',
    rotation: 0,
    sourceField: undefined,
    fallbackText: '',
    style: {
      fontSize: 48,
      fontFamily: 'Arial',
      color: '#FFFFFF',
      textAlign: 'left',
    },
  }
}

export function createImageElement(input: CreateTemplateElementInput): TemplateImageElement {
  return {
    ...createElementBase(input, {
      name: 'Image',
      size: { width: 400, height: 300 },
    }),
    kind: 'image',
    assetId: undefined,
    opacity: 1,
    objectFit: 'contain',
  }
}

export function createShapeElement(input: CreateTemplateElementInput): TemplateShapeElement {
  return {
    ...createElementBase(input, {
      name: 'Shape',
      size: { width: 400, height: 120 },
    }),
    kind: 'shape',
    shapeType: 'rectangle',
    fillColor: '#1F2937',
    borderColor: undefined,
    borderWidth: 0,
  }
}
