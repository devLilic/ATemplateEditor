import { app, dialog, ipcMain, type BrowserWindow } from 'electron'
import { copyFile, mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { indexHtmlPath, VITE_DEV_SERVER_URL } from '../bootstrap/paths'
import { applyRuntimeSecurityPolicies } from '../security/runtimeSecurity'
import { createSecureBrowserWindow } from '../security/windowFactory'
import { ipcInvokeChannels, type IpcInvokeContract } from '../../../src/shared/ipc/contracts'
import type { AppConfig } from '../../../config/types'

async function createUniqueAssetPath(assetsDir: string, originalFileName: string) {
  const extension = path.extname(originalFileName)
  const baseName = path.basename(originalFileName, extension)
  let candidateName = originalFileName
  let counter = 1

  while (true) {
    const candidatePath = path.join(assetsDir, candidateName)

    try {
      await stat(candidatePath)
      candidateName = `${baseName}-${counter}${extension}`
      counter += 1
    } catch {
      return candidatePath
    }
  }
}

export function registerCoreIpc(config: AppConfig, getMainWindow: () => BrowserWindow | null) {
  ipcMain.handle(ipcInvokeChannels.appGetInfo, () => {
    return {
      appName: config.appName,
      environment: config.environment,
      version: app.getVersion(),
    }
  })

  ipcMain.handle(
    ipcInvokeChannels.appOpenWindow,
    (_event, payload: IpcInvokeContract[typeof ipcInvokeChannels.appOpenWindow]['request']) => {
    const childWindow = createSecureBrowserWindow({
      title: 'Child window',
    })
    applyRuntimeSecurityPolicies(childWindow)

    if (VITE_DEV_SERVER_URL) {
      childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${payload.route}`)
      return
    }

      childWindow.loadFile(indexHtmlPath, { hash: payload.route })
    },
  )

  ipcMain.handle(ipcInvokeChannels.assetsImportImage, async () => {
    const mainWindow = getMainWindow()
    const selection = mainWindow
      ? await dialog.showOpenDialog(mainWindow, {
          title: 'Import image asset',
          properties: ['openFile'],
          filters: [
            {
              name: 'Images',
              extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg'],
            },
          ],
        })
      : await dialog.showOpenDialog({
        title: 'Import image asset',
        properties: ['openFile'],
        filters: [
          {
            name: 'Images',
            extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg'],
          },
        ],
      })

    if (selection.canceled || selection.filePaths.length === 0) {
      return null
    }

    const sourceFilePath = selection.filePaths[0]!
    const originalFileName = path.basename(sourceFilePath)
    const assetsDir = path.join(app.getPath('userData'), 'assets')

    await mkdir(assetsDir, { recursive: true })

    const targetFilePath = await createUniqueAssetPath(assetsDir, originalFileName)

    await copyFile(sourceFilePath, targetFilePath)

    return {
      filePath: targetFilePath,
      originalFileName,
    }
  })
}
