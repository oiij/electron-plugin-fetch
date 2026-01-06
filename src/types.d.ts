import type { PreloadReturns } from './preload'

type ProxyConfig = & {
  /**
   * The URL of the proxy server.
   */
  url: string
  /**
   * Set the `Proxy-Authorization` header using Basic auth.
   */
  basicAuth?: {
    username: string
    password: string
  }
  /**
   * A configuration for filtering out requests that shouldn't be proxied.
   * Entries are expected to be comma-separated (whitespace between entries is ignored)
   */
  noProxy?: string
}

type Proxy = & {
  /**
   * Proxy all traffic to the passed URL.
   */
  all?: string | ProxyConfig
  /**
   * Proxy all HTTP traffic to the passed URL.
   */
  http?: string | ProxyConfig
  /**
   * Proxy all HTTPS traffic to the passed URL.
   */
  https?: string | ProxyConfig
}

export type ClientOptions = & {
  maxRedirects?: number
  timeout?: number
  proxy?: Proxy
  stream?: boolean
  preload?: PreloadReturns
}

export type ClientConfig = & {
  method: string
  url: string
  headers?: HeadersInit
  data?: ArrayBuffer | null
  maxRedirects?: number
  timeout?: number
  proxy?: Proxy
}

export type FetchSendResponse = & {
  requestId: string
  status: number
  statusText: string
  headers: [string, string][]
  url: string
}
export type FetchMapValue = & {
  config: ClientConfig
  abortController?: AbortController
  request?: Request
  response?: Response
  reader?: ReadableStreamDefaultReader<Uint8Array>
}
