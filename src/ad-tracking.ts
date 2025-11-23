
import {
  PIPE_STRING,
  PARAM_NAMES,
  DEFAULT_SESSION_COOKIE_OPTIONS,
  includes,
  splitText,
  objectSize,
  setCookie,
  isStrictEquals,
  prefixStorageKey,
} from '../utils'

(function () {
  // const PARAM_NAMES = document.currentScript?.getAttribute('data-parameter-names')
  // const PARAM_NAMES = 'gclid|gbraid|gad_campaignid|gad_source|utm_source|utm_medium|utm_campaign'

  if (!PARAM_NAMES) {
    throw new Error(`You must provide a 'data-parameter-names' parameter`)
  }

  const searchParams = splitText(PARAM_NAMES, PIPE_STRING)

  const searchParamsSize = objectSize(searchParams)

  if (isStrictEquals(searchParamsSize, 0)) return

  const URLSearch = new URLSearchParams(location.search)

  URLSearch.forEach((value, key) => {
    if (includes(searchParams, key)) {
      localStorage.setItem(
        prefixStorageKey(key),
        value,
      )
    }
  })

  function clearTrackingCookies (params: string[] = searchParams): void {
    params.forEach((value) => {
      localStorage.removeItem(prefixStorageKey(value))
    })
  }

  function getAvailableTrackingData (): Record<string, string> {
    const response: Record<string, string> = {}

    for (const param of searchParams) {
      const value = localStorage.getItem(prefixStorageKey(param))

      if (!value) continue

      response[param] = value
    }

    return response
  }

  window.addEventListener('click', () => {
    for (const param of searchParams) {
      const key = prefixStorageKey(param)

      const localStorageValue = localStorage.getItem(key)

      if (!localStorageValue) continue

      setCookie(key, localStorageValue, DEFAULT_SESSION_COOKIE_OPTIONS)

      localStorage.removeItem(key)
    }
  }, { once: true })
})()
