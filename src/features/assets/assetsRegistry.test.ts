import { describe, expect, it } from 'vitest'
import {
  createEmptyTemplate,
  createImageElement,
  createLayer,
  type TemplateContract,
} from '@/shared/template-contract/templateContract'
import {
  addAsset,
  createAsset,
  getAssetById,
  getImageElementAsset,
  listImageAssets,
  removeAsset,
  updateAsset,
} from './assetsRegistry'

function createTemplateFixture() {
  return createEmptyTemplate({
    name: 'Assets Template',
  })
}

function createImageTemplateFixture() {
  const template = createTemplateFixture()
  const layer = createLayer({
    name: 'Images',
    zIndex: 0,
  })
  const imageElement = createImageElement({
    layerId: layer.id,
    name: 'Logo',
    position: { x: 64, y: 64 },
    size: { width: 320, height: 180 },
  })

  return {
    template: {
      ...template,
      layers: [layer],
      elements: [imageElement],
    },
    imageElement,
  }
}

describe('assetsRegistry', () => {
  it('createAsset creates an image asset with the expected fields', () => {
    const asset = createAsset({
      name: 'Logo',
      type: 'image',
      source: {
        type: 'local',
        value: 'assets/logo.png',
      },
      metadata: {
        width: 512,
        height: 512,
      },
    })

    expect(asset.id).toBeTruthy()
    expect(asset.name).toBe('Logo')
    expect(asset.type).toBe('image')
    expect(asset.source).toEqual({
      type: 'local',
      value: 'assets/logo.png',
    })
    expect(asset.metadata).toEqual({
      width: 512,
      height: 512,
    })
  })

  it('addAsset adds an asset immutably and ignores duplicate ids', () => {
    const template = createTemplateFixture()
    const asset = createAsset({
      name: 'Logo',
      type: 'image',
      source: {
        type: 'local',
        value: 'assets/logo.png',
      },
    })

    const nextTemplate = addAsset(template, asset)
    const duplicateTemplate = addAsset(nextTemplate, {
      ...asset,
      name: 'Logo duplicate',
    })

    expect(nextTemplate.assets).toHaveLength(1)
    expect(nextTemplate.assets[0]).toEqual(asset)
    expect(template.assets).toEqual([])
    expect(duplicateTemplate).toEqual(nextTemplate)
  })

  it('updateAsset updates an existing asset, preserves id, and ignores missing ids', () => {
    const asset = createAsset({
      name: 'Logo',
      type: 'image',
      source: {
        type: 'local',
        value: 'assets/logo.png',
      },
    })
    const template = addAsset(createTemplateFixture(), asset)

    const updatedTemplate = updateAsset(template, asset.id, {
      id: 'asset-overridden',
      name: 'Bug Logo',
      source: {
        type: 'local',
        value: 'assets/bug-logo.png',
      },
    })
    const unchangedTemplate = updateAsset(template, 'missing-asset', {
      name: 'Ignored',
    })

    expect(updatedTemplate.assets).toHaveLength(1)
    expect(updatedTemplate.assets[0]).toMatchObject({
      id: asset.id,
      name: 'Bug Logo',
      source: {
        type: 'local',
        value: 'assets/bug-logo.png',
      },
    })
    expect(template.assets[0]).toEqual(asset)
    expect(unchangedTemplate).toBe(template)
  })

  it('removeAsset removes an asset immutably and ignores missing ids', () => {
    const asset = createAsset({
      name: 'Logo',
      type: 'image',
      source: {
        type: 'local',
        value: 'assets/logo.png',
      },
    })
    const template = addAsset(createTemplateFixture(), asset)

    const nextTemplate = removeAsset(template, asset.id)
    const unchangedTemplate = removeAsset(template, 'missing-asset')

    expect(nextTemplate.assets).toEqual([])
    expect(template.assets).toHaveLength(1)
    expect(unchangedTemplate).toBe(template)
  })

  it('getAssetById returns the asset when it exists and undefined otherwise', () => {
    const asset = createAsset({
      name: 'Logo',
      type: 'image',
      source: {
        type: 'local',
        value: 'assets/logo.png',
      },
    })
    const template = addAsset(createTemplateFixture(), asset)

    expect(getAssetById(template, asset.id)).toEqual(asset)
    expect(getAssetById(template, 'missing-asset')).toBeUndefined()
  })

  it('listImageAssets returns only assets with type image', () => {
    const imageAsset = createAsset({
      name: 'Logo',
      type: 'image',
      source: {
        type: 'local',
        value: 'assets/logo.png',
      },
    })
    const nonImageAsset = {
      id: 'asset-video',
      name: 'Clip',
      type: 'video',
      source: {
        type: 'local',
        value: 'assets/clip.mp4',
      },
    } as never
    const template = {
      ...createTemplateFixture(),
      assets: [imageAsset, nonImageAsset],
    } as TemplateContract

    expect(listImageAssets(template)).toEqual([imageAsset])
  })

  it('getImageElementAsset returns the linked asset for an image element', () => {
    const asset = createAsset({
      name: 'Logo',
      type: 'image',
      source: {
        type: 'local',
        value: 'assets/logo.png',
      },
    })
    const { template, imageElement } = createImageTemplateFixture()
    const linkedTemplate = {
      ...addAsset(template, asset),
      elements: [
        {
          ...imageElement,
          assetId: asset.id,
        },
      ],
    }

    expect(getImageElementAsset(linkedTemplate, linkedTemplate.elements[0])).toEqual(asset)
  })

  it('getImageElementAsset returns undefined when the image asset is missing', () => {
    const { template, imageElement } = createImageTemplateFixture()
    const linkedTemplate = {
      ...template,
      elements: [
        {
          ...imageElement,
          assetId: 'missing-asset',
        },
      ],
    }

    expect(getImageElementAsset(linkedTemplate, linkedTemplate.elements[0])).toBeUndefined()
  })
})
