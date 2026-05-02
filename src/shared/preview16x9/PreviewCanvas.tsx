import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { getTemplateFieldValue } from '../template-contract/templateDefaults'
import type {
  TemplateAsset,
  TemplateContract,
  TemplateElement,
  TemplateImageElement,
  TemplateShapeElement,
  TemplateTextElement,
} from '../template-contract/templateContract'

export interface PreviewCanvasProps {
  template: TemplateContract
  width: number
  height: number
  className?: string
}

export interface PreviewFrameLayout {
  x: number
  y: number
  width: number
  height: number
  scale: number
}

export interface PreviewElementLayout {
  element: TemplateElement
  style: CSSProperties
  content?: string
}

interface ShapeRuntimeStyle {
  borderRadius?: number | string
  rotation?: number
  shapeType?: string
}

interface ImageRuntimeStyle {
  rotation?: number
}

interface TextPreviewRuntimeStyle extends CSSProperties {
  fitInBox?: boolean
  fitMode?: 'scaleX'
  minScaleX?: number
  scaleX?: number
}

export interface CalculateTextScaleXInput {
  textWidth: number
  containerWidth: number
  fitInBox: boolean
  minScaleX?: number
}

function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function calculateTextScaleX({
  textWidth,
  containerWidth,
  fitInBox,
  minScaleX = 0.5,
}: CalculateTextScaleXInput) {
  if (!fitInBox) {
    return 1
  }

  if (textWidth <= 0) {
    return 1
  }

  if (containerWidth <= 0) {
    return minScaleX
  }

  if (textWidth <= containerWidth) {
    return 1
  }

  const scale = containerWidth / textWidth

  return Math.max(minScaleX, scale)
}

function getTextBehavior(element: TemplateTextElement) {
  return {
    fitInBox: element.behavior?.fitInBox ?? true,
    fitMode: element.behavior?.fitMode ?? 'scaleX',
    minScaleX: element.behavior?.minScaleX ?? 0.5,
  }
}

function estimateTextWidth(text: string, fontSize: number, fontFamily: string) {
  const normalizedFamily = fontFamily.trim().toLowerCase()
  const fontFactor = normalizedFamily.includes('times')
    ? 1.25
    : normalizedFamily.includes('arial')
      ? 1
      : 1.1

  return Math.max(0, (text.length + 4) * fontSize * 1.2 * fontFactor)
}

export function calculatePreviewFrame(
  canvasWidth: number,
  canvasHeight: number,
  width: number,
  height: number,
): PreviewFrameLayout {
  const safeCanvasWidth = canvasWidth > 0 ? canvasWidth : 1920
  const safeCanvasHeight = canvasHeight > 0 ? canvasHeight : 1080
  const safeWidth = width > 0 ? width : 1
  const safeHeight = height > 0 ? height : 1
  const scale = Math.min(safeWidth / safeCanvasWidth, safeHeight / safeCanvasHeight)
  const frameWidth = safeCanvasWidth * scale
  const frameHeight = safeCanvasHeight * scale

  return {
    x: (safeWidth - frameWidth) / 2,
    y: (safeHeight - frameHeight) / 2,
    width: frameWidth,
    height: frameHeight,
    scale,
  }
}

function sortElementsByLayer(template: TemplateContract) {
  const layerOrder = new Map(template.layers.map((layer) => [layer.id, layer.zIndex]))

  return [...template.elements].sort((left, right) => {
    const leftZIndex = layerOrder.get(left.layerId) ?? 0
    const rightZIndex = layerOrder.get(right.layerId) ?? 0

    if (leftZIndex !== rightZIndex) {
      return leftZIndex - rightZIndex
    }

    return 0
  })
}

function getPreviewBackgroundAsset(template: TemplateContract): TemplateAsset | undefined {
  const assetId =
    template.metadata.previewBackgroundAssetId ?? template.metadata.referenceFrameAssetId

  if (!assetId) {
    return undefined
  }

  return template.assets.find((asset) => asset.id === assetId)
}

export function calculatePreviewLayout(
  template: TemplateContract,
  frame: PreviewFrameLayout,
): PreviewElementLayout[] {
  const layerOrder = new Map(template.layers.map((layer) => [layer.id, layer.zIndex]))

  return sortElementsByLayer(template)
    .filter((element) => element.visible !== false)
    .map((element) => {
      const baseStyle: CSSProperties = {
        position: 'absolute',
        left: element.position.x * frame.scale,
        top: element.position.y * frame.scale,
        width: element.size.width * frame.scale,
        height: element.size.height * frame.scale,
        overflow: 'hidden',
        zIndex: layerOrder.get(element.layerId) ?? 0,
      }

      if (element.kind === 'text') {
        const content = element.sourceField
          ? getTemplateFieldValue(template, element.sourceField)
          : element.fallbackText
        const behavior = getTextBehavior(element)
        const scaleX = calculateTextScaleX({
          textWidth: estimateTextWidth(
            content,
            element.style.fontSize * frame.scale,
            element.style.fontFamily,
          ),
          containerWidth: element.size.width * frame.scale,
          fitInBox: behavior.fitInBox && behavior.fitMode === 'scaleX',
          minScaleX: behavior.minScaleX,
        })

        return {
          element,
          content,
          style: {
            ...baseStyle,
            color: element.style.color,
            fontFamily: element.style.fontFamily,
            fontSize: element.style.fontSize * frame.scale,
            fitInBox: behavior.fitInBox,
            fitMode: behavior.fitMode,
            minScaleX: behavior.minScaleX,
            scaleX,
            textAlign: element.style.textAlign,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            transform: element.rotation !== 0 ? `rotate(${element.rotation}deg)` : undefined,
            transformOrigin: 'top left',
          } as TextPreviewRuntimeStyle,
        }
      }

      if (element.kind === 'shape') {
        const shapeRuntimeStyle = element as TemplateShapeElement & ShapeRuntimeStyle
        const runtimeShapeType = shapeRuntimeStyle.shapeType as string | undefined
        const borderRadius =
          runtimeShapeType === 'ellipse'
            ? '9999px'
            : typeof shapeRuntimeStyle.borderRadius === 'number'
              ? shapeRuntimeStyle.borderRadius * frame.scale
              : shapeRuntimeStyle.borderRadius

        return {
          element,
          style: {
            ...baseStyle,
            background: element.fillColor,
            borderColor: element.borderColor,
            borderStyle: element.borderWidth > 0 ? 'solid' : undefined,
            borderWidth: element.borderWidth > 0 ? element.borderWidth * frame.scale : undefined,
            borderRadius,
            boxSizing: 'border-box',
            pointerEvents: 'none',
            transform: typeof shapeRuntimeStyle.rotation === 'number' && shapeRuntimeStyle.rotation !== 0
              ? `rotate(${shapeRuntimeStyle.rotation}deg)`
              : undefined,
            transformOrigin: 'center center',
          },
        }
      }

      if (element.kind === 'image') {
        const imageRuntimeStyle = element as TemplateImageElement & ImageRuntimeStyle
        const linkedAsset = element.assetId
          ? template.assets.find((asset) => asset.id === element.assetId)
          : undefined
        const content = linkedAsset
          ? linkedAsset.name
          : element.assetId
            ? 'Missing image asset'
            : 'Image placeholder'

        return {
          element,
          content,
          style: {
            ...baseStyle,
            alignItems: 'center',
            background: '#1f2937',
            border: '1px dashed #4b5563',
            color: '#9ca3af',
            display: 'flex',
            fontSize: 12,
            justifyContent: 'center',
            opacity: element.opacity,
            pointerEvents: 'none',
            textAlign: 'center',
            transform: typeof imageRuntimeStyle.rotation === 'number' && imageRuntimeStyle.rotation !== 0
              ? `rotate(${imageRuntimeStyle.rotation}deg)`
              : undefined,
            transformOrigin: 'center center',
          },
        }
      }

      return {
        element,
        style: baseStyle,
      }
    })
}

function TextPreviewElement({
  element,
  style,
  content,
}: PreviewElementLayout & { element: TemplateTextElement }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const innerRef = useRef<HTMLSpanElement | null>(null)
  const textStyle = style as TextPreviewRuntimeStyle
  const fitInBox = textStyle.fitInBox === true && textStyle.fitMode === 'scaleX'
  const minScaleX = typeof textStyle.minScaleX === 'number' ? textStyle.minScaleX : 0.5
  const initialScaleX = typeof textStyle.scaleX === 'number' ? textStyle.scaleX : 1
  const [scaleX, setScaleX] = useState(initialScaleX)

  useIsomorphicLayoutEffect(() => {
    const recalculateScale = () => {
      if (!fitInBox) {
        setScaleX(1)
        return
      }

      const wrapper = wrapperRef.current
      const inner = innerRef.current

      if (!wrapper || !inner) {
        return
      }

      const nextScaleX = calculateTextScaleX({
        textWidth: inner.scrollWidth,
        containerWidth: wrapper.clientWidth,
        fitInBox: true,
        minScaleX,
      })

      setScaleX((currentScaleX) => (currentScaleX === nextScaleX ? currentScaleX : nextScaleX))
    }

    recalculateScale()

    if (typeof document !== 'undefined' && 'fonts' in document && document.fonts?.ready) {
      let cancelled = false

      void document.fonts.ready.then(() => {
        if (!cancelled) {
          recalculateScale()
        }
      })

      return () => {
        cancelled = true
      }
    }

    return undefined
  }, [
    content,
    fitInBox,
    minScaleX,
    textStyle.fontFamily,
    textStyle.fontSize,
    textStyle.width,
  ])

  const wrapperStyle = useMemo<CSSProperties>(
    () => ({
      ...style,
      color: undefined,
      fontFamily: undefined,
      fontSize: undefined,
      whiteSpace: undefined,
      lineHeight: 1.1,
    }),
    [style],
  )

  const innerStyle = useMemo<CSSProperties>(
    () => ({
      color: textStyle.color,
      display: 'inline-block',
      fontFamily: textStyle.fontFamily,
      fontSize: textStyle.fontSize,
      transform: fitInBox ? `scaleX(${scaleX})` : undefined,
      transformOrigin: 'left center',
      whiteSpace: 'nowrap',
    }),
    [fitInBox, scaleX, textStyle.color, textStyle.fontFamily, textStyle.fontSize],
  )

  return (
    <div
      ref={wrapperRef}
      data-kind='text'
      style={wrapperStyle}
    >
      <span
        ref={innerRef}
        style={innerStyle}
      >
        {content}
      </span>
    </div>
  )
}

function renderShapeElement(element: TemplateShapeElement, style: CSSProperties) {
  return (
    <div
      key={element.id}
      data-kind='shape'
      style={style}
    />
  )
}

function renderImageElement(layout: PreviewElementLayout & { element: TemplateImageElement }) {
  const { element, style, content } = layout
  return (
    <div
      key={element.id}
      data-kind='image'
      data-object-fit={element.objectFit}
      data-placeholder={element.assetId ? undefined : 'true'}
      style={{
        ...style,
        objectFit: element.objectFit,
      }}
    >
      {content}
    </div>
  )
}

function renderElement(layout: PreviewElementLayout, template: TemplateContract) {
  const { element, style } = layout

  if (element.kind === 'text') {
    return <TextPreviewElement key={element.id} {...(layout as PreviewElementLayout & { element: TemplateTextElement })} />
  }

  if (element.kind === 'shape') {
    return renderShapeElement(element, style)
  }

  if (element.kind === 'image') {
    return renderImageElement(layout as PreviewElementLayout & { element: TemplateImageElement })
  }

  return null
}

export function PreviewCanvas({ template, width, height, className }: PreviewCanvasProps) {
  const frame = calculatePreviewFrame(template.canvas.width, template.canvas.height, width, height)
  const layout = calculatePreviewLayout(template, frame)
  const previewBackgroundAsset = getPreviewBackgroundAsset(template)

  return (
    <div
      className={cx(className)}
      data-testid='preview-canvas'
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        background: '#0f172a',
      }}
    >
      <div
        data-testid='preview-frame'
        style={{
          position: 'absolute',
          left: frame.x,
          top: frame.y,
          width: frame.width,
          height: frame.height,
          overflow: 'hidden',
          background: '#111827',
        }}
      >
        {previewBackgroundAsset ? (
          <img
            alt=''
            aria-hidden='true'
            src={previewBackgroundAsset.source.value}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: 0.24,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        ) : null}
        {layout.map((item) => renderElement(item, template))}
      </div>
    </div>
  )
}
