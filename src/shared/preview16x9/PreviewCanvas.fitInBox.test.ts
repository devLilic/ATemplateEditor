import { describe, expect, it } from 'vitest'
import { createDefaultTemplate } from '../template-contract/templateDefaults'
import type { TemplateContract, TemplateTextElement } from '../template-contract/templateContract'
import * as PreviewCanvasModule from './PreviewCanvas'

const { calculatePreviewFrame, calculatePreviewLayout } = PreviewCanvasModule
const calculateTextScaleX = (PreviewCanvasModule as any).calculateTextScaleX

function createFitInBoxTemplate(input: {
  title?: string
  fontSize?: number
  fontFamily?: string
  width?: number
  minScaleX?: number
} = {}): TemplateContract {
  const template = createDefaultTemplate({
    titlePreview: input.title ?? 'Breaking News',
  })
  const titleElement = template.elements[0] as TemplateTextElement

  return {
    ...template,
    elements: [
      {
        ...titleElement,
        size: {
          ...titleElement.size,
          width: input.width ?? titleElement.size.width,
        },
        style: {
          ...titleElement.style,
          fontSize: input.fontSize ?? titleElement.style.fontSize,
          fontFamily: input.fontFamily ?? titleElement.style.fontFamily,
        },
        behavior: {
          fitInBox: true,
          fitMode: 'scaleX',
          minScaleX: input.minScaleX,
        },
      } as TemplateTextElement,
    ],
  }
}

describe('calculateTextScaleX', () => {
  it('defaults minScaleX to 0.5', () => {
    expect(
      calculateTextScaleX({
        textWidth: 400,
        containerWidth: 100,
        fitInBox: true,
      }),
    ).toBe(0.5)
  })

  it('returns 1 when the text already fits inside the container', () => {
    expect(
      calculateTextScaleX({
        textWidth: 240,
        containerWidth: 320,
        fitInBox: true,
        minScaleX: 0.5,
      }),
    ).toBe(1)
  })

  it('returns containerWidth / textWidth when the text overflows', () => {
    expect(
      calculateTextScaleX({
        textWidth: 400,
        containerWidth: 200,
        fitInBox: true,
        minScaleX: 0.25,
      }),
    ).toBe(0.5)
  })

  it('does not go below minScaleX', () => {
    expect(
      calculateTextScaleX({
        textWidth: 1000,
        containerWidth: 100,
        fitInBox: true,
        minScaleX: 0.4,
      }),
    ).toBe(0.4)
  })
})

describe('calculatePreviewLayout fitInBox text behavior', () => {
  it('marks scaleX fit-in-box text styles when behavior.fitInBox is enabled', () => {
    const template = createFitInBoxTemplate()
    const frame = calculatePreviewFrame(template.canvas.width, template.canvas.height, 960, 540)
    const [layout] = calculatePreviewLayout(template, frame)
    const style = layout.style as Record<string, unknown>

    expect(style.fitInBox).toBe(true)
    expect(style.fitMode).toBe('scaleX')
  })

  it('exposes the effective minScaleX as 0.5 by default', () => {
    const template = createFitInBoxTemplate()
    const frame = calculatePreviewFrame(template.canvas.width, template.canvas.height, 960, 540)
    const [layout] = calculatePreviewLayout(template, frame)
    const style = layout.style as Record<string, unknown>

    expect(style.minScaleX).toBe(0.5)
  })

  it('recalculates based on text, fontSize, and fontFamily inputs', () => {
    const compact = createFitInBoxTemplate({
      title: 'Short',
      fontSize: 48,
      fontFamily: 'Arial',
      width: 600,
    })
    const expandedText = createFitInBoxTemplate({
      title: 'Extremely long lower third title that should compress',
      fontSize: 48,
      fontFamily: 'Arial',
      width: 600,
    })
    const largerFont = createFitInBoxTemplate({
      title: 'Short',
      fontSize: 96,
      fontFamily: 'Arial',
      width: 600,
    })
    const otherFont = createFitInBoxTemplate({
      title: 'Short',
      fontSize: 48,
      fontFamily: 'Times New Roman',
      width: 600,
    })
    const compactFrame = calculatePreviewFrame(compact.canvas.width, compact.canvas.height, 960, 540)

    const compactScaleX = (calculatePreviewLayout(compact, compactFrame)[0].style as Record<string, unknown>)
      .scaleX
    const expandedTextScaleX = (
      calculatePreviewLayout(expandedText, compactFrame)[0].style as Record<string, unknown>
    ).scaleX
    const largerFontScaleX = (
      calculatePreviewLayout(largerFont, compactFrame)[0].style as Record<string, unknown>
    ).scaleX
    const otherFontScaleX = (
      calculatePreviewLayout(otherFont, compactFrame)[0].style as Record<string, unknown>
    ).scaleX

    expect(expandedTextScaleX).not.toBe(compactScaleX)
    expect(largerFontScaleX).not.toBe(compactScaleX)
    expect(otherFontScaleX).not.toBe(compactScaleX)
  })
})
