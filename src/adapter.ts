import type { AxiosPromise, AxiosResponse, InternalAxiosRequestConfig, ResponseType } from 'axios'
import type { ClientOptions } from './types'
import { AxiosError, AxiosHeaders } from 'axios'
import buildFullPath from 'axios/unsafe/core/buildFullPath.js'
import buildURL from 'axios/unsafe/helpers/buildURL.js'
import mime from 'mime/lite'
import { fetch } from './fetch'

function transform(data: BodyInit | null, type: ResponseType) {
  switch (type) {
    case 'arraybuffer': {
      return new Response(data).arrayBuffer()
    }
    case 'blob': {
      return new Response(data).blob()
    }
    case 'formdata': {
      return new Response(data).formData()
    }
    case 'json': {
      return new Response(data).json()
    }
    case 'text': {
      return new Response(data).text()
    }
    default: {
      throw new Error(`Response type unsupported type: ${type}`)
    }
  }
}
export function electronFetchAdapter(config: InternalAxiosRequestConfig): AxiosPromise {
  return new Promise((resolve, reject) => {
    const controller = new AbortController()
    const { baseURL, url, method, params, paramsSerializer, data, headers, timeout, maxRedirects, signal, validateStatus, proxy } = config
    if (data instanceof FormData) {
      headers.delete('Content-Type')
    }
    if (signal) {
      signal.onabort = () => {
        controller.abort()
      }
    }
    const _validateStatus = validateStatus || (status => status >= 200 && status < 300)
    const _url = buildURL(buildFullPath(baseURL, url), params, paramsSerializer)
    const requestConfig = {
      method,
      body: data,
      headers,
      signal: controller.signal,
      connectTimeout: timeout,
      maxRedirections: maxRedirects,
      proxy,
    } as RequestInit & ClientOptions
    fetch(_url, requestConfig).then(async (response) => {
      const { status, statusText, headers } = response
      const contentType = headers.get('content-type') ?? ''
      const responseType = config.responseType || mime.getExtension(contentType) || 'text' as any
      const _headers = new AxiosHeaders()
      headers.forEach((value, key) => {
        _headers.set(key, value)
      })
      const axiosResponse: AxiosResponse = {
        data: undefined,
        status,
        statusText,
        headers: _headers,
        config,
        request: { ...requestConfig, url: _url, responseType },
      }
      transform(response.body, responseType).then((data) => {
        axiosResponse.data = data
        return _validateStatus(status) ? resolve(axiosResponse) : reject(new AxiosError(statusText, `${status}`, config, { ...requestConfig, url: _url, responseType }, axiosResponse))
      }).catch((err) => {
        axiosResponse.data = err
        return reject(new AxiosError('fetch-error', '400', config, { ...requestConfig, url: _url, responseType }, axiosResponse))
      })
    }).catch((err) => {
      return reject(new AxiosError('fetch-error', '400', config, undefined, err))
    })
  })
}
