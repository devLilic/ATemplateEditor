import { describe, expect, it } from 'vitest'
import { createDefaultTemplate } from '@/shared/template-contract/templateDefaults'
import type { TemplateContract } from '@/shared/template-contract/templateContract'
import {
  exportTemplateToJson,
  importTemplateFromJson,
  parseTemplateJson,
} from './templateJsonIO'

function createInvalidTemplateFixture(): TemplateContract {
  return {
    ...createDefaultTemplate(),
    name: '',
  }
}

describe('templateJsonIO', () => {
  it('exportTemplateToJson returns valid formatted JSON with the expected template fields', () => {
    const template = createDefaultTemplate({
      name: 'Exported Template',
    })

    const json = exportTemplateToJson(template)
    const parsed = JSON.parse(json) as TemplateContract

    expect(typeof json).toBe('string')
    expect(parsed.schemaVersion).toBe(template.schemaVersion)
    expect(parsed.id).toBe(template.id)
    expect(parsed.name).toBe(template.name)
    expect(parsed.canvas).toEqual(template.canvas)
    expect(parsed.layers).toEqual(template.layers)
    expect(parsed.elements).toEqual(template.elements)
    expect(json).toContain('\n  "schemaVersion"')
    expect(json).toContain('\n  "id"')
  })

  it('parseTemplateJson parses valid JSON and returns the template', () => {
    const template = createDefaultTemplate()
    const json = JSON.stringify(template)

    const result = parseTemplateJson(json)

    expect(result.status).toBe('success')

    if (result.status === 'success') {
      expect(result.template).toEqual(template)
    }
  })

  it('parseTemplateJson returns errors when the JSON is invalid', () => {
    const result = parseTemplateJson('{invalid json')

    expect(result.status).toBe('error')

    if (result.status === 'error') {
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toMatchObject({
        path: '$',
        message: 'Invalid JSON',
      })
    }
  })

  it('parseTemplateJson returns errors when the parsed template is invalid', () => {
    const json = JSON.stringify(createInvalidTemplateFixture())

    const result = parseTemplateJson(json)

    expect(result.status).toBe('error')

    if (result.status === 'error') {
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toMatchObject({
        path: expect.any(String),
        message: expect.any(String),
      })
    }
  })

  it('importTemplateFromJson returns success with the imported template for valid JSON', () => {
    const template = createDefaultTemplate()
    const json = JSON.stringify(template)

    const result = importTemplateFromJson(json)

    expect(result.status).toBe('success')

    if (result.status === 'success') {
      expect(result.template).toEqual(template)
    }
  })

  it('importTemplateFromJson returns an error result for invalid JSON', () => {
    const result = importTemplateFromJson('{invalid json')

    expect(result.status).toBe('error')

    if (result.status === 'error') {
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toMatchObject({
        path: expect.any(String),
        message: expect.any(String),
      })
    }
  })

  it('importTemplateFromJson returns an error result for an invalid template', () => {
    const json = JSON.stringify(createInvalidTemplateFixture())

    const result = importTemplateFromJson(json)

    expect(result.status).toBe('error')

    if (result.status === 'error') {
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toMatchObject({
        path: expect.any(String),
        message: expect.any(String),
      })
    }
  })

  it('preserves the template id across export and import', () => {
    const template = createDefaultTemplate()
    const json = exportTemplateToJson(template)
    const result = importTemplateFromJson(json)

    expect(result.status).toBe('success')

    if (result.status === 'success') {
      expect(result.template.id).toBe(template.id)
    }
  })

  it('returns a new imported object instead of reusing external objects', () => {
    const template = createDefaultTemplate()
    const json = exportTemplateToJson(template)
    const result = importTemplateFromJson(json)

    expect(result.status).toBe('success')

    if (result.status === 'success') {
      expect(result.template).not.toBe(template)
      expect(result.template.layers).not.toBe(template.layers)
      expect(result.template.elements).not.toBe(template.elements)
    }
  })
})
