import { describe, expect, it } from 'vitest'
import { createEmptyTemplate, type TemplateContract } from '@/shared/template-contract/templateContract'
import {
  clearOscCommands,
  getOnAirMetadata,
  normalizeOnAirMetadata,
  setAutoHide,
  setOnAirDuration,
  setOscEnabled,
  setOscPlayCommand,
  setOscStopCommand,
  updateOnAirConfig,
  updateOscConfig,
} from './onAirMetadataState'

function createTemplateFixture(): TemplateContract {
  const template = createEmptyTemplate({
    name: 'OnAir Template',
  })

  return {
    ...template,
    onAir: {
      durationMs: 5000,
      autoHide: true,
      prerollMs: 250,
      postrollMs: 750,
    },
    osc: {
      enabled: true,
      playCommand: {
        address: '/template/play',
        args: ['lower-third', 1],
      },
      stopCommand: {
        address: '/template/stop',
        args: ['lower-third'],
      },
    },
  }
}

describe('onAirMetadataState', () => {
  describe('getOnAirMetadata', () => {
    it('returns the onAir and osc metadata values from the template', () => {
      const template = createTemplateFixture()

      expect(getOnAirMetadata(template)).toEqual({
        durationMs: 5000,
        autoHide: true,
        prerollMs: 250,
        postrollMs: 750,
        oscEnabled: true,
        playCommand: {
          address: '/template/play',
          args: ['lower-third', 1],
        },
        stopCommand: {
          address: '/template/stop',
          args: ['lower-third'],
        },
      })
    })
  })

  describe('updateOnAirConfig', () => {
    it('updates template.onAir, preserves existing values, and does not mutate the original', () => {
      const template = createTemplateFixture()

      const nextTemplate = updateOnAirConfig(template, {
        autoHide: false,
        postrollMs: 1200,
      })

      expect(nextTemplate).not.toBe(template)
      expect(nextTemplate.onAir).not.toBe(template.onAir)
      expect(nextTemplate.onAir).toEqual({
        durationMs: 5000,
        autoHide: false,
        prerollMs: 250,
        postrollMs: 1200,
      })
      expect(template.onAir).toEqual({
        durationMs: 5000,
        autoHide: true,
        prerollMs: 250,
        postrollMs: 750,
      })
    })
  })

  describe('updateOscConfig', () => {
    it('updates template.osc, preserves existing values, and does not mutate the original', () => {
      const template = createTemplateFixture()

      const nextTemplate = updateOscConfig(template, {
        enabled: false,
        stopCommand: {
          address: '/template/hard-stop',
          args: ['lower-third'],
        },
      })

      expect(nextTemplate).not.toBe(template)
      expect(nextTemplate.osc).not.toBe(template.osc)
      expect(nextTemplate.osc).toEqual({
        enabled: false,
        playCommand: {
          address: '/template/play',
          args: ['lower-third', 1],
        },
        stopCommand: {
          address: '/template/hard-stop',
          args: ['lower-third'],
        },
      })
      expect(template.osc).toEqual({
        enabled: true,
        playCommand: {
          address: '/template/play',
          args: ['lower-third', 1],
        },
        stopCommand: {
          address: '/template/stop',
          args: ['lower-third'],
        },
      })
    })
  })

  describe('setOnAirDuration', () => {
    it('sets durationMs when the value is a number >= 0 and ignores negative or NaN values', () => {
      const template = createTemplateFixture()

      const updatedTemplate = setOnAirDuration(template, 9000)
      const negativeTemplate = setOnAirDuration(template, -1)
      const nanTemplate = setOnAirDuration(template, Number.NaN)

      expect(updatedTemplate.onAir.durationMs).toBe(9000)
      expect(negativeTemplate).toBe(template)
      expect(nanTemplate).toBe(template)
    })
  })

  describe('setAutoHide', () => {
    it('sets onAir.autoHide', () => {
      const template = createTemplateFixture()

      expect(setAutoHide(template, false).onAir.autoHide).toBe(false)
    })
  })

  describe('setOscEnabled', () => {
    it('sets osc.enabled', () => {
      const template = createTemplateFixture()

      expect(setOscEnabled(template, false).osc.enabled).toBe(false)
    })
  })

  describe('setOscPlayCommand', () => {
    it('sets osc.playCommand for a non-empty address and accepts args arrays, but ignores an empty address', () => {
      const template = createTemplateFixture()

      const updatedTemplate = setOscPlayCommand(template, {
        address: '/template/new-play',
        args: ['headline', true],
      })
      const ignoredTemplate = setOscPlayCommand(template, {
        address: '',
        args: ['ignored'],
      })

      expect(updatedTemplate.osc.playCommand).toEqual({
        address: '/template/new-play',
        args: ['headline', true],
      })
      expect(ignoredTemplate).toBe(template)
    })
  })

  describe('setOscStopCommand', () => {
    it('sets osc.stopCommand for a non-empty address and accepts args arrays, but ignores an empty address', () => {
      const template = createTemplateFixture()

      const updatedTemplate = setOscStopCommand(template, {
        address: '/template/new-stop',
        args: ['headline', false],
      })
      const ignoredTemplate = setOscStopCommand(template, {
        address: '',
        args: ['ignored'],
      })

      expect(updatedTemplate.osc.stopCommand).toEqual({
        address: '/template/new-stop',
        args: ['headline', false],
      })
      expect(ignoredTemplate).toBe(template)
    })
  })

  describe('clearOscCommands', () => {
    it('clears playCommand and stopCommand without changing osc.enabled', () => {
      const template = createTemplateFixture()

      const nextTemplate = clearOscCommands(template)

      expect(nextTemplate.osc).toEqual({
        enabled: true,
        playCommand: undefined,
        stopCommand: undefined,
      })
      expect(template.osc.enabled).toBe(true)
    })
  })

  describe('normalizeOnAirMetadata', () => {
    it('ensures default onAir and osc values when they are missing and does not mutate the original', () => {
      const template = createTemplateFixture() as TemplateContract & {
        onAir?: TemplateContract['onAir']
        osc?: TemplateContract['osc']
      }
      const incompleteTemplate = {
        ...template,
        onAir: undefined,
        osc: undefined,
      } as unknown as TemplateContract

      const normalizedTemplate = normalizeOnAirMetadata(incompleteTemplate)

      expect(normalizedTemplate).not.toBe(incompleteTemplate)
      expect(normalizedTemplate.onAir).toEqual({
        durationMs: undefined,
        autoHide: false,
        prerollMs: 0,
        postrollMs: 0,
      })
      expect(normalizedTemplate.osc).toEqual({
        enabled: false,
        playCommand: undefined,
        stopCommand: undefined,
      })
      expect((incompleteTemplate as unknown as { onAir?: unknown }).onAir).toBeUndefined()
      expect((incompleteTemplate as unknown as { osc?: unknown }).osc).toBeUndefined()
    })
  })
})
