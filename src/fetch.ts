/// <reference lib="dom.iterable" />
import type { ClientOptions } from './types'
import { FetchError } from './utils'

export async function fetch(input: URL | Request | string, init?: RequestInit & ClientOptions): Promise<Response> {
  const { maxRedirects, timeout, proxy, ipcRendererKey = 'ipcRenderer', ..._init } = init || {}

  const { fetch, fetchCancel, fetchSend, fetchBody, fetchStream, onStream, onStreamEnd, onStreamError } = window?.[ipcRendererKey as 'ipcRenderer'] ?? {}
  if (!fetch || !fetchCancel || !fetchSend || !fetchBody || !fetchStream || !onStream || !onStreamEnd || !onStreamError) {
    throw new FetchError('ipcRenderer.fetch is not defined', 'IPC_NOT_FOUND')
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

    const { requestId } = await fetch({
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

    signal?.addEventListener('abort', cleanup)

    const { status, statusText, url, headers: resHeaders, responseId } = await fetchSend(requestId)

    const body = new ReadableStream({
      start(controller) {
        try {
          fetchStream(responseId)
          onStream((id, data) => {
            if (id === responseId) {
              controller.enqueue(data)
            }
          })
          onStreamEnd((id) => {
            if (id === responseId) {
              controller.close()
            }
          })
          onStreamError((id, error) => {
            if (id === responseId) {
              controller.error(error)
            }
          })
        }
        catch (error) {
          controller.error(error)
        }
      },
      cancel() {
        fetchCancel(responseId)
      },
    })

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
    console.error('Fetch failed:', error)
    throw new FetchError(message, 'FETCH_ERROR')
  }
}
