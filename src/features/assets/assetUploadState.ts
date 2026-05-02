import {
  createAsset,
  getAssetById,
} from './assetsRegistry'
import type {
  TemplateAsset,
  TemplateAssetMetadata,
  TemplateContract,
} from '@/shared/template-contract/templateContract'

interface CreateAssetFromFileReferenceInput {
  name: string
  path?: string
  dataUrl?: string
  mimeType?: string
  width?: number
  height?: number
}

export function createAssetFromFileReference(
  input: CreateAssetFromFileReferenceInput,
): TemplateAsset {
  const source =
    input.dataUrl !== undefined
      ? {
          type: 'data' as const,
          value: input.dataUrl,
        }
      : {
          type: 'local' as const,
          value: input.path ?? input.name,
        }
  const metadata: TemplateAssetMetadata | undefined =
    input.mimeType || input.width !== undefined || input.height !== undefined
      ? {
          mimeType: input.mimeType,
          width: input.width,
          height: input.height,
        }
      : undefined

  return createAsset({
    name: input.name,
    type: 'image',
    source,
    metadata,
  })
}

export function setImageElementAsset(
  template: TemplateContract,
  elementId: string,
  assetId: string,
): TemplateContract {
  if (!getAssetById(template, assetId)) {
    return template
  }

  const element = template.elements.find((currentElement) => currentElement.id === elementId)

  if (!element || element.kind !== 'image') {
    return template
  }

  return {
    ...template,
    elements: template.elements.map((currentElement) =>
      currentElement.id === elementId
        ? {
            ...currentElement,
            assetId,
          }
        : currentElement,
    ),
  }
}

export function setReferenceFrameAsset(
  template: TemplateContract,
  assetId: string,
): TemplateContract {
  if (!getAssetById(template, assetId)) {
    return template
  }

  return {
    ...template,
    metadata: {
      ...template.metadata,
      referenceFrameAssetId: assetId,
    },
  }
}

export function getReferenceFrameAsset(template: TemplateContract): TemplateAsset | undefined {
  const assetId = template.metadata.referenceFrameAssetId

  if (!assetId) {
    return undefined
  }

  return getAssetById(template, assetId)
}
