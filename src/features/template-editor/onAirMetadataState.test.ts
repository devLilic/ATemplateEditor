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
      mode: 'timed',
      durationSeconds: 5,
      autoHide: true,
      prerollMs: 250,
      postrollMs: 750,
    },
    osc: {
      enabled: true,
      target: {
        host: '127.0.0.1',
        port: 9000,
      },
      commands: {
        play: {
          address: '/template/play',
          args: ['lower-third', 1],
        },
        stop: {
          address: '/template/stop',
          args: ['lower-third'],
        },
        resume: {
          address: '/template/resume',
          args: ['lower-third'],
        },
      },
    },
  }
}

describe('onAirMetadataState', () => {
  describe('getOnAirMetadata', () => {
    it('returns the onAir and osc metadata values from the template', () => {
      const template = createTemplateFixture()

      expect(getOnAirMetadata(template)).toEqual({
        mode: 'timed',
        durationSeconds: 5,
        autoHide: true,
        prerollMs: 250,
        postrollMs: 750,
        oscEnabled: true,
        oscTarget: {
          host: '127.0.0.1',
          port: 9000,
        },
        playCommand: {
          address: '/template/play',
          args: ['lower-third', 1],
        },
        stopCommand: {
          address: '/template/stop',
          args: ['lower-third'],
        },
        resumeCommand: {
          address: '/template/resume',
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
        mode: 'timed',
        durationSeconds: 5,
        autoHide: false,
        prerollMs: 250,
        postrollMs: 1200,
      })
      expect(template.onAir).toEqual({
        mode: 'timed',
        durationSeconds: 5,
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
        commands: {
          ...template.osc.commands,
          stop: {
            address: '/template/hard-stop',
            args: ['lower-third'],
          },
        },
      })

      expect(nextTemplate).not.toBe(template)
      expect(nextTemplate.osc).not.toBe(template.osc)
      expect(nextTemplate.osc).toEqual({
        enabled: false,
        target: {
          host: '127.0.0.1',
          port: 9000,
        },
        commands: {
          play: {
            address: '/template/play',
            args: ['lower-third', 1],
          },
          stop: {
            address: '/template/hard-stop',
            args: ['lower-third'],
          },
          resume: {
            address: '/template/resume',
            args: ['lower-third'],
          },
        },
      })
      expect(template.osc).toEqual({
        enabled: true,
        target: {
          host: '127.0.0.1',
          port: 9000,
        },
        commands: {
          play: {
            address: '/template/play',
            args: ['lower-third', 1],
          },
          stop: {
            address: '/template/stop',
            args: ['lower-third'],
          },
          resume: {
            address: '/template/resume',
            args: ['lower-third'],
          },
        },
      })
    })
  })

  describe('setOnAirDuration', () => {
    it('sets durationSeconds when the value is a number >= 0 and ignores negative or NaN values', () => {
      const template = createTemplateFixture()

      const updatedTemplate = setOnAirDuration(template, 9000)
      const negativeTemplate = setOnAirDuration(template, -1)
      const nanTemplate = setOnAirDuration(template, Number.NaN)

      expect(updatedTemplate.onAir.durationSeconds).toBe(9000)
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

      expect(updatedTemplate.osc.commands.play).toEqual({
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

      expect(updatedTemplate.osc.commands.stop).toEqual({
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
        target: {
          host: '127.0.0.1',
          port: 9000,
        },
        commands: {
          play: undefined,
          stop: undefined,
          resume: undefined,
        },
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
        mode: 'manual',
        durationSeconds: undefined,
        autoHide: false,
        prerollMs: 0,
        postrollMs: 0,
      })
      expect(normalizedTemplate.osc).toEqual({
        enabled: false,
        target: {
          host: '127.0.0.1',
          port: 9000,
        },
        commands: {
          play: undefined,
          stop: undefined,
          resume: undefined,
        },
      })
      expect((incompleteTemplate as unknown as { onAir?: unknown }).onAir).toBeUndefined()
      expect((incompleteTemplate as unknown as { osc?: unknown }).osc).toBeUndefined()
    })
  })
})
