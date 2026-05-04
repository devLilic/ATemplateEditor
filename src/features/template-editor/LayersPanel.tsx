import { useState, type DragEvent } from 'react'
import {
  createBackgroundLayer,
  createGroupLayer,
  createImageLayer,
  createShapeLayer,
  createTextLayer,
  type TemplateContract,
  type TemplateLayer,
} from '@/shared/template-contract/templateContract'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { createTemplateEditorState, removeLayer } from '@/features/template-state'
import { FormSelect } from './TemplateEditorFormPrimitives'
import { reorderLayersFromTopList } from './layersPanelState'

export interface LayersPanelProps {
  template: TemplateContract
  selectedLayerId?: string
  onSelectLayer: (layerId: string) => void
  onTemplateChange: (template: TemplateContract) => void
  onDeleteLayer?: (layerId: string) => void
  onDuplicateLayer?: (layerId: string) => void
}

function sortLayersTopToBottom(layers: TemplateLayer[]) {
  return [...layers].sort((left, right) => right.zIndex - left.zIndex)
}

function getNextLayerZIndex(template: TemplateContract) {
  if (template.layers.length === 0) {
    return 0
  }

  return Math.max(...template.layers.map((layer) => layer.zIndex)) + 1
}

function getLayerTypeBadgeVariant(layerType: TemplateLayer['type']) {
  if (layerType === 'background') {
    return 'muted'
  }

  if (layerType === 'image') {
    return 'active'
  }

  if (layerType === 'group') {
    return 'neutral'
  }

  return 'selected'
}

function updateLayer(
  template: TemplateContract,
  layerId: string,
  patch: Partial<TemplateLayer>,
): TemplateContract {
  return {
    ...template,
    layers: template.layers.map((layer) =>
      layer.id === layerId
        ? {
            ...layer,
            ...patch,
            id: layer.id,
          }
        : layer,
    ),
  }
}

function addLayer(template: TemplateContract, layer: TemplateLayer): TemplateContract {
  return {
    ...template,
    layers: [...template.layers, layer],
  }
}

export function LayersPanel({
  template,
  selectedLayerId,
  onSelectLayer,
  onTemplateChange,
  onDeleteLayer,
  onDuplicateLayer,
}: LayersPanelProps) {
  const [draggedLayerId, setDraggedLayerId] = useState<string>()
  const orderedLayers = sortLayersTopToBottom(template.layers)
  const nextLayerZIndex = getNextLayerZIndex(template)

  const moveLayer = (targetLayerId: string) => {
    if (!draggedLayerId || draggedLayerId === targetLayerId) {
      return
    }

    const orderedLayerIds = orderedLayers.map((layer) => layer.id)
    const draggedIndex = orderedLayerIds.indexOf(draggedLayerId)
    const targetIndex = orderedLayerIds.indexOf(targetLayerId)

    if (draggedIndex < 0 || targetIndex < 0) {
      return
    }

    const nextOrderedLayerIds = [...orderedLayerIds]
    nextOrderedLayerIds.splice(draggedIndex, 1)
    nextOrderedLayerIds.splice(targetIndex, 0, draggedLayerId)
    onTemplateChange(reorderLayersFromTopList(template, nextOrderedLayerIds))
  }

  const handleDragStart = (event: DragEvent<HTMLDivElement>, layerId: string) => {
    setDraggedLayerId(layerId)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', layerId)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>, targetLayerId: string) => {
    event.preventDefault()
    moveLayer(targetLayerId)
    setDraggedLayerId(undefined)
  }

  return (
    <div className='flex flex-col gap-2' role='listbox' aria-label='Layers'>
      <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
        <Button
          onClick={() => {
            onTemplateChange(
              addLayer(
                template,
                createTextLayer({
                  zIndex: nextLayerZIndex,
                }),
              ),
            )
          }}
          variant='accent'
        >
          Add text layer
        </Button>
        <Button
          onClick={() => {
            onTemplateChange(
              addLayer(
                template,
                createImageLayer({
                  zIndex: nextLayerZIndex,
                }),
              ),
            )
          }}
          variant='neutral'
        >
          Add image layer
        </Button>
        <Button
          onClick={() => {
            onTemplateChange(
              addLayer(
                template,
                createShapeLayer({
                  zIndex: nextLayerZIndex,
                }),
              ),
            )
          }}
          variant='neutral'
        >
          Add shape layer
        </Button>
        <Button
          onClick={() => {
            onTemplateChange(
              addLayer(
                template,
                createBackgroundLayer({
                  zIndex: nextLayerZIndex,
                }),
              ),
            )
          }}
          variant='neutral'
        >
          Add background layer
        </Button>
        <Button
          className='sm:col-span-2'
          onClick={() => {
            onTemplateChange(
              addLayer(
                template,
                createGroupLayer({
                  zIndex: nextLayerZIndex,
                }),
              ),
            )
          }}
          variant='ghost'
        >
          Add group layer
        </Button>
      </div>

      {orderedLayers.map((layer) => {
        const isSelected = layer.id === selectedLayerId
        const canDeleteLayer = template.layers.length > 1

        return (
          <div
            key={layer.id}
            aria-selected={isSelected}
            className='rounded-md border border-ui-border bg-ui-card/35 p-2.5'
            data-selected={isSelected ? 'true' : undefined}
            draggable
            onDragEnd={() => {
              setDraggedLayerId(undefined)
            }}
            onDragOver={(event) => {
              event.preventDefault()
            }}
            onDragStart={(event) => {
              handleDragStart(event, layer.id)
            }}
            onDrop={(event) => {
              handleDrop(event, layer.id)
            }}
          >
            <div className='flex items-start gap-2'>
              <Button
                className='min-w-0 flex-1 justify-start'
                onClick={() => {
                  onSelectLayer(layer.id)
                }}
                variant={isSelected ? 'selected' : 'neutral'}
              >
                <span className='truncate'>{layer.name}</span>
              </Button>
              <Badge variant={getLayerTypeBadgeVariant(layer.type)}>{layer.type}</Badge>
              <Badge variant={isSelected ? 'selected' : 'muted'}>{layer.zIndex}</Badge>
            </div>

            <div className='mt-2 grid grid-cols-2 gap-2'>
              <label className='flex min-h-9 items-center justify-between gap-3 rounded-md border border-ui-border bg-ui-card/20 px-3 py-2'>
                <span className='text-[11px] font-semibold uppercase tracking-normal text-ui-disabled'>
                  Visible
                </span>
                <input
                  aria-label={`Visible ${layer.name}`}
                  checked={layer.visible}
                  className='h-4 w-4 shrink-0 accent-ui-accent'
                  onChange={(event) => {
                    onTemplateChange(updateLayer(template, layer.id, { visible: event.target.checked }))
                  }}
                  type='checkbox'
                />
              </label>

              <label className='flex min-h-9 items-center justify-between gap-3 rounded-md border border-ui-border bg-ui-card/20 px-3 py-2'>
                <span className='text-[11px] font-semibold uppercase tracking-normal text-ui-disabled'>
                  Locked
                </span>
                <input
                  aria-label={`Locked ${layer.name}`}
                  checked={layer.locked}
                  className='h-4 w-4 shrink-0 accent-ui-accent'
                  onChange={(event) => {
                    onTemplateChange(updateLayer(template, layer.id, { locked: event.target.checked }))
                  }}
                  type='checkbox'
                />
              </label>
            </div>

            <div className='mt-2'>
              <FormSelect
                label='visibility rule'
                onChange={(event) => {
                  const mode = event.currentTarget.value as TemplateLayer['visibility']['mode']

                  onTemplateChange(
                    updateLayer(template, layer.id, {
                      visibility: {
                        ...layer.visibility,
                        mode,
                        fieldId: mode === 'always' ? undefined : layer.visibility.fieldId,
                      },
                    }),
                  )
                }}
                value={layer.visibility.mode}
              >
                <option value='always'>always</option>
                <option value='whenFieldHasValue'>whenFieldHasValue</option>
              </FormSelect>
            </div>

            <div className='mt-2 grid grid-cols-2 gap-2'>
              <Button
                aria-label={`Duplicate layer ${layer.name}`}
                className='w-full justify-center'
                onClick={() => {
                  onDuplicateLayer?.(layer.id)
                }}
                variant='neutral'
              >
                Duplicate
              </Button>

              <Button
                aria-label={`Delete layer ${layer.name}`}
                className='w-full justify-center'
                disabled={!canDeleteLayer}
                onClick={() => {
                  if (!canDeleteLayer) {
                    return
                  }

                  if (onDeleteLayer) {
                    onDeleteLayer(layer.id)
                    return
                  }

                  onTemplateChange(removeLayer(createTemplateEditorState(template), layer.id).template)
                }}
                variant='ghost'
              >
                Delete
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default LayersPanel
