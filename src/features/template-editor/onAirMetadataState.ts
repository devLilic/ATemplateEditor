import type {
  TemplateContract,
  TemplateOnAirConfig,
  TemplateOscCommand,
  TemplateOscConfig,
} from '@/shared/template-contract/templateContract'

export interface OnAirMetadataSnapshot {
  durationMs: number | undefined
  autoHide: boolean
  prerollMs: number
  postrollMs: number
  oscEnabled: boolean
  playCommand: TemplateOscCommand | undefined
  stopCommand: TemplateOscCommand | undefined
}

function getDefaultOnAirConfig(): TemplateOnAirConfig {
  return {
    durationMs: undefined,
    autoHide: false,
    prerollMs: 0,
    postrollMs: 0,
  }
}

function getDefaultOscConfig(): TemplateOscConfig {
  return {
    enabled: false,
    playCommand: undefined,
    stopCommand: undefined,
  }
}

export function getOnAirMetadata(template: TemplateContract): OnAirMetadataSnapshot {
  const normalizedTemplate = normalizeOnAirMetadata(template)

  return {
    durationMs: normalizedTemplate.onAir.durationMs,
    autoHide: normalizedTemplate.onAir.autoHide,
    prerollMs: normalizedTemplate.onAir.prerollMs,
    postrollMs: normalizedTemplate.onAir.postrollMs,
    oscEnabled: normalizedTemplate.osc.enabled,
    playCommand: normalizedTemplate.osc.playCommand,
    stopCommand: normalizedTemplate.osc.stopCommand,
  }
}

export function normalizeOnAirMetadata(template: TemplateContract): TemplateContract {
  return {
    ...template,
    onAir: template.onAir ?? getDefaultOnAirConfig(),
    osc: template.osc ?? getDefaultOscConfig(),
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

export function setOnAirDuration(template: TemplateContract, durationMs: number): TemplateContract {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return template
  }

  return updateOnAirConfig(template, {
    durationMs,
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
    playCommand: command,
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
    stopCommand: command,
  })
}

export function clearOscCommands(template: TemplateContract): TemplateContract {
  return updateOscConfig(template, {
    playCommand: undefined,
    stopCommand: undefined,
  })
}
