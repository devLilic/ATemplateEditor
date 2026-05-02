import type { CSSProperties } from 'react'
import { getTemplateFieldValue } from '../template-contract/templateDefaults'
import type {
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

function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ')
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
        return {
          element,
          content: element.sourceField
            ? getTemplateFieldValue(template, element.sourceField)
            : element.fallbackText,
          style: {
            ...baseStyle,
            color: element.style.color,
            fontFamily: element.style.fontFamily,
            fontSize: element.style.fontSize * frame.scale,
            textAlign: element.style.textAlign,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            transform: element.rotation !== 0 ? `rotate(${element.rotation}deg)` : undefined,
            transformOrigin: 'top left',
          },
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

        return {
          element,
          content: element.assetId ? `Image: ${element.assetId}` : 'Image placeholder',
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

function renderTextElement(layout: PreviewElementLayout & { element: TemplateTextElement }) {
  const { element, style, content } = layout
  return (
    <div
      key={element.id}
      data-kind='text'
      style={{
        ...style,
        lineHeight: 1.1,
      }}
    >
      {content}
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
    return renderTextElement(layout as PreviewElementLayout & { element: TemplateTextElement })
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
        {layout.map((item) => renderElement(item, template))}
      </div>
    </div>
  )
}
