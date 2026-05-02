import { contextBridge } from 'electron'
import { ipcInvokeChannels } from '../../../src/shared/ipc/contracts'
import { invoke } from './shared'

export function registerAssetsApi() {
  contextBridge.exposeInMainWorld('assetsApi', {
    importImageAsset() {
      return invoke(ipcInvokeChannels.assetsImportImage)
    },
  })
}
