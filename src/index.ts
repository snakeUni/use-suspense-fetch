import LRU, { Options } from 'lru-cache'

type Cache<Response = any, Args extends any[] = any[]> = LRU<
  string,
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
  // 使用 str
  const argsStr = JSON.stringify(args)
  const cachedValue = cache.get(argsStr)

  if (cachedValue) {
    if (preload) return
    if (cachedValue?.error) throw cachedValue.error
    if (cachedValue?.response) return cachedValue.response
    throw cachedValue?.promise
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
            if (cache.has(argsStr)) {
              cache.del(argsStr)
            }
          }, lifeSpan)
        }
      })
  }

  cache.set(argsStr, cacheValue)
  if (!preload) throw cacheValue.promise
}

/**
 * 虽然叫 use-xx 但是没有使用任何 hook
 * @param fn
 * @param args
 * @returns
 */
export default function suspenseFetch<
  Response = any,
  Args extends any[] = any[]
>(fn: PromiseFn<Response, Args>, ...args: any[]): Response {
  return handleSuspenseFetch({
    promiseFn: fn,
    cache: globalCache as any,
    args: args as Args,
    lifeSpan: suspenseFetch.lifeSpan
  }) as Response
}

// 设置 lifeSpan
suspenseFetch.lifeSpan = 0

// 导出去的其他方法，用于全局的缓存
export function refresh<Args extends any[] = any>(...args: Args) {
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
  const argsStr = JSON.stringify(args)
  return globalCache.get(argsStr)?.response
}

interface ReturnMethod<Response = any, Args extends any[] = any[]> {
  preload: (fn: PromiseFn<Response, Args>, ...args: Args) => void
  refresh: (...args: Args) => void
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
    const argsStr = JSON.stringify(args)
    if (cache.has(argsStr)) {
      cache.del(argsStr)
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
    refresh: (...args: Args) => clearInner(cache, ...args),
    peek: (...args: Args) => {
      const argsStr = JSON.stringify(args)
      return cache.get(argsStr)?.response
    }
  }
}
