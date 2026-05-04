export type TemplateSchemaVersion = '1.0.0'
export type TemplateType = 'graphic'

export interface TemplateSafeAreaContract {
  enabled: boolean
  marginX: number
  marginY: number
}

export interface TemplateCanvasContract {
  width: number
  height: number
  aspectRatio?: '16:9'
  safeArea?: TemplateSafeAreaContract
}

export type TemplateCanvas = TemplateCanvasContract

export interface TemplateOutputLiveboardContract {
  templateName: string
}

export interface TemplateOutputContract {
  liveboard?: TemplateOutputLiveboardContract
}

export type TemplateLayerType = 'text' | 'image' | 'shape' | 'background' | 'group'

export interface LayerBoxContract {
  x: number
  y: number
  width: number
  height: number
}

export interface BaseTemplateLayerContract {
  id: string
  name: string
  type: TemplateLayerType
  visible: boolean
  locked: boolean
  zIndex: number
  box: LayerBoxContract
  opacity?: number
}

export type TemplateLayerVisibilityMode = 'always' | 'whenFieldHasValue'

export interface TemplateLayerVisibility {
  mode: TemplateLayerVisibilityMode
  fieldId?: string
}

export interface TemplateLayerContract extends BaseTemplateLayerContract {
  [key: string]: unknown
  /**
   * @deprecated Legacy layer visibility retained temporarily while the UI is realigned.
   */
  visibility: TemplateLayerVisibility
}

export interface TemplateTextLayerStyleContract {
  fontFamily: string
  fontSize: number
  color: string
  textAlign: 'left' | 'center' | 'right'
}

export interface TemplateTextLayerBehaviorContract {
  fitInBox: boolean
  fitMode: 'scaleX'
  minScaleX: number
  whiteSpace: 'nowrap' | 'normal'
}

export interface TemplateTextLayerContract extends TemplateLayerContract {
  type: 'text'
  fieldId?: string
  fallbackText?: string
  style: TemplateTextLayerStyleContract
  behavior: TemplateTextLayerBehaviorContract
  rotation?: number
}

export interface TemplateImageLayerStyleContract {
  objectFit: 'contain' | 'cover' | 'fill'
  objectPosition: string
}

export interface TemplateImageLayerContract extends TemplateLayerContract {
  type: 'image'
  assetId?: string
  fallbackPath?: string
  style: TemplateImageLayerStyleContract
}

export interface TemplateShapeLayerStyleContract {
  fill: string
  stroke: string
  strokeWidth: number
  borderRadius: number
}

export interface TemplateShapeLayerContract extends TemplateLayerContract {
  type: 'shape'
  shape: 'rectangle' | 'ellipse' | 'line'
  style: TemplateShapeLayerStyleContract
}

export interface TemplateBackgroundLayerStyleContract {
  fill?: string
  assetId?: string
  objectFit?: 'contain' | 'cover' | 'fill'
}

export interface TemplateBackgroundLayerContract extends TemplateLayerContract {
  type: 'background'
  style: TemplateBackgroundLayerStyleContract
}

export interface TemplateGroupLayerContract extends TemplateLayerContract {
  type: 'group'
  children: string[]
}

export type TemplateLayer = TemplateLayerContract

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
  fontWeight: number
  lineHeight: number
  letterSpacing: number
  verticalAlign: 'top' | 'middle' | 'bottom'
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  maxLines: number
}

export interface TemplateTextBehavior {
  fitInBox?: boolean
  fitMode?: 'scaleX'
  minScaleX?: number
}

export interface TemplateImageStyle {
  opacity: number
  objectFit: 'contain' | 'cover' | 'fill'
}

export interface TemplateShapeStyle {
  shapeType: 'rectangle' | 'ellipse'
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
  behavior: TemplateTextBehavior
}

export interface TemplateImageElement extends TemplateElementBase {
  kind: 'image'
  assetId?: string
  opacity: number
  objectFit: TemplateImageStyle['objectFit']
  objectPosition: string
  borderRadius: number
}

export interface TemplateShapeElement extends TemplateElementBase {
  kind: 'shape'
  shapeType: TemplateShapeStyle['shapeType']
  fillColor: string
  borderColor?: string
  borderWidth: number
  stroke?: string
  strokeWidth: number
  borderRadius: number
}

export type TemplateElement = TemplateTextElement | TemplateImageElement | TemplateShapeElement

export type TemplateAssetType = 'image'

export interface TemplateAssetMetadataContract {
  width?: number
  height?: number
  mimeType?: string
  originalFileName?: string
  storedAt?: string
}

export type TemplateAssetMetadata = TemplateAssetMetadataContract

export interface TemplateAssetContract {
  id: string
  name: string
  type: TemplateAssetType
  path: string
  metadata?: TemplateAssetMetadataContract
}

export type TemplateAsset = TemplateAssetContract

export interface TemplateFieldContract {
  [key: string]: unknown
  id: string
  label: string
  type: 'text'
  required: boolean
  defaultValue?: string
  placeholder?: string
  description?: string
}

/**
 * @deprecated Legacy editable field shape kept during the transition from editableFields to fields.
 */
export interface TemplateEditableField extends TemplateFieldContract {
  key: string
  defaultValue: string
}

export interface TemplateBinding {
  id: string
  fieldKey: string
  elementId: string
  targetProperty: 'text'
}

export interface TemplateOscCommand {
  address: string
  args?: unknown[]
}

export interface TemplateOscTarget {
  host: string
  port: number
}

export interface TemplateOscCommands {
  play?: TemplateOscCommand
  stop?: TemplateOscCommand
  resume?: TemplateOscCommand
}

export interface TemplateOscConfig {
  enabled: boolean
  target: TemplateOscTarget
  commands: TemplateOscCommands
}

export type TemplateOnAirMode = 'manual' | 'timed'

export interface TemplateOnAirConfig {
  mode: TemplateOnAirMode
  durationSeconds?: number
  autoHide: boolean
  prerollMs: number
  postrollMs: number
}

export interface TemplatePreviewBackgroundColorContract {
  type: 'color'
  value: string
}

export interface TemplatePreviewBackgroundImageContract {
  type: 'image'
  assetId: string
  opacity?: number
  fitMode?: 'contain' | 'cover'
}

/**
 * @deprecated Legacy preview background variant kept only for temporary compatibility.
 */
export interface TemplatePreviewBackgroundAsset {
  type: 'asset'
  assetId?: string
}

export type TemplatePreviewBackgroundContract =
  | TemplatePreviewBackgroundColorContract
  | TemplatePreviewBackgroundImageContract

export type TemplatePreviewBackground =
  | TemplatePreviewBackgroundContract
  | TemplatePreviewBackgroundAsset

export type TemplatePreviewSampleDataContract = Record<string, string> | Record<string, unknown>

export interface TemplatePreviewContract {
  sampleData: TemplatePreviewSampleDataContract
  background: TemplatePreviewBackground
  showSafeArea: boolean
  showLayerBounds: boolean
}

export type TemplatePreviewConfig = TemplatePreviewContract

export interface TemplateMetadataContract {
  [key: string]: unknown
  createdAt: string
  updatedAt: string
  duplicatedFromTemplateId?: string | null
  tags: string[]
  /**
   * @deprecated Legacy metadata fields kept for the transition period.
   */
  author?: string
  /**
   * @deprecated Legacy metadata fields kept for the transition period.
   */
  description?: string
  /**
   * @deprecated Legacy metadata fields kept for the transition period.
   */
  referenceFrameAssetId?: string
  /**
   * @deprecated Legacy metadata fields kept for the transition period.
   */
  previewBackgroundAssetId?: string
}

export type TemplateMetadata = TemplateMetadataContract

export interface TemplateContractRoot {
  [key: string]: unknown
  schemaVersion: string
  id: string
  name: string
  description?: string
  canvas: TemplateCanvasContract
  output: TemplateOutputContract
  fields: TemplateFieldContract[]
  assets: TemplateAssetContract[]
  layers: TemplateLayerContract[]
  preview: TemplatePreviewContract
  metadata: TemplateMetadataContract
}

/**
 * @deprecated Legacy root fields retained only as a temporary type-compatibility layer.
 */
export interface TemplateLegacyContract {
  type: TemplateType
  category?: string
  elements: TemplateElement[]
  editableFields: TemplateEditableField[]
  bindings: TemplateBinding[]
  previewData: Record<string, unknown>
  fallbackValues: Record<string, unknown>
  osc: TemplateOscConfig
  onAir: TemplateOnAirConfig
}

export interface TemplateContract extends TemplateContractRoot, TemplateLegacyContract {}

interface CreateEmptyTemplateInput {
  name?: string
  description?: string
}

interface CreateLayerInput {
  name?: string
  type?: TemplateLayerType
  zIndex?: number
  box?: LayerBoxContract
  visible?: boolean
  locked?: boolean
  opacity?: number
}

interface CreateTextLayerInput extends CreateLayerInput {
  fieldId?: string
  fallbackText?: string
  style?: Partial<TemplateTextLayerStyleContract>
  behavior?: Partial<TemplateTextLayerBehaviorContract>
  rotation?: number
}

interface CreateImageLayerInput extends CreateLayerInput {
  assetId?: string
  fallbackPath?: string
  style?: Partial<TemplateImageLayerStyleContract>
}

interface CreateShapeLayerInput extends CreateLayerInput {
  shape?: TemplateShapeLayerContract['shape']
  style?: Partial<TemplateShapeLayerStyleContract>
}

interface CreateBackgroundLayerInput extends CreateLayerInput {
  style?: Partial<TemplateBackgroundLayerStyleContract>
}

interface CreateGroupLayerInput extends CreateLayerInput {
  children?: string[]
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

function createFieldId() {
  return `field-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const legacyTemplateDefaults: TemplateLegacyContract = {
  type: 'graphic',
  category: undefined,
  elements: [],
  editableFields: [],
  bindings: [],
  previewData: {},
  fallbackValues: {},
  osc: {
    enabled: false,
    target: {
      host: '127.0.0.1',
      port: 9000,
    },
    commands: {},
  },
  onAir: {
    mode: 'manual',
    durationSeconds: undefined,
    autoHide: false,
    prerollMs: 0,
    postrollMs: 0,
  },
}

function withLegacyCompatibility(template: TemplateContractRoot): TemplateContract {
  return new Proxy(template as TemplateContract, {
    get(target, property, receiver) {
      if (typeof property === 'string' && property in legacyTemplateDefaults) {
        return Reflect.get(target, property, receiver) ?? legacyTemplateDefaults[property as keyof TemplateLegacyContract]
      }

      return Reflect.get(target, property, receiver)
    },
    has(target, property) {
      if (typeof property === 'string' && property in legacyTemplateDefaults) {
        return false
      }

      return Reflect.has(target, property)
    },
    ownKeys(target) {
      return Reflect.ownKeys(target)
    },
    getOwnPropertyDescriptor(target, property) {
      if (typeof property === 'string' && property in legacyTemplateDefaults) {
        return undefined
      }

      return Reflect.getOwnPropertyDescriptor(target, property)
    },
  })
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

export function createLayer(input: CreateLayerInput = {}): TemplateLayerContract {
  return {
    id: createLayerId(),
    name: input.name ?? 'Layer',
    type: input.type ?? 'text',
    visible: input.visible ?? true,
    visibility: {
      mode: 'always',
      fieldId: undefined,
    },
    locked: input.locked ?? false,
    zIndex: input.zIndex ?? 0,
    box: input.box ?? {
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
    },
    opacity: input.opacity ?? 1,
  }
}

export function createTextLayer(input: CreateTextLayerInput = {}): TemplateTextLayerContract {
  return {
    ...createLayer({
      ...input,
      name: input.name ?? 'Text',
      type: 'text',
      box: input.box ?? {
        x: 0,
        y: 0,
        width: 600,
        height: 80,
      },
    }),
    type: 'text',
    fieldId: input.fieldId,
    fallbackText: input.fallbackText ?? '',
    style: {
      fontFamily: 'IBM Plex Sans',
      fontSize: 48,
      color: '#FFFFFF',
      textAlign: 'left',
      ...input.style,
    },
    behavior: {
      fitInBox: true,
      fitMode: 'scaleX',
      minScaleX: 0.65,
      whiteSpace: 'nowrap',
      ...input.behavior,
    },
    rotation: input.rotation,
  }
}

export function createImageLayer(input: CreateImageLayerInput = {}): TemplateImageLayerContract {
  return {
    ...createLayer({
      ...input,
      name: input.name ?? 'Image',
      type: 'image',
      box: input.box ?? {
        x: 0,
        y: 0,
        width: 400,
        height: 300,
      },
    }),
    type: 'image',
    assetId: input.assetId,
    fallbackPath: input.fallbackPath,
    style: {
      objectFit: 'contain',
      objectPosition: 'center',
      ...input.style,
    },
  }
}

export function createShapeLayer(input: CreateShapeLayerInput = {}): TemplateShapeLayerContract {
  return {
    ...createLayer({
      ...input,
      name: input.name ?? 'Shape',
      type: 'shape',
      box: input.box ?? {
        x: 0,
        y: 0,
        width: 400,
        height: 120,
      },
    }),
    type: 'shape',
    shape: input.shape ?? 'rectangle',
    style: {
      fill: '#1F2937',
      stroke: 'transparent',
      strokeWidth: 0,
      borderRadius: 0,
      ...input.style,
    },
  }
}

export function createBackgroundLayer(
  input: CreateBackgroundLayerInput = {},
): TemplateBackgroundLayerContract {
  return {
    ...createLayer({
      ...input,
      name: input.name ?? 'Background',
      type: 'background',
      box: input.box ?? {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
      },
    }),
    type: 'background',
    style: {
      fill: '#111827',
      ...input.style,
    },
  }
}

export function createGroupLayer(input: CreateGroupLayerInput = {}): TemplateGroupLayerContract {
  return {
    ...createLayer({
      ...input,
      name: input.name ?? 'Group',
      type: 'group',
    }),
    type: 'group',
    children: input.children ?? [],
  }
}

export function createField(input: {
  id?: string
  label: string
  required?: boolean
  defaultValue?: string
  placeholder?: string
  description?: string
}): TemplateFieldContract {
  return {
    id: input.id ?? createFieldId(),
    label: input.label,
    type: 'text',
    required: input.required ?? false,
    defaultValue: input.defaultValue,
    placeholder: input.placeholder,
    description: input.description,
  }
}

export function createEmptyTemplate(input: CreateEmptyTemplateInput = {}): TemplateContract {
  const now = new Date().toISOString()

  return withLegacyCompatibility({
    schemaVersion: '1.0.0',
    id: createTemplateId(),
    name: input.name ?? 'New Template',
    description: input.description ?? '',
    canvas: {
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      safeArea: {
        enabled: true,
        marginX: 80,
        marginY: 60,
      },
    },
    output: {
      liveboard: {
        templateName: '',
      },
    },
    fields: [],
    assets: [],
    layers: [],
    preview: {
      sampleData: {},
      background: {
        type: 'color',
        value: '#111827',
      },
      showSafeArea: true,
      showLayerBounds: false,
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      duplicatedFromTemplateId: null,
      tags: [],
    },
  })
}

export function updateTemplateMetadata(
  template: TemplateContract,
  patch: Partial<TemplateMetadataContract>,
): TemplateContract {
  return {
    ...template,
    metadata: {
      ...template.metadata,
      ...patch,
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
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: 0,
      verticalAlign: 'middle',
      textTransform: 'none',
      maxLines: 1,
    },
    behavior: {
      fitInBox: true,
      fitMode: 'scaleX',
      minScaleX: 0.5,
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
    objectPosition: 'center center',
    borderRadius: 0,
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
    stroke: undefined,
    strokeWidth: 0,
    borderRadius: 0,
  }
}
