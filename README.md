# ElectronPluginFetch

Features:

- Bundle with [tsup](https://github.com/egoist/tsup)
- Test with [vitest](https://vitest)

## Usage

```bash

pnpm add electron-plugin-fetch
```

```ts
//  electron/main.ts
import { registerElectronFetch } from 'electron-plugin-fetch/plugin'
// ...code
registerElectronFetch()
```

```ts
//  electron/renderer.ts
import { contextBridge } from 'electron'
import { electronFetchPreloadExpose } from 'electron-plugin-fetch/plugin'
contextBridge.exposeInMainWorld('ipcRenderer', { ...electronFetchPreloadExpose })
```

```ts
// index.ts
import { fetch } from 'electron-plugin-fetch'
fetch('http://example.com')
```

```ts
import axios from 'axios'
// axios.ts
// AxiosAdapter
import { electronFetchAdapter } from 'electron-plugin-fetch'
axios.defaults.adapter = electronFetchAdapter
```

## Options

```ts
export type Options = RequestInit & {
  maxRedirects?: number // 最大重定向次数 未实现
  timeout?: number // 超时时间
  proxy?: Proxy // 代理 为实现
  ipcRendererKey?: string // ipcRenderer key 默认 ipcRenderer
}
```

## License

MIT
