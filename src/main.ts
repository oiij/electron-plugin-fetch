/// <reference lib="dom.iterable" />

import type { IpcMain } from 'electron'
import type { ClientConfig, FetchMapValue } from './types'
import { nanoid } from 'nanoid'
import { ELECTRON_PLUGIN_FETCH, HANDLE_MAP } from './config'

class FetchError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'FetchError'
  }
}

const fetchMap = new Map<string, FetchMapValue>()

export function electronPluginFetchRegister(ipcMain: IpcMain) {
  const { FetchRequest, FetchCancel, FetchBody, FetchStream, OnStream, OnStreamEnd, OnStreamError } = HANDLE_MAP
  ipcMain.handle(FetchRequest, async (_, config: ClientConfig) => {
    let timeoutId: NodeJS.Timeout | undefined

    try {
      const requestId = `${ELECTRON_PLUGIN_FETCH}:${Date.now()}-${nanoid()}`
      const abortController = new AbortController()
      const { method, url, headers, data, timeout } = config
      if (timeout) {
        timeoutId = setTimeout(() => {
          abortController?.abort()
          fetchMap.delete(requestId)
          throw new FetchError('Request timeout', 'TIMEOUT')
        }, timeout)
      }

      const req = new Request(url, {
        method,
        headers,
        body: data ?? null,
        signal: abortController?.signal,
      })
      const res = await fetch(req)

      const { status, statusText, url: responseUrl, headers: resHeaders } = res

      fetchMap.set(requestId, {
        config,
        abortController,
        request: req,
        response: res,
      })

      return {
        status,
        statusText,
        headers: Array.from(resHeaders.entries()),
        url: responseUrl,
        requestId,
      }
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to send fetch:', error)
      throw new FetchError(errorMessage, 'FETCH_REQUEST_ERROR')
    }
    finally {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  })

  ipcMain.handle(FetchCancel, (_, requestId: string) => {
    try {
      const inst = fetchMap.get(requestId)
      if (inst) {
        inst.abortController?.abort()
        fetchMap.delete(requestId)
      }
    }
    catch (error) {
      console.error('Failed to cancel fetch:', error)
    }
  })

  ipcMain.handle(FetchBody, async (_, requestId: string) => {
    const inst = fetchMap.get(requestId)
    if (!inst) {
      throw new FetchError('RequestId not found', 'ID_NOT_FOUND')
    }

    const { response } = inst
    if (!response) {
      throw new FetchError('Response not found', 'RESPONSE_NOT_FOUND')
    }

    try {
      if (response.body) {
        const buffer = await response.arrayBuffer()
        return buffer
      }
      return []
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new FetchError(errorMessage, 'FETCH_BODY_ERROR')
    }
    finally {
      // 清理资源
      fetchMap.delete(requestId)
    }
  })

  ipcMain.on(FetchStream, async (event, requestId: string) => {
    const inst = fetchMap.get(requestId)
    if (!inst) {
      event.reply(OnStreamError, requestId, new FetchError('RequestId not found', 'ID_NOT_FOUND'))
      return
    }

    try {
      const { response } = inst
      if (!response?.body) {
        event.reply(OnStreamEnd, requestId)
        return
      }

      const reader = inst.reader ?? response.body.getReader()
      inst.reader = reader

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          event.reply(OnStreamEnd, requestId)
          fetchMap.delete(requestId)
          break
        }
        event.reply(OnStream, requestId, value)
      }
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      event.reply(OnStreamError, requestId, new FetchError(errorMessage, 'FETCH_STREAM_ERROR'))
      fetchMap.delete(requestId)
    }
  })
}
export { ClientConfig }
