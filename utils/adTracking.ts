
import {
  getCookie,
  setCookie,
} from './cookie'

import {
  splitText,
} from './dom'

import {
  pushIf,
} from './array'

import {
  PIPE_STRING,
} from './consts'

import {
  DEFAULT_SESSION_COOKIE_OPTIONS,
} from './requestResponse'

import {
  EMPTY_STRING,
} from './index'

export const metaCookiesName = '_fbc|_fbp'

export const PARAM_NAMES = document.currentScript?.getAttribute('data-parameter-names')
// export const PARAM_NAMES = 'gclid|gbraid|wbraid|gad_campaignid|gad_source|utm_source|utm_medium|utm_campaign'

export function prefixStorageKey (key: string): string {
  return `talho_${key}`
}

export function getMetaTrackingCookies (): [string, string][] {
  return splitText(metaCookiesName, PIPE_STRING).reduce((acc, name) => {
    const cookie = getCookie(name)

    if (!cookie) return acc

    return [
      ...acc,
      [ name.replace('_', EMPTY_STRING), cookie ],
    ]
  }, [] as [string, string][])
}

export function getTrackingCookies (): [string, string][] {
  const headers: [string, string][] = []

  for (const cookieName of splitText(PARAM_NAMES as string, PIPE_STRING)) {
    const cookieValue = getCookie(prefixStorageKey(cookieName))

    pushIf(
      cookieValue,
      headers,
      [cookieName, cookieValue],
    )
  }

  return headers
}

export function clearTrackingCookies (): void {
  const expires = new Date(Date.now() - 1)

  for (const name of splitText(PARAM_NAMES as string, PIPE_STRING)) {
    setCookie(prefixStorageKey(name), EMPTY_STRING, {
      ...DEFAULT_SESSION_COOKIE_OPTIONS,
      expires,
    })
  }

  for (const name of splitText(metaCookiesName, PIPE_STRING)) {
    setCookie(name, EMPTY_STRING, {
      ...DEFAULT_SESSION_COOKIE_OPTIONS,
      expires,
    })
  }
}
