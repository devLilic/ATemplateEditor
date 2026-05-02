import { describe, expect, it } from 'vitest'
import { createDefaultTemplate } from '@/shared/template-contract/templateDefaults'
import {
  createEmptyTemplate,
  createImageElement,
  createLayer,
  createShapeElement,
  createTextElement,
} from '@/shared/template-contract/templateContract'
import {
  addElement,
  addLayer,
  createTemplateEditorState,
  removeElement,
  removeLayer,
  reorderElements,
  reorderLayers,
  selectElement,
  selectLayer,
  updateElement,
  updateLayer,
} from './templateEditorState'

function createTemplateWithTwoLayersAndElements() {
  const template = createEmptyTemplate({ name: 'Editor Template' })
  const layerA = createLayer({ name: 'Layer A', zIndex: 0 })
  const layerB = createLayer({ name: 'Layer B', zIndex: 1 })
  const elementA = createTextElement({
    layerId: layerA.id,
    name: 'Title',
  })
  const elementB = createShapeElement({
    layerId: layerB.id,
    name: 'Box',
  })

  return {
    template: {
      ...template,
      layers: [layerA, layerB],
      elements: [elementA, elementB],
    },
    layerA,
    layerB,
    elementA,
    elementB,
  }
}

describe('template editor state', () => {
  describe('createTemplateEditorState', () => {
    it('returns undefined selections when the template has no layers or elements', () => {
      const template = createEmptyTemplate()

      const state = createTemplateEditorState(template)

      expect(state.template).toBe(template)
      expect(state.selectedLayerId).toBeUndefined()
      expect(state.selectedElementId).toBeUndefined()
    })

    it('selects the first layer and first element when they exist', () => {
      const template = createDefaultTemplate()

      const state = createTemplateEditorState(template)

      expect(state.template).toBe(template)
      expect(state.selectedLayerId).toBe(template.layers[0].id)
      expect(state.selectedElementId).toBe(template.elements[0].id)
    })
  })

  describe('selectLayer', () => {
    it('returns a new state and selects an existing layer', () => {
      const { template, layerA, layerB } = createTemplateWithTwoLayersAndElements()
      const state = createTemplateEditorState(template)

      const nextState = selectLayer(state, layerB.id)

      expect(nextState).not.toBe(state)
      expect(nextState.selectedLayerId).toBe(layerB.id)
      expect(state.selectedLayerId).toBe(layerA.id)
    })

    it('clears selectedElementId when the selected element does not belong to the chosen layer', () => {
      const { template, layerB, elementA } = createTemplateWithTwoLayersAndElements()
      const state = createTemplateEditorState(template)

      expect(state.selectedElementId).toBe(elementA.id)

      const nextState = selectLayer(state, layerB.id)

      expect(nextState.selectedLayerId).toBe(layerB.id)
      expect(nextState.selectedElementId).toBeUndefined()
    })

    it('ignores an inexistent layer id', () => {
      const { template, layerA, elementA } = createTemplateWithTwoLayersAndElements()
      const state = createTemplateEditorState(template)

      const nextState = selectLayer(state, 'layer-missing')

      expect(nextState.selectedLayerId).toBe(layerA.id)
      expect(nextState.selectedElementId).toBe(elementA.id)
      expect(nextState.template).toBe(state.template)
    })
  })

  describe('selectElement', () => {
    it('returns a new state, selects the element, and syncs the layer selection', () => {
      const { template, layerB, elementB } = createTemplateWithTwoLayersAndElements()
      const state = createTemplateEditorState(template)

      const nextState = selectElement(state, elementB.id)

      expect(nextState).not.toBe(state)
      expect(nextState.selectedElementId).toBe(elementB.id)
      expect(nextState.selectedLayerId).toBe(layerB.id)
    })

    it('ignores an inexistent element id', () => {
      const { template, layerA, elementA } = createTemplateWithTwoLayersAndElements()
      const state = createTemplateEditorState(template)

      const nextState = selectElement(state, 'element-missing')

      expect(nextState.selectedLayerId).toBe(layerA.id)
      expect(nextState.selectedElementId).toBe(elementA.id)
      expect(nextState.template).toBe(state.template)
    })
  })

  describe('addLayer', () => {
    it('adds a new layer, selects it, and does not mutate the original template', () => {
      const template = createDefaultTemplate()
      const state = createTemplateEditorState(template)

      const nextState = addLayer(state, {
        name: 'Overlay Layer',
      })

      expect(nextState).not.toBe(state)
      expect(nextState.template).not.toBe(state.template)
      expect(nextState.template.layers).toHaveLength(template.layers.length + 1)
      expect(nextState.selectedLayerId).toBe(nextState.template.layers.at(-1)?.id)
      expect(nextState.template.layers.at(-1)).toMatchObject({
        name: 'Overlay Layer',
      })
      expect(state.template.layers).toHaveLength(template.layers.length)
    })
  })

  describe('updateLayer', () => {
    it('updates an existing layer, preserves its id, and does not mutate the original template', () => {
      const { template, layerA } = createTemplateWithTwoLayersAndElements()
      const state = createTemplateEditorState(template)

      const nextState = updateLayer(state, layerA.id, {
        id: 'layer-overwrite-attempt',
        name: 'Layer A Updated',
        visible: false,
      })

      const updatedLayer = nextState.template.layers.find((layer) => layer.id === layerA.id)

      expect(updatedLayer).toMatchObject({
        id: layerA.id,
        name: 'Layer A Updated',
        visible: false,
      })
      expect(state.template.layers[0]).toMatchObject({
        id: layerA.id,
        name: 'Layer A',
        visible: true,
      })
    })

    it('ignores an inexistent layer id', () => {
      const { template } = createTemplateWithTwoLayersAndElements()
      const state = createTemplateEditorState(template)

      const nextState = updateLayer(state, 'layer-missing', {
        name: 'Should Not Apply',
      })

      expect(nextState.template.layers).toEqual(state.template.layers)
      expect(nextState.selectedLayerId).toBe(state.selectedLayerId)
      expect(nextState.selectedElementId).toBe(state.selectedElementId)
    })
  })

  describe('removeLayer', () => {
    it('removes the layer and its elements and clears affected selections', () => {
      const { template, layerA, elementA } = createTemplateWithTwoLayersAndElements()
      const state = createTemplateEditorState(template)

      expect(state.selectedLayerId).toBe(layerA.id)
      expect(state.selectedElementId).toBe(elementA.id)

      const nextState = removeLayer(state, layerA.id)

      expect(nextState.template.layers.find((layer) => layer.id === layerA.id)).toBeUndefined()
      expect(nextState.template.elements.find((element) => element.id === elementA.id)).toBeUndefined()
      expect(nextState.selectedLayerId).not.toBe(layerA.id)
      expect(nextState.selectedElementId).toBeUndefined()
    })

    it('ignores an inexistent layer id', () => {
      const { template } = createTemplateWithTwoLayersAndElements()
      const state = createTemplateEditorState(template)

      const nextState = removeLayer(state, 'layer-missing')

      expect(nextState.template.layers).toEqual(state.template.layers)
      expect(nextState.template.elements).toEqual(state.template.elements)
      expect(nextState.selectedLayerId).toBe(state.selectedLayerId)
      expect(nextState.selectedElementId).toBe(state.selectedElementId)
    })
  })

  describe('addElement', () => {
    it('adds an element to an existing layer, selects it, and does not mutate the original template', () => {
      const { template, layerB } = createTemplateWithTwoLayersAndElements()
      const state = createTemplateEditorState(template)
      const element = createImageElement({
        layerId: layerB.id,
        name: 'Logo',
      })

      const nextState = addElement(state, element)

      expect(nextState).not.toBe(state)
      expect(nextState.template.elements).toHaveLength(state.template.elements.length + 1)
      expect(nextState.template.elements.at(-1)).toEqual(element)
      expect(nextState.selectedElementId).toBe(element.id)
      expect(nextState.selectedLayerId).toBe(layerB.id)
      expect(state.template.elements).toHaveLength(template.elements.length)
    })

    it('ignores an element when its layer does not exist', () => {
      const template = createDefaultTemplate()
      const state = createTemplateEditorState(template)
      const orphanElement = createTextElement({
        layerId: 'layer-missing',
        name: 'Orphan',
      })

      const nextState = addElement(state, orphanElement)

      expect(nextState.template.elements).toEqual(state.template.elements)
      expect(nextState.selectedLayerId).toBe(state.selectedLayerId)
      expect(nextState.selectedElementId).toBe(state.selectedElementId)
    })
  })

  describe('updateElement', () => {
    it('updates an existing element, preserves id and kind, and does not mutate the original template', () => {
      const { template, elementA } = createTemplateWithTwoLayersAndElements()
      const state = createTemplateEditorState(template)

      const nextState = updateElement(state, elementA.id, {
        id: 'element-overwrite-attempt',
        kind: 'shape',
        name: 'Title Updated',
        position: { x: 120, y: 40 },
      })

      const updatedElement = nextState.template.elements.find((element) => element.id === elementA.id)

      expect(updatedElement).toMatchObject({
        id: elementA.id,
        kind: 'text',
        name: 'Title Updated',
        position: { x: 120, y: 40 },
      })
      expect(state.template.elements[0]).toMatchObject({
        id: elementA.id,
        kind: 'text',
        name: 'Title',
      })
    })

    it('ignores an inexistent element id', () => {
      const { template } = createTemplateWithTwoLayersAndElements()
      const state = createTemplateEditorState(template)

      const nextState = updateElement(state, 'element-missing', {
        name: 'Should Not Apply',
      })

      expect(nextState.template.elements).toEqual(state.template.elements)
      expect(nextState.selectedElementId).toBe(state.selectedElementId)
      expect(nextState.selectedLayerId).toBe(state.selectedLayerId)
    })
  })

  describe('removeElement', () => {
    it('removes the element, clears selectedElementId, and keeps selectedLayerId when the layer still exists', () => {
      const { template, layerA, elementA } = createTemplateWithTwoLayersAndElements()
      const state = createTemplateEditorState(template)

      const nextState = removeElement(state, elementA.id)

      expect(nextState.template.elements.find((element) => element.id === elementA.id)).toBeUndefined()
      expect(nextState.selectedElementId).toBeUndefined()
      expect(nextState.selectedLayerId).toBe(layerA.id)
    })

    it('ignores an inexistent element id', () => {
      const { template } = createTemplateWithTwoLayersAndElements()
      const state = createTemplateEditorState(template)

      const nextState = removeElement(state, 'element-missing')

      expect(nextState.template.elements).toEqual(state.template.elements)
      expect(nextState.selectedElementId).toBe(state.selectedElementId)
      expect(nextState.selectedLayerId).toBe(state.selectedLayerId)
    })
  })

  describe('reorderLayers', () => {
    it('reorders layers and rewrites zIndex to match the new order', () => {
      const { template, layerA, layerB } = createTemplateWithTwoLayersAndElements()
      const state = createTemplateEditorState(template)

      const nextState = reorderLayers(state, [layerB.id, layerA.id])

      expect(nextState.template.layers.map((layer) => layer.id)).toEqual([layerB.id, layerA.id])
      expect(nextState.template.layers.map((layer) => layer.zIndex)).toEqual([0, 1])
    })

    it('ignores reorder when the id list does not contain exactly the same layer ids', () => {
      const { template, layerA } = createTemplateWithTwoLayersAndElements()
      const state = createTemplateEditorState(template)

      const nextState = reorderLayers(state, [layerA.id])

      expect(nextState.template.layers).toEqual(state.template.layers)
    })
  })

  describe('reorderElements', () => {
    it('reorders elements using the provided id order', () => {
      const { template, elementA, elementB } = createTemplateWithTwoLayersAndElements()
      const state = createTemplateEditorState(template)

      const nextState = reorderElements(state, [elementB.id, elementA.id])

      expect(nextState.template.elements.map((element) => element.id)).toEqual([elementB.id, elementA.id])
    })

    it('ignores reorder when the id list does not contain exactly the same element ids', () => {
      const { template, elementA } = createTemplateWithTwoLayersAndElements()
      const state = createTemplateEditorState(template)

      const nextState = reorderElements(state, [elementA.id])

      expect(nextState.template.elements).toEqual(state.template.elements)
    })
  })
})
