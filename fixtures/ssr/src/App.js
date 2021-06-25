/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Suspense, lazy } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import Html from './Html'
import Spinner from './Spinner'
import Layout from './Layout'
import NavBar from './NavBar'

const Comments = lazy(() => import('./Comments' /* webpackPrefetch: true */))
const Sidebar = lazy(() => import('./Sidebar' /* webpackPrefetch: true */))
const Post = lazy(() => import('./Post' /* webpackPrefetch: true */))
const Comments2 = lazy(() => import('./Comments2' /* webpackPrefetch: true */))
// 目前不存在哪一个分支即包含 fetch 也包含 ssr
// const CommentsWithReactFetch = lazy(() =>
//   import('./Comments3' /* webpackPrefetch: true */)
// )

export default function App({ assets }) {
  return (
    <Html assets={assets} title="Hello">
      <Suspense fallback={<Spinner />}>
        <ErrorBoundary FallbackComponent={Error}>
          <Content />
        </ErrorBoundary>
      </Suspense>
    </Html>
  )
}

function Content() {
  return (
    <Layout>
      <NavBar />
      <aside className="sidebar">
        <Suspense fallback={<Spinner />}>
          <Sidebar />
        </Suspense>
      </aside>
      <article className="post">
        <Suspense fallback={<Spinner />}>
          <Post />
        </Suspense>
        <section className="comments">
          <h2>Comments</h2>
          <Suspense fallback={<Spinner />}>
            <Comments />
          </Suspense>
        </section>
        <section className="comments">
          <h2>Comments for suspense fetch</h2>
          <Suspense fallback={<Spinner />}>
            <Comments2 subreddit="react" />
          </Suspense>
        </section>
        {/* <section className="comments">
          <h2>Comments for react fetch</h2>
          <Suspense fallback={<Spinner />}>
            <CommentsWithReactFetch />
          </Suspense>
        </section> */}
        <h2>Thanks for reading!</h2>
      </article>
    </Layout>
  )
}

function Error({ error }) {
  return (
    <div>
      <h1>Application Error</h1>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{error.stack}</pre>
    </div>
  )
}
