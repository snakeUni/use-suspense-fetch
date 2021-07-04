import LRU, { Options } from 'lru-cache'
import { isBrowser } from './utils'

export type Cache<Response = any> = LRU<string, PromiseCache<Response>>

export type PromiseFn<Response> = () => Promise<Response>

const defaultOption: Options<any, any> = {
  max: 500,
  // 默认一小时, 如果使用 createSuspense 则可以自行修改
  maxAge: 1000 * 60 * 60
}

const globalCache: Cache = new LRU(defaultOption)
const browser = isBrowser()

interface PromiseCache<Response = any> {
  promise: Promise<void>
  response?: Response
  error?: any
  key: string
}

interface HandleSuspenseFetch<Response> {
  promiseFn: PromiseFn<Response>
  cache: Cache<Response>
  key: string
  preload?: boolean
  lifeSpan?: number
}

const handleSuspenseFetch = <Response>({
  promiseFn,
  cache,
  key,
  preload = false,
  lifeSpan = 0
}: HandleSuspenseFetch<Response>) => {
  // 使用 str
  const cachedValue = cache.get(key)

  if (cachedValue) {
    if (preload) return
    // TODO 判断是否需要 return error
    if (cachedValue?.error) throw cachedValue.error
    if (cachedValue?.response) return cachedValue.response
    throw cachedValue?.promise
  }

  const cacheValue: PromiseCache<Response> = {
    key,
    promise: promiseFn()
      .then(res => {
        if (res) {
          cacheValue.response = res
        } else {
          cacheValue.response = true as any
        }
      })
      .catch(error => {
        if (error) {
          cacheValue.error = error
        } else {
          cacheValue.error = 'unknown error'
        }
      })
      .then(() => {
        if (lifeSpan > 0) {
          setTimeout(() => {
            if (cache.has(key)) {
              cache.del(key)
            }
          }, lifeSpan)
        }
      })
  }

  cache.set(key, cacheValue)
  if (!preload) throw cacheValue.promise
}

interface FetchOptions {
  lifeSpan?: number
}

/**
 * 虽然叫 use-xx 但是没有使用任何 hook
 * @param fn
 * @param args
 * @returns
 */
export default function suspenseFetch<Response = any>(
  key: string,
  fn: PromiseFn<Response>,
  option: FetchOptions = { }
): Response {
  return handleSuspenseFetch({
    promiseFn: fn,
    cache: globalCache as any,
    key: key,
    lifeSpan: option.lifeSpan || suspenseFetch.lifeSpan
  }) as Response
}

// 设置 lifeSpan
suspenseFetch.lifeSpan = 0

// 导出去的其他方法，用于全局的缓存, 但是如果是 ssr, 那么在客户端调用 refresh 是没有作用的
export function refresh(key?: string) {
  return clearInner(globalCache, key)
}

export function preload<Response = any>(key: string, fn: PromiseFn<Response>) {
  handleSuspenseFetch({
    promiseFn: fn,
    cache: globalCache as any,
    key,
    preload: true,
    lifeSpan: suspenseFetch.lifeSpan
  })
}

export function peek<Response = any>(key: string): undefined | Response {
  return globalCache.get(key)?.response
}

export interface ReturnMethod<Response = any> {
  preload: (key: string, fn: PromiseFn<Response>) => void
  refresh: (key: string) => void
  peek: (key: string) => void | Response
  fetch: (key: string, fn: PromiseFn<Response>) => Response
  /**
   * 用于获取缓存，方便在 ssr 的时候使用
   */
  getCache: () => Cache<Response>
}

function clearInner<Response>(cache: Cache<Response>, key?: string) {
  // 如果不传递第二个参数，则清空所有的缓存
  if (key === undefined) cache.reset()
  else {
    if (cache.has(key)) {
      cache.del(key)
    }
  }
}

/**
 * 创建自己的 LRU 缓存，支持配置选项
 * @param lifeSpan 过期时间
 * @param option 配置选项
 * @returns
 */
export function createSuspenseFetch<Response = any>(
  lifeSpan = 0,
  option: Options<any, any> = {}
): ReturnMethod<Response> {
  const innerOption = { ...defaultOption, ...option }
  const cache = new LRU(innerOption)

  return {
    fetch: (key: string, fn: PromiseFn<Response>) =>
      handleSuspenseFetch({
        promiseFn: fn,
        cache: cache as any,
        key,
        lifeSpan: lifeSpan
      }) as Response,
    preload: (key: string, fn: PromiseFn<Response>) =>
      void handleSuspenseFetch({
        promiseFn: fn,
        cache,
        key,
        preload: true,
        lifeSpan
      }),
    refresh: (key?: string) => clearInner(cache, key),
    peek: (key: string) => {
      return cache.get(key)?.response
    },
    getCache: () => cache
  }
}
