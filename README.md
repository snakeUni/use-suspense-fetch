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
import { SuspenseFetchProvider } from 'use-suspense-fetch'

...etc

const { startWriting, abort } = pipeToNodeWritable(
    <DataProvider data={data}>
      <SuspenseFetchProvider>
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
      }
    }
  )
```

client in `fixtures/ssr/src/index.js` line 15

```tsx
import { hydrateRoot } from 'react-dom'
import App from './App'
import { SuspenseFetchProvider } from 'use-suspense-fetch'

hydrateRoot(
  document,
  <SuspenseFetchProvider>
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

- **SuspenseProvider**: if you use [support React 18 New Suspense SSR](https://github.com/reactwg/react-18/discussions/37), you have to use it in server render. It will create cache in every render.
- **useSuspenseFetch**: you can use it in Component that is inside the Suspense. It will return
  - **fetch(key: string, fn: () => Promise)**: get data from server
  - **refresh(key?: string)**: clear cache
  - **peek(key: string)**: get [key] data
  - **preload(key: string, fn: () => Promise)**: get data early
- **useFetch(key: string, fn: () => Promise)**: get data from server. It is equal to fetch.

if you use **useSuspenseFetch** or **useFetch**, you have to use **SuspenseProvider** in the top of component.

you can also use the api below, they use **global cache** and don't depend on SuspenseProvider.

- **suspenseFetch**: it it equal useFetch, you can `import suspenseFetch from 'use-suspense-fetch'`
- **refresh(key?: string)**: clear cache, you can `import { refresh } from 'use-suspense-fetch'`
- **peek(key: string)**: get [key] data, you can `import { peek } from 'use-suspense-fetch'`
- **preload(key: string, fn: () => Promise)**: use it to get data early, you can `import { preload } from 'use-suspense-fetch'`
