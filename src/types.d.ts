import type { electronFetchPreloadExpose } from './preload'

export interface Proxy {
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

export interface ProxyConfig {
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
export interface ClientOptions {
  maxRedirects?: number
  timeout?: number
  proxy?: Proxy
  // ipcRenderer key
  ipcRendererKey?: string
}
// 增强错误类型定义
export type ErrorCode =
  | 'INIT_ERROR'
  | 'ID_NOT_FOUND'
  | 'ABORTED'
  | 'TIMEOUT'
  | 'BODY_ERROR'
  | 'IPC_NOT_FOUND'
  | 'STREAM_ERROR'

// 优化ClientConfig类型
export interface ClientConfig {
  method: string
  url: string
  headers?: HeadersInit
  data?: ArrayBuffer | null
  maxRedirects?: number
  timeout?: number
  proxy?: Proxy
}

export interface FetchSendResponse {
  responseId: string
  status: number
  statusText: string
  headers: [string, string][]
  url: string
}
export interface FetchMapValue {
  config: ClientConfig
  abortController?: AbortController
  request?: Request
  response?: Response
  reader?: ReadableStreamDefaultReader<Uint8Array>
}
export type ElectronFetchPreloadExpose = typeof electronFetchPreloadExpose
