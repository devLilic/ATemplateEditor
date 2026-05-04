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
  TemplateBackgroundLayerContract,
  TemplateContract,
  TemplateImageLayerContract,
  TemplateLayer,
  TemplateShapeLayerContract,
  TemplateTextLayerContract,
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
  element: TemplateLayer
  style: CSSProperties
  content?: string
  assetPath?: string
}

interface TextPreviewRuntimeStyle extends CSSProperties {
  fitInBox?: boolean
  fitMode?: 'scaleX'
  minScaleX?: number
  scaleX?: number
  whiteSpace?: 'nowrap' | 'normal'
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

function isLayerVisible(template: TemplateContract, layer: TemplateLayer) {
  if (layer.visible === false) {
    return false
  }

  if (layer.visibility.mode !== 'whenFieldHasValue' || !layer.visibility.fieldId) {
    return true
  }

  const field =
    template.fields.find((currentField) => currentField.id === layer.visibility.fieldId) ??
    template.editableFields.find((editableField) => editableField.id === layer.visibility.fieldId)

  if (!field) {
    return false
  }

  return getTemplateFieldValue(template, field.id).trim().length > 0
}

function getPreviewBackgroundAsset(template: TemplateContract): TemplateAsset | undefined {
  const assetId =
    template.preview.background.type === 'image'
      ? template.preview.background.assetId
      : template.preview.background.type === 'asset'
        ? template.preview.background.assetId
        : template.metadata.previewBackgroundAssetId ?? template.metadata.referenceFrameAssetId

  if (!assetId) {
    return undefined
  }

  return template.assets.find((asset) => asset.id === assetId)
}

function getPreviewFrameBackground(template: TemplateContract) {
  if (template.preview.background.type === 'color') {
    return template.preview.background.value
  }

  return '#111827'
}

function resolveAssetPath(template: TemplateContract, assetId?: string, fallbackPath?: string) {
  if (assetId) {
    const asset = template.assets.find((currentAsset) => currentAsset.id === assetId)

    if (asset?.path) {
      return asset.path
    }
  }

  return fallbackPath
}

export function calculatePreviewLayout(
  template: TemplateContract,
  frame: PreviewFrameLayout,
): PreviewElementLayout[] {
  return [...template.layers]
    .filter((layer) => isLayerVisible(template, layer))
    .sort((left, right) => left.zIndex - right.zIndex)
    .flatMap<PreviewElementLayout>((layer) => {
      if (layer.type === 'group') {
        return []
      }

      const baseStyle: CSSProperties = {
        position: 'absolute',
        left: layer.box.x * frame.scale,
        top: layer.box.y * frame.scale,
        width: layer.box.width * frame.scale,
        height: layer.box.height * frame.scale,
        overflow: 'hidden',
        zIndex: layer.zIndex,
        opacity: layer.opacity ?? 1,
        pointerEvents: 'none',
      }

      if (layer.type === 'text') {
        const textLayer = layer as TemplateTextLayerContract
        const textStyle = {
          fontFamily: textLayer.style?.fontFamily ?? 'IBM Plex Sans',
          fontSize: textLayer.style?.fontSize ?? 48,
          color: textLayer.style?.color ?? '#FFFFFF',
          textAlign: textLayer.style?.textAlign ?? 'left',
        }
        const content = textLayer.fieldId
          ? getTemplateFieldValue(template, textLayer.fieldId)
          : textLayer.fallbackText ?? ''
        const behavior = {
          fitInBox: textLayer.behavior?.fitInBox ?? true,
          fitMode: textLayer.behavior?.fitMode ?? 'scaleX',
          minScaleX: textLayer.behavior?.minScaleX ?? 0.65,
          whiteSpace: textLayer.behavior?.whiteSpace ?? 'nowrap',
        }
        const scaleX = calculateTextScaleX({
          textWidth: estimateTextWidth(
            content,
            textStyle.fontSize * frame.scale,
            textStyle.fontFamily,
          ),
          containerWidth: textLayer.box.width * frame.scale,
          fitInBox: behavior.fitInBox && behavior.fitMode === 'scaleX',
          minScaleX: behavior.minScaleX,
        })

        return [
          {
            element: textLayer,
            content,
            style: {
              ...baseStyle,
              color: textStyle.color,
              fontFamily: textStyle.fontFamily,
              fontSize: textStyle.fontSize * frame.scale,
              fitInBox: behavior.fitInBox,
              fitMode: behavior.fitMode,
              minScaleX: behavior.minScaleX,
              scaleX,
              textAlign: textStyle.textAlign,
              whiteSpace: behavior.whiteSpace,
              transform:
                typeof textLayer.rotation === 'number' && textLayer.rotation !== 0
                  ? `rotate(${textLayer.rotation}deg)`
                  : undefined,
              transformOrigin: 'top left',
            } as TextPreviewRuntimeStyle,
          },
        ]
      }

      if (layer.type === 'shape') {
        const shapeLayer = layer as TemplateShapeLayerContract
        const isLine = shapeLayer.shape === 'line'
        const borderRadius =
          shapeLayer.shape === 'ellipse'
            ? '9999px'
            : shapeLayer.style.borderRadius * frame.scale

        return [
          {
            element: shapeLayer,
            style: {
              ...baseStyle,
              background: isLine ? 'transparent' : shapeLayer.style.fill,
              borderRadius,
              boxSizing: 'border-box',
              borderColor: shapeLayer.style.stroke,
              borderStyle: shapeLayer.style.strokeWidth > 0 ? 'solid' : undefined,
              borderWidth: isLine ? undefined : shapeLayer.style.strokeWidth * frame.scale,
              borderTop: isLine
                ? `${shapeLayer.style.strokeWidth * frame.scale}px solid ${shapeLayer.style.stroke}`
                : undefined,
              height: isLine ? Math.max(shapeLayer.style.strokeWidth * frame.scale, 1) : baseStyle.height,
              top: isLine
                ? layer.box.y * frame.scale + (layer.box.height * frame.scale) / 2
                : baseStyle.top,
            },
          },
        ]
      }

      if (layer.type === 'image') {
        const imageLayer = layer as TemplateImageLayerContract
        const imageStyle = {
          objectFit: imageLayer.style?.objectFit ?? 'contain',
          objectPosition: imageLayer.style?.objectPosition ?? 'center',
        }
        const assetPath = resolveAssetPath(template, imageLayer.assetId, imageLayer.fallbackPath)
        const content = assetPath
          ? undefined
          : imageLayer.assetId
            ? 'Missing image asset'
            : 'Image placeholder'

        return [
          {
            element: imageLayer,
            content,
            assetPath,
            style: {
              ...baseStyle,
              alignItems: 'center',
              background: '#1f2937',
              border: assetPath ? undefined : '1px dashed #4b5563',
              color: '#9ca3af',
              display: 'flex',
              fontSize: 12,
              justifyContent: 'center',
              textAlign: 'center',
            },
          },
        ]
      }

      if (layer.type === 'background') {
        const backgroundLayer = layer as TemplateBackgroundLayerContract
        const backgroundStyle = {
          fill: backgroundLayer.style?.fill ?? '#111827',
          assetId: backgroundLayer.style?.assetId,
          objectFit: backgroundLayer.style?.objectFit ?? 'cover',
        }
        const assetPath = resolveAssetPath(template, backgroundStyle.assetId)

        return [
          {
            element: backgroundLayer,
            assetPath,
            style: {
              ...baseStyle,
              background: backgroundStyle.fill,
            },
          },
        ]
      }

      return []
    })
}

function TextPreviewElement({
  element,
  style,
  content,
}: PreviewElementLayout & { element: TemplateTextLayerContract }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const innerRef = useRef<HTMLSpanElement | null>(null)
  const textStyle = style as TextPreviewRuntimeStyle
  const fitInBox = textStyle.fitInBox === true && textStyle.fitMode === 'scaleX'
  const minScaleX = typeof textStyle.minScaleX === 'number' ? textStyle.minScaleX : 0.65
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
  }, [content, fitInBox, minScaleX, textStyle.fontFamily, textStyle.fontSize, textStyle.width])

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
      whiteSpace: textStyle.whiteSpace ?? 'nowrap',
    }),
    [fitInBox, scaleX, textStyle.color, textStyle.fontFamily, textStyle.fontSize, textStyle.whiteSpace],
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

function renderShapeElement(element: TemplateShapeLayerContract, style: CSSProperties) {
  return (
    <div
      key={element.id}
      data-kind='shape'
      data-shape={element.shape}
      style={style}
    />
  )
}

function renderImageElement(layout: PreviewElementLayout & { element: TemplateImageLayerContract }) {
  const { element, style, content, assetPath } = layout

  if (assetPath) {
    return (
        <img
          key={element.id}
          alt=''
          aria-hidden='true'
          data-kind='image'
          data-object-fit={element.style?.objectFit ?? 'contain'}
          src={assetPath}
          style={{
            ...style,
            objectFit: element.style?.objectFit ?? 'contain',
            objectPosition: element.style?.objectPosition ?? 'center',
          }}
        />
      )
  }

  return (
    <div
      key={element.id}
      data-kind='image'
      data-object-fit={element.style?.objectFit ?? 'contain'}
      data-placeholder='true'
      style={style}
    >
      {content}
    </div>
  )
}

function renderBackgroundLayer(
  layout: PreviewElementLayout & { element: TemplateBackgroundLayerContract },
) {
  const { element, style, assetPath } = layout

  return (
    <div
      key={element.id}
      data-kind='background'
      style={style}
    >
      {assetPath ? (
        <img
          alt=''
          aria-hidden='true'
          src={assetPath}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: element.style?.objectFit ?? 'cover',
          }}
        />
      ) : null}
    </div>
  )
}

function renderElement(layout: PreviewElementLayout) {
  const { element, style } = layout

  if (element.type === 'text') {
    return <TextPreviewElement key={element.id} {...(layout as PreviewElementLayout & { element: TemplateTextLayerContract })} />
  }

  if (element.type === 'shape') {
    return renderShapeElement(element as TemplateShapeLayerContract, style)
  }

  if (element.type === 'image') {
    return renderImageElement(layout as PreviewElementLayout & { element: TemplateImageLayerContract })
  }

  if (element.type === 'background') {
    return renderBackgroundLayer(layout as PreviewElementLayout & { element: TemplateBackgroundLayerContract })
  }

  return null
}

function renderSafeArea(frame: PreviewFrameLayout, marginX: number, marginY: number) {
  const insetX = marginX * frame.scale
  const insetY = marginY * frame.scale

  return (
    <div
      aria-hidden='true'
      data-preview-overlay='safe-area'
      style={{
        position: 'absolute',
        left: insetX,
        top: insetY,
        width: frame.width - insetX * 2,
        height: frame.height - insetY * 2,
        border: '1px dashed rgba(34, 211, 238, 0.6)',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        zIndex: 999,
      }}
    />
  )
}

function renderLayerBounds(layout: PreviewElementLayout[]) {
  return layout.map((item) => (
    <div
      key={`bounds-${item.element.id}`}
      aria-hidden='true'
      data-preview-overlay='layer-bounds'
      style={{
        position: 'absolute',
        left: item.style.left,
        top: item.style.top,
        width: item.style.width,
        height: item.style.height,
        border: '1px dashed rgba(96, 165, 250, 0.7)',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        zIndex: 998,
      }}
    />
  ))
}

export function PreviewCanvas({ template, width, height, className }: PreviewCanvasProps) {
  const frame = calculatePreviewFrame(template.canvas.width, template.canvas.height, width, height)
  const layout = calculatePreviewLayout(template, frame)
  const previewBackgroundAsset = getPreviewBackgroundAsset(template)
  const previewFrameBackground = getPreviewFrameBackground(template)
  const safeArea = template.canvas.safeArea ?? {
    enabled: true,
    marginX: 80,
    marginY: 60,
  }

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
          background: previewFrameBackground,
        }}
      >
        {previewBackgroundAsset ? (
          <img
            alt=''
            aria-hidden='true'
            src={previewBackgroundAsset.path}
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
        {layout.map((item) => renderElement(item))}
        {template.preview.showLayerBounds ? renderLayerBounds(layout) : null}
        {template.preview.showSafeArea && safeArea.enabled
          ? renderSafeArea(frame, safeArea.marginX, safeArea.marginY)
          : null}
      </div>
    </div>
  )
}
