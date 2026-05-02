import { useId, useState, type ChangeEvent } from 'react'
import {
  createAssetFromFileReference,
  getReferenceFrameAsset,
  setImageElementAsset,
  setReferenceFrameAsset,
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

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Unable to read file as data URL.'))
    }

    reader.onerror = () => {
      reject(reader.error ?? new Error('Unable to read file.'))
    }

    reader.readAsDataURL(file)
  })
}

export function AssetsPanel({
  template,
  onTemplateChange,
  selectedElementId,
}: AssetsPanelProps) {
  const inputId = useId()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string>()
  const referenceFrameAsset = getReferenceFrameAsset(template)
  const selectedImageElement = isImageElementSelected(template, selectedElementId)

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]

    if (!file) {
      return
    }

    setIsUploading(true)
    setUploadError(undefined)

    try {
      const dataUrl = await readFileAsDataUrl(file)
      const asset = createAssetFromFileReference({
        name: file.name,
        dataUrl,
        mimeType: file.type || undefined,
      })

      onTemplateChange({
        ...template,
        assets: [...template.assets, asset],
      })
    } catch {
      setUploadError('Unable to read the selected image.')
    } finally {
      setIsUploading(false)
      event.currentTarget.value = ''
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
        description='Uploaded images stay in the current template only.'
        title='Upload image'
      >
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <label className='inline-flex'>
            <input
              accept='image/*'
              className='sr-only'
              id={inputId}
              onChange={(event) => {
                void handleUpload(event)
              }}
              type='file'
            />
            <Button
              className='w-full sm:w-auto'
              disabled={isUploading}
              onClick={() => {
                const input = document.getElementById(inputId) as HTMLInputElement | null
                input?.click()
              }}
              variant='accent'
            >
              {isUploading ? 'Uploading...' : 'Upload image'}
            </Button>
          </label>

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
        description='Reference frame helps align the preview. Asset assignment targets the selected image element.'
        title='Asset library'
      >
        {template.assets.length > 0 ? (
          <div className='flex flex-col gap-3'>
            {template.assets.map((asset) => {
              const isReferenceFrame = referenceFrameAsset?.id === asset.id
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
                      {isReferenceFrame ? <Badge variant='selected'>Reference frame</Badge> : null}
                      {isAssignedToSelectedImage ? <Badge variant='active'>Assigned</Badge> : null}
                    </div>
                  </div>

                  <div className='flex flex-col gap-2 sm:flex-row'>
                    <Button
                      className='w-full sm:w-auto'
                      onClick={() => {
                        onTemplateChange(setReferenceFrameAsset(template, asset.id))
                      }}
                      variant={isReferenceFrame ? 'selected' : 'neutral'}
                    >
                      Set as reference frame
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
