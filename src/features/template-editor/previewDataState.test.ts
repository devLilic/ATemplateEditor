import { describe, expect, it } from 'vitest'
import { createDefaultTemplate } from '@/shared/template-contract/templateDefaults'
import { createEmptyTemplate, type TemplateContract, type TemplateEditableField } from '@/shared/template-contract/templateContract'
import {
  applySamplePreviewData,
  createSamplePreviewData,
  getPreviewFieldValue,
  listPreviewFields,
  removeFallbackFieldValue,
  removePreviewFieldValue,
  setFallbackFieldValue,
  setPreviewFieldValue,
} from './previewDataState'

function createTemplateWithPreviewFields(): TemplateContract {
  const template = createEmptyTemplate({ name: 'Preview Template' })

  return {
    ...template,
    editableFields: [
      {
        id: 'field-title',
        key: 'title',
        label: 'Title',
        type: 'text',
        required: true,
        defaultValue: 'Default Title',
      },
      {
        id: 'field-subtitle',
        key: 'subtitle',
        label: 'Subtitle',
        type: 'text',
        required: false,
        defaultValue: 'Default Subtitle',
      },
      {
        id: 'field-footer',
        key: 'footer',
        label: 'Footer',
        type: 'text',
        required: false,
        defaultValue: '',
      },
    ],
    previewData: {
      title: 'Preview Title',
      subtitle: '',
    },
    fallbackValues: {
      title: 'Fallback Title',
      subtitle: 'Fallback Subtitle',
      footer: 'Fallback Footer',
    },
  }
}

describe('preview data state', () => {
  describe('getPreviewFieldValue', () => {
    it('returns previewData[fieldKey] when it exists and is a non-empty string', () => {
      const template = createTemplateWithPreviewFields()

      expect(getPreviewFieldValue(template, 'title')).toBe('Preview Title')
    })

    it('returns fallbackValues[fieldKey] when previewData is missing or empty', () => {
      const template = createTemplateWithPreviewFields()

      expect(getPreviewFieldValue(template, 'subtitle')).toBe('Fallback Subtitle')
      expect(getPreviewFieldValue(template, 'footer')).toBe('Fallback Footer')
    })

    it('returns editableFields defaultValue when preview and fallback are missing', () => {
      const template = {
        ...createTemplateWithPreviewFields(),
        fallbackValues: {},
      }

      expect(getPreviewFieldValue(template, 'subtitle')).toBe('Default Subtitle')
    })

    it('returns an empty string when no preview, fallback, or default value exists', () => {
      const template = createEmptyTemplate()

      expect(getPreviewFieldValue(template, 'missing')).toBe('')
    })
  })

  describe('setPreviewFieldValue', () => {
    it('sets previewData[fieldKey], returns a new template, and does not mutate the original', () => {
      const template = createTemplateWithPreviewFields()

      const nextTemplate = setPreviewFieldValue(template, 'title', 'Updated Preview Title')

      expect(nextTemplate).not.toBe(template)
      expect(nextTemplate.previewData).not.toBe(template.previewData)
      expect(nextTemplate.previewData.title).toBe('Updated Preview Title')
      expect(template.previewData.title).toBe('Preview Title')
    })
  })

  describe('setFallbackFieldValue', () => {
    it('sets fallbackValues[fieldKey], returns a new template, and does not mutate the original', () => {
      const template = createTemplateWithPreviewFields()

      const nextTemplate = setFallbackFieldValue(template, 'title', 'Updated Fallback Title')

      expect(nextTemplate).not.toBe(template)
      expect(nextTemplate.fallbackValues).not.toBe(template.fallbackValues)
      expect(nextTemplate.fallbackValues.title).toBe('Updated Fallback Title')
      expect(template.fallbackValues.title).toBe('Fallback Title')
    })
  })

  describe('removePreviewFieldValue', () => {
    it('removes the key from previewData, returns a new template, and does not mutate the original', () => {
      const template = createTemplateWithPreviewFields()

      const nextTemplate = removePreviewFieldValue(template, 'title')

      expect(nextTemplate).not.toBe(template)
      expect(nextTemplate.previewData).not.toBe(template.previewData)
      expect(nextTemplate.previewData.title).toBeUndefined()
      expect(template.previewData.title).toBe('Preview Title')
    })
  })

  describe('removeFallbackFieldValue', () => {
    it('removes the key from fallbackValues, returns a new template, and does not mutate the original', () => {
      const template = createTemplateWithPreviewFields()

      const nextTemplate = removeFallbackFieldValue(template, 'title')

      expect(nextTemplate).not.toBe(template)
      expect(nextTemplate.fallbackValues).not.toBe(template.fallbackValues)
      expect(nextTemplate.fallbackValues.title).toBeUndefined()
      expect(template.fallbackValues.title).toBe('Fallback Title')
    })
  })

  describe('listPreviewFields', () => {
    it('returns editableFields enriched with preview, fallback, and resolved values', () => {
      const template = createTemplateWithPreviewFields()

      expect(listPreviewFields(template)).toEqual([
        {
          key: 'title',
          label: 'Title',
          type: 'text',
          required: true,
          previewValue: 'Preview Title',
          fallbackValue: 'Fallback Title',
          resolvedValue: 'Preview Title',
        },
        {
          key: 'subtitle',
          label: 'Subtitle',
          type: 'text',
          required: false,
          previewValue: '',
          fallbackValue: 'Fallback Subtitle',
          resolvedValue: 'Fallback Subtitle',
        },
        {
          key: 'footer',
          label: 'Footer',
          type: 'text',
          required: false,
          previewValue: undefined,
          fallbackValue: 'Fallback Footer',
          resolvedValue: 'Fallback Footer',
        },
      ])
    })
  })

  describe('createSamplePreviewData', () => {
    it('creates preview data for all editable fields using preview, fallback, default, then empty string', () => {
      const template = createTemplateWithPreviewFields()

      expect(createSamplePreviewData(template)).toEqual({
        title: 'Preview Title',
        subtitle: 'Fallback Subtitle',
        footer: 'Fallback Footer',
      })
    })

    it('falls back to defaultValue and empty string when preview and fallback are absent', () => {
      const template = {
        ...createDefaultTemplate(),
        editableFields: [
          {
            id: 'field-a',
            key: 'headline',
            label: 'Headline',
            type: 'text',
            required: false,
            defaultValue: 'Default Headline',
          },
          {
            id: 'field-b',
            key: 'strap',
            label: 'Strap',
            type: 'text',
            required: false,
            defaultValue: '',
          },
        ] satisfies TemplateEditableField[],
        previewData: {},
        fallbackValues: {},
      }

      expect(createSamplePreviewData(template)).toEqual({
        headline: 'Default Headline',
        strap: '',
      })
    })
  })

  describe('applySamplePreviewData', () => {
    it('sets previewData from createSamplePreviewData, returns a new template, and does not mutate the original', () => {
      const template = {
        ...createTemplateWithPreviewFields(),
        previewData: {},
      }

      const nextTemplate = applySamplePreviewData(template)

      expect(nextTemplate).not.toBe(template)
      expect(nextTemplate.previewData).toEqual({
        title: 'Fallback Title',
        subtitle: 'Fallback Subtitle',
        footer: 'Fallback Footer',
      })
      expect(template.previewData).toEqual({})
    })
  })
})
