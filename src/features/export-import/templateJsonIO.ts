import type { TemplateContract } from '@/shared/template-contract/templateContract'
import { validateTemplate } from '@/shared/validation/templateValidation'

export interface TemplateJsonImportError {
  path: string
  message: string
}

export type TemplateJsonImportResult =
  | { status: 'success'; template: TemplateContract }
  | { status: 'error'; errors: TemplateJsonImportError[] }

export function exportTemplateToJson(template: TemplateContract): string {
  return JSON.stringify(template, null, 2)
}

export function parseTemplateJson(json: string): TemplateJsonImportResult {
  try {
    const parsed: unknown = JSON.parse(json)
    const validation = validateTemplate(parsed)

    if (!validation.valid) {
      return {
        status: 'error',
        errors: validation.errors,
      }
    }

    return {
      status: 'success',
      template: parsed as TemplateContract,
    }
  } catch {
    return {
      status: 'error',
      errors: [
        {
          path: '$',
          message: 'Invalid JSON',
        },
      ],
    }
  }
}

export function importTemplateFromJson(json: string): TemplateJsonImportResult {
  return parseTemplateJson(json)
}
