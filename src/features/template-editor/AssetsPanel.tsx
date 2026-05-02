import { useState } from 'react'
import {
  addAsset,
  clearPreviewBackgroundAsset,
  createAssetFromStoredFileReference,
  getPreviewBackgroundAsset,
} from '@/features/assets'
import {
  setImageElementAsset,
  setPreviewBackgroundAsset,
} from '@/features/assets/assetUploadState'
import type { TemplateContract, TemplateImageElement } from '@/shared/template-contract/templateContract'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FormSection } from './TemplateEditorFormPrimitives'

interface AssetsPanelProps {
  template: TemplateContract
  onTemplateChange: (template: TemplateContract) => void
  selectedElementId?: string
}

function isImageElementSelected(
  template: TemplateContract,
  selectedElementId?: string,
): TemplateImageElement | undefined {
  const element = template.elements.find((currentElement) => currentElement.id === selectedElementId)

  return element?.kind === 'image' ? element : undefined
}

export function AssetsPanel({
  template,
  onTemplateChange,
  selectedElementId,
}: AssetsPanelProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [uploadError, setUploadError] = useState<string>()
  const previewBackgroundAsset = getPreviewBackgroundAsset(template)
  const selectedImageElement = isImageElementSelected(template, selectedElementId)

  const handleImport = async () => {
    if (!window.assetsApi?.importImageAsset) {
      setUploadError('Image import is not available in this environment.')
      return
    }

    setIsImporting(true)
    setUploadError(undefined)

    try {
      const importedAsset = await window.assetsApi.importImageAsset()

      if (!importedAsset) {
        return
      }

      const asset = createAssetFromStoredFileReference({
        filePath: importedAsset.filePath,
        originalFileName: importedAsset.originalFileName,
      })

      onTemplateChange(addAsset(template, asset))
    } catch {
      setUploadError('Unable to import the selected image.')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className='flex flex-col gap-4 text-ui-primary'>
      <div className='flex items-center justify-between gap-3 rounded-md border border-ui-border bg-ui-card/40 px-3 py-3'>
        <div className='min-w-0'>
          <div className='text-sm font-semibold text-ui-primary'>Assets</div>
          <div className='text-xs text-ui-secondary'>
            Upload images, set a reference frame and assign assets to the selected image element.
          </div>
        </div>
        <Badge variant='muted'>{template.assets.length}</Badge>
      </div>

      <FormSection
        description='Imported images are stored as local asset paths inside the template.'
        title='Import image'
      >
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <Button
            className='w-full sm:w-auto'
            disabled={isImporting}
            onClick={() => {
              void handleImport()
            }}
            variant='accent'
          >
            {isImporting ? 'Importing...' : 'Import image asset'}
          </Button>

          {selectedImageElement ? (
            <div className='text-xs text-ui-secondary'>
              Selected image element: <span className='text-ui-primary'>{selectedImageElement.name}</span>
            </div>
          ) : (
            <div className='text-xs text-ui-disabled'>
              Select an image element to assign uploaded assets.
            </div>
          )}
        </div>

        {uploadError ? <div className='text-sm text-ui-danger'>{uploadError}</div> : null}
      </FormSection>

      <FormSection
        description='Preview background is a positioning guide. Asset assignment targets the selected image element.'
        title='Asset library'
      >
        {previewBackgroundAsset ? (
          <div className='flex flex-col gap-3 rounded-md border border-ui-border bg-ui-card/25 p-3'>
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <div className='truncate text-sm font-semibold text-ui-primary'>
                  {previewBackgroundAsset.name}
                </div>
                <div className='truncate text-xs text-ui-secondary'>
                  {previewBackgroundAsset.source.value}
                </div>
              </div>
              <Badge variant='selected'>Preview background</Badge>
            </div>

            <Button
              className='w-full sm:w-auto'
              onClick={() => {
                onTemplateChange(clearPreviewBackgroundAsset(template))
              }}
              variant='ghost'
            >
              Clear preview background
            </Button>
          </div>
        ) : null}

        {template.assets.length > 0 ? (
          <div className='flex flex-col gap-3'>
            {template.assets.map((asset) => {
              const isPreviewBackground = previewBackgroundAsset?.id === asset.id
              const isAssignedToSelectedImage = selectedImageElement?.assetId === asset.id

              return (
                <div
                  className='flex flex-col gap-3 rounded-md border border-ui-border bg-ui-card/25 p-3'
                  key={asset.id}
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <div className='truncate text-sm font-semibold text-ui-primary'>{asset.name}</div>
                      <div className='text-xs text-ui-secondary'>
                        {asset.source.type} asset
                      </div>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {isPreviewBackground ? <Badge variant='selected'>Preview background</Badge> : null}
                      {isAssignedToSelectedImage ? <Badge variant='active'>Assigned</Badge> : null}
                    </div>
                  </div>

                  <div className='truncate text-xs text-ui-secondary'>{asset.source.value}</div>

                  <div className='flex flex-col gap-2 sm:flex-row'>
                    <Button
                      className='w-full sm:w-auto'
                      onClick={() => {
                        onTemplateChange(setPreviewBackgroundAsset(template, asset.id))
                      }}
                      variant={isPreviewBackground ? 'selected' : 'neutral'}
                    >
                      Set as preview background
                    </Button>

                    <Button
                      className='w-full sm:w-auto'
                      disabled={!selectedImageElement}
                      onClick={() => {
                        if (!selectedImageElement) {
                          return
                        }

                        onTemplateChange(setImageElementAsset(template, selectedImageElement.id, asset.id))
                      }}
                      variant={isAssignedToSelectedImage ? 'selected' : 'ghost'}
                    >
                      Assign to selected image
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState
            description='Upload an image to create an asset for the current template.'
            title='No assets yet'
          />
        )}
      </FormSection>
    </div>
  )
}

export default AssetsPanel
