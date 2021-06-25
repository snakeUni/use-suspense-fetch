import React, { createContext, useContext } from 'react'
import type { Options } from 'lru-cache'
import { createSuspenseFetch } from './suspense'
import type { ReturnMethod, PromiseFn } from './suspense'

const context = createContext<ReturnMethod | null>(null)

interface ProviderProps {
  children?: React.ReactNode
  lifeSpan?: number
  options?: Options<string, any>
}

export function SuspenseFetchProvider<Response = any>({
  children,
  lifeSpan = 0,
  options = {}
}: ProviderProps) {
  const method = createSuspenseFetch<Response>(lifeSpan, options)
  return <context.Provider value={method}>{children}</context.Provider>
}

export function useSuspenseFetch<Response = any>(): ReturnMethod<Response> {
  const value = useContext(context)

  return value as any
}

/**
 * 直接返回 fetch 函数，一般只会用到这个
 */
export function useFetch<Response = any>(
  key: string,
  fn: PromiseFn<Response>
): Response {
  const { fetch } = useSuspenseFetch()

  return fetch(key, fn)
}
