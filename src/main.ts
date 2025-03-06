/// <reference lib="dom.iterable" />
import type { ClientConfig, FetchMapValue } from './types'
import { ipcMain } from 'electron'
import { nanoid } from 'nanoid'
import { FetchError } from './utils'

const fetchMap = new Map<string, FetchMapValue>()

export function registerElectronFetch() {
  ipcMain.handle('plugin:fetch', (_, config: ClientConfig) => {
    try {
      const requestId = `fetch-${Date.now()}-${nanoid()}`
      const abortController = new AbortController()
      fetchMap.set(requestId, {
        config,
        abortController,
      })
      return { requestId, config }
    }
    catch (error) {
      console.error('Failed to initialize fetch:', error)
      throw new FetchError('Failed to initialize fetch', 'INIT_ERROR')
    }
  })

  ipcMain.handle('plugin:fetch-cancel', (_, id: string) => {
    try {
      const ins = fetchMap.get(id)
      if (ins) {
        ins.abortController?.abort()
        fetchMap.delete(id)
      }
    }
    catch (error) {
      console.error('Failed to cancel fetch:', error)
    }
  })

  ipcMain.handle('plugin:fetch-send', async (_, id: string) => {
    const ins = fetchMap.get(id)
    if (!ins) {
      throw new FetchError('FetchId not found', 'ID_NOT_FOUND')
    }
    const { config, abortController } = ins
    const { method, url, headers, data, timeout } = config
    let timeoutId: NodeJS.Timeout | undefined
    try {
      if (timeout) {
        timeoutId = setTimeout(() => {
          abortController?.abort()
          fetchMap.delete(id)
          throw new FetchError('Request timeout', 'TIMEOUT')
        }, timeout)
      }

      const req = new Request(url, {
        method,
        headers,
        body: data ?? null,
        signal: abortController?.signal,
      })
      ins.request = req
      const res = await fetch(req)
      ins.response = res
      const { status, statusText, url: responseUrl, headers: resHeaders } = res
      return {
        status,
        statusText,
        headers: Array.from(resHeaders.entries()),
        url: responseUrl,
        responseId: id,
      }
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to send fetch:', error)
      throw new FetchError(errorMessage, 'FETCH_ERROR')
    }
    finally {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  })

  ipcMain.handle('plugin:fetch-body', async (_, id: string) => {
    const ins = fetchMap.get(id)
    if (!ins) {
      throw new FetchError('FetchId not found', 'ID_NOT_FOUND')
    }

    const { response } = ins
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
      console.error('Failed to read response body:', error)
      throw new FetchError('Failed to read response body', 'BODY_ERROR')
    }
    finally {
      // 清理资源
      fetchMap.delete(id)
    }
  })

  ipcMain.on('plugin:fetch-stream', async (event, id: string) => {
    const ins = fetchMap.get(id)
    if (!ins) {
      event.reply('plugin:fetch-error', id, new FetchError('FetchId not found', 'ID_NOT_FOUND'))
      return
    }

    try {
      const { response } = ins
      if (!response?.body) {
        event.reply('plugin:fetch-stream-end', id)
        return
      }

      const reader = ins.reader ?? response.body.getReader()
      ins.reader = reader

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          event.reply('plugin:fetch-stream-end', id)
          fetchMap.delete(id)
          break
        }
        event.reply('plugin:fetch-stream-data', id, value)
      }
    }
    catch (error) {
      console.error('Stream read error:', id, error)
      event.reply('plugin:fetch-error', new FetchError('Stream read failed', 'STREAM_ERROR'))
      fetchMap.delete(id)
    }
  })
}
