import type { ElectronFetchPreloadExpose } from './src/types'

declare global {
  interface Window {
    ipcRenderer?: ElectronFetchPreloadExpose
  }
}

export {}
