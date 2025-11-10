
import {
  getCookie,
} from './cookie'

import {
  splitText,
} from './dom'

import {
  pushIf,
} from './array'

// const PARAM_NAMES = document.currentScript?.getAttribute('data-parameter-names')
export const PARAM_NAMES = 'gclid|gbraid|wbraid|gad_campaignid|gad_source|utm_source|utm_medium|utm_campaign'

export function prefixStorageKey (key: string): string {
  return `talho_${key}`
}

export function getTrackingCookies (): [string, string][] {
  const headers: [string, string][] = []

  for (const cookieName of splitText(PARAM_NAMES, '|')) {
    const cookieValue = getCookie(prefixStorageKey(cookieName))

    pushIf(
      cookieValue,
      headers,
      [cookieName, cookieValue],
    )
  }

  return headers
}
