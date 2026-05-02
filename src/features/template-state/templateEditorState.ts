import {
  createLayer,
  type TemplateContract,
  type TemplateElement,
  type TemplateLayer,
} from '@/shared/template-contract/templateContract'

export interface TemplateEditorState {
  template: TemplateContract
  selectedLayerId?: string
  selectedElementId?: string
}

function findLayer(template: TemplateContract, layerId: string) {
  return template.layers.find((layer) => layer.id === layerId)
}

function findElement(template: TemplateContract, elementId: string) {
  return template.elements.find((element) => element.id === elementId)
}

function hasExactIds(items: Array<{ id: string }>, orderedIds: string[]) {
  if (items.length !== orderedIds.length) {
    return false
  }

  const itemIds = new Set(items.map((item) => item.id))

  if (itemIds.size !== orderedIds.length) {
    return false
  }

  return orderedIds.every((id) => itemIds.has(id))
}

function createNotImplementedError(helperName: string) {
  return new Error(`${helperName} is not implemented yet.`)
}

export function createTemplateEditorState(template: TemplateContract): TemplateEditorState {
  const firstElement = template.elements[0]
  const firstLayer = template.layers[0]

  return {
    template,
    selectedLayerId: firstElement?.layerId ?? firstLayer?.id,
    selectedElementId: firstElement?.id,
  }
}

export function selectLayer(state: TemplateEditorState, layerId: string): TemplateEditorState {
  const layer = findLayer(state.template, layerId)

  if (!layer) {
    return state
  }

  const selectedElement = state.selectedElementId
    ? findElement(state.template, state.selectedElementId)
    : undefined
  const selectedElementId =
    selectedElement && selectedElement.layerId === layer.id
      ? selectedElement.id
      : undefined

  return {
    ...state,
    selectedLayerId: layer.id,
    selectedElementId,
  }
}

export function selectElement(state: TemplateEditorState, elementId: string): TemplateEditorState {
  const element = findElement(state.template, elementId)

  if (!element) {
    return state
  }

  return {
    ...state,
    selectedLayerId: element.layerId,
    selectedElementId: element.id,
  }
}

export function addLayer(
  state: TemplateEditorState,
  input: Partial<TemplateLayer>,
): TemplateEditorState {
  const layer = createLayer(input)

  return {
    template: {
      ...state.template,
      layers: [...state.template.layers, layer],
    },
    selectedLayerId: layer.id,
    selectedElementId: undefined,
  }
}

export function updateLayer(
  state: TemplateEditorState,
  layerId: string,
  patch: Partial<TemplateLayer>,
): TemplateEditorState {
  const layer = findLayer(state.template, layerId)

  if (!layer) {
    return state
  }

  return {
    ...state,
    template: {
      ...state.template,
      layers: state.template.layers.map((currentLayer) =>
        currentLayer.id === layerId
          ? {
              ...currentLayer,
              ...patch,
              id: currentLayer.id,
            }
          : currentLayer,
      ),
    },
  }
}

export function removeLayer(
  state: TemplateEditorState,
  layerId: string,
): TemplateEditorState {
  const layer = findLayer(state.template, layerId)

  if (!layer) {
    return state
  }

  const layers = state.template.layers.filter((currentLayer) => currentLayer.id !== layerId)
  const elements = state.template.elements.filter((element) => element.layerId !== layerId)
  const selectedElementStillExists =
    state.selectedElementId !== undefined &&
    elements.some((element) => element.id === state.selectedElementId)

  return {
    template: {
      ...state.template,
      layers,
      elements,
    },
    selectedLayerId:
      state.selectedLayerId === layerId ? layers[0]?.id : state.selectedLayerId,
    selectedElementId: selectedElementStillExists ? state.selectedElementId : undefined,
  }
}

export function addElement(
  state: TemplateEditorState,
  element: TemplateElement,
): TemplateEditorState {
  if (!findLayer(state.template, element.layerId)) {
    return state
  }

  return {
    template: {
      ...state.template,
      elements: [...state.template.elements, element],
    },
    selectedLayerId: element.layerId,
    selectedElementId: element.id,
  }
}

export function updateElement(
  state: TemplateEditorState,
  elementId: string,
  patch: Partial<TemplateElement>,
): TemplateEditorState {
  const element = findElement(state.template, elementId)

  if (!element) {
    return state
  }

  const nextLayerId =
    patch.layerId !== undefined && findLayer(state.template, patch.layerId)
      ? patch.layerId
      : element.layerId
  const updatedElement = {
    ...element,
    ...patch,
    id: element.id,
    kind: element.kind,
    layerId: nextLayerId,
  } as TemplateElement

  return {
    ...state,
    template: {
      ...state.template,
      elements: state.template.elements.map((currentElement) =>
        currentElement.id === elementId ? updatedElement : currentElement,
      ),
    },
    selectedLayerId:
      state.selectedElementId === elementId ? updatedElement.layerId : state.selectedLayerId,
  }
}

export function removeElement(
  state: TemplateEditorState,
  elementId: string,
): TemplateEditorState {
  const element = findElement(state.template, elementId)

  if (!element) {
    return state
  }

  return {
    ...state,
    template: {
      ...state.template,
      elements: state.template.elements.filter((currentElement) => currentElement.id !== elementId),
    },
    selectedElementId:
      state.selectedElementId === elementId ? undefined : state.selectedElementId,
  }
}

export function reorderLayers(
  state: TemplateEditorState,
  orderedLayerIds: string[],
): TemplateEditorState {
  if (!hasExactIds(state.template.layers, orderedLayerIds)) {
    return state
  }

  const layerMap = new Map(state.template.layers.map((layer) => [layer.id, layer]))
  const layers = orderedLayerIds.map((layerId, index) => ({
    ...layerMap.get(layerId)!,
    zIndex: index,
  }))

  return {
    ...state,
    template: {
      ...state.template,
      layers,
    },
  }
}

export function reorderElements(
  state: TemplateEditorState,
  orderedElementIds: string[],
): TemplateEditorState {
  if (!hasExactIds(state.template.elements, orderedElementIds)) {
    return state
  }

  const elementMap = new Map(state.template.elements.map((element) => [element.id, element]))
  const elements = orderedElementIds.map((elementId) => elementMap.get(elementId)!)

  return {
    ...state,
    template: {
      ...state.template,
      elements,
    },
  }
}
