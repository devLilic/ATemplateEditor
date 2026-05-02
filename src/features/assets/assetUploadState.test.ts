import { describe, expect, it } from 'vitest'
import { addAsset, getImageElementAsset } from './assetsRegistry'
import {
  createEmptyTemplate,
  createImageElement,
  createLayer,
  type TemplateContract,
} from '@/shared/template-contract/templateContract'

type TemplateWithReferenceFrame = TemplateContract & {
  metadata: TemplateContract['metadata'] & {
    referenceFrameAssetId?: string
  }
  previewSettings?: {
    referenceFrameAssetId?: string
  }
}

async function loadAssetUploadStateModule() {
  return import('./assetUploadState')
}

function createTemplateFixture() {
  const layer = createLayer({
    name: 'Images',
    zIndex: 0,
  })
  const imageElement = createImageElement({
    layerId: layer.id,
    name: 'Logo',
    position: { x: 100, y: 100 },
    size: { width: 320, height: 180 },
  })

  return {
    template: {
      ...createEmptyTemplate({
        name: 'Upload template',
      }),
      layers: [layer],
      elements: [imageElement],
    },
    imageElement,
  }
}

describe('assetUploadState', () => {
  it('createAssetFromFileReference creates an image asset', async () => {
    const { createAssetFromFileReference } = await loadAssetUploadStateModule()
    const asset = createAssetFromFileReference({
      name: 'Reference Frame',
      path: 'C:/graphics/reference-frame.png',
      mimeType: 'image/png',
    })

    expect(asset.id).toBeTruthy()
    expect(asset.name).toBe('Reference Frame')
    expect(asset.type).toBe('image')
    expect(asset.source).toEqual({
      type: 'local',
      value: 'C:/graphics/reference-frame.png',
    })
    expect(asset.metadata).toEqual(
      expect.objectContaining({
        mimeType: 'image/png',
      }),
    )
  })

  it('the created asset can be added into the template', async () => {
    const { createAssetFromFileReference } = await loadAssetUploadStateModule()
    const { template } = createTemplateFixture()
    const asset = createAssetFromFileReference({
      name: 'Reference Frame',
      path: 'C:/graphics/reference-frame.png',
    })
    const nextTemplate = addAsset(template, asset)

    expect(nextTemplate.assets).toContainEqual(asset)
    expect(template.assets).toEqual([])
  })

  it('an image element can receive assetId and resolve the linked asset', async () => {
    const { createAssetFromFileReference } = await loadAssetUploadStateModule()
    const { template, imageElement } = createTemplateFixture()
    const asset = createAssetFromFileReference({
      name: 'Logo',
      path: 'C:/graphics/logo.png',
    })
    const nextTemplate = addAsset(template, asset)
    const linkedTemplate = {
      ...nextTemplate,
      elements: nextTemplate.elements.map((element) =>
        element.id === imageElement.id
          ? {
              ...element,
              assetId: asset.id,
            }
          : element,
      ),
    }

    expect(linkedTemplate.elements[0]).toMatchObject({
      assetId: asset.id,
    })
    expect(getImageElementAsset(linkedTemplate, linkedTemplate.elements[0]!)).toEqual(asset)
  })

  it('the template can hold a referenceFrameAssetId in metadata or preview settings', async () => {
    const { createAssetFromFileReference, setReferenceFrameAsset } = await loadAssetUploadStateModule()
    const { template } = createTemplateFixture()
    const asset = createAssetFromFileReference({
      name: 'Reference Frame',
      path: 'C:/graphics/reference-frame.png',
    })
    const nextTemplate = setReferenceFrameAsset(addAsset(template, asset), asset.id) as TemplateWithReferenceFrame

    expect(
      nextTemplate.metadata.referenceFrameAssetId ?? nextTemplate.previewSettings?.referenceFrameAssetId,
    ).toBe(asset.id)
  })

  it('setReferenceFrameAsset sets the reference frame asset', async () => {
    const { createAssetFromFileReference, setReferenceFrameAsset } = await loadAssetUploadStateModule()
    const { template } = createTemplateFixture()
    const asset = createAssetFromFileReference({
      name: 'Reference Frame',
      path: 'C:/graphics/reference-frame.png',
    })
    const nextTemplate = setReferenceFrameAsset(addAsset(template, asset), asset.id) as TemplateWithReferenceFrame

    expect(nextTemplate).not.toBe(template)
    expect(
      nextTemplate.metadata.referenceFrameAssetId ?? nextTemplate.previewSettings?.referenceFrameAssetId,
    ).toBe(asset.id)
  })

  it('setReferenceFrameAsset ignores unknown asset ids', async () => {
    const { setReferenceFrameAsset } = await loadAssetUploadStateModule()
    const { template } = createTemplateFixture()
    const nextTemplate = setReferenceFrameAsset(template, 'missing-asset') as TemplateWithReferenceFrame

    expect(nextTemplate).toBe(template)
    expect(
      nextTemplate.metadata.referenceFrameAssetId ?? nextTemplate.previewSettings?.referenceFrameAssetId,
    ).toBeUndefined()
  })
})
