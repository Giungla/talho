
import {
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
} from './requestResponse'

import {
  getMetaTrackingCookies,
} from './adTracking'

import {
  type PageViewResponse,
  type ViewContentParams,
  type InitiateCheckoutResponse,
  type AddToCartTrackingParams,
  type AddToCartTrackingResponse,
  type ViewContentResponse,
} from '../types/tracking-events'

import {
  type ResponsePattern,
  type FunctionErrorPattern,
  type ResponsePatternCallback,
  type FunctionSucceededPattern,
  type ICookieOptions,
} from '../global'

import {
  EMPTY_STRING,
  XANO_BASE_URL,
} from './consts'

import {
  getEndpointType,
} from '../types/cart'

import {
  stringify,
} from './dom'

import {
  EnumHttpMethods,
} from '../types/http'

import {
  getCookie,
  setCookie,
} from './cookie'

import {
  timestampDays,
} from './dates'

const keepalive = true
const priority: RequestPriority = 'high'

const parentScriptReference = document.currentScript

function generateFbpRandomPart (): string {
  if ('crypto' in window && crypto.getRandomValues) {
    const array = new Uint32Array(1)

    return crypto.getRandomValues(array)[0].toString()
  }

  return Math.floor(Math.random() * 4294967295).toString()
}

export function loadFacebookEvents () {
  const handleMetaCookies = (loaded: boolean) => {
    if (loaded) return

    const fbpName = '_fbp'
    const fbcName = '_fbc'

    setTimeout(() => {
      const now = Date.now()

      const currentFbp = getCookie(fbpName)

      const cookieOptions = {
        maxAge: 7776E3,
        expires: new Date(Date.now() + timestampDays(90)),
        domain: location.hostname.replace('www.', EMPTY_STRING),
      } satisfies ICookieOptions

      // Aqui o fbp será reescrito com nova validade usando o valor existente ou um novo valor seguindo os padrões da Meta
      setCookie(fbpName, currentFbp || `fb.2.${now}.${generateFbpRandomPart()}`, cookieOptions)

      const searchParams = new URLSearchParams(location.search)

      const fbclid = searchParams.get('fbclid')

      if (fbclid && fbclid.length) {
        setCookie(fbcName, `fb.2.${now}.${fbclid}`, cookieOptions)

        return
      }

      const currentFbc = getCookie(fbcName)

      if (currentFbc) {
        setCookie(fbcName, currentFbc, cookieOptions)
      }
    }, 2000)
  }

  const script = document.createElement('script')

  script.defer = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'

  script.onload  = () => handleMetaCookies(true)
  script.onerror = () => handleMetaCookies(false)

  if (parentScriptReference instanceof HTMLScriptElement) {
    parentScriptReference.insertAdjacentElement('afterend', script)

    return
  }

  document.head.appendChild(script)
}

export async function pageViewTracking <T extends PageViewResponse> (): Promise<ResponsePattern<T>> {
  const defaultErrorMessage = 'Não foi possível registrar o evento'

  try {
    const response = await fetch(`${XANO_BASE_URL}/api:uMv7xbDN/event/page_view/${getEndpointType()}`, {
      ...buildRequestOptions([
        ...getMetaTrackingCookies(),
      ]),
      priority,
      keepalive,
    })

    if (!response.ok) {
      const error = await response.json()

      return postErrorResponse.call<
        Response, [string], FunctionErrorPattern
      >(response, error)
    }

    const data: T = await response.json()

    return postSuccessResponse.call<
      Response, [T, ResponsePatternCallback?], FunctionSucceededPattern<T>
    >(response, data)
  } catch (e) {
    return postErrorResponse(defaultErrorMessage)
  }
}

export async function viewContentTracking <T extends ViewContentResponse> ({ type, payload }: ViewContentParams): Promise<ResponsePattern<T>> {
  const defaultErrorMessage = 'Não foi possível registrar o evento'

  try {
    const response = await fetch(`${XANO_BASE_URL}/api:uMv7xbDN/event/view_content/${type}/${getEndpointType()}`, {
      ...buildRequestOptions([
        ...getMetaTrackingCookies(),
      ], EnumHttpMethods.POST),
      priority,
      keepalive,
      body: stringify({
        product: payload,
      }),
    })

    if (!response.ok) {
      const error = await response.json()

      return postErrorResponse.call<
        Response, [string], FunctionErrorPattern
      >(response, error)
    }

    const data: T = await response.json()

    return postSuccessResponse.call<
      Response, [T, ResponsePatternCallback?], FunctionSucceededPattern<T>
    >(response, data)
  } catch (e) {
    return postErrorResponse(defaultErrorMessage)
  }
}

export async function initiateCheckoutTracking <T extends InitiateCheckoutResponse> (): Promise<ResponsePattern<T>> {
  const defaultErrorMessage = 'Não foi possível registrar o evento'

  try {
    const response = await fetch(`${XANO_BASE_URL}/api:uMv7xbDN/event/initiate_checkout/${getEndpointType()}`, {
      ...buildRequestOptions([
        ...getMetaTrackingCookies(),
      ]),
      priority,
      keepalive,
    })

    if (!response.ok) {
      const error = await response.json()

      return postErrorResponse.call<
        Response, [string], FunctionErrorPattern
      >(response, error)
    }

    const data: T = await response.json()

    return postSuccessResponse.call<
      Response, [T, ResponsePatternCallback?], FunctionSucceededPattern<T>
    >(response, data)
  } catch (e) {
    return postErrorResponse(defaultErrorMessage)
  }
}

export async function addToCartTracking <T extends AddToCartTrackingParams, R extends AddToCartTrackingResponse> (payload: T): Promise<ResponsePattern<R>> {
  const defaultErrorMessage = 'Não foi possível registrar o evento'

  try {
    const response = await fetch(`${XANO_BASE_URL}/api:uMv7xbDN/event/add_to_cart/${getEndpointType()}`, {
      ...buildRequestOptions([
        ...getMetaTrackingCookies(),
      ], EnumHttpMethods.POST),
      priority,
      keepalive,
      body: stringify<T>(payload),
    })

    if (!response.ok) {
      const error = await response.json()

      return postErrorResponse.call<
        Response, [string], FunctionErrorPattern
      >(response, error)
    }

    const data: R = await response.json()

    return postSuccessResponse.call<
      Response, [R, ResponsePatternCallback?], FunctionSucceededPattern<R>
    >(response, data)
  } catch (e) {
    return postErrorResponse(defaultErrorMessage)
  }
}
