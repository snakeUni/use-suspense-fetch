# use-suspense-fetch

A data fetching library for React Suspense. inspired by [use-asset](https://github.com/pmndrs/use-asset)

## Feature

- use [LRU Cache](https://github.com/isaacs/node-lru-cache)
- support create custom cache
- [support React 18 New Suspense SSR](https://github.com/reactwg/react-18/discussions/37)

## Install

```js
yarn add use-suspense-fetch or npm install use-suspense-fetch
```

## Use

use react 18 **createRoot**

```ts
const fakeData = [
  "Wait, it doesn't wait for React to load?",
  'How does this even work?',
  'I like marshmallows'
]

import suspenseFetch from 'use-suspense-fetch'
import { createRoot } from 'react-dom'
import { Suspense } from 'react'

export default function Comment() {
  const res = suspenseFetch(
    'fakeData',
    () =>
      new Promise(resolve => {
        setTimeout(() => resolve(fakeData), 2000)
      })
  )

  return (
    <ul>
      {res.map(r => (
        <li>{r}</li>
      ))}
    </ul>
  )
}

function App() {
  return (
    <div>
      <Suspense>
        <Comment />
      </Suspense>
    </div>
  )
}

const root = createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**suspenseFetch** will use **globalCache**

## SSR

1. use `SuspenseFetchProvider` in server and client

server in `fixtures/ssr/server/render.js` line 43

```ts
import * as React from 'react'
// import {renderToString} from 'react-dom/server';
import { pipeToNodeWritable } from 'react-dom/server'
import App from '../src/App'
import { DataProvider } from '../src/data'
import { API_DELAY, ABORT_DELAY } from './delays'
import { SuspenseFetchProvider, renderScriptHtml } from 'use-suspense-fetch'

...etc

// get some method includes getCache
const method = createSuspenseFetch()

const { startWriting, abort } = pipeToNodeWritable(
    <DataProvider data={data}>
      <SuspenseFetchProvider method={method}>
        <App assets={assets} />
      </SuspenseFetchProvider>
    </DataProvider>,
    res,
    {
      onReadyToStream() {
        // If something errored before we started streaming, we set the error code appropriately.
        res.statusCode = didError ? 500 : 200
        res.setHeader('Content-type', 'text/html')
        res.write('<!DOCTYPE html>')
        startWriting()
      },
      onError(x) {
        didError = true
        console.error(x)
      },
      onCompleteAll() {
        // in onCompleteAll get all resolved suspense data
        const cache = method.getCache()
        // render cache to htmlStr
        const str = renderScriptHtml(cache)
        // return str
        res.write(str)
        console.log(str)
        console.log('------- complete ---------')
      }
    }
  )
```

client in `fixtures/ssr/src/index.js` line 15

```tsx
import { hydrateRoot } from 'react-dom'
import App from './App'
import { SuspenseFetchProvider, getServerInitialData } from 'use-suspense-fetch'

// get cached initialData
const initialData = getServerInitialData()

console.log('initialData:', initialData)

hydrateRoot(
  document,
  // use cache initialData, in order to avoid fetch data again in client.
  <SuspenseFetchProvider initialData={initialData}>
    <App assets={window.assetManifest} />
  </SuspenseFetchProvider>
)
```

2. use `useFetch` in Component

in `fixtures/ssr/src/Comments2.js`

```tsx
import { useFetch } from 'use-suspense-fetch'

const API_DELAY = 2000
const fakeData = [
  "Wait, it doesn't wait for React to load?",
  'How does this even work?',
  'I like marshmallows'
]

export default function Comments2({ subreddit }) {
  // if server cache has data, useFetch will use it directly, not to fetch data again.
  const response = useFetch(
    subreddit,
    () =>
      new Promise(resolve =>
        setTimeout(() => {
          resolve(fakeData)
        }, API_DELAY)
      )
  )

  console.log('post:', response)
  return (
    <ul>
      {response.map((post, i) => (
        <li key={i}>{post}</li>
      ))}
    </ul>
  )
}
```

## Api

- **SuspenseProvider**: if you use [support React 18 New Suspense SSR](https://github.com/reactwg/react-18/discussions/37), you have to use it in server render.

```ts
interface SuspenseProviderProps {
  children?: React.ReactNode
  // LRU Option
  options?: Options<string, any>
  // if method exist, it will use method, else suspenseProvider will create cache in component.
  // you can use it in server. example => fixtures/ssr/server/render.js
  method?: ReturnMethod<Response>
  // get server resolved suspense data, you can use it in client. example => fixtures/ssr/src/index.js
  initialData?: Record<string, Response>
}
```

- **useSuspenseFetch**: you can use it in Component that is inside the Suspense. It will return
  - **fetch(key: string, fn: () => Promise)**: get data from server
  - **refresh(key?: string)**: clear cache
  - **peek(key: string)**: get [key] data
  - **preload(key: string, fn: () => Promise)**: get data early
  - **getCache()**: get all cache data
- **useFetch(key: string, fn: () => Promise)**: get data from server. It is equal to fetch.
- **renderScriptHtml(cache: LRU)**: render script html string, use it in server.
- **getServerInitialData(key?: string)**: get server cache suspense data, if key not exist it will use default key. only use it in client.

if you use **useSuspenseFetch** or **useFetch**, you have to use **SuspenseProvider** in the top of component.

you can also use the api below, they use **global cache** and don't depend on SuspenseProvider.

- **suspenseFetch**: it it equal useFetch, you can `import suspenseFetch from 'use-suspense-fetch'`
- **refresh(key?: string)**: clear cache, you can `import { refresh } from 'use-suspense-fetch'`
- **peek(key: string)**: get [key] data, you can `import { peek } from 'use-suspense-fetch'`
- **preload(key: string, fn: () => Promise)**: use it to get data early, you can `import { preload } from 'use-suspense-fetch'`
