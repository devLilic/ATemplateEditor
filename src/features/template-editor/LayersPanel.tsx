import { useState, type DragEvent } from 'react'
import type { TemplateContract, TemplateLayer } from '@/shared/template-contract/templateContract'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { reorderLayersFromTopList } from './layersPanelState'

export interface LayersPanelProps {
  template: TemplateContract
  selectedLayerId?: string
  onSelectLayer: (layerId: string) => void
  onTemplateChange: (template: TemplateContract) => void
}

function sortLayersTopToBottom(layers: TemplateLayer[]) {
  return [...layers].sort((left, right) => right.zIndex - left.zIndex)
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

export function LayersPanel({
  template,
  selectedLayerId,
  onSelectLayer,
  onTemplateChange,
}: LayersPanelProps) {
  const [draggedLayerId, setDraggedLayerId] = useState<string>()
  const orderedLayers = sortLayersTopToBottom(template.layers)

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
      {orderedLayers.map((layer) => {
        const isSelected = layer.id === selectedLayerId

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
          </div>
        )
      })}
    </div>
  )
}

export default LayersPanel
