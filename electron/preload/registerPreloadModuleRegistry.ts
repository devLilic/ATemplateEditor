import type { AppConfig } from '../../config/types'
import { registerPreloadModules } from '../../src/shared/modules/registry'
import { createAppApiPreloadModule } from './modules/createAppApiPreloadModule'
import { createAssetsApiPreloadModule } from './modules/createAssetsApiPreloadModule'
import { createDatabaseApiPreloadModule } from './modules/createDatabaseApiPreloadModule'
import { createI18nApiPreloadModule } from './modules/createI18nApiPreloadModule'
import { createLicensingApiPreloadModule } from './modules/createLicensingApiPreloadModule'
import { createSettingsApiPreloadModule } from './modules/createSettingsApiPreloadModule'
import { createUpdateApiPreloadModule } from './modules/createUpdateApiPreloadModule'

export function registerPreloadModuleRegistry(config: AppConfig) {
  return registerPreloadModules(
    [
      createAppApiPreloadModule(),
      createAssetsApiPreloadModule(),
      createUpdateApiPreloadModule(),
      createI18nApiPreloadModule(),
      createLicensingApiPreloadModule(),
      createDatabaseApiPreloadModule(),
      createSettingsApiPreloadModule(),
    ],
    { config },
  )
}
