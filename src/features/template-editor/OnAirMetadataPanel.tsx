import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react'
import type { TemplateContract } from '@/shared/template-contract/templateContract'
import { Button } from '@/shared/ui/Button'
import {
  clearOscCommands,
  getOnAirMetadata,
  setAutoHide,
  setOnAirDuration,
  setOscEnabled,
  setOscPlayCommand,
  setOscStopCommand,
  updateOnAirConfig,
} from './onAirMetadataState'

interface OnAirMetadataPanelProps {
  template: TemplateContract
  onTemplateChange: (template: TemplateContract) => void
}

interface FieldProps {
  label: string
  children: ReactNode
}

interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
}

function Field({ label, children }: FieldProps) {
  return (
    <label className='flex flex-col gap-1'>
      <span className='text-[11px] font-semibold uppercase tracking-normal text-ui-disabled'>{label}</span>
      {children}
    </label>
  )
}

function inputClassName() {
  return 'h-9 rounded-md border border-ui-border bg-ui-card px-3 text-sm text-ui-primary outline-none transition-colors placeholder:text-ui-disabled focus:border-ui-accent'
}

function InputField({ label, ...props }: InputFieldProps) {
  return (
    <Field label={label}>
      <input
        {...props}
        aria-label={label}
        className={`${inputClassName()} ${props.className ?? ''}`.trim()}
        name={props.name ?? label}
      />
    </Field>
  )
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
        <div className='text-sm font-semibold text-ui-primary'>OnAir metadata</div>
        <div className='mt-1 text-xs text-ui-secondary'>
          Metadata only. This panel does not send OSC commands or trigger playback.
        </div>
      </div>

      <section className='flex flex-col gap-3 rounded-md border border-ui-border bg-ui-card/25 p-3'>
        <div className='text-[11px] font-semibold uppercase tracking-normal text-ui-accent'>Playback</div>

        <InputField
          label='durationMs'
          onChange={handleDurationChange}
          onInput={handleDurationChange}
          type='number'
          value={metadata.durationMs === undefined ? '' : String(metadata.durationMs)}
        />

        <div className='grid grid-cols-2 gap-3'>
          <Field label='autoHide'>
            <input
              aria-label='autoHide'
              checked={metadata.autoHide}
              className='h-4 w-4 accent-ui-accent'
              name='autoHide'
              onChange={handleAutoHideChange}
              onInput={handleAutoHideChange}
              type='checkbox'
            />
          </Field>

          <div />
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <InputField
            label='prerollMs'
            onChange={handleRollChange('prerollMs')}
            onInput={handleRollChange('prerollMs')}
            type='number'
            value={String(metadata.prerollMs)}
          />

          <InputField
            label='postrollMs'
            onChange={handleRollChange('postrollMs')}
            onInput={handleRollChange('postrollMs')}
            type='number'
            value={String(metadata.postrollMs)}
          />
        </div>
      </section>

      <section className='flex flex-col gap-3 rounded-md border border-ui-border bg-ui-card/25 p-3'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <div className='text-[11px] font-semibold uppercase tracking-normal text-ui-accent'>
              OSC metadata
            </div>
            <div className='text-xs text-ui-secondary'>Stored in template metadata only.</div>
          </div>
          <Button
            onClick={() => {
              onTemplateChange(clearOscCommands(template))
            }}
            variant='ghost'
          >
            Clear OSC commands
          </Button>
        </div>

        <Field label='enabled'>
          <input
            aria-label='enabled'
            checked={metadata.oscEnabled}
            className='h-4 w-4 accent-ui-accent'
            name='enabled'
            onChange={handleOscEnabledChange}
            onInput={handleOscEnabledChange}
            type='checkbox'
          />
        </Field>

        <InputField
          label='play address'
          onChange={handleOscAddressChange('play')}
          onInput={handleOscAddressChange('play')}
          placeholder='/template/play'
          type='text'
          value={metadata.playCommand?.address ?? ''}
        />

        <InputField
          label='stop address'
          onChange={handleOscAddressChange('stop')}
          onInput={handleOscAddressChange('stop')}
          placeholder='/template/stop'
          type='text'
          value={metadata.stopCommand?.address ?? ''}
        />
      </section>
    </div>
  )
}

export default OnAirMetadataPanel
