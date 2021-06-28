import suspenseFetch, {
  refresh,
  peek,
  preload,
  createSuspenseFetch
} from './suspense'

export default suspenseFetch
export { refresh, peek, preload, createSuspenseFetch }

// context
export {
  SuspenseFetchProvider,
  useSuspenseFetch,
  useFetch,
  renderScriptHtml,
  REACT_USE_SUSPENSE_DATA,
  getServerInitialData
} from './context'
