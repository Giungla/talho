
import {
  getCookie,
  setCookie,
  timestampDays,
} from '../utils'

(function () {
  const PARAM_NAMES = document.currentScript?.getAttribute('data-parameter-names')
  // const PARAM_NAMES = 'gclid|gbraid|gad_campaignid|gad_source|utm_source|utm_medium|utm_campaign'

  if (!PARAM_NAMES) {
    throw new Error(`You must provide a the 'data-parameter-names' parameter`)
  }

  const searchParams = PARAM_NAMES
    .replace(/[^a-z|_]+/g, '')
    .split('|')

  const searchParamsSize = searchParams.length

  if (searchParamsSize === 0) return

  const URLSearch = new URLSearchParams(location.search)

  if (URLSearch.size === 0) return

  const hasTrackingParameterInURL = searchParams.some(param => URLSearch.has(param))

  if (hasTrackingParameterInURL) {
    clearTrackingCookies(searchParams)

    for (const param of searchParams) {
      if (!URLSearch.has(param)) continue

      setCookie(param, URLSearch.get(param) ?? '', {
        expires: new Date(Date.now() + timestampDays(90))
      })
    }
  }

  function clearTrackingCookies (params: string[] = searchParams): void {
    for (let index = 0; index < searchParamsSize; index++) {
      setCookie(params[index], '', {
        expires: new Date(Date.now() - timestampDays(1))
      })
    }
  }

  function getAvailableTrackingData (): Record<string, string> {
    const response: Record<string, string> = {}

    for (const param of searchParams) {
      const cookie = getCookie(param)

      if (!cookie) continue

      Object.defineProperty(response, param, {
        value: cookie,
        writable: true,
        enumerable: true,
        configurable: true,
      })
    }

    return response
  }

  function Giungla (): void {}

  Giungla.prototype.setCookie = setCookie
  Giungla.prototype.getCookie = getCookie
  Giungla.prototype.clearTrackingCookies = clearTrackingCookies
  Giungla.prototype.getAvailableTrackingData = getAvailableTrackingData

  // @ts-ignore
  window.Giungla = new Giungla()
})()
