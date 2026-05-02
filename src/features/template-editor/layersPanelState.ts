import type { TemplateContract } from '@/shared/template-contract/templateContract'

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

export function reorderLayersFromTopList(
  template: TemplateContract,
  orderedLayerIds: string[],
): TemplateContract {
  if (!hasExactIds(template.layers, orderedLayerIds)) {
    return template
  }

  const layerMap = new Map(template.layers.map((layer) => [layer.id, layer]))
  const highestZIndex = orderedLayerIds.length - 1
  const layers = orderedLayerIds.map((layerId, index) => ({
    ...layerMap.get(layerId)!,
    zIndex: highestZIndex - index,
  }))

  return {
    ...template,
    layers,
  }
}
