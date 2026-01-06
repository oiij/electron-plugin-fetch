export const ELECTRON_PLUGIN_FETCH = '__ELECTRON_PLUGIN_FETCH'

export const HANDLE_MAP = {
  FetchRequest: `${ELECTRON_PLUGIN_FETCH}:fetch-request`,
  FetchCancel: `${ELECTRON_PLUGIN_FETCH}:fetch-cancel`,
  FetchBody: `${ELECTRON_PLUGIN_FETCH}:fetch-body`,
  FetchStream: `${ELECTRON_PLUGIN_FETCH}:fetch-stream`,
  OnStream: `${ELECTRON_PLUGIN_FETCH}:on-stream`,
  OnStreamEnd: `${ELECTRON_PLUGIN_FETCH}:on-stream-end`,
  OnStreamError: `${ELECTRON_PLUGIN_FETCH}:on-stream-error`,
}

export const ELECTRON_PLUGIN_FETCH_API_KEY = '__ELECTRON_PLUGIN_FETCH_API'
