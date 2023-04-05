import React, { createContext, useContext, useEffect } from 'react'
import type { Options } from 'lru-cache'
import serialize from 'serialize-javascript'
import { isBrowser } from './utils'
import { createSuspenseFetch } from './suspense'
import type { ReturnMethod, PromiseFn, Cache } from './suspense'

const context = createContext<ReturnMethod | null>(null)
export const REACT_USE_SUSPENSE_DATA = '__REACT_USE_SUSPENSE_DATA__'

interface ProviderProps<Response> {
  children?: React.ReactNode
  lifeSpan?: number
  options?: Options<string, any>
  /**
   * return fetch, peek, preload, getCache, refresh api
   */
  method?: ReturnMethod<Response>
  /**
   * use it in client, to get server resolved suspense data.
   */
  initialData?: Record<string, Response>
}

export function renderScriptHtml<Response = any>(
  cache: Cache<Response>,
  key = REACT_USE_SUSPENSE_DATA
) {
  const cacheObj: Record<string, Response | undefined> = {}

  cache.forEach((value, key) => {
    cacheObj[key] = value.response
  })

  const cacheRaw = serialize(cacheObj || {}, { isJSON: true })

  return `<script async>window.${key}=${cacheRaw}</script>`
}

// 在客户端使用，初始化数据服务器返回的数据
export function setServerCacheData<Response = any>(
  cache: Cache<Response>,
  initialData: Record<string, Response | undefined>
) {
  if (initialData) {
    const keys = Object.keys(initialData)

    for (const key of keys) {
      const keyResponse = initialData[key]

      // 存在就设置值
      if (keyResponse !== undefined) {
        cache.set(key, {
          response: keyResponse,
          key: key,
          promise: Promise.resolve()
        })
      }
    }
  }
}

export function getServerInitialData(key = REACT_USE_SUSPENSE_DATA) {
  if (window) {
    return (window as any)[key]
  }
}

export function SuspenseFetchProvider<Response = any>({
  children,
  lifeSpan = 0,
  options = {},
  method,
  initialData
}: ProviderProps<Response>) {
  // 如果 method 存在就使用传递下来的 method, 否则在内部创建新的缓存, 在 ssr 可以用这个 props
  const innerMethod = method ?? createSuspenseFetch<Response>(lifeSpan, options)

  if (initialData && isBrowser()) {
    setServerCacheData(innerMethod.getCache(), initialData)
  }

  return <context.Provider value={innerMethod}>{children}</context.Provider>
}

const suspenseFetch = createSuspenseFetch(0, {}, true)

/**
 * 如果使用 Provider 则支持自定义的缓存，否则使用全局缓存
 * @returns
 */
export function useSuspenseFetch<Response = any>(): ReturnMethod<Response> {
  const value = useContext(context) || suspenseFetch

  return value as any
}

interface UseFetchOption {
  // 重新请求在 mount 的时候
  refetchOnMount?: boolean
}

/**
 * 直接返回 fetch 函数，一般只会用到这个
 */
export function useFetch<Response = any>(
  key: string,
  fn: PromiseFn<Response>,
  { refetchOnMount = true }: UseFetchOption = {}
): Response {
  const { fetch, refresh } = useSuspenseFetch<Response>()

  useEffect(() => {
    // 是否在组件卸载的时候清空缓存，用于下一次组件 Mount 后重新发起请求，并且如果 key 发生变化也要情况之前的缓存
    return () => {
      if (refetchOnMount) {
        refresh(key)
      }
    }
  }, [key])

  return fetch(key, fn)
}
