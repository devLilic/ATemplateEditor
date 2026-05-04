import type { ChangeEvent } from 'react'
import type { TemplateContract } from '@/shared/template-contract/templateContract'
import { Button } from '@/shared/ui/Button'
import { Badge } from '@/shared/ui/Badge'
import {
  clearOscCommands,
  getOnAirMetadata,
  setAutoHide,
  setOnAirDuration,
  setOscEnabled,
  setOscPlayCommand,
  setOscStopCommand,
  updateOnAirConfig,
  updateOscConfig,
} from './onAirMetadataState'
import {
  FormCheckbox,
  FormInput,
  FormSection,
  FormSelect,
} from './TemplateEditorFormPrimitives'

interface OnAirMetadataPanelProps {
  template: TemplateContract
  onTemplateChange: (template: TemplateContract) => void
}

function parseNumericInput(value: string) {
  if (value.trim() === '') {
    return undefined
  }

  const parsedValue = Number(value)

  return Number.isFinite(parsedValue) ? parsedValue : undefined
}

export function OnAirMetadataPanel({ template, onTemplateChange }: OnAirMetadataPanelProps) {
  const metadata = getOnAirMetadata(template)

  const handleDurationChange = (event: ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseNumericInput(event.currentTarget.value)

    if (numericValue === undefined) {
      return
    }

    onTemplateChange(setOnAirDuration(template, numericValue))
  }

  const handleAutoHideChange = (event: ChangeEvent<HTMLInputElement>) => {
    onTemplateChange(setAutoHide(template, event.currentTarget.checked))
  }

  const handleRollChange =
    (fieldName: 'prerollMs' | 'postrollMs') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const numericValue = parseNumericInput(event.currentTarget.value)

      if (numericValue === undefined) {
        return
      }

      onTemplateChange(
        updateOnAirConfig(template, {
          [fieldName]: numericValue,
        }),
      )
    }

  const handleOscEnabledChange = (event: ChangeEvent<HTMLInputElement>) => {
    onTemplateChange(setOscEnabled(template, event.currentTarget.checked))
  }

  const handleOscAddressChange =
    (kind: 'play' | 'stop') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const address = event.currentTarget.value
      const existingArgs =
        kind === 'play' ? (metadata.playCommand?.args ?? []) : (metadata.stopCommand?.args ?? [])

      const nextTemplate =
        kind === 'play'
          ? setOscPlayCommand(template, { address, args: existingArgs })
          : setOscStopCommand(template, { address, args: existingArgs })

      if (nextTemplate !== template) {
        onTemplateChange(nextTemplate)
      }
    }

  return (
    <div className='flex flex-col gap-4 text-ui-primary'>
      <div className='rounded-md border border-ui-border bg-ui-card/40 px-3 py-3'>
        <div className='flex items-center justify-between gap-3'>
          <div className='text-sm font-semibold text-ui-primary'>OnAir metadata</div>
          <Badge variant={metadata.oscEnabled ? 'active' : 'muted'}>
            OSC {metadata.oscEnabled ? 'enabled' : 'disabled'}
          </Badge>
        </div>
        <div className='mt-1 text-xs text-ui-secondary'>
          Metadata only. This panel does not send OSC commands or trigger playback.
        </div>
      </div>

      <FormSection
        description='Playback timing metadata for future OnAir runtime behavior.'
        title='Playback'
      >
        <FormSelect
          label='mode'
          onChange={(event) => {
            onTemplateChange(
              updateOnAirConfig(template, {
                mode: event.currentTarget.value as typeof metadata.mode,
              }),
            )
          }}
          value={metadata.mode}
        >
          <option value='manual'>manual</option>
          <option value='timed'>timed</option>
        </FormSelect>

        <FormInput
          label='durationSeconds'
          onChange={handleDurationChange}
          onInput={handleDurationChange}
          type='number'
          value={metadata.durationSeconds === undefined ? '' : String(metadata.durationSeconds)}
        />

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <FormCheckbox
            checked={metadata.autoHide}
            label='autoHide'
            onChange={handleAutoHideChange}
            onInput={handleAutoHideChange}
          />
        </div>

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <FormInput
            label='prerollMs'
            onChange={handleRollChange('prerollMs')}
            onInput={handleRollChange('prerollMs')}
            type='number'
            value={String(metadata.prerollMs)}
          />

          <FormInput
            label='postrollMs'
            onChange={handleRollChange('postrollMs')}
            onInput={handleRollChange('postrollMs')}
            type='number'
            value={String(metadata.postrollMs)}
          />
        </div>
      </FormSection>

      <FormSection
        aside={
          <Button
            onClick={() => {
              onTemplateChange(clearOscCommands(template))
            }}
            variant='ghost'
          >
            Clear OSC commands
          </Button>
        }
        description='Stored in the template for OnAir Player. No network actions happen here.'
        title='OSC metadata'
      >

        <FormCheckbox
          checked={metadata.oscEnabled}
          label='enabled'
          onChange={handleOscEnabledChange}
          onInput={handleOscEnabledChange}
        />

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <FormInput
            label='host'
            onChange={(event) => {
              onTemplateChange(
                updateOscConfig(template, {
                  target: {
                    ...metadata.oscTarget,
                    host: event.currentTarget.value,
                  },
                }),
              )
            }}
            onInput={(event) => {
              onTemplateChange(
                updateOscConfig(template, {
                  target: {
                    ...metadata.oscTarget,
                    host: event.currentTarget.value,
                  },
                }),
              )
            }}
            type='text'
            value={metadata.oscTarget.host}
          />

          <FormInput
            label='port'
            onChange={(event) => {
              const numericValue = parseNumericInput(event.currentTarget.value)

              if (numericValue === undefined) {
                return
              }

              onTemplateChange(
                updateOscConfig(template, {
                  target: {
                    ...metadata.oscTarget,
                    port: numericValue,
                  },
                }),
              )
            }}
            onInput={(event) => {
              const numericValue = parseNumericInput(event.currentTarget.value)

              if (numericValue === undefined) {
                return
              }

              onTemplateChange(
                updateOscConfig(template, {
                  target: {
                    ...metadata.oscTarget,
                    port: numericValue,
                  },
                }),
              )
            }}
            type='number'
            value={String(metadata.oscTarget.port)}
          />
        </div>

        <FormInput
          label='play address'
          onChange={handleOscAddressChange('play')}
          onInput={handleOscAddressChange('play')}
          placeholder='/template/play'
          type='text'
          value={metadata.playCommand?.address ?? ''}
        />

        <FormInput
          label='stop address'
          onChange={handleOscAddressChange('stop')}
          onInput={handleOscAddressChange('stop')}
          placeholder='/template/stop'
          type='text'
          value={metadata.stopCommand?.address ?? ''}
        />

        <FormInput
          label='resume address'
          onChange={(event) => {
            const address = event.currentTarget.value
            const existingArgs = metadata.resumeCommand?.args ?? []

            if (address.trim() === '') {
              return
            }

            onTemplateChange(
              updateOscConfig(template, {
                commands: {
                  ...template.osc.commands,
                  resume: {
                    address,
                    args: existingArgs,
                  },
                },
              }),
            )
          }}
          onInput={(event) => {
            const address = event.currentTarget.value
            const existingArgs = metadata.resumeCommand?.args ?? []

            if (address.trim() === '') {
              return
            }

            onTemplateChange(
              updateOscConfig(template, {
                commands: {
                  ...template.osc.commands,
                  resume: {
                    address,
                    args: existingArgs,
                  },
                },
              }),
            )
          }}
          placeholder='/template/resume'
          type='text'
          value={metadata.resumeCommand?.address ?? ''}
        />
      </FormSection>
    </div>
  )
}

export default OnAirMetadataPanel
