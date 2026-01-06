import type { ContextBridge, IpcRenderer } from 'electron'
import type { ClientConfig, FetchSendResponse } from './types'
import process from 'node:process'
import { ELECTRON_PLUGIN_FETCH_API_KEY, HANDLE_MAP } from './config'

const { FetchRequest, FetchCancel, FetchBody, FetchStream, OnStream, OnStreamEnd, OnStreamError } = HANDLE_MAP

export function electronPluginFetchPreloadRegister(contextBridge: ContextBridge, ipcRenderer: IpcRenderer) {
  const api = {
    async fetchRequest(config: ClientConfig): Promise<FetchSendResponse> {
      return ipcRenderer.invoke(FetchRequest, config)
    },
    async fetchCancel(requestId: string): Promise<void> {
      return ipcRenderer.invoke(FetchCancel, requestId)
    },
    async fetchBody(requestId: string): Promise<ArrayBuffer> {
      return ipcRenderer.invoke(FetchBody, requestId)
    },
    fetchStream(requestId: string) {
      return ipcRenderer.send(FetchStream, requestId)
    },
    onStream(cb: (requestId: string, data: Uint8Array) => void) {
      ipcRenderer.on(OnStream, (_, requestId, data) => {
        cb(requestId, data)
      })
    },
    onStreamEnd(cb: (requestId: string) => void) {
      ipcRenderer.on(OnStreamEnd, (_, requestId) => {
        cb(requestId)
      })
    },
    onStreamError(cb: (requestId: string, error: any) => void) {
      ipcRenderer.on(OnStreamError, (_, requestId, error) => {
        cb(requestId, error)
      })
    },
  }
  if (process.contextIsolated) {
    try {
      contextBridge.exposeInMainWorld(ELECTRON_PLUGIN_FETCH_API_KEY, api)
    }
    catch (error) {
      console.error(error)
    }
  }
  else {
    window[ELECTRON_PLUGIN_FETCH_API_KEY] = api
  }
  return api
}

export type ElectronPluginFetchPreloadReturns = ReturnType<typeof electronPluginFetchPreloadRegister>

export { ELECTRON_PLUGIN_FETCH_API_KEY }
