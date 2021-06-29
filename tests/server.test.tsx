import React, { Suspense } from 'react'
import Stream from 'stream'
import { pipeToNodeWritable } from 'react-dom/server'
import {
  renderScriptHtml,
  SuspenseFetchProvider,
  createSuspenseFetch,
  useFetch,
  useSuspenseFetch
} from '../src'

jest.useFakeTimers()

describe('server test', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  function getTestWritable() {
    const writable = new Stream.PassThrough()
    writable.setEncoding('utf8')
    const output = { result: '', error: undefined }
    writable.on('data', chunk => {
      output.result += chunk
    })
    writable.on('error', error => {
      output.error = error
    })
    const completed = new Promise((resolve: any) => {
      writable.on('finish', () => {
        resolve()
      })
      writable.on('error', () => {
        resolve()
      })
    })
    return { writable, completed, output }
  }

  const fakeData = ['react', 'react-dom']

  it('should write script html', () => {
    function Comments() {
      const response = useFetch<string[]>('react', () =>
        Promise.resolve(fakeData)
      )

      console.log('response:', response)

      return (
        <ul>
          {response.map(r => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )
    }

    const { writable, output } = getTestWritable()
    const method = createSuspenseFetch()
    const cache = method.getCache()

    const { startWriting } = pipeToNodeWritable(
      <div>
        <SuspenseFetchProvider method={method}>
          <Suspense fallback="loading">
            <Comments />
          </Suspense>
        </SuspenseFetchProvider>
      </div>,
      writable,
      {
        onCompleteAll() {
          console.log('complete', output.result)
          // const cache = method.getCache()
          // writable.write(renderScriptHtml(cache))
        }
      }
    )

    jest.runAllTimers()
    expect(output.result).toBe('')

    output.result +=
      '<!doctype html><html><head><title>test</title><head><body>'
    startWriting()
    console.log(output.result)
    // expect(output.result).toMatchInlineSnapshot(
    //   `"<!doctype html><html><head><title>test</title><head><body><div><!--$-->Done<!-- --><!--/$--></div>"`
    // )
  })
})
