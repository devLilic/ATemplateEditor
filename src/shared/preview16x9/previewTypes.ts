import type { TemplateContract } from '../template-contract/templateContract'

export interface Preview16x9Input {
  template: TemplateContract
  data?: Record<string, string>
  mode?: 'editor' | 'viewer'
}
