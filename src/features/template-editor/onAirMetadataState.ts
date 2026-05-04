import type {
  TemplateContract,
  TemplateOnAirConfig,
  TemplateOscCommand,
  TemplateOscConfig,
  TemplateOscTarget,
} from '@/shared/template-contract/templateContract'

export interface OnAirMetadataSnapshot {
  mode: TemplateOnAirConfig['mode']
  durationSeconds: number | undefined
  autoHide: boolean
  prerollMs: number
  postrollMs: number
  oscEnabled: boolean
  oscTarget: TemplateOscTarget
  playCommand: TemplateOscCommand | undefined
  stopCommand: TemplateOscCommand | undefined
  resumeCommand: TemplateOscCommand | undefined
}

function getDefaultOnAirConfig(): TemplateOnAirConfig {
  return {
    mode: 'manual',
    durationSeconds: undefined,
    autoHide: false,
    prerollMs: 0,
    postrollMs: 0,
  }
}

function getDefaultOscConfig(): TemplateOscConfig {
  return {
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
  }
}

export function getOnAirMetadata(template: TemplateContract): OnAirMetadataSnapshot {
  const normalizedTemplate = normalizeOnAirMetadata(template)

  return {
    mode: normalizedTemplate.onAir.mode,
    durationSeconds: normalizedTemplate.onAir.durationSeconds,
    autoHide: normalizedTemplate.onAir.autoHide,
    prerollMs: normalizedTemplate.onAir.prerollMs,
    postrollMs: normalizedTemplate.onAir.postrollMs,
    oscEnabled: normalizedTemplate.osc.enabled,
    oscTarget: normalizedTemplate.osc.target,
    playCommand: normalizedTemplate.osc.commands.play,
    stopCommand: normalizedTemplate.osc.commands.stop,
    resumeCommand: normalizedTemplate.osc.commands.resume,
  }
}

export function normalizeOnAirMetadata(template: TemplateContract): TemplateContract {
  const defaultOnAir = getDefaultOnAirConfig()
  const defaultOsc = getDefaultOscConfig()

  return {
    ...template,
    onAir: {
      ...defaultOnAir,
      ...(template.onAir ?? {}),
    },
    osc: {
      ...defaultOsc,
      ...(template.osc ?? {}),
      target: {
        ...defaultOsc.target,
        ...(template.osc?.target ?? {}),
      },
      commands: {
        ...defaultOsc.commands,
        ...(template.osc?.commands ?? {}),
      },
    },
  }
}

export function updateOnAirConfig(
  template: TemplateContract,
  patch: Partial<TemplateOnAirConfig>,
): TemplateContract {
  const normalizedTemplate = normalizeOnAirMetadata(template)

  return {
    ...normalizedTemplate,
    onAir: {
      ...normalizedTemplate.onAir,
      ...patch,
    },
  }
}

export function updateOscConfig(
  template: TemplateContract,
  patch: Partial<TemplateOscConfig>,
): TemplateContract {
  const normalizedTemplate = normalizeOnAirMetadata(template)

  return {
    ...normalizedTemplate,
    osc: {
      ...normalizedTemplate.osc,
      ...patch,
    },
  }
}

export function setOnAirDuration(
  template: TemplateContract,
  durationSeconds: number,
): TemplateContract {
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
    return template
  }

  return updateOnAirConfig(template, {
    durationSeconds,
  })
}

export function setAutoHide(template: TemplateContract, enabled: boolean): TemplateContract {
  return updateOnAirConfig(template, {
    autoHide: enabled,
  })
}

export function setOscEnabled(template: TemplateContract, enabled: boolean): TemplateContract {
  return updateOscConfig(template, {
    enabled,
  })
}

export function setOscPlayCommand(
  template: TemplateContract,
  command: TemplateOscCommand,
): TemplateContract {
  if (typeof command.address !== 'string' || command.address.trim() === '') {
    return template
  }

  return updateOscConfig(template, {
    commands: {
      ...normalizeOnAirMetadata(template).osc.commands,
      play: command,
    },
  })
}

export function setOscStopCommand(
  template: TemplateContract,
  command: TemplateOscCommand,
): TemplateContract {
  if (typeof command.address !== 'string' || command.address.trim() === '') {
    return template
  }

  return updateOscConfig(template, {
    commands: {
      ...normalizeOnAirMetadata(template).osc.commands,
      stop: command,
    },
  })
}

export function clearOscCommands(template: TemplateContract): TemplateContract {
  return updateOscConfig(template, {
    commands: {
      ...normalizeOnAirMetadata(template).osc.commands,
      play: undefined,
      stop: undefined,
      resume: undefined,
    },
  })
}
