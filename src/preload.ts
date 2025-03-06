import type { ClientConfig, FetchSendResponse } from './types'
import { ipcRenderer } from 'electron'

export const electronFetchPreloadExpose = {
  async fetch(config: ClientConfig): Promise<{ requestId: string, config: ClientConfig }> {
    return ipcRenderer.invoke('plugin:fetch', config)
  },
  async fetchCancel(id: string): Promise<void> {
    return ipcRenderer.invoke('plugin:fetch-cancel', id)
  },
  async fetchSend(id: string): Promise<FetchSendResponse> {
    return ipcRenderer.invoke('plugin:fetch-send', id)
  },
  async fetchBody(id: string): Promise<ArrayBuffer> {
    return ipcRenderer.invoke('plugin:fetch-body', id)
  },
  fetchStream(id: string) {
    return ipcRenderer.send('plugin:fetch-stream', id)
  },
  onStream(cb: (id: string, data: Uint8Array) => void) {
    ipcRenderer.on('plugin:fetch-stream-data', (_, id, data) => {
      cb(id, data)
    })
  },
  onStreamEnd(cb: (id: string) => void) {
    ipcRenderer.on('plugin:fetch-stream-end', (_, id) => {
      cb(id)
    })
  },
  onStreamError(cb: (id: string, error: any) => void) {
    ipcRenderer.on('plugin:fetch-stream-error', (_, id, error) => {
      cb(id, error)
    })
  },
}
