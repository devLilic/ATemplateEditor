import type {
  TemplateAsset,
  TemplateAssetMetadata,
  TemplateAssetSource,
  TemplateAssetSourceType,
  TemplateAssetType,
  TemplateContract,
  TemplateElement,
} from '@/shared/template-contract/templateContract'

interface CreateAssetInput {
  name: string
  type?: TemplateAssetType
  source: TemplateAssetSource
  metadata?: TemplateAssetMetadata
}

function createAssetId() {
  return `asset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export type {
  TemplateAsset,
  TemplateAssetMetadata,
  TemplateAssetSource,
  TemplateAssetSourceType,
  TemplateAssetType,
}

export function createAsset(input: CreateAssetInput): TemplateAsset {
  return {
    id: createAssetId(),
    name: input.name,
    type: input.type ?? 'image',
    source: input.source,
    metadata: input.metadata,
  }
}

export function addAsset(template: TemplateContract, asset: TemplateAsset): TemplateContract {
  if (template.assets.some((existingAsset) => existingAsset.id === asset.id)) {
    return template
  }

  return {
    ...template,
    assets: [...template.assets, asset],
  }
}

export function updateAsset(
  template: TemplateContract,
  assetId: string,
  patch: Partial<TemplateAsset>,
): TemplateContract {
  const assetIndex = template.assets.findIndex((asset) => asset.id === assetId)

  if (assetIndex < 0) {
    return template
  }

  const currentAsset = template.assets[assetIndex]
  const nextAsset: TemplateAsset = {
    ...currentAsset,
    ...patch,
    id: currentAsset.id,
  }

  return {
    ...template,
    assets: template.assets.map((asset, index) => (index === assetIndex ? nextAsset : asset)),
  }
}

export function removeAsset(template: TemplateContract, assetId: string): TemplateContract {
  if (!template.assets.some((asset) => asset.id === assetId)) {
    return template
  }

  return {
    ...template,
    assets: template.assets.filter((asset) => asset.id !== assetId),
  }
}

export function getAssetById(template: TemplateContract, assetId: string): TemplateAsset | undefined {
  return template.assets.find((asset) => asset.id === assetId)
}

export function listImageAssets(template: TemplateContract): TemplateAsset[] {
  return template.assets.filter((asset) => asset.type === 'image')
}

export function getImageElementAsset(
  template: TemplateContract,
  element: TemplateElement,
): TemplateAsset | undefined {
  if (element.kind !== 'image') {
    return undefined
  }

  if (!element.assetId) {
    return undefined
  }

  return getAssetById(template, element.assetId)
}
