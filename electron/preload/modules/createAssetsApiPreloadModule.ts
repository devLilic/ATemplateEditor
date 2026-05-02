import type { PreloadModule } from '../../../src/shared/modules/contracts'
import { registerAssetsApi } from './assetsApi'

export function createAssetsApiPreloadModule(): PreloadModule {
  return {
    id: 'assets-api',
    register() {
      registerAssetsApi()
    },
  }
}
