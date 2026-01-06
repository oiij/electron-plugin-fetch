/// <reference lib="dom.iterable" />

import type { ElectronPluginFetchPreloadReturns } from './preload'
import type { ClientOptions } from './types'
import { ELECTRON_PLUGIN_FETCH_API_KEY } from './config'

declare global {
  interface Window {
    [ELECTRON_PLUGIN_FETCH_API_KEY]?: ElectronPluginFetchPreloadReturns
  }
}

export {}

class FetchError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'FetchError'
  }
}

export async function fetch(input: URL | Request | string, options?: RequestInit & ClientOptions): Promise<Response> {
  const { maxRedirects, timeout, proxy, stream, preload, ..._init } = options ?? {}
  const defaultPreload: Partial<ElectronPluginFetchPreloadReturns> = { ...window[ELECTRON_PLUGIN_FETCH_API_KEY], ...preload }

  const { fetchRequest, fetchCancel, fetchBody, fetchStream, onStream, onStreamEnd, onStreamError } = defaultPreload
  if (!fetchRequest || !fetchCancel || !fetchBody || !fetchStream || !onStream || !onStreamEnd || !onStreamError) {
    throw new FetchError('Electron payload fetch api not found', 'API_NOT_FOUND')
  }
  const signal = _init.signal

  try {
    if (signal?.aborted) {
      throw new FetchError('Request aborted', 'ABORTED')
    }

    const headers = new Headers(_init.headers)
    const request = new Request(input, _init)

    for (const [key, value] of request.headers) {
      if (!headers.has(key)) {
        headers.set(key, value)
      }
    }

    const buffer = await request.arrayBuffer()

    const HeadersArray: [string, string][] = Array.from(headers.entries()).map(([name, val]) => [name, String(val)])

    const { status, statusText, url, headers: resHeaders, requestId } = await fetchRequest({
      method: request.method,
      url: request.url,
      headers: HeadersArray,
      data: buffer.byteLength > 0 ? buffer : null,
      maxRedirects,
      timeout,
      proxy,
    })

    const cleanup = () => {
      try {
        return fetchCancel(requestId)
      }
      catch (error) {
        console.error('Failed to cancel request:', error)
      }
    }

    if (signal?.aborted) {
      cleanup()
      throw new FetchError('Request aborted', 'ABORTED')
    }

    signal?.addEventListener('abort', cleanup, {
      signal,
    })

    let body: BodyInit | null = null
    if (stream) {
      body = new ReadableStream({
        start(controller) {
          try {
            fetchStream(requestId)
            onStream((id, data) => {
              if (id === requestId) {
                controller.enqueue(data)
              }
            })
            onStreamEnd((id) => {
              if (id === requestId) {
                controller.close()
              }
            })
            onStreamError((id, error) => {
              if (id === requestId) {
                controller.error(error)
              }
            })
          }
          catch (error) {
            controller.error(error)
          }
        },
        cancel() {
          fetchCancel(requestId)
        },
      })
    }
    else {
      body = await fetchBody(requestId)
    }
    const response = new Response(body, {
      status,
      statusText,
      headers: new Headers(resHeaders),
    })
    Object.defineProperty(response, 'url', { value: url })
    return response
  }
  catch (error) {
    if (error instanceof FetchError) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new FetchError(message, 'FETCH_ERROR')
  }
}
