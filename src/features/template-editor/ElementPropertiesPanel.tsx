import type { ChangeEvent } from 'react'
import { Badge } from '@/shared/ui/Badge'
import { EmptyState } from '@/shared/ui/EmptyState'
import type {
  TemplateElement,
  TemplateImageElement,
  TemplateShapeElement,
  TemplateTextElement,
} from '@/shared/template-contract/templateContract'
import {
  FormCheckbox,
  FormInput,
  FormSection,
  FormSelect,
} from './TemplateEditorFormPrimitives'

interface ElementPropertiesPanelProps {
  element?: TemplateElement
  onElementChange: (elementId: string, patch: Partial<TemplateElement>) => void
}

type RotatableElement = TemplateElement & {
  rotation?: number
}

function parseNumericInput(value: string) {
  if (value.trim() === '') {
    return undefined
  }

  const parsedValue = Number(value)

  return Number.isFinite(parsedValue) ? parsedValue : undefined
}

function getRotation(element: TemplateElement) {
  return (element as RotatableElement).rotation ?? 0
}

function isTextElement(element: TemplateElement): element is TemplateTextElement {
  return element.kind === 'text'
}

function isImageElement(element: TemplateElement): element is TemplateImageElement {
  return element.kind === 'image'
}

function isShapeElement(element: TemplateElement): element is TemplateShapeElement {
  return element.kind === 'shape'
}

export function ElementPropertiesPanel({
  element,
  onElementChange,
}: ElementPropertiesPanelProps) {
  if (!element) {
    return <EmptyState title='Select an element to edit properties' />
  }

  const emitPatch = (patch: Partial<TemplateElement>) => {
    onElementChange(element.id, patch)
  }

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    emitPatch({
      name: event.currentTarget.value,
    })
  }

  const handlePositionChange =
    (axis: 'x' | 'y') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const numericValue = parseNumericInput(event.currentTarget.value)

      if (numericValue === undefined) {
        return
      }

      emitPatch({
        position: {
          ...element.position,
          [axis]: numericValue,
        },
      } as Partial<TemplateElement>)
    }

  const handleSizeChange =
    (dimension: 'width' | 'height') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const numericValue = parseNumericInput(event.currentTarget.value)

      if (numericValue === undefined) {
        return
      }

      emitPatch({
        size: {
          ...element.size,
          [dimension]: numericValue,
        },
      } as Partial<TemplateElement>)
    }

  const handleRotationChange = (event: ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseNumericInput(event.currentTarget.value)

    if (numericValue === undefined) {
      return
    }

    emitPatch({
      rotation: numericValue,
    } as Partial<TemplateElement>)
  }

  const handleFlagChange =
    (fieldName: 'visible' | 'locked') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      emitPatch({
        [fieldName]: event.currentTarget.checked,
      } as Partial<TemplateElement>)
    }

  const handleTextStyleChange =
    <Key extends keyof TemplateTextElement['style']>(fieldName: Key) =>
    (value: TemplateTextElement['style'][Key]) => {
      if (!isTextElement(element)) {
        return
      }

      emitPatch({
        style: {
          ...element.style,
          [fieldName]: value,
        },
      } as Partial<TemplateElement>)
    }

  const handleFallbackTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isTextElement(element)) {
      return
    }

    emitPatch({
      fallbackText: event.currentTarget.value,
    } as Partial<TemplateElement>)
  }

  const handleTextBehaviorChange =
    <Key extends keyof TemplateTextElement['behavior']>(fieldName: Key) =>
    (value: TemplateTextElement['behavior'][Key]) => {
      if (!isTextElement(element)) {
        return
      }

      emitPatch({
        behavior: {
          ...element.behavior,
          [fieldName]: value,
        },
      } as Partial<TemplateElement>)
    }

  const handleFontSizeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseNumericInput(event.currentTarget.value)

    if (numericValue === undefined) {
      return
    }

    handleTextStyleChange('fontSize')(numericValue)
  }

  const handleFontFamilyChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleTextStyleChange('fontFamily')(event.currentTarget.value)
  }

  const handleColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleTextStyleChange('color')(event.currentTarget.value)
  }

  const handleTextAlignChange = (event: ChangeEvent<HTMLSelectElement>) => {
    handleTextStyleChange('textAlign')(event.currentTarget.value as TemplateTextElement['style']['textAlign'])
  }

  const handleFitInBoxChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleTextBehaviorChange('fitInBox')(event.currentTarget.checked)
  }

  const handleFitModeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    handleTextBehaviorChange('fitMode')(event.currentTarget.value as TemplateTextElement['behavior']['fitMode'])
  }

  const handleMinScaleXChange = (event: ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseNumericInput(event.currentTarget.value)

    if (numericValue === undefined) {
      return
    }

    handleTextBehaviorChange('minScaleX')(numericValue)
  }

  const handleAssetIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isImageElement(element)) {
      return
    }

    const value = event.currentTarget.value

    emitPatch({
      assetId: value || undefined,
    } as Partial<TemplateElement>)
  }

  const handleOpacityChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isImageElement(element)) {
      return
    }

    const numericValue = parseNumericInput(event.currentTarget.value)

    if (numericValue === undefined) {
      return
    }

    emitPatch({
      opacity: numericValue,
    } as Partial<TemplateElement>)
  }

  const handleObjectFitChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (!isImageElement(element)) {
      return
    }

    emitPatch({
      objectFit: event.currentTarget.value as TemplateImageElement['objectFit'],
    } as Partial<TemplateElement>)
  }

  const handleShapeTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (!isShapeElement(element)) {
      return
    }

    emitPatch({
      shapeType: event.currentTarget.value as TemplateShapeElement['shapeType'],
    } as Partial<TemplateElement>)
  }

  const handleFillColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isShapeElement(element)) {
      return
    }

    emitPatch({
      fillColor: event.currentTarget.value,
    } as Partial<TemplateElement>)
  }

  const handleBorderColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isShapeElement(element)) {
      return
    }

    const value = event.currentTarget.value

    emitPatch({
      borderColor: value || undefined,
    } as Partial<TemplateElement>)
  }

  const handleBorderWidthChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isShapeElement(element)) {
      return
    }

    const numericValue = parseNumericInput(event.currentTarget.value)

    if (numericValue === undefined) {
      return
    }

    emitPatch({
      borderWidth: numericValue,
    } as Partial<TemplateElement>)
  }

  return (
    <div className='flex flex-col gap-4 text-ui-primary'>
      <div className='flex items-start justify-between gap-3 rounded-md border border-ui-border bg-ui-card/40 px-3 py-3'>
        <div className='min-w-0'>
          <div className='text-[11px] font-semibold uppercase tracking-normal text-ui-accent'>Element</div>
          <div className='truncate text-sm font-semibold text-ui-primary'>{element.name}</div>
        </div>
        <Badge variant='selected'>{element.kind}</Badge>
      </div>

      <FormSection
        description='Layout, visibility and transform settings.'
        title='Common'
      >
        <FormInput
          label='name'
          onChange={handleNameChange}
          onInput={handleNameChange}
          type='text'
          value={element.name}
        />

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <FormInput
            label='x'
            onChange={handlePositionChange('x')}
            onInput={handlePositionChange('x')}
            type='number'
            value={String(element.position.x)}
          />
          <FormInput
            label='y'
            onChange={handlePositionChange('y')}
            onInput={handlePositionChange('y')}
            type='number'
            value={String(element.position.y)}
          />
        </div>

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <FormInput
            label='width'
            onChange={handleSizeChange('width')}
            onInput={handleSizeChange('width')}
            type='number'
            value={String(element.size.width)}
          />
          <FormInput
            label='height'
            onChange={handleSizeChange('height')}
            onInput={handleSizeChange('height')}
            type='number'
            value={String(element.size.height)}
          />
        </div>

        <FormInput
          label='rotation'
          onChange={handleRotationChange}
          onInput={handleRotationChange}
          type='number'
          value={String(getRotation(element))}
        />

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <FormCheckbox
            checked={element.visible}
            label='visible'
            onChange={handleFlagChange('visible')}
            onInput={handleFlagChange('visible')}
          />
          <FormCheckbox
            checked={element.locked}
            label='locked'
            onChange={handleFlagChange('locked')}
            onInput={handleFlagChange('locked')}
          />
        </div>
      </FormSection>

      {isTextElement(element) ? (
        <FormSection
          description='Typography and fallback content for text rendering.'
          title='Text'
        >
          <FormInput
            label='fallbackText'
            onChange={handleFallbackTextChange}
            onInput={handleFallbackTextChange}
            type='text'
            value={element.fallbackText}
          />

          <FormInput
            label='fontSize'
            onChange={handleFontSizeChange}
            onInput={handleFontSizeChange}
            type='number'
            value={String(element.style.fontSize)}
          />

          <FormInput
            label='fontFamily'
            onChange={handleFontFamilyChange}
            onInput={handleFontFamilyChange}
            type='text'
            value={element.style.fontFamily}
          />

          <FormInput
            label='color'
            onChange={handleColorChange}
            onInput={handleColorChange}
            type='color'
            value={element.style.color}
          />

          <FormSelect
            label='textAlign'
            onChange={handleTextAlignChange}
            value={element.style.textAlign}
          >
            <option value='left'>left</option>
            <option value='center'>center</option>
            <option value='right'>right</option>
          </FormSelect>

          <FormCheckbox
            checked={element.behavior.fitInBox ?? true}
            label='fitInBox'
            onChange={handleFitInBoxChange}
            onInput={handleFitInBoxChange}
          />

          <FormSelect
            label='fitMode'
            onChange={handleFitModeChange}
            value={element.behavior.fitMode ?? 'scaleX'}
          >
            <option value='scaleX'>scaleX</option>
          </FormSelect>

          <FormInput
            label='minScaleX'
            onChange={handleMinScaleXChange}
            onInput={handleMinScaleXChange}
            type='number'
            value={String(element.behavior.minScaleX ?? 0.5)}
          />
        </FormSection>
      ) : null}

      {isImageElement(element) ? (
        <FormSection
          description='Asset reference and object-fit display settings.'
          title='Image'
        >
          <FormInput
            label='assetId'
            onChange={handleAssetIdChange}
            onInput={handleAssetIdChange}
            type='text'
            value={element.assetId ?? ''}
          />

          <FormInput
            label='opacity'
            onChange={handleOpacityChange}
            onInput={handleOpacityChange}
            type='number'
            value={String(element.opacity)}
          />

          <FormSelect
            label='objectFit'
            onChange={handleObjectFitChange}
            value={element.objectFit}
          >
            <option value='contain'>contain</option>
            <option value='cover'>cover</option>
            <option value='fill'>fill</option>
          </FormSelect>
        </FormSection>
      ) : null}

      {isShapeElement(element) ? (
        <FormSection
          description='Primitive shape styling for fills and borders.'
          title='Shape'
        >
          <FormSelect
            label='shapeType'
            onChange={handleShapeTypeChange}
            value={element.shapeType}
          >
            <option value='rectangle'>rectangle</option>
            <option value='ellipse'>ellipse</option>
          </FormSelect>

          <FormInput
            label='fillColor'
            onChange={handleFillColorChange}
            onInput={handleFillColorChange}
            type='color'
            value={element.fillColor}
          />

          <FormInput
            label='borderColor'
            onChange={handleBorderColorChange}
            onInput={handleBorderColorChange}
            type='color'
            value={element.borderColor ?? '#000000'}
          />

          <FormInput
            label='borderWidth'
            onChange={handleBorderWidthChange}
            onInput={handleBorderWidthChange}
            type='number'
            value={String(element.borderWidth)}
          />
        </FormSection>
      ) : null}
    </div>
  )
}

export default ElementPropertiesPanel
