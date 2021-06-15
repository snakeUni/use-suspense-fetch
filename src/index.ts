import LRU, { Options } from 'lru-cache'
import deepEqual from 'fast-deep-equal'

type Cache<Response = any, Args extends any[] = any[]> = LRU<
  any,
  PromiseCache<Response, Args>
>

type PromiseFn<Response, Args extends any[]> = (
  ...args: Args
) => Promise<Response>

const defaultOption: Options<any, any> = {
  max: 500,
  // 默认一小时, 如果使用 createSuspense 则可以自行修改
  maxAge: 1000 * 60 * 60
}

const globalCache: Cache = new LRU(defaultOption)

interface PromiseCache<Response = any, Args = any[]> {
  promise: Promise<void>
  response?: Response
  error?: any
  args: Args
}

interface HandleSuspenseFetch<Response, Args extends any[]> {
  promiseFn: PromiseFn<Response, Args>
  cache: Cache<Response, Args>
  args: Args
  preload?: boolean
  lifeSpan?: number
}

const handleSuspenseFetch = <Response, Args extends any[]>({
  promiseFn,
  cache,
  args,
  preload = false,
  lifeSpan = 0
}: HandleSuspenseFetch<Response, Args>) => {
  const keys = cache.keys()

  for (const key of keys) {
    const cacheValue = cache.get(key)

    if (deepEqual(args, cacheValue?.args)) {
      if (preload) return
      if (cacheValue?.error) throw cacheValue.error
      if (cacheValue?.response) return cacheValue.response
      throw cacheValue?.promise
    }
  }

  const cacheValue: PromiseCache<Response, Args> = {
    args,
    promise: promiseFn(...args)
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
            if (cache.has(args)) {
              cache.del(args)
            }
          }, lifeSpan)
        }
      })
  }

  cache.set(args, cacheValue)
  if (!preload) throw cacheValue.promise
}

/**
 * 虽然叫 use-xx 但是病没有使用任何 hook
 * @param fn
 * @param args
 * @returns
 */
export default function suspenseFetch<
  Response = any,
  Args extends any[] = any[]
>(fn: PromiseFn<Response, Args>, ...args: Args): Response {
  return handleSuspenseFetch({
    promiseFn: fn,
    cache: globalCache as any,
    args,
    lifeSpan: suspenseFetch.lifeSpan
  }) as Response
}

// 设置 lifeSpan
suspenseFetch.lifeSpan = 0

// 导出去的其他方法，用于全局的缓存
export function clear<Args extends any[] = any>(...args: Args) {
  return clearInner(globalCache, ...args)
}

export function preload<Response = any, Args extends any[] = any>(
  fn: PromiseFn<Response, Args>,
  ...args: Args
) {
  handleSuspenseFetch({
    promiseFn: fn,
    cache: globalCache as any,
    args,
    preload: true,
    lifeSpan: suspenseFetch.lifeSpan
  })
}

export function peek<Response = any, Args extends any[] = any>(
  ...args: Args
): undefined | Response {
  return globalCache.get(args)?.response
}

interface ReturnMethod<Response = any, Args extends any[] = any[]> {
  preload: (fn: PromiseFn<Response, Args>, ...args: Args) => void
  clear: (...args: Args) => void
  peek: (...args: Args) => void | Response
  fetch: (fn: PromiseFn<Response, Args>, ...args: Args) => Response
}

function clearInner<Response, Args extends any[]>(
  cache: Cache<Response, Args>,
  ...args: Args
) {
  // 如果不传递第二个参数，则清空所有的缓存
  if (args === undefined || args.length === 0) cache.reset()
  else {
    if (cache.has(args)) {
      cache.del(args)
    }
  }
}

/**
 * 创建自己的 LRU 缓存，支持配置选项
 * @param lifeSpan 过期时间
 * @param option 配置选项
 * @returns
 */
export function createSuspenseFetch<Response = any, Args extends any[] = any[]>(
  lifeSpan = 0,
  option: Options<any, any> = {}
): ReturnMethod<Response, Args> {
  const innerOption = { ...defaultOption, ...option }
  const cache: any = new LRU(innerOption)

  return {
    fetch: (fn: PromiseFn<Response, Args>, ...args: Args) =>
      handleSuspenseFetch({
        promiseFn: fn,
        cache: cache as any,
        args,
        lifeSpan: lifeSpan
      }) as Response,
    preload: (fn: PromiseFn<Response, Args>, ...args: Args) =>
      void handleSuspenseFetch({
        promiseFn: fn,
        cache,
        args,
        preload: true,
        lifeSpan
      }),
    clear: (...args: Args) => clearInner(cache, ...args),
    peek: (...args: Args) => {
      return cache.get(args)?.response
    }
  }
}
