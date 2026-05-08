import { describe, expect, it } from 'vitest'
import { createDefaultTemplate } from '@/shared/template-contract/templateDefaults'
import {
  createEmptyTemplate,
  createTextLayer,
  type TemplateContract,
} from '@/shared/template-contract/templateContract'
import {
  exportTemplateToJson,
  importTemplateFromJson,
  parseTemplateJson,
} from './templateJsonIO'

const FINAL_TEMPLATE_ROOT_KEYS = [
  'schemaVersion',
  'id',
  'name',
  'description',
  'canvas',
  'output',
  'fields',
  'assets',
  'layers',
  'preview',
  'metadata',
]

function createFinalTemplateFixture(): TemplateContract {
  const template = createDefaultTemplate({
    name: 'Exported Template',
  })

  return {
    schemaVersion: template.schemaVersion,
    id: template.id,
    name: template.name,
    description: template.description,
    canvas: template.canvas,
    output: template.output,
    fields: template.fields,
    assets: template.assets,
    layers: template.layers,
    preview: template.preview,
    metadata: template.metadata,
  } as TemplateContract
}

function createInvalidTemplateFixture(): TemplateContract {
  return {
    ...createFinalTemplateFixture(),
    name: '',
  }
}

describe('templateJsonIO', () => {
  it('exportTemplateToJson produces the final root contract only', () => {
    const template = createFinalTemplateFixture()

    const json = exportTemplateToJson(template)
    const parsed = JSON.parse(json) as Record<string, unknown>

    expect(typeof json).toBe('string')
    expect(parsed.schemaVersion).toBe(template.schemaVersion)
    expect(parsed.id).toBe(template.id)
    expect(parsed.name).toBe(template.name)
    expect(parsed.canvas).toEqual(template.canvas)
    expect(parsed.output).toEqual(template.output)
    expect(parsed.fields).toEqual(template.fields)
    expect(parsed.assets).toEqual(template.assets)
    expect(parsed.layers).toEqual(template.layers)
    expect(parsed.preview).toEqual(template.preview)
    expect(parsed.metadata).toEqual(template.metadata)
    expect(Object.keys(parsed).sort()).toEqual(FINAL_TEMPLATE_ROOT_KEYS.slice().sort())
    expect(json).toContain('\n  "schemaVersion"')
    expect(json).toContain('\n  "id"')
  })

  it('exportTemplateToJson omits editor state, runtime state, and legacy fields', () => {
    const template = {
      ...createFinalTemplateFixture(),
      selectedLayerId: 'layer-1',
      selectedElementId: 'element-1',
      openPanels: ['layers', 'output'],
      zoom: 1.25,
      undoStack: [{ id: 'undo-1' }],
      osc: {
        target: {
          host: '127.0.0.1',
          port: 9000,
        },
      },
      onAir: {
        mode: 'timed',
      },
      editableFields: [
        {
          id: 'title',
          key: 'title',
          label: 'Title',
          type: 'text',
          required: false,
          defaultValue: 'Legacy title',
        },
      ],
      bindings: [
        {
          id: 'binding-1',
          fieldKey: 'title',
          elementId: 'element-1',
          targetProperty: 'text',
        },
      ],
      previewData: {
        title: 'Legacy preview',
      },
      fallbackValues: {
        title: 'Legacy fallback',
      },
    } as unknown as TemplateContract & Record<string, unknown>

    const json = exportTemplateToJson(template)
    const parsed = JSON.parse(json) as Record<string, unknown>

    expect(parsed).not.toHaveProperty('selectedLayerId')
    expect(parsed).not.toHaveProperty('selectedElementId')
    expect(parsed).not.toHaveProperty('openPanels')
    expect(parsed).not.toHaveProperty('zoom')
    expect(parsed).not.toHaveProperty('undoStack')
    expect(parsed).not.toHaveProperty('osc')
    expect(parsed).not.toHaveProperty('onAir')
    expect(parsed).not.toHaveProperty('editableFields')
    expect(parsed).not.toHaveProperty('bindings')
    expect(parsed).not.toHaveProperty('previewData')
    expect(parsed).not.toHaveProperty('fallbackValues')
  })

  it('parseTemplateJson parses a valid final-contract JSON template', () => {
    const template = createFinalTemplateFixture()
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

  it('importTemplateFromJson imports a valid final-contract template', () => {
    const template = createFinalTemplateFixture()
    const json = JSON.stringify(template)

    const result = importTemplateFromJson(json)

    expect(result.status).toBe('success')

    if (result.status === 'success') {
      expect(result.template).toEqual(template)
    }
  })

  it('importTemplateFromJson rejects templates without schemaVersion', () => {
    const templateWithoutSchemaVersion = {
      ...createFinalTemplateFixture(),
    } as Record<string, unknown>
    delete templateWithoutSchemaVersion.schemaVersion

    const result = importTemplateFromJson(JSON.stringify(templateWithoutSchemaVersion))

    expect(result.status).toBe('error')

    if (result.status === 'error') {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'schemaVersion',
          }),
        ]),
      )
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

  it('importTemplateFromJson applies compatible fallbacks for missing non-breaking fields', () => {
    const defaults = createEmptyTemplate()
    const importedTemplate = createFinalTemplateFixture() as Record<string, unknown>

    delete importedTemplate.description
    importedTemplate.canvas = {
      ...defaults.canvas,
    }
    delete (importedTemplate.canvas as Record<string, unknown>).safeArea
    importedTemplate.output = {}
    importedTemplate.metadata = {
      ...defaults.metadata,
    }
    delete (importedTemplate.metadata as Record<string, unknown>).tags

    const result = importTemplateFromJson(JSON.stringify(importedTemplate))

    expect(result.status).toBe('success')

    if (result.status === 'success') {
      expect(result.template.description).toBe('')
      expect(result.template.canvas.safeArea).toEqual(defaults.canvas.safeArea)
      expect(result.template.output.liveboard).toEqual({
        templateName: '',
      })
      expect(result.template.metadata.tags).toEqual([])
    }
  })

  it('importTemplateFromJson converts legacy editableFields and previewData into fields and preview.sampleData', () => {
    const defaults = createEmptyTemplate()
    const legacyLayer = {
      ...createTextLayer({
        name: 'Title',
        zIndex: 0,
        fieldId: 'title',
        fallbackText: 'Legacy title',
      }),
      id: 'layer-title',
    }
    const legacyField = {
      id: 'title',
      key: 'title',
      label: 'Title',
      type: 'text',
      required: false,
      defaultValue: 'Legacy title',
    }
    const legacyTemplate = {
      schemaVersion: defaults.schemaVersion,
      id: 'legacy-template',
      name: 'Legacy Template',
      description: '',
      canvas: defaults.canvas,
      output: {
        liveboard: {
          templateName: '',
        },
      },
      fields: [],
      assets: [],
      layers: [legacyLayer],
      preview: {
        ...defaults.preview,
        sampleData: {},
      },
      metadata: defaults.metadata,
      editableFields: [legacyField],
      previewData: {
        title: 'Legacy preview',
      },
    }

    const result = importTemplateFromJson(JSON.stringify(legacyTemplate))

    expect(result.status).toBe('success')

    if (result.status === 'success') {
      expect(result.template.fields).toEqual([
        expect.objectContaining({
          id: 'title',
          label: 'Title',
          type: 'text',
          required: false,
          defaultValue: 'Legacy title',
        }),
      ])
      expect(result.template.preview.sampleData).toEqual({
        title: 'Legacy preview',
      })
      expect(result.template).not.toHaveProperty('editableFields')
      expect(result.template).not.toHaveProperty('previewData')
    }
  })

  it('preserves the template id across export and import', () => {
    const template = createFinalTemplateFixture()
    const json = exportTemplateToJson(template)
    const result = importTemplateFromJson(json)

    expect(result.status).toBe('success')

    if (result.status === 'success') {
      expect(result.template.id).toBe(template.id)
    }
  })

  it('returns a new imported object instead of reusing external objects', () => {
    const template = createFinalTemplateFixture()
    const json = exportTemplateToJson(template)
    const result = importTemplateFromJson(json)

    expect(result.status).toBe('success')

    if (result.status === 'success') {
      expect(result.template).not.toBe(template)
      expect(result.template.layers).not.toBe(template.layers)
      expect(result.template.fields).not.toBe(template.fields)
      expect(result.template.assets).not.toBe(template.assets)
      expect(result.template.preview).not.toBe(template.preview)
    }
  })
})
